/* Helsinki WMS map image loader with a Matrix-style reveal animation. */
const WMS_URL = 'https://kartta.hel.fi/ws/geoserver/avoindata/wms';
const MAP_WIDTH = 1280;
const MAP_HEIGHT = 800;
const MAP_LAYERS = Object.freeze({
  Opaskartta_Helsinki: 'Opaskartta Helsinki',
  Kantakartta: 'Kantakartta',
  Ortoilmakuva_2026_5cm: 'Ortokuva 2026',
});
const DEFAULT_CENTER = Object.freeze({ easting: 25496825, northing: 6673044 });

function getMapBounds(easting, northing, resolution, width = MAP_WIDTH, height = MAP_HEIGHT) {
  const values = [easting, northing, resolution, width, height].map(Number);
  if (values.some((value) => !Number.isFinite(value))) throw new TypeError('Karttakuvan koordinaatit ja koko pitää olla numeroita.');
  const [x, y, scale, imageWidth, imageHeight] = values;
  if (scale <= 0 || scale > 64 || imageWidth < 100 || imageHeight < 100 || imageWidth > 4096 || imageHeight > 4096) {
    throw new RangeError('Karttakuvan mittakaava tai koko ei ole sallittu.');
  }
  const halfWidth = scale * imageWidth / 2;
  const halfHeight = scale * imageHeight / 2;
  return {
    minX: x - halfWidth,
    minY: y - halfHeight,
    maxX: x + halfWidth,
    maxY: y + halfHeight,
  };
}

function buildMapImageUrl(options = {}) {
  const layer = options.layer || 'Opaskartta_Helsinki';
  if (!Object.hasOwn(MAP_LAYERS, layer)) throw new RangeError('Valitse tunnettu Helsingin WMS-karttataso.');
  const easting = Number(options.easting ?? DEFAULT_CENTER.easting);
  const northing = Number(options.northing ?? DEFAULT_CENTER.northing);
  const resolution = Number(options.resolution ?? 4);
  const width = Number(options.width ?? MAP_WIDTH);
  const height = Number(options.height ?? MAP_HEIGHT);
  const bounds = getMapBounds(easting, northing, resolution, width, height);
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.1.1',
    LAYERS: layer,
    STYLES: '',
    FORMAT: 'image/png',
    TRANSPARENT: 'false',
    SRS: 'EPSG:3879',
    BBOX: [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].map((value) => value.toFixed(2)).join(','),
    WIDTH: String(width),
    HEIGHT: String(height),
  });
  return `${WMS_URL}?${params.toString()}`;
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', initMatrixCodeRain);

function initMatrixCodeRain() {
  const query = new URLSearchParams(window.location.search);
  const embedded = query.get('embed') === '1';
  if (embedded) document.body.classList.add('embed');
  const image = document.getElementById('mapImage');
  const canvas = document.getElementById('rainCanvas');
  const context = canvas.getContext('2d', { alpha: true });
  const layerSelect = document.getElementById('mapLayer');
  const placeSelect = document.getElementById('mapPlace');
  const resolutionSelect = document.getElementById('mapResolution');
  const status = document.getElementById('mapStatus');
  const message = document.getElementById('mapMessage');
  const shell = document.getElementById('mapShell');
  const coordinates = document.getElementById('mapCoordinates');
  const openLink = document.getElementById('openMapImage');
  const markerOverlay = document.getElementById('rainMarkerOverlay');
  const chars = '012345789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ';
  const fontSize = 16;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let columns = [];
  let mode = 'idle';
  let animationId = 0;
  let requestId = 0;

  function randomChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function makeDrops() {
    const count = Math.max(1, Math.ceil(width / fontSize));
    columns = Array.from({ length: count }, (_, index) => ({
      x: index * fontSize,
      y: Math.random() * height * 1.4 - height * 0.4,
      speed: 2 + Math.random() * 4,
      glyphs: Array.from({ length: 9 }, randomChar),
      progress: -Math.random() * height * 0.45,
    }));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    makeDrops();
  }

  function paintIdleRain() {
    context.fillStyle = 'rgba(1, 7, 3, .94)';
    context.fillRect(0, 0, width, height);
    context.font = `${fontSize}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    context.textAlign = 'center';
    for (const column of columns) {
      for (let tail = 0; tail < column.glyphs.length; tail += 1) {
        const y = column.y - tail * fontSize;
        if (y < 0 || y > height) continue;
        context.fillStyle = tail === 0 ? '#c1ffd4' : `rgba(54, 255, 131, ${Math.max(.12, .92 - tail * .095)})`;
        context.fillText(column.glyphs[tail], column.x, y);
      }
      column.y += column.speed;
      if (column.y - column.glyphs.length * fontSize > height) {
        column.y = -Math.random() * height * .4;
        column.speed = 2 + Math.random() * 4;
        column.glyphs = Array.from({ length: 9 }, randomChar);
      }
    }
  }

  function paintReveal() {
    context.fillStyle = '#020805';
    context.fillRect(0, 0, width, height);
    context.font = `${fontSize}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    context.textAlign = 'center';
    let finished = true;
    for (const column of columns) {
      column.progress += column.speed * 1.65;
      const revealed = Math.max(0, Math.min(height, column.progress));
      if (revealed < height) finished = false;
      const stripWidth = Math.min(fontSize + 1, width - column.x);
      if (revealed > 0) context.clearRect(column.x, 0, stripWidth, revealed);

      for (let tail = 0; tail < 6; tail += 1) {
        const y = column.progress + tail * fontSize;
        if (y < 0 || y > height) continue;
        context.fillStyle = tail === 0 ? '#d2ffe0' : `rgba(54, 255, 131, ${Math.max(.1, .88 - tail * .13)})`;
        context.fillText(randomChar(), column.x + fontSize / 2, y);
      }
      if (column.progress < height + fontSize * 6) finished = false;
    }

    if (finished) {
      mode = 'complete';
      shell.classList.add('complete');
      status.textContent = 'KARTTA LADATTU';
      message.classList.remove('error');
      message.textContent = 'Karttakuva ladattu onnistuneesti.';
      context.clearRect(0, 0, width, height);
      return;
    }
    animationId = requestAnimationFrame(frame);
  }

  function frame() {
    if (mode === 'idle' || mode === 'loading') paintIdleRain();
    else if (mode === 'reveal') paintReveal();
    if (mode === 'idle' || mode === 'loading') animationId = requestAnimationFrame(frame);
  }

  function startIdleRain() {
    mode = 'idle';
    shell.classList.remove('complete');
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(frame);
  }

  function startReveal() {
    cancelAnimationFrame(animationId);
    shell.classList.remove('complete');
    makeDrops();
    for (const column of columns) {
      column.progress = -Math.random() * height * .2;
      column.speed = 2.2 + Math.random() * 2.2;
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      shell.classList.add('complete');
      status.textContent = 'KARTTA LADATTU';
      message.classList.remove('error');
      message.textContent = 'Karttakuva ladattu onnistuneesti.';
      mode = 'complete';
      return;
    }
    mode = 'reveal';
    status.textContent = 'PALJASTETAAN KARTTA';
    message.classList.remove('error');
    message.textContent = 'Karttakuva latautui · Matrix Code Rain purkaa näkymän.';
    animationId = requestAnimationFrame(frame);
  }

  function selectedCenter() {
    const queryEasting = Number(query.get('easting'));
    const queryNorthing = Number(query.get('northing'));
    if (embedded && Number.isFinite(queryEasting) && Number.isFinite(queryNorthing)) {
      return { easting: queryEasting, northing: queryNorthing, place: 'Valittu karttakeskus' };
    }
    const option = placeSelect.selectedOptions?.[0];
    const hasCenter = option?.dataset.easting && option?.dataset.northing;
    return hasCenter
      ? { easting: Number(option.dataset.easting), northing: Number(option.dataset.northing), place: option.textContent.trim() }
      : { ...DEFAULT_CENTER, place: 'Helsingin keskusta' };
  }

  function loadMapImage() {
    const center = selectedCenter();
    const layer = layerSelect.value;
    const queryResolution = Number(query.get('resolution'));
    const resolution = embedded && Number.isFinite(queryResolution) && queryResolution > 0 && queryResolution <= 64
      ? queryResolution
      : Number(resolutionSelect.value);
    const url = buildMapImageUrl({ ...center, layer, resolution });
    requestId += 1;
    const currentRequest = requestId;
    cancelAnimationFrame(animationId);
    shell.classList.remove('complete');
    mode = 'loading';
    status.textContent = 'LADATAAN KARTTAKUVAA';
    message.classList.remove('error');
    message.textContent = `Haetaan ${MAP_LAYERS[layer]} · ${center.place}…`;
    coordinates.textContent = `EPSG:3879 · ${center.easting.toLocaleString('fi-FI')}, ${center.northing.toLocaleString('fi-FI')}`;
    openLink.href = url;
    image.alt = `${MAP_LAYERS[layer]} · ${center.place} · Helsingin kaupungin karttakuva`;
    image.onload = () => {
      if (currentRequest !== requestId) return;
      startReveal();
    };
    image.onerror = () => {
      if (currentRequest !== requestId) return;
      mode = 'idle';
      status.textContent = 'LATAUS EPÄONNISTUI';
      message.classList.add('error');
      message.textContent = 'WMS-karttakuvaa ei saatu ladattua. Tarkista yhteys tai avaa lähdekuva suoraan.';
      animationId = requestAnimationFrame(frame);
    };
    image.src = url;
    if (embedded) void renderManagementMarkers(center, resolution);
    animationId = requestAnimationFrame(frame);
  }

  async function renderManagementMarkers(center, resolution) {
    markerOverlay.replaceChildren();
    try {
      const response = await fetch('/api/geo/management-markers', { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const payload = await response.json();
      const bounds = getMapBounds(center.easting, center.northing, resolution);
      for (const marker of payload.markers || []) {
        if (marker.easting < bounds.minX || marker.easting > bounds.maxX || marker.northing < bounds.minY || marker.northing > bounds.maxY) continue;
        const pin = document.createElement('span');
        pin.className = 'rain-management-marker';
        pin.title = marker.title + ' · EPSG:3879';
        pin.setAttribute('aria-label', pin.title);
        pin.style.left = `${(marker.easting - bounds.minX) / (bounds.maxX - bounds.minX) * 100}%`;
        pin.style.top = `${(bounds.maxY - marker.northing) / (bounds.maxY - bounds.minY) * 100}%`;
        pin.innerHTML = '<i></i><b>⌂</b><small></small>';
        pin.querySelector('small').textContent = marker.title;
        markerOverlay.append(pin);
      }
    } catch {
      markerOverlay.replaceChildren();
    }
  }

  function replay() {
    if (!image.complete || !image.naturalWidth) {
      loadMapImage();
      return;
    }
    startReveal();
  }

  document.getElementById('loadMap').addEventListener('click', loadMapImage);
  document.getElementById('replayRain').addEventListener('click', replay);
  layerSelect.addEventListener('change', loadMapImage);
  placeSelect.addEventListener('change', loadMapImage);
  resolutionSelect.addEventListener('change', loadMapImage);
  window.addEventListener('resize', resize);

  resize();
  startIdleRain();
  fetch('gazetteer.json')
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((places) => {
      for (const place of places) {
        const option = document.createElement('option');
        option.value = place.name;
        option.dataset.easting = place.easting;
        option.dataset.northing = place.northing;
        option.textContent = place.name;
        placeSelect.appendChild(option);
      }
    })
    .catch(() => {});

  loadMapImage();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_CENTER, MAP_HEIGHT, MAP_LAYERS, MAP_WIDTH, WMS_URL, buildMapImageUrl, getMapBounds };
}
