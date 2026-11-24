'use strict';

const ENGINE_VERSION = '0.1.0';
const CATALOG_VERSION = 'generic-0.1.0';
const STAGES = [
  ['loads-transfer', 'Kuormat ja kuormansiirto'],
  ['foundations', 'Perustukset ja alusta'],
  ['standards-platforms', 'Pystyrakenteet ja työtasot'],
  ['bracing-ties', 'Jäykistys ja sidonnat'],
  ['global-stability', 'Kokonaisvakavuus'],
];

function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function validSource(value) {
  if (!nonEmpty(value)) return false;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

function calculateScaffold(body = {}) {
  const project = body.project && typeof body.project === 'object' ? body.project : {};
  const stages = body.stages && typeof body.stages === 'object' ? body.stages : {};
  const missing = [];
  const warnings = [
    'Moottori ei johda kuormia, kuormakertoimia, tuulta, nurjahdusta, ankkurivoimia eikä perustusten kestävyyttä.',
    'Ed/Rd-suhde tarkistaa vain syötetyn mitoitusvaikutuksen ja kestävyyden vertailun. Se ei osoita telineen tai osakokonaisuuden turvallisuutta.',
    'Tulos on päätöstukea ja vaatii pätevän suomalaisen teline-/tilapäisrakennesuunnittelijan tarkastuksen ennen käyttöä.',
  ];
  if (!nonEmpty(project.name)) missing.push('Projektin nimi');
  if (!nonEmpty(project.drawingRevision)) missing.push('Piirustuksen revisio');
  if (!nonEmpty(project.systemRevision)) missing.push('Järjestelmän ja komponenttitietojen revisio');
  if (!nonEmpty(project.geometry)) missing.push('Geometria ja työmaaolosuhteet');
  if (!nonEmpty(project.siteConditions)) missing.push('Alustan ja ympäristön kuvaus');
  if (!nonEmpty(project.loadsBasis)) missing.push('Kuormien suunnitteluperusta ja lähde');
  const checks = [];
  for (const [id, label] of STAGES) {
    const item = stages[id] || {};
    const ed = Number(item.ed);
    const rd = Number(item.rd);
    const usable = nonEmpty(item.component) && nonEmpty(item.unit) && Number.isFinite(ed) && ed >= 0 && Number.isFinite(rd) && rd > 0 && validSource(item.source) && nonEmpty(item.documentRevision);
    if (!usable) {
      missing.push(`${label}: komponentti, Ed, Rd, yksikkö, lähde-URL ja lähdedokumentin revisio`);
      checks.push({ id, label, status: 'missing', result: null });
      continue;
    }
    const utilization = ed / rd;
    checks.push({
      id, label, status: utilization <= 1 ? 'within-input-ratio' : 'exceeds-input-ratio',
      result: { ed, rd, unit: item.unit, utilization: Number(utilization.toFixed(4)), component: item.component, source: item.source, documentRevision: item.documentRevision },
    });
  }
  const status = missing.length ? 'incomplete' : checks.some((check) => check.status === 'exceeds-input-ratio') ? 'professional_review' : 'professional_review';
  return {
    id: require('crypto').randomUUID(), createdAt: new Date().toISOString(), status,
    engineVersion: ENGINE_VERSION, catalogVersion: CATALOG_VERSION,
    basis: { jurisdiction: 'FI', regulation: 'Valtioneuvoston asetus rakennustyön turvallisuudesta 205/2009, 51 ja 53 §' },
    inputSnapshot: JSON.parse(JSON.stringify(body)), checks, missing, warnings,
    method: 'Lähteistettyjen käyttäjän syöttämien Ed- ja Rd-arvojen yksikkökohtainen suhde Ed/Rd. Muita rakenteellisia laskentavaiheita ei toteuteta tässä moottoriversiossa.',
    review: null,
  };
}

module.exports = { ENGINE_VERSION, CATALOG_VERSION, STAGES, calculateScaffold };
