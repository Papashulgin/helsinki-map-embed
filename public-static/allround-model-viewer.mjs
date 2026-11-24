import * as THREE from '/vendor/three.module.js';
import { GLTFLoader } from '/vendor/three-addons/loaders/GLTFLoader.mjs';
import { OrbitControls } from '/vendor/three-addons/OrbitControls.mjs';

const container = document.querySelector('#allroundModelViewport');
const select = document.querySelector('#allroundModelSelect');
const status = document.querySelector('#allroundModelStatus');

const MANUAL = 'Layher Keder Roof XL Manual · Edition 01.2014';
const xlParts = {
  'roof-demo-590-257': { label: 'Keder Roof XL -kokoonpano, kaksilappeinen 18°', kind: 'assembly', size: '5,90 × 2,57 m', page: '6, 9, 32–35', note: 'Esimerkkikokoonpano käyttää manuaalin 5,90 m kattoriviä ja 2,57 m enimmäislohkoa. Rakenne on visuaalinen luonnos.' },
  'lattice-2m': { label: 'Keder Roof XL -ristikkopalkki', kind: 'lattice', length: 2, size: '2,00 m', item: '5975.200', weight: 17.3, page: 32 },
  'lattice-3m': { label: 'Keder Roof XL -ristikkopalkki', kind: 'lattice', length: 3, size: '3,00 m', item: '5975.300', weight: 24.4, page: 32 },
  'ridge-18': { label: 'Keder Roof XL -harjaosa 18°', kind: 'lattice', length: 2.1, size: '2,10 m', item: '5975.110', weight: 24.5, page: 32 },
  'ridge-20': { label: 'Keder Roof XL -harjaosa 20°', kind: 'lattice', length: 2.1, size: '2,10 m', item: '5975.120', weight: 24.5, page: 32 },
  monopitch: { label: 'Yksilappeisen katon ristikkopalkki', kind: 'lattice', length: 1.06, size: '1,06 m', item: '5975.106', weight: 14.5, page: 32 },
  eaves: { label: 'Keder Roof XL -räystäsosa', kind: 'lattice', length: 2, size: '2,00 m', item: '5975.100', weight: 14.3, page: 32 },
  brace: { label: 'Keder Roof XL -jäykiste', kind: 'rod', length: 2.57, size: '2,57 m', item: '5940.257', weight: 10, page: 32 },
  'hdiag-287': { label: 'Vaakadiagonaali, 1 m tolppavälille', kind: 'rod', length: 2.87, size: '2,87 m', item: '5939.100', weight: 4.2, page: 32 },
  'hdiag-337': { label: 'Vaakadiagonaali, 2 m tolppavälille', kind: 'rod', length: 3.37, size: '3,37 m', item: '5939.200', weight: 5, page: 32 },
  ledger: { label: 'Keder-kattovaakajuoksu', kind: 'tube', length: 2.57, size: '2,57 m', item: '5972.257', weight: 4.2, page: 32 },
  'support-073': { label: 'Keder Roof XL -tuki', kind: 'support', length: 0.73, size: 'tukiväli 0,73 m', item: '5975.073', weight: 19.1, page: 33, note: 'Tukiväli ja paino ovat manuaalista; tuen korkeus ja profiilit ovat havainnollistavia.' },
  'support-109': { label: 'Keder Roof XL -tuki', kind: 'support', length: 1.09, size: 'tukiväli 1,09 m', item: '5975.109', weight: 22.4, page: 33, note: 'Tukiväli ja paino ovat manuaalista; tuen korkeus ja profiilit ovat havainnollistavia.' },
  'roof-support': { label: 'Jäykkä kattotuki Keder Roof XL:lle, 18°', kind: 'support', length: 0.73, size: 'tukiväli 0,73 m', item: '5938.030', weight: 11, page: 36, note: 'Manuaali ilmoittaa jäykän 18° kattotuen ja 0,73 m Allround-ruusukevälin; muu geometria on havainnollistava.' },
  'roof-tarp-b1': { label: 'Keder-kattokangas B1', kind: 'tarp', width: 2.57, size: 'B1 = 2,57 m', item: '5972.xxx', page: 35, note: 'Manuaali antaa peitteen leveyden B1; tarkka tuotenro ja peitteen pituus ovat hinnastossa. Katselussa pituussuunnassa näkyy 1 m esimerkkipala.' },
  'roof-tarp-b2': { label: 'Keder-kattokangas B2', kind: 'tarp', width: 2.07, size: 'B2 = 2,07 m', item: '5972.xxx', page: 35, note: 'Manuaali antaa peitteen leveyden B2; tarkka tuotenro ja peitteen pituus ovat hinnastossa. Katselussa pituussuunnassa näkyy 1 m esimerkkipala.' },
  'gable-tarp-b1': { label: 'Keder-katon päätykangas B1', kind: 'tarp', width: 2.57, size: 'B1 = 2,57 m', item: '5972.xxx', page: 35, note: 'Manuaali antaa peitteen leveyden B1; tarkka tuotenro ja päädyn mitoitus ovat hinnastossa. Katselussa näkyy 1 m havainnollistava pala.' },
  'gable-tarp-b2': { label: 'Keder-katon päätykangas B2', kind: 'tarp', width: 2.07, size: 'B2 = 2,07 m', item: '5972.xxx', page: 35, note: 'Manuaali antaa peitteen leveyden B2; tarkka tuotenro ja päädyn mitoitus ovat hinnastossa. Katselussa näkyy 1 m havainnollistava pala.' },
  'tarp-clip': { label: 'Peitteen kiinnike', kind: 'hardware', item: '5971.140', size: '50 kpl / pakkaus', weight: 0.1, page: 35, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  'rail-seal': { label: 'Keder-kiskon tiiviste', kind: 'hardware', item: '5971.001', weight: 0.1, page: 33, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  'insertion-set': { label: 'Peitteen syöttösarja', kind: 'kit', length: 3, size: '3,00 m', item: '5971.400', weight: 5.8, page: 34 },
  'insertion-roller': { label: 'Peitteen syöttörulla 48,3 mm putkelle', kind: 'hardware', item: '5971.401', weight: 0.4, page: 34, note: 'Putken yhteensopivuus on manuaalissa; rullan muotoa ei mitoiteta tässä.' },
  'rail-3m': { label: 'Keder-kisko', kind: 'tube', length: 3, size: '3,00 m', item: '5941.300', weight: 53.4, page: 35 },
  't12-adapter': { label: 'Kiskon T12-adapteri', kind: 'tube', length: 0.8, size: '0,80 m', item: '5938.027', weight: 5.5, page: 35 },
  't12-trolley': { label: 'T12-vaunu', kind: 'hardware', item: '5938.026', weight: 16.3, page: 35, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  't12-connector': { label: 'T12-vaunun liitin', kind: 'hardware', item: '5938.019', weight: 11.1, page: 35, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  'tie-fastening': { label: 'Sidontakiinnike', kind: 'hardware', item: '5975.000', weight: 6.1, page: 33, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  'tie-strap-connection': { label: 'Sidontaliitos kiristyshihnalle', kind: 'strap', item: '5975.010', length: 0.9, weight: 2, page: 33, note: 'Muoto ja pituus ovat havainnollistavia; manuaali ei anna mittakuvaa.' },
  'tie-rod-connection': { label: 'Sidontaliitos kierretangolle', kind: 'hardware', item: '5975.020', weight: 2.2, page: 34, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  'tie-connection-piece': { label: 'Sidonnan liitoskappale', kind: 'hardware', item: '5975.030', weight: 0.8, page: 34, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  'tie-rod-connector': { label: 'Kierretangon liitin WAF 30 × 90', kind: 'hardware', item: '5976.000', size: 'WAF 30 × 90', weight: 0.4, page: 34, note: 'Symbolinen osaesitys; geometria ei ole mittakaavassa.' },
  'tie-rod-2m': { label: 'Sidontakierretanko', kind: 'rod', length: 2, size: '2,00 m', item: '5976.200', weight: 2.9, page: 34 },
  'tie-rod-3m': { label: 'Sidontakierretanko', kind: 'rod', length: 3, size: '3,00 m', item: '5976.300', weight: 4.4, page: 34 },
  'tie-rod-4m': { label: 'Sidontakierretanko', kind: 'rod', length: 4, size: '4,00 m', item: '5976.400', weight: 5.8, page: 34 },
  'tie-rod-5m': { label: 'Sidontakierretanko', kind: 'rod', length: 5, size: '5,00 m', item: '5976.500', weight: 7.3, page: 34 },
  't4-spigot': { label: 'Ristikkopalkin liitintappi T4', kind: 'rod', length: 0.44, diameter: 0.038, size: 'Ø 38 mm × 0,44 m', item: '4922.000', weight: 1.9, page: 36 },
  'double-coupler-19': { label: 'Kaksoisliitin WAF 19', kind: 'hardware', item: '4700.019', weight: 1.3, page: 36, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  'double-coupler-22': { label: 'Kaksoisliitin WAF 22', kind: 'hardware', item: '4700.022', weight: 1.3, page: 36, note: 'Manuaali ei anna osan mittakuvaa; symbolinen osaesitys, ei mittakaavassa.' },
  'special-bolt-60': { label: 'Erikoispultti M12 × 60 mm mutterilla', kind: 'bolt', length: 0.06, diameter: 0.012, size: 'M12 × 60 mm', item: '4905.060', weight: 0.1, page: 33 },
  'special-bolt-90': { label: 'Erikoispultti M12 × 90 mm mutterilla', kind: 'bolt', length: 0.09, diameter: 0.012, size: 'M12 × 90 mm', item: '5975.090', weight: 0.1, page: 33 },
  'beam-pin': { label: 'Ristikkopalkin lukitustappi, litteä pää', kind: 'pin', length: 0.18, diameter: 0.012, size: 'Ø 12 mm', item: '4905.666', weight: 0.1, page: 33, note: 'Pituutta ei ilmoiteta; symbolinen pituus ei ole mittakaavassa.' },
  'pin-95': { label: 'Tappi', kind: 'pin', length: 0.095, diameter: 0.012, size: 'Ø 12 × 95 mm', item: '5976.090', weight: 0.1, page: 33 },
  'pin-65': { label: 'Tappi', kind: 'pin', length: 0.065, diameter: 0.012, size: 'Ø 12 × 65 mm', item: '4905.065', weight: 0.1, page: 33 },
  'locking-pin': { label: 'Lukitussokka', kind: 'pin', length: 0.08, diameter: 0.0028, size: 'Ø 2,8 mm', item: '4905.000', weight: 0.1, page: 33, note: 'Pituutta ei ilmoiteta; symbolinen pituus ei ole mittakaavassa.' },
  'red-locking-pin': { label: 'Punainen lukitustappi', kind: 'pin', length: 0.14, diameter: 0.011, size: 'Ø 11 mm', item: '4000.001', weight: 0.2, page: 36, note: 'Pituutta ei ilmoiteta; symbolinen pituus ei ole mittakaavassa.' },
  'lashing-strap-5m': { label: 'Kuormaliina räikällä, luokka 5 t', kind: 'strap', length: 5, size: '5,00 m', item: '5976.600', weight: 2.8, page: 34 },
  'wedge-strap-6m': { label: 'Polyesterihihna kiilalukolla', kind: 'strap', length: 6, size: '6,00 m', item: '5976.610', weight: 0.2, page: 34 },
};

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: options.metalness ?? 0.65, roughness: options.roughness ?? 0.38, transparent: options.transparent ?? false, opacity: options.opacity ?? 1, side: THREE.DoubleSide });
}

function addTube(group, start, end, radius, surface) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const delta = new THREE.Vector3().subVectors(b, a);
  if (delta.length() < 0.0001) return;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 10), surface);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  group.add(mesh);
}

function addBox(group, position, size, surface) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addLatticeBeam(group, length, surface) {
  // The manual supplies part length and mass, but not a manufacturing drawing.
  // This open-web envelope is a visual symbol, not a Layher CAD section.
  const height = Math.max(0.18, Math.min(0.34, length * 0.11));
  const bottom = -height / 2, top = height / 2, panels = Math.max(2, Math.ceil(length / 0.45));
  addTube(group, [0, 0, top], [length, 0, top], 0.025, surface);
  addTube(group, [0, 0, bottom], [length, 0, bottom], 0.025, surface);
  for (let index = 0; index <= panels; index += 1) {
    const x = length * index / panels;
    addTube(group, [x, 0, bottom], [x, 0, top], 0.016, surface);
    if (index < panels) {
      const nextX = length * (index + 1) / panels;
      const a = index % 2 ? [x, 0, top] : [x, 0, bottom];
      const b = index % 2 ? [nextX, 0, bottom] : [nextX, 0, top];
      addTube(group, a, b, 0.014, surface);
    }
  }
}

function addRoofFrame(group, x, length, width, eaveZ, rise, metal) {
  const left = [x, -width / 2, eaveZ], ridge = [x, 0, eaveZ + rise], right = [x, width / 2, eaveZ];
  addTube(group, left, ridge, 0.035, metal);
  addTube(group, ridge, right, 0.035, metal);
  const steps = 4;
  for (const side of [-1, 1]) {
    for (let index = 0; index < steps; index += 1) {
      const t0 = index / steps, t1 = (index + 1) / steps;
      const y0 = side * width / 2 * (1 - t0), y1 = side * width / 2 * (1 - t1);
      const z0 = eaveZ + rise * t0, z1 = eaveZ + rise * t1;
      const top0 = [x, y0, z0], top1 = [x, y1, z1];
      const bottom0 = [x, y0, z0 - 0.22], bottom1 = [x, y1, z1 - 0.22];
      addTube(group, bottom0, bottom1, 0.026, metal);
      addTube(group, top0, bottom0, 0.014, metal);
      addTube(group, bottom0, top1, 0.014, metal);
    }
    addTube(group, [x, 0, eaveZ + rise], [x, 0, eaveZ + rise - 0.22], 0.014, metal);
  }
}

function addQuad(group, points, surface) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry, surface));
}

function makeRoofAssembly() {
  const group = new THREE.Group();
  const metal = material(0x87949b, { metalness: 0.8, roughness: 0.32 });
  const brace = material(0xd08a35, { metalness: 0.55, roughness: 0.42 });
  const tarp = material(0xffffff, { metalness: 0, roughness: 0.8, transparent: true, opacity: 0.52 });
  const length = 2.57, width = 5.9, eaveZ = 2.4, rise = Math.tan(THREE.MathUtils.degToRad(18)) * width / 2;
  for (const x of [0, length]) {
    addRoofFrame(group, x, length, width, eaveZ, rise, metal);
    for (const y of [-width / 2, width / 2]) {
      addTube(group, [x, y, 0.12], [x, y, eaveZ], 0.035, metal);
      addBox(group, [x, y, 0.08], [0.22, 0.22, 0.12], material(0xd8aa63, { metalness: 0.18 }));
    }
  }
  for (const y of [-width / 2, 0, width / 2]) addTube(group, [0, y, eaveZ + rise * (1 - Math.abs(y) / (width / 2))], [length, y, eaveZ + rise * (1 - Math.abs(y) / (width / 2))], 0.026, metal);
  const half = width / 2;
  addQuad(group, [[0, -half, eaveZ], [length, -half, eaveZ], [length, 0, eaveZ + rise], [0, 0, eaveZ + rise]], tarp);
  addQuad(group, [[0, 0, eaveZ + rise], [length, 0, eaveZ + rise], [length, half, eaveZ], [0, half, eaveZ]], tarp);
  addTube(group, [0, -half, eaveZ], [length, 0, eaveZ + rise], 0.016, brace);
  addTube(group, [0, 0, eaveZ + rise], [length, half, eaveZ], 0.016, brace);
  return group;
}

function makePartPreview(part) {
  const group = new THREE.Group();
  const metal = material(0x8c989d, { metalness: 0.82, roughness: 0.34 });
  const dark = material(0x526169, { metalness: 0.72, roughness: 0.4 });
  const tarp = material(0xf7fafb, { metalness: 0, roughness: 0.78, transparent: true, opacity: 0.78 });
  const length = Math.max(0.04, Number(part.length) || 0.24);

  if (part.kind === 'lattice') {
    addLatticeBeam(group, length, metal);
  } else if (part.kind === 'rod' || part.kind === 'tube') {
    const radius = part.diameter ? Math.max(0.004, part.diameter / 2) : 0.025;
    addTube(group, [0, 0, 0], [length, 0, 0], radius, metal);
    if (part.kind === 'tube') for (const x of [0.04, Math.max(0.05, length - 0.04)]) addTube(group, [x, -0.055, 0], [x, 0.055, 0], 0.012, dark);
  } else if (part.kind === 'bolt' || part.kind === 'pin') {
    const diameter = Math.max(0.005, Number(part.diameter) || 0.012);
    addTube(group, [0, 0, 0], [length, 0, 0], diameter / 2, metal);
    addBox(group, [0.012, 0, 0], [0.024, diameter * 2.2, diameter * 2.2], dark);
  } else if (part.kind === 'support') {
    const span = Math.max(0.5, Number(part.length) || 0.73), height = 1.1;
    for (const x of [-span / 2, span / 2]) {
      addTube(group, [x, 0, 0], [x, 0, height], 0.028, metal);
      addBox(group, [x, 0, 0.05], [0.16, 0.16, 0.08], dark);
    }
    addTube(group, [-span / 2, 0, height], [span / 2, 0, height], 0.032, metal);
    addTube(group, [-span / 2, 0, 0.18], [span / 2, 0, height], 0.018, dark);
  } else if (part.kind === 'tarp') {
    const width = Number(part.width) || 2.07, previewLength = 1;
    addQuad(group, [[0, -width / 2, 0], [previewLength, -width / 2, 0], [previewLength, width / 2, 0.06], [0, width / 2, 0.06]], tarp);
    addTube(group, [0, -width / 2, 0], [0, width / 2, 0], 0.012, dark);
    addTube(group, [previewLength, -width / 2, 0], [previewLength, width / 2, 0.06], 0.012, dark);
  } else if (part.kind === 'kit') {
    addTube(group, [0, -0.18, 0], [length, -0.18, 0], 0.022, metal);
    addTube(group, [0, 0.18, 0], [length, 0.18, 0], 0.022, metal);
    for (let x = 0.1; x < length; x += 0.35) addTube(group, [x, -0.18, 0], [x, 0.18, 0], 0.012, dark);
    addBox(group, [length * 0.5, 0, 0.16], [0.18, 0.2, 0.16], metal);
  } else if (part.kind === 'strap') {
    const loopRadius = Math.max(0.1, Math.min(0.6, length / 6));
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(length * 0.33, 0, loopRadius),
      new THREE.Vector3(length * 0.66, 0, -loopRadius), new THREE.Vector3(length, 0, 0),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.018, 6, false), material(0x9c4e36, { metalness: 0.12, roughness: 0.82 })));
    addBox(group, [0.08, 0, 0], [0.14, 0.1, 0.08], dark);
  } else {
    // Hardware with no source drawing is shown as a labeled schematic token.
    if (part.item === '5938.026') {
      addBox(group, [0, 0, 0.08], [0.42, 0.25, 0.16], metal);
      for (const x of [-0.14, 0.14]) for (const y of [-0.15, 0.15]) {
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 8, 16), dark);
        wheel.position.set(x, y, 0.04); group.add(wheel);
      }
    } else if (part.item === '5971.401') {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 16), metal);
      wheel.rotation.x = Math.PI / 2; wheel.position.z = 0.07; group.add(wheel);
      addTube(group, [0, -0.18, 0.07], [0, 0.18, 0.07], 0.014, dark);
    } else {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 20), metal); group.add(ring);
      addBox(group, [0.08, 0, 0], [0.16, 0.07, 0.07], dark);
      if (part.item?.startsWith('5975.')) addTube(group, [-0.16, 0, 0], [0.16, 0, 0], 0.02, metal);
    }
  }
  return group;
}

if (container && select && status) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xeaf1f2, 1);
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeaf1f2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x71808a, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(4, -6, 9);
  scene.add(keyLight);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 10000);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  const grid = new THREE.GridHelper(10, 20, 0x93a7a6, 0xc5d0ce);
  grid.rotation.x = Math.PI / 2;
  scene.add(grid);
  const loader = new GLTFLoader();
  let active = null;
  let request = 0;

  function resize() {
    const width = Math.max(1, container.clientWidth), height = Math.max(240, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  function clearActive() {
    if (!active) return;
    scene.remove(active);
    active.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((entry) => entry.dispose());
      else object.material?.dispose();
    });
    active = null;
  }

  function frameModel(object, label, convertYUp = false) {
    clearActive();
    active = object;
    if (convertYUp) active.rotation.x = Math.PI / 2;
    scene.add(active);
    active.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(active);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    active.position.sub(center);
    grid.position.z = -size.z / 2;
    const radius = Math.max(size.x, size.y, size.z, 0.05);
    const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.25;
    camera.position.set(distance * 0.9, -distance, distance * 0.72);
    camera.near = Math.max(0.001, distance / 10000);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.minDistance = radius * 0.35;
    controls.maxDistance = radius * 18;
    controls.update();
    return `${label} · näkymä ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m`;
  }

  function manualStatus(part) {
    const parts = [MANUAL, `s. ${part.page}`];
    if (part.item) parts.push(`tuotenro ${part.item}`);
    if (part.size) parts.push(part.size);
    if (Number.isFinite(part.weight)) parts.push(`${part.weight.toLocaleString('fi-FI')} kg`);
    parts.push(part.note || 'Profiilin ja liitosten muoto on havainnollistava 3D-luonnos, ei valmistajan CAD.');
    return parts.join(' · ');
  }

  async function show(value, optionLabel) {
    const id = ++request;
    if (value.startsWith('layher-keder-xl:')) {
      const keyName = value.slice('layher-keder-xl:'.length);
      const part = xlParts[keyName];
      if (!part) { status.textContent = 'Valittua Keder XL -osaa ei löydy.'; return; }
      const model = part.kind === 'assembly' ? makeRoofAssembly() : makePartPreview(part);
      const viewStatus = frameModel(model, optionLabel);
      status.textContent = `${manualStatus(part)} · ${viewStatus}`;
      return;
    }

    status.textContent = `Ladataan mallia: ${optionLabel}…`;
    try {
      const gltf = await loader.loadAsync(value);
      if (id !== request) return;
      status.textContent = `${frameModel(gltf.scene, optionLabel, true)} · GLB-mallipaketti · Y-up muunnettu näkymään`;
    } catch (error) {
      if (id === request) status.textContent = `Mallin lataus epäonnistui: ${error.message}`;
    }
  }

  select.addEventListener('change', () => {
    const option = select.selectedOptions[0];
    if (option) show(option.value, option.textContent);
  });

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();
  const first = select.selectedOptions[0];
  if (first) show(first.value, first.textContent);
}
