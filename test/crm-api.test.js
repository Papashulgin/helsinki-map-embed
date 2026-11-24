const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, test } = require('node:test');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'telinehallinta-api-'));
process.env.TELINEHALLINTA_CRM_DB = path.join(directory, 'crm.sqlite');
const app = require('../server');
const server = app.listen(0, '127.0.0.1');

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  app.locals.closeCrmStore();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('local CRM API migrates, deduplicates, maps, logs activities, and queues without external writes', async () => {
  if (!server.listening) await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(route, { method = 'GET', body, headers = {} } = {}) {
    const response = await fetch(`${base}${route}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
    const payload = response.status === 204 ? null : response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
    return { response, payload };
  }

  const initial = await request('/api/crm/bootstrap');
  assert.equal(initial.response.status, 200);
  assert.deepEqual(initial.payload.stages, ['Uusi','Kelpuutus','Yhteydenotto','Tarjousvalmistelu','Tarjous lähetetty','Voitettu','Hävitty']);
  assert.equal(initial.payload.syncContract.configured, false);

  const migrated = await request('/api/crm/migrate', { method: 'POST', body: { customers: [
    { id: 'api-demo-1', company: 'Demo Asiakas Oy', stage: 'Tarjous', value: 1000 },
  ], designResources: [
    { id: 'api-drawing-1', type: 'Telinepiirustus / 3D-malli', title: 'Vanha viite', url: 'https://example.test/old.pdf' },
  ] } });
  assert.equal(migrated.response.status, 200);
  assert.equal(migrated.payload.customersImported, 1);
  assert.equal(migrated.payload.drawingsImported, 1);
  const repeatedMigration = await request('/api/crm/migrate', { method: 'POST', body: { customers: [{ id: 'api-demo-1', company: 'Changed copy' }], designResources: [] } });
  assert.equal(repeatedMigration.payload.alreadyImported, true);

  const tender = await request('/api/crm/import/osint', { method: 'POST', body: {
    source: 'hilma', sourceId: 'HILMA-123', title: 'Telineurakka, Helsinki', buyerName: 'Helsingin kaupunki',
    companyName: '', sourceUrl: 'https://example.test/notice',
    procurementType: 'Hankintailmoitus', procurementDeadline: '2026-11-15T12:00:00Z', procurementPublishedAt: '2026-10-28T10:00:00Z',
    cpvCodes: '44212310, 45000000', procurementEstimatedValue: 125000, procurementCurrency: 'EUR',
  } });
  assert.equal(tender.response.status, 201);
  assert.equal(tender.payload.opportunity.company, 'Helsingin kaupunki');
  assert.equal(tender.payload.opportunity.title, 'Telineurakka, Helsinki');
  assert.equal(tender.payload.opportunity.procurement_type, 'Hankintailmoitus');
  assert.equal(tender.payload.opportunity.procurement_deadline, '2026-11-15T12:00:00Z');
  assert.equal(tender.payload.opportunity.next_action_due, '2026-11-15');
  assert.equal(tender.payload.opportunity.cpv_codes, '44212310, 45000000');
  assert.equal(tender.payload.opportunity.procurement_estimated_value, 125000);
  const duplicateTender = await request('/api/crm/import/osint', { method: 'POST', body: {
    source: 'hilma', sourceId: 'HILMA-123', title: 'Uusi teksti', buyerName: 'Toinen ostaja',
  } });
  assert.equal(duplicateTender.response.status, 200);
  assert.equal(duplicateTender.payload.duplicate, true);

  const unknownBuyer = await request('/api/crm/import/osint', { method: 'POST', body: {
    source: 'ted', sourceId: 'TED-unknown', title: 'Avoin hankinta',
  } });
  assert.equal(unknownBuyer.payload.opportunity.company, 'Ostaja tarkistettava');
  assert.equal(unknownBuyer.payload.opportunity.review_required, 1);

  const importedCompany = await request('/api/crm/opportunities', { method: 'POST', body: {
    title: 'Y-tunnuksen yhteystarkistus', companyName: 'Yhtiö Oy', businessId: '1234567-8',
    stage: 'Kelpuutus', nextAction: 'Tarkista tarjous', nextActionDue: '2026-11-05', source: 'manual',
  } });
  assert.equal(importedCompany.response.status, 201);
  const companyId = importedCompany.payload.opportunity.company_id;
  const secondOpportunity = await request('/api/crm/opportunities', { method: 'POST', body: {
    title: 'Toinen mahdollisuus', companyName: 'Yhtiö Oy eri nimellä', businessId: '1234567-8', source: 'manual',
  } });
  assert.equal(secondOpportunity.payload.opportunity.company_id, companyId);

  const company = await request('/api/crm/companies', { method: 'POST', body: { name: 'Itsenäinen yritys Oy', businessId: '2345678-9', email: 'info@example.test' } });
  assert.equal(company.response.status, 201);
  const repeatedCompany = await request('/api/crm/companies', { method: 'POST', body: { name: 'Nimen muutos Oy', businessId: '2345678-9' } });
  assert.equal(repeatedCompany.response.status, 200);
  assert.equal(repeatedCompany.payload.company.id, company.payload.company.id);
  const companyUpdate = await request(`/api/crm/companies/${company.payload.company.id}`, { method: 'PATCH', body: { contact: 'C. Esimerkki' } });
  assert.equal(companyUpdate.payload.contact, 'C. Esimerkki');
  const blockedCompanyDelete = await request(`/api/crm/companies/${companyId}`, { method: 'DELETE' });
  assert.equal(blockedCompanyDelete.response.status, 400);
  const emptyCompany = await request('/api/crm/companies', { method: 'POST', body: { name: 'Poistettava yritys Oy' } });
  assert.equal((await request(`/api/crm/companies/${emptyCompany.payload.company.id}`, { method: 'DELETE' })).response.status, 204);

  const wrongOrigin = await request('/api/crm/import/osint', { method: 'POST', headers: { Origin: 'http://127.0.0.1:3017' }, body: { source: 'ytj', title: 'Väärä alkuperä', companyName: 'Väärä Oy' } });
  assert.equal(wrongOrigin.response.status, 403);

  const invalidLocation = await request(`/api/crm/companies/${companyId}`, { method: 'PATCH', body: { location: { x: 25500000, y: 6600000, label: 'Ei Helsingissä' } } });
  assert.equal(invalidLocation.response.status, 400);
  const confirmedLocation = await request(`/api/crm/companies/${companyId}`, { method: 'PATCH', body: { location: { x: 25496580, y: 6673004, label: 'Esimerkkikatu 1', source: 'Helsingin osoitehaku' } } });
  assert.equal(confirmedLocation.payload.location_status, 'confirmed');
  assert.ok(confirmedLocation.payload.x);

  const leadId = importedCompany.payload.opportunity.id;
  await request(`/api/crm/opportunities/${leadId}`, { method: 'PATCH', body: { stage: 'Yhteydenotto' } });
  const activities = await request(`/api/crm/opportunities/${leadId}/activities`, { method: 'POST', body: { kind: 'yhteydenotto', summary: 'Soitto kirjattu.' } });
  assert.equal(activities.response.status, 201);
  const calendar = await request('/api/crm/follow-ups.ics');
  assert.equal(calendar.response.status, 200);
  assert.match(calendar.response.headers.get('content-type'), /text\/calendar/);
  assert.match(calendar.payload, /DTSTART;VALUE=DATE:20261105/);
  assert.match(calendar.payload, /Tarkista tarjous/);
  const completedAction = await request(`/api/crm/opportunities/${leadId}/complete-action`, { method: 'POST', body: {} });
  assert.equal(completedAction.response.status, 200);
  assert.equal(completedAction.payload.opportunity.next_action, '');
  assert.equal(completedAction.payload.activity.kind, 'follow-up-completed');
  const secondCompletion = await request(`/api/crm/opportunities/${leadId}/complete-action`, { method: 'POST', body: {} });
  assert.equal(secondCompletion.response.status, 400);
  const sync = await request('/api/crm/sync');
  assert.equal(sync.payload.configured, false);
  assert.equal(sync.payload.items.length, 1);
  assert.equal(sync.payload.items[0].status, 'waiting-contract');
  assert.equal((await request(`/api/crm/opportunities/${leadId}/activities`)).payload.some((item) => item.summary === 'Kelpuutus → Yhteydenotto'), true);

  const invalidDrawing = await request('/api/buildings/UNKNOWN-1/drawings', { method: 'POST', body: { title: 'Huono URL', url: 'javascript:alert(1)' } });
  assert.equal(invalidDrawing.response.status, 400);
  const unverifiedDrawing = await request('/api/buildings/UNKNOWN-1/drawings', { method: 'POST', body: { title: 'Tarkistettava linkki', url: 'https://example.test/plan.pdf', revision: 'Rev A' } });
  assert.equal(unverifiedDrawing.payload.review_required, 1);
  const drawings = await request('/api/buildings/UNKNOWN-1/drawings');
  assert.equal(drawings.payload.length, 1);
  const csv = await request('/api/crm/export.csv');
  assert.equal(csv.response.status, 200);
  assert.match(csv.payload, /^"Yritys"/);
  assert.match(csv.payload, /Telineurakka, Helsinki/);

  const finalState = await request('/api/crm/bootstrap');
  assert.ok(finalState.payload.mapFeatures.some((feature) => feature.type === 'company' && feature.id === companyId));
  assert.equal(finalState.payload.syncContract.configured, false);
  assert.equal(finalState.payload.opportunities.filter((item) => item.is_demo).length, 0);
});
