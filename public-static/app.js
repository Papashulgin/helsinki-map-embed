/* =====================================================================
 * Helsinki Map Embed Builder — static frontend (v2)
 * ---------------------------------------------------------------------
 * NO backend required. The kartta.hel.fi /embed/ page reads everything
 * from the URL client-side, so we build the whole embed URL in the
 * browser:
 *
 *   layers=id1,id2,...   arbitrary layer stack (comma separated;
 *                        "layer:sublayer*sublayer" for sub-layers)
 *   cs=EPSG:4326         tell the server the coords are WGS84 and let it
 *                        reproject to EPSG:3879 automatically
 *   easting / northing / resolution
 *   o=100,80,...         per-layer opacity (aligned with `layers`)
 *   minimap/maplink/maptools/leftmenu/legend/wheelzoom/allow3d/text
 *   setlanguage=fi|en|sv
 *
 * Layer catalogue comes from catalog.json (extracted once from
 * kartta.hel.fi/api-sw/settings).
 * ===================================================================== */

const $ = (id) => document.getElementById(id);
const EMBED_BASE = 'https://kartta.hel.fi/embed/';

const state = {
  baseMap: 'Karttasarja',
  selected: [],                 // [{id, title, opacity}]
  easting: 25496825,
  northing: 6673044,
  resolution: 4,
  coordMode: 'grid',            // 'grid' (EPSG:3879) | 'wgs84'
  lat: 60.1699,
  lon: 24.9384,
};

let CATALOG = null;
let TREE = [];                  // pruned tree (overlays only)
let lastUrl = '';

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  try {
    const [cat, gaz] = await Promise.all([
      fetch('catalog.json').then((r) => r.json()),
      fetch('gazetteer.json').then((r) => r.json()).catch(() => []),
    ]);
    CATALOG = cat;
    TREE = pruneTree(cat.tree);
    populateBaseMaps(cat.baseMaps);
    populatePlaces(gaz);
    renderTree(TREE);
    renderSelected();
    readUrlParams();
  } catch (e) {
    setStatus('err', 'Could not load layer catalogue: ' + e.message);
  }
}

/* ------------------------------------------------------------------ */
/*  Deep links from the gallery:  index.html?layers=id1,id2&base=...    */
/*  &e=&n=&r=&lat=&lon=                                                 */
/* ------------------------------------------------------------------ */
function readUrlParams() {
  const q = new URLSearchParams(location.search);
  const layersParam = q.get('layers') || q.get('l');
  const baseParam = q.get('base');
  let touched = false;

  if (baseParam && CATALOG.baseMaps.some((b) => b.id === baseParam)) {
    state.baseMap = baseParam;
    $('baseMap').value = baseParam;
    touched = true;
  }

  if (layersParam) {
    const ids = layersParam.split(',').map((s) => s.trim()).filter(Boolean);
    for (const id of ids) {
      // base map id?  -> select as background instead of an overlay
      const bm = CATALOG.baseMaps.find((b) => b.id === id);
      if (bm) { state.baseMap = bm.id; $('baseMap').value = bm.id; touched = true; continue; }
      const meta = CATALOG.flat.find((f) => f.id === id);
      if (meta && !state.selected.some((s) => s.id === id)) {
        state.selected.push({ id, title: meta.title, opacity: 100 });
        touched = true;
      }
    }
  }

  if (q.has('e') || q.has('easting')) state.easting = parseFloat(q.get('e') || q.get('easting')) || state.easting;
  if (q.has('n') || q.has('northing')) state.northing = parseFloat(q.get('n') || q.get('northing')) || state.northing;
  if (q.has('r') || q.has('resolution')) { state.resolution = parseFloat(q.get('r') || q.get('resolution')) || state.resolution; $('res').value = state.resolution; }
  if (q.has('lat')) state.lat = parseFloat(q.get('lat')) || state.lat;
  if (q.has('lon')) state.lon = parseFloat(q.get('lon')) || state.lon;

  if (touched) {
    syncCheckboxes();
    renderSelected();
    updateCenterInfo();
    setStatus('ok', 'Loaded ' + state.selected.length + ' layer(s) from link \u2014 tweak & generate.');
  }
}

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */
function pruneTree(nodes) {
  const out = [];
  for (const n of nodes) {
    if (n.type === 'folder') {
      const kids = pruneTree(n.children || []);
      if (kids.length) out.push({ ...n, children: kids });
    } else if (n.type === 'layer' && n.subType !== 2) {
      out.push(n);
    }
  }
  return out;
}

function countLayers(nodes) {
  let c = 0;
  for (const n of nodes) {
    if (n.type === 'folder') c += countLayers(n.children || []);
    else c++;
  }
  return c;
}

function populateBaseMaps(baseMaps) {
  const sel = $('baseMap');
  sel.innerHTML = '';
  // group by the leading word so the list is tidy
  for (const b of baseMaps) {
    const o = document.createElement('option');
    o.value = b.id;
    o.textContent = b.title + '  ·  ' + b.id;
    sel.appendChild(o);
  }
  sel.value = state.baseMap;
}

function populatePlaces(gaz) {
  const sel = $('place');
  for (const g of gaz) {
    const o = document.createElement('option');
    o.value = g.name;
    o.dataset.easting = g.easting;
    o.dataset.northing = g.northing;
    o.dataset.lat = g.lat;
    o.dataset.lon = g.lon;
    o.textContent = g.name;
    sel.appendChild(o);
  }
}

/* ------------------------------------------------------------------ */
/*  Layer tree                                                         */
/* ------------------------------------------------------------------ */
function renderTree(nodes) {
  const box = $('tree');
  box.innerHTML = '';
  if (!nodes.length) {
    box.innerHTML = '<div class="empty">No layers match.</div>';
    return;
  }
  box.appendChild(buildNodes(nodes));
}

function buildNodes(nodes) {
  const ul = document.createElement('ul');
  for (const n of nodes) {
    const li = document.createElement('li');
    if (n.type === 'folder') {
      const det = document.createElement('details');
      const sum = document.createElement('summary');
      sum.innerHTML = `${esc(n.title)} <span class="cnt">${countLayers(n.children)}</span>`;
      det.appendChild(sum);
      det.appendChild(buildNodes(n.children));
      li.appendChild(det);
    } else {
      li.appendChild(buildLeaf(n));
    }
    ul.appendChild(li);
  }
  return ul;
}

function buildLeaf(n) {
  const label = document.createElement('label');
  label.className = 'leaf';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = state.selected.some((s) => s.id === n.id);
  cb.addEventListener('change', () => toggleLayer(n, cb.checked));
  label.appendChild(cb);
  const span = document.createElement('span');
  span.textContent = n.title;
  label.appendChild(span);
  const idc = document.createElement('span');
  idc.className = 'id';
  idc.textContent = n.id;
  label.appendChild(idc);
  if (cb.checked) label.classList.add('on');
  return label;
}

function toggleLayer(n, on) {
  if (on) {
    if (!state.selected.some((s) => s.id === n.id)) {
      state.selected.push({ id: n.id, title: n.title, opacity: 100 });
    }
  } else {
    state.selected = state.selected.filter((s) => s.id !== n.id);
  }
  syncCheckboxes();
  renderSelected();
}

function syncCheckboxes() {
  document.querySelectorAll('#tree .leaf').forEach((leaf) => {
    const cb = leaf.querySelector('input');
    const id = leaf.querySelector('.id')?.textContent;
    const on = state.selected.some((s) => s.id === id);
    cb.checked = on;
    leaf.classList.toggle('on', on);
  });
}

/* ------------------------------------------------------------------ */
/*  Search                                                             */
/* ------------------------------------------------------------------ */
function runSearch(q) {
  q = q.trim().toLowerCase();
  if (!q) { renderTree(TREE); return; }
  const matches = CATALOG.flat.filter(
    (f) => f.subType !== 2 && (f.title.toLowerCase().includes(q) || f.id.toLowerCase().includes(q))
  ).slice(0, 300);
  const box = $('tree');
  box.innerHTML = '';
  if (!matches.length) { box.innerHTML = '<div class="empty">No layers match “' + esc(q) + '”.</div>'; return; }
  const ul = document.createElement('ul');
  for (const m of matches) {
    const li = document.createElement('li');
    const wrap = document.createElement('div');
    const leaf = buildLeaf({ id: m.id, title: m.title, subType: m.subType });
    wrap.appendChild(leaf);
    const path = document.createElement('div');
    path.className = 'id';
    path.style.paddingLeft = '26px';
    path.style.marginTop = '-2px';
    path.textContent = (m.path || []).join(' › ');
    li.appendChild(wrap);
    li.appendChild(path);
    ul.appendChild(li);
  }
  box.appendChild(ul);
}

/* ------------------------------------------------------------------ */
/*  Selected layer list                                                */
/* ------------------------------------------------------------------ */
function renderSelected() {
  const box = $('selList');
  $('selCount').textContent = state.selected.length;
  box.innerHTML = '';
  if (!state.selected.length) {
    box.innerHTML = '<div class="sel-empty">No extra layers selected — pick some in section 3.</div>';
    return;
  }
  state.selected.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'sel-item';

    const ord = document.createElement('div');
    ord.className = 'ord';
    const up = document.createElement('button'); up.textContent = '▲'; up.title = 'Move up';
    const dn = document.createElement('button'); dn.textContent = '▼'; dn.title = 'Move down';
    up.onclick = () => move(i, -1); dn.onclick = () => move(i, 1);
    ord.appendChild(up); ord.appendChild(dn);

    const name = document.createElement('div');
    name.className = 'name';
    name.innerHTML = esc(s.title) + '<span class="id">' + esc(s.id) + '</span>';

    const op = document.createElement('input');
    op.type = 'range'; op.min = 0; op.max = 100; op.step = 5; op.value = s.opacity;
    op.title = 'Opacity ' + s.opacity + '%';
    op.oninput = () => { s.opacity = +op.value; op.title = 'Opacity ' + s.opacity + '%'; };

    const rm = document.createElement('button');
    rm.className = 'rm'; rm.textContent = '×'; rm.title = 'Remove';
    rm.onclick = () => toggleLayer({ id: s.id }, false);

    row.appendChild(ord); row.appendChild(name); row.appendChild(op); row.appendChild(rm);
    box.appendChild(row);
  });
}

function move(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= state.selected.length) return;
  const a = state.selected;
  [a[i], a[j]] = [a[j], a[i]];
  renderSelected();
}

/* ------------------------------------------------------------------ */
/*  Events                                                             */
/* ------------------------------------------------------------------ */
function bindEvents() {
  $('place').addEventListener('change', (e) => {
    const o = e.target.selectedOptions[0];
    if (!o || !o.value) return;
    state.easting = +o.dataset.easting;
    state.northing = +o.dataset.northing;
    state.lat = +o.dataset.lat;
    state.lon = +o.dataset.lon;
    state.coordMode = 'grid';
    $('lat').value = state.lat; $('lon').value = state.lon;
    updateCenterInfo();
    setStatus('ok', 'Location set to “' + o.value + '”.');
  });

  $('applyCoords').addEventListener('click', () => {
    const lat = parseFloat($('lat').value), lon = parseFloat($('lon').value);
    if (isNaN(lat) || isNaN(lon)) { setStatus('err', 'Enter valid latitude and longitude.'); return; }
    state.lat = lat; state.lon = lon; state.coordMode = 'wgs84';
    // show the grid equivalent for reference
    try {
      const g = proj4('EPSG:4326', 'EPSG:3879', [lon, lat]);
      state.easting = g[0]; state.northing = g[1];
    } catch (e) {}
    updateCenterInfo();
    setStatus('ok', 'Location set from WGS84 coordinates.');
  });

  $('res').addEventListener('input', (e) => { state.resolution = +e.target.value; updateCenterInfo(); });
  $('baseMap').addEventListener('change', (e) => { state.baseMap = e.target.value; });
  $('layerSearch').addEventListener('input', (e) => runSearch(e.target.value));
  $('generate').addEventListener('click', generate);
  $('copy').addEventListener('click', copyCode);
  $('openUrl').addEventListener('click', () => { if (lastUrl) window.open(lastUrl, '_blank', 'noopener'); });
}

function updateCenterInfo() {
  $('centerInfo').textContent =
    'Center: ' + Math.round(state.easting) + ', ' + Math.round(state.northing) +
    ' (EPSG:3879) · zoom ' + state.resolution + ' m/px';
}

/* ------------------------------------------------------------------ */
/*  URL building                                                       */
/* ------------------------------------------------------------------ */
function buildEmbedUrl() {
  const p = new URLSearchParams();
  const ids = [];
  const ops = [];

  if (state.baseMap) { ids.push(state.baseMap); ops.push(100); }
  for (const s of state.selected) { ids.push(s.id); ops.push(s.opacity); }

  if (ids.length) p.append('layers', ids.join(','));
  if (ops.some((o) => o !== 100)) p.append('o', ops.join(','));

  if (state.coordMode === 'wgs84') {
    p.append('cs', 'EPSG:4326');
    p.append('easting', state.lon);
    p.append('northing', state.lat);
  } else {
    p.append('easting', Math.round(state.easting));
    p.append('northing', Math.round(state.northing));
  }
  p.append('resolution', state.resolution);

  if ($('minimap').checked) p.append('minimap', '1');
  if ($('maplink').checked) p.append('maplink', '1');
  if ($('maptools').checked) p.append('maptools', '1');
  if ($('leftmenu').checked) p.append('leftmenu', '1');
  if ($('legend').checked) p.append('legend', '1');
  if (!$('wheelzoom').checked) p.append('wheelzoom', '0');

  const a3d = $('allow3d').value;
  if (a3d) p.append('allow3d', a3d);

  const txt = $('text').value.trim();
  if (txt) p.append('text', encodeURIComponent(txt));

  p.append('setlanguage', $('lang').value);

  return EMBED_BASE + '?' + p.toString();
}

function buildIframe(url) {
  const w = parseInt($('w').value, 10) || 640;
  const h = parseInt($('h').value, 10) || 480;
  return `<iframe width="${w}" height="${h}" style="border:0; width:${w}px !important; height:${h}px !important;" frameborder="0" src="${url}" title="Helsinki Map Service"></iframe>`;
}

/* ------------------------------------------------------------------ */
/*  Generate                                                           */
/* ------------------------------------------------------------------ */
function generate() {
  const url = buildEmbedUrl();
  lastUrl = url;

  const frame = $('previewFrame');
  frame.innerHTML = '';
  const ifr = document.createElement('iframe');
  ifr.src = url;
  ifr.title = 'Helsinki map preview';
  frame.appendChild(ifr);

  $('code').value = buildIframe(url);

  const base = (CATALOG.baseMaps.find((b) => b.id === state.baseMap) || {}).title || state.baseMap;
  const meta = $('meta');
  meta.innerHTML = '';
  meta.appendChild(chip('Base map: ' + base));
  if (state.selected.length) meta.appendChild(chip('+ ' + state.selected.length + ' layer' + (state.selected.length > 1 ? 's' : '')));
  meta.appendChild(chip('Zoom ' + state.resolution + ' m/px'));
  meta.appendChild(chip('Center ' + Math.round(state.easting) + ', ' + Math.round(state.northing)));
  const a = document.createElement('a');
  a.className = 'chip link'; a.href = url; a.target = '_blank'; a.rel = 'noopener';
  a.textContent = 'Open embed URL ↗';
  meta.appendChild(a);

  setStatus('ok', 'Done — map generated. Copy the snippet below.');
}

function chip(t) { const s = document.createElement('span'); s.className = 'chip'; s.textContent = t; return s; }

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */
function copyCode() {
  const t = $('code');
  if (!t.value) { setStatus('err', 'Generate a map first.'); return; }
  t.select();
  navigator.clipboard.writeText(t.value).then(
    () => setStatus('ok', 'Snippet copied to clipboard.'),
    () => { document.execCommand('copy'); setStatus('ok', 'Snippet copied.'); }
  );
}

function setStatus(kind, msg) {
  const el = $('status');
  el.className = 'status show ' + (kind === 'error' ? 'err' : kind);
  el.textContent = msg;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
