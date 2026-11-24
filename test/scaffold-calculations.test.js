const assert = require('node:assert/strict');
const test = require('node:test');
const { calculateScaffold, ENGINE_VERSION, CATALOG_VERSION } = require('../lib/scaffold-calculations');
const fs = require('node:fs');
const path = require('node:path');

const stages = Object.fromEntries([
  'loads-transfer', 'foundations', 'standards-platforms', 'bracing-ties', 'global-stability',
].map((key) => [key, { component: `${key} check`, ed: 8, rd: 10, unit: 'kN', source: 'https://example.org/design.pdf', documentRevision: 'Rev A' }]));
const project = { name: 'Testikohde', drawingRevision: 'D-02', systemRevision: 'System Rev 4', geometry: '10 m korkea julkisivuteline', siteConditions: 'Betonilaatta, kantavuus varmennettava', loadsBasis: 'Suunnittelijan kuormalaskelma LC-2' };

test('scaffold engine calculates only sourced Ed/Rd ratios and preserves versions and input snapshot', () => {
  const body = { project, stages };
  const result = calculateScaffold(body);
  assert.equal(result.status, 'professional_review');
  assert.equal(result.engineVersion, ENGINE_VERSION);
  assert.equal(result.catalogVersion, CATALOG_VERSION);
  assert.equal(result.checks.length, 5);
  assert.equal(result.checks[0].result.utilization, 0.8);
  assert.deepEqual(result.inputSnapshot, body);
  assert.ok(result.warnings.length >= 3);
});

test('missing inputs or untraceable component data block calculation output', () => {
  const body = { project: { ...project, siteConditions: '' }, stages: { ...stages, foundations: { ...stages.foundations, source: 'javascript:alert(1)' } } };
  const result = calculateScaffold(body);
  assert.equal(result.status, 'incomplete');
  assert.equal(result.checks.find((item) => item.id === 'foundations').result, null);
  assert.match(result.missing.join(' '), /Alustan ja ympäristön kuvaus/);
});

test('input ratio above one is surfaced without presenting it as an accepted design', () => {
  const result = calculateScaffold({ project, stages: { ...stages, 'bracing-ties': { ...stages['bracing-ties'], ed: 12 } } });
  assert.equal(result.checks.find((item) => item.id === 'bracing-ties').status, 'exceeds-input-ratio');
  assert.equal(result.status, 'professional_review');
  assert.ok(!('approved' in result));
});

test('Helsinki workspace links the local scaffold studio and bundled sourced component catalog', () => {
  const page = fs.readFileSync(path.join(__dirname, '../public-static/workspace.js'), 'utf8');
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../public-static/data/scaffold-components.json'), 'utf8'));
  const manufacturers = JSON.parse(fs.readFileSync(path.join(__dirname, '../public-static/data/scaffold-manufacturers.json'), 'utf8'));
  assert.match(page, /Telinekartta & piirustus/);
  assert.match(page, /\/api\/helsinki\/building-footprints/);
  assert.match(page, /scaffoldFacadeCanvas/);
  assert.match(page, /selectedBuildingFootprint/);
  assert.match(page, /scaffoldFootprintDraw/);
  assert.match(page, /Käyttäjän kartalle piirtämä rakennuspolygon/);
  assert.match(page, /renderScaffoldBuildingCard/);
  assert.match(page, /scaffoldMarginPercent/);
  assert.match(page, /scaffoldVatPercent/);
  assert.match(page, /export-scaffold-quote-pdf/);
  assert.match(page, /bayCount/);
  assert.match(page, /data-facade-index/);
  assert.match(page, /parseObjMass/);
  assert.match(page, /data-building-obj-upload/);
  assert.match(page, /scaffold-manufacturer-select/);
  assert.equal(catalog.catalogStatus, 'poimittu_tarkistettava');
  assert.ok(catalog.items.length > 2000);
  assert.ok(catalog.items.every((item) => item['Valmistaja'] && item['Tuotenumero / viite']));
  assert.equal(manufacturers.items.length, 14);
  assert.ok(manufacturers.items.every((item) => item.manufacturer && item.systems && Number.isInteger(item.componentCount) && item.componentCount >= 0));
  const unparsedManufacturers = manufacturers.items.filter((item) => item.componentCount === 0);
  assert.equal(unparsedManufacturers.length, 1);
  assert.match(unparsedManufacturers[0].coverageNote, /ei ole vielä poimittu BOM-taulukkoon/i);
  assert.equal(unparsedManufacturers[0].logoUrl, '');
  assert.ok(manufacturers.items.filter((item) => item.logoUrl).length >= 4);
});

test('Dashboard mirrors the existing overview, teams, analytics and risk-analysis tabs', () => {
  const page = fs.readFileSync(path.join(__dirname, '../public-static/workspace.js'), 'utf8');
  for (const label of ['Yleiskatsaus', 'Tiimit', 'Analytiikka', 'Riskianalyysi']) assert.ok(page.includes(label));
  for (const view of ['dashboardOverviewView', 'dashboardTeamsView', 'dashboardAnalyticsView', 'dashboardRisksView']) assert.ok(page.includes(view));
  assert.match(page, /download-dashboard-report/);
});
