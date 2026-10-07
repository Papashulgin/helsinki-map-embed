/* =====================================================================
 * Helsinki Map Embed Builder — frontend logic
 * ---------------------------------------------------------------------
 * Talks to the local Express backend (see ../server.js), which proxies
 * kartta.hel.fi. Responsibilities:
 *   - load layer catalogue -> populate <select>s
 *   - debounced address search -> pick a result -> set map centre
 *   - WGS84 lat/lon -> EPSG:3879 transform
 *   - sync zoom (resolution) slider <-> number
 *   - build the request, POST /api/embed, render preview + snippet
 * ===================================================================== */

const $ = (id) => document.getElementById(id);

/* Current map view (EPSG:3879). */
const view = { easting: 25496825, northing: 6673044, resolution: 4 };
let catalogue = { baseMaps: [], overlays: [], defaultView: view };

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function setStatus(msg, kind = '') {
  const el = $('status');
  if (kind === 'error') kind = 'err';
  el.textContent = msg;
  el.className = 'status' + (kind ? ' ' + kind : '');
}

function setViewInfo() {
  $('viewInfo').textContent =
    `Center: ${Math.round(view.easting)}, ${Math.round(view.northing)} ` +
    `(EPSG:3879) · zoom ${view.resolution} m/px`;
}

/* Group <option>s by their `group` property. */
function fillSelect(select, items, { placeholder, selected } = {}) {
  select.innerHTML = '';
  if (placeholder !== undefined) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = placeholder;
    select.appendChild(o);
  }
  const groups = {};
  for (const it of items) {
    const g = it.group || 'Other';
    (groups[g] = groups[g] || []).push(it);
  }
  for (const [g, list] of Object.entries(groups)) {
    const og = document.createElement('optgroup');
    og.label = g;
    for (const it of list) {
      const o = document.createElement('option');
      o.value = it.id;
      o.textContent = it.label;
      if (selected && it.id === selected) o.selected = true;
      og.appendChild(o);
    }
    select.appendChild(og);
  }
}

/* ------------------------------------------------------------------ */
/*  Load catalogue                                                     */
/* ------------------------------------------------------------------ */

async function loadCatalogue() {
  try {
    const r = await fetch('/api/layers');
    catalogue = await r.json();
    if (catalogue.defaultView) Object.assign(view, catalogue.defaultView);

    fillSelect($('baseMap'), catalogue.baseMaps, { selected: 'Karttasarja' });
    fillSelect($('overlay'), catalogue.overlays, { placeholder: '— none —' });

    $('resolution').value = view.resolution;
    $('resolutionRange').value = view.resolution;
    setViewInfo();
  } catch (e) {
    setStatus('Could not load layer catalogue: ' + e, 'error');
  }
}

/* ------------------------------------------------------------------ */
/*  Address search (debounced)                                         */
/* ------------------------------------------------------------------ */

let searchTimer = null;
let searchAbort = null;

function renderResults(features) {
  const box = $('searchResults');
  box.innerHTML = '';
  if (!features.length) {
    box.classList.remove('open');
    return;
  }
  for (const f of features) {
    const div = document.createElement('div');
    div.className = 'result';
    const title = document.createElement('div');
    title.className = 'r-title';
    title.textContent = f.name || 'Result';
    const sub = document.createElement('div');
    sub.className = 'r-sub';
    sub.textContent = [f.longName, f.category].filter(Boolean).join(' · ');
    div.appendChild(title);
    div.appendChild(sub);
    div.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      pickResult(f);
    });
    box.appendChild(div);
  }
  box.classList.add('open');
}

function pickResult(f) {
  if (f.easting != null && f.northing != null) {
    view.easting = Number(f.easting);
    view.northing = Number(f.northing);
    setViewInfo();
  }
  $('searchInput').value = f.name || '';
  $('searchResults').classList.remove('open');
  setStatus(`Selected “${f.name}”. Click Generate to build the map.`);
}

async function doSearch(q) {
  if (searchAbort) searchAbort.abort();
  searchAbort = new AbortController();
  try {
    const r = await fetch(
      `/api/search?q=${encodeURIComponent(q)}&category=Addresses&max=8`,
      { signal: searchAbort.signal }
    );
    const data = await r.json();
    renderResults(data.features || []);
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('search failed', e);
  }
}

$('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  clearTimeout(searchTimer);
  if (q.length < 2) {
    $('searchResults').classList.remove('open');
    return;
  }
  searchTimer = setTimeout(() => doSearch(q), 280);
});

$('searchInput').addEventListener('blur', () => {
  // delay so a click on a result registers first
  setTimeout(() => $('searchResults').classList.remove('open'), 150);
});

/* ------------------------------------------------------------------ */
/*  Coordinate transform (WGS84 -> EPSG:3879)                          */
/* ------------------------------------------------------------------ */

$('applyCoords').addEventListener('click', async () => {
  const lat = parseFloat($('lat').value);
  const lon = parseFloat($('lon').value);
  if (!isFinite(lat) || !isFinite(lon)) {
    setStatus('Enter a valid latitude and longitude.', 'error');
    return;
  }
  setStatus('Converting coordinates…');
  try {
    const r = await fetch(
      `/api/transform?x=${lon}&y=${lat}&source=EPSG:4326&target=EPSG:3879`
    );
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    view.easting = Number(d.easting);
    view.northing = Number(d.northing);
    setViewInfo();
    setStatus('Location set from coordinates.');
  } catch (e) {
    setStatus('Coordinate conversion failed: ' + e, 'error');
  }
});

/* ------------------------------------------------------------------ */
/*  Zoom slider <-> number                                             */
/* ------------------------------------------------------------------ */

$('resolutionRange').addEventListener('input', (e) => {
  view.resolution = Number(e.target.value);
  $('resolution').value = view.resolution;
  setViewInfo();
});
$('resolution').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  if (!isFinite(v) || v <= 0) return;
  view.resolution = v;
  $('resolutionRange').value = v;
  setViewInfo();
});

/* ------------------------------------------------------------------ */
/*  Generate embed                                                     */
/* ------------------------------------------------------------------ */

function collectOptions() {
  const overlay = $('overlay').value;
  return {
    easting: view.easting,
    northing: view.northing,
    resolution: view.resolution,
    baseMap: $('baseMap').value || 'Karttasarja',
    overlays: overlay ? [overlay] : [],
    language: $('language').value,
    minimap: $('opt-minimap').checked,
    legend: $('opt-legend').checked,
    maptools: $('opt-maptools').checked,
    leftmenu: $('opt-leftmenu').checked,
    maplink: $('opt-maplink').checked,
    wheelzoom: $('opt-wheelzoom').checked,
    allow3d: Number($('allow3d').value) || 0,
    text: $('text').value.trim(),
    width: parseInt($('width').value, 10) || 640,
    height: parseInt($('height').value, 10) || 480,
  };
}

function renderPreview(url, width, height) {
  const box = $('previewFrame');
  box.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.width = width;
  iframe.height = height;
  iframe.style.border = '0';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('title', 'Helsinki Map Service');
  iframe.setAttribute('loading', 'lazy');
  box.appendChild(iframe);
}

function renderMeta(d) {
  const base = catalogue.baseMaps.find((b) => b.id === $('baseMap').value);
  const ov = catalogue.overlays.find((o) => o.id === $('overlay').value);
  const chips = [
    ['Code', d.code],
    ['Base map', base ? base.label : $('baseMap').value],
    ov ? ['Overlay', ov.label] : null,
    ['Language', $('language').value],
    ['Zoom', `${d.view.resolution} m/px`],
    ['Center', `${Math.round(d.view.easting)}, ${Math.round(d.view.northing)}`],
  ].filter(Boolean);

  const meta = $('meta');
  meta.innerHTML = '';
  for (const [k, v] of chips) {
    const c = document.createElement('span');
    c.className = 'chip';
    c.innerHTML = `<b>${k}</b> ${v}`;
    meta.appendChild(c);
  }
  const a = document.createElement('a');
  a.className = 'chip link';
  a.href = d.embedUrl;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = '↗ Open embed URL';
  meta.appendChild(a);
}

async function generate() {
  const btn = $('generateBtn');
  btn.disabled = true;
  setStatus('Building map…', 'busy');
  try {
    const r = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectOptions()),
    });
    const d = await r.json();
    if (!r.ok || d.error) throw new Error(d.error || 'request failed');

    renderPreview(d.embedUrl, collectOptions().width, collectOptions().height);
    $('embedCode').textContent = d.iframe;
    renderMeta(d);
    setStatus('Done — map generated. Copy the snippet below.', 'ok');
  } catch (e) {
    setStatus('Generation failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

$('generateBtn').addEventListener('click', generate);

/* ------------------------------------------------------------------ */
/*  Copy snippet                                                       */
/* ------------------------------------------------------------------ */

$('copyBtn').addEventListener('click', async () => {
  const text = $('embedCode').textContent;
  if (!text || text.startsWith('Your ')) return;
  try {
    await navigator.clipboard.writeText(text);
    $('copyBtn').textContent = 'Copied ✓';
    setTimeout(() => ($('copyBtn').textContent = 'Copy'), 1600);
  } catch {
    // Fallback for non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    $('copyBtn').textContent = 'Copied ✓';
    setTimeout(() => ($('copyBtn').textContent = 'Copy'), 1600);
  }
});

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */

loadCatalogue();
