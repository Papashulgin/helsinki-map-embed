import { parseLidarFile } from './vendor/lidar-loader.mjs';

self.addEventListener('message', async ({ data }) => {
  try {
    const mesh = await parseLidarFile(data.arrayBuffer, {
      las: { skip: data.skip, colorDepth: 8 },
      onProgress: (batch) => {
        const progress = Number(batch?.progress);
        if (Number.isFinite(progress)) self.postMessage({ type: 'progress', progress });
      },
    });

    const attributes = {};
    const transfer = [];
    for (const [name, attribute] of Object.entries(mesh.attributes || {})) {
      if (!ArrayBuffer.isView(attribute.value)) continue;
      attributes[name] = { value: attribute.value, size: attribute.size };
      transfer.push(attribute.value.buffer);
    }
    self.postMessage({ type: 'result', mesh: { attributes, header: mesh.header } }, transfer);
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || String(error) });
  }
});
