'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const snapshot = require('../public-static/data/finland-map-data/manifest.json');
const { createCatalog } = require('../lib/map-data-catalog');

test('Finland catalogue distinguishes map images, local geometry and external downloads', () => {
  const catalog = createCatalog(snapshot);
  const local = catalog.query({kind:'local',limit:50});
  assert.equal(local.total,8);
  assert.equal(local.items.filter((item)=>item.mapAvailable).length,2);
  const groundwater = catalog.query({q:'pohjavesi',mapOnly:true,limit:50});
  assert(groundwater.total > 0);
  assert(groundwater.items.every((item)=>item.mapAvailable && !item.restricted));
  const legacy = catalog.query({provider:'Digiroad / Fintraffic',limit:50});
  assert(legacy.total > 0);
  assert(legacy.items.every((item)=>item.legacy && item.note.includes('18.9.2026')));
  const restricted = snapshot.items.filter((item)=>item.restricted);
  assert(restricted.length > 0);
  assert.deepEqual(catalog.selection(restricted.map((item)=>item.id)),[]);
  assert(!catalog.query({kind:'dataset',limit:50}).items.some((item)=>/oil palm|mangrove/i.test(item.title)));
});

test('map-data HTTP routes provide bounded searches and portable local downloads', async (t) => {
  const app = require('../server');
  const server = app.listen(0,'127.0.0.1');
  await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
  t.after(()=>new Promise((resolve)=>{server.closeAllConnections();server.close(resolve);}));
  const base = 'http://127.0.0.1:'+server.address().port;
  const get = async (url) => { const response=await fetch(base+url); return {status:response.status,body:await response.json()}; };
  const metadata = await get('/api/map-data/metadata');
  assert.equal(metadata.status,200);
  assert.equal(metadata.body.summary.wms_layer_references,5380);
  assert(metadata.body.downloads.some((item)=>item.id==='package'));
  const result = await get('/api/map-data/catalog?q=maakunnat&kind=local&mapOnly=1');
  assert.equal(result.status,200);
  assert.equal(result.body.total,1);
  assert.equal(result.body.items[0].id,'local-maakunnat_2026');
  assert.equal((await get('/api/map-data/catalog?limit=5000')).status,400);
  assert.equal((await get('/api/map-data/catalog?offset=-1')).status,400);
  assert.equal((await get('/api/map-data/catalog?q[]=bad')).status,400);
  assert.equal((await get('/api/map-data/catalog?kind=secret')).status,400);
  assert.equal((await get('/api/map-data/selection?ids=https://example.test')).status,400);
  const selection = await get('/api/map-data/selection?ids=local-maakunnat_2026');
  assert.equal(selection.body.items[0].geojsonUrl,'/data/finland-map-data/layers/maakunnat_2026.geojson');
  const geometry = await get('/data/finland-map-data/layers/kunnat_2026.geojson');
  assert.equal(geometry.body.features.length,308);
  const helsinki = geometry.body.features.find((feature)=>feature.properties.nimi==='Helsinki');
  assert(helsinki);
  const coords = helsinki.geometry.coordinates.flat(helsinki.geometry.type==='MultiPolygon'?2:1);
  assert(coords.every(([lon,lat])=>lon>23 && lon<27 && lat>59 && lat<62));
  const download = await fetch(base+'/api/map-data/downloads/geopackage',{headers:{Range:'bytes=0-31'}});
  assert.equal(download.status,206);
  assert.match(download.headers.get('content-disposition'),/attachment.*suomi_perusaineistot_2026.gpkg/);
  assert.equal(Buffer.from(await download.arrayBuffer()).subarray(0,15).toString(),'SQLite format 3');
  assert.equal((await get('/api/map-data/downloads/not-a-real-file')).status,404);
});
