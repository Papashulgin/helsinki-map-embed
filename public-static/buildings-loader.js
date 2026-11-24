/* Helsinki publishes its CityGML LoD2 geometry as Cesium 3D Tiles (B3DM).
 * The map layer below resolves to this official tileset. Tree layers are
 * separate city datasets; Helsinki's semantic CityGML model is buildings + terrain.
 */
const CITYGML_BUILDING_LAYER_ID = '3D-cesium-buildings';
const CITYGML_BUILDING_TILESET_URL = 'https://kartta.hel.fi/3d/datasource-data/e5e7158a-52df-45a1-9be0-1be8f2828abd/tileset.json';
const CITYGML_MODEL_URL = 'https://kartta.hel.fi/3d/';
const BUILDING_NAMES_LAYER_ID = 'NimistoRakennukset';
const BUILDING_LAYER_IDS = Object.freeze([
  'Karttasarja',
  '3D-cesium-terrain',
  CITYGML_BUILDING_LAYER_ID,
  'HKRPTY_Puurekisteri_kp_Katupuut',
  'HKRPTY_Puurekisteri_kp_Puistopuut',
  'Ylre_katualue_osat_puu_ja_pensasryhmat',
  'Ylre_viheralue_osat_puu_ja_pensasryhmat',
  BUILDING_NAMES_LAYER_ID,
]);
const incomingMapQuery = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
function mapQueryNumber(name, fallback, min, max) {
  const value = Number(incomingMapQuery.get(name));
  return Number.isFinite(value) && value >= min && value <= max ? String(value) : fallback;
}
const BUILDING_MAP_QUERY = new URLSearchParams({
  layers: BUILDING_LAYER_IDS.join(','),
  easting: mapQueryNumber('easting', '25496825', 25400000, 25550000),
  northing: mapQueryNumber('northing', '6673044', 6650000, 6700000),
  resolution: mapQueryNumber('resolution', '1', 0.25, 64),
  allow3d: '2',
  setlanguage: 'fi',
});
const BUILDING_MAP_URL = `https://kartta.hel.fi/embed/?${BUILDING_MAP_QUERY.toString()}`;
const SEMANTIC_BUILDING_URL = CITYGML_MODEL_URL;
const CITY_HEIGHTS = Object.freeze([
  [2, 0, 3, 2, 0, 4, 3, 0, 2, 3, 0, 2],
  [0, 2, 3, 0, 2, 4, 0, 2, 3, 0, 2, 1],
  [2, 3, 0, 4, 2, 0, 3, 2, 0, 4, 1, 2],
  [3, 0, 2, 2, 0, 3, 4, 0, 2, 3, 0, 2],
  [0, 3, 2, 0, 2, 3, 0, 4, 2, 0, 3, 2],
  [2, 2, 0, 3, 4, 0, 2, 3, 0, 2, 4, 0],
  [3, 0, 2, 4, 0, 3, 2, 0, 3, 2, 0, 3],
  [0, 2, 3, 0, 2, 4, 0, 3, 2, 0, 2, 1],
  [1, 0, 2, 3, 0, 2, 3, 0, 1, 2, 0, 2],
]);

function createCityBlocks(grid = CITY_HEIGHTS) {
  const blocks = [];
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const height = Number(grid[y][x]);
      if (height > 0) blocks.push({ x, y, height, progress: (x + y * 0.63) / (grid[y].length + grid.length * 0.63) });
    }
  }
  return blocks.sort((a, b) => a.x + a.y - (b.x + b.y));
}

function projectCityPoint(x, y, z, frame) {
  return {
    x: frame.centerX + (x - y) * frame.cellWidth / 2,
    y: frame.originY + (x + y) * frame.cellDepth / 2 - z * frame.heightUnit,
  };
}

function cityObjectRows(payload) {
  if (payload?.CityObjects && typeof payload.CityObjects === 'object') {
    return Object.entries(payload.CityObjects).map(([id, object]) => ({ id, object }));
  }
  if (Array.isArray(payload?.features)) {
    return payload.features.map((object, index) => ({
      id: object.id ?? `feature-${index + 1}`,
      object,
    }));
  }
  return [];
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

function renderCityObjects(container, rows, payload) {
  container.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'cityjson-note';
    empty.textContent = 'Rajattu WFS-haku ei palauttanut rakennusobjekteja. Voit laajentaa hakusädettä.';
    container.append(empty);
    return;
  }

  for (const { id, object } of rows.slice(0, 20)) {
    const card = document.createElement('details');
    card.className = 'cityjson-feature';
    const summary = document.createElement('summary');
    const attributes = object?.attributes || object?.properties || {};
    const name = attributes.name || attributes.gmlid || attributes.gmlId || attributes.gml_id;
    summary.textContent = `${name ? `${displayValue(name)} · ` : ''}${displayValue(id)} · ${displayValue(object?.type || 'Building')}`;
    card.append(summary);

    const fields = Object.entries(attributes).slice(0, 18);
    if (fields.length) {
      const list = document.createElement('dl');
      for (const [key, value] of fields) {
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = key;
        description.textContent = displayValue(value);
        list.append(term, description);
      }
      card.append(list);
    }
    if (new URLSearchParams(location.search).get('picker') === '1') {
      const select = document.createElement('button');
      select.type = 'button';
      select.className = 'btn btn-sm';
      select.textContent = 'Valitse rakennuskorttiin';
      select.addEventListener('click', () => {
        const requestedOrigin = new URLSearchParams(location.search).get('parentOrigin') || location.origin;
        let targetOrigin = location.origin;
        try { if (new URL(requestedOrigin).origin === location.origin) targetOrigin = location.origin; } catch { /* use the local app origin */ }
        let messageObject = object;
        let messageData = {};
        if (payload?.vertices && Array.isArray(object?.geometry)) {
          const indexes = new Set();
          const collect = value => {
            if (Array.isArray(value) && value.length && value.every(Number.isInteger)) value.forEach(index => indexes.add(index));
            else if (Array.isArray(value)) value.forEach(collect);
          };
          object.geometry.forEach(geometry => collect(geometry.boundaries));
          const original = [...indexes];
          const remap = new Map(original.map((oldIndex, newIndex) => [oldIndex, newIndex]));
          const rewrite = value => {
            if (Array.isArray(value) && value.length && value.every(Number.isInteger)) return value.map(index => remap.get(index)).filter(index => index !== undefined);
            if (Array.isArray(value)) return value.map(rewrite);
            return value;
          };
          messageObject = { ...object, geometry: object.geometry.map(geometry => ({ ...geometry, boundaries: rewrite(geometry.boundaries) })) };
          messageData = { vertices: original.map(index => payload.vertices[index]), transform: payload.transform || {} };
        }
        window.opener?.postMessage({ type: 'telinehallinta.building.pick.v1', payload: { id, object: messageObject, data: messageData, crs: 'EPSG:3879' } }, targetOrigin);
        select.textContent = 'Rakennus lähetetty ✓';
      });
      card.append(select);
    }
    container.append(card);
  }

  if (rows.length > 20) {
    const more = document.createElement('p');
    more.className = 'cityjson-note';
    more.textContent = `Näytetään 20 ensimmäistä kohdetta. Lataa JSON nähdäksesi kaikki ${rows.length} kohdetta.`;
    container.append(more);
  }
}

function initCityJsonExplorer() {
  const form = document.getElementById('cityJsonForm');
  if (!form) return;

  const submit = document.getElementById('cityJsonSubmit');
  const status = document.getElementById('cityJsonStatus');
  const results = document.getElementById('cityJsonResults');
  const summary = document.getElementById('cityJsonSummary');
  const featureList = document.getElementById('cityJsonFeatures');
  const raw = document.getElementById('cityJsonRaw');
  const download = document.getElementById('cityJsonDownload');
  let latestResponse = null;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const params = new URLSearchParams({
      x: formData.get('x'),
      y: formData.get('y'),
      radius: formData.get('radius'),
      count: formData.get('count'),
    });

    submit.disabled = true;
    submit.textContent = 'Haetaan…';
    status.dataset.state = '';
    status.textContent = 'Haetaan rakennuksia Helsingin CityDB WFS -palvelimelta. Vastaus voi kestää hetken.';
    results.hidden = true;

    try {
      const response = await fetch(`/api/helsinki/cityjson/buildings?${params}`, {
        headers: { Accept: 'application/json' },
      });
      const envelope = await response.json();
      if (!response.ok) throw new Error(envelope.error || `WFS-haku epäonnistui (${response.status}).`);

      latestResponse = envelope;
      const payload = envelope.data;
      const rows = cityObjectRows(payload);
      const objectCount = payload?.CityObjects
        ? Object.keys(payload.CityObjects).length
        : rows.length;
      const actualFormat = payload?.type === 'CityJSON'
        ? `CityJSON ${payload.version || ''}`.trim()
        : envelope.format || 'JSON';
      const returnedCount = payload?.numberReturned ?? payload?.totalFeatures ?? objectCount;
      summary.textContent = `${actualFormat} · ${returnedCount} kohdetta · hakualue ${Math.round(Number(formData.get('radius')) * 2)} × ${Math.round(Number(formData.get('radius')) * 2)} m · EPSG:3879`;
      renderCityObjects(featureList, rows, payload);

      const rawText = JSON.stringify(payload, null, 2);
      raw.textContent = rawText.length > 80000
        ? `${rawText.slice(0, 80000)}\n\n… Esikatselu rajattu 80 000 merkkiin. Lataa JSON koko vastauksena.`
        : rawText;
      results.hidden = false;
      download.hidden = false;
      status.dataset.state = 'success';
      status.textContent = `Haku valmis. Rajapinta palautti ${actualFormat}-muotoista dataa.`;
    } catch (error) {
      latestResponse = null;
      download.hidden = true;
      status.dataset.state = 'error';
      status.textContent = error.message || 'Helsingin WFS-haku epäonnistui.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Hae rakennukset';
    }
  });

  download.addEventListener('click', () => {
    if (!latestResponse) return;
    const blob = new Blob([JSON.stringify(latestResponse, null, 2)], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'helsinki-cityjson-buildings.json';
    link.click();
    URL.revokeObjectURL(objectUrl);
  });
}

function initBuildingLoader() {
  const frame = document.getElementById('buildingMap');
  const stage = document.getElementById('buildingMapStage');
  const loader = document.getElementById('buildingLoader');
  const canvas = document.getElementById('buildingLoaderCanvas');
  const context = canvas.getContext('2d');
  const status = document.getElementById('buildingLoaderStatus');
  const dismiss = document.getElementById('dismissBuildingLoader');
  const blocks = createCityBlocks();
  const glyphs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ';
  const startedAt = performance.now();
  const minimumDisplayMs = 1300;
  // Helsinki's viewer emits iframe load before its 3D tiles finish streaming.
  const postFrameLoadMs = 18000;
  const fallbackDelayMs = 25000;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let columns = [];
  let animation = 0;
  let hideTimer = 0;
  let finished = false;

  function randomGlyph() {
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    columns = Array.from({ length: Math.ceil(width / 18) }, (_, index) => ({
      x: index * 18,
      y: Math.random() * height,
      speed: 1.2 + Math.random() * 2.4,
      glyphs: Array.from({ length: 7 }, randomGlyph),
    }));
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) drawScene(0, false);
  }

  function polygon(points, fill, stroke = 'rgba(92,255,151,.46)') {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) context.lineTo(points[i].x, points[i].y);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = 0.8;
    context.stroke();
  }

  function drawScene(time, animate = true) {
    if (!width || !height || finished) return;
    const background = context.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, '#06190e');
    background.addColorStop(1, '#010503');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    const rows = CITY_HEIGHTS.length;
    const cols = CITY_HEIGHTS[0].length;
    const cellWidth = Math.min(width / (cols + rows) * 1.22, height / (cols + rows) * 2.15);
    const frame = {
      centerX: width / 2,
      originY: height * 0.33,
      cellWidth,
      cellDepth: cellWidth * 0.43,
      heightUnit: cellWidth * 0.38,
    };

    context.lineWidth = 0.7;
    context.strokeStyle = 'rgba(66, 227, 119, .17)';
    for (let x = 0; x <= cols; x += 1) {
      const a = projectCityPoint(x, 0, 0, frame);
      const b = projectCityPoint(x, rows, 0, frame);
      context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
    }
    for (let y = 0; y <= rows; y += 1) {
      const a = projectCityPoint(0, y, 0, frame);
      const b = projectCityPoint(cols, y, 0, frame);
      context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
    }

    context.font = '12px ui-monospace, SFMono-Regular, Consolas, monospace';
    context.textAlign = 'center';
    for (const column of columns) {
      for (let tail = 0; tail < column.glyphs.length; tail += 1) {
        const y = column.y - tail * 13;
        if (y < 0 || y > height) continue;
        context.fillStyle = tail === 0 ? 'rgba(202,255,220,.92)' : `rgba(53,255,131,${Math.max(.08, .46 - tail * .055)})`;
        context.fillText(column.glyphs[tail], column.x, y);
      }
      if (animate) {
        column.y += column.speed;
        if (column.y - column.glyphs.length * 13 > height) {
          column.y = -Math.random() * height * .3;
          column.glyphs = Array.from({ length: 7 }, randomGlyph);
        }
      }
    }

    const sweep = animate ? (time / 4800) % 1.18 - 0.1 : 0.55;
    for (const block of blocks) {
      const left = block.x + 0.12;
      const top = block.y + 0.12;
      const right = left + 0.76;
      const bottom = top + 0.76;
      const rise = block.height * 0.54;
      const p00 = projectCityPoint(left, top, 0, frame);
      const p10 = projectCityPoint(right, top, 0, frame);
      const p11 = projectCityPoint(right, bottom, 0, frame);
      const p01 = projectCityPoint(left, bottom, 0, frame);
      const q00 = projectCityPoint(left, top, rise, frame);
      const q10 = projectCityPoint(right, top, rise, frame);
      const q11 = projectCityPoint(right, bottom, rise, frame);
      const q01 = projectCityPoint(left, bottom, rise, frame);
      const glow = animate ? Math.max(0, 1 - Math.abs(sweep - block.progress) / 0.24) : 0.35;
      const opacity = 0.45 + glow * 0.5;
      polygon([p00, p10, q10, q00], `rgba(8,${Math.round(64 + glow * 70)},${Math.round(32 + glow * 25)},${opacity})`);
      polygon([p00, p01, q01, q00], `rgba(5,${Math.round(46 + glow * 60)},${Math.round(22 + glow * 22)},${opacity})`);
      polygon([q00, q10, q11, q01], `rgba(37,${Math.round(146 + glow * 92)},${Math.round(77 + glow * 60)},${Math.min(.76, opacity)})`);
      const glyphCount = Math.min(block.height, 3);
      for (let i = 0; i < glyphCount; i += 1) {
        const center = projectCityPoint(block.x + .5, block.y + .5, rise * (.2 + i * .24), frame);
        context.fillStyle = `rgba(192,255,214,${.42 + glow * .45})`;
        context.fillText(randomGlyph(), center.x, center.y);
      }
    }

    context.textAlign = 'left';
    context.font = '700 10px ui-monospace, SFMono-Regular, Consolas, monospace';
    context.fillStyle = 'rgba(122,255,163,.8)';
    context.fillText('CITY GRID // HELSINKI · LOD2 BUILDINGS', 18, height - 18);
    if (animate) animation = requestAnimationFrame((nextTime) => drawScene(nextTime - startedAt, true));
  }

  function hideLoader() {
    if (finished) return;
    finished = true;
    clearTimeout(hideTimer);
    cancelAnimationFrame(animation);
    stage.setAttribute('aria-busy', 'false');
    loader.classList.add('is-hidden');
    loader.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => { loader.hidden = true; }, 380);
  }

  function onFrameLoad() {
    if (finished) return;
    status.textContent = '3D-näkymä avautui. Rakennusmalli viimeistelee latausta…';
    loader.classList.add('is-settling');
    const remaining = Math.max(minimumDisplayMs - (performance.now() - startedAt), postFrameLoadMs);
    window.setTimeout(hideLoader, remaining);
  }

  frame.addEventListener('load', onFrameLoad, { once: true });
  dismiss.addEventListener('click', hideLoader);
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);

  hideTimer = window.setTimeout(() => {
    if (finished) return;
    status.textContent = '3D-malli latautuu yhä — voit jatkaa karttaan tai avata sen erikseen.';
    dismiss.hidden = false;
  }, fallbackDelayMs);

  resize();
  if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    animation = requestAnimationFrame((time) => drawScene(time - startedAt, true));
  }

  document.getElementById('openBuildingMap').href = SEMANTIC_BUILDING_URL;
  frame.src = BUILDING_MAP_URL;
  document.getElementById('copyBuildingEmbed').addEventListener('click', async () => {
    const code = `<iframe width="960" height="700" style="border:0;width:100%;height:700px" src="${BUILDING_MAP_URL}" title="Helsingin 3D-rakennukset, puut ja pensasryhmät"></iframe>`;
    const result = document.getElementById('copyResult');
    try {
      await navigator.clipboard.writeText(code);
      result.textContent = 'Upotuskoodi kopioitu leikepöydälle.';
    } catch {
      result.textContent = 'Selaimen leikepöytä ei ole käytettävissä. Kopioi karttalinkki Avaa kartta erikseen -painikkeesta.';
    }
  });
}

function initBuildingsPage() {
  initBuildingLoader();
  initCityJsonExplorer();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBuildingsPage);
  else initBuildingsPage();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BUILDING_LAYER_IDS,
    BUILDING_MAP_URL,
    CITY_MODEL_WFS_URL: 'https://kartta.hel.fi/3d/citydb-wfs/wfs',
    CITYGML_BUILDING_LAYER_ID,
    CITYGML_BUILDING_TILESET_URL,
    CITYGML_MODEL_URL,
    BUILDING_NAMES_LAYER_ID,
    SEMANTIC_BUILDING_URL,
    CITY_HEIGHTS,
    createCityBlocks,
    projectCityPoint,
  };
}
