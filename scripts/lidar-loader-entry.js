import { parse } from '@loaders.gl/core';
import { LAZRsLoader } from '@loaders.gl/las';

export function parseLidarFile(arrayBuffer, options) {
  return parse(arrayBuffer, LAZRsLoader, options);
}
