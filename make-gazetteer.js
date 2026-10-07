/**
 * Build a small gazetteer of well-known Helsinki-area places with their
 * EPSG:3879 (Helsinki local) coordinates, using the backend transform API.
 * Output: public-static/gazetteer.json
 */
const fs = require('fs');
const path = require('path');
const API = process.env.API || 'http://localhost:3000';

const PLACES = [
  ['Helsinki Central Railway Station', 60.1719, 24.9414],
  ['Senate Square', 60.1699, 24.9523],
  ['Market Square (Kauppatori)', 60.1675, 24.9536],
  ['Helsinki Cathedral', 60.1704, 24.9521],
  ['Uspenski Cathedral', 60.1686, 24.9596],
  ['Temppeliaukio Church', 60.1731, 24.9253],
  ['Kamppi', 60.168, 24.9317],
  ['Kallio', 60.1843, 24.9503],
  ['Linnanmäki amusement park', 60.1886, 24.9403],
  ['Olympic Stadium', 60.1876, 24.9256],
  ['Suomenlinna', 60.145, 24.988],
  ['Seurasaari', 60.183, 24.884],
  ['Korkeasaari Zoo', 60.176, 25.0],
  ['Esplanadi Park', 60.1675, 24.945],
  ['Ateneum Art Museum', 60.17, 24.944],
  ['Kiasma Museum', 60.1713, 24.9368],
  ['Oodi Central Library', 60.1736, 24.938],
  ['Töölö', 60.181, 24.92],
  ['Eira', 60.156, 24.942],
  ['Ullanlinna', 60.16, 24.95],
  ['Kruununhaka', 60.173, 24.956],
  ['Punavuori', 60.162, 24.938],
  ['Vallila', 60.195, 24.956],
  ['Pasila', 60.199, 24.933],
  ['Itäkeskus', 60.2107, 25.08],
  ['Malmi', 60.25, 25.01],
  ['Herttoniemi', 60.195, 25.03],
  ['Käpylä', 60.22, 24.95],
  ['Helsinki Airport (Vantaa)', 60.3172, 24.9633],
  ['Tapiola (Espoo)', 60.1755, 24.8047],
];

async function main() {
  const out = [];
  for (const [name, lat, lon] of PLACES) {
    const r = await fetch(
      `${API}/api/transform?x=${lon}&y=${lat}&source=EPSG:4326&target=EPSG:3879`
    );
    const d = await r.json();
    out.push({ name, lat, lon, easting: Math.round(d.easting), northing: Math.round(d.northing) });
    process.stdout.write(`\r${name} -> ${Math.round(d.easting)}, ${Math.round(d.northing)}        `);
  }
  fs.writeFileSync(
    path.join(__dirname, 'public-static', 'gazetteer.json'),
    JSON.stringify(out, null, 2)
  );
  console.log(`\nWrote ${out.length} places to public-static/gazetteer.json`);
}
main().catch((e) => { console.error(e); process.exit(1); });
