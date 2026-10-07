/* =====================================================================
 * Helsinki Map · Layers gallery
 * ---------------------------------------------------------------------
 * Renders live kartta.hel.fi embed thumbnails for every base map and
 * data layer, lazily (only when scrolled into view, with a small
 * concurrency pool so we never hammer the map server).
 *
 * Users tick layers -> they collect in the sticky tray -> "Open in
 * builder" deep-links to index.html?layers=id1,id2,...
 * ===================================================================== */

const EMBED_BASE = 'https://kartta.hel.fi/embed/';
const CENTER = { e: 25496825, n: 6673044 };   // central Helsinki, EPSG:3879
const RES_BASE = 10;      // m/px for base-map thumbs
const RES_LAYER = 12;     // m/px for overlay thumbs
const PAGE = 48;          // cards rendered per "page"

const $ = (id) => document.getElementById(id);
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let CATALOG = null;
const state = { cat: '__base__', q: '', sel: [], thumbs: true, limit: PAGE };

/* ------------------------------------------------------------------ */
/*  Thumbnail scheduler (bounded concurrency)                          */
/* ------------------------------------------------------------------ */
const MAX_CONCURRENT = 6;
let activeThumbs = 0;
const thumbQueue = [];

function thumbUrl(layers, res) {
  const p = new URLSearchParams();
  p.append('layers', layers);
  p.append('easting', CENTER.e);
  p.append('northing', CENTER.n);
  p.append('resolution', res);
  p.append('leftmenu', '0');
  p.append('minimap', '0');
  p.append('maplink', '0');
  p.append('legend', '0');
  p.append('wheelzoom', '0');
  p.append('setlanguage', 'fi');
  return EMBED_BASE + '?' + p.toString();
}

function requestThumb(card) {
  if (!state.thumbs || card._loaded || card._queued) return;
  card._queued = true;
  thumbQueue.push(card);
  pumpThumbs();
}

function pumpThumbs() {
  while (activeThumbs < MAX_CONCURRENT && thumbQueue.length) {
    const card = thumbQueue.shift();
    if (!card.isConnected || card._loaded) { card._queued = false; continue; }
    loadThumb(card);
  }
}

function loadThumb(card) {
  activeThumbs++;
  card._loaded = true;
  const thumb = card.querySelector('.thumb');
  if (!thumb) { activeThumbs--; return; }
  const ph = thumb.querySelector('.ph'); if (ph) ph.remove();
  const ifr = document.createElement('iframe');
  ifr.setAttribute('scrolling', 'no');
  ifr.setAttribute('tabindex', '-1');
  ifr.title = 'preview';
  ifr.src = card._url;
  let done = false;
  const finish = () => { if (done) return; done = true; activeThumbs = Math.max(0, activeThumbs - 1); pumpThumbs(); };
  ifr.addEventListener('load', finish);
  setTimeout(finish, 9000);
  thumb.appendChild(ifr);
}

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) requestThumb(e.target);
  }
}, { rootMargin: '300px 0px' });

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    CATALOG = await fetch('catalog.json').then((r) => r.json());
  } catch (e) {
    $('galGrid').innerHTML = '<div class="empty" style="padding:30px">Could not load catalogue: ' + esc(e.message) + '</div>';
    return;
  }
  buildTabs();
  buildFeatured();
  $('galSearch').addEventListener('input', (e) => { state.q = e.target.value.trim(); state.limit = PAGE; render(); });
  $('thumbsOn').addEventListener('change', (e) => {
    state.thumbs = e.target.checked;
    if (state.thumbs) render(); else render(); // re-render to drop/attach iframes
  });
  $('trayClear').addEventListener('click', () => { state.sel = []; render(); });
  $('trayOpen').addEventListener('click', openInBuilder);
  render();
}

/* ------------------------------------------------------------------ */
/*  Featured collections                                               */
/* ------------------------------------------------------------------ */
function buildFeatured() {
  const box = $('galFeatured');
  if (!box) return;
  const n = (cat) => CATALOG.flat.filter((f) => f.cat === cat && f.subType !== 2).length;

  const items = [
    { ico: '🧊', tt: '3D LiDAR point cloud', dd: 'Fly through a real 1M-point RGB laser scan of central Helsinki.', tag: 'interactive 3D', href: 'pointcloud.html' },
    { ico: '📡', tt: 'Laser scanning', dd: 'Laserkeilausaineistot — ground & all-return point layers.', tag: n('Laserkeilausaineistot') + ' layers', cat: 'Laserkeilausaineistot' },
    { ico: '⛰️', tt: 'Elevation models', dd: 'Digital terrain & surface models (xyz, 1×1 m, GeoTIFF).', tag: n('Korkeusmalliaineistot') + ' layers', cat: 'Korkeusmalliaineistot' },
    { ico: '🌄', tt: 'Hillshade', dd: 'Rinnevarjostukset — shaded relief from different light angles.', tag: n('Rinnevarjostukset') + ' layers', cat: 'Rinnevarjostukset' },
    { ico: '🛰️', tt: 'Aerial & ortho imagery', dd: 'Ortoilmakuva base maps and historical aerial photos.', tag: CATALOG.baseMaps.length + ' base maps', cat: '__base__' },
  ];

  box.innerHTML = '';
  for (const it of items) {
    const a = el('a', 'feat');
    a.href = it.href || '#';
    a.innerHTML =
      '<span class="ico">' + it.ico + '</span>' +
      '<span><span class="tt">' + esc(it.tt) + '</span>' +
      '<span class="dd">' + esc(it.dd) + '</span><br>' +
      '<span class="tag">' + esc(it.tag) + '</span></span>';
    if (it.cat) {
      a.href = '#';
      a.onclick = (e) => { e.preventDefault(); gotoCategory(it.cat); };
    }
    box.appendChild(a);
  }
}

function gotoCategory(cat) {
  state.cat = cat; state.q = ''; $('galSearch').value = ''; state.limit = PAGE;
  buildTabs(); render();
  document.querySelector('.gal-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */
function buildTabs() {
  const tabs = $('galTabs');
  tabs.innerHTML = '';
  const baseCount = CATALOG.baseMaps.length;
  const overlayCount = CATALOG.flat.filter((f) => f.subType !== 2).length;

  const defs = [
    { id: '__base__', label: 'Base maps', count: baseCount },
    { id: '__all__', label: 'All layers', count: overlayCount },
    ...CATALOG.tree
      .map((t) => ({
        id: t.title,
        label: t.en ? t.en : t.title,
        count: CATALOG.flat.filter((f) => f.cat === t.title && f.subType !== 2).length,
      }))
      .filter((d) => d.count > 0),   // hide search-only categories (no map layers)
  ];

  for (const d of defs) {
    const b = el('button', 'gal-tab' + (d.id === state.cat ? ' on' : ''));
    b.innerHTML = esc(d.label) + ' <span class="c">' + d.count + '</span>';
    b.onclick = () => { state.cat = d.id; state.q = ''; $('galSearch').value = ''; state.limit = PAGE; buildTabs(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    tabs.appendChild(b);
  }
}

/* ------------------------------------------------------------------ */
/*  Render                                                             */
/* ------------------------------------------------------------------ */
function currentList() {
  if (state.q) {
    const q = state.q.toLowerCase();
    return CATALOG.flat.filter((f) => f.title.toLowerCase().includes(q) || f.id.toLowerCase().includes(q));
  }
  if (state.cat === '__base__') return CATALOG.baseMaps;
  if (state.cat === '__all__') return CATALOG.flat.filter((f) => f.subType !== 2);
  return CATALOG.flat.filter((f) => f.cat === state.cat && f.subType !== 2);
}

function render() {
  const list = currentList();
  const shown = list.slice(0, state.limit);

  // title
  let title = 'Base maps';
  if (state.q) title = 'Search: “' + state.q + '”';
  else if (state.cat === '__all__') title = 'All data layers';
  else if (state.cat !== '__base__') title = state.cat;
  $('galTitle').firstChild.nodeValue = title + ' ';
  $('galSubCount').textContent = '· ' + list.length + ' layer' + (list.length === 1 ? '' : 's');

  const grid = $('galGrid');
  grid.innerHTML = '';
  io.disconnect();

  if (!list.length) { $('galEmpty').style.display = 'block'; $('galCount').textContent = '0'; return; }
  $('galEmpty').style.display = 'none';

  const frag = document.createDocumentFragment();
  for (const item of shown) frag.appendChild(buildCard(item));
  grid.appendChild(frag);

  // "load more"
  if (list.length > shown.length) {
    const more = el('div');
    more.style.cssText = 'grid-column:1/-1;text-align:center;padding:14px';
    const b = el('button', 'btn');
    b.textContent = 'Show ' + Math.min(PAGE, list.length - shown.length) + ' more of ' + (list.length - shown.length) + '…';
    b.onclick = () => { state.limit += PAGE; render(); };
    more.appendChild(b);
    grid.appendChild(more);
  }

  $('galCount').textContent = list.length + ' layers';
  renderTray();
}

function buildCard(item) {
  const isBase = item.subType === 2;
  const card = el('div', 'lcard' + (state.sel.includes(item.id) ? ' on' : ''));
  card._url = thumbUrl(isBase ? item.id : 'Karttasarja,' + item.id, isBase ? RES_BASE : RES_LAYER);

  const thumb = el('div', 'thumb');
  thumb.innerHTML = '<div class="ph">' + (state.thumbs ? '🗺️ loading preview…' : '🗺️ preview off') + '</div>';
  card.appendChild(thumb);

  const body = el('div', 'body');
  body.innerHTML =
    '<div class="cat">' + esc(isBase ? 'Base map' : (item.cat || 'Layer')) + '</div>' +
    '<h3>' + esc(item.title) + '</h3>' +
    '<div class="id">' + esc(item.id) + '</div>';

  const actions = el('div', 'row-actions');
  const addBtn = el('button', 'btn btn-sm' + (state.sel.includes(item.id) ? ' btn-primary' : ''));
  addBtn.textContent = state.sel.includes(item.id) ? '✓ Added' : (isBase ? 'Use as background' : '＋ Add layer');
  addBtn.onclick = () => { toggle(item); render(); };
  actions.appendChild(addBtn);

  const open = el('a', 'btn btn-sm');
  open.href = card._url; open.target = '_blank'; open.rel = 'noopener'; open.textContent = '↗';
  open.title = 'Open full embed in a new tab';
  actions.appendChild(open);

  body.appendChild(actions);
  card.appendChild(body);

  if (state.thumbs) io.observe(card);
  return card;
}

function toggle(item) {
  const i = state.sel.indexOf(item.id);
  if (i >= 0) state.sel.splice(i, 1);
  else state.sel.push(item.id);
}

/* ------------------------------------------------------------------ */
/*  Tray                                                               */
/* ------------------------------------------------------------------ */
function renderTray() {
  $('trayCount').textContent = state.sel.length;
  const box = $('trayChips');
  box.innerHTML = '';
  if (!state.sel.length) {
    box.innerHTML = '<span class="empty">Tick layers above to collect them here…</span>';
  } else {
    for (const id of state.sel) {
      const meta = CATALOG.flat.find((f) => f.id === id) || { title: id };
      const chip = el('span', 'tchip');
      chip.appendChild(document.createTextNode(meta.title));
      const x = el('button'); x.textContent = '×'; x.title = 'Remove';
      x.onclick = () => { state.sel = state.sel.filter((s) => s !== id); render(); };
      chip.appendChild(x);
      box.appendChild(chip);
    }
  }
  const n = state.sel.length;
  $('trayOpen').textContent = n ? 'Open in builder (' + n + ') →' : 'Open in builder →';
}

function openInBuilder() {
  if (!state.sel.length) { location.href = 'index.html'; return; }
  location.href = 'index.html?layers=' + encodeURIComponent(state.sel.join(','));
}
