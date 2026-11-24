const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const proj4 = require('proj4');

const root = path.join(__dirname, '..');

function loadBuilder() {
  const elements = new Map();
  const document = {
    addEventListener() {},
    querySelectorAll() { return []; },
    createElement() { return { appendChild() {}, classList: { toggle() {} } }; },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { value: '', checked: false, textContent: '', appendChild() {} });
      return elements.get(id);
    },
  };

  const context = vm.createContext({
    document,
    location: { search: '' },
    URLSearchParams,
    proj4,
    window: { open() {} },
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'public-static/app.js'), 'utf8'), context);
  return { context, elements, proj4 };
}

test('WGS84 parser accepts geographic ranges and rejects invalid input', () => {
  const { context } = loadBuilder();
  assert.deepEqual(
    JSON.parse(JSON.stringify(vm.runInContext("parseWgs84Coordinates('60.1699', '24.9384')", context))),
    { lat: 60.1699, lon: 24.9384 },
  );
  for (const [lat, lon] of [['', '24.9'], ['north', '24.9'], ['91', '24.9'], ['60', '181']]) {
    assert.equal(vm.runInContext(`parseWgs84Coordinates(${JSON.stringify(lat)}, ${JSON.stringify(lon)})`, context), null);
  }
});

test('GK25FIN definition is registered and WGS84 coordinates update the grid center', () => {
  const { context } = loadBuilder();
  const definition = proj4.defs('EPSG:3879');
  assert.equal(definition.projName, 'tmerc');
  assert.ok(Math.abs(definition.long0 - (25 * Math.PI / 180)) < 1e-12);
  assert.equal(definition.x0, 25500000);
  assert.equal(definition.ellps, 'GRS80');

  assert.equal(
    vm.runInContext("setWgs84Center(parseWgs84Coordinates('60.1699', '24.9384'))", context),
    true,
  );
  assert.equal(vm.runInContext('state.coordMode', context), 'wgs84');
  assert.ok(Math.abs(vm.runInContext('state.easting', context) - 25496580.36) < 0.01);
  assert.ok(Math.abs(vm.runInContext('state.northing', context) - 6673003.61) < 0.01);
});

test('embed text is URL encoded exactly once', () => {
  const { context, elements } = loadBuilder();
  const original = 'Mannerheimintie 1 & ääkköset/%?#';
  elements.set('text', { value: '' });
  elements.set('lang', { value: 'fi' });
  elements.get('text').value = original;
  elements.get('lang').value = 'fi';

  const url = vm.runInContext('buildEmbedUrl()', context);
  assert.equal(new URL(url).searchParams.get('text'), original);
});

test('WGS84 coordinates in builder deep links are used in the generated map URL', () => {
  const { context } = loadBuilder();
  vm.runInContext(
    "CATALOG = { baseMaps: [], flat: [] }; location.search = '?lat=60.1699&lon=24.9384'; readUrlParams();",
    context,
  );
  const url = new URL(vm.runInContext('buildEmbedUrl()', context));
  assert.equal(url.searchParams.get('cs'), 'EPSG:4326');
  assert.equal(url.searchParams.get('easting'), '24.9384');
  assert.equal(url.searchParams.get('northing'), '60.1699');
});

test('3D buildings preset selects semantic building layer and starts in 3D mode', () => {
  const { context, elements } = loadBuilder();
  vm.runInContext(
    "CATALOG = { baseMaps: [{ id: 'Karttasarja', title: 'Karttasarja' }, { id: '3D-cesium-buildings', title: '3d-rakennukset' }], flat: [] }; location.search = '?preset=3d-buildings'; readUrlParams();",
    context,
  );

  assert.equal(vm.runInContext('state.baseMap', context), 'Karttasarja');
  assert.deepEqual(
    JSON.parse(JSON.stringify(vm.runInContext('state.selected.map((layer) => layer.id)', context))),
    [
      '3D-cesium-terrain',
      '3D-cesium-buildings',
      'HKRPTY_Puurekisteri_kp_Katupuut',
      'HKRPTY_Puurekisteri_kp_Puistopuut',
      'Ylre_katualue_osat_puu_ja_pensasryhmat',
      'Ylre_viheralue_osat_puu_ja_pensasryhmat',
      'NimistoRakennukset',
    ],
  );
  assert.equal(elements.get('allow3d').value, '2');
  assert.equal(vm.runInContext('state.easting', context), 25496825);
  assert.equal(vm.runInContext('state.northing', context), 6673044);
  assert.equal(vm.runInContext('state.resolution', context), 1);

  const url = new URL(vm.runInContext('buildEmbedUrl()', context));
  assert.equal(url.origin, 'https://kartta.hel.fi');
  assert.equal(url.pathname, '/embed/');
  assert.deepEqual(url.searchParams.get('layers').split(','), [
    'Karttasarja',
    '3D-cesium-terrain',
    '3D-cesium-buildings',
    'HKRPTY_Puurekisteri_kp_Katupuut',
    'HKRPTY_Puurekisteri_kp_Puistopuut',
    'Ylre_katualue_osat_puu_ja_pensasryhmat',
    'Ylre_viheralue_osat_puu_ja_pensasryhmat',
    'NimistoRakennukset',
  ]);
  assert.equal(url.searchParams.get('allow3d'), '2');
  assert.match(vm.runInContext('buildIframe(buildEmbedUrl())', context), /Helsinki 3D Buildings, Trees and Shrub Areas/);
});

test('builder deep links preserve the 2D basemap and select a following 3D buildings layer', () => {
  const { context } = loadBuilder();
  vm.runInContext(
    "CATALOG = { baseMaps: [{ id: 'Karttasarja', title: 'Karttasarja' }, { id: '3D-cesium-buildings', title: '3d-rakennukset' }], flat: [] }; location.search = '?layers=Karttasarja%2C3D-cesium-buildings&allow3d=2'; readUrlParams();",
    context,
  );

  assert.equal(vm.runInContext('state.baseMap', context), 'Karttasarja');
  assert.equal(vm.runInContext('state.selected[0].id', context), '3D-cesium-buildings');
  assert.equal(vm.runInContext("$('allow3d').value", context), '2');
});

test('gallery releases thumbnail slots on error and cancels them on rerender', () => {
  const listeners = new Map();
  const frame = {
    removed: false,
    setAttribute() {},
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
    remove() { this.removed = true; },
  };
  const thumb = {
    querySelector() { return { remove() {} }; },
    appendChild() {},
  };
  const card = {
    isConnected: true,
    _url: 'https://kartta.hel.fi/embed/',
    querySelector() { return thumb; },
  };
  const document = {
    addEventListener() {},
    createElement() { return frame; },
  };
  const context = vm.createContext({
    document,
    IntersectionObserver: class { observe() {} disconnect() {} },
    URLSearchParams,
    setTimeout,
    clearTimeout,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'public-static/gallery.js'), 'utf8'), context);
  context.card = card;

  vm.runInContext('requestThumb(card)', context);
  assert.equal(vm.runInContext('activeThumbs.size', context), 1);
  listeners.get('error')();
  assert.equal(vm.runInContext('activeThumbs.size', context), 0);

  card._loaded = false;
  vm.runInContext('requestThumb(card)', context);
  assert.equal(vm.runInContext('activeThumbs.size', context), 1);
  vm.runInContext('cancelThumbs()', context);
  assert.equal(vm.runInContext('activeThumbs.size', context), 0);
  assert.equal(vm.runInContext('thumbQueue.length', context), 0);
  assert.equal(frame.removed, true);
});

test('Matrix Code Rain requests a correctly scaled Helsinki WMS map image', () => {
  const rain = require('../public-static/matrix-coderain.js');
  const url = new URL(rain.buildMapImageUrl({
    layer: 'Opaskartta_Helsinki',
    easting: 25496825,
    northing: 6673044,
    resolution: 4,
  }));

  assert.equal(url.origin, 'https://kartta.hel.fi');
  assert.equal(url.pathname, '/ws/geoserver/avoindata/wms');
  assert.equal(url.searchParams.get('REQUEST'), 'GetMap');
  assert.equal(url.searchParams.get('LAYERS'), 'Opaskartta_Helsinki');
  assert.equal(url.searchParams.get('SRS'), 'EPSG:3879');
  assert.equal(url.searchParams.get('FORMAT'), 'image/png');
  assert.equal(url.searchParams.get('BBOX'), '25494265.00,6671444.00,25499385.00,6674644.00');
  assert.equal(url.searchParams.get('WIDTH'), '1280');
  assert.equal(url.searchParams.get('HEIGHT'), '800');
});

test('Matrix Code Rain rejects unknown layers and invalid image dimensions', () => {
  const rain = require('../public-static/matrix-coderain.js');
  assert.throws(() => rain.buildMapImageUrl({ layer: 'not-a-city-layer' }), /tunnettu/);
  assert.throws(() => rain.buildMapImageUrl({ resolution: 0 }), /mittakaava/);
  assert.throws(() => rain.getMapBounds(1, 2, 4, 5000, 800), /mittakaava/);
});

test('Matrix Code Rain page is reachable from the map builder and loads its viewer script', () => {
  const builder = fs.readFileSync(path.join(root, 'public-static/index.html'), 'utf8');
  const page = fs.readFileSync(path.join(root, 'public-static/matrix-coderain.html'), 'utf8');
  assert.match(builder, /href="matrix-coderain\.html"/);
  assert.match(page, /id="loadMap"/);
  assert.match(page, /src="matrix-coderain\.js"/);
  assert.match(page, /avoindata\/wms/);
});

test('LiDAR viewer opens downloaded LAS/LAZ tiles and direct Helsinki map download links', () => {
  const builder = fs.readFileSync(path.join(root, 'public-static/index.html'), 'utf8');
  const page = fs.readFileSync(path.join(root, 'public-static/pointcloud.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'public-static/pointcloud.js'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'public-static/lidar-worker.js'), 'utf8');
  const bundlePath = path.join(root, 'public-static/vendor/lidar-loader.mjs');
  const wasmPath = path.join(root, 'public-static/vendor/laz_rs_wasm_bg.wasm');

  assert.match(builder, /href="pointcloud\.html">3D LAS \/ LAZ point-cloud viewer/);
  assert.match(page, /id="lidarFile" type="file" accept="\.las,\.laz/);
  assert.match(page, /id="downloadUrl"/);
  assert.match(page, /q=674494x2&amp;y=2021/);
  assert.match(script, /parseLidarInWorker/);
  assert.match(worker, /parseLidarFile/);
  assert.match(worker, /type: 'progress'/);
  assert.match(script, /loadLocalLidarFile/);
  assert.match(script, /loadLidarUrl/);
  assert.match(script, /getLidarTileSelection\(coordinates.easting, coordinates.northing/);
  assert.match(script, /controls\.zoomSpeed = 0\.45/);
  assert.match(script, /controls\.zoomToCursor = true/);
  assert.match(script, /sceneScale \* 0\.003/);
  assert.match(page, /id="mapSelect"/);
  assert.match(page, /id="lidarDataset"/);
  assert.match(script, /maxRenderedPoints = 1500000/);
  assert.match(script, /applyMode\(colorAvailable \? 'rgb' : 'elev'\)/);
  assert.match(script, /\$\('sat'\)\.disabled = !colorAvailable/);
  assert.ok(fs.statSync(bundlePath).size > 0);
  assert.ok(fs.statSync(wasmPath).size > 0);
});

test('LiDAR map clicks build the matching Helsinki ground and all-points download links', async () => {
  const { getLidarTileSelection, getLidarTileUrl, mapClickToCoordinates } = await import('../public-static/lidar-tiles.mjs');
  assert.equal(
    getLidarTileUrl(25496825, 6673044, 'ground', '2021'),
    'https://ptp.hel.fi/DataHandlers/Lidar_maanpinta/Default.ashx?q=672496x2&y=2021',
  );
  assert.equal(
    getLidarTileUrl(25495250, 6674250, 'ground', '2021'),
    'https://ptp.hel.fi/DataHandlers/Lidar_maanpinta/Default.ashx?q=674494x2&y=2021',
  );
  assert.equal(
    getLidarTileUrl(25496825, 6673044, 'all', '2021'),
    'https://ptp.hel.fi/DataHandlers/Lidar_kaikki/Default.ashx?q=673496c&y=2021',
  );
  assert.equal(
    getLidarTileUrl(25498465, 6674284, 'all', '2021'),
    'https://ptp.hel.fi/DataHandlers/Lidar_kaikki/Default.ashx?q=674498a&y=2021',
  );
  const adjacentAllPointsTile = getLidarTileSelection(25500250, 6674250, 'all', '2021');
  assert.equal(adjacentAllPointsTile.tileId, '674500a');
  assert.deepEqual(adjacentAllPointsTile.tile, { easting: 25500000, northing: 6674000, size: 500 });
  const adjacentGroundTile = getLidarTileSelection(25500250, 6674250, 'ground', '2021');
  assert.equal(adjacentGroundTile.tileId, '674500x2');
  assert.deepEqual(adjacentGroundTile.tile, { easting: 25500000, northing: 6674000, size: 2000 });
  const mapCenter = { easting: 25495250, northing: 6674250 };
  const allPointsResolution = 1000 / (300 * 0.82);
  const allPointsClick = mapClickToCoordinates(220, 150, 300, 300, mapCenter.easting, mapCenter.northing, allPointsResolution);
  assert.equal(getLidarTileSelection(allPointsClick.easting, allPointsClick.northing, 'all', '2021').tileId, '674495c');
  const groundResolution = 4000 / (300 * 0.82);
  const groundClick = mapClickToCoordinates(200, 150, 300, 300, mapCenter.easting, mapCenter.northing, groundResolution);
  assert.equal(getLidarTileSelection(groundClick.easting, groundClick.northing, 'ground', '2021').tileId, '674496x2');
  assert.throws(() => mapClickToCoordinates(100, 100, 0, 300, 0, 0, 1), /koordinaatit/);
  assert.throws(() => getLidarTileUrl(25560000, 6670000), /Helsingin alueella/);
});

test('Express startup opens the local workspace and keeps GIS and legacy pages available', async (t) => {
  const entry = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(entry, /const PORT = process\.env\.PORT \|\| 3400/);
  const app = require('../server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const origin = `http://127.0.0.1:${server.address().port}`;
  const paths = ['/', '/app', '/workspace.css', '/workspace.js', '/index.html', '/buildings.html', '/buildings-loader.js', '/matrix-coderain.html', '/matrix-coderain.js', '/gallery.html', '/pointcloud.html', '/pointcloud.js', '/lidar-worker.js', '/lidar-tiles.mjs', '/vendor/lidar-loader.mjs', '/vendor/laz_rs_wasm_bg.wasm', '/pointcloud-meta.json', '/example.html', '/api/layers'];
  const request = (pathname) => new Promise((resolve, reject) => {
    http.get(origin + pathname, { agent: false }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
  const responses = await Promise.all(paths.map(request));
  for (let i = 0; i < responses.length; i += 1) assert.equal(responses[i].status, 200, `${paths[i]} should be served`);

  assert.match(responses[0].body.toString(), /Telinekonttori/);
  assert.match(responses[0].body.toString(), /workspace\.js/);
  assert.match(responses[1].body.toString(), /Telinekonttori/);
  assert.match(responses[2].body.toString(), /\.sidebar/);
  assert.match(responses[3].body.toString(), /Sää ja aika/);
  assert.match(responses[4].body.toString(), /Helsinki Map Embed Builder/);
  assert.match(responses[5].body.toString(), /CityGML LoD2/);
  assert.match(responses[6].body.toString(), /CITYGML_BUILDING_TILESET_URL/);
  assert.match(responses[7].body.toString(), /id="loadMap"/);
  assert.match(responses[8].body.toString(), /buildMapImageUrl/);
  assert.match(responses[9].body.toString(), /layers gallery/i);
  assert.match(responses[10].body.toString(), /id="lidarFile"/);
  assert.match(responses[11].body.toString(), /parseLidarInWorker/);
  assert.match(responses[12].body.toString(), /parseLidarFile/);
  assert.match(responses[13].body.toString(), /getLidarTileUrl/);
  assert.match(responses[14].body.toString(), /laz_rs_wasm_bg/);
  assert.ok(responses[15].body.byteLength > 0);
  assert.match(responses[16].body.toString(), /"count"/);
  assert.match(responses[17].body.toString(), /example/i);
  assert.ok(JSON.parse(responses[18].body.toString()).baseMaps.length > 0);
});

test('local workspace includes all copied app sections and connects the Helsinki GIS tools', () => {
  const page = fs.readFileSync(path.join(root, 'public-static/workspace.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'public-static/workspace.js'), 'utf8');
  assert.match(script, /data-page="\$\{page\}"/);
  assert.match(page, /Karttarakentaja/);
  assert.match(page, /3D-rakennukset/);
  assert.match(page, /LiDAR-pistepilvi/);
  for (const section of ['mobile', 'tasks', 'calendar', 'time', 'profile', 'certificates', 'weather', 'settings']) {
    assert.match(script, new RegExp(`${section}:`));
  }
  assert.match(script, /kartta\.hel\.fi\/embed/);
  assert.match(script, /layers=Karttasarja/);
  assert.match(script, /localStorage/);
  assert.match(script, /matrix-coderain\.html/);
  const svgExport = script.match(/async function exportScaffoldSvg\(\)\s*\{([\s\S]*?)\n  \}/);
  assert.ok(svgExport, 'SVG drawing export handler should exist');
  assert.match(svgExport[1], /persistGeneratedScaffoldFile/);
});

test('Hilma OSINT bridge keeps CPV codes when importing an opportunity into CRM', () => {
  const workspaceScript = fs.readFileSync(path.join(root, 'public-static/workspace.js'), 'utf8');
  const osintScript = fs.readFileSync(path.join(root, '..', 'scaffold-osint-clone', 'app.js'), 'utf8');
  assert.match(osintScript, /cpvCodes:button\.dataset\.cpv/);
  assert.match(workspaceScript, /safePayload\.cpvCodes = String\(payload\.cpvCodes \|\| payload\.cpv \|\| ''\)/);
});

test('3D buildings loader creates an isometric city grid with stable projected building points', () => {
  const city = require('../public-static/buildings-loader.js');
  const blocks = city.createCityBlocks();
  assert.ok(blocks.length > 60);
  assert.ok(blocks.every((block) => block.height > 0 && block.x >= 0 && block.y >= 0));

  const frame = { centerX: 100, originY: 50, cellWidth: 20, cellDepth: 10, heightUnit: 8 };
  assert.deepEqual(city.projectCityPoint(0, 0, 0, frame), { x: 100, y: 50 });
  assert.deepEqual(city.projectCityPoint(1, 0, 0, frame), { x: 110, y: 55 });
  assert.deepEqual(city.projectCityPoint(0, 1, 0, frame), { x: 90, y: 55 });
  assert.deepEqual(city.projectCityPoint(0, 0, 1, frame), { x: 100, y: 42 });
});

test('3D buildings default map includes trees and tree/shrub groups while semantic view stays available', () => {
  const buildings = require('../public-static/buildings-loader.js');
  const url = new URL(buildings.BUILDING_MAP_URL);
  assert.equal(url.origin, 'https://kartta.hel.fi');
  assert.equal(url.pathname, '/embed/');
  assert.deepEqual(url.searchParams.get('layers').split(','), buildings.BUILDING_LAYER_IDS);
  assert.ok(buildings.BUILDING_LAYER_IDS.includes('HKRPTY_Puurekisteri_kp_Katupuut'));
  assert.ok(buildings.BUILDING_LAYER_IDS.includes('HKRPTY_Puurekisteri_kp_Puistopuut'));
  assert.equal(url.searchParams.get('allow3d'), '2');
  assert.equal(url.searchParams.get('resolution'), '1');
  assert.equal(buildings.SEMANTIC_BUILDING_URL, 'https://kartta.hel.fi/3d/');
  assert.equal(buildings.CITYGML_BUILDING_LAYER_ID, '3D-cesium-buildings');
  assert.equal(buildings.BUILDING_NAMES_LAYER_ID, 'NimistoRakennukset');
  assert.equal(
    buildings.CITYGML_BUILDING_TILESET_URL,
    'https://kartta.hel.fi/3d/datasource-data/e5e7158a-52df-45a1-9be0-1be8f2828abd/tileset.json',
  );
  assert.equal(url.searchParams.get('layers').split(',').includes(buildings.CITYGML_BUILDING_LAYER_ID), true);
});

test('3D buildings page identifies the live CityGML LoD2 geometry source', () => {
  const page = fs.readFileSync(path.join(root, 'public-static/buildings.html'), 'utf8');
  assert.match(page, /CityGML LoD2 -geometriasta/);
  assert.match(page, /3D Tiles \/ B3DM -laattoina/);
  assert.match(page, /datasource-data\/e5e7158a-52df-45a1-9be0-1be8f2828abd\/tileset\.json/);
});

test('3D buildings default map includes Helsinki building names for hover tooltips', () => {
  const buildings = require('../public-static/buildings-loader.js');
  const page = fs.readFileSync(path.join(root, 'public-static/buildings.html'), 'utf8');
  const url = new URL(buildings.BUILDING_MAP_URL);
  assert.ok(url.searchParams.get('layers').split(',').includes('NimistoRakennukset'));
  assert.match(page, /Vie osoitin rakennuksen nimipisteen päälle nähdäksesi nimen/);
  assert.match(page, /NimistoRakennukset-aineistosta/);
  assert.match(page, /C_NIMIS/);
  assert.match(page, /C_NIMIR/);
});

test('3D buildings page shows the Matrix city loader until the official map iframe loads', () => {
  const page = fs.readFileSync(path.join(root, 'public-static/buildings.html'), 'utf8');
  const loader = fs.readFileSync(path.join(root, 'public-static/buildings-loader.js'), 'utf8');
  assert.match(page, /id="buildingLoaderCanvas"/);
  assert.match(page, /role="status" aria-live="polite"/);
  assert.match(page, /Näytä kartta odottamatta/);
  assert.match(page, /src="buildings-loader\.js"/);
  assert.match(loader, /frame\.addEventListener\('load', onFrameLoad/);
  assert.match(loader, /postFrameLoadMs = 18000/);
  assert.match(loader, /loader\.classList\.add\('is-settling'\)/);
  assert.match(loader, /prefers-reduced-motion/);
  assert.match(loader, /fallbackDelayMs = 25000/);
});
