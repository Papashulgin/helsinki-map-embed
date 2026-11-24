import * as THREE from '/vendor/three.module.js';
import { GLTFLoader } from '/vendor/three-addons/loaders/GLTFLoader.mjs';

const viewers = new WeakMap();
const allroundAssetLoader = new GLTFLoader();
const allroundAssetCache = new Map();
const ALLROUND_ASSET_ROOT = '/assets/allround-keder-pack/glb/';
const ALLROUND_LEDGER_SIZES = [390, 730, 1090, 1400, 1570, 2070, 2570, 3070, 4140];
const ALLROUND_DECK_SIZES = [730, 1090, 1400, 1570, 2070, 2570, 3070];
const ALLROUND_DIAGONAL_SIZES = [1090, 1400, 1570, 2070, 2570];
const allroundXAxis = new THREE.Vector3(1, 0, 0);
const allroundZAxis = new THREE.Vector3(0, 0, 1);
const allroundYUpRotation = new THREE.Quaternion().setFromAxisAngle(allroundXAxis, Math.PI / 2);

function loadAllroundAsset(relativePath) {
  if (!allroundAssetCache.has(relativePath)) {
    const pending = allroundAssetLoader.loadAsync(`${ALLROUND_ASSET_ROOT}${relativePath}`).catch((error) => {
      allroundAssetCache.delete(relativePath);
      throw error;
    });
    allroundAssetCache.set(relativePath, pending);
  }
  return allroundAssetCache.get(relativePath);
}

function allroundAssetPath(kind, lengthM) {
  const available = kind === 'deck' ? ALLROUND_DECK_SIZES : kind === 'diagonal' ? ALLROUND_DIAGONAL_SIZES : ALLROUND_LEDGER_SIZES;
  const target = Number(lengthM) * 1000;
  const size = available.reduce((best, candidate) => Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best, available[0]);
  if (kind === 'deck') return `07_platforms/steel_deck_${size}x320.glb`;
  if (kind === 'diagonal') return `05_diagonals/diagonal_${size}x2000.glb`;
  return `02_ledgers/ledger_${size}.glb`;
}

function getAssetBounds(gltf) {
  gltf.scene.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(gltf.scene);
}

function cloneAllroundAsset(gltf, yaw) {
  const object = gltf.scene.clone(true);
  const yawRotation = new THREE.Quaternion().setFromAxisAngle(allroundZAxis, yaw);
  object.quaternion.copy(yawRotation.multiply(allroundYUpRotation));
  object.traverse((child) => {
    if (child.isMesh) child.userData.sharedScaffoldAsset = true;
  });
  return object;
}

function addAllroundSpan(group, gltf, bounds, start, end) {
  const dx = end[0] - start[0], dy = end[1] - start[1], length = Math.hypot(dx, dy);
  const sourceLength = bounds.max.x - bounds.min.x;
  if (length < 0.001 || sourceLength < 0.001) return;
  const yaw = Math.atan2(dy, dx), ux = dx / length, uy = dy / length, leftX = -uy, leftY = ux;
  const object = cloneAllroundAsset(gltf, yaw);
  object.scale.x = length / sourceLength;
  const centerVertical = (bounds.min.y + bounds.max.y) / 2;
  const centerAcross = (bounds.min.z + bounds.max.z) / 2;
  object.position.set(
    start[0] - ux * bounds.min.x * object.scale.x + leftX * centerAcross,
    start[1] - uy * bounds.min.x * object.scale.x + leftY * centerAcross,
    start[2] - centerVertical,
  );
  group.add(object);
}

function addAllroundUpright(group, gltf, bounds, x, y, z, height) {
  const sourceHeight = bounds.max.y - bounds.min.y;
  if (sourceHeight < 0.001 || height < 0.001) return;
  const object = gltf.scene.clone(true);
  object.quaternion.copy(allroundYUpRotation);
  object.scale.y = height / sourceHeight;
  object.position.set(x, y, z - bounds.min.y * object.scale.y);
  object.traverse((child) => { if (child.isMesh) child.userData.sharedScaffoldAsset = true; });
  group.add(object);
}

function addAllroundDiagonal(group, gltf, bounds, start, end) {
  const dx = end[0] - start[0], dy = end[1] - start[1], rise = end[2] - start[2], length = Math.hypot(dx, dy);
  const sourceLength = bounds.max.x - bounds.min.x, sourceHeight = bounds.max.y - bounds.min.y;
  if (length < 0.001 || rise < 0.001 || sourceLength < 0.001 || sourceHeight < 0.001) return;
  const yaw = Math.atan2(dy, dx), ux = dx / length, uy = dy / length, leftX = -uy, leftY = ux;
  const object = cloneAllroundAsset(gltf, yaw);
  object.scale.set(length / sourceLength, rise / sourceHeight, 1);
  const across = (bounds.min.z + bounds.max.z) / 2;
  object.position.set(
    start[0] - ux * bounds.min.x * object.scale.x + leftX * across,
    start[1] - uy * bounds.min.x * object.scale.x + leftY * across,
    start[2] - bounds.min.y * object.scale.y,
  );
  group.add(object);
}

async function addAllroundModeledParts(group, layouts) {
  const requestedPaths = new Set([
    '01_verticals/standard_2000.glb',
    '03_u_transoms/u_transom_730.glb',
  ]);
  for (const layout of layouts) {
    for (const length of layout.bayLengths) {
      requestedPaths.add(allroundAssetPath('ledger', length));
      if (layout.platformLevels.length) requestedPaths.add(allroundAssetPath('deck', length));
      if (layout.braceBayIndexes.length) requestedPaths.add(allroundAssetPath('diagonal', length));
    }
  }
  const loaded = new Map(await Promise.all([...requestedPaths].map(async (path) => [path, await loadAllroundAsset(path)])));
  const bounds = new Map([...loaded].map(([path, gltf]) => [path, getAssetBounds(gltf)]));
  const at = (layout, along, offset, z) => [
    layout.edge.point[0] + layout.ux * along + layout.outward[0] * offset,
    layout.edge.point[1] + layout.uy * along + layout.outward[1] * offset,
    z,
  ];
  for (const layout of layouts) {
    const standard = loaded.get('01_verticals/standard_2000.glb'), standardBounds = bounds.get('01_verticals/standard_2000.glb');
    const transomPath = '03_u_transoms/u_transom_730.glb', transom = loaded.get(transomPath), transomBounds = bounds.get(transomPath);
    const rows = [0.2, 0.77];
    for (let node = 0; node <= layout.bays; node += 1) {
      const along = layout.bayStarts[node] ?? layout.modeledLength;
      for (const offset of rows) {
        for (let lift = 0; lift < layout.lifts; lift += 1) {
          const z0 = Math.min(layout.height, layout.liftHeight * lift), z1 = Math.min(layout.height, layout.liftHeight * (lift + 1));
          addAllroundUpright(group, standard, standardBounds, ...at(layout, along, offset, z0), Math.max(0, z1 - z0));
        }
      }
      for (let level = 0; level <= layout.lifts; level += 1) {
        const z = Math.min(layout.height, layout.liftHeight * level), near = at(layout, along, rows[0], z), far = at(layout, along, rows[1], z);
        addAllroundSpan(group, transom, transomBounds, near, far);
      }
    }
    for (let level = 0; level <= layout.lifts; level += 1) {
      const z = Math.min(layout.height, layout.liftHeight * level);
      for (let bay = 0; bay < layout.bays; bay += 1) {
        const start = layout.bayStarts[bay] ?? 0, end = start + layout.bayLengths[bay];
        const path = allroundAssetPath('ledger', layout.bayLengths[bay]), ledger = loaded.get(path), ledgerBounds = bounds.get(path);
        for (const offset of rows) addAllroundSpan(group, ledger, ledgerBounds, at(layout, start, offset, z), at(layout, end, offset, z));
      }
    }
    for (const rawLevel of layout.platformLevels) {
      const level = Number(rawLevel);
      if (!Number.isFinite(level) || level < 1 || level > layout.lifts) continue;
      const z = Math.min(layout.height, layout.liftHeight * level) + 0.025;
      for (let bay = 0; bay < layout.bays; bay += 1) {
        const start = layout.bayStarts[bay] ?? 0, end = start + layout.bayLengths[bay];
        const path = allroundAssetPath('deck', layout.bayLengths[bay]), deck = loaded.get(path), deckBounds = bounds.get(path);
        // Two detailed 320 mm steel decks make up the Allround working surface.
        for (const offset of [0.36, 0.68]) addAllroundSpan(group, deck, deckBounds, at(layout, start, offset, z), at(layout, end, offset, z));
        // Keep the modeled handrails on the outside edge at both required heights.
        const ledgerPath = allroundAssetPath('ledger', layout.bayLengths[bay]), rail = loaded.get(ledgerPath), railBounds = bounds.get(ledgerPath);
        for (const railHeight of [0.5, 1.0]) addAllroundSpan(group, rail, railBounds, at(layout, start, 0.77, z - 0.025 + railHeight), at(layout, end, 0.77, z - 0.025 + railHeight));
      }
    }
    for (const rawBay of layout.braceBayIndexes) {
      const bay = Number(rawBay);
      if (!Number.isInteger(bay) || bay < 0 || bay >= layout.bays) continue;
      const start = layout.bayStarts[bay] ?? 0, end = start + layout.bayLengths[bay];
      const path = allroundAssetPath('diagonal', layout.bayLengths[bay]), diagonal = loaded.get(path), diagonalBounds = bounds.get(path);
      for (let lift = 0; lift < layout.lifts; lift += 1) {
        const z0 = Math.min(layout.height, layout.liftHeight * lift), z1 = Math.min(layout.height, layout.liftHeight * (lift + 1));
        addAllroundDiagonal(group, diagonal, diagonalBounds, at(layout, start, 0.77, z0), at(layout, end, 0.77, z1));
      }
    }
  }
}

function dispose(group) {
  group.traverse((object) => {
    if (!object.userData.sharedScaffoldAsset) {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
    }
  });
  group.clear();
}

function makeTube(group, start, end, radius, material) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const delta = new THREE.Vector3().subVectors(b, a);
  if (delta.length() < 0.001) return;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  group.add(mesh);
}

function makePanel(group, points, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([...points[0], ...points[1], ...points[2], ...points[0], ...points[2], ...points[3]], 3));
  geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry, material));
}

const LAYHER_O_STEEL_TOE_BOARD_LENGTHS_CM = new Set([73, 109, 140, 157, 207, 257, 307]);
function supportsPlatformProtection(system) {
  return system === 'layher-allround' || system === 'haki-universal';
}

function hasCompatibleToeBoard(system, lengthM) {
  const lengthCm = Math.round(Number(lengthM) * 100);
  if (system === 'layher-allround') return LAYHER_O_STEEL_TOE_BOARD_LENGTHS_CM.has(lengthCm);
  return system === 'haki-universal' && Math.abs(Number(lengthM) - 3.05) < 0.01;
}

function addPlatformProtection(group, at, levels, liftHeight, lifts, bayStarts, bayLengths, railMaterial, toeBoardMaterial, system) {
  for (const rawLevel of levels || []) {
    const level = Number(rawLevel);
    if (!Number.isFinite(level) || level < 1 || level > lifts) continue;
    const z = level * liftHeight;
    for (let bay = 0; bay < bayLengths.length; bay++) {
      const start = Number(bayStarts[bay]) || 0, length = Number(bayLengths[bay]) || 0, end = start + length;
      if (length <= 0) continue;
      for (const railHeight of [0.5, 1.0]) makeTube(group, at(start, 0.77, z + railHeight), at(end, 0.77, z + railHeight), 0.019, railMaterial);
      if (hasCompatibleToeBoard(system, length)) makePanel(group, [at(start, 0.79, z), at(end, 0.79, z), at(end, 0.79, z + 0.15), at(start, 0.79, z + 0.15)], toeBoardMaterial);
    }
  }
}

// Keep the building and facade picker usable in constrained browsers where a
// WebGL context is disabled. This SVG is a rotatable isometric projection of
// the same footprint, facade, scaffold bays and working platforms.
function createSvgViewer(container) {
  container.innerHTML = '<svg class="scaffold-webgl-canvas scaffold-svg-canvas" role="img" aria-label="Pyöritettävä rakennuksen ja telineen 3D-malli"></svg><div class="scaffold-3d-help">Vedä pyörittääksesi · vieritä zoomataksesi · klikkaa julkisivua valitaksesi · SVG-varanäkymässä ei näytetä GLB-osamalleja</div>';
  const svg = container.querySelector('svg');
  let config = null, yaw = null, pitch = 0.62, zoom = 1, dragging = null;
  const ns = 'http://www.w3.org/2000/svg';
  const render = () => {
    if (!config) return;
    const width = Math.max(300, container.clientWidth || 500), heightPx = Math.max(260, container.clientHeight || 320);
    const sourceRing = Array.isArray(config.footprint) && config.footprint.length >= 3 ? config.footprint : [[0,0],[config.targetLength,0],[config.targetLength,config.depth],[0,config.depth]];
    const minX = Math.min(...sourceRing.map((p) => Number(p[0]))), minY = Math.min(...sourceRing.map((p) => Number(p[1])));
    const ring = sourceRing.map(([x,y]) => [Number(x)-minX, Number(y)-minY]);
    const height = Math.max(0.01, Number(config.buildingHeight)||0.01), area = ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0);
    const edges = ring.map((point,index)=>{const next=ring[(index+1)%ring.length];return {point,next,length:Math.hypot(next[0]-point[0],next[1]-point[1]),index};});
    const selected = Number.isInteger(config.facadeIndex) && edges[config.facadeIndex] ? config.facadeIndex : edges.reduce((best,e,i)=>e.length>edges[best].length?i:best,0);
    const edge = edges[selected], dx=edge.next[0]-edge.point[0], dy=edge.next[1]-edge.point[1], edgeLen=Math.max(edge.length,.001), ux=dx/edgeLen, uy=dy/edgeLen;
    const outward = area > 0 ? [uy,-ux] : [-uy,ux];
    // Turn the selected facade toward the viewer on the first render so the
    // scaffold sits visibly in front of the building; preserve later rotation.
    if (!Number.isFinite(yaw)) yaw = Math.atan2(outward[0],outward[1]);
    const scaffoldHeight=Math.max(.5,Number(config.scaffoldHeight)||height), bayLength=Math.max(.1,Number(config.bayLength)||3.05), configuredBays=Number(config.bays), bays=Number.isInteger(configuredBays)&&configuredBays>=0?configuredBays:Math.max(1,Math.ceil(Number(config.targetLength||edgeLen)/bayLength)), configuredLength=Number(config.modeledLength), modeled=Number.isFinite(configuredLength)?Math.max(0,configuredLength):Math.max(0,Number(config.targetLength||edgeLen)), bayStarts=config.bayStarts||Array.from({length:bays},(_,i)=>i*modeled/Math.max(1,bays)), bayLengths=config.bayLengths||Array.from({length:bays},(_,i)=>bayStarts[i+1]!=null?bayStarts[i+1]-bayStarts[i]:modeled/Math.max(1,bays)), bayX=(i)=>bayStarts[i]??modeled;
    const lifts=Math.max(1,Number(config.lifts)||Math.ceil(scaffoldHeight/2)), liftHeight=Number(config.liftHeight)||scaffoldHeight/lifts;
    const at=(along,offset,z)=>[edge.point[0]+ux*along+outward[0]*offset,edge.point[1]+uy*along+outward[1]*offset,z];
    const towerEnvelope=(config.stairTowers||[]).flatMap((tower)=>{const e=edges[Number(tower.index)];if(!e)return[];const dx=e.next[0]-e.point[0],dy=e.next[1]-e.point[1],len=Math.max(e.length,.001),ux=dx/len,uy=dy/len,out=area>0?[uy,-ux]:[-uy,ux],bay=Math.max(.1,Number(tower.bayLengthM)||2.57),start=Math.max(0,Math.min(e.length-bay,(Number(tower.positionM)||bay/2)-bay/2)),offset=.82,width=Math.max(1.4,Number(tower.widthM)||1.4),top=Math.ceil(Math.max(.5,Number(tower.targetHeightM)||20)/2)*2;return [0,bay].flatMap((along)=>[offset,offset+width].flatMap((depth)=>[0,top].map((z)=>[e.point[0]+ux*(start+along)+out[0]*depth,e.point[1]+uy*(start+along)+out[1]*depth,z])));});
    const protectionEnvelope=[...(config.platformLevels||[]).flatMap((level)=>[at(0,.79,liftHeight*Number(level)+1),at(modeled,.79,liftHeight*Number(level)+1)]),...(config.facadeScaffolds||[]).flatMap((plan)=>{const e=edges[Number(plan.index)];if(!e)return[];const dx=e.next[0]-e.point[0],dy=e.next[1]-e.point[1],length=Math.max(e.length,.001),ux=dx/length,uy=dy/length,out=area>0?[uy,-ux]:[-uy,ux],heightPerLift=Number(plan.liftHeight)||2,modeledLength=Number(plan.modeledLengthM)||0;return (plan.platformLevels||[]).flatMap((level)=>[[e.point[0]+out[0]*.79,e.point[1]+out[1]*.79,heightPerLift*Number(level)+1],[e.point[0]+ux*modeledLength+out[0]*.79,e.point[1]+uy*modeledLength+out[1]*.79,heightPerLift*Number(level)+1]]);})];
    const terrainSamples=Array.isArray(config.terrainSamples)?config.terrainSamples:[],terrainCell=Math.max(.25,Number(config.terrainCellSizeM)||2),terrainHalf=terrainCell/2,terrainBase=Number(config.terrainReferenceElevationM)||0,terrainEnvelope=terrainSamples.flatMap(([x,y,z])=>{const lx=Number(x)-minX,ly=Number(y)-minY,dz=Number(z)-terrainBase;return [[lx-terrainHalf,ly-terrainHalf,dz],[lx+terrainHalf,ly-terrainHalf,dz],[lx+terrainHalf,ly+terrainHalf,dz],[lx-terrainHalf,ly+terrainHalf,dz]];});
    const points=[...terrainEnvelope,...ring.map(([x,y])=>[x,y,0]),...ring.map(([x,y])=>[x,y,height]),...Array.from({length:bays+1},(_,i)=>[...at(bayX(i),.77,scaffoldHeight)]),...protectionEnvelope,...towerEnvelope];
    const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const project=(p)=>{const x=c*p[0]-s*p[1],y=s*p[0]+c*p[1];return {x,y:y*cp-p[2]*sp,z:y*sp+p[2]*cp};};
    const projected=points.map(project), minU=Math.min(...projected.map(p=>p.x)), maxU=Math.max(...projected.map(p=>p.x)), minV=Math.min(...projected.map(p=>p.y)), maxV=Math.max(...projected.map(p=>p.y));
    const margin=22, scale=Math.min((width-2*margin)/Math.max(1,maxU-minU),(heightPx-2*margin)/Math.max(1,maxV-minV))*zoom;
    const sx=(x)=>(width-(maxU-minU)*scale)/2+(x-minU)*scale, sy=(y)=>(heightPx-(maxV-minV)*scale)/2+(y-minV)*scale;
    const faceMarkup=edges.map(({point,next,length,index})=>{const roofRole=(config.kederSelectedFacadeIndexes||[]).indexOf(index),isRoofSide=roofRole>=0,isScaffoldSide=(config.facadeScaffolds||[]).some((plan)=>plan.index===index),verts=[project([point[0],point[1],0]),project([next[0],next[1],0]),project([next[0],next[1],height]),project([point[0],point[1],height])], depth=verts.reduce((sum,p)=>sum+p.z,0)/4, coords=verts.map(p=>`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' '), color=roofRole===0?'#f0a64b':roofRole===1?'#5db7a4':isScaffoldSide?'#67b68f':index===selected?'#f0a64b':index%2?'#adc3d6':'#8da9c1',direction=JSON.stringify([next[0]-point[0],next[1]-point[1]]);return {depth,html:`<polygon class="scaffold-svg-facade${index===selected||isRoofSide||isScaffoldSide?' selected':''}" points="${coords}" fill="${color}" fill-opacity=".86" stroke="#536b7b" stroke-width="1" data-facade-index="${index}" data-facade="Julkisivu ${index+1}" data-edge-length="${length}" data-edge-screen-start="${sx(verts[0].x).toFixed(2)},${sy(verts[0].y).toFixed(2)}" data-edge-screen-end="${sx(verts[1].x).toFixed(2)},${sy(verts[1].y).toFixed(2)}" data-facade-direction='${direction}' tabindex="0" role="button" aria-pressed="${index===selected||isRoofSide||isScaffoldSide?'true':'false'}" aria-label="Valitse julkisivu ${index+1}, ${length.toFixed(2)} metriä"><title>Julkisivu ${index+1} · ${length.toFixed(2)} m${roofRole===0?' · sääsuoja A':roofRole===1?' · sääsuoja B':isScaffoldSide?' · oma teline':''}</title></polygon>`};});
    const layers=[...faceMarkup];
    for(const [sourceX,sourceY,elevation,bandIndex=2] of terrainSamples){
      const x=Number(sourceX)-minX,y=Number(sourceY)-minY,z=Number(elevation)-terrainBase,half=terrainHalf,vertices=[[x-half,y-half,z],[x+half,y-half,z],[x+half,y+half,z],[x-half,y+half,z]].map(project),depth=vertices.reduce((sum,point)=>sum+point.z,0)/vertices.length,color=['#e49a3a','#41a78b','#4886bd'][Math.max(0,Math.min(2,Number(bandIndex)||0))];
      layers.push({depth,html:`<polygon points="${vertices.map(point=>`${sx(point.x).toFixed(1)},${sy(point.y).toFixed(1)}`).join(' ')}" fill="${color}" fill-opacity=".52" stroke="${color}" stroke-opacity=".45" stroke-width=".25"><title>Maaston korkeus ${Number(elevation).toFixed(2)} m · etäisyysluokka ${Number(bandIndex)===0?'0–2 m':Number(bandIndex)===1?'2–5 m':'5–10 m'}</title></polygon>`});
    }
    const roof=ring.map(([x,y])=>project([x,y,height])); layers.push({depth:roof.reduce((sum,p)=>sum+p.z,0)/roof.length,html:`<polygon points="${roof.map(p=>`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')}" fill="#718da8" stroke="#536b7b" stroke-width="1"/>`});
    const line=(a,b,color='#3976aa',w=2)=>{const p=project(a),q=project(b);return {depth:(p.z+q.z)/2,html:`<line class="scaffold-svg-structure" x1="${sx(p.x).toFixed(1)}" y1="${sy(p.y).toFixed(1)}" x2="${sx(q.x).toFixed(1)}" y2="${sy(q.y).toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`};};
    const platformProtectionLayers=(positionAt,levels,platformLift,platformLifts,starts,lengths,system)=>{for(const rawLevel of levels||[]){const level=Number(rawLevel);if(!Number.isFinite(level)||level<1||level>platformLifts)continue;const z=level*platformLift;for(let bay=0;bay<lengths.length;bay++){const start=Number(starts[bay])||0,length=Number(lengths[bay])||0,end=start+length;if(length<=0)continue;for(const railHeight of [.5,1])layers.push(line(positionAt(start,.77,z+railHeight),positionAt(end,.77,z+railHeight),'#13795f',2.6));if(hasCompatibleToeBoard(system,length)){const corners=[positionAt(start,.79,z),positionAt(end,.79,z),positionAt(end,.79,z+.15),positionAt(start,.79,z+.15)].map(project),depth=corners.reduce((sum,p)=>sum+p.z,0)/4;layers.push({depth,html:`<polygon class="scaffold-svg-toeboard" points="${corners.map((p)=>`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')}" fill="#c7962c" stroke="#805f1c" stroke-width=".55"/>`});}}}};
    const activeFacadePlan=(config.facadeScaffolds||[]).some((plan)=>plan.index===selected);
    if(bays>0&&(!(config.facadeScaffolds||[]).length||activeFacadePlan)){
      for(let bay=0;bay<=bays;bay++)for(const offset of [.2,.77])layers.push(line(at(bayX(bay),offset,0),at(bayX(bay),offset,scaffoldHeight),'#13795f',2.2));
      for(let level=0;level<=lifts;level++){const z=Math.min(scaffoldHeight,liftHeight*level);for(const offset of [.2,.77])for(let bay=0;bay<bays;bay++)layers.push(line(at(bayX(bay),offset,z),at(bayX(bay)+bayLengths[bay],offset,z)));for(let bay=0;bay<=bays;bay++)layers.push(line(at(bayX(bay),.2,z),at(bayX(bay),.77,z)));if(level<lifts)for(const bay of config.braceBayIndexes||[])layers.push(line(at(bayX(bay),.77,z),at(bayX(bay)+bayLengths[bay],.77,Math.min(scaffoldHeight,liftHeight*(level+1))),'#c7782d',2));}
      for(const level of config.platformLevels||[]){if(!Number.isFinite(Number(level))||Number(level)<1||Number(level)>lifts)continue;const z=Math.min(scaffoldHeight,liftHeight*Number(level));for(let bay=0;bay<bays;bay++){const start=bayX(bay),end=start+bayLengths[bay],verts=[at(start,.2,z),at(end,.2,z),at(end,.77,z),at(start,.77,z)].map(project),depth=verts.reduce((sum,p)=>sum+p.z,0)/4;layers.push({depth,html:`<polygon class="scaffold-svg-structure" points="${verts.map(p=>`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')}" fill="#e1a935" fill-opacity=".78" stroke="#a7770e" stroke-width=".5"/>`});}}
      if(supportsPlatformProtection(config.platformGuardrailSystem))platformProtectionLayers(at,config.platformLevels,liftHeight,lifts,bayStarts,bayLengths,config.platformGuardrailSystem);
    }
    for(const plan of config.facadeScaffolds||[]){
      if(plan.index===selected||!edges[plan.index])continue;
      const planEdge=edges[plan.index],pdX=planEdge.next[0]-planEdge.point[0],pdY=planEdge.next[1]-planEdge.point[1],pLength=Math.max(planEdge.length,.001),pUx=pdX/pLength,pUy=pdY/pLength,pOut=area>0?[pUy,-pUx]:[-pUy,pUx],pAt=(along,offset,z)=>[planEdge.point[0]+pUx*along+pOut[0]*offset,planEdge.point[1]+pUy*along+pOut[1]*offset,z],pBays=Math.max(0,Number(plan.bays)||0),pModelLength=Math.max(0,Number(plan.modeledLengthM)||0),pStarts=Array.isArray(plan.bayStarts)?plan.bayStarts:[],pLengths=Array.isArray(plan.bayLengths)?plan.bayLengths:[],pX=(index)=>pStarts[index]??pModelLength,pHeight=Math.max(0,Number(plan.scaffoldHeight)||0),pLifts=Math.max(0,Number(plan.lifts)||0),pLift=Number(plan.liftHeight)||2;
      if(pBays<1||pHeight<0.5)continue;
      for(let bay=0;bay<=pBays;bay++)for(const offset of [.2,.77])layers.push(line(pAt(pX(bay),offset,0),pAt(pX(bay),offset,pHeight),'#13795f',2.2));
      for(let level=0;level<=pLifts;level++){const z=Math.min(pHeight,pLift*level);for(const offset of [.2,.77])for(let bay=0;bay<pBays;bay++)layers.push(line(pAt(pX(bay),offset,z),pAt(pX(bay)+(pLengths[bay]||0),offset,z),'#3976aa',1.8));for(let bay=0;bay<=pBays;bay++)layers.push(line(pAt(pX(bay),.2,z),pAt(pX(bay),.77,z),'#3976aa',1.8));if(level<pLifts)for(const bay of plan.braceBayIndexes||[])layers.push(line(pAt(pX(bay),.77,z),pAt(pX(bay)+(pLengths[bay]||0),.77,Math.min(pHeight,pLift*(level+1))),'#c7782d',1.8));}
      for(const level of plan.platformLevels||[]){if(!Number.isFinite(Number(level))||Number(level)<1||Number(level)>pLifts)continue;const z=Math.min(pHeight,pLift*Number(level));for(let bay=0;bay<pBays;bay++){const start=pX(bay),end=start+(pLengths[bay]||0),verts=[pAt(start,.2,z),pAt(end,.2,z),pAt(end,.77,z),pAt(start,.77,z)].map(project),depth=verts.reduce((sum,p)=>sum+p.z,0)/4;layers.push({depth,html:`<polygon class="scaffold-svg-structure" points="${verts.map(p=>`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')}" fill="#e1a935" fill-opacity=".78" stroke="#a7770e" stroke-width=".5"/>`});}}
      if(supportsPlatformProtection(plan.system))platformProtectionLayers(pAt,plan.platformLevels,pLift,pLifts,pStarts,pLengths,plan.system);
    }
    for(const tower of config.stairTowers||[]){
      const towerEdge=edges[Number(tower.index)];if(!towerEdge)continue;
      const tdx=towerEdge.next[0]-towerEdge.point[0],tdy=towerEdge.next[1]-towerEdge.point[1],tLength=Math.max(towerEdge.length,.001),tUx=tdx/tLength,tUy=tdy/tLength,tOut=area>0?[tUy,-tUx]:[-tUy,tUx],tBay=Math.max(.1,Number(tower.bayLengthM)||2.57),tStart=Math.max(0,Math.min(towerEdge.length-tBay,(Number(tower.positionM)||tBay/2)-tBay/2)),tOffset=.82,tWidth=Math.max(1.4,Number(tower.widthM)||1.4),tHeight=Math.ceil(Math.max(.5,Number(tower.targetHeightM)||20)/2)*2,tLifts=Math.ceil(tHeight/2),tAt=(along,depth,z)=>[towerEdge.point[0]+tUx*along+tOut[0]*depth,towerEdge.point[1]+tUy*along+tOut[1]*depth,z],x0=tStart,x1=tStart+tBay,y0=tOffset,y1=tOffset+tWidth;
      for(const along of [x0,x1])for(const depth of [y0,y1])layers.push(line(tAt(along,depth,0),tAt(along,depth,tHeight),'#ac5f42',2.8));
      for(let level=0;level<=tLifts;level++){const z=Math.min(tHeight,level*2);for(const depth of [y0,y1])layers.push(line(tAt(x0,depth,z),tAt(x1,depth,z),'#b76a47',2));for(const along of [x0,x1])layers.push(line(tAt(along,y0,z),tAt(along,y1,z),'#b76a47',2));}
      for(let level=0;level<tLifts;level++){
        const z0=level*2,z1=Math.min(tHeight,z0+2);
        for(const depth of [y0,y1]){layers.push(line(tAt(x0,depth,z0),tAt(x1,depth,z1),'#d58442',1.7));layers.push(line(tAt(x1,depth,z0),tAt(x0,depth,z1),'#d58442',1.7));}
        const forward=level%2===0,stairStart=forward?x0:x1,stairEnd=forward?x1:x0,centerDepth=(y0+y1)/2,sideWidth=.32;
        layers.push(line(tAt(stairStart,centerDepth-sideWidth,z0),tAt(stairEnd,centerDepth-sideWidth,z1),'#596c7b',3));layers.push(line(tAt(stairStart,centerDepth+sideWidth,z0),tAt(stairEnd,centerDepth+sideWidth,z1),'#596c7b',3));
        layers.push(line(tAt(stairStart,centerDepth-sideWidth,z0+1),tAt(stairEnd,centerDepth-sideWidth,z1+1),'#71899a',1.6));layers.push(line(tAt(stairStart,centerDepth+sideWidth,z0+1),tAt(stairEnd,centerDepth+sideWidth,z1+1),'#71899a',1.6));
        for(let step=1;step<=10;step++){const fraction=step/10,along=forward?x0+tBay*fraction:x1-tBay*fraction,z=z0+2*fraction;layers.push(line(tAt(along,centerDepth-sideWidth,z),tAt(along,centerDepth+sideWidth,z),'#d1d9dc',2.2));}
      }
    }
    const kederRoof=config.kederRoof;
    if(kederRoof?.enabled&&edges[kederRoof.facadeAIndex]&&edges[kederRoof.facadeBIndex]&&Number(kederRoof.roofWidthM)>0){
      const a=edges[kederRoof.facadeAIndex],b=edges[kederRoof.facadeBIndex],roofWidth=Number(kederRoof.roofWidthM),roofLength=Math.max(.01,Number(kederRoof.roofLengthM)||0),eaveZ=Math.max(Number(kederRoof.eaveHeightM)||0,1),rise=Math.max(0,Number(kederRoof.roofRiseM)||0);
      let aStart=a.point,aEnd=a.next,bStart=b.point,bEnd=b.next;if((aEnd[0]-aStart[0])*(bEnd[0]-bStart[0])+(aEnd[1]-aStart[1])*(bEnd[1]-bStart[1])<0){bStart=b.next;bEnd=b.point;}
      const bayLengths=Array.isArray(kederRoof.roofBayLengthsM)&&kederRoof.roofBayLengthsM.length?kederRoof.roofBayLengthsM.map(Number):[roofLength],positions=[0];for(const length of bayLengths)positions.push(Math.min(roofLength,positions.at(-1)+length));
      const sections=positions.map((distance)=>{const t=Math.max(0,Math.min(1,distance/roofLength)),pa=[aStart[0]+(aEnd[0]-aStart[0])*t,aStart[1]+(aEnd[1]-aStart[1])*t],pb=[bStart[0]+(bEnd[0]-bStart[0])*t,bStart[1]+(bEnd[1]-bStart[1])*t],vx=pb[0]-pa[0],vy=pb[1]-pa[1],span=Math.hypot(vx,vy)||1,ux=vx/span,uy=vy/span,mid=[(pa[0]+pb[0])/2,(pa[1]+pb[1])/2];return {pa,pb,left:[mid[0]-ux*roofWidth/2,mid[1]-uy*roofWidth/2,eaveZ],ridge:[mid[0],mid[1],eaveZ+rise],right:[mid[0]+ux*roofWidth/2,mid[1]+uy*roofWidth/2,eaveZ]};});
      const roofLine=(p,q,color='#87969d',stroke=1.7)=>layers.push(line(p,q,color,stroke));
      sections.forEach((section)=>{roofLine(section.left,section.ridge,'#7d8b91',2.2);roofLine(section.ridge,section.right,'#7d8b91',2.2);roofLine(section.left,section.right,'#3976aa',1.5);roofLine([section.pa[0],section.pa[1],0],[section.pa[0],section.pa[1],eaveZ],'#13795f',2.5);roofLine([section.pb[0],section.pb[1],0],[section.pb[0],section.pb[1],eaveZ],'#13795f',2.5);const divisions=Math.max(3,Math.ceil(roofWidth));for(let i=1;i<divisions;i++){const t=i/divisions,p=[section.left[0]+(section.right[0]-section.left[0])*t,section.left[1]+(section.right[1]-section.left[1])*t,eaveZ+rise*(1-Math.abs(2*t-1))];roofLine(p,[p[0],p[1],eaveZ],'#c7782d',1.1);}});
      for(let bay=0;bay<sections.length-1;bay++){const current=sections[bay],next=sections[bay+1];for(const side of ['left','right']){const c=side==='left'?current.left:current.ridge,d=side==='left'?current.ridge:current.right,e=side==='left'?next.left:next.ridge,f=side==='left'?next.ridge:next.right,points=[c,d,f,e].map(project),depth=points.reduce((sum,p)=>sum+p.z,0)/4;layers.push({depth,html:`<polygon points="${points.map(p=>`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')}" fill="#fff" fill-opacity=".55" stroke="#c4cdd0" stroke-width=".45"/>`});}
        const length=Number(kederRoof.roofBayLengthsM?.[bay])||roofLength/Math.max(1,sections.length-1),labelAt=[(current.left[0]+next.left[0])/2,(current.left[1]+next.left[1])/2,eaveZ+.12],label=project(labelAt);layers.push({depth:label.z+.01,html:`<text x="${sx(label.x).toFixed(1)}" y="${sy(label.y).toFixed(1)}" text-anchor="middle" fill="#263c45" stroke="#fff" stroke-width="2.5" paint-order="stroke" font-size="11">${length.toFixed(2)} m</text>`});
        const divisions=Math.max(1,Math.ceil((Number(kederRoof.slopeLengthM)||roofWidth/2)/(kederRoof.bracingVariant==='heavy'?1:2)));for(let n=0;n<=divisions;n++){const t=n/divisions;for(const side of ['left','right']){const currentPoint=side==='left'?[current.left[0]+(current.ridge[0]-current.left[0])*t,current.left[1]+(current.ridge[1]-current.left[1])*t,current.left[2]+(current.ridge[2]-current.left[2])*t]:[current.right[0]+(current.ridge[0]-current.right[0])*t,current.right[1]+(current.ridge[1]-current.right[1])*t,current.right[2]+(current.ridge[2]-current.right[2])*t],nextPoint=side==='left'?[next.left[0]+(next.ridge[0]-next.left[0])*t,next.left[1]+(next.ridge[1]-next.left[1])*t,next.left[2]+(next.ridge[2]-next.left[2])*t]:[next.right[0]+(next.ridge[0]-next.right[0])*t,next.right[1]+(next.ridge[1]-next.right[1])*t,next.right[2]+(next.ridge[2]-next.right[2])*t];roofLine(currentPoint,nextPoint,'#c7782d',1.1);}}
      }
    }
    layers.sort((a,b)=>a.depth-b.depth);
    svg.setAttribute('viewBox',`0 0 ${width} ${heightPx}`); svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.innerHTML=`<rect width="${width}" height="${heightPx}" fill="#e9f0f0"/>${layers.map(item=>item.html).join('')}`;
  };
  svg.addEventListener('pointerdown',(event)=>{dragging={x:event.clientX,y:event.clientY,moved:false,target:event.target.closest?.('[data-facade-index]')||null};});
  svg.addEventListener('pointermove',(event)=>{if(!dragging)return;const dx=event.clientX-dragging.x,dy=event.clientY-dragging.y;if(Math.abs(dx)+Math.abs(dy)>2&&!dragging.moved){dragging.moved=true;try{svg.setPointerCapture(event.pointerId);}catch{}}yaw-=dx*.008;pitch=Math.max(.15,Math.min(1.45,pitch+dy*.008));dragging.x=event.clientX;dragging.y=event.clientY;render();});
  svg.addEventListener('pointerup',(event)=>{if(dragging?.moved){svg.dataset.dragged='true';setTimeout(()=>delete svg.dataset.dragged,0);}else if(dragging?.target){const face=dragging.target;try{const start=(face.dataset.edgeScreenStart||'').split(',').map(Number),end=(face.dataset.edgeScreenEnd||'').split(',').map(Number),svgPoint=svg.createSVGPoint();svgPoint.x=event.clientX;svgPoint.y=event.clientY;const local=svgPoint.matrixTransform(face.getScreenCTM().inverse()),dx=end[0]-start[0],dy=end[1]-start[1],denominator=dx*dx+dy*dy,fraction=denominator?Math.max(0,Math.min(1,((local.x-start[0])*dx+(local.y-start[1])*dy)/denominator)):0;face.dataset.edgePositionM=String(fraction*(Number(face.dataset.edgeLength)||0));}catch{delete face.dataset.edgePositionM;}face.click();setTimeout(()=>delete face.dataset.edgePositionM,0);}dragging=null;});
  svg.addEventListener('click',(event)=>{if(svg.dataset.dragged){event.preventDefault();event.stopPropagation();}});
  svg.addEventListener('keydown',(event)=>{const face=event.target.closest?.('[data-facade-index]');if(!face||!['Enter',' '].includes(event.key))return;event.preventDefault();face.click();});
  svg.addEventListener('wheel',(event)=>{event.preventDefault();zoom=Math.max(.4,Math.min(3,zoom*Math.exp(-event.deltaY*.001)));render();},{passive:false});
  const resize=new ResizeObserver(render);resize.observe(container);
  render();
  return {canvas:svg,update(value){config=value;render();},destroy(){resize.disconnect();}};
}

function createViewer(container) {
  container.innerHTML = '<canvas class="scaffold-webgl-canvas" aria-label="Pyöritettävä rakennuksen ja telineen 3D-malli"></canvas><div class="scaffold-3d-help">Vedä pyörittääksesi · vieritä zoomataksesi · klikkaa julkisivua valitaksesi</div>';
  const canvas = container.querySelector('canvas');
  const help = container.querySelector('.scaffold-3d-help');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch { return createSvgViewer(container); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xe9f0f0, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 10000);
  camera.up.set(0, 0, 1);
  const controls = { theta: -0.8, phi: 1.08, radius: 42, target: new THREE.Vector3() };
  const lights = new THREE.Group();
  lights.add(new THREE.HemisphereLight(0xffffff, 0x647784, 2.0));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(-30, -25, 45); lights.add(sun); scene.add(lights);
  const grid = new THREE.GridHelper(200, 40, 0x8ba3a0, 0xc5d1ce);
  grid.rotation.x = Math.PI / 2; grid.position.z = -0.04; scene.add(grid);
  const model = new THREE.Group(); scene.add(model);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragging = null;
  let minimumFacadeLengthM = 0;
  let clickFacade = null;
  let modelUpdateId = 0;
  const updateCamera = () => {
    controls.phi = Math.max(0.15, Math.min(Math.PI - 0.15, controls.phi));
    const { theta, phi, radius, target } = controls;
    camera.position.set(target.x + radius * Math.sin(phi) * Math.cos(theta), target.y + radius * Math.sin(phi) * Math.sin(theta), target.z + radius * Math.cos(phi));
    camera.lookAt(target);
  };
  const onPointerDown = (event) => { dragging = { x: event.clientX, y: event.clientY, moved: false }; canvas.setPointerCapture(event.pointerId); };
  const onPointerMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragging.moved = true;
    controls.theta -= dx * 0.008; controls.phi += dy * 0.008;
    dragging.x = event.clientX; dragging.y = event.clientY; updateCamera();
  };
  const onPointerUp = (event) => {
    if (dragging && !dragging.moved) {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const facadeHits = raycaster.intersectObjects(model.children, true).filter((item) => Number.isInteger(item.object.userData.facadeIndex));
      const hit = facadeHits.find((item) => Number(item.object.userData.edgeLength) >= minimumFacadeLengthM - 0.001);
      if (hit) {
        canvas.dataset.facadeIndex = String(hit.object.userData.facadeIndex);
        canvas.dataset.facade = hit.object.userData.facade;
        canvas.dataset.edgeLength = String(hit.object.userData.edgeLength);
        canvas.dataset.facadeDirection = JSON.stringify(hit.object.userData.direction);
        const start=hit.object.userData.start||[0,0],end=hit.object.userData.end||[start[0]+Number(hit.object.userData.edgeLength||0),start[1]],dx=end[0]-start[0],dy=end[1]-start[1],denominator=dx*dx+dy*dy,fraction=denominator?Math.max(0,Math.min(1,((hit.point.x-start[0])*dx+(hit.point.y-start[1])*dy)/denominator)):0;
        canvas.dataset.edgePositionM=String(fraction*Number(hit.object.userData.edgeLength||0));
        canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        delete canvas.dataset.facadeIndex;
        delete canvas.dataset.facade;
        delete canvas.dataset.edgeLength;
        delete canvas.dataset.facadeDirection;
        delete canvas.dataset.edgePositionM;
      } else if (facadeHits.length) {
        canvas.dataset.facadeError = `Valittu reuna on ${Number(facadeHits[0].object.userData.edgeLength).toFixed(2)} m. 3D-klikkaus vaatii vähintään yhden ${minimumFacadeLengthM.toFixed(2)} m kentän; valitse sivu mittalistasta, jos haluat tarkastella sitä.`;
        canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        delete canvas.dataset.facadeError;
      }
    }
    dragging = null;
  };
  const onWheel = (event) => { event.preventDefault(); controls.radius = Math.max(5, Math.min(500, controls.radius * Math.exp(event.deltaY * 0.001))); updateCamera(); };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', () => { dragging = null; });
  canvas.addEventListener('wheel', onWheel, { passive: false });
  const resize = new ResizeObserver(() => {
    const width = Math.max(1, container.clientWidth), height = Math.max(240, container.clientHeight);
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  });
  resize.observe(container);
  let frameId;
  const animate = () => { frameId = requestAnimationFrame(animate); renderer.render(scene, camera); };
  animate(); updateCamera();
  return {
    canvas,
    update(config) {
      const updateId = ++modelUpdateId;
      dispose(model);
      minimumFacadeLengthM = Math.max(0, Number(config.minimumFacadeLengthM) || 0);
      const sourceRing = Array.isArray(config.footprint) && config.footprint.length >= 3 ? config.footprint : [[0,0],[config.targetLength,0],[config.targetLength,config.depth],[0,config.depth]];
      const ring = sourceRing.map(([x,y]) => [Number(x), Number(y)]);
      const minX = Math.min(...ring.map((p) => p[0])), minY = Math.min(...ring.map((p) => p[1]));
      const local = ring.map(([x,y]) => [x-minX,y-minY]);
      const height = Math.max(1, Number(config.buildingHeight) || 1);
      const area = local.reduce((sum, point, index) => { const next = local[(index+1)%local.length]; return sum + point[0]*next[1] - next[0]*point[1]; }, 0);
      const selected = Number.isInteger(config.facadeIndex) && config.facadeIndex >= 0 && config.facadeIndex < local.length ? config.facadeIndex : -1;
      const walls = new THREE.Group();
      const edges = local.map((point, index) => {
        const next = local[(index+1)%local.length];
        const length = Math.hypot(next[0]-point[0], next[1]-point[1]);
        const roofRole=(config.kederSelectedFacadeIndexes||[]).indexOf(index),material = new THREE.MeshStandardMaterial({ color: roofRole===0?0xf0a64b:roofRole===1?0x5db7a4:index === selected ? 0xf0a64b : (index%2 ? 0xaec2d4 : 0x8faac3), roughness: 0.82, side: THREE.DoubleSide, transparent: true, opacity: 0.84 });
        const vertices = new Float32Array([point[0],point[1],0,next[0],next[1],0,next[0],next[1],height,point[0],point[1],height]);
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(vertices,3)); geometry.setIndex([0,1,2,0,2,3]); geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material); mesh.userData = { facadeIndex:index, facade:`Julkisivu ${index+1}`, edgeLength:length, direction:[next[0]-point[0],next[1]-point[1]], start:[...point], end:[...next] };
        walls.add(mesh);
        return { point, next, length };
      });
      model.add(walls);
      const roofShape = new THREE.Shape(); roofShape.moveTo(local[0][0],local[0][1]); for (const point of local.slice(1)) roofShape.lineTo(point[0],point[1]); roofShape.closePath();
      const roofGeometry = new THREE.ShapeGeometry(roofShape); roofGeometry.rotateX(0); roofGeometry.translate(0,0,height);
      model.add(new THREE.Mesh(roofGeometry, new THREE.MeshStandardMaterial({ color:0x718da8, side:THREE.DoubleSide, roughness:0.8 })));
      if (Array.isArray(config.terrainSamples) && config.terrainSamples.length) {
        const positions = [], colors = [], cell = Math.max(0.25, Number(config.terrainCellSizeM) || 2), half = cell / 2, baseline = Number(config.terrainReferenceElevationM) || 0;
        const palette = [new THREE.Color('#e49a3a'), new THREE.Color('#41a78b'), new THREE.Color('#4886bd')];
        for (const [sourceX, sourceY, elevation, bandIndex = 2] of config.terrainSamples) {
          const x = Number(sourceX) - minX, y = Number(sourceY) - minY, z = Number(elevation) - baseline;
          const a = [x - half, y - half, z], b = [x + half, y - half, z], c = [x + half, y + half, z], d = [x - half, y + half, z];
          positions.push(...a, ...b, ...c, ...a, ...c, ...d);
          const color = palette[Math.max(0, Math.min(2, Number(bandIndex) || 0))];
          for (let vertex = 0; vertex < 6; vertex += 1) colors.push(color.r, color.g, color.b);
        }
        const terrainGeometry = new THREE.BufferGeometry();
        terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        terrainGeometry.computeVertexNormals();
        model.add(new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1, transparent: true, opacity: 0.86 })));
      }
      const facadeIndex = selected >= 0 ? selected : edges.reduce((best, edge, index) => edge.length > edges[best].length ? index : best, 0);
      const edge = edges[facadeIndex], dx=edge.next[0]-edge.point[0], dy=edge.next[1]-edge.point[1], edgeLen=Math.max(edge.length,0.001), ux=dx/edgeLen, uy=dy/edgeLen;
      const outward = area > 0 ? [uy,-ux] : [-uy,ux];
      // Start outside the selected facade so the scaffold frame is not hidden
      // behind the building mass when a map polygon has an arbitrary winding.
      controls.theta = Math.atan2(outward[1], outward[0]);
      const bayLength = Math.max(0.1, Number(config.bayLength)||3.05), configuredBays=Number(config.bays), bays=Number.isInteger(configuredBays)&&configuredBays>=0?configuredBays:Math.max(1,Math.ceil(Number(config.targetLength||edgeLen)/bayLength));
      const configuredLength=Number(config.modeledLength),modeled=Number.isFinite(configuredLength)?Math.max(0,configuredLength):Math.max(0,Number(config.targetLength||edgeLen)),scaffoldHeight = Math.max(0.5, Number(config.scaffoldHeight)||height),bayStarts=config.bayStarts||Array.from({length:bays},(_,i)=>i*modeled/Math.max(1,bays)),bayLengths=config.bayLengths||Array.from({length:bays},(_,i)=>bayStarts[i+1]!=null?bayStarts[i+1]-bayStarts[i]:modeled/Math.max(1,bays)),bayX=(i)=>bayStarts[i]??modeled;
      const green = new THREE.MeshStandardMaterial({ color:0x13795f, roughness:0.58 });
      const blue = new THREE.MeshStandardMaterial({ color:0x3976aa, roughness:0.62 });
      const gold = new THREE.MeshStandardMaterial({ color:0xe1a935, roughness:0.6 });
      const toeBoardMaterial = new THREE.MeshStandardMaterial({ color:0xc7962c, metalness:0.4, roughness:0.58, side:THREE.DoubleSide });
      const at = (along, offset, z) => [edge.point[0]+ux*along+outward[0]*offset,edge.point[1]+uy*along+outward[1]*offset,z];
      const lifts = Math.max(1,Number(config.lifts)||Math.ceil(scaffoldHeight/2));
      const liftHeight = Number(config.liftHeight)||scaffoldHeight/lifts;
      const activeFacadePlan=config.facadeScaffolds?.some((plan)=>plan.index===facadeIndex);
      if(bays>0&&(!config.facadeScaffolds?.length||activeFacadePlan)){
        for (let bay=0; bay<=bays; bay++) for (const offset of [0.2,0.77]) makeTube(model,at(bayX(bay),offset,0),at(bayX(bay),offset,scaffoldHeight),0.045,green);
        for (let level=0; level<=lifts; level++) {
          const z=Math.min(scaffoldHeight,liftHeight*level);
          for (const offset of [0.2,0.77]) for (let bay=0;bay<bays;bay++) makeTube(model,at(bayX(bay),offset,z),at(bayX(bay)+bayLengths[bay],offset,z),0.032,blue);
          for (let bay=0;bay<=bays;bay++) makeTube(model,at(bayX(bay),0.2,z),at(bayX(bay),0.77,z),0.032,blue);
          if(level<lifts)for(const bay of config.braceBayIndexes||[])makeTube(model,at(bayX(bay),0.77,z),at(bayX(bay)+bayLengths[bay],0.77,Math.min(scaffoldHeight,liftHeight*(level+1))),0.025,new THREE.MeshStandardMaterial({color:0xc7782d}));
        }
        for (const level of config.platformLevels || []) {
          if (!Number.isFinite(Number(level)) || Number(level) < 1 || Number(level) > lifts) continue;
          const z=Math.min(scaffoldHeight,liftHeight*Number(level));
          for(let bay=0;bay<bays;bay++){
            const start=bayX(bay),end=start+bayLengths[bay],p=at(start,0.2,z),q=at(end,0.2,z),r=at(end,0.77,z),s=at(start,0.77,z);
            const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([...p,...q,...r,...p,...r,...s],3));geometry.computeVertexNormals();model.add(new THREE.Mesh(geometry,gold));
          }
        }
        if(supportsPlatformProtection(config.platformGuardrailSystem))addPlatformProtection(model,at,config.platformLevels,liftHeight,lifts,bayStarts,bayLengths,green,toeBoardMaterial,config.platformGuardrailSystem);
      }
      for(const plan of config.facadeScaffolds||[]){
        if(plan.index===facadeIndex||!edges[plan.index])continue;
        const planEdge=edges[plan.index],planDx=planEdge.next[0]-planEdge.point[0],planDy=planEdge.next[1]-planEdge.point[1],planLength=Math.max(planEdge.length,.001),planUx=planDx/planLength,planUy=planDy/planLength,planOutward=area>0?[planUy,-planUx]:[-planUy,planUx],planAt=(along,offset,z)=>[planEdge.point[0]+planUx*along+planOutward[0]*offset,planEdge.point[1]+planUy*along+planOutward[1]*offset,z],planBays=Math.max(0,Number(plan.bays)||0),planModelLength=Math.max(0,Number(plan.modeledLengthM)||0),planStarts=Array.isArray(plan.bayStarts)?plan.bayStarts:[],planLengths=Array.isArray(plan.bayLengths)?plan.bayLengths:[],planX=(index)=>planStarts[index]??planModelLength,planHeight=Math.max(0,Number(plan.scaffoldHeight)||0),planLifts=Math.max(0,Number(plan.lifts)||0),planLift=Number(plan.liftHeight)||2;
        if(planBays<1||planHeight<0.5)continue;
        for(let bay=0;bay<=planBays;bay++)for(const offset of [0.2,0.77])makeTube(model,planAt(planX(bay),offset,0),planAt(planX(bay),offset,planHeight),0.043,green);
        for(let level=0;level<=planLifts;level++){
          const z=Math.min(planHeight,planLift*level);
          for(const offset of [0.2,0.77])for(let bay=0;bay<planBays;bay++)makeTube(model,planAt(planX(bay),offset,z),planAt(planX(bay)+(planLengths[bay]||0),offset,z),0.03,blue);
          for(let bay=0;bay<=planBays;bay++)makeTube(model,planAt(planX(bay),0.2,z),planAt(planX(bay),0.77,z),0.03,blue);
          if(level<planLifts)for(const bay of plan.braceBayIndexes||[])makeTube(model,planAt(planX(bay),0.77,z),planAt(planX(bay)+(planLengths[bay]||0),0.77,Math.min(planHeight,planLift*(level+1))),0.023,gold);
        }
        for(const level of plan.platformLevels||[]){
          const z=Math.min(planHeight,planLift*Number(level));
          if(!Number.isFinite(z)||Number(level)<1||Number(level)>planLifts)continue;
          for(let bay=0;bay<planBays;bay++){
            const start=planX(bay),end=start+(planLengths[bay]||0),p=planAt(start,0.2,z),q=planAt(end,0.2,z),r=planAt(end,0.77,z),s=planAt(start,0.77,z);
            const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([...p,...q,...r,...p,...r,...s],3));geometry.computeVertexNormals();model.add(new THREE.Mesh(geometry,gold));
          }
        }
        if(supportsPlatformProtection(plan.system))addPlatformProtection(model,planAt,plan.platformLevels,planLift,planLifts,planStarts,planLengths,green,toeBoardMaterial,plan.system);
      }
      for(const tower of config.stairTowers||[]){
        const edge=edges[Number(tower.index)];if(!edge)continue;
        const dx=edge.next[0]-edge.point[0],dy=edge.next[1]-edge.point[1],edgeLength=Math.max(edge.length,.001),ux=dx/edgeLength,uy=dy/edgeLength,outward=area>0?[uy,-ux]:[-uy,ux],bay=Math.max(.1,Number(tower.bayLengthM)||2.57),start=Math.max(0,Math.min(edge.length-bay,(Number(tower.positionM)||bay/2)-bay/2)),offset=.82,width=Math.max(1.4,Number(tower.widthM)||1.4),height=Math.ceil(Math.max(.5,Number(tower.targetHeightM)||20)/2)*2,lifts=Math.ceil(height/2),left=start,right=start+bay,near=offset,far=offset+width;
        const towerAt=(along,depth,z)=>[edge.point[0]+ux*along+outward[0]*depth,edge.point[1]+uy*along+outward[1]*depth,z],frame=new THREE.MeshStandardMaterial({color:0xb76645,metalness:.48,roughness:.5}),brace=new THREE.MeshStandardMaterial({color:0xd48a48,metalness:.42,roughness:.5}),stair=new THREE.MeshStandardMaterial({color:0xb9c5cb,metalness:.6,roughness:.4});
        for(const along of [left,right])for(const depth of [near,far])makeTube(model,towerAt(along,depth,0),towerAt(along,depth,height),.038,frame);
        for(let level=0;level<=lifts;level++){const z=Math.min(height,level*2);for(const depth of [near,far])makeTube(model,towerAt(left,depth,z),towerAt(right,depth,z),.028,frame);for(const along of [left,right])makeTube(model,towerAt(along,near,z),towerAt(along,far,z),.028,frame);if(level>0){const p0=towerAt(left,near,z),p1=towerAt(right,near,z),p2=towerAt(right,far,z),p3=towerAt(left,far,z),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([...p0,...p1,...p2,...p0,...p2,...p3],3));geometry.computeVertexNormals();model.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xd7dfe1,metalness:.42,roughness:.58,side:THREE.DoubleSide})));}}
        for(let level=0;level<lifts;level++){
          const z0=level*2,z1=Math.min(height,z0+2);for(const depth of [near,far]){makeTube(model,towerAt(left,depth,z0),towerAt(right,depth,z1),.022,brace);makeTube(model,towerAt(right,depth,z0),towerAt(left,depth,z1),.022,brace);}
          const forward=level%2===0,stairStart=forward?left:right,stairEnd=forward?right:left,center=(near+far)/2,side=.32;
          for(const offsetSide of [center-side,center+side]){makeTube(model,towerAt(stairStart,offsetSide,z0),towerAt(stairEnd,offsetSide,z1),.025,stair);makeTube(model,towerAt(stairStart,offsetSide,z0+1),towerAt(stairEnd,offsetSide,z1+1),.018,frame);}
          for(let stepIndex=1;stepIndex<=10;stepIndex++){const fraction=stepIndex/10,along=forward?left+bay*fraction:right-bay*fraction,z=z0+2*fraction;makeTube(model,towerAt(along,center-side,z),towerAt(along,center+side,z),.018,stair);}
        }
      }
      const roof=config.kederRoof;
      if(roof?.enabled&&Number.isInteger(roof.facadeAIndex)&&Number.isInteger(roof.facadeBIndex)&&edges[roof.facadeAIndex]&&edges[roof.facadeBIndex]){
        const a=edges[roof.facadeAIndex],b=edges[roof.facadeBIndex],roofWidth=Math.max(0,Number(roof.roofWidthM)||0),roofLength=Math.max(0,Number(roof.roofLengthM)||0),eaveZ=Math.max(Number(roof.eaveHeightM)||0,1),rise=Math.max(0,Number(roof.roofRiseM)||0);
        if(roofWidth>0&&roofLength>0){
          let aStart=a.point,aEnd=a.next,bStart=b.point,bEnd=b.next;
          const aDx=aEnd[0]-aStart[0],aDy=aEnd[1]-aStart[1],bDx=bEnd[0]-bStart[0],bDy=bEnd[1]-bStart[1];
          if(aDx*bDx+aDy*bDy<0){bStart=b.next;bEnd=b.point;}
          const bayLengths=Array.isArray(roof.roofBayLengthsM)&&roof.roofBayLengthsM.length?roof.roofBayLengthsM.map(Number):[roofLength];
          const positions=[0];for(const length of bayLengths)positions.push(Math.min(roofLength,positions.at(-1)+length));
          const directionAt=(ratio)=>{
            const t=Math.max(0,Math.min(1,ratio)),pa=[aStart[0]+(aEnd[0]-aStart[0])*t,aStart[1]+(aEnd[1]-aStart[1])*t],pb=[bStart[0]+(bEnd[0]-bStart[0])*t,bStart[1]+(bEnd[1]-bStart[1])*t];
            const vx=pb[0]-pa[0],vy=pb[1]-pa[1],length=Math.hypot(vx,vy)||1,ux=vx/length,uy=vy/length,mid=[(pa[0]+pb[0])/2,(pa[1]+pb[1])/2];
            return {pa,pb,mid,ux,uy,left:[mid[0]-ux*roofWidth/2,mid[1]-uy*roofWidth/2],right:[mid[0]+ux*roofWidth/2,mid[1]+uy*roofWidth/2]};
          };
          const crossSections=positions.map((distance)=>{const section=directionAt(distance/roofLength);return {left:[...section.left,eaveZ],ridge:[...section.mid,eaveZ+rise],right:[...section.right,eaveZ],supportA:[...section.pa,0],supportB:[...section.pb,0],supportTopA:[...section.pa,eaveZ],supportTopB:[...section.pb,eaveZ]};});
          const roofMetal=new THREE.MeshStandardMaterial({color:0x8c9aa0,metalness:.62,roughness:.38}),roofBracing=new THREE.MeshStandardMaterial({color:0xd08737,metalness:.28,roughness:.5}),roofTarp=new THREE.MeshStandardMaterial({color:0xf5f6f4,roughness:.92,transparent:true,opacity:.46,side:THREE.DoubleSide,depthWrite:false});
          const addPanel=(p1,p2,p3,p4)=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([...p1,...p2,...p3,...p1,...p3,...p4],3));geometry.computeVertexNormals();model.add(new THREE.Mesh(geometry,roofTarp));};
          const supportSides=[{index:roof.facadeAIndex,start:aStart,end:aEnd},{index:roof.facadeBIndex,start:bStart,end:bEnd}];
          for(const side of supportSides){
            if(side.index===config.facadeIndex)continue;
            const dx=side.end[0]-side.start[0],dy=side.end[1]-side.start[1],length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length,outward=area>0?[uy,-ux]:[-uy,ux];
            const supportAt=(along,offset,z)=>{const t=Math.max(0,Math.min(1,along/roofLength));return [side.start[0]+dx*t+outward[0]*offset,side.start[1]+dy*t+outward[1]*offset,z];};
            const sideStarts=Array.isArray(config.bayStarts)?config.bayStarts:[0],sideLengths=Array.isArray(config.bayLengths)?config.bayLengths:[];
            const zLevels=Array.from({length:lifts+1},(_,level)=>Math.min(scaffoldHeight,liftHeight*level));if(Math.abs(zLevels.at(-1)-eaveZ)>.01)zLevels.push(eaveZ);
            for(let bay=0;bay<=bays;bay++){const along=bay===bays?modeled:(sideStarts[bay]??bayX(bay));for(const offset of [.2,.77])makeTube(model,supportAt(along,offset,0),supportAt(along,offset,eaveZ),.04,green);}
            for(const z of zLevels){for(const offset of [.2,.77])for(let bay=0;bay<bays;bay++){const start=sideStarts[bay]??bayX(bay),end=start+(sideLengths[bay]??bayLengths[bay]??bayLength);makeTube(model,supportAt(start,offset,z),supportAt(end,offset,z),.03,blue);}for(let bay=0;bay<=bays;bay++){const along=bay===bays?modeled:(sideStarts[bay]??bayX(bay));makeTube(model,supportAt(along,.2,z),supportAt(along,.77,z),.03,blue);}}
            for(const level of config.platformLevels||[]){const z=Math.min(scaffoldHeight,liftHeight*Number(level));for(let bay=0;bay<bays;bay++){const start=sideStarts[bay]??bayX(bay),end=start+(sideLengths[bay]??bayLengths[bay]??bayLength),p=supportAt(start,.2,z),q=supportAt(end,.2,z),r=supportAt(end,.77,z),s=supportAt(start,.77,z),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([...p,...q,...r,...p,...r,...s],3));geometry.computeVertexNormals();model.add(new THREE.Mesh(geometry,gold));}}
            if(supportsPlatformProtection(config.platformGuardrailSystem))addPlatformProtection(model,supportAt,config.platformLevels,liftHeight,lifts,sideStarts,sideLengths.length?sideLengths:bayLengths,green,toeBoardMaterial,config.platformGuardrailSystem);
            for(let level=0;level<lifts;level++)for(const bay of config.braceBayIndexes||[]){const start=sideStarts[bay]??bayX(bay),end=start+(sideLengths[bay]??bayLengths[bay]??bayLength);makeTube(model,supportAt(start,.77,zLevels[level]),supportAt(end,.77,zLevels[Math.min(level+1,zLevels.length-1)]),.022,roofBracing);}
          }
          for(const section of crossSections){
            makeTube(model,section.left,section.ridge,.042,roofMetal);makeTube(model,section.ridge,section.right,.042,roofMetal);makeTube(model,section.left,section.right,.032,blue);
            makeTube(model,section.supportA,section.supportTopA,.04,green);makeTube(model,section.supportB,section.supportTopB,.04,green);
            const divisions=Math.max(3,Math.ceil(roofWidth/1.0));
            for(let division=1;division<divisions;division++){const t=division/divisions,p=[section.left[0]+(section.right[0]-section.left[0])*t,section.left[1]+(section.right[1]-section.left[1])*t,eaveZ+rise*(1-Math.abs(2*t-1))];makeTube(model,p,[p[0],p[1],eaveZ],.022,roofBracing);}
          }
          for(let bay=0;bay<crossSections.length-1;bay++){
            const current=crossSections[bay],next=crossSections[bay+1];
            addPanel(current.left,next.left,next.ridge,current.ridge);addPanel(current.ridge,next.ridge,next.right,current.right);
            const interval=roof.bracingVariant==='heavy'?1:2,stations=Math.max(1,Math.ceil(Number(roof.slopeLengthM||roofWidth/2)/interval));
            for(let station=0;station<=stations;station++){
              const t=station/stations;
              for(const side of ['left','right']){
                const currentPoint=side==='left'?[current.left[0]+(current.ridge[0]-current.left[0])*t,current.left[1]+(current.ridge[1]-current.left[1])*t,current.left[2]+(current.ridge[2]-current.left[2])*t]:[current.right[0]+(current.ridge[0]-current.right[0])*t,current.right[1]+(current.ridge[1]-current.right[1])*t,current.right[2]+(current.ridge[2]-current.right[2])*t];
                const nextPoint=side==='left'?[next.left[0]+(next.ridge[0]-next.left[0])*t,next.left[1]+(next.ridge[1]-next.left[1])*t,next.left[2]+(next.ridge[2]-next.left[2])*t]:[next.right[0]+(next.ridge[0]-next.right[0])*t,next.right[1]+(next.ridge[1]-next.right[1])*t,next.right[2]+(next.ridge[2]-next.right[2])*t];
                makeTube(model,currentPoint,nextPoint,.018,roofBracing);
              }
            }
          }
        }
      }
      const allroundLayouts = [];
      const sourceLayouts = Array.isArray(config.facadeScaffolds) && config.facadeScaffolds.length
        ? config.facadeScaffolds
        : (config.platformGuardrailSystem === 'layher-allround' ? [{
          index: facadeIndex, system: config.platformGuardrailSystem, bays, modeledLengthM: modeled,
          bayStarts, bayLengths, scaffoldHeight, lifts, liftHeight, platformLevels: config.platformLevels,
          braceBayIndexes: config.braceBayIndexes,
        }] : []);
      for (const plan of sourceLayouts) {
        if (plan.system !== 'layher-allround') continue;
        const planEdge = edges[Number(plan.index)];
        const planBays = Math.max(0, Number(plan.bays) || 0), planLength = Math.max(0, Number(plan.modeledLengthM) || 0);
        const planHeight = Math.max(0, Number(plan.scaffoldHeight) || 0), planLifts = Math.max(0, Number(plan.lifts) || 0), planLift = Number(plan.liftHeight) || 2;
        if (!planEdge || planBays < 1 || planHeight < 0.5 || planLifts < 1) continue;
        const dx = planEdge.next[0] - planEdge.point[0], dy = planEdge.next[1] - planEdge.point[1], edgeLength = Math.hypot(dx, dy) || 1;
        const ux = dx / edgeLength, uy = dy / edgeLength, outwardVector = area > 0 ? [uy, -ux] : [-uy, ux];
        const starts = Array.isArray(plan.bayStarts) ? plan.bayStarts.map(Number) : Array.from({ length: planBays }, (_, index) => index * planLength / planBays);
        const lengths = Array.isArray(plan.bayLengths) ? plan.bayLengths.map(Number) : Array.from({ length: planBays }, (_, index) => starts[index + 1] != null ? starts[index + 1] - starts[index] : planLength / planBays);
        if (lengths.length < planBays || starts.length < planBays) continue;
        allroundLayouts.push({
          edge: planEdge, ux, uy, outward: outwardVector, bays: planBays, modeledLength: planLength,
          bayStarts: starts, bayLengths: lengths, height: planHeight, lifts: planLifts, liftHeight: planLift,
          platformLevels: Array.isArray(plan.platformLevels) ? plan.platformLevels.map(Number) : [],
          braceBayIndexes: Array.isArray(plan.braceBayIndexes) ? plan.braceBayIndexes.map(Number) : [],
        });
      }
      const fitCameraToModel = () => {
        model.updateMatrixWorld(true);
        const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        controls.target.copy(center); const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        // Fit measured extents to the camera frustum so detailed part meshes stay in frame.
        const tanVertical = Math.tan(THREE.MathUtils.degToRad(21));
        const tanHorizontal = tanVertical * Math.max(camera.aspect, 0.1);
        const planSpan = Math.max(size.x, size.y);
        const projectedVerticalSpan = size.z * Math.sin(controls.phi) + Math.hypot(size.x, size.y) * Math.cos(controls.phi);
        controls.radius = Math.max(12, planSpan / (2 * tanHorizontal), projectedVerticalSpan / (2 * tanVertical)) * 1.12;
        updateCamera();
      };
      fitCameraToModel();
      if (allroundLayouts.length) {
        const modeledParts = new THREE.Group();
        model.add(modeledParts);
        if (help) help.textContent = 'Ladataan Layher Allround -osien 3D-malleja…';
        addAllroundModeledParts(modeledParts, allroundLayouts).then(() => {
          if (updateId !== modelUpdateId || !model.children.includes(modeledParts)) return;
          fitCameraToModel();
          if (help) help.textContent = 'Paikalliset Allround-GLB-osat: pystyt, juoksut, poikkipalkit, diagonaalit, kaiteet ja terästasot · sovitettu luonnoksen mittoihin.';
        }).catch((error) => {
          if (updateId !== modelUpdateId) return;
          model.remove(modeledParts);
          if (help) help.textContent = `Allround-GLB-osien lataus epäonnistui; käytössä viivamalli (${error.message}).`;
        });
      } else if (help) {
        help.textContent = 'Vedä pyörittääksesi · vieritä zoomataksesi · klikkaa julkisivua valitaksesi';
      }
    },
    destroy() { modelUpdateId += 1; cancelAnimationFrame(frameId); resize.disconnect(); renderer.dispose(); },
  };
}

export function render(container, config) {
  let viewer = viewers.get(container);
  if (viewer && !container.contains(viewer.canvas)) { viewer.destroy(); viewers.delete(container); viewer = null; }
  if (!viewer) { viewer = createViewer(container); if (!viewer) return false; viewers.set(container, viewer); }
  viewer.update(config);
  return true;
}
