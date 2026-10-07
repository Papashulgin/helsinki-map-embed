/**
 * Helsinki Map Embed Builder — backend
 * ------------------------------------------------------------------
 * Talks to the City of Helsinki map service (kartta.hel.fi, powered by
 * Louhi / SpatialWeb by Sitowise) and produces ready-to-paste embedded
 * maps. The browser cannot call the map service API directly because of
 * CORS + CSRF protection, so this small server acts as a proxy:
 *
 *   1. It opens a session with kartta.hel.fi, keeping the anti-forgery
 *      cookie and the hidden `RequestVerificationToken`.
 *   2. It forwards search / geocoding / coordinate requests.
 *   3. It stores a map "state" through POST api-sw/shorten and receives
 *      a short code back, which is what the /embed/ page consumes.
 *
 * Reverse-engineered public endpoints (no key required):
 *   GET  /api-sw/settings/uisettings        - UI settings
 *   GET  /api-sw/settings/layer/<id>        - layer definition + style
 *   POST /api-sw/search                     - address / feature search
 *   GET  /api-sw/search/autocomplete        - search suggestions
 *   GET  /api-sw/coordinates                - coordinate transform
 *   POST /api-sw/shorten  {state}           - store state -> {id}
 *   GET  /api-sw/shorten?linkId=<code>      - load state from code
 *   GET  /embed/?link=<code>&...            - the embeddable map page
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const BASE = 'https://kartta.hel.fi';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0 Safari/537.36';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------------------------------------------------ */
/*  Session management (cookies + CSRF token)                          */
/* ------------------------------------------------------------------ */

const SESSION_TTL = 8 * 60 * 1000; // refresh the token every 8 minutes
let session = { cookie: '', token: '', ts: 0 };
let sessionPromise = null;

async function openSession(force = false) {
  if (!force && session.token && Date.now() - session.ts < SESSION_TTL) {
    return session;
  }
  if (sessionPromise) return sessionPromise; // de-dupe concurrent refreshes

  sessionPromise = (async () => {
    const res = await fetch(`${BASE}/?setlanguage=en`, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    });
    const setCookies =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : [res.headers.get('set-cookie')].filter(Boolean);
    const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    const html = await res.text();
    const m =
      html.match(/id="RequestVerificationToken"[^>]*value="([^"]+)"/) ||
      html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/);
    session = { cookie, token: m ? m[1] : '', ts: Date.now() };
    return session;
  })();

  try {
    return await sessionPromise;
  } finally {
    sessionPromise = null;
  }
}

/** fetch() against kartta.hel.fi with session headers + auto token refresh */
async function apiFetch(pathname, { method = 'GET', body, retry = true } = {}) {
  const s = await openSession();
  const headers = {
    'User-Agent': UA,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: `${BASE}/?setlanguage=en`,
    Cookie: s.cookie,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (s.token) headers['X-XSRF-TOKEN'] = s.token;

  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Expired / missing anti-forgery token -> refresh once and retry.
  if ((res.status === 400 || res.status === 403) && retry) {
    await openSession(true);
    return apiFetch(pathname, { method, body, retry: false });
  }
  return res;
}

/* ------------------------------------------------------------------ */
/*  Reference data                                                     */
/* ------------------------------------------------------------------ */

// Curated base maps (layer id -> human label).
const BASE_MAPS = [
  { id: 'Karttasarja', label: 'Guide map (Karttasarja)', group: 'Guide maps' },
  { id: 'karttasarja_harmaa', label: 'Guide map, grey', group: 'Guide maps' },
  { id: 'karttasarja_pks', label: 'Guide map (metropolitan area)', group: 'Guide maps' },
  { id: 'karttasarja_pks_harmaa_wmts', label: 'Guide map, grey (metropolitan area)', group: 'Guide maps' },
  { id: 'opaskartta', label: 'Street map (Opaskartta)', group: 'Street maps' },
  { id: 'opaskartta_helsinki_harmaa', label: 'Street map, grey', group: 'Street maps' },
  { id: 'Opaskarttasarja_Helsinki', label: 'Street map set', group: 'Street maps' },
  { id: 'Opaskarttasarja_Helsinki_harmaa', label: 'Street map set, grey', group: 'Street maps' },
  { id: 'opaskartta_pks', label: 'Street map (metropolitan area)', group: 'Street maps' },
  { id: 'kantakartta', label: 'Base map (Kantakartta)', group: 'Base maps' },
  { id: 'kantakartta_harmaa', label: 'Base map, grey', group: 'Base maps' },
  { id: 'kantakartta_paakohteet', label: 'Base map, main features', group: 'Base maps' },
  { id: 'kantakartta_maastotiedot', label: 'Base map, terrain', group: 'Base maps' },
  { id: 'kantakartta_pohja', label: 'Base map, plain', group: 'Base maps' },
  { id: 'kantakartta_valkoinen', label: 'Base map, white', group: 'Base maps' },
  { id: 'kiinteistokartta', label: 'Property map (Kiinteistökartta)', group: 'Property maps' },
  { id: 'kiinteistokartta_paakohteet', label: 'Property map, main features', group: 'Property maps' },
  { id: 'kiinteistokartta_ilman_pohjakarttaa', label: 'Property map (no background)', group: 'Property maps' },
  { id: 'Ortoilmakuva_karttanimisto', label: 'Aerial photo with names', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2025_co_wmts', label: 'Aerial photo 2025', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2024', label: 'Aerial photo 2024', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2023', label: 'Aerial photo 2023', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2022', label: 'Aerial photo 2022', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2021', label: 'Aerial photo 2021', group: 'Aerial photos' },
];

// Curated overlay layers (drawn on top of the base map).
const OVERLAYS = [
  { id: 'kaupunginosat', label: 'City districts', group: 'Regional divisions' },
  { id: 'pienalueet_WFS', label: 'Small districts', group: 'Regional divisions' },
  { id: 'osaalueet_WFS', label: 'City sub-districts', group: 'Regional divisions' },
  { id: 'peruspiiri_WFS', label: 'Basic districts', group: 'Regional divisions' },
  { id: 'suurpiirit_WFS', label: 'Major districts', group: 'Regional divisions' },
  { id: 'Postinumeroalueet', label: 'Postal code areas', group: 'Regional divisions' },
  { id: 'palvelukartta_julkinen', label: 'Service map', group: 'Services' },
  { id: 'HSL_Pysakit', label: 'Public transport stops (HSL)', group: 'Transport' },
  { id: 'kiinteistot_pg', label: 'Properties', group: 'Properties' },
  { id: 'Ajantasa_asemakaava_maanpaallinen_varillinen', label: 'Detailed plan (coloured)', group: 'Planning' },
];

// Default view = central Helsinki (EPSG:3879).
const DEFAULT_VIEW = { easting: 25496825, northing: 6673044, resolution: 4 };

/* ------------------------------------------------------------------ */
/*  Layer style cache                                                  */
/* ------------------------------------------------------------------ */

const styleCache = new Map();

async function getLayerStyle(id) {
  if (styleCache.has(id)) return styleCache.get(id);
  const r = await apiFetch(`/api-sw/settings/layer/${encodeURIComponent(id)}`);
  if (!r.ok) return null;
  const d = await r.json();
  const layer = {
    type: d.type || 'vector',
    layer: d.id || id,
    opacity: 100,
  };
  if (d.style) layer.style = d.style;
  styleCache.set(id, layer);
  return layer;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function baseLayer(id) {
  return { type: 'clientraster', layer: id || 'Karttasarja', opacity: 100 };
}

function buildState({ easting, northing, resolution, layers }) {
  return {
    applications: [],
    easting: Number(easting),
    northing: Number(northing),
    resolution: Number(resolution),
    rotationS: 0,
    rotationT: 0,
    dim: false,
    names: false,
    snap: {
      pointSnap: false,
      pointSnapLength: 25,
      lineSnap: false,
      lineSnapLength: 25,
      midpointSnap: false,
      midpointSnapLength: 25,
      lineIntersectionSnap: false,
      lineIntersectionSnapLength: 25,
    },
    displayCoordinateSystemId: 'EPSG:3879',
    mapCoordinateSystemId: 'EPSG:3879',
    layers,
    linkParameters: [],
  };
}

function buildEmbedUrl(code, o = {}) {
  const p = new URLSearchParams();
  if (o.minimap) p.append('minimap', '1');
  if (o.legend) p.append('legend', '1');
  if (o.maptools) p.append('maptools', '1');
  if (o.maplink) p.append('maplink', '1');
  if (o.leftmenu) p.append('leftmenu', '1');
  if (o.wheelzoom === false) p.append('wheelzoom', '0');
  if (o.allow3d) p.append('allow3d', String(o.allow3d));
  if (o.text) p.append('text', o.text);
  p.append('setlanguage', o.language || 'fi');
  if (code) p.append('link', code);
  return `${BASE}/embed/?${p.toString()}`;
}

function buildIframe(url, width, height) {
  const w = parseInt(width, 10) || 640;
  const h = parseInt(height, 10) || 480;
  return (
    `<iframe width="${w}" height="${h}" ` +
    `style="border:0; width:${w}px !important; height:${h}px !important;" ` +
    `frameborder="0" src="${url}" title="Helsinki Map Service"></iframe>`
  );
}

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

app.get('/api/layers', (req, res) => {
  res.json({ baseMaps: BASE_MAPS, overlays: OVERLAYS, defaultView: DEFAULT_VIEW });
});

// Address / feature search
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const category = (req.query.category || 'Addresses').toString();
  const max = parseInt(req.query.max, 10) || 8;
  if (q.length < 2) return res.json({ features: [] });

  try {
    const r = await apiFetch('/api-sw/search', {
      method: 'POST',
      body: {
        search: q,
        skipfeatures: 0,
        maxfeatures: max,
        params: {},
        category,
        where: '',
        srs: 'EPSG:3879',
      },
    });
    if (!r.ok) return res.status(r.status).json({ error: 'search failed' });
    const data = await r.json();
    const features = (data.features || []).map((f) => ({
      name: f.properties.visibleName || f.properties.address_fi || 'Result',
      longName: f.properties.visibleNameLong || '',
      category: f.properties.category || category,
      type: f.properties.type || '',
      easting: f.geometry ? f.geometry.coordinates[0] : null,
      northing: f.geometry ? f.geometry.coordinates[1] : null,
    }));
    res.json({ features });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Coordinate transform (e.g. WGS84 lat/lon -> EPSG:3879)
app.get('/api/transform', async (req, res) => {
  const { x, y, source = 'EPSG:4326', target = 'EPSG:3879' } = req.query;
  if (x == null || y == null)
    return res.status(400).json({ error: 'x and y required' });
  try {
    const r = await apiFetch(
      `/api-sw/coordinates?x=${encodeURIComponent(x)}&y=${encodeURIComponent(
        y
      )}&sourceSRS=${encodeURIComponent(source)}&targetSRS=${encodeURIComponent(
        target
      )}`
    );
    if (!r.ok) return res.status(r.status).json({ error: 'transform failed' });
    const coords = await r.json(); // [easting, northing]
    res.json({ easting: coords[0], northing: coords[1] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Create an embeddable map
app.post('/api/embed', async (req, res) => {
  const b = req.body || {};
  const easting = Number(b.easting ?? DEFAULT_VIEW.easting);
  const northing = Number(b.northing ?? DEFAULT_VIEW.northing);
  const resolution = Number(b.resolution ?? DEFAULT_VIEW.resolution);

  const opts = {
    language: b.language || 'fi',
    minimap: !!b.minimap,
    legend: !!b.legend,
    maptools: !!b.maptools,
    maplink: !!b.maplink,
    leftmenu: !!b.leftmenu,
    wheelzoom: b.wheelzoom !== false,
    allow3d: b.allow3d || 0,
    text: b.text || '',
  };

  try {
    // Assemble the layer stack: base map first, then overlays.
    const layers = [baseLayer(b.baseMap || 'Karttasarja')];
    const overlayIds = Array.isArray(b.overlays) ? b.overlays : [];
    for (const id of overlayIds) {
      const layer = await getLayerStyle(id);
      if (layer) layers.push(layer);
    }

    const state = buildState({ easting, northing, resolution, layers });
    const r = await apiFetch('/api-sw/shorten', {
      method: 'POST',
      body: { state },
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'shorten failed', detail: t });
    }
    const data = await r.json();
    const code = data.id;

    const embedUrl = buildEmbedUrl(code, opts);
    const width = b.width || 640;
    const height = b.height || 480;

    res.json({
      code,
      embedUrl,
      iframe: buildIframe(embedUrl, width, height),
      fullUrl: `${BASE}/link/${code}`,
      state,
      view: { easting, northing, resolution },
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Load a stored state from a short code
app.get('/api/embed/:code', async (req, res) => {
  try {
    const r = await apiFetch(
      `/api-sw/shorten?linkId=${encodeURIComponent(req.params.code)}`
    );
    if (!r.ok) return res.status(r.status).json({ error: 'not found' });
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Helsinki Map Embed Builder running on http://localhost:${PORT}`);
});
