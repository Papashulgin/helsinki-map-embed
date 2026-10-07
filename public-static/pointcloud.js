/* =====================================================================
 * Helsinki LiDAR — 3D point-cloud viewer (three.js)
 * ---------------------------------------------------------------------
 * Loads pointcloud.bin (1,000,000 decimated RGB points, 9 bytes each)
 * produced from rgb_674495a.laz by make-pointcloud.py, and renders them
 * as a WebGL point cloud with three colour modes.
 *
 * Binary layout:  [Uint16 x,y,z]×N  then  [Uint8 r,g,b]×N
 * Local frame:    x,y in cm from origin (EPSG:3879), z in cm from -1.0 m
 * ===================================================================== */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (id) => document.getElementById(id);

let renderer, scene, camera, controls, points, geometry, grid;
let meta = null;
let rgbU8 = null;          // Uint8Array(3N) original colours
let pos16 = null;          // Uint16Array(3N) quantised positions
let N = 0;
let cz = 20;               // vertical centring offset
let zmin = 0, zmax = 1;
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
  buildCloud(buf);
  applyMode('rgb');

  $('sPoints').textContent = N.toLocaleString('en-US');
  $('sTile').textContent = meta.tile.easting.toFixed(0) + ', ' + meta.tile.northing.toFixed(0) + ' · 500 m';
  $('sZ').textContent = meta.bounds.zmin.toFixed(1) + ' … ' + meta.bounds.zmax.toFixed(1) + ' m';

  bindUI();
  setupMiniMap();

  $('loader').classList.add('hide');
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

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 9000);
  camera.position.set(0, 300, 560);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 60;
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
function buildCloud(buf) {
  N = meta.count;
  pos16 = new Uint16Array(buf, 0, 3 * N);
  rgbU8 = new Uint8Array(buf, 6 * N, 3 * N);

  const positions = new Float32Array(3 * N);
  const colors = new Float32Array(3 * N);
  const s = meta.scale;
  const oz = meta.origin.z;                 // -1.0
  const CX = 250, CY = 250;

  zmin = meta.bounds.zmin;
  zmax = meta.bounds.zmax;
  cz = (zmin + zmax) / 2;

  for (let i = 0; i < N; i++) {
    const j = i * 3;
    const lx = pos16[j] * s;                // 0 .. 500  (east)
    const ly = pos16[j + 1] * s;            // 0 .. 500  (north)
    const lz = pos16[j + 2] * s + oz;       // ~ -0.5 .. 40 (up)

    positions[j] = lx - CX;
    positions[j + 1] = lz - cz;
    positions[j + 2] = ly - CY;

    colors[j] = rgbU8[j] / 255;
    colors[j + 1] = rgbU8[j + 1] / 255;
    colors[j + 2] = rgbU8[j + 2] / 255;
  }

  geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.6,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.98,
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  // ground grid
  grid = new THREE.GridHelper(520, 26, 0x2f7aa6, 0x1c4159);
  grid.position.y = zmin - cz;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  // frame the cloud
  controls.target.set(0, 0, 0);
  camera.position.set(0, 300, 560);
  controls.update();
}

/* ------------------------------------------------------------------ */
/*  Colour modes                                                       */
/* ------------------------------------------------------------------ */
function applyMode(m) {
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
      const l = (rgbU8[j] * 0.299 + rgbU8[j + 1] * 0.587 + rgbU8[j + 2] * 0.114) / 255;
      c[j] = c[j + 1] = c[j + 2] = l;
    }
  } else if (m === 'elev') {
    const span = Math.max(0.001, zmax - zmin);
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const z = pos16[j + 2] * meta.scale + meta.origin.z;
      const t = (z - zmin) / span;
      const [r, g, b] = turbo(t);
      c[j] = r; c[j + 1] = g; c[j + 2] = b;
    }
  }
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
    camera.position.set(0, 300, 560);
    controls.target.set(0, 0, 0);
    controls.update();
  });
}

/* ------------------------------------------------------------------ */
/*  Mini map                                                           */
/* ------------------------------------------------------------------ */
function setupMiniMap() {
  const t = meta.tile;
  const cx = t.easting + t.size / 2;
  const cy = t.northing + t.size / 2;
  const res = 2.0;
  const base = 'https://kartta.hel.fi/embed/?layers=Karttasarja'
    + '&easting=' + cx + '&northing=' + cy + '&resolution=' + res
    + '&leftmenu=0&minimap=0&maplink=0&legend=0&wheelzoom=0&setlanguage=fi';
  $('mapFrame').src = base;
  $('openMap').href = 'https://kartta.hel.fi/embed/?layers=Karttasarja,kiinteistot_pg'
    + '&easting=' + cx + '&northing=' + cy + '&resolution=1&leftmenu=1&setlanguage=fi';

  // size the tile box so it matches the real 500 m footprint
  const box = document.querySelector('#map .tilebox');
  const size = () => {
    const w = document.querySelector('#map .frame').clientWidth || 300;
    const pct = Math.max(4, Math.min(100, (t.size / (w * res)) * 100));
    box.style.width = pct + '%';
    box.style.height = pct + '%';
  };
  size();
  window.addEventListener('resize', size);
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

function setProgress(p) {
  $('loadBar').style.width = Math.round(p * 100) + '%';
  $('loadMsg').textContent = 'Loading point cloud… ' + Math.round(p * 100) + '%';
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
