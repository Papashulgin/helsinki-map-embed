import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = path.join(root, 'public-static', 'vendor');

await mkdir(vendor, { recursive: true });
await build({
  entryPoints: [path.join(root, 'scripts', 'lidar-loader-entry.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  outfile: path.join(vendor, 'lidar-loader.mjs'),
  legalComments: 'linked',
  define: { __VERSION__: '"4.5.4"' },
});
await copyFile(
  path.join(root, 'node_modules', '@loaders.gl', 'las', 'dist', 'libs', 'laz-rs-wasm', 'laz_rs_wasm_bg.wasm'),
  path.join(vendor, 'laz_rs_wasm_bg.wasm'),
);
await copyFile(
  path.join(root, 'node_modules', '@loaders.gl', 'las', 'LICENSE'),
  path.join(vendor, 'LOADERS-GL-LICENSE.txt'),
);
