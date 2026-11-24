/* =====================================================================
 * Helsinki LiDAR — 3D point-cloud viewer (three.js)
 * ---------------------------------------------------------------------
 * Loads either the built-in pointcloud.bin RGB sample or a local / Helsinki
 * map-service LAS/LAZ download and renders it as a WebGL point cloud.
 *
 * Binary layout:  [Uint16 x,y,z]×N  then  [Uint8 r,g,b]×N
 * Local frame:    x,y in cm from origin (EPSG:3879), z in cm from -1.0 m
 * ===================================================================== */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getLidarTileSelection, mapClickToCoordinates } from './lidar-tiles.mjs';

const $ = (id) => document.getElementById(id);

let renderer, scene, camera, controls, points, geometry, grid;
let meta = null;
let rgbU8 = null;          // Uint8Array(3N) source RGB colours
let intensityU16 = null;   // Uint16Array(N), when present in the LAS/LAZ
let elevations = null;     // Float32Array(N), absolute source elevations
let N = 0;
let zmin = 0, zmax = 1;
let intensityMin = 0, intensityMax = 1;
let colorAvailable = false;
let currentTile = null;
let miniMapView = null;
let loadingTile = false;
let mode = 'rgb';
let sat = 1.6;             // saturation boost for true-colour mode

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */
init().catch(fail);

async function init() {
  buildScene();

  meta = await fetch('pointcloud-meta.json').then((r) => r.json());
  const buf = await loadBin(meta.bin || 'pointcloud.bin', (p) => setProgress(p));
  installCloud(buildSampleCloud(buf));

  bindUI();
  setLoaderHidden(true);
  animate();
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */
function buildScene() {
  const app = $('app');
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  app.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 9000);
  camera.position.set(0, 300, 560);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.zoomSpeed = 0.45;
  controls.zoomToCursor = true;
  controls.minDistance = 10;
  controls.maxDistance = 3200;
  controls.maxPolarAngle = Math.PI * 0.495;   // stay above the ground
  controls.target.set(0, 0, 0);
  controls.autoRotateSpeed = 0.55;

  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ------------------------------------------------------------------ */
/*  Cloud                                                              */
/* ------------------------------------------------------------------ */
function buildSampleCloud(buf) {
  const count = meta.count;
  const packed = new Uint16Array(buf, 0, 3 * count);
  const colors = new Uint8Array(buf, 6 * count, 3 * count);
  const positions = new Float32Array(3 * count);
  const pointElevations = new Float32Array(count);
  const s = meta.scale;
  const oz = meta.origin.z;                 // -1.0
  const CX = 250, CY = 250;
  const centerElevation = (meta.bounds.zmin + meta.bounds.zmax) / 2;
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    const lx = packed[j] * s;                // 0 .. 500  (east)
    const ly = packed[j + 1] * s;            // 0 .. 500  (north)
    const lz = packed[j + 2] * s + oz;       // ~ -0.5 .. 40 (up)

    positions[j] = lx - CX;
    positions[j + 1] = lz - centerElevation;
    positions[j + 2] = ly - CY;
    pointElevations[i] = lz;
  }

  return {
    positions,
    colors,
    intensity: null,
    elevations: pointElevations,
    bounds: { xmin: 0, xmax: 500, ymin: 0, ymax: 500, zmin: meta.bounds.zmin, zmax: meta.bounds.zmax },
    tile: { ...meta.tile },
    sourceName: meta.name,
    sourceDescription: 'Helsinki RGB sample',
    crs: meta.crs,
    pointCount: count,
  };
}

function installCloud(cloud) {
  if (points) {
    scene.remove(points);
    geometry.dispose();
    points.material.dispose();
  }
  if (grid) {
    scene.remove(grid);
    grid.geometry.dispose();
    grid.material.dispose();
  }

  const positions = cloud.positions;
  N = cloud.pointCount || positions.length / 3;
  rgbU8 = cloud.colors || null;
  intensityU16 = cloud.intensity || null;
  elevations = cloud.elevations;
  colorAvailable = Boolean(rgbU8);
  zmin = cloud.bounds.zmin;
  zmax = cloud.bounds.zmax;
  currentTile = cloud.tile;

  if (intensityU16?.length) {
    intensityMin = 65535;
    intensityMax = 0;
    for (const value of intensityU16) {
      if (value < intensityMin) intensityMin = value;
      if (value > intensityMax) intensityMax = value;
    }
  } else {
    intensityMin = 0;
    intensityMax = 1;
  }

  const displayColors = new Float32Array(3 * N);
  geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(displayColors, 3));

  const material = new THREE.PointsMaterial({
    size: +$('size').value || 1.6,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.98,
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  const horizontalSpan = Math.max(cloud.bounds.xmax - cloud.bounds.xmin, cloud.bounds.ymax - cloud.bounds.ymin, 1);
  const verticalCenter = (zmin + zmax) / 2;
  const sceneScale = Math.max(horizontalSpan, zmax - zmin, 1);
  const divisions = Math.max(10, Math.min(50, Math.round(horizontalSpan / 20)));
  grid = new THREE.GridHelper(horizontalSpan * 1.05, divisions, 0x2f7aa6, 0x1c4159);
  grid.position.y = zmin - verticalCenter;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  // Frame each selected tile from its own real bounds.
  controls.target.set(0, 0, 0);
  const distance = Math.max(60, sceneScale * 1.16);
  controls.minDistance = Math.max(0.75, sceneScale * 0.003);
  controls.maxDistance = Math.max(3200, sceneScale * 8);
  camera.near = Math.max(0.1, sceneScale / 10000);
  camera.far = Math.max(9000, sceneScale * 12);
  camera.position.set(0, distance * 0.54, distance);
  camera.updateProjectionMatrix();
  controls.update();

  $('rgbMode').disabled = !colorAvailable;
  $('rgbMode').title = colorAvailable ? '' : 'This file has no RGB channel. Use elevation or intensity.';
  $('sat').disabled = !colorAvailable;
  applyMode(colorAvailable ? 'rgb' : 'elev');
  updateCloudStats(cloud);
  setupMiniMap(cloud.tile);
  setLoaderHidden(true);
}

/* ------------------------------------------------------------------ */
/*  Colour modes                                                       */
/* ------------------------------------------------------------------ */
function applyMode(m) {
  if (m === 'rgb' && !colorAvailable) m = 'gray';
  mode = m;
  const c = geometry.attributes.color.array;
  if (m === 'rgb') {
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const r = rgbU8[j] / 255, g = rgbU8[j + 1] / 255, b = rgbU8[j + 2] / 255;
      const l = r * 0.299 + g * 0.587 + b * 0.114;
      c[j] = clamp01(l + (r - l) * sat);
      c[j + 1] = clamp01(l + (g - l) * sat);
      c[j + 2] = clamp01(l + (b - l) * sat);
    }
  } else if (m === 'gray') {
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      let l;
      if (intensityU16?.length) {
        l = intensityMax > intensityMin
          ? (intensityU16[i] - intensityMin) / (intensityMax - intensityMin)
          : 0.7;
      } else if (rgbU8) {
        l = (rgbU8[j] * 0.299 + rgbU8[j + 1] * 0.587 + rgbU8[j + 2] * 0.114) / 255;
      } else {
        l = 0.7;
      }
      c[j] = c[j + 1] = c[j + 2] = l;
    }
  } else if (m === 'elev') {
    const span = Math.max(0.001, zmax - zmin);
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const t = (elevations[i] - zmin) / span;
      const [r, g, b] = turbo(t);
      c[j] = r; c[j + 1] = g; c[j + 2] = b;
    }
  }
  [...$('modes').children].forEach((button) => button.classList.toggle('on', button.dataset.m === mode));
  geometry.attributes.color.needsUpdate = true;
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

function turbo(t) {
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const stops = [
    [0.19, 0.07, 0.23],
    [0.10, 0.50, 0.85],
    [0.10, 0.80, 0.60],
    [0.95, 0.85, 0.15],
    [0.90, 0.20, 0.10],
  ];
  const s = t * (stops.length - 1);
  const i = Math.floor(s);
  const f = s - i;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/* ------------------------------------------------------------------ */
/*  UI                                                                 */
/* ------------------------------------------------------------------ */
function bindUI() {
  $('modes').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    [...$('modes').children].forEach((x) => x.classList.toggle('on', x === b));
    applyMode(b.dataset.m);
  });

  $('size').addEventListener('input', (e) => {
    const v = +e.target.value;
    $('sizeVal').textContent = v.toFixed(1);
    points.material.size = v;
  });

  $('sat').addEventListener('input', (e) => {
    sat = +e.target.value;
    $('satVal').textContent = sat.toFixed(1);
    if (mode === 'rgb') applyMode('rgb');
  });

  $('rot').addEventListener('change', (e) => { controls.autoRotate = e.target.checked; });
  $('grid').addEventListener('change', (e) => { grid.visible = e.target.checked; });

  $('reset').addEventListener('click', () => {
    const span = Math.max(currentTile?.size || 500, zmax - zmin, 1);
    const distance = Math.max(60, span * 1.16);
    camera.position.set(0, distance * 0.54, distance);
    controls.target.set(0, 0, 0);
    controls.update();
  });

  const fileInput = $('lidarFile');
  $('openLasFile').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) loadLocalLidarFile(file);
    fileInput.value = '';
  });
  $('loadDownloadUrl').addEventListener('click', loadLidarUrl);
  $('downloadUrl').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') loadLidarUrl();
  });

  $('mapSelect').addEventListener('click', (event) => {
    if (!miniMapView || loadingTile) return;
    const rect = event.currentTarget.getBoundingClientRect();
    try {
      const coordinates = mapClickToCoordinates(
        event.clientX - rect.left,
        event.clientY - rect.top,
        rect.width,
        rect.height,
        miniMapView.easting,
        miniMapView.northing,
        miniMapView.resolution,
      );
      const selection = getLidarTileSelection(coordinates.easting, coordinates.northing, $('lidarDataset').value, $('lidarYear').value);
      $('downloadUrl').value = selection.url;
      $('mapSelection').textContent = `Selected ${selection.tileId} (${selection.year}) · loading into 3D viewer…`;
      positionTileBox(selection.tile, 'Selected tile');
      loadLidarUrl();
    } catch (error) {
      $('mapSelection').textContent = error.message || String(error);
    }
  });
  $('lidarDataset').addEventListener('change', () => setupMiniMap(currentTile));

  window.addEventListener('dragover', (event) => {
    if (!event.dataTransfer?.types?.includes('Files')) return;
    event.preventDefault();
    document.body.classList.add('file-dragging');
  });
  window.addEventListener('dragleave', (event) => {
    if (event.relatedTarget) return;
    document.body.classList.remove('file-dragging');
  });
  window.addEventListener('drop', (event) => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    document.body.classList.remove('file-dragging');
    loadLocalLidarFile(event.dataTransfer.files[0]);
  });
}

/* ------------------------------------------------------------------ */
/*  Mini map                                                           */
/* ------------------------------------------------------------------ */
function setupMiniMap(t) {
  if (!t) {
    $('map').style.display = 'none';
    return;
  }
  $('map').style.display = '';
  const currentSize = Math.max(1, t.size || 500);
  const selectableSize = $('lidarDataset')?.value === 'ground' ? 2000 : 500;
  const mapSpan = selectableSize * 2;
  const cx = t.easting + currentSize / 2;
  const cy = t.northing + currentSize / 2;
  const frameWidth = document.querySelector('#map .frame').clientWidth || 300;
  const frameHeight = document.querySelector('#map .frame').clientHeight || frameWidth;
  const res = mapSpan / (frameWidth * 0.82);
  miniMapView = { easting: cx, northing: cy, resolution: res, frameWidth, frameHeight };
  const base = 'https://kartta.hel.fi/embed/?layers=Karttasarja,Laseraineisto_maanpinta,Laseraineisto_kaikki_pisteet'
    + '&easting=' + cx + '&northing=' + cy + '&resolution=' + res
    + '&leftmenu=0&minimap=0&maplink=0&legend=0&wheelzoom=0&setlanguage=fi';
  $('mapFrame').src = base;
  $('openMap').href = 'https://kartta.hel.fi/embed/?layers=Karttasarja,Laseraineisto_maanpinta,Laseraineisto_kaikki_pisteet'
    + '&easting=' + cx + '&northing=' + cy + '&resolution=' + Math.max(1, mapSpan / 250) + '&leftmenu=1&setlanguage=fi';

  positionTileBox(t, 'Loaded tile');
}

function positionTileBox(tile, label) {
  if (!tile || !miniMapView) return;
  const frame = document.querySelector('#map .frame');
  const width = frame.clientWidth || miniMapView.frameWidth;
  const height = frame.clientHeight || miniMapView.frameHeight;
  const size = Math.max(1, tile.size || 500);
  const centerEasting = tile.easting + size / 2;
  const centerNorthing = tile.northing + size / 2;
  const box = document.querySelector('#map .tilebox');
  box.style.left = `${50 + (centerEasting - miniMapView.easting) / (miniMapView.resolution * width) * 100}%`;
  box.style.top = `${50 - (centerNorthing - miniMapView.northing) / (miniMapView.resolution * height) * 100}%`;
  box.style.width = `${size / (miniMapView.resolution * width) * 100}%`;
  box.style.height = `${size / (miniMapView.resolution * height) * 100}%`;
  box.dataset.label = label;
}

function updateCloudStats(cloud) {
  const spanX = cloud.bounds.xmax - cloud.bounds.xmin;
  const spanY = cloud.bounds.ymax - cloud.bounds.ymin;
  const side = Math.max(spanX, spanY);
  const sideLabel = side >= 1000 ? `${(side / 1000).toFixed(1)} km` : `${side.toFixed(0)} m`;
  $('sPoints').textContent = N.toLocaleString('en-US');
  $('sSource').textContent = cloud.sourceName || 'LAS / LAZ';
  $('sCrs').textContent = cloud.crs || 'Not declared in file';
  $('sTile').textContent = cloud.tile
    ? `${sideLabel} · E ${cloud.tile.easting.toFixed(0)}, N ${cloud.tile.northing.toFixed(0)}`
    : `${spanX.toFixed(1)} × ${spanY.toFixed(1)} m extent`;
  $('sZ').textContent = `${zmin.toFixed(1)} … ${zmax.toFixed(1)} m`;
  $('loadStatus').textContent = `${cloud.sourceDescription || 'Point cloud loaded'} · ${N.toLocaleString('en-US')} rendered points`;
}

function inspectLasHeader(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 227) {
    throw new Error('The file is too small to contain a LAS header.');
  }
  const view = new DataView(arrayBuffer);
  if (view.getUint8(0) !== 0x4c || view.getUint8(1) !== 0x41 || view.getUint8(2) !== 0x53 || view.getUint8(3) !== 0x46) {
    throw new Error('This is not a LAS/LAZ file (the LASF signature is missing).');
  }
  const major = view.getUint8(24);
  const minor = view.getUint8(25);
  if (major !== 1 || minor > 3) {
    throw new Error(`LAS ${major}.${minor} is not supported by this viewer. It currently reads LAS/LAZ versions 1.0–1.3.`);
  }
  const pointCount = view.getUint32(107, true);
  if (!pointCount) throw new Error('The LAS header reports zero points.');
  return {
    pointCount,
    version: `${major}.${minor}`,
    pointFormat: view.getUint8(104) & 0x3f,
  };
}

function parseLidarInWorker(arrayBuffer, skip, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./lidar-worker.js', import.meta.url), { type: 'module' });
    const finish = (callback, value) => {
      worker.terminate();
      callback(value);
    };
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        onProgress(data.progress);
      } else if (data.type === 'result') {
        finish(resolve, data.mesh);
      } else if (data.type === 'error') {
        finish(reject, new Error(data.message || 'LAS/LAZ worker failed.'));
      }
    };
    worker.onerror = (event) => finish(reject, new Error(event.message || 'LAS/LAZ worker could not start.'));
    worker.onmessageerror = () => finish(reject, new Error('LAS/LAZ worker returned unreadable data.'));
    worker.postMessage({ arrayBuffer, skip }, [arrayBuffer]);
  });
}

async function buildLasCloud(mesh, sourceName, sourceDescription, knownCrs = '') {
  const attribute = mesh?.attributes?.POSITION;
  const sourcePositions = attribute?.value;
  const bounds3d = mesh?.header?.boundingBox;
  if (!sourcePositions?.length || !bounds3d || bounds3d.length < 2) {
    throw new Error('The LAS/LAZ decoder did not return point coordinates.');
  }

  const [minX, minNorthing, minZ] = bounds3d[0];
  const [maxX, maxNorthing, maxZ] = bounds3d[1];
  const centerX = (minX + maxX) / 2;
  const centerNorthing = (minNorthing + maxNorthing) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const pointCount = Math.floor(sourcePositions.length / 3);
  const positions = sourcePositions;
  const pointElevations = new Float32Array(pointCount);
  for (let i = 0; i < pointCount; i += 1) {
    const j = i * 3;
    const east = sourcePositions[j];
    const north = sourcePositions[j + 1];
    const elevation = sourcePositions[j + 2];
    positions[j] = east - centerX;
    positions[j + 1] = elevation - centerZ;
    positions[j + 2] = north - centerNorthing;
    pointElevations[i] = elevation;
    if (i > 0 && i % 100000 === 0) {
      setProgress(0.96 + (i / pointCount) * 0.02, `Preparing 3D points… ${Math.round(i / pointCount * 100)}%`);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  const colorAttribute = mesh.attributes.COLOR_0;
  let colors = null;
  if (colorAttribute?.value?.length) {
    const source = colorAttribute.value;
    const channels = colorAttribute.size || Math.floor(source.length / pointCount);
    colors = new Uint8Array(pointCount * 3);
    for (let i = 0; i < pointCount; i += 1) {
      const from = i * channels;
      const to = i * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = source[from + channel] ?? 0;
        colors[to + channel] = source instanceof Uint8Array || source instanceof Uint8ClampedArray
          ? value
          : Math.round(clamp01(value) * 255);
      }
      if (i > 0 && i % 100000 === 0) {
        setProgress(0.98, `Preparing point colours… ${Math.round(i / pointCount * 100)}%`);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    }
  }

  const spanX = maxX - minX;
  const spanY = maxNorthing - minNorthing;
  const isHelsinkiGk25 = minX >= 25000000 && maxX < 26000000 && minNorthing >= 6000000 && maxNorthing < 7000000;
  const crs = knownCrs || (isHelsinkiGk25 ? 'EPSG:3879 (Helsinki GK25)' : 'Not declared in file');
  const tile = knownCrs === 'EPSG:3879' || isHelsinkiGk25
    ? { easting: minX, northing: minNorthing, size: Math.max(spanX, spanY) }
    : null;

  return {
    positions,
    colors,
    intensity: mesh.attributes.intensity?.value || null,
    elevations: pointElevations,
    bounds: { xmin: minX, xmax: maxX, ymin: minNorthing, ymax: maxNorthing, zmin: minZ, zmax: maxZ },
    tile,
    sourceName,
    sourceDescription,
    crs,
    pointCount,
  };
}

function setLoadStatus(message, isError = false) {
  const status = $('loadStatus');
  status.textContent = message;
  status.style.color = isError ? '#ff9b9b' : '';
}

function showLoader(message) {
  $('err').style.display = 'none';
  $('loadMsg').textContent = message;
  $('loadBar').style.width = '0%';
  $('loader').classList.remove('hide');
}

function setLoaderHidden(hidden) {
  if (hidden) {
    $('loadBar').style.width = '100%';
    $('loadMsg').textContent = 'Point cloud ready';
  }
  $('loader').classList.toggle('hide', hidden);
}

async function loadLocalLidarFile(file) {
  const name = file.name || 'downloaded-lidar.laz';
  if (!/\.(las|laz)$/i.test(name)) {
    setLoadStatus('Choose a .las or .laz file downloaded from the map.', true);
    return;
  }
  if (file.size > 300 * 1024 * 1024) {
    setLoadStatus('This file exceeds the 300 MB browser-viewer limit.', true);
    return;
  }

  showLoader(`Reading ${name}…`);
  setLoadStatus(`Reading ${name} locally…`);
  try {
    const arrayBuffer = await file.arrayBuffer();
    await decodeLidar(arrayBuffer, name, 'File opened locally', '');
  } catch (error) {
    setLoaderHidden(true);
    setLoadStatus(`Could not open ${name}: ${error.message || error}`, true);
  }
}

async function loadLidarUrl() {
  if (loadingTile) return;
  let url;
  try {
    url = new URL($('downloadUrl').value.trim());
  } catch {
    setLoadStatus('Paste the full download URL from the map’s “Lataa” section.', true);
    return;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'ptp.hel.fi' || !/^\/DataHandlers\/Lidar_[^/]+\/Default\.ashx$/i.test(url.pathname)) {
    setLoadStatus('For a direct link, use a Helsinki ptp.hel.fi/DataHandlers/Lidar_… download URL.', true);
    return;
  }

  loadingTile = true;
  setLoadControlsDisabled(true);
  showLoader('Downloading the selected Helsinki tile…');
  setLoadStatus('Downloading the Helsinki LAS/LAZ tile…');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch(url.href, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Download failed (HTTP ${response.status}).`);
    const length = Number(response.headers.get('content-length') || 0);
    if (length > 300 * 1024 * 1024) throw new Error('This download exceeds the 300 MB browser-viewer limit.');
    const arrayBuffer = await readResponse(response, (progress, message) => setProgress(progress, message), length);
    if (arrayBuffer.byteLength > 300 * 1024 * 1024) throw new Error('This download exceeds the 300 MB browser-viewer limit.');
    if (!isLasFile(arrayBuffer)) {
      const message = new TextDecoder().decode(arrayBuffer).trim().slice(0, 180);
      if (/file not found|tiedostoa ei voi ladata|nonexistent file/i.test(message)) {
        throw new Error('Helsingin karttapalvelusta ei löytynyt LAS/LAZ-tiedostoa tälle ruudulle ja vuodelle.');
      }
      throw new Error('Karttapalvelu ei palauttanut LAS/LAZ-tiedostoa. Tarkista ruutu ja vuosivalinta.');
    }
    const tileId = url.searchParams.get('q') || 'selected tile';
    const year = url.searchParams.get('y');
    const fileLabel = `Helsinki tile ${tileId}${year ? ` (${year})` : ''}`;
    await decodeLidar(arrayBuffer, fileLabel, 'Loaded directly from Helsinki map download', 'EPSG:3879');
    $('mapSelection').textContent = `Loaded ${tileId}${year ? ` (${year})` : ''} · ${N.toLocaleString('en-US')} points`;
  } catch (error) {
    setLoaderHidden(true);
    const reason = error.name === 'AbortError'
      ? 'Lataus ylitti kolmen minuutin aikarajan. Kokeile ruutua uudelleen.'
      : (error.message || error);
    setLoadStatus(`Could not load this map link: ${reason}`, true);
    if ($('mapSelection')) $('mapSelection').textContent = `Lataus epäonnistui · ${reason}`;
  } finally {
    window.clearTimeout(timeout);
    loadingTile = false;
    setLoadControlsDisabled(false);
  }
}

async function decodeLidar(arrayBuffer, sourceName, sourceDescription, knownCrs) {
  const header = inspectLasHeader(arrayBuffer);
  const maxRenderedPoints = 1500000;
  const skip = Math.max(1, Math.ceil(header.pointCount / maxRenderedPoints));
  const renderedCount = Math.ceil(header.pointCount / skip);
  const downsampleNote = skip > 1 ? ` (showing every ${skip}th point)` : '';
  $('loadMsg').textContent = `Decoding ${header.pointCount.toLocaleString('en-US')} LAS ${header.version} points…`;
  setLoadStatus(`Decoding ${sourceName}: ${header.pointCount.toLocaleString('en-US')} points${downsampleNote}.`);
  setProgress(0.12, `Decoding ${header.pointCount.toLocaleString('en-US')} points…`);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const mesh = await parseLidarInWorker(arrayBuffer, skip, (fraction) => {
    if (Number.isFinite(fraction)) {
      const percent = Math.round(fraction * 100);
      setProgress(0.12 + fraction * 0.84, `Decoding LAZ… ${percent}%`);
    }
  });
  const cloud = await buildLasCloud(mesh, sourceName, sourceDescription, knownCrs);
  if (cloud.pointCount > renderedCount + skip) {
    throw new Error('The decoder returned more points than expected.');
  }
  installCloud(cloud);
}

async function readResponse(response, onProgress, declaredLength = Number(response.headers.get('content-length') || 0)) {
  const total = Number(declaredLength || 0);
  if (!response.body) {
    const result = await response.arrayBuffer();
    onProgress(0.12, `Downloaded ${formatBytes(result.byteLength)} · decoding…`);
    if (total && result.byteLength !== total) {
      throw new Error(`Lataus jäi vajaaksi (${formatBytes(result.byteLength)} / ${formatBytes(total)}).`);
    }
    return result;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (total) {
      const fraction = Math.min(1, received / total);
      onProgress(fraction * 0.12, `Downloading tile… ${Math.round(fraction * 100)}% (${formatBytes(received)} / ${formatBytes(total)})`);
    } else {
      onProgress(0.06, `Downloading tile… ${formatBytes(received)} received`);
    }
  }
  if (total && received !== total) {
    throw new Error(`Lataus jäi vajaaksi (${formatBytes(received)} / ${formatBytes(total)}).`);
  }
  const result = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}

/* ------------------------------------------------------------------ */
/*  Loading                                                            */
/* ------------------------------------------------------------------ */
async function loadBin(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' loading ' + url);
  const total = +res.headers.get('content-length') || 0;
  if (!res.body) return await res.arrayBuffer();

  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(received / total);
  }
  const out = new Uint8Array(received);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out.buffer;
}

function setProgress(progress, message) {
  if (Number.isFinite(progress)) $('loadBar').style.width = Math.round(Math.max(0, Math.min(1, progress)) * 100) + '%';
  $('loadMsg').textContent = message || ('Loading point cloud… ' + Math.round(progress * 100) + '%');
}

function setLoadControlsDisabled(disabled) {
  for (const id of ['loadDownloadUrl', 'openLasFile', 'lidarDataset', 'lidarYear', 'mapSelect']) {
    const control = $(id);
    if (control) control.disabled = disabled;
  }
}

function isLasFile(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 4) return false;
  const signature = new Uint8Array(arrayBuffer, 0, 4);
  return signature[0] === 0x4c && signature[1] === 0x41 && signature[2] === 0x53 && signature[3] === 0x46;
}

function formatBytes(value) {
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} kB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Loop + errors                                                      */
/* ------------------------------------------------------------------ */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function fail(e) {
  console.error(e);
  $('loader').classList.add('hide');
  $('err').style.display = 'flex';
  $('errMsg').textContent = (e && e.message) ? e.message : String(e);
}
