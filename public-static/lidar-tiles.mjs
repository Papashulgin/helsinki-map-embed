const HELSINKI_BOUNDS = {
  minEasting: 25400000,
  maxEasting: 25550000,
  minNorthing: 6650000,
  maxNorthing: 6700000,
};

const ALLOWED_YEARS = new Set(['2015', '2017', '2021']);

function tileIndex(value, step) {
  return (Math.floor(value / step) * step / 1000) % 1000;
}

function formatIndex(value) {
  return String(value).padStart(3, '0');
}

/** Convert a click in the square map overlay to EPSG:3879 coordinates. */
export function mapClickToCoordinates(pixelX, pixelY, width, height, centerEasting, centerNorthing, resolution) {
  if (![pixelX, pixelY, width, height, centerEasting, centerNorthing, resolution].every(Number.isFinite) ||
      width <= 0 || height <= 0 || resolution <= 0) {
    throw new RangeError('Karttaklikkauksen koordinaatit eivät ole kelvolliset.');
  }
  return {
    easting: centerEasting + (pixelX - width / 2) * resolution,
    northing: centerNorthing - (pixelY - height / 2) * resolution,
  };
}

/** Resolve a clicked EPSG:3879 coordinate to its Helsinki LAS/LAZ tile. */
export function getLidarTileSelection(easting, northing, dataset = 'ground', year = '2021') {
  if (!Number.isFinite(easting) || !Number.isFinite(northing) ||
      easting < HELSINKI_BOUNDS.minEasting || easting > HELSINKI_BOUNDS.maxEasting ||
      northing < HELSINKI_BOUNDS.minNorthing || northing > HELSINKI_BOUNDS.maxNorthing) {
    throw new RangeError('Klikkaa Helsingin alueella olevaa laserkeilausruutua.');
  }
  if (!ALLOWED_YEARS.has(String(year))) {
    throw new RangeError('Valitse laserkeilausvuosi 2015, 2017 tai 2021.');
  }

  const row = Math.floor(northing / 1000) % 1000;
  const column = Math.floor(easting / 1000) % 1000;
  let handler;
  let tileId;
  let size;
  if (dataset === 'ground') {
    handler = 'Lidar_maanpinta';
    size = 2000;
    tileId = `${formatIndex(tileIndex(northing, size))}${formatIndex(tileIndex(easting, size))}x2`;
  } else if (dataset === 'all') {
    handler = 'Lidar_kaikki';
    size = 500;
    const eastHalf = (Math.floor(easting / 500) % 2) === 1;
    const northHalf = (Math.floor(northing / 500) % 2) === 1;
    const quadrant = northHalf ? (eastHalf ? 'd' : 'b') : (eastHalf ? 'c' : 'a');
    tileId = `${formatIndex(row)}${formatIndex(column)}${quadrant}`;
  } else {
    throw new RangeError('Tuntematon laserkeilausaineisto.');
  }

  const url = new URL(`https://ptp.hel.fi/DataHandlers/${handler}/Default.ashx`);
  url.searchParams.set('q', tileId);
  url.searchParams.set('y', String(year));
  return {
    url: url.href,
    tileId,
    year: String(year),
    dataset,
    tile: {
      easting: Math.floor(easting / size) * size,
      northing: Math.floor(northing / size) * size,
      size,
    },
  };
}

/** Build the direct download URL for a clicked map coordinate. */
export function getLidarTileUrl(easting, northing, dataset = 'ground', year = '2021') {
  return getLidarTileSelection(easting, northing, dataset, year).url;
}
