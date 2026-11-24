const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { openCrmStore, STAGES } = require('../lib/crm-store');

function withStore(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'telinehallinta-crm-'));
  const filename = path.join(directory, 'crm.sqlite');
  const store = openCrmStore(filename);
  try { return run(store, filename); }
  finally { store.close(); fs.rmSync(directory, { recursive: true, force: true }); }
}

test('legacy localStorage import is idempotent and leaves unlinked drawings for review', () => withStore((store) => {
  const snapshot = {
    customers: [
      { id: 'customer-1', company: 'Helsingin Julkisivut Oy', stage: 'Tarjous', value: 48000, nextStep: 'Tarkista tarjous' },
      { id: 'old-9', company: 'Vanha asiakas Oy', stage: 'Neuvottelu', value: 1000 },
    ],
    designResources: [
      { id: 'drawing-old', type: 'Telinepiirustus / 3D-malli', title: 'Vanha julkisivupiirustus', url: 'https://example.test/drawing.pdf', revision: 'Rev 1' },
    ],
  };
  const first = store.migrateLegacy(snapshot);
  assert.equal(first.customersImported, 2);
  assert.equal(first.drawingsImported, 1);
  const second = store.migrateLegacy(snapshot);
  assert.equal(second.alreadyImported, true);
  assert.equal(store.listOpportunities().length, 2);
  const demo = store.listOpportunities().find((item) => item.company === 'Helsingin Julkisivut Oy');
  assert.equal(demo.stage, 'Tarjous lähetetty');
  assert.equal(demo.is_demo, 1);
  assert.equal(demo.review_required, 1);
  assert.equal(store.listSync().length, 0);
  const legacyDrawing = store.listAllDrawings()[0];
  assert.equal(legacyDrawing.ratu, null);
  assert.equal(legacyDrawing.review_required, 1);
  assert.equal(store.listBuildings().length, 0);
}));

test('Y-tunnus and source notice deduplicate independently, with ambiguous company names flagged', () => withStore((store) => {
  const first = store.createOpportunity({ companyName: 'Esimerkki Urakointi Oy', businessId: '1234567-8', title: 'Julkisivutyö', source: 'hilma', sourceId: 'H-001' });
  const repeatedNotice = store.createOpportunity({ companyName: 'Toinen nimi Oy', title: 'Sama ilmoitus', source: 'hilma', sourceId: 'H-001' });
  assert.equal(repeatedNotice.duplicate, true);
  const second = store.createOpportunity({ companyName: 'Esimerkki Urakointi Oy', businessId: '1234567-8', title: 'Toinen tarjous', source: 'manual' });
  assert.equal(first.opportunity.company_id, second.opportunity.company_id);
  const ambiguous = store.createOpportunity({ companyName: 'Esimerkki Urakointi Oy', title: 'Yleinen myyntimahdollisuus', source: 'manual' });
  assert.equal(ambiguous.possibleDuplicates.length, 1);
  assert.equal(ambiguous.opportunity.review_required, 1);
}));

test('HILMA opportunity stores notice metadata and exposes it in export', () => withStore((store) => {
  const result = store.createOpportunity({
    companyName: 'Hankintayksikkö Oy', title: 'Julkisivutelineet', source: 'hilma', sourceId: 'H-2026-1',
    sourceUrl: 'https://example.test/notice', procurementType: 'Hankintailmoitus', procurementDeadline: '2026-11-15T12:00:00Z',
    procurementPublishedAt: '2026-10-28T10:00:00Z', cpvCodes: '44212310, 45000000', procurementEstimatedValue: 125000,
    procurementCurrency: 'EUR',
  }).opportunity;
  assert.equal(result.procurement_type, 'Hankintailmoitus');
  assert.equal(result.procurement_deadline, '2026-11-15T12:00:00Z');
  assert.equal(result.next_action_due, '2026-11-15');
  assert.equal(result.cpv_codes, '44212310, 45000000');
  assert.equal(result.procurement_estimated_value, 125000);
  assert.match(store.exportCsv(), /Tarjousmääräaika/);
  assert.match(store.exportCsv(), /44212310, 45000000/);
}));

test('stage and company contact changes are recorded and qualification transition queues once', () => withStore((store) => {
  const created = store.createOpportunity({ companyName: 'Kelpuutettava Oy', contact: 'A. Esimerkki', email: 'a@example.test', title: 'Hanketunnus', stage: 'Kelpuutus' }).opportunity;
  store.updateCompany(created.company_id, { contact: 'B. Esimerkki' });
  let activity = store.listActivities(created.id);
  assert.ok(activity.some((item) => item.kind === 'contact'));
  store.updateOpportunity(created.id, { nextAction: 'Soita asiakkaalle', nextActionDue: '2026-10-30', value: 12000, buildingRatu: 'RATU-123' });
  activity = store.listActivities(created.id);
  assert.ok(activity.some((item) => item.kind === 'follow-up' && item.summary.includes('Soita asiakkaalle')));
  assert.ok(activity.some((item) => item.kind === 'follow-up-due' && item.summary.includes('2026-10-30')));
  assert.ok(activity.some((item) => item.kind === 'value' && /12.{0,2}000 €/.test(item.summary)));
  assert.ok(activity.some((item) => item.kind === 'building' && item.summary.includes('RATU-123')));
  store.updateOpportunity(created.id, { stage: 'Yhteydenotto' });
  store.updateOpportunity(created.id, { stage: 'Kelpuutus' });
  store.updateOpportunity(created.id, { stage: 'Yhteydenotto' });
  assert.equal(store.listSync().length, 1);
  assert.equal(store.listSync()[0].status, 'waiting-contract');
  activity = store.listActivities(created.id);
  assert.ok(activity.some((item) => item.kind === 'stage' && item.summary === 'Kelpuutus → Yhteydenotto'));
  assert.ok(activity.some((item) => item.kind === 'stage' && item.summary === 'Yhteydenotto → Kelpuutus'));
}));

test('completed CRM follow-up clears the due date and records an activity atomically', () => withStore((store) => {
  const opportunity = store.createOpportunity({ companyName: 'Seuranta Oy', title: 'Julkisivutyö', nextAction: 'Soita tarjoajalle', nextActionDue: '2026-11-02' }).opportunity;
  const result = store.completeNextAction(opportunity.id, 'Puhelu tehty');
  assert.equal(result.opportunity.next_action, '');
  assert.equal(result.opportunity.next_action_due, null);
  assert.equal(result.activity.kind, 'follow-up-completed');
  assert.match(result.activity.summary, /Soita tarjoajalle · Puhelu tehty/);
  assert.throws(() => store.completeNextAction(opportunity.id), /ei ole avointa tehtävää/);
  assert.equal(store.completeNextAction('missing'), null);
}));

test('CRM follow-up can complete and schedule the next action in one transaction', () => withStore((store) => {
  const opportunity = store.createOpportunity({ companyName: 'Jatkuva seuranta Oy', title: 'Julkisivuteline', nextAction: 'Soita asiakkaalle', nextActionDue: '2026-11-02' }).opportunity;
  const result = store.completeNextAction(opportunity.id, { note: 'Tarve vahvistettu', nextAction: 'Lähetä tarjousluonnos', nextActionDue: '2026-11-06' });
  assert.equal(result.opportunity.next_action, 'Lähetä tarjousluonnos');
  assert.equal(result.opportunity.next_action_due, '2026-11-06');
  assert.equal(result.activity.kind, 'follow-up-completed');
  assert.ok(store.listActivities(opportunity.id).some((item) => item.kind === 'follow-up' && item.summary.includes('Lähetä tarjousluonnos') && item.summary.includes('2026-11-06')));
  assert.throws(() => store.completeNextAction(opportunity.id, { nextActionDue: '2026-02-31' }), /kelvollisen päivämäärän/);
}));

test('CRM calendar export includes open dated follow-ups and safely escapes calendar text', () => withStore((store) => {
  store.createOpportunity({ companyName: 'Kalenteri, Oy', title: 'Julkisivu; vaihe 2', nextAction: 'Soita\\ vahvistus', nextActionDue: '2026-11-04' });
  const completed = store.createOpportunity({ companyName: 'Valmis Oy', title: 'Suljettu', nextAction: 'Laskuta', nextActionDue: '2026-11-05' }).opportunity;
  store.completeNextAction(completed.id, 'Valmis');
  store.createOpportunity({ companyName: 'Ei määräpäivää Oy', title: 'Myöhemmin', nextAction: 'Selvitä kohde' });
  const calendar = store.exportFollowUpsIcs();
  assert.match(calendar, /BEGIN:VCALENDAR/);
  assert.match(calendar, /DTSTART;VALUE=DATE:20261104/);
  assert.match(calendar, /SUMMARY:Kalenteri\\, Oy: Soita\\\\ vahvistus/);
  assert.doesNotMatch(calendar, /Suljettu|Ei määräpäivää Oy/);
  assert.match(calendar, /END:VCALENDAR/);
}));

test('only selected Helsinki EPSG:3879 coordinates create map points; RATU drawings are validated', () => withStore((store) => {
  const opportunity = store.createOpportunity({ companyName: 'Kartta Oy', title: 'Työmaa', buildingRatu: 'RATU-777' }).opportunity;
  assert.equal(opportunity.review_required, 1);
  assert.equal(store.listMapFeatures().length, 0);
  const company = store.listCompanies()[0];
  assert.throws(() => store.updateCompanyLocation(company.id, { x: 25500000, y: 6600000, label: 'Väärä koordinaatti' }), /Helsingin alueen karttaosuma/);
  store.updateCompanyLocation(company.id, { x: 25496580, y: 6673004, label: 'Esimerkkikatu 1', source: 'Helsingin osoitehaku' });
  assert.equal(store.listMapFeatures().filter((feature) => feature.type === 'company').length, 1);
  assert.throws(() => store.addDrawing({ ratu: 'RATU-777', title: 'Virheellinen linkki', url: 'javascript:alert(1)' }), /http:\/\//);
  const unverified = store.addDrawing({ ratu: 'RATU-999', title: 'Tarkistettava piirustus', url: 'https://example.test/ratu.pdf' });
  assert.equal(unverified.review_required, 1);
  store.upsertBuilding({ ratu: 'RATU-777', name: 'Esimerkkikohde', address: 'Esimerkkikatu 1', x: 25496580, y: 6673004, source: 'Käyttäjän valitsema karttaosuma' });
  const drawing = store.addDrawing({ ratu: 'RATU-777', title: 'Pohjapiirustus', revision: 'Rev. 02', url: 'https://example.test/plan.pdf' });
  assert.equal(drawing.review_required, 0);
  assert.equal(store.listDrawings('RATU-777').length, 1);
  assert.ok(store.listMapFeatures().some((feature) => feature.type === 'building' && feature.ratu === 'RATU-777'));
}));

test('stage catalog and CSV export include current pipeline fields', () => withStore((store) => {
  assert.deepEqual(STAGES, ['Uusi','Kelpuutus','Yhteydenotto','Tarjousvalmistelu','Tarjous lähetetty','Voitettu','Hävitty']);
  store.createOpportunity({ companyName: 'CSV Oy', title: 'Kohde; tarjous', source: 'manual', nextAction: 'Soita', nextActionDue: '2026-11-01' });
  store.createOpportunity({ companyName: '=HYPERLINK("https://example.test","avaa")', title: '+SUM(1,1)', source: 'manual' });
  const csv = store.exportCsv();
  assert.ok(csv.startsWith('\ufeff'));
  assert.match(csv, /"CSV Oy"/);
  assert.match(csv, /"Kohde; tarjous"/);
  assert.match(csv, /"2026-11-01"/);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.test"",""avaa""\)"/);
  assert.match(csv, /"'\+SUM\(1,1\)"/);
}));

test('SQLite company, pipeline, activity, building, drawings, and outbox survive store restart', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'telinehallinta-restart-'));
  const filename = path.join(directory, 'crm.sqlite');
  let store = openCrmStore(filename);
  try {
    const opportunity = store.createOpportunity({ companyName: 'Pysyvä Oy', businessId: '7654321-0', title: 'Julkisivuhanke', stage: 'Kelpuutus' }).opportunity;
    store.updateCompanyLocation(opportunity.company_id, { x: 25496580, y: 6673004, label: 'Pysyväntie 1, Helsinki', source: 'Testattu osoitehaku' });
    store.upsertBuilding({ ratu: 'RATU-PERSIST-1', name: 'Pysyvä kohde', address: 'Pysyväntie 1', x: 25496580, y: 6673004, source: 'Testattu karttavalinta' });
    store.addDrawing({ ratu: 'RATU-PERSIST-1', title: 'Julkisivu', revision: 'Rev 3', url: 'https://example.test/julkisivu.pdf' });
    store.addActivity(opportunity.id, { kind: 'note', summary: 'Kirjattu ennen uudelleenkäynnistystä.' });
    store.updateOpportunity(opportunity.id, { stage: 'Yhteydenotto', nextAction: 'Soita', nextActionDue: '2026-11-03' });
    store.close();

    store = openCrmStore(filename);
    const saved = store.listOpportunities().find((item) => item.id === opportunity.id);
    assert.equal(saved.stage, 'Yhteydenotto');
    assert.equal(saved.next_action, 'Soita');
    assert.equal(saved.locationStatus, 'confirmed');
    assert.equal(store.listActivities(opportunity.id).length, 5);
    assert.equal(store.listDrawings('RATU-PERSIST-1')[0].revision, 'Rev 3');
    assert.ok(store.listMapFeatures().some((feature) => feature.type === 'company'));
    assert.ok(store.listMapFeatures().some((feature) => feature.type === 'building' && feature.ratu === 'RATU-PERSIST-1'));
    assert.equal(store.listSync()[0].status, 'waiting-contract');
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
