'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { deriveHakiUniversal, deriveLayherKederRoof, deriveLayherStairTower, priceSummary } = require('./scaffold-domain');

const DEFAULT_DB_PATH = path.join(__dirname, '..', '.local-data', 'scaffold-projects.sqlite');
const STATUSES = new Set(['source', 'user', 'estimate', 'verified']);

class ProjectInputError extends Error {
  constructor(message) { super(message); this.name = 'ProjectInputError'; this.status = 400; }
}
class RevisionConflictError extends Error {
  constructor(currentRevision) { super('Projekti muuttui toisessa näkymässä. Lataa uusin revisio ennen tallentamista.'); this.name = 'RevisionConflictError'; this.status = 409; this.currentRevision = currentRevision; }
}

function finiteNonNegative(value, label, max = 1e7) {
  if (value === '' || value == null) return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) throw new ProjectInputError(`${label} ei ole kelvollinen ei-negatiivinen luku.`);
  return number;
}

function normalizeFacadeScaffolds(input) {
  if (!Array.isArray(input)) return [];
  const allowedSources = new Set(['building-footprint', 'obj-hull', 'mass-model']);
  const seen = new Set();
  return input.slice(0, 100).map((row, position) => {
    const source = allowedSources.has(row?.source) ? row.source : 'mass-model';
    const index = Number(row?.index);
    if (!Number.isInteger(index) || index < 0 || index > 10000) throw new ProjectInputError('Julkisivukohtaisen telineen sivutunniste ei ole kelvollinen.');
    const key = `${source}:${index}`;
    if (seen.has(key)) throw new ProjectInputError('Sama julkisivu on lisätty telinekokoonpanoon useammin kuin kerran.');
    seen.add(key);
    const lengthM = finiteNonNegative(row?.lengthM, 'Julkisivun pituus', 300);
    if (lengthM <= 0) throw new ProjectInputError('Julkisivukohtaisen telineen pituuden pitää olla suurempi kuin nolla.');
    const targetHeightM = finiteNonNegative(row?.targetHeightM, 'Julkisivun telinekorkeus', 120);
    const system = ['layher-allround', 'haki-universal'].includes(row?.system) ? row.system : 'layher-allround';
    const loadClass = Number(row?.loadClass ?? 3);
    if (!Number.isInteger(loadClass) || loadClass < 1 || loadClass > 6) throw new ProjectInputError('Julkisivukohtaisen telineen kuormaluokan pitää olla kokonaisluku 1–6.');
    const rawLevels = Array.isArray(row?.platformLevels) ? row.platformLevels : String(row?.platformLevels ?? '').split(/[;,\s]+/).filter(Boolean);
    const platformLevels = [...new Set(rawLevels.map(Number))].sort((a, b) => a - b);
    if (platformLevels.some((level) => !Number.isInteger(level) || level < 1 || level > 60)) throw new ProjectInputError('Julkisivukohtaiset työtasojen nousut pitää antaa kokonaislukuina 1–60.');
    const bayCount = row?.bayCount == null || row.bayCount === '' ? null : Number(row.bayCount);
    if (bayCount != null && (!Number.isInteger(bayCount) || bayCount < 0 || bayCount > 100)) throw new ProjectInputError('Julkisivukohtaisen kenttämäärän pitää olla kokonaisluku 0–100.');
    const coordinate = (value) => Array.isArray(value) && value.length >= 2 && value.slice(0, 2).every((number) => Number.isFinite(Number(number))) ? value.slice(0, 2).map(Number) : null;
    const direction = coordinate(row?.direction);
    const start = coordinate(row?.start);
    const end = coordinate(row?.end);
    return {
      id: text(row?.id || `${source}-${index}-${position + 1}`, 'Julkisivukohtaisen telineen tunniste', 120),
      source, index,
      label: text(row?.label || `Julkisivu ${index + 1}`, 'Julkisivun nimi', 120),
      lengthM, targetHeightM, system, loadClass, platformLevels, bayCount,
      direction, start, end,
      ringSize: Number.isInteger(Number(row?.ringSize)) && Number(row.ringSize) >= 3 && Number(row.ringSize) <= 100 ? Number(row.ringSize) : null,
    };
  });
}

function normalizeStairTowers(input, facadeScaffolds = []) {
  if (!Array.isArray(input)) return [];
  if (input.length > 50) throw new ProjectInputError('Yhteen projektiin voi lisätä enintään 50 porrastornia.');
  const allowedSources = new Set(['building-footprint', 'obj-hull', 'mass-model']);
  const seen = new Map();
  return input.map((row, position) => {
    const source = allowedSources.has(row?.source) ? row.source : 'mass-model';
    const index = Number(row?.index);
    if (!Number.isInteger(index) || index < 0 || index > 10000) throw new ProjectInputError('Porrastornin julkisivutunniste ei ole kelvollinen.');
    const facade = facadeScaffolds.find((plan) => plan.source === source && plan.index === index);
    if (!facade) throw new ProjectInputError('Porrastornin julkisivulle pitää lisätä telinekokoonpano ennen sijoitusta.');
    const bayLengthM = Number(row?.bayLengthM) === 3.07 ? 3.07 : Number(row?.bayLengthM) === 2.57 ? 2.57 : null;
    if (!bayLengthM) throw new ProjectInputError('Porrastornin porrasmoduulin pituuden pitää olla 2,57 m tai 3,07 m.');
    if (facade.lengthM + 0.001 < bayLengthM) throw new ProjectInputError('Porrastornille ei ole julkisivulla riittävästi pituutta.');
    const targetHeightM = finiteNonNegative(row?.targetHeightM, 'Porrastornin korkeus', 120);
    if (targetHeightM <= 0) throw new ProjectInputError('Porrastornin korkeuden pitää olla suurempi kuin nolla.');
    const positionM = finiteNonNegative(row?.positionM, 'Porrastornin sijoituskohta', 300);
    if (positionM < bayLengthM / 2 - 0.001 || positionM > facade.lengthM - bayLengthM / 2 + 0.001) throw new ProjectInputError('Porrastorni ei mahdu valittuun sijoituskohtaan julkisivulla.');
    const widthM = finiteNonNegative(row?.widthM ?? 1.4, 'Porrastornin leveys', 5);
    if (widthM < 1.4) throw new ProjectInputError('Layher-ohjeen mukainen porrastornin vähimmäisleveys on 1,40 m.');
    const key = `${source}:${index}`;
    if (!seen.has(key)) seen.set(key, []);
    const intervals = seen.get(key);
    if (intervals.some((prior) => Math.abs(prior.positionM - positionM) < (prior.bayLengthM + bayLengthM) / 2 - 0.001)) throw new ProjectInputError('Porrastornit menevät julkisivulla päällekkäin. Valitse niille eri kohdat.');
    intervals.push({ positionM, bayLengthM });
    const id = text(row?.id || `stair-tower-${source}-${index}-${position + 1}`, 'Porrastornin tunniste', 120);
    return {
      id, source, index, label: text(row?.label || facade.label, 'Porrastornin julkisivu', 120),
      positionM, targetHeightM, bayLengthM, widthM, facadeLengthM: facade.lengthM, loadClass: facade.loadClass,
    };
  });
}

function normalizeCornerReviews(input) {
  if (!Array.isArray(input)) return [];
  const allowedChecks = new Set(['geometry', 'clearance', 'frames', 'platforms', 'edge-protection', 'ties-bracing', 'access', 'detail-approval']);
  const seen = new Set();
  return input.slice(0, 100).map((row) => {
    const key = text(row?.key, 'Kulmatarkistuksen tunniste', 160, true);
    if (seen.has(key)) throw new ProjectInputError('Sama kulma on tallennettu useammin kuin kerran.');
    seen.add(key);
    const checks = [...new Set((Array.isArray(row?.checks) ? row.checks : []).filter((check) => allowedChecks.has(check)))];
    return { key, checks, note: text(row?.note, 'Kulman tarkistusmuistio', 2000) };
  });
}

function normalizeDrawingReviews(input) {
  if (!Array.isArray(input)) return [];
  const allowedIds = new Set(['floor-geometry', 'existing-conditions', 'ground-levels', 'reference-point', 'working-face', 'openings-access', 'services-obstructions', 'external-constraints', 'component-buildability', 'design-basis-coordination', 'revision-coordination', 'drawing-legend', 'detail-necessity', 'detail-interface', 'detail-view-coordination', 'view-cross-check', 'bracing-load-path', 'work-requirements', 'system-compatibility', 'critical-sections', 'access-stability', 'final-read-through', 'information-gaps']);
  const allowedStatuses = new Set(['unchecked', 'reviewed', 'open', 'detail-required', 'not-applicable']);
  const seen = new Set();
  return input.slice(0, 30).map((row) => {
    const id = text(row?.id, 'Piirustustarkistuksen tunniste', 80, true);
    if (!allowedIds.has(id) || seen.has(id)) throw new ProjectInputError('Piirustustarkistuksen tunniste ei kelpaa.');
    seen.add(id);
    const status = allowedStatuses.has(row?.status) ? row.status : 'unchecked';
    if (status === 'detail-required' && id !== 'detail-necessity') throw new ProjectInputError('Detaljin tarpeen tila kuuluu vain detaljitarpeen tarkistukseen.');
    return { id, status, note: text(row?.note, 'Piirustustarkistuksen huomio', 1500) };
  });
}

function text(value, label, max = 500, required = false) {
  const output = String(value ?? '').trim().slice(0, max);
  if (required && !output) throw new ProjectInputError(`${label} puuttuu.`);
  return output;
}

function normalizeBuilding(input = {}) {
  const building = input && typeof input === 'object' ? input : {};
  const heightStatus = STATUSES.has(building.height?.status) ? building.height.status : 'user';
  const heightValue = finiteNonNegative(building.height?.value, 'Rakennuskorkeus', 500);
  const heightSource = text(building.height?.source, 'Korkeuden lähde', 1000);
  if (heightStatus === 'verified' && !heightSource) throw new ProjectInputError('Tarkistetulle rakennuskorkeudelle tarvitaan lähdeviite.');
  const footprint = Array.isArray(building.footprint) ? building.footprint.slice(0, 20000).map((point) => {
    if (!Array.isArray(point) || point.length < 2 || !point.slice(0, 2).every((n) => Number.isFinite(Number(n)))) throw new ProjectInputError('Rakennuksen jalanjälkigeometria sisältää virheellisen pisteen.');
    return [Number(point[0]), Number(point[1])];
  }) : [];
  if (footprint.length && footprint.length < 3) throw new ProjectInputError('Rakennuspolygonissa pitää olla vähintään kolme pistettä.');
  let properties = {};
  if (building.properties && typeof building.properties === 'object' && !Array.isArray(building.properties)) {
    const encoded = JSON.stringify(building.properties);
    if (encoded.length > 20000) throw new ProjectInputError('Rakennuksen lähdeominaisuudet ovat liian suuret tallennettavaksi.');
    properties = JSON.parse(encoded);
  }
  const projectCrs = text(building.projectCrs || 'EPSG:3879', 'Projektikoordinaatisto', 40).toUpperCase();
  if (projectCrs !== 'EPSG:3879' && projectCrs !== 'ETRS-GK25' && projectCrs !== 'GK25FIN') throw new ProjectInputError('Projektin rakennusgeometria pitää tallentaa Helsingin EPSG:3879-koordinaatistossa.');
  if (footprint.length && footprint.some(([x, y]) => x < 25400000 || x > 25550000 || y < 6650000 || y > 6700000)) throw new ProjectInputError('Rakennuksen jalanjälki ei sijoitu tarkistettuun Helsingin EPSG:3879-alueeseen.');
  const retrievedAt = text(building.retrievedAt, 'Lähteen hakuaika', 50);
  if (footprint.length && (!retrievedAt || Number.isNaN(Date.parse(retrievedAt)))) throw new ProjectInputError('Lähdegeometrialle vaaditaan kelvollinen hakuajankohta.');
  return {
    id: text(building.id, 'Rakennustunniste', 180),
    name: text(building.name, 'Rakennuksen nimi', 240),
    address: text(building.address, 'Rakennuksen osoite', 300),
    parcelId: text(building.parcelId, 'Kiinteistötunnus', 100),
    source: text(building.source, 'Rakennuksen lähde', 500, true),
    sourceCrs: text(building.sourceCrs || (footprint.length ? 'EPSG:4326' : 'user-input'), 'Lähdekoordinaatisto', 40),
    projectCrs: 'EPSG:3879',
    retrievedAt,
    footprint,
    footprintStatus: footprint.length ? (STATUSES.has(building.footprintStatus) ? building.footprintStatus : 'estimate') : 'user',
    facadeIndex: Number.isInteger(Number(building.facadeIndex)) && Number(building.facadeIndex) >= 0 ? Number(building.facadeIndex) : null,
    height: { value: heightValue, status: heightStatus, source: heightSource },
    properties,
  };
}

function normalizePricing(input = {}) {
  const pricing = input && typeof input === 'object' ? input : {};
  const components = {};
  for (const [key, value] of Object.entries(pricing.components || {}).slice(0, 100)) {
    components[String(key).slice(0, 80)] = {
      purchasePerUnit: finiteNonNegative(value?.purchasePerUnit, 'Komponentin ostohinta', 1e7),
      rentalPerUnitDay: finiteNonNegative(value?.rentalPerUnitDay, 'Komponentin vuokrahinta', 1e7),
      rentalDays: finiteNonNegative(value?.rentalDays, 'Vuokra-aika', 36500),
      priceSource: text(value?.priceSource, 'Hinnan lähde', 500),
      priceCheckedAt: text(value?.priceCheckedAt, 'Hinnan tarkistusaika', 50),
    };
  }
  const catalogLinks = {};
  for (const [key, value] of Object.entries(pricing.catalogLinks || {}).slice(0, 100)) {
    const itemNo = text(value?.itemNo, 'Katalogin tuotenumero', 120, true);
    const source = text(value?.source, 'Katalogin lähde', 1000);
    if (source) {
      let url;
      try { url = new URL(source); } catch { throw new ProjectInputError('Katalogilinkin pitää olla HTTP- tai HTTPS-osoite.'); }
      if (!['http:', 'https:'].includes(url.protocol)) throw new ProjectInputError('Katalogilinkin pitää olla HTTP- tai HTTPS-osoite.');
    }
    catalogLinks[String(key).slice(0, 80)] = {
      catalogId: text(value?.catalogId || itemNo, 'Katalogin tietuetunniste', 180),
      manufacturer: text(value?.manufacturer, 'Katalogin valmistaja', 120, true),
      system: text(value?.system, 'Katalogin järjestelmä', 160, true),
      itemNo,
      name: text(value?.name, 'Katalogikomponentti', 240, true),
      size: text(value?.size, 'Katalogikomponentin koko', 160),
      source,
      revision: text(value?.revision, 'Katalogin revisio', 160),
      status: 'user-selected-needs-compatibility-review',
    };
  }
  const installationEstimateInput = pricing.installationEstimateBasis && typeof pricing.installationEstimateBasis === 'object' ? pricing.installationEstimateBasis : null;
  const installationEstimateBasis = {
    enabled: installationEstimateInput?.enabled == null ? null : Boolean(installationEstimateInput.enabled),
    dismantlingEnabled: installationEstimateInput?.dismantlingEnabled == null ? null : Boolean(installationEstimateInput.dismantlingEnabled),
    inspectionEnabled: installationEstimateInput?.inspectionEnabled == null ? null : Boolean(installationEstimateInput.inspectionEnabled),
    minutesPerPart: finiteNonNegative(installationEstimateInput?.minutesPerPart ?? 3, 'BOM-osan asennusmenekki', 600),
    inspectionMinutesPerPart: finiteNonNegative(installationEstimateInput?.inspectionMinutesPerPart ?? 1, 'BOM-osan tarkastusmenekki', 600),
    referenceHeightM: finiteNonNegative(installationEstimateInput?.referenceHeightM ?? 10, 'Asennusarvion vertailukorkeus', 120),
    heightIncreasePercentPer10M: finiteNonNegative(installationEstimateInput?.heightIncreasePercentPer10M ?? 10, 'Asennusarvion korkeuslisä', 500),
    crewSize: finiteNonNegative(installationEstimateInput?.crewSize ?? 2, 'Asennusryhmän henkilömäärä', 50),
  };
  if (!Number.isInteger(installationEstimateBasis.crewSize) || installationEstimateBasis.crewSize < 1) throw new ProjectInputError('Asennusryhmän henkilömäärän pitää olla kokonaisluku välillä 1–50.');
  const labor = Array.isArray(pricing.labor) ? pricing.labor.slice(0, 100).map((row) => ({
    description: text(row?.description, 'Työrivin kuvaus', 200),
    hours: finiteNonNegative(row?.hours, 'Työtunnit', 1e6),
    ratePerHour: finiteNonNegative(row?.ratePerHour, 'Tuntihinta', 1e7),
    source: text(row?.source, 'Työrivin lähde', 500),
    rateSource: text(row?.rateSource, 'Työtuntihinnan lähde', 500),
  })) : [];
  const transport = Array.isArray(pricing.transport) ? pricing.transport.slice(0, 100).map((row) => ({
    description: text(row?.description, 'Kuljetusrivin kuvaus', 200),
    quantity: finiteNonNegative(row?.quantity, 'Kuljetusten määrä', 1e6),
    amountPerUnit: finiteNonNegative(row?.amountPerUnit, 'Kuljetuksen yksikköhinta', 1e7),
    source: text(row?.source, 'Kuljetusrivin lähde', 500),
    rateSource: text(row?.rateSource, 'Kuljetushinnan lähde', 500),
  })) : [];
  const quoteInput = pricing.quoteTerms && typeof pricing.quoteTerms === 'object' ? pricing.quoteTerms : {};
  const optionalPercent = (value, label, max) => value == null || value === '' ? null : finiteNonNegative(value, label, max);
  const validUntil = text(quoteInput.validUntil, 'Hintojen voimassaolopäivä', 10);
  const validUntilDate = validUntil ? new Date(`${validUntil}T00:00:00.000Z`) : null;
  if (validUntil && (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || Number.isNaN(validUntilDate.getTime()) || validUntilDate.toISOString().slice(0, 10) !== validUntil)) throw new ProjectInputError('Hintojen voimassaolopäivän pitää olla kelvollinen päivä muodossa VVVV-KK-PP.');
  const marginPercent = optionalPercent(quoteInput.marginPercent, 'Kateprosentti', 99.99);
  const vatPercent = optionalPercent(quoteInput.vatPercent, 'ALV-prosentti', 100);
  return {
    components, catalogLinks, labor, transport, installationEstimateBasis,
    otherCosts: finiteNonNegative(pricing.otherCosts, 'Muut kustannukset', 1e8),
    otherCostsSource: text(pricing.otherCostsSource, 'Muiden kustannusten lähde', 500),
    quoteTerms: {
      currency: 'EUR',
      marginPercent,
      vatPercent,
      validUntil,
      priceEnteredBy: text(quoteInput.priceEnteredBy, 'Hinnan syöttäjä', 160),
    },
  };
}

function normalizeProject(input, { id, revision, createdAt, updatedAt, workflow } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ProjectInputError('Projektin pitää olla JSON-objekti.');
  const name = text(input.name, 'Projektin nimi', 160, true);
  const geometryInput = input.geometry && typeof input.geometry === 'object' ? input.geometry : {};
  const facadeInput = geometryInput.facadeSelection && typeof geometryInput.facadeSelection === 'object' ? geometryInput.facadeSelection : null;
  const facadeSource = ['building-footprint','obj-hull','mass-model'].includes(facadeInput?.source) ? facadeInput.source : '';
  const facadeScaffolds = normalizeFacadeScaffolds(geometryInput.facadeScaffolds);
  const stairTowers = normalizeStairTowers(geometryInput.stairTowers, facadeScaffolds);
  const geometry = {
    targetLengthM: finiteNonNegative(geometryInput.targetLengthM, 'Julkisivun tavoitepituus', 300),
    targetHeightM: finiteNonNegative(geometryInput.targetHeightM, 'Telinekorkeus', 120),
    buildingDepthM: finiteNonNegative(geometryInput.buildingDepthM, 'Rakennuksen syvyys', 200),
    workPurpose: text(geometryInput.workPurpose, 'Työn tarkoitus', 1500),
    system: ['layher-allround', 'haki-universal'].includes(String(geometryInput.system || (input.system?.id === 'haki-universal' ? 'haki-universal' : 'layher-allround'))) ? String(geometryInput.system || (input.system?.id === 'haki-universal' ? 'haki-universal' : 'layher-allround')) : 'layher-allround',
    loadClass: Number(geometryInput.loadClass ?? 3),
    platformLevels: Array.isArray(geometryInput.platformLevels) ? geometryInput.platformLevels.slice(0, 100).map(Number) : String(geometryInput.platformLevels ?? '').split(/[;,\s]+/).filter(Boolean).map(Number),
    bayCount: geometryInput.bayCount == null || geometryInput.bayCount === '' ? null : (() => {
      const count = Number(geometryInput.bayCount);
      if (!Number.isInteger(count) || count < 0 || count > 100) throw new ProjectInputError('Kenttien määrän pitää olla kokonaisluku välillä 0–100.');
      return count;
    })(),
    scale: [50, 100, 200, 250, 500].includes(Number(geometryInput.scale)) ? Number(geometryInput.scale) : 100,
    facadeSelection: facadeSource && Number.isInteger(Number(facadeInput.index)) && Number(facadeInput.index) >= 0
      ? { source: facadeSource, index: Number(facadeInput.index), label: text(facadeInput.label, 'Valitun julkisivun nimi', 120), lengthM: finiteNonNegative(facadeInput.lengthM, 'Valitun julkisivun pituus', 300), direction: Array.isArray(facadeInput.direction) && facadeInput.direction.length >= 2 && facadeInput.direction.slice(0,2).every(Number.isFinite) ? facadeInput.direction.slice(0,2).map(Number) : null }
      : null,
    facadeScaffolds,
    stairTowers,
    cornerReviews: normalizeCornerReviews(geometryInput.cornerReviews),
    designReviews: normalizeDrawingReviews(geometryInput.designReviews),
    kederRoof: (() => {
      const input = geometryInput.kederRoof && typeof geometryInput.kederRoof === 'object' ? geometryInput.kederRoof : {};
      const sourceAllowed = ['building-footprint', 'obj-hull', 'mass-model'];
      const facades = Array.isArray(input.facades) ? input.facades.slice(0, 2).map((face, index) => {
        const start = Array.isArray(face?.start) && face.start.length >= 2 && face.start.slice(0, 2).every(Number.isFinite) ? face.start.slice(0, 2).map(Number) : null;
        const end = Array.isArray(face?.end) && face.end.length >= 2 && face.end.slice(0, 2).every(Number.isFinite) ? face.end.slice(0, 2).map(Number) : null;
        return {
          source: sourceAllowed.includes(face?.source) ? face.source : 'building-footprint',
          index: Number.isInteger(Number(face?.index)) && Number(face.index) >= 0 ? Number(face.index) : index,
          label: text(face?.label, 'Keder-julkisivun nimi', 120),
          lengthM: finiteNonNegative(face?.lengthM, 'Keder-julkisivun pituus', 300),
          direction: Array.isArray(face?.direction) && face.direction.length >= 2 && face.direction.slice(0, 2).every(Number.isFinite) ? face.direction.slice(0, 2).map(Number) : null,
          start, end,
          ringSize: Number.isInteger(Number(face?.ringSize)) && Number(face.ringSize) >= 3 && Number(face.ringSize) <= 100 ? Number(face.ringSize) : null,
        };
      }) : [];
      const supportAxisM = Number(input.supportAxisM) === 1.09 ? 1.09 : 0.73;
      return { enabled: Boolean(input.enabled), supportAxisM, bracingVariant: ['light', 'standard', 'heavy'].includes(input.bracingVariant) ? input.bracingVariant : 'standard', facades };
    })(),
  };
  if (geometry.platformLevels.some((level) => !Number.isInteger(level) || level < 1 || level > 60)) throw new ProjectInputError('Työtasojen nousujen pitää olla kokonaislukuja 1–60.');
  if (!Number.isInteger(geometry.loadClass) || geometry.loadClass < 1 || geometry.loadClass > 6) throw new ProjectInputError('Kuormaluokan pitää olla kokonaisluku 1–6.');
  const building = normalizeBuilding(input.building);
  const provenanceInput = input.provenance && typeof input.provenance === 'object' ? input.provenance : {};
  const provenance = {
    targetLength: { status: STATUSES.has(provenanceInput.targetLength?.status) ? provenanceInput.targetLength.status : (building.footprint.length ? 'source' : 'user'), source: text(provenanceInput.targetLength?.source || (building.footprint.length ? building.source : 'Käyttäjän syöttämä julkisivumitta'), 'Julkisivumitan lähde', 500), checkedAt: text(provenanceInput.targetLength?.checkedAt || building.retrievedAt, 'Julkisivumitan tarkistusaika', 50) },
    targetHeight: { status: STATUSES.has(provenanceInput.targetHeight?.status) ? provenanceInput.targetHeight.status : building.height.status, source: text(provenanceInput.targetHeight?.source || building.height.source, 'Telinekorkeuden lähde', 500), checkedAt: text(provenanceInput.targetHeight?.checkedAt, 'Telinekorkeuden tarkistusaika', 50) },
    buildingDepth: { status: STATUSES.has(provenanceInput.buildingDepth?.status) ? provenanceInput.buildingDepth.status : 'user', source: text(provenanceInput.buildingDepth?.source || 'Käyttäjän syöttämä rakennuksen syvyys', 'Rakennussyvyyden lähde', 500), checkedAt: text(provenanceInput.buildingDepth?.checkedAt, 'Rakennussyvyyden tarkistusaika', 50) },
  };
  const pricing = normalizePricing(input.pricing);
  const baseModel = deriveHakiUniversal({ ...geometry, system: geometry.system, platformLevels: geometry.platformLevels, bayCount: geometry.bayCount });
  const facadeModels = geometry.facadeScaffolds.map((plan) => ({
    plan,
    model: deriveHakiUniversal({
      system: plan.system,
      targetLengthM: plan.lengthM,
      targetHeightM: plan.targetHeightM,
      loadClass: plan.loadClass,
      platformLevels: plan.platformLevels,
      bayCount: plan.bayCount,
    }),
  }));
  let model = baseModel;
  if (facadeModels.length) {
    const bomByKey = new Map();
    const priceIds = new Set();
    for (const { plan, model: facadeModel } of facadeModels) for (const line of facadeModel.bom) {
      const key = `${line.id}|${line.system}`;
      const existing = bomByKey.get(key);
      if (existing) {
        existing.quantity += line.quantity;
        existing.totalWeightKg = existing.unitWeightKg == null ? null : Number((existing.totalWeightKg + line.totalWeightKg).toFixed(1));
        existing.facadeBreakdown.push({ label: plan.label, quantity: line.quantity });
      } else {
        let priceId = line.id;
        if (priceIds.has(priceId)) priceId = `${plan.system}:${line.id}`;
        priceIds.add(priceId);
        bomByKey.set(key, { ...line, id: priceId, facadeBreakdown: [{ label: plan.label, quantity: line.quantity }] });
      }
    }
    const systemNames = [...new Set(facadeModels.map(({ model: facadeModel }) => facadeModel.system.name))];
    const systems = [...new Map(facadeModels.map(({ model: facadeModel }) => [facadeModel.system.id, facadeModel.system])).values()];
    model = {
      ...baseModel,
      system: systems.length === 1 ? systems[0] : { id: 'facade-specific-systems', manufacturer: systems.map((row) => row.manufacturer).join(' / '), name: 'Julkisivukohtaiset järjestelmät', manualRevision: systemNames.join(' / '), manualUrl: '' },
      bom: [...bomByKey.values()],
      warnings: [...new Set(facadeModels.flatMap(({ plan, model: facadeModel }) => facadeModel.warnings.map((warning) => `${plan.label}: ${warning}`)))],
      unresolved: facadeModels.flatMap(({ plan, model: facadeModel }) => facadeModel.unresolved.map((row) => ({ ...row, id: `${plan.id}:${row.id}`, label: `${plan.label}: ${row.label}` }))),
      facadeScaffolds: facadeModels.map(({ plan, model: facadeModel }) => ({ ...plan, dimensions: facadeModel.dimensions, status: facadeModel.status, calculationBoundary: facadeModel.calculationBoundary })),
    };
  }
  const kederRoof = deriveLayherKederRoof({ ...geometry.kederRoof, loadClass: geometry.loadClass });
  model.kederRoof = kederRoof;
  if (kederRoof.enabled) {
    model.bom.push(...kederRoof.bom);
    model.unresolved.push(...kederRoof.unresolved);
    model.warnings.push(...kederRoof.warnings);
  }
  const stairTowerModels = geometry.stairTowers.map((tower) => ({
    tower,
    model: deriveLayherStairTower({ ...tower, loadClass: tower.loadClass }),
  }));
  const towerBomById = new Map();
  for (const { tower, model: stairModel } of stairTowerModels) for (const line of stairModel.bom) {
    const existing = towerBomById.get(line.id);
    const breakdown = { label: `${tower.label} · ${tower.positionM.toFixed(2)} m`, quantity: line.quantity };
    if (existing) {
      existing.quantity += line.quantity;
      existing.totalWeightKg = existing.unitWeightKg == null ? null : Number((existing.totalWeightKg + line.totalWeightKg).toFixed(1));
      existing.towerBreakdown.push(breakdown);
    } else towerBomById.set(line.id, { ...line, towerBreakdown: [breakdown] });
  }
  model.bom.push(...towerBomById.values());
  model.stairTowers = stairTowerModels.map(({ tower, model: stairModel }) => ({ ...tower, dimensions: stairModel.dimensions, status: stairModel.status, calculationBoundary: stairModel.calculationBoundary }));
  model.warnings.push(...stairTowerModels.flatMap(({ tower, model: stairModel }, index) => stairModel.warnings.map((warning) => `${tower.label} · porrastorni ${index + 1}: ${warning}`)));
  model.unresolved.push(...stairTowerModels.flatMap(({ tower, model: stairModel }, index) => stairModel.unresolved.map((item) => ({ ...item, id: `${tower.id}:${item.id}`, label: `${tower.label} · porrastorni ${index + 1}: ${item.label}` }))));
  model.warnings = [...new Set(model.warnings)];
  for (const line of model.bom) line.catalogLink = pricing.catalogLinks[line.id] || null;
  return {
    schemaVersion: 1,
    id: id || text(input.id, 'Projektitunniste', 80) || crypto.randomUUID(),
    name,
    customerId: text(input.customerId, 'Asiakastunniste', 80),
    customerName: text(input.customerName, 'Asiakkaan nimi', 200),
    createdAt: createdAt || text(input.createdAt, 'Luontiaika', 50) || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
    revision: Number(revision || input.revision || 1),
    building,
    geometry,
    provenance,
    system: model.system,
    model,
    pricing,
    costSummary: priceSummary(model, pricing),
    workflow: workflow || { state: 'draft', reviewedAt: null, reviewer: null, decision: null, note: '' },
    reviewLimit: 'Paikallisesti kirjattu tarkastus ei ole digitaalinen allekirjoitus eikä rakenteellisen suunnitelman hyväksyntä.',
  };
}

function openScaffoldProjectStore(filename = process.env.TELINEHALLINTA_SCAFFOLD_DB || DEFAULT_DB_PATH) {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  try { fs.chmodSync(path.dirname(filename), 0o700); } catch {}
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS scaffold_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      revision INTEGER NOT NULL,
      project_json TEXT NOT NULL,
      content_sha256 TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scaffold_project_revisions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES scaffold_projects(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL,
      project_json TEXT NOT NULL,
      content_sha256 TEXT NOT NULL,
      change_kind TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(project_id, revision)
    );
    CREATE INDEX IF NOT EXISTS scaffold_revision_project_idx ON scaffold_project_revisions(project_id, revision DESC);
    CREATE TABLE IF NOT EXISTS geo_management_markers (
      id TEXT PRIMARY KEY,
      module_key TEXT NOT NULL,
      title TEXT NOT NULL,
      easting REAL NOT NULL,
      northing REAL NOT NULL,
      crs TEXT NOT NULL CHECK(crs = 'EPSG:3879'),
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS geo_marker_updated_idx ON geo_management_markers(updated_at DESC);
    CREATE TABLE IF NOT EXISTS scaffold_project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES scaffold_projects(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('drawing','building-model','scaffold-model','other')),
      filename TEXT NOT NULL,
      stored_name TEXT NOT NULL UNIQUE,
      content_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS scaffold_file_project_idx ON scaffold_project_files(project_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS scaffold_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_project_id TEXT NOT NULL,
      template_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS scaffold_template_updated_idx ON scaffold_templates(updated_at DESC);
    CREATE TABLE IF NOT EXISTS scaffold_project_deliveries (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES scaffold_projects(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL,
      title TEXT NOT NULL,
      building_name TEXT NOT NULL,
      building_address TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      delivery_time TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Suunniteltu','Lastaus','Matkalla','Perillä','Palautettu','Valmis')),
      items_json TEXT NOT NULL,
      total_quantity REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS scaffold_delivery_project_idx ON scaffold_project_deliveries(project_id, revision DESC);
    CREATE INDEX IF NOT EXISTS scaffold_delivery_schedule_idx ON scaffold_project_deliveries(delivery_date, delivery_time);
  `);

  const getStmt = db.prepare('SELECT project_json FROM scaffold_projects WHERE id = ?');
  const listStmt = db.prepare('SELECT id,name,revision,created_at,updated_at,project_json FROM scaffold_projects ORDER BY updated_at DESC');
  const revisionListStmt = db.prepare('SELECT revision,content_sha256,change_kind,created_at,project_json FROM scaffold_project_revisions WHERE project_id = ? ORDER BY revision DESC');

  function readProject(id) { const row = getStmt.get(String(id)); return row ? JSON.parse(row.project_json) : null; }
  function putRevision(project, changeKind) {
    const json = JSON.stringify(project);
    const digest = crypto.createHash('sha256').update(json).digest('hex');
    db.prepare(`INSERT INTO scaffold_projects (id,name,revision,project_json,content_sha256,created_at,updated_at)
      VALUES (@id,@name,@revision,@project_json,@content_sha256,@created_at,@updated_at)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,revision=excluded.revision,project_json=excluded.project_json,content_sha256=excluded.content_sha256,updated_at=excluded.updated_at`)
      .run({ id: project.id, name: project.name, revision: project.revision, project_json: json, content_sha256: digest, created_at: project.createdAt, updated_at: project.updatedAt });
    db.prepare(`INSERT INTO scaffold_project_revisions (id,project_id,revision,project_json,content_sha256,change_kind,created_at)
      VALUES (@id,@project_id,@revision,@project_json,@content_sha256,@change_kind,@created_at)`)
      .run({ id: crypto.randomUUID(), project_id: project.id, revision: project.revision, project_json: json, content_sha256: digest, change_kind: changeKind, created_at: project.updatedAt });
  }
  const saveTx = db.transaction((project, changeKind) => putRevision(project, changeKind));

  function listProjects() {
    return listStmt.all().map((row) => {
      const project = JSON.parse(row.project_json);
      return { id: row.id, name: row.name, revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at, workflow: project.workflow?.state || 'draft', buildingName: project.building?.name || project.building?.address || 'Käsin annettu kohde' };
    });
  }

  function createProject(input) {
    const now = new Date().toISOString();
    const project = normalizeProject(input, { id: crypto.randomUUID(), revision: 1, createdAt: now, updatedAt: now });
    saveTx(project, 'created');
    return project;
  }

  function updateProject(id, input, expectedRevision) {
    const existing = readProject(id);
    if (!existing) return null;
    const expected = Number(expectedRevision);
    if (!Number.isInteger(expected) || expected !== existing.revision) throw new RevisionConflictError(existing.revision);
    const unchanged = normalizeProject(input, { id: existing.id, revision: existing.revision, createdAt: existing.createdAt, updatedAt: existing.updatedAt, workflow: existing.workflow });
    if (JSON.stringify(unchanged) === JSON.stringify(existing)) return existing;
    const now = new Date().toISOString();
    const project = normalizeProject(input, { id: existing.id, revision: existing.revision + 1, createdAt: existing.createdAt, updatedAt: now, workflow: { state: 'draft', reviewedAt: null, reviewer: null, decision: null, note: '' } });
    saveTx(project, 'edited');
    return project;
  }

  function addReview(id, input = {}) {
    const existing = readProject(id);
    if (!existing) return null;
    const expected = Number(input.expectedRevision);
    if (!Number.isInteger(expected) || expected !== existing.revision) throw new RevisionConflictError(existing.revision);
    const reviewer = text(input.reviewer, 'Tarkastajan nimi', 160, true);
    const decision = input.decision === 'changes-requested' ? 'changes-requested' : input.decision === 'reviewed' ? 'reviewed' : '';
    if (!decision) throw new ProjectInputError('Valitse tarkastuksen tulos.');
    const project = {
      ...existing,
      revision: existing.revision + 1,
      updatedAt: new Date().toISOString(),
      workflow: { state: decision, reviewedAt: new Date().toISOString(), reviewer, decision, note: text(input.note, 'Tarkastushuomio', 2000) },
    };
    saveTx(project, 'local-review-record');
    return project;
  }

  function listRevisions(id) {
    if (!readProject(id)) return null;
    return revisionListStmt.all(String(id)).map((row) => ({ revision: row.revision, sha256: row.content_sha256, changeKind: row.change_kind, createdAt: row.created_at, project: JSON.parse(row.project_json) }));
  }

  const fileMetadata = (row) => ({ id: row.id, projectId: row.project_id, revision: row.revision, kind: row.kind, filename: row.filename, contentType: row.content_type, sizeBytes: row.size_bytes, sha256: row.sha256, createdAt: row.created_at, downloadUrl: `/api/scaffold/projects/${encodeURIComponent(row.project_id)}/files/${encodeURIComponent(row.id)}` });
  function addProjectFile(projectId, input) {
    const project = readProject(projectId);
    if (!project) return null;
    const id = input.id || crypto.randomUUID(), now = new Date().toISOString();
    const row = { id, project_id: String(projectId), revision: project.revision, kind: input.kind, filename: input.filename, stored_name: input.storedName, content_type: input.contentType, size_bytes: input.sizeBytes, sha256: input.sha256, created_at: now };
    db.prepare(`INSERT INTO scaffold_project_files (id,project_id,revision,kind,filename,stored_name,content_type,size_bytes,sha256,created_at) VALUES (@id,@project_id,@revision,@kind,@filename,@stored_name,@content_type,@size_bytes,@sha256,@created_at)`).run(row);
    return fileMetadata(row);
  }
  function listProjectFiles(projectId) {
    if (!readProject(projectId)) return null;
    return db.prepare('SELECT * FROM scaffold_project_files WHERE project_id = ? ORDER BY created_at DESC').all(String(projectId)).map(fileMetadata);
  }
  function getProjectFile(projectId, fileId) {
    const row = db.prepare('SELECT * FROM scaffold_project_files WHERE project_id = ? AND id = ?').get(String(projectId), String(fileId));
    return row ? fileMetadata(row) : null;
  }
  const deliveryFromRow = (row) => ({ id: row.id, projectId: row.project_id, projectRevision: row.revision, title: row.title, buildingName: row.building_name, buildingAddress: row.building_address, date: row.delivery_date, time: row.delivery_time, vehicle: row.vehicle, status: row.status, items: JSON.parse(row.items_json), totalQuantity: row.total_quantity, createdAt: row.created_at, updatedAt: row.updated_at });
  function listDeliveries() { return db.prepare('SELECT * FROM scaffold_project_deliveries ORDER BY delivery_date, delivery_time, created_at DESC').all().map(deliveryFromRow); }
  function createDelivery(projectId, input = {}) {
    const project = readProject(projectId);
    if (!project) return null;
    const expectedRevision = Number(input.expectedRevision);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== project.revision) throw new RevisionConflictError(project.revision);
    const date = text(input.date, 'Toimituspäivä', 10, true), time = text(input.time, 'Toimitusaika', 5, true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) throw new ProjectInputError('Toimituspäivän pitää olla muodossa YYYY-MM-DD.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new ProjectInputError('Toimitusajan pitää olla muodossa HH:MM.');
    const vehicle = text(input.vehicle, 'Ajoneuvo', 100);
    const duplicate = db.prepare('SELECT * FROM scaffold_project_deliveries WHERE project_id=? AND revision=? AND delivery_date=? AND delivery_time=? AND vehicle=? ORDER BY created_at DESC LIMIT 1').get(project.id, project.revision, date, time, vehicle);
    if (duplicate) return { delivery: deliveryFromRow(duplicate), duplicate: true };
    const items = (project.model.bom || []).map((line) => {
      const match = line.catalogLink || project.pricing.catalogLinks?.[line.id] || null;
      return { itemNo: match?.itemNo || line.itemNo, modelItemNo: line.itemNo, name: match?.name || line.name, modelName: line.name, quantity: line.quantity, unit: line.unit || 'kpl', source: match?.source || line.source, catalogRevision: match?.revision || line.catalogRevision, catalogLinkStatus: match?.status || 'unlinked' };
    });
    if (!items.length) throw new ProjectInputError('Projektin BOM on tyhjä. Luo ensin mallin materiaaliluettelo.');
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const now = new Date().toISOString(), row = { id: crypto.randomUUID(), project_id: project.id, revision: project.revision, title: `${project.name} · BOM-toimitus`, building_name: project.building.name || project.building.address || project.name, building_address: project.building.address || '', delivery_date: date, delivery_time: time, vehicle, status: 'Suunniteltu', items_json: JSON.stringify(items), total_quantity: totalQuantity, created_at: now, updated_at: now };
    db.prepare(`INSERT INTO scaffold_project_deliveries (id,project_id,revision,title,building_name,building_address,delivery_date,delivery_time,vehicle,status,items_json,total_quantity,created_at,updated_at) VALUES (@id,@project_id,@revision,@title,@building_name,@building_address,@delivery_date,@delivery_time,@vehicle,@status,@items_json,@total_quantity,@created_at,@updated_at)`).run(row);
    return { delivery: deliveryFromRow(row), duplicate: false };
  }
  function updateDeliveryStatus(id, status) {
    const allowed = new Set(['Suunniteltu','Lastaus','Matkalla','Perillä','Palautettu','Valmis']);
    if (!allowed.has(status)) throw new ProjectInputError('Tuntematon toimituksen tila.');
    const result = db.prepare('UPDATE scaffold_project_deliveries SET status=?,updated_at=? WHERE id=?').run(status,new Date().toISOString(),String(id));
    return result.changes ? deliveryFromRow(db.prepare('SELECT * FROM scaffold_project_deliveries WHERE id=?').get(String(id))) : null;
  }
  function listTemplates() {
    return db.prepare('SELECT id,name,source_project_id,created_at,updated_at FROM scaffold_templates ORDER BY updated_at DESC').all().map((row) => ({ id: row.id, name: row.name, sourceProjectId: row.source_project_id, createdAt: row.created_at, updatedAt: row.updated_at }));
  }
  function saveTemplate(projectId, name) {
    const project = readProject(projectId);
    if (!project) return null;
    const id = crypto.randomUUID(), now = new Date().toISOString();
    const template = { schemaVersion: 1, geometry: project.geometry, system: project.system, pricing: project.pricing, model: project.model };
    const statement = db.prepare('INSERT INTO scaffold_templates (id,name,source_project_id,template_json,created_at,updated_at) VALUES (?,?,?,?,?,?)');
    statement.run(id, text(name || project.name, 'Telinemallin nimi', 160, true), project.id, JSON.stringify(template), now, now);
    return getTemplate(id);
  }
  function getTemplate(id) {
    const row = db.prepare('SELECT * FROM scaffold_templates WHERE id = ?').get(String(id));
    return row ? { id: row.id, name: row.name, sourceProjectId: row.source_project_id, createdAt: row.created_at, updatedAt: row.updated_at, template: JSON.parse(row.template_json) } : null;
  }
  function recommendFromHistory(input = {}, minimumSamples = 3) {
    const target = normalizeProject({ ...input, name: input.name || 'Suositushaku', building: { source: 'recommendation-query', height: { value: 0, status: 'user' } } });
    const candidates = listStmt.all().filter((row) => row.id !== String(input.excludeProjectId || '')).map((row) => JSON.parse(row.project_json)).filter((p) => p.model?.bom?.length && p.geometry?.targetLengthM > 0 && p.geometry?.targetHeightM > 0);
    if (candidates.length < minimumSamples) return { available: false, reason: 'Vertailuun tarvitaan vähintään kolme tallennettua telineprojektia.', sampleCount: candidates.length, minimumSamples };
    const distance = (p) => {
      const scale = (a,b) => Math.abs(Number(a || 0) - Number(b || 0)) / Math.max(Number(a || 0), Number(b || 0), 1);
      return scale(p.geometry.targetLengthM,target.geometry.targetLengthM)*0.45 + scale(p.geometry.targetHeightM,target.geometry.targetHeightM)*0.35 + scale(p.geometry.buildingDepthM,target.geometry.buildingDepthM)*0.1 + scale(p.geometry.platformLevels?.length,target.geometry.platformLevels?.length)*0.1;
    };
    const nearest = candidates.map((project) => ({ project, distance: distance(project) })).sort((a,b) => a.distance-b.distance).slice(0, Math.min(5, candidates.length));
    const weights = nearest.map(({ distance: d }) => 1 / Math.max(d, 0.05));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const componentMap = new Map();
    nearest.forEach(({ project }, index) => {
      for (const line of project.model.bom || []) {
        const prior = componentMap.get(line.id) || { id: line.id, name: line.name, itemNo: line.itemNo, system: line.system, quantity: 0, purchasePerUnit: 0, rentalPerUnitDay: 0, rentalDays: 0, source: line.source, weight: 0 };
        const pricing = project.pricing?.components?.[line.id] || {};
        const weight = weights[index];
        prior.quantity += Number(line.quantity || 0) * weight;
        prior.purchasePerUnit += Number(pricing.purchasePerUnit || 0) * weight;
        prior.rentalPerUnitDay += Number(pricing.rentalPerUnitDay || 0) * weight;
        prior.rentalDays += Number(pricing.rentalDays || 0) * weight;
        prior.weight += weight;
        componentMap.set(line.id, prior);
      }
    });
    const bom = [...componentMap.values()].map(({ weight, ...row }) => ({ ...row, quantity: Math.round(row.quantity / weight), purchasePerUnit: Number((row.purchasePerUnit / weight).toFixed(2)), rentalPerUnitDay: Number((row.rentalPerUnitDay / weight).toFixed(2)), rentalDays: Math.round(row.rentalDays / weight) }));
    const cost = (field) => nearest.reduce((sum, { project }, index) => sum + Number(project.costSummary?.[field] || 0) * weights[index], 0) / totalWeight;
    const avgDistance = nearest.reduce((sum, row, i) => sum + row.distance * weights[i], 0) / totalWeight;
    const observedTotals = nearest.map(({ project }) => Number(project.costSummary?.total || 0));
    const laborSamples = nearest.map(({ project }, index) => {
      const activities = { installation: 0, dismantling: 0, inspection: 0 };
      const hours = (project.pricing?.labor || []).reduce((sum, row) => {
        const value = Number(row.hours) > 0 ? Number(row.hours) : 0;
        const label = String(row.description || '').toLocaleLowerCase('fi-FI');
        if (/asenn/.test(label)) activities.installation += value;
        else if (/purk/.test(label)) activities.dismantling += value;
        else if (/tarkast/.test(label)) activities.inspection += value;
        return sum + value;
      }, 0);
      return { hours, activities, weight: weights[index] };
    }).filter((row) => row.hours > 0);
    const laborWeight = laborSamples.reduce((sum, row) => sum + row.weight, 0);
    const estimateActivity = (key) => {
      const samples = laborSamples.filter((row) => row.activities[key] > 0);
      const weight = samples.reduce((sum, row) => sum + row.weight, 0);
      if (samples.length < minimumSamples) return {
        available: false,
        sampleCount: samples.length,
        minimumSamples,
        reason: 'Tälle työvaiheelle ei ole riittävästi eriteltyjä vertailutunteja.',
      };
      return {
        available: true,
        hours: Number((samples.reduce((sum, row) => sum + row.activities[key] * row.weight, 0) / weight).toFixed(2)),
        sampleCount: samples.length,
        minimumSamples,
        range: { min: Math.min(...samples.map((row) => row.activities[key])), max: Math.max(...samples.map((row) => row.activities[key])) },
      };
    };
    const laborEstimate = laborSamples.length >= minimumSamples ? {
      available: true,
      hours: Number((laborSamples.reduce((sum, row) => sum + row.hours * row.weight, 0) / laborWeight).toFixed(2)),
      sampleCount: laborSamples.length,
      minimumSamples,
      range: { min: Math.min(...laborSamples.map((row) => row.hours)), max: Math.max(...laborSamples.map((row) => row.hours)) },
      activities: {
        installation: estimateActivity('installation'),
        dismantling: estimateActivity('dismantling'),
        inspection: estimateActivity('inspection'),
      },
    } : {
      available: false,
      sampleCount: laborSamples.length,
      minimumSamples,
      reason: 'Vertailukelpoisia tallennettuja työtunteja ei ole vielä riittävästi.',
    };
    return { available: true, method: 'anonymized-nearest-projects-v1', sampleCount: nearest.length, historyCount: candidates.length, similarity: Number(Math.max(0, Math.min(1, 1 - avgDistance)).toFixed(2)), bom, laborEstimate, quote: { purchase: Number(cost('purchase').toFixed(2)), rental: Number(cost('rental').toFixed(2)), labor: Number(cost('labor').toFixed(2)), transport: Number(cost('transport').toFixed(2)), other: Number(cost('other').toFixed(2)), total: Number(cost('total').toFixed(2)) }, quoteRange: { min: Number(Math.min(...observedTotals).toFixed(2)), max: Number(Math.max(...observedTotals).toFixed(2)) }, basis: 'Arvio perustuu lähimpiin tallennettuihin projekteihin. Työmäärän vaihteluväli näkyy erikseen. Asiakas-, henkilö- ja rakennustunnisteita ei palauteta.' };
  }

  function listMarkers() { return db.prepare('SELECT * FROM geo_management_markers ORDER BY updated_at DESC').all().map(mapMarker); }
  function mapMarker(row) { return { id: row.id, moduleKey: row.module_key, title: row.title, easting: row.easting, northing: row.northing, crs: row.crs, source: row.source, createdAt: row.created_at, updatedAt: row.updated_at }; }
  function saveMarker(input = {}) {
    const id = input.id ? text(input.id, 'Karttamerkin tunniste', 80, true) : crypto.randomUUID();
    const moduleKey = text(input.moduleKey, 'Hallintamoduuli', 80, true);
    const title = text(input.title || moduleKey, 'Karttamerkin nimi', 160, true);
    const easting = Number(input.easting), northing = Number(input.northing);
    if (!Number.isFinite(easting) || easting < 25400000 || easting > 25550000 || !Number.isFinite(northing) || northing < 6650000 || northing > 6700000) throw new ProjectInputError('Karttamerkin EPSG:3879-koordinaatit eivät sijoitu tarkistettuun Helsingin toimialueeseen.');
    const source = text(input.source || 'Kartalta valittu sijainti', 'Karttamerkin lähde', 500);
    const now = new Date().toISOString();
    const existing = input.id ? db.prepare('SELECT created_at FROM geo_management_markers WHERE id = ?').get(id) : null;
    db.prepare(`INSERT INTO geo_management_markers (id,module_key,title,easting,northing,crs,source,created_at,updated_at)
      VALUES (@id,@module_key,@title,@easting,@northing,'EPSG:3879',@source,@created_at,@updated_at)
      ON CONFLICT(id) DO UPDATE SET module_key=excluded.module_key,title=excluded.title,easting=excluded.easting,northing=excluded.northing,crs=excluded.crs,source=excluded.source,updated_at=excluded.updated_at`)
      .run({ id, module_key: moduleKey, title, easting, northing, source, created_at: existing?.created_at || now, updated_at: now });
    return mapMarker(db.prepare('SELECT * FROM geo_management_markers WHERE id = ?').get(id));
  }
  function deleteMarker(id) { return db.prepare('DELETE FROM geo_management_markers WHERE id = ?').run(String(id)).changes > 0; }

  return { addProjectFile, close: () => db.close(), createDelivery, createProject, deleteMarker, getProject: readProject, getProjectFile, getTemplate, listDeliveries, listMarkers, listProjectFiles, listProjects, listRevisions, listTemplates, recommendFromHistory, saveMarker, saveTemplate, updateDeliveryStatus, updateProject, addReview };
}

module.exports = { DEFAULT_DB_PATH, ProjectInputError, RevisionConflictError, normalizeProject, openScaffoldProjectStore };
