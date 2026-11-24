'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { openScaffoldProjectStore, ProjectInputError, RevisionConflictError } = require('../lib/scaffold-project-store');

function fixture() {
  return {
    name:'Testiteline · Helsinki',
    building:{
      id:'VTJ-123',name:'Koetalo',address:'Testikatu 1, Helsinki',source:'Helsingin kaupungin WFS',sourceCrs:'EPSG:4326',projectCrs:'EPSG:3879',
      retrievedAt:'2026-10-27T09:00:00.000Z',footprint:[[25496570,6673000],[25496578,6673000],[25496578,6673005],[25496570,6673005]],footprintStatus:'source',
      height:{value:12,status:'estimate',source:'Kerrosluku × 3,1 m; arvio'},properties:{storeys:4},
    },
    geometry:{targetLengthM:24,targetHeightM:9,buildingDepthM:5,platformLevels:[2,4],scale:100},
    provenance:{targetLength:{status:'source',source:'Helsingin kaupungin WFS polygonin pitkä sivu',checkedAt:'2026-10-27T09:00:00.000Z'},targetHeight:{status:'user',source:'Käyttäjän syöttämä'},buildingDepth:{status:'estimate',source:'WFS-polygonin lyhyt sivu'}},
    pricing:{components:{'base-jack':{purchasePerUnit:4,rentalPerUnitDay:.25,rentalDays:20,priceSource:'Testihinnasto',priceCheckedAt:'2026-10-30'}},labor:[{description:'Asennus',hours:10,ratePerHour:40,source:'Työsopimus'}],transport:[{description:'Kuorma',quantity:2,amountPerUnit:50,source:'Kuljetustarjous'}],otherCosts:25,quoteTerms:{marginPercent:20,vatPercent:25.5,validUntil:'2026-11-30',priceEnteredBy:'Testaaja'}},
  };
}

test('project, provenance, sourced HAKI BOM, pricing and immutable revisions survive reopen', async (t) => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'teline-project-store-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const database=path.join(directory,'projects.sqlite');
  let store=openScaffoldProjectStore(database);
  const project=store.createProject(fixture());
  assert.equal(project.revision,1);
  assert.equal(project.building.projectCrs,'EPSG:3879');
  assert.equal(project.building.height.status,'estimate');
  assert.equal(project.provenance.targetLength.status,'source');
  assert.equal(project.geometry.targetLengthM,24);
  assert.equal(project.model.dimensions.modeledLengthM,21.35);
  assert.equal(project.model.bom.find((line)=>line.id==='base-jack').quantity,16);
  assert.equal(project.costSummary.purchase,64);
  assert.equal(project.costSummary.rental,80);
  assert.equal(project.costSummary.labor,400);
  assert.equal(project.costSummary.transport,100);
  assert.equal(project.costSummary.other,25);
  assert.equal(project.pricing.quoteTerms.validUntil,'2026-11-30');
  assert.equal(project.pricing.components['base-jack'].priceSource,'Testihinnasto');
  assert.equal(project.costSummary.marginPercent,20);
  assert.equal(project.costSummary.vatPercent,25.5);
  assert.ok(project.costSummary.grossTotal>project.costSummary.netTotal);

  const edited=store.updateProject(project.id,{...fixture(),name:'Testiteline · rev2'},1);
  assert.equal(edited.revision,2);
  assert.throws(()=>store.updateProject(project.id,fixture(),1),RevisionConflictError);
  const reviewed=store.addReview(project.id,{expectedRevision:2,reviewer:'Suunnittelija',decision:'changes-requested',note:'Tarkista kiinnitykset.'});
  assert.equal(reviewed.revision,3);
  assert.equal(reviewed.workflow.state,'changes-requested');
  const revisions=store.listRevisions(project.id);
  assert.deepEqual(revisions.map((row)=>row.revision),[3,2,1]);
  assert.ok(revisions.every((row)=>/^[a-f0-9]{64}$/.test(row.sha256)));
  store.close();

  store=openScaffoldProjectStore(database);
  assert.equal(store.getProject(project.id).revision,3);
  assert.equal(store.listProjects()[0].name,'Testiteline · rev2');
  assert.equal(store.listRevisions(project.id).length,3);
  store.close();
});

test('management markers are saved in Helsinki EPSG:3879, update in place and reject out-of-area coordinates', (t) => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'teline-marker-store-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const store=openScaffoldProjectStore(path.join(directory,'projects.sqlite'));
  t.after(()=>store.close());
  const marker=store.saveMarker({moduleKey:'scaffold',title:'Teline · koetalo',easting:25496580.36,northing:6673003.61,source:'Karttavalinta WGS84 → EPSG:3879'});
  assert.equal(marker.crs,'EPSG:3879');
  assert.equal(store.listMarkers().length,1);
  const moved=store.saveMarker({...marker,easting:25496582,northing:6673006,source:'Siirretty kartalla'});
  assert.equal(moved.id,marker.id);
  assert.equal(store.listMarkers().length,1);
  assert.equal(moved.easting,25496582);
  assert.throws(()=>store.saveMarker({moduleKey:'scaffold',title:'Virhe',easting:0,northing:0}),ProjectInputError);
  assert.equal(store.deleteMarker(marker.id),true);
  assert.equal(store.listMarkers().length,0);
});

test('source footprints require a valid retrieval timestamp and a projected Helsinki geometry', (t) => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'teline-validation-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const store=openScaffoldProjectStore(path.join(directory,'projects.sqlite'));
  t.after(()=>store.close());
  const invalid=fixture();invalid.building.retrievedAt='';
  assert.throws(()=>store.createProject(invalid),ProjectInputError);
  const wrongCrs=fixture();wrongCrs.building.projectCrs='EPSG:4326';
  assert.throws(()=>store.createProject(wrongCrs),ProjectInputError);
});

test('a selected OBJ hull facade and its measured length survive project revisions and database reopen', (t) => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'teline-facade-selection-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const database=path.join(directory,'projects.sqlite');
  let store=openScaffoldProjectStore(database);
  const input={...fixture(),geometry:{...fixture().geometry,targetLengthM:7.25,facadeSelection:{source:'obj-hull',index:2,label:'Julkisivu 3',lengthM:7.25}}};
  const project=store.createProject(input);
  assert.deepEqual(project.geometry.facadeSelection,{source:'obj-hull',index:2,label:'Julkisivu 3',lengthM:7.25,direction:null});
  const updated=store.updateProject(project.id,{...input,expectedRevision:1},1);
  assert.deepEqual(updated.geometry.facadeSelection,project.geometry.facadeSelection);
  store.close();
  store=openScaffoldProjectStore(database);
  assert.deepEqual(store.getProject(project.id).geometry.facadeSelection,project.geometry.facadeSelection);
  store.close();
});

test('project files, templates and anonymized historical recommendations persist without customer details', (t) => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'teline-assets-test-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const store=openScaffoldProjectStore(path.join(directory,'projects.sqlite'));
  t.after(()=>store.close());
  const projects=[];
  for(let i=0;i<3;i++)projects.push(store.createProject({...fixture(),name:`Kohde ${i}`,customerName:`Salainen asiakas ${i}`,geometry:{...fixture().geometry,targetLengthM:24+i,targetHeightM:9},pricing:{...fixture().pricing,labor:[{description:'Asennus',hours:[6,10,0][i],ratePerHour:40,source:`Yksityinen lähde ${i}`}]}}));
  const project=projects[0];
  const file=store.addProjectFile(project.id,{kind:'drawing',filename:'julkisivu.pdf',storedName:'asset.blob',contentType:'application/pdf',sizeBytes:12,sha256:'a'.repeat(64)});
  assert.equal(store.listProjectFiles(project.id)[0].id,file.id);
  assert.equal(store.getProjectFile(project.id,file.id).filename,'julkisivu.pdf');
  assert.equal(store.getProjectFile(projects[1].id,file.id),null);
  const template=store.saveTemplate(project.id,'Julkisivumalli');
  assert.equal(store.getTemplate(template.id).template.geometry.targetLengthM,24);
  assert.equal(JSON.stringify(store.getTemplate(template.id)).includes('Salainen asiakas'),false);
  assert.equal(store.listTemplates().length,1);
  const recommendation=store.recommendFromHistory({name:'Uusi',geometry:{targetLengthM:25,targetHeightM:9,buildingDepthM:5,platformLevels:[2,4],scale:100}});
  assert.equal(recommendation.available,true);
  assert.equal(recommendation.sampleCount,3);
  assert.equal(recommendation.laborEstimate.available,false);
  assert.equal(recommendation.laborEstimate.sampleCount,2);
  assert.ok(recommendation.quoteRange.min<=recommendation.quoteRange.max);
  assert.ok(recommendation.bom.length>0);
  projects.push(store.createProject({...fixture(),name:'Neljäs vertailukohde',customerName:'Salainen asiakas neljä',geometry:{...fixture().geometry,targetLengthM:25,targetHeightM:9},pricing:{...fixture().pricing,labor:[{description:'Asennus',hours:14,ratePerHour:45,source:'Yksityinen lähde neljä'}]}}));
  const withLabor=store.recommendFromHistory({name:'Uusi',geometry:{targetLengthM:25,targetHeightM:9,buildingDepthM:5,platformLevels:[2,4],scale:100}});
  assert.equal(withLabor.laborEstimate.available,true);
  assert.equal(withLabor.laborEstimate.sampleCount,3);
  assert.equal(withLabor.laborEstimate.range.min,6);
  assert.equal(withLabor.laborEstimate.range.max,14);
  assert.ok(withLabor.laborEstimate.hours>=6&&withLabor.laborEstimate.hours<=14);
  const serialized=JSON.stringify(recommendation);
  assert.equal(serialized.includes('Salainen asiakas'),false);
  assert.equal(serialized.includes(project.id),false);
  assert.equal(JSON.stringify(withLabor).includes('Yksityinen lähde'),false);
  assert.equal(JSON.stringify(withLabor).includes(projects[3].id),false);
});

test('anonymized labor recommendation keeps installation, dismantling, and inspection hours separate', (t) => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'teline-labor-breakdown-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const store=openScaffoldProjectStore(path.join(directory,'projects.sqlite'));
  t.after(()=>store.close());
  for(let i=0;i<3;i++)store.createProject({...fixture(),name:`Vertailu ${i}`,customerName:`Asiakas ${i}`,geometry:{...fixture().geometry,targetLengthM:24+i},pricing:{...fixture().pricing,labor:[
    {description:'Asennus',hours:6+2*i,ratePerHour:40,source:`Henkilökohtainen lähde ${i}`},
    {description:'Purku',hours:2+i,ratePerHour:40,source:`Henkilökohtainen lähde ${i}`},
    {description:'Tarkastus',hours:1,ratePerHour:40,source:`Henkilökohtainen lähde ${i}`},
  ]}});
  const result=store.recommendFromHistory({name:'Uusi kohde',geometry:{targetLengthM:25,targetHeightM:9,buildingDepthM:5,platformLevels:[2,4],scale:100}});
  const activities=result.laborEstimate.activities;
  assert.equal(result.laborEstimate.available,true);
  assert.equal(activities.installation.available,true);
  assert.equal(activities.installation.sampleCount,3);
  assert.deepEqual(activities.installation.range,{min:6,max:10});
  assert.ok(activities.installation.hours>6&&activities.installation.hours<10);
  assert.equal(activities.dismantling.available,true);
  assert.deepEqual(activities.dismantling.range,{min:2,max:4});
  assert.equal(activities.inspection.available,true);
  assert.deepEqual(activities.inspection.range,{min:1,max:1});
  const serialized=JSON.stringify(result);
  assert.doesNotMatch(serialized,/Asiakas [0-9]|Henkilökohtainen lähde|Vertailu [0-9]/);
});
