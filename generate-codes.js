/**
 * Pre-generate embed codes for every base-map / overlay combination and
 * write them to public-static/layers.json.
 *
 * The static app uses these codes (which encode the *layer stack*) together
 * with client-side URL params (easting/northing/resolution/ui/language) to
 * build embed URLs without needing the proxy at runtime.
 *
 * Run with the backend already running:  node server.js &  node generate-codes.js
 */

const fs = require('fs');
const path = require('path');

const API = process.env.API || 'http://localhost:3000';

async function post(body) {
  const r = await fetch(`${API}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

async function main() {
  const cat = await (await fetch(`${API}/api/layers`)).json();
  const out = { baseMaps: {}, combos: {}, generatedAt: new Date().toISOString() };

  let n = 0;
  const total = cat.baseMaps.length + cat.baseMaps.length * cat.overlays.length;

  for (const b of cat.baseMaps) {
    const r = await post({ baseMap: b.id, overlays: [] });
    out.baseMaps[b.id] = r.code;
    n++;
    process.stdout.write(`\r[${n}/${total}] base ${b.id} -> ${r.code}        `);
  }

  for (const b of cat.baseMaps) {
    for (const o of cat.overlays) {
      const r = await post({ baseMap: b.id, overlays: [o.id] });
      out.combos[`${b.id}|${o.id}`] = r.code;
      n++;
      process.stdout.write(`\r[${n}/${total}] ${b.id} + ${o.id} -> ${r.code}        `);
    }
  }

  const dir = path.join(__dirname, 'public-static');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'layers.json'), JSON.stringify(out, null, 2));
  console.log(`\nWrote ${total} codes to public-static/layers.json`);
}

main().catch((e) => {
  console.error('\nFailed:', e);
  process.exit(1);
});
