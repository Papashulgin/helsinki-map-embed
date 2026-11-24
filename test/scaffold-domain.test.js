'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { cityJsonGroundRing, deriveHakiUniversal, objFacadeSides, parseObjMass, polygonMetrics, projectCoordinate, projectRing, priceSummary, unprojectCoordinate } = require('../lib/scaffold-domain');
const { buildScaffoldBomCsv, buildScaffoldDxf, buildScaffoldFreeCadMacro, buildScaffoldObj, buildScaffoldQuoteCsv, buildScaffoldQuoteHtml, buildScaffoldSvg } = require('../lib/scaffold-exports');

test('browser domain and export scripts load together without global lexical collisions', () => {
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../lib/scaffold-domain.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../lib/scaffold-exports.js'),'utf8'),context);
  assert.equal(typeof context.TelineDomain.deriveHakiUniversal,'function');
  assert.equal(typeof context.TelineExports.buildScaffoldSvg,'function');
  assert.equal(typeof context.TelineExports.buildScaffoldDxf,'function');
  assert.equal(typeof context.TelineExports.buildScaffoldFreeCadMacro,'function');
  assert.equal(typeof context.TelineExports.buildScaffoldObj,'function');
  assert.equal(typeof context.TelineExports.buildScaffoldQuoteHtml,'function');
});

test('WGS84 and EPSG:3879 round-trip the Helsinki map point within centimetres', () => {
  const point = [24.9384, 60.1699];
  const projected = projectCoordinate(point, 'EPSG:4326');
  assert.ok(Math.abs(projected[0] - 25496580.36) < 0.01);
  assert.ok(Math.abs(projected[1] - 6673003.61) < 0.01);
  const returned = unprojectCoordinate(projected);
  assert.ok(Math.abs(returned[0] - point[0]) < 1e-8);
  assert.ok(Math.abs(returned[1] - point[1]) < 1e-8);
});

test('OBJ import normalizes declared and legacy TelineHallinta Z-up geometry to Y-up dimensions', () => {
  const vertices = ['v 0 0 0','v 10 0 0','v 10 8 0','v 0 8 0','v 0 0 6','v 10 0 6','v 10 8 6','v 0 8 6','f 1 2 6 5'].join('\n');
  const declared = parseObjMass(`# Coordinate system=EPSG:3879; units=m; up=Z\n${vertices}`);
  assert.equal(declared.sourceVerticalAxis,'Z');
  assert.deepEqual(declared.bounds,{width:10,height:6,depth:8});
  assert.deepEqual(declared.vertices[6],[10,6,8]);

  const legacy = parseObjMass(`# TelineHallinta CAD OBJ\n${vertices}`);
  assert.equal(legacy.sourceVerticalAxis,'Z');
  assert.deepEqual(legacy.bounds,{width:10,height:6,depth:8});

  const yUp = parseObjMass(vertices.replaceAll(/v (\S+) (\S+) (\S+)/g,'v $1 $3 $2'));
  assert.equal(yUp.sourceVerticalAxis,'Y');
  assert.deepEqual(yUp.bounds,{width:10,height:6,depth:8});
});

test('OBJ facade picking returns whole horizontal hull sides instead of individual mesh triangles', () => {
  const model=parseObjMass(['v 0 0 0','v 10 0 0','v 10 6 0','v 0 6 0','v 10 6 8','v 0 6 8','v 5 3 4','f 1 2 3','f 1 3 4','f 4 3 5','f 4 5 6','f 1 2 7','f 2 3 7'].join('\n'));
  const sides=objFacadeSides(model);
  assert.equal(sides.length,4);
  assert.deepEqual(sides.map((side)=>side.lengthM).sort((a,b)=>a-b),[8,8,10,10]);
  assert.ok(sides.every((side)=>side.start.length===2&&side.end.length===2));
});

test('a projected rectangular footprint has correct measured façade and depth', () => {
  const ring = projectRing([[24.9384,60.1699],[24.93852,60.1699],[24.93852,60.16995],[24.9384,60.16995]], 'EPSG:4326');
  const metrics = polygonMetrics(ring);
  assert.equal(metrics.sides.length, 4);
  assert.ok(metrics.longestSide.lengthM > 6 && metrics.longestSide.lengthM < 8);
  const depth = metrics.secondarySide.lengthM;
  assert.ok(depth > 4 && depth < 6);
  assert.ok(metrics.areaM2 > 25 && metrics.areaM2 < 45);
});

test('CityJSON footprint uses the lowest horizontal source ring and preserves a concave plan', () => {
  const local = [[0,0,0],[8,0,0],[8,3,0],[3,3,0],[3,8,0],[0,8,0],[0,0,9],[8,0,9],[8,3,9],[3,3,9],[3,8,9],[0,8,9]];
  const feature = { geometry: [{ boundaries: [[0,1,2,3,4,5,0]] }, { boundaries: [[6,7,8,9,10,11,6]] }, { boundaries: [[0,1,7,6,0]] }] };
  const cityJson = { vertices: local, transform: { scale: [1,1,1], translate: [25400000,6670000,0] } };
  const ring = cityJsonGroundRing(feature, cityJson);
  assert.equal(ring.length, 6);
  assert.deepEqual(ring.map(([x,y])=>[x-25400000,y-6670000]),local.slice(0,6).map(([x,y])=>[x,y]));
  assert.equal(polygonMetrics(ring).areaM2,39);
  assert.equal(cityJsonGroundRing(feature, { vertices: [] }), null);
});

test('HAKI modules, quantities, uncovered length and open engineering items derive from one geometry', () => {
  const model = deriveHakiUniversal({ targetLengthM:24, targetHeightM:9, platformLevels:'2; 4' });
  assert.equal(model.system.name, 'HAKI Universal');
  assert.equal(model.dimensions.bayLengthM, 3.05);
  assert.equal(model.dimensions.liftHeightM, 2);
  assert.equal(model.dimensions.bays, 7);
  assert.ok(Math.abs(model.dimensions.modeledLengthM - 21.35) < 1e-9);
  assert.equal(model.dimensions.uncoveredLengthM, 2.65);
  assert.equal(model.dimensions.lifts, 5);
  assert.deepEqual(Object.fromEntries(model.bom.map((line)=>[line.id,line.quantity])), {
    'base-jack':16,'standard-2000':80,'ledger-3050':70,'transom-770':40,'guardrail-3050':14,'deck-3050-600':14,'toeboard-3050':14,
  });
  assert.ok(model.unresolved.some((item)=>item.id==='structural-review'));
  assert.ok(model.unresolved.some((item)=>item.id==='ties-anchors'));
  assert.ok(model.warnings.some((warning)=>warning.includes('2.65 m')));
  assert.ok(model.bom.every((line)=>line.source && line.sourcePage && line.catalogRevision && line.quantityStatus));
});

test('purchase, rental, labour and transport totals remain separate', () => {
  const model = deriveHakiUniversal({ targetLengthM:24, targetHeightM:9, platformLevels:[2,4] });
  const components = Object.fromEntries(model.bom.map((line)=>[line.id,{purchasePerUnit:3,rentalPerUnitDay:.1,rentalDays:30}]));
  const summary = priceSummary(model,{components,labor:[{hours:10,ratePerHour:40}],transport:[{quantity:2,amountPerUnit:50}],otherCosts:25});
  assert.deepEqual(summary,{currency:'EUR',purchase:744,rental:744,labor:400,transport:100,other:25,costTotal:2013,total:2013,marginPercent:null,margin:null,netTotal:2013,vatPercent:null,vat:null,grossTotal:null,quoteComplete:false});
});

test('SVG export preserves selected physical scale and exact bay spacing; BOM export retains provenance and prices', () => {
  const model = deriveHakiUniversal({ targetLengthM:24, targetHeightM:9, platformLevels:[2,4] });
  const project = {
    id:'test-project-id',name:'Mittakaava testikohde',revision:3,updatedAt:'2026-10-27T10:00:00.000Z',workflow:{state:'draft'},
    geometry:{scale:100,targetLengthM:24,targetHeightM:9,buildingDepthM:12},
    building:{source:'Helsingin kaupungin WFS',sourceCrs:'EPSG:4326',projectCrs:'EPSG:3879',retrievedAt:'2026-10-27T09:00:00.000Z',height:{status:'estimate'}},
    model,pricing:{components:{'base-jack':{purchasePerUnit:3,rentalPerUnitDay:.1,rentalDays:30}},catalogLinks:{'base-jack':{catalogId:'HAKI|HAKI Universal|CAT-BASE',manufacturer:'HAKI',system:'HAKI Universal',itemNo:'CAT-BASE',name:'Valittu tukijalka',size:'550 mm',source:'https://example.test/catalog/base',revision:'Katalogi 2026',status:'user-selected-needs-compatibility-review'}},labor:[{description:'Asennus',hours:10,ratePerHour:40,source:'Käyttäjä'}],transport:[],otherCosts:0},
    costSummary:priceSummary(model,{components:{'base-jack':{purchasePerUnit:3,rentalPerUnitDay:.1,rentalDays:30}},labor:[{hours:10,ratePerHour:40}]}),
  };
  const svg=buildScaffoldSvg(project);
  assert.match(svg,/width="284mm"/);
  const uprights=[...svg.matchAll(/class="line" d="M([0-9.]+) /g)].map((match)=>Number(match[1]));
  assert.equal(uprights.length,8);
  for(let i=1;i<uprights.length;i++)assert.ok(Math.abs(uprights[i]-uprights[i-1]-30.5)<1e-9);
  assert.match(svg,/2\.65 m tavoitepituudesta avoinna/);
  assert.match(svg,/EPSG:3879/);
  const bom=buildScaffoldBomCsv(project);
  assert.match(bom,/Helsingin kaupungin WFS/);
  assert.match(bom,/HAKI Universal/);
  assert.match(bom,/CAT-BASE/);
  assert.match(bom,/user-selected-needs-compatibility-review/);
  assert.match(bom,/Avoimet mitoitus- ja yhteensopivuuskohdat/);
  assert.match(bom,/3/);
  assert.match(bom,/0\.1/);
  const quote=buildScaffoldQuoteCsv(project);
  assert.match(quote,/tarjousluonnos/i);
  assert.match(quote,/Asennus/);
  assert.match(quote,/Tarjousluonnoksen summa/);
  assert.match(quote,/CAT-BASE/);
  assert.match(quote,/ei ole lähetetty tarjous/);
  const quoteHtml=buildScaffoldQuoteHtml({...project,pricing:{...project.pricing,quoteTerms:{currency:'EUR',marginPercent:20,vatPercent:25.5,validUntil:'2026-11-30',priceEnteredBy:'Testaaja'}}});
  assert.match(quoteHtml,/TARJOUSLUONNOS/);
  assert.match(quoteHtml,/Testaaja/);
  assert.match(quoteHtml,/2026-11-30/);
  assert.match(quoteHtml,/Myyntihinta ilman ALV:tä/);
  assert.match(quoteHtml,/Yhteensä ALV:n kanssa/);
  const dxf=buildScaffoldDxf(project);
  assert.match(dxf,/AC1015/);
  assert.match(dxf,/\$INSUNITS\n70\n4/);
  assert.match(dxf,/\$EXTMIN\n10\n-?\d+(?:\.\d+)?\n20\n-?\d+(?:\.\d+)?\n30\n0/);
  assert.match(dxf,/\$EXTMAX\n10\n-?\d+(?:\.\d+)?\n20\n-?\d+(?:\.\d+)?\n30\n0/);
  assert.match(dxf,/\$LIMMIN/);
  assert.match(dxf,/\$LIMMAX/);
  assert.match(dxf,/\$VIEWCTR\n10\n-?\d+(?:\.\d+)?\n20\n-?\d+(?:\.\d+)?/);
  assert.match(dxf,/\$VIEWSIZE\n40\n\d+(?:\.\d+)?/);
  const dxfNumber=(variable,code)=>{const start=dxf.indexOf(variable),next=dxf.indexOf('\n9\n',start+variable.length),block=dxf.slice(start,next<0?undefined:next);return Number(block.match(new RegExp(`\\n${code}\\n(-?\\d+(?:\\.\\d+)?)`))?.[1]);};
  assert.equal(dxfNumber('$VIEWCTR','10'),(dxfNumber('$EXTMIN','10')+dxfNumber('$EXTMAX','10'))/2);
  assert.equal(dxfNumber('$VIEWCTR','20'),(dxfNumber('$EXTMIN','20')+dxfNumber('$EXTMAX','20'))/2);
  assert.ok(dxfNumber('$VIEWSIZE','40')>dxfNumber('$EXTMAX','20')-dxfNumber('$EXTMIN','20'));
  const activeVport=dxf.match(/AcDbViewportTableRecord\n2\n\*Active[\s\S]*?\n12\n(-?\d+(?:\.\d+)?)\n22\n(-?\d+(?:\.\d+)?)/);
  assert.ok(activeVport,'DXF needs an active opening viewport');
  assert.notEqual(Number(activeVport[1]),dxfNumber('$VIEWCTR','10'),'LibreCAD opening offset is separate from canonical DXF view center');
  assert.ok(Math.abs(Number(activeVport[1])-(dxfNumber('$VIEWCTR','10')/2+dxfNumber('$VIEWSIZE','40')/2))<0.001);
  assert.ok(Math.abs(Number(activeVport[2])-(dxfNumber('$VIEWCTR','20')/2+dxfNumber('$VIEWSIZE','40')/4))<0.001);
  assert.match(dxf,/TABLE\n2\nVPORT/);
  assert.match(dxf,/TABLE\n2\nBLOCK_RECORD/);
  assert.match(dxf,/BLOCK_RECORD\n5\n10\n330\nF[\s\S]*?\*Model_Space/);
  assert.match(dxf,/AcDbViewportTableRecord\n2\n\*Active/);
  assert.match(dxf,/\n40\n\d+\.\d+\n41\n2\n42\n50/);
  assert.match(dxf,/TABLE\n2\nLAYER\n5\n1\n330\n0/);
  assert.match(dxf,/LAYER\n5\n2\n330\n1\n100\nAcDbSymbolTableRecord\n100\nAcDbLayerTableRecord\n2\n0/);
  assert.match(dxf,/SCAFFOLD_STANDARDS/);
  assert.match(dxf,/BUILDING_ELEVATION/);
  assert.match(dxf,/PROJECT_META/);
  assert.match(dxf,/Mittakaava testikohde \| REV 3/);
  assert.match(dxf,/Geometric draft only/);
  const dxfLines=dxf.trimEnd().split('\n');
  assert.equal(dxfLines.length%2,0,'DXF must contain complete group-code/value pairs');
  const dxfPairs=[];
  for(let index=0;index<dxfLines.length;index+=2)dxfPairs.push([dxfLines[index],dxfLines[index+1]]);
  const entityTypes=new Set(['LINE','CIRCLE','TEXT']);
  const handles=[];
  let entityCount=0;
  for(let index=0;index<dxfPairs.length;index++){
    if(dxfPairs[index][0]!=='0'||(!entityTypes.has(dxfPairs[index][1])&&!['LAYER','BLOCK_RECORD','BLOCK','ENDBLK'].includes(dxfPairs[index][1])))continue;
    const type=dxfPairs[index][1],record=[];
    for(let cursor=index;cursor<dxfPairs.length&&!(cursor>index&&dxfPairs[cursor][0]==='0');cursor++)record.push(dxfPairs[cursor]);
    const handle=record.find(([code])=>code==='5')?.[1];
    assert.ok(handle,`${type} record needs its own DXF handle`);
    handles.push(handle);
    if(entityTypes.has(type)){
      entityCount++;
      assert.ok(record.some(([code,value])=>code==='330'&&value==='10'),`${type} must reference the model-space block record`);
      assert.ok(record.some(([code,value])=>code==='100'&&value==='AcDbEntity'));
      assert.ok(record.some(([code,value])=>code==='100'&&value===({LINE:'AcDbLine',CIRCLE:'AcDbCircle',TEXT:'AcDbText'})[type]));
    }
  }
  assert.ok(entityCount>50);
  assert.equal(new Set(handles).size,handles.length,'DXF handles must be unique');
  const handSeedIndex=dxfPairs.findIndex(([code,value])=>code==='9'&&value==='$HANDSEED');
  const handSeed=parseInt(dxfPairs[handSeedIndex+1]?.[1],16);
  assert.ok(handSeed>Math.max(...handles.map((handle)=>parseInt(handle,16))),'$HANDSEED must be higher than all allocated handles');
  const sourceProject={...project,building:{...project.building,name:'Polygonikohde',footprint:[[25400000,6670000],[25400020,6670000],[25400020,6670008],[25400000,6670008]],facadeIndex:0,height:{value:6,status:'source'}}};
  const obj=buildScaffoldObj(sourceProject);
  assert.match(obj,/# .*sourceFootprint=true/);
  assert.match(obj,/# Coordinate system=project-local; source CRS is recorded below; units=m; up=Z/);
  assert.match(obj,/# Local origin EPSG:3879 E=25400000\.000000 N=6670000\.000000; local X\/Y map 1:1 to CRS E\/N offsets; selected facade vector \(1\.000000,0\.000000\), outward \(0\.000000,-1\.000000\)\./);
  assert.match(obj,/g building_mass/);
  assert.match(obj,/g scaffold_parametric_frame/);
  assert.match(obj,/^f /m);
  assert.ok((obj.match(/^f /gm)||[]).length>100);
  assert.match(obj,/48\.3 mm illustrative display envelope/);
  assert.match(obj,/Mittakaava testikohde project=test-project-id revision=3/);
  assert.match(obj,/not a structural design or erection approval/);
  const frameDxf=buildScaffoldDxf(sourceProject);
  assert.match(frameDxf,/Local origin EPSG:3879 E=25400000\.000000 N=6670000\.000000; local X\/Y map 1:1 to CRS E\/N offsets; selected facade vector \(1\.000000,0\.000000\), outward \(0\.000000,-1\.000000\)\./);
  const macro=buildScaffoldFreeCadMacro(sourceProject);
  assert.match(macro,/import FreeCAD as App/);
  assert.match(macro,/Part\.Face\(wire\)\.extrude/);
  assert.match(macro,/key, label in \[\('Standards', 'Pystyrungot'\)/);
  assert.match(macro,/scaffold-decks/);
  assert.match(macro,/\('Guardrails', 'Suojakaiteet/);
  assert.match(macro,/\('Toeboards', 'Varvaslistat/);
  assert.match(macro,/SourceCRS/);
  assert.match(macro,/25400000/);
  assert.match(macro,/Geometric draft only/);
});

test('manual HAKI bay count is an explicit editable geometry override and reports facade overrun', () => {
  const model=deriveHakiUniversal({targetLengthM:8,targetHeightM:4,platformLevels:[1],bayCount:3});
  assert.equal(model.dimensions.bays,3);
  assert.equal(model.dimensions.modeledLengthM,9.15);
  assert.equal(model.dimensions.overrunLengthM,1.15);
  assert.ok(model.warnings.some((warning)=>warning.includes('ylittää')));
  assert.equal(model.bom.find((row)=>row.id==='ledger-3050').quantity,12);
  assert.throws(()=>deriveHakiUniversal({targetLengthM:8,targetHeightM:4,bayCount:1.5}),/kokonaisluku/);
});

test('quote price summary keeps margin and VAT explicit instead of inventing tax or markup', () => {
  const model=deriveHakiUniversal({targetLengthM:3.05,targetHeightM:4,platformLevels:[1]});
  const costs={components:{'base-jack':{purchasePerUnit:10}},quoteTerms:{marginPercent:20,vatPercent:25.5}};
  const priced=priceSummary(model,costs);
  assert.equal(priced.costTotal,40);
  assert.equal(priced.margin,10);
  assert.equal(priced.netTotal,50);
  assert.equal(priced.vat,12.75);
  assert.equal(priced.grossTotal,62.75);
  assert.equal(priced.quoteComplete,true);
  const missing=priceSummary(model,{components:{'base-jack':{purchasePerUnit:10}}});
  assert.equal(missing.marginPercent,null);
  assert.equal(missing.vatPercent,null);
  assert.equal(missing.grossTotal,null);
  assert.equal(missing.quoteComplete,false);
});
