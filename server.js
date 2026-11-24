/**
 * Helsinki Map Embed Builder — backend
 * ------------------------------------------------------------------
 * Talks to the City of Helsinki map service (kartta.hel.fi, powered by
 * Louhi / SpatialWeb by Sitowise) and produces ready-to-paste embedded
 * maps. The browser cannot call the map service API directly because of
 * CORS + CSRF protection, so this small server acts as a proxy:
 *
 *   1. It opens a session with kartta.hel.fi, keeping the anti-forgery
 *      cookie and the hidden `RequestVerificationToken`.
 *   2. It forwards search / geocoding / coordinate requests.
 *   3. It stores a map "state" through POST api-sw/shorten and receives
 *      a short code back, which is what the /embed/ page consumes.
 *
 * Reverse-engineered public endpoints (no key required):
 *   GET  /api-sw/settings/uisettings        - UI settings
 *   GET  /api-sw/settings/layer/<id>        - layer definition + style
 *   POST /api-sw/search                     - address / feature search
 *   GET  /api-sw/search/autocomplete        - search suggestions
 *   GET  /api-sw/coordinates                - coordinate transform
 *   POST /api-sw/shorten  {state}           - store state -> {id}
 *   GET  /api-sw/shorten?linkId=<code>      - load state from code
 *   GET  /embed/?link=<code>&...            - the embeddable map page
 */

const express = require('express');
const path = require('path');
const proj4 = require('proj4');
const { EPSG_3879_DEF } = require('./lib/scaffold-domain');
proj4.defs('EPSG:3879', EPSG_3879_DEF);
proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs +type=crs');
const fs = require('fs/promises');
const crypto = require('crypto');
const { calculateScaffold, ENGINE_VERSION, CATALOG_VERSION } = require('./lib/scaffold-calculations');
const { openCrmStore, STAGES, validHttpUrl } = require('./lib/crm-store');
const { openScaffoldProjectStore, ProjectInputError, RevisionConflictError } = require('./lib/scaffold-project-store');
const scaffoldManufacturerCatalog = require('./public-static/data/scaffold-manufacturers.json');
const { createMapDataRouter } = require('./lib/map-data-catalog');

const app = express();
const PORT = process.env.PORT || 3400;
const HOST = process.env.HOST || '127.0.0.1';

const BASE = 'https://kartta.hel.fi';
const CITY_MODEL_WFS = 'https://kartta.hel.fi/3d/citydb-wfs/wfs';
const CITY_MODEL_WFS_TIMEOUT_MS = 60000;
const CITY_MODEL_WFS_MAX_BYTES = 20 * 1024 * 1024;
const HELSINKI_FOOTPRINT_WFS = 'https://kartta.hel.fi/ws/geoserver/avoindata/wfs';
const GTK_SOIL_MAPSERVER = 'https://gtkdata.gtk.fi/arcgis/rest/services/Maankamara/Maapera/MapServer';
const API_KEY_STORE_DIR = path.join(__dirname, '.local-secrets');
const API_KEY_STORE_FILE = path.join(API_KEY_STORE_DIR, 'api-keys.enc.json');
const API_KEY_MASTER_FILE = path.join(API_KEY_STORE_DIR, 'master.key');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0 Safari/537.36';

let crmStoreInstance;
let scaffoldProjectStoreInstance;
function getCrmStore() {
  if (!crmStoreInstance) crmStoreInstance = openCrmStore();
  return crmStoreInstance;
}
app.locals.closeCrmStore = () => {
  if (!crmStoreInstance) return;
  crmStoreInstance.close();
  crmStoreInstance = null;
};
function getScaffoldProjectStore() {
  if (!scaffoldProjectStoreInstance) scaffoldProjectStoreInstance = openScaffoldProjectStore();
  return scaffoldProjectStoreInstance;
}
app.locals.closeScaffoldProjectStore = () => {
  if (!scaffoldProjectStoreInstance) return;
  scaffoldProjectStoreInstance.close();
  scaffoldProjectStoreInstance = null;
};

app.use(express.json({ limit: '1mb' }));
// The local workspace is the primary app; the original map builder remains at
// /index.html and in the GIS tools menu.
app.get(['/', '/app'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'public-static', 'workspace.html'));
});
// Serve the current app (including the LiDAR viewer and its local runtime)
// first. Keep the old public/ directory as a fallback for legacy pages.
app.use(express.static(path.join(__dirname, 'public-static')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/scaffold-domain.js', (_req, res) => res.sendFile(path.join(__dirname, 'lib', 'scaffold-domain.js')));
app.get('/scaffold-exports.js', (_req, res) => res.sendFile(path.join(__dirname, 'lib', 'scaffold-exports.js')));
app.use('/api/map-data', createMapDataRouter());

const FINLEX_API_BASE = 'https://opendata.finlex.fi/finlex/avoindata/v1';
const FINLEX_API_ORIGIN = new URL(FINLEX_API_BASE).origin;

function decodeFinlexXml(value) {
  return String(value || '')
    .replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_match, entity) => {
      const key = entity.toLowerCase();
      if (key === 'amp') return '&';
      if (key === 'lt') return '<';
      if (key === 'gt') return '>';
      if (key === 'quot') return '"';
      if (key === 'apos') return "'";
      const number = key.startsWith('#x') ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return Number.isFinite(number) && number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFinlex(url, accept) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, {
      headers: { Accept: accept, 'User-Agent': 'Telinekonttori/1.0 (Finlex Open Data integration)' },
      signal: controller.signal,
      redirect: 'error',
    });
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/legal/finlex/search', async (req, res) => {
  const query = String(req.query.q || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (query.length < 2 || query.length > 100) {
    return res.status(400).json({ error: 'Anna 2–100 merkin säädöksen nimihakusana.' });
  }

  const endpoint = new URL(`${FINLEX_API_BASE}/akn/fi/act/statute-consolidated/list`);
  endpoint.search = new URLSearchParams({
    format: 'json',
    page: '1',
    limit: '5',
    'langAndVersion': 'fin@',
    titleContains: query,
    isInForce: 'true',
    sortBy: 'dateIssued',
  }).toString();

  try {
    const listResponse = await fetchFinlex(endpoint, 'application/json');
    if (listResponse.status === 429) return res.status(429).json({ error: 'Finlex rajasi hetkellisesti pyyntöjä. Odota hetki ja yritä uudelleen.' });
    if (!listResponse.ok) return res.status(502).json({ error: `Finlexin säädöshaku palautti HTTP ${listResponse.status}.` });
    const bodyText = await listResponse.text();
    if (Buffer.byteLength(bodyText, 'utf8') > 2 * 1024 * 1024) return res.status(502).json({ error: 'Finlexin hakuvastaus ylitti kokorajan.' });
    let payload;
    try { payload = JSON.parse(bodyText); } catch { return res.status(502).json({ error: 'Finlexin hakuvastaus ei ollut kelvollista JSONia.' }); }
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.documents) ? payload.documents : Array.isArray(payload?.results) ? payload.results : [];
    const entries = await Promise.all(rows.slice(0, 5).map(async (row) => {
      const aknUri = String(row?.akn_uri || row?.aknUri || row?.uri || '');
      if (!aknUri) return null;
      let documentUrl;
      try { documentUrl = new URL(aknUri); } catch { return null; }
      if (documentUrl.origin !== FINLEX_API_ORIGIN || !documentUrl.pathname.startsWith('/finlex/avoindata/v1/akn/fi/act/statute-consolidated/')) return null;
      try {
        const detailResponse = await fetchFinlex(documentUrl, 'application/xml,text/xml;q=0.9');
        if (!detailResponse.ok) return null;
        const xml = await detailResponse.text();
        if (Buffer.byteLength(xml, 'utf8') > 2 * 1024 * 1024) return null;
        const find = (tag) => {
          const match = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
          return match ? decodeFinlexXml(match[1]) : '';
        };
        return {
          title: find('docTitle') || 'Säädös Finlexin avoimessa datassa',
          number: find('docNumber'),
          status: 'Voimassa oleva säädös',
          aknUri: documentUrl.href,
        };
      } catch {
        return null;
      }
    }));
    return res.json({ query, source: 'Finlex Open Data', results: entries.filter(Boolean) });
  } catch (error) {
    const timeout = error?.name === 'AbortError';
    return res.status(502).json({ error: timeout ? 'Finlex ei vastannut 15 sekunnissa.' : 'Finlexin avointa rajapintaa ei saatu tavoitettua.' });
  }
});

let apiKeyMasterPromise = null;
let apiKeyWriteQueue = Promise.resolve();

async function getApiKeyMaster() {
  if (!apiKeyMasterPromise) {
    apiKeyMasterPromise = (async () => {
      await fs.mkdir(API_KEY_STORE_DIR, { recursive: true, mode: 0o700 });
      await fs.chmod(API_KEY_STORE_DIR, 0o700);
      try {
        const key = await fs.readFile(API_KEY_MASTER_FILE);
        if (key.length !== 32) throw new Error('Invalid local API key vault key length.');
        await fs.chmod(API_KEY_MASTER_FILE, 0o600);
        return key;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        const key = crypto.randomBytes(32);
        try {
          await fs.writeFile(API_KEY_MASTER_FILE, key, { flag: 'wx', mode: 0o600 });
          return key;
        } catch (writeError) {
          if (writeError.code !== 'EEXIST') throw writeError;
          return fs.readFile(API_KEY_MASTER_FILE);
        }
      }
    })();
  }
  try {
    return await apiKeyMasterPromise;
  } catch (error) {
    apiKeyMasterPromise = null;
    throw error;
  }
}

async function readApiKeyVault() {
  let envelope;
  try {
    envelope = JSON.parse(await fs.readFile(API_KEY_STORE_FILE, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (envelope.version !== 1) throw new Error('Unsupported local API key vault version.');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    await getApiKeyMaster(),
    Buffer.from(envelope.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ]);
  const contents = JSON.parse(plaintext.toString('utf8'));
  return Array.isArray(contents.keys) ? contents.keys : [];
}

async function writeApiKeyVault(keys) {
  await fs.mkdir(API_KEY_STORE_DIR, { recursive: true, mode: 0o700 });
  await fs.chmod(API_KEY_STORE_DIR, 0o700);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', await getApiKeyMaster(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify({ keys }), 'utf8'),
    cipher.final(),
  ]);
  const envelope = JSON.stringify({
    version: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  });
  const temporaryFile = `${API_KEY_STORE_FILE}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
  try {
    await fs.writeFile(temporaryFile, envelope, { flag: 'wx', mode: 0o600 });
    await fs.rename(temporaryFile, API_KEY_STORE_FILE);
    await fs.chmod(API_KEY_STORE_FILE, 0o600);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true }).catch(() => {});
    throw error;
  }
}

async function mutateApiKeyVault(mutator) {
  const previousWrite = apiKeyWriteQueue;
  let release;
  apiKeyWriteQueue = new Promise((resolve) => { release = resolve; });
  await previousWrite;
  try {
    const current = await readApiKeyVault();
    const { keys, result } = mutator(current);
    await writeApiKeyVault(keys);
    return result;
  } finally {
    release();
  }
}

function requireLocalSecretAccess(req, res, next) {
  const address = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const isLoopback = address === '127.0.0.1' || address === '::1';
  const origin = req.get('origin');
  let isLocalOrigin = true;
  if (origin) {
    try {
      isLocalOrigin = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname);
    } catch {
      isLocalOrigin = false;
    }
  }
  if (!isLoopback || !isLocalOrigin) {
    return res.status(403).json({ error: 'API-avainten hallinta on käytettävissä vain paikallisessa työtilassa.' });
  }
  res.set('Cache-Control', 'no-store, private');
  return next();
}

function handleScaffoldProjectError(res, error) {
  if (error instanceof RevisionConflictError) return res.status(409).json({ error: error.message, currentRevision: error.currentRevision });
  if (error instanceof ProjectInputError || error?.status === 400) return res.status(400).json({ error: error.message });
  console.error('Scaffold project store error:', error);
  return res.status(500).json({ error: 'Telineprojektia ei voitu lukea tai tallentaa.' });
}
function validateScaffoldCustomer(input = {}) {
  const customerId = String(input.customerId || '').trim();
  if (!customerId) return input;
  const company = getCrmStore().listCompanies().find((row) => row.id === customerId);
  if (!company) throw new ProjectInputError('Valittua CRM-asiakasta ei löytynyt. Päivitä asiakaslista ja yritä uudelleen.');
  return { ...input, customerName: company.name };
}

app.use('/api/scaffold', requireLocalSecretAccess);
app.use('/api/geo/management-markers', requireLocalSecretAccess);

const SCAFFOLD_FILES_DIR = process.env.TELINEHALLINTA_FILES_DIR || path.join(__dirname, '.local-data', 'scaffold-files');
const SCAFFOLD_FILE_TYPES = new Map(Object.entries({
  '.pdf':'application/pdf','.dwg':'application/acad','.dxf':'application/dxf','.fcmacro':'text/x-python; charset=utf-8','.svg':'image/svg+xml','.csv':'text/csv; charset=utf-8',
  '.obj':'text/plain','.mtl':'text/plain','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.ifc':'application/x-step','.fcstd':'application/octet-stream',
  '.stl':'model/stl','.step':'application/step','.stp':'application/step','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
}));
const safeStoredName = (id) => `${id}.blob`;
const safeScaffoldName = (value) => {
  let decoded = String(value || 'tiedosto');
  try { decoded = decodeURIComponent(decoded); } catch {}
  return path.basename(decoded.replaceAll('\\', '/')).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 180) || 'tiedosto';
};

app.get('/api/scaffold/projects', (_req, res) => {
  try { return res.json({ projects: getScaffoldProjectStore().listProjects() }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.get('/api/scaffold/deliveries', (_req, res) => {
  try { return res.json({ deliveries: getScaffoldProjectStore().listDeliveries() }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.patch('/api/scaffold/deliveries/:id', (req, res) => {
  try {
    const delivery = getScaffoldProjectStore().updateDeliveryStatus(req.params.id, String(req.body?.status || ''));
    return delivery ? res.json({ delivery }) : res.status(404).json({ error: 'LMS-toimitusta ei löytynyt.' });
  } catch (error) { return handleScaffoldProjectError(res, error); }
});
app.post('/api/scaffold/projects', (req, res) => {
  try { return res.status(201).json(getScaffoldProjectStore().createProject(validateScaffoldCustomer(req.body || {}))); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.get('/api/scaffold/projects/:id', (req, res) => {
  try { const project = getScaffoldProjectStore().getProject(req.params.id); return project ? res.json(project) : res.status(404).json({ error: 'Telineprojektia ei löytynyt.' }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.put('/api/scaffold/projects/:id', (req, res) => {
  try { const project = getScaffoldProjectStore().updateProject(req.params.id, validateScaffoldCustomer(req.body || {}), req.get('If-Match') || req.body?.expectedRevision); return project ? res.json(project) : res.status(404).json({ error: 'Telineprojektia ei löytynyt.' }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.post('/api/scaffold/projects/:id/deliveries', (req, res) => {
  try {
    const result = getScaffoldProjectStore().createDelivery(req.params.id, req.body || {});
    return result ? res.status(result.duplicate ? 200 : 201).json(result) : res.status(404).json({ error: 'Telineprojektia ei löytynyt.' });
  } catch (error) { return handleScaffoldProjectError(res, error); }
});
app.post('/api/scaffold/projects/:id/pipeline', (req, res) => {
  try {
    const project = getScaffoldProjectStore().getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Telineprojektia ei löytynyt.' });
    const crm = getCrmStore();
    const existing = crm.listOpportunities().find((item) => item.source === 'scaffold-project' && item.source_id === project.id);
    const customerId = String(project.customerId || '').trim();
    if (customerId && !crm.listCompanies().some((company) => company.id === customerId)) return res.status(409).json({ error: 'Projektin CRM-asiakas ei ole enää valittavissa. Päivitä asiakas ennen putkeen vientiä.' });
    if (existing && customerId && existing.company_id !== customerId) return res.status(409).json({ error: 'CRM-mahdollisuus on jo yhdistetty toiseen asiakkaaseen. Tarkista yritys CRM:ssä ennen tarjouksen vientiä.' });
    const stageOrder = ['Uusi','Kelpuutus','Yhteydenotto','Tarjousvalmistelu','Tarjous lähetetty','Voitettu','Hävitty'];
    const stage = existing && stageOrder.indexOf(existing.stage) > stageOrder.indexOf('Tarjousvalmistelu') ? existing.stage : 'Tarjousvalmistelu';
    const title = `${project.building.name || project.building.address || project.name} · telineurakka`;
    const sourceUrl = `${req.protocol}://${req.get('host')}/?page=scaffold&projectId=${encodeURIComponent(project.id)}`;
    const companyName = project.customerName || 'Asiakas tarkistettava';
    const bom = project.model.bom || [];
    const unpricedCount = bom.filter((line) => {
      const price = project.pricing.components?.[line.id] || {};
      return !(Number(price.purchasePerUnit) > 0 || Number(price.rentalPerUnitDay) > 0);
    }).length;
    const missingPriceSourceCount = bom.filter((line) => {
      const price = project.pricing.components?.[line.id] || {};
      return (Number(price.purchasePerUnit) > 0 || Number(price.rentalPerUnitDay) > 0) && !String(price.priceSource || '').trim();
    }).length;
    const missingQuoteTerms = [
      project.costSummary?.marginPercent == null ? 'Kateprosentti puuttuu.' : '',
      project.costSummary?.vatPercent == null ? 'ALV-prosentti puuttuu.' : '',
      !project.pricing.quoteTerms?.validUntil ? 'Hintojen voimassaoloaika puuttuu.' : '',
      !project.pricing.quoteTerms?.priceEnteredBy ? 'Hinnan syöttäjä puuttuu.' : '',
    ].filter(Boolean);
    const reviewNotes = [
      !customerId ? 'Valitse ja varmista CRM-asiakas ennen tarjouksen lähettämistä.' : '',
      unpricedCount ? `${unpricedCount} BOM-riviltä puuttuu osto- tai vuokrahinta.` : '',
      missingPriceSourceCount ? `${missingPriceSourceCount} hinnoitellulta BOM-riviltä puuttuu hinnan lähde.` : '',
      ...missingQuoteTerms,
    ].filter(Boolean);
    const quoteValue = project.costSummary?.quoteComplete ? Number(project.costSummary.grossTotal) || 0 : 0;
    const input = {
      title, companyId: customerId || undefined, companyName, source: 'scaffold-project', sourceId: project.id, sourceUrl,
      stage, value: quoteValue,
      nextAction: 'Tarkista tarjousluonnos, hinnat ja avoimet suunnittelutiedot',
      reviewRequired: reviewNotes.length > 0,
      reviewNote: reviewNotes.join(' '),
    };
    const opportunity = existing
      ? crm.updateOpportunity(existing.id, input)
      : crm.createOpportunity({ ...input, activityKind: 'scaffold-quote-draft', activitySummary: `Telineprojektin rev ${project.revision} tarjousluonnos lisättiin CRM:n Tarjousvalmistelu-vaiheeseen.` }).opportunity;
    const activitySummary = project.costSummary?.quoteComplete
      ? `Telineprojektin rev ${project.revision} tarjousluonnos päivitetty CRM:ään · summa sis. ALV ${new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 }).format(quoteValue)} €.`
      : `Telineprojektin rev ${project.revision} tarjousluonnos päivitetty CRM:ään · myyntisummaa ei vielä ole vahvistettu; tarkista katteen ja ALV:n ehdot.`;
    const alreadyTracked = crm.listActivities(opportunity.id).some((activity) => activity.kind === 'telineprojekti' && activity.summary === activitySummary);
    if (!alreadyTracked) crm.addActivity(opportunity.id, { kind: 'telineprojekti', summary: activitySummary, sourceUrl });
    return res.status(existing ? 200 : 201).json({ opportunity, duplicate: Boolean(existing), trackedRevision: project.revision });
  } catch (error) {
    if (error instanceof ProjectInputError) return res.status(400).json({ error: error.message });
    return handleScaffoldProjectError(res, error);
  }
});
app.get('/api/scaffold/projects/:id/revisions', (req, res) => {
  try { const revisions = getScaffoldProjectStore().listRevisions(req.params.id); return revisions ? res.json({ revisions }) : res.status(404).json({ error: 'Telineprojektia ei löytynyt.' }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.post('/api/scaffold/projects/:id/review', (req, res) => {
  try { const project = getScaffoldProjectStore().addReview(req.params.id, req.body || {}); return project ? res.json(project) : res.status(404).json({ error: 'Telineprojektia ei löytynyt.' }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.get('/api/scaffold/projects/:id/files', (req, res) => {
  try { const files = getScaffoldProjectStore().listProjectFiles(req.params.id); return files ? res.json({ files }) : res.status(404).json({ error: 'Telineprojektia ei löytynyt.' }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.post('/api/scaffold/projects/:id/files', express.raw({ type: ['application/octet-stream', 'application/pdf', 'image/*', 'model/*', 'text/plain', 'application/acad', 'application/dxf', 'application/x-step', 'application/step'], limit: '100mb' }), async (req, res) => {
  const extension = path.extname(safeScaffoldName(req.get('X-File-Name'))).toLowerCase();
  const kind = String(req.get('X-File-Kind') || 'other');
  if (!SCAFFOLD_FILE_TYPES.has(extension)) return res.status(415).json({ error: 'Tiedostomuoto ei ole tuettu.' });
  if (!['drawing','building-model','scaffold-model','other'].includes(kind)) return res.status(400).json({ error: 'Aineistotyyppi ei ole kelvollinen.' });
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Tiedosto on tyhjä.' });
  const store = getScaffoldProjectStore();
  if (!store.getProject(req.params.id)) return res.status(404).json({ error: 'Telineprojektia ei löytynyt.' });
  const id = crypto.randomUUID(), storedName = safeStoredName(id), directory = path.join(SCAFFOLD_FILES_DIR, req.params.id), filePath = path.join(directory, storedName);
  try {
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    await fs.writeFile(filePath, req.body, { flag: 'wx', mode: 0o600 });
    const metadata = store.addProjectFile(req.params.id, { id, kind, filename: safeScaffoldName(req.get('X-File-Name')), storedName, contentType: SCAFFOLD_FILE_TYPES.get(extension), sizeBytes: req.body.length, sha256: crypto.createHash('sha256').update(req.body).digest('hex') });
    return res.status(201).json(metadata);
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});
    return handleScaffoldProjectError(res, error);
  }
});
app.get('/api/scaffold/projects/:id/files/:fileId', async (req, res) => {
  try {
    const metadata = getScaffoldProjectStore().getProjectFile(req.params.id, req.params.fileId);
    if (!metadata) return res.status(404).json({ error: 'Projektiaineistoa ei löytynyt.' });
    const filePath = path.join(SCAFFOLD_FILES_DIR, req.params.id, safeStoredName(metadata.id));
    const contents = await fs.readFile(filePath);
    if (crypto.createHash('sha256').update(contents).digest('hex') !== metadata.sha256) return res.status(500).json({ error: 'Tallennetun aineiston tarkistussumma ei täsmää.' });
    // CAD source files and native FreeCAD documents should land as files on
    // the workstation so they can be opened by the user's CAD application.
    // Serving an FCMacro inline makes browsers display Python source instead.
    const extension = path.extname(metadata.filename).toLowerCase();
    const disposition = metadata.contentType === 'image/svg+xml' || ['.fcstd', '.fcmacro'].includes(extension) ? 'attachment' : 'inline';
    res.set({ 'Content-Type': metadata.contentType, 'Content-Length': String(contents.length), 'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(metadata.filename)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    return res.send(contents);
  } catch (error) { return error.code === 'ENOENT' ? res.status(404).json({ error: 'Tiedostoa ei löydy palvelimen tallennuksesta.' }) : handleScaffoldProjectError(res, error); }
});
app.get('/api/scaffold/templates', (_req, res) => {
  try { return res.json({ templates: getScaffoldProjectStore().listTemplates() }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.get('/api/scaffold/templates/:id', (req, res) => {
  try { const template = getScaffoldProjectStore().getTemplate(req.params.id); return template ? res.json(template) : res.status(404).json({ error: 'Telinemallia ei löytynyt.' }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.post('/api/scaffold/projects/:id/templates', (req, res) => {
  try { const template = getScaffoldProjectStore().saveTemplate(req.params.id, req.body?.name); return template ? res.status(201).json(template) : res.status(404).json({ error: 'Telineprojektia ei löytynyt.' }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.post('/api/scaffold/recommendations', (req, res) => {
  try { return res.json(getScaffoldProjectStore().recommendFromHistory(req.body || {})); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.get('/api/geo/management-markers', (_req, res) => {
  try { return res.json({ crs: 'EPSG:3879', markers: getScaffoldProjectStore().listMarkers() }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.post('/api/geo/management-markers', (req, res) => {
  try { const marker = getScaffoldProjectStore().saveMarker(req.body || {}); return res.status(201).json(marker); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});
app.delete('/api/geo/management-markers/:id', (req, res) => {
  try { return getScaffoldProjectStore().deleteMarker(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'Karttamerkkiä ei löytynyt.' }); }
  catch (error) { return handleScaffoldProjectError(res, error); }
});

function maskApiKey(value) {
  if (value.length <= 5) return '•'.repeat(value.length);
  return `${value.slice(0, 3)}${'•'.repeat(6)}${value.slice(-2)}`;
}

async function handleApiKeyError(res) {
  return res.status(500).json({ error: 'Paikallista API-avainholvia ei voitu lukea tai tallentaa.' });
}

function handleCrmError(res, error) {
  if (String(error?.code || '').startsWith('SQLITE_CONSTRAINT')) {
    return res.status(409).json({ error: 'Tietue törmäsi olemassa olevaan yritys- tai lähdetunnisteeseen. Tarkista mahdollinen duplikaatti.', code: error.code });
  }
  return res.status(400).json({ error: error?.message || 'CRM-pyyntöä ei voitu käsitellä.' });
}

// CRM is a local, server-authoritative workspace. The API-key gate also
// confines these records to the loopback service and rejects non-local Origin.
app.use('/api/crm', requireLocalSecretAccess);

app.get('/api/crm/bootstrap', (_req, res) => {
  try {
    const crm = getCrmStore();
    const manufacturerRecords = (scaffoldManufacturerCatalog.items || []).map((item) => ({
      name: item.manufacturer, system: item.systems, componentCount: item.componentCount,
      logoUrl: item.logoUrl, sourceUrl: item.catalogUrl, status: 'catalog', directorySource: 'Telinekomponenttien valmistajakatalogi',
    }));
    manufacturerRecords.push({ name: 'Talhu Oy', businessId: '0932863-5', system: 'TALHU HANA UNIROUND; Foldy', contact: 'Myynti', email: 'talhu@talhu.fi', address: 'Petikontie 17, 01720 Vantaa', sourceUrl: 'https://talhu.fi/tietoa-meista/', status: 'verified', directorySource: 'Talhun virallinen yritys- ja yhteystietosivu',
      profile: { foundedYear: 1993, website: 'https://talhu.fi/', profileSourceUrl: 'https://talhu.fi/yhteystiedot/', futureNotes: 'Talhu-brändätty HANA UNIROUND -teline on dokumentoitu käyttöohjeessa. Lähteet vahvistavat tuotemerkin ja myynnin; ne eivät yksin vahvista tehdasvalmistuksen alkuperää.' },
      contacts: [{ name: 'Myynti', role: 'Tuotemyynti', email: 'talhu@talhu.fi', phone: '010 4249 400', sourceUrl: 'https://talhu.fi/yhteystiedot/' }],
      addresses: [
        { label: 'Päätoimipaikka / Vantaan myymälä', address: 'Petikontie 17, 01720 Vantaa', addressType: 'office', sourceUrl: 'https://talhu.fi/yhteystiedot/', isPrimary: true },
        { label: 'Tampereen myymälä', address: 'Autokuja 1 A, 33920 Pirkkala', addressType: 'branch', sourceUrl: 'https://talhu.fi/yhteystiedot/' },
        { label: 'Turun myymälä', address: 'Ruunikkokatu 4, 20380 Turku', addressType: 'branch', sourceUrl: 'https://talhu.fi/yhteystiedot/' },
      ] });
    manufacturerRecords.push({ name: 'Moson (tarkistettava nimi)', system: '', status: 'needs-review', directorySource: 'Käyttäjän nimeämä täydennys', note: 'Tarkista yrityksen oikea nimi ja mahdollinen telinejärjestelmä ennen luokittelua tai pisteytystä.' });
    crm.importManufacturerCatalog(manufacturerRecords);
    res.set('Cache-Control', 'no-store, private');
    res.json({ stages: STAGES, companies: crm.listCompanies(), opportunities: crm.listOpportunities(),
      buildings: crm.listBuildings(), drawings: crm.listAllDrawings(), drawingsToReview: crm.listDrawings(), mapFeatures: crm.listMapFeatures(), sync: crm.listSync(),
      syncContract: { configured: false, target: 'ScaffoldingOS', reason: 'Kirjoittavan API-sopimuksen osoite, kentät ja tunnistus eivät ole vahvistettuja.' } });
  } catch (error) { handleCrmError(res, error); }
});

app.post('/api/crm/migrate', (req, res) => {
  try {
    const payload = req.body || {};
    if (!Array.isArray(payload.customers) || !Array.isArray(payload.designResources)) return res.status(400).json({ error: 'Vanhan CRM:n asiakkaat ja aineistoviitteet pitää lähettää taulukoina.' });
    const result = getCrmStore().migrateLegacy({ ...payload, migrationKey: 'telinehallinta-localStorage-v1' });
    return res.json(result);
  } catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/opportunities', (req, res) => {
  try { return res.json(getCrmStore().listOpportunities({ stage: String(req.query.stage || ''), query: String(req.query.q || '') })); }
  catch (error) { return handleCrmError(res, error); }
});

app.post('/api/crm/opportunities', (req, res) => {
  try {
    const result = getCrmStore().createOpportunity(req.body || {});
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) { return handleCrmError(res, error); }
});

app.patch('/api/crm/opportunities/:id', (req, res) => {
  try {
    const item = getCrmStore().updateOpportunity(req.params.id, req.body || {});
    return item ? res.json(item) : res.status(404).json({ error: 'Myyntimahdollisuutta ei löytynyt.' });
  } catch (error) { return handleCrmError(res, error); }
});

app.post('/api/crm/opportunities/:id/complete-action', (req, res) => {
  try {
    const result = getCrmStore().completeNextAction(req.params.id, req.body || {});
    return result ? res.json(result) : res.status(404).json({ error: 'Myyntimahdollisuutta ei löytynyt.' });
  } catch (error) { return handleCrmError(res, error); }
});

app.delete('/api/crm/opportunities/:id', (req, res) => {
  try { return getCrmStore().removeOpportunity(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'Myyntimahdollisuutta ei löytynyt.' }); }
  catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/opportunities/:id/activities', (req, res) => {
  try { return res.json(getCrmStore().listActivities(req.params.id)); }
  catch (error) { return handleCrmError(res, error); }
});

app.post('/api/crm/opportunities/:id/activities', (req, res) => {
  try {
    const activity = getCrmStore().addActivity(req.params.id, req.body || {});
    return activity ? res.status(201).json(activity) : res.status(404).json({ error: 'Myyntimahdollisuutta ei löytynyt.' });
  } catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/companies', (_req, res) => {
  try { return res.json(getCrmStore().listCompanies()); }
  catch (error) { return handleCrmError(res, error); }
});

app.post('/api/crm/companies', (req, res) => {
  try {
    const result = getCrmStore().createCompany(req.body || {});
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) { return handleCrmError(res, error); }
});

app.post('/api/crm/companies/:id/contacts', (req, res) => {
  try { return res.status(201).json(getCrmStore().addCompanyContact(req.params.id, req.body || {})); }
  catch (error) { return handleCrmError(res, error); }
});
app.delete('/api/crm/contacts/:id', (req, res) => {
  try { return getCrmStore().removeCompanyContact(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'Yhteyshenkilöä ei löytynyt.' }); }
  catch (error) { return handleCrmError(res, error); }
});
app.post('/api/crm/companies/:id/addresses', (req, res) => {
  try { return res.status(201).json(getCrmStore().addCompanyAddress(req.params.id, req.body || {})); }
  catch (error) { return handleCrmError(res, error); }
});
app.delete('/api/crm/addresses/:id', (req, res) => {
  try { return getCrmStore().removeCompanyAddress(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'Yritysosoitetta ei löytynyt.' }); }
  catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/drawings', (_req, res) => {
  try { return res.json(getCrmStore().listAllDrawings()); }
  catch (error) { return handleCrmError(res, error); }
});

app.patch('/api/crm/companies/:id', (req, res) => {
  try {
    const crm = getCrmStore();
    const item = req.body?.location ? crm.updateCompanyLocation(req.params.id, req.body.location) : crm.updateCompany(req.params.id, req.body || {});
    return item ? res.json(item) : res.status(404).json({ error: 'Yritystä ei löytynyt.' });
  } catch (error) { return handleCrmError(res, error); }
});

app.delete('/api/crm/companies/:id', (req, res) => {
  try { return getCrmStore().removeCompany(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'Yritystä ei löytynyt.' }); }
  catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/buildings', (_req, res) => {
  try { return res.json(getCrmStore().listBuildings()); }
  catch (error) { return handleCrmError(res, error); }
});

app.post('/api/crm/buildings', (req, res) => {
  try { return res.status(201).json(getCrmStore().upsertBuilding(req.body || {})); }
  catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/map', (_req, res) => {
  try { return res.json({ crs: 'EPSG:3879', features: getCrmStore().listMapFeatures() }); }
  catch (error) { return handleCrmError(res, error); }
});

app.use('/api/buildings', requireLocalSecretAccess);
app.get('/api/buildings/:ratu/drawings', (req, res) => {
  try { return res.json(getCrmStore().listDrawings(req.params.ratu)); }
  catch (error) { return handleCrmError(res, error); }
});

app.post('/api/buildings/:ratu/drawings', (req, res) => {
  try { return res.status(201).json(getCrmStore().addDrawing({ ...(req.body || {}), ratu: req.params.ratu })); }
  catch (error) { return handleCrmError(res, error); }
});

app.delete('/api/crm/drawings/:id', (req, res) => {
  try { return getCrmStore().removeDrawing(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'Piirustusviitettä ei löytynyt.' }); }
  catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/sync', (_req, res) => {
  try { return res.json({ target: 'ScaffoldingOS', configured: false, message: 'API-sopimus puuttuu. Kelpuutetut viennit odottavat; käytä CSV-varavientiä.', items: getCrmStore().listSync() }); }
  catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/export.csv', (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store, private');
    res.type('text/csv; charset=utf-8').attachment('telinehallinta-myyntiputki.csv');
    return res.send(getCrmStore().exportCsv());
  } catch (error) { return handleCrmError(res, error); }
});

app.get('/api/crm/follow-ups.ics', (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store, private');
    res.type('text/calendar; charset=utf-8').attachment('telinehallinta-crm-seuranta.ics');
    return res.send(getCrmStore().exportFollowUpsIcs());
  } catch (error) { return handleCrmError(res, error); }
});

app.post('/api/crm/import/osint', (req, res) => {
  try {
    const origin = req.get('origin');
    if (origin && origin !== `${req.protocol}://${req.get('host')}`) return res.status(403).json({ error: 'OSINT-tuonti hyväksyy vain tämän TelineHallinnan saman alkuperän pyynnöt.' });
    const body = req.body || {};
    const source = String(body.source || 'osint').trim().toLowerCase().slice(0,80);
    const procurement = ['hilma','ted','vayla','ryhti_building','ryhti_permit','ryhti_plan','museo'].includes(source);
    const registryCompany = ['ytj','companieshouse'].includes(source);
    const buyerName = String(body.buyerName || '').trim();
    const companyName = String(body.companyName || (procurement ? buyerName : registryCompany ? body.title : '') || '').trim();
    const sourceUrl = validHttpUrl(body.sourceUrl) ? String(body.sourceUrl) : '';
    const result = getCrmStore().createOpportunity({
      title: String(body.title || '').trim(), companyName: companyName || (procurement ? 'Ostaja tarkistettava' : 'Yritys tarkistettava'),
      businessId: body.businessId, source, sourceId: body.sourceId, sourceUrl,
      procurementType: procurement ? body.procurementType : '', procurementDeadline: procurement ? body.procurementDeadline : '',
      procurementPublishedAt: procurement ? body.procurementPublishedAt : '', cpvCodes: procurement ? body.cpvCodes : '',
      procurementEstimatedValue: procurement ? body.procurementEstimatedValue : null, procurementCurrency: procurement ? body.procurementCurrency : '',
      stage: 'Uusi', value: 0, nextAction: procurement ? 'Tarkista ilmoitus ja ostajan tiedot' : 'Tarkista OSINT-tulos',
      activityKind: 'osint-import', activitySummary: `Lisätty ${source.toUpperCase()}-lähteestä${sourceUrl ? `: ${sourceUrl}` : ''}`,
      reviewRequired: !companyName,
      reviewNote: !companyName ? (procurement ? 'Hankinnan ostajaa ei voitu tunnistaa tuloksesta. Tarkista ostaja ennen yhteydenottoa.' : 'Yritystä ei voitu tunnistaa OSINT-tuloksesta. Valitse oikea yritys ennen jatkotoimia.') : '',
    });
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) { return handleCrmError(res, error); }
});

/* ------------------------------------------------------------------ */
/*  Session management (cookies + CSRF token)                          */
/* ------------------------------------------------------------------ */

const SESSION_TTL = 8 * 60 * 1000; // refresh the token every 8 minutes
let session = { cookie: '', token: '', ts: 0 };
let sessionPromise = null;

async function openSession(force = false) {
  if (!force && session.token && Date.now() - session.ts < SESSION_TTL) {
    return session;
  }
  if (sessionPromise) return sessionPromise; // de-dupe concurrent refreshes

  sessionPromise = (async () => {
    const res = await fetch(`${BASE}/?setlanguage=en`, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    });
    const setCookies =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : [res.headers.get('set-cookie')].filter(Boolean);
    const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    const html = await res.text();
    const m =
      html.match(/id="RequestVerificationToken"[^>]*value="([^"]+)"/) ||
      html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/);
    session = { cookie, token: m ? m[1] : '', ts: Date.now() };
    return session;
  })();

  try {
    return await sessionPromise;
  } finally {
    sessionPromise = null;
  }
}

/** fetch() against kartta.hel.fi with session headers + auto token refresh */
async function apiFetch(pathname, { method = 'GET', body, retry = true } = {}) {
  const s = await openSession();
  const headers = {
    'User-Agent': UA,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: `${BASE}/?setlanguage=en`,
    Cookie: s.cookie,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (s.token) headers['X-XSRF-TOKEN'] = s.token;

  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Expired / missing anti-forgery token -> refresh once and retry.
  if ((res.status === 400 || res.status === 403) && retry) {
    await openSession(true);
    return apiFetch(pathname, { method, body, retry: false });
  }
  return res;
}

/* ------------------------------------------------------------------ */
/*  Reference data                                                     */
/* ------------------------------------------------------------------ */

// Curated base maps (layer id -> human label).
const BASE_MAPS = [
  { id: 'Karttasarja', label: 'Guide map (Karttasarja)', group: 'Guide maps' },
  { id: 'karttasarja_harmaa', label: 'Guide map, grey', group: 'Guide maps' },
  { id: 'karttasarja_pks', label: 'Guide map (metropolitan area)', group: 'Guide maps' },
  { id: 'karttasarja_pks_harmaa_wmts', label: 'Guide map, grey (metropolitan area)', group: 'Guide maps' },
  { id: 'opaskartta', label: 'Street map (Opaskartta)', group: 'Street maps' },
  { id: 'opaskartta_helsinki_harmaa', label: 'Street map, grey', group: 'Street maps' },
  { id: 'Opaskarttasarja_Helsinki', label: 'Street map set', group: 'Street maps' },
  { id: 'Opaskarttasarja_Helsinki_harmaa', label: 'Street map set, grey', group: 'Street maps' },
  { id: 'opaskartta_pks', label: 'Street map (metropolitan area)', group: 'Street maps' },
  { id: 'kantakartta', label: 'Base map (Kantakartta)', group: 'Base maps' },
  { id: 'kantakartta_harmaa', label: 'Base map, grey', group: 'Base maps' },
  { id: 'kantakartta_paakohteet', label: 'Base map, main features', group: 'Base maps' },
  { id: 'kantakartta_maastotiedot', label: 'Base map, terrain', group: 'Base maps' },
  { id: 'kantakartta_pohja', label: 'Base map, plain', group: 'Base maps' },
  { id: 'kantakartta_valkoinen', label: 'Base map, white', group: 'Base maps' },
  { id: 'kiinteistokartta', label: 'Property map (Kiinteistökartta)', group: 'Property maps' },
  { id: 'kiinteistokartta_paakohteet', label: 'Property map, main features', group: 'Property maps' },
  { id: 'kiinteistokartta_ilman_pohjakarttaa', label: 'Property map (no background)', group: 'Property maps' },
  { id: 'Ortoilmakuva_karttanimisto', label: 'Aerial photo with names', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2025_co_wmts', label: 'Aerial photo 2025', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2024', label: 'Aerial photo 2024', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2023', label: 'Aerial photo 2023', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2022', label: 'Aerial photo 2022', group: 'Aerial photos' },
  { id: 'Ortoilmakuva_2021', label: 'Aerial photo 2021', group: 'Aerial photos' },
];

// Curated overlay layers (drawn on top of the base map).
const OVERLAYS = [
  { id: 'kaupunginosat', label: 'City districts', group: 'Regional divisions' },
  { id: 'pienalueet_WFS', label: 'Small districts', group: 'Regional divisions' },
  { id: 'osaalueet_WFS', label: 'City sub-districts', group: 'Regional divisions' },
  { id: 'peruspiiri_WFS', label: 'Basic districts', group: 'Regional divisions' },
  { id: 'suurpiirit_WFS', label: 'Major districts', group: 'Regional divisions' },
  { id: 'Postinumeroalueet', label: 'Postal code areas', group: 'Regional divisions' },
  { id: 'palvelukartta_julkinen', label: 'Service map', group: 'Services' },
  { id: 'HSL_Pysakit', label: 'Public transport stops (HSL)', group: 'Transport' },
  { id: 'kiinteistot_pg', label: 'Properties', group: 'Properties' },
  { id: 'Ajantasa_asemakaava_maanpaallinen_varillinen', label: 'Detailed plan (coloured)', group: 'Planning' },
];

// Default view = central Helsinki (EPSG:3879).
const DEFAULT_VIEW = { easting: 25496825, northing: 6673044, resolution: 4 };

/* ------------------------------------------------------------------ */
/*  Layer style cache                                                  */
/* ------------------------------------------------------------------ */

const styleCache = new Map();

async function getLayerStyle(id) {
  if (styleCache.has(id)) return styleCache.get(id);
  const r = await apiFetch(`/api-sw/settings/layer/${encodeURIComponent(id)}`);
  if (!r.ok) return null;
  const d = await r.json();
  const layer = {
    type: d.type || 'vector',
    layer: d.id || id,
    opacity: 100,
  };
  if (d.style) layer.style = d.style;
  styleCache.set(id, layer);
  return layer;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function baseLayer(id) {
  return { type: 'clientraster', layer: id || 'Karttasarja', opacity: 100 };
}

function buildState({ easting, northing, resolution, layers }) {
  return {
    applications: [],
    easting: Number(easting),
    northing: Number(northing),
    resolution: Number(resolution),
    rotationS: 0,
    rotationT: 0,
    dim: false,
    names: false,
    snap: {
      pointSnap: false,
      pointSnapLength: 25,
      lineSnap: false,
      lineSnapLength: 25,
      midpointSnap: false,
      midpointSnapLength: 25,
      lineIntersectionSnap: false,
      lineIntersectionSnapLength: 25,
    },
    displayCoordinateSystemId: 'EPSG:3879',
    mapCoordinateSystemId: 'EPSG:3879',
    layers,
    linkParameters: [],
  };
}

function buildEmbedUrl(code, o = {}) {
  const p = new URLSearchParams();
  if (o.minimap) p.append('minimap', '1');
  if (o.legend) p.append('legend', '1');
  if (o.maptools) p.append('maptools', '1');
  if (o.maplink) p.append('maplink', '1');
  if (o.leftmenu) p.append('leftmenu', '1');
  if (o.wheelzoom === false) p.append('wheelzoom', '0');
  if (o.allow3d) p.append('allow3d', String(o.allow3d));
  if (o.text) p.append('text', o.text);
  p.append('setlanguage', o.language || 'fi');
  if (code) p.append('link', code);
  return `${BASE}/embed/?${p.toString()}`;
}

function buildIframe(url, width, height) {
  const w = parseInt(width, 10) || 640;
  const h = parseInt(height, 10) || 480;
  return (
    `<iframe width="${w}" height="${h}" ` +
    `style="border:0; width:${w}px !important; height:${h}px !important;" ` +
    `frameborder="0" src="${url}" title="Helsinki Map Service"></iframe>`
  );
}

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

app.get('/api/layers', (req, res) => {
  res.json({ baseMaps: BASE_MAPS, overlays: OVERLAYS, defaultView: DEFAULT_VIEW });
});

app.get('/api/scaffold/calculations/info', (_req, res) => {
  res.json({ engineVersion: ENGINE_VERSION, catalogVersion: CATALOG_VERSION, jurisdiction: 'FI' });
});

app.post('/api/scaffold/calculations', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Laskentapyyntö on annettava JSON-objektina.' });
    }
    return res.json(calculateScaffold(body));
  } catch (error) {
    return res.status(400).json({ error: `Laskentapyyntöä ei voitu käsitellä: ${error.message}` });
  }
});

// Read-only import bridge for a user's Base44-hosted admin export function.
// The target origin is fixed to the supplied Base44 app to prevent SSRF; the
// service-role credential remains in the local encrypted API-key vault.
app.post('/api/scaffold/admin-import', requireLocalSecretAccess, async (req, res) => {
  let endpoint;
  try { endpoint = new URL(String(req.body?.endpoint || '')); }
  catch { return res.status(400).json({ error: 'Anna Base44-admin-funktion HTTPS-osoite.' }); }
  if (
    endpoint.protocol !== 'https:' ||
    endpoint.hostname !== 'finnish-construction-compliance-sui-5106cde5.base44.app' ||
    !endpoint.pathname.startsWith('/api/') ||
    endpoint.pathname.startsWith('/api/frontend-config')
  ) {
    return res.status(400).json({ error: 'Tuonti hyväksyy vain tämän Finnish Construction Compliance Base44 -sovelluksen HTTPS /api/-funktion.' });
  }

  try {
    const keys = await readApiKeyVault();
    const key = keys.find((item) => item.name.toLocaleLowerCase() === 'base44 scaffold admin api');
    if (!key) return res.status(428).json({ error: 'Tallenna ensin Settings → API keys -näkymään avain nimellä “Base44 Scaffold Admin API”.' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let upstream;
    try {
      upstream = await fetch(endpoint, { headers: { Accept: 'application/json', Authorization: `Bearer ${key.value}` }, signal: controller.signal, redirect: 'manual' });
    } finally { clearTimeout(timeout); }
    if (upstream.status >= 300 && upstream.status < 400) return res.status(502).json({ error: 'Base44 palautti uudelleenohjauksen. Tarkista backend-funktion URL ja oikeudet; kirjautumissivua ei voi käyttää API-tuontina.' });
    if (!upstream.ok) return res.status(upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status).json({ error: `Base44-admin-funktio palautti HTTP ${upstream.status}. Tarkista avain ja funktion oikeudet.` });
    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('json')) return res.status(502).json({ error: 'Base44-funktion vastaus ei ollut JSON-muodossa.' });
    const text = await upstream.text();
    if (Buffer.byteLength(text, 'utf8') > 10 * 1024 * 1024) return res.status(502).json({ error: 'Base44-tuonti ylitti 10 Mt kokorajan.' });
    let payload;
    try { payload = JSON.parse(text); } catch { return res.status(502).json({ error: 'Base44-funktion JSON-vastaus ei ollut kelvollinen.' }); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return res.status(502).json({ error: 'Base44-funktion vastausrakenteen pitää olla JSON-objekti.' });
    const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
    return res.json({
      importedAt: new Date().toISOString(),
      source: endpoint.origin + endpoint.pathname,
      schemaVersion: payload.schemaVersion || data.schemaVersion || 'unversioned',
      analyses: Array.isArray(data.analyses) ? data.analyses : [],
      materials: Array.isArray(data.materials) ? data.materials : [],
      components: Array.isArray(data.components) ? data.components : [],
      views: Array.isArray(data.views) ? data.views : [],
    });
  } catch (error) {
    const timeout = error?.name === 'AbortError';
    return res.status(502).json({ error: timeout ? 'Base44-admin-funktion aikakatkaistiin (20 s).' : 'Base44-admin-tuonti epäonnistui paikallisessa palvelimessa.' });
  }
});

// These endpoints are intentionally local-only. Full values are returned only
// by the explicit reveal action; list responses contain masked values only.
app.get('/api/local/api-keys', requireLocalSecretAccess, async (_req, res) => {
  try {
    const keys = await readApiKeyVault();
    res.json({ keys: keys.map(({ id, name, value }) => ({ id, name, masked: maskApiKey(value) })) });
  } catch {
    return handleApiKeyError(res);
  }
});

app.post('/api/local/api-keys', requireLocalSecretAccess, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const value = String(req.body?.value || '').trim();
  if (
    !/^[\p{L}0-9][\p{L}0-9 _.-]{1,49}$/u.test(name) ||
    value.length < 8 || value.length > 512 || /[\r\n]/.test(value)
  ) {
    return res.status(400).json({ error: 'Anna avaimelle nimi ja kelvollinen, 8–512 merkin API-avain.' });
  }

  try {
    const saved = await mutateApiKeyVault((current) => {
      const existing = current.find((key) => key.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      const key = { id: existing?.id || crypto.randomUUID(), name, value };
      const keys = existing
        ? current.map((item) => item.id === existing.id ? key : item)
        : [...current, key];
      return { keys, result: { id: key.id, name: key.name, masked: maskApiKey(key.value) } };
    });
    return res.status(200).json({ key: saved });
  } catch {
    return handleApiKeyError(res);
  }
});

app.get('/api/local/api-keys/:id/reveal', requireLocalSecretAccess, async (req, res) => {
  try {
    const keys = await readApiKeyVault();
    const key = keys.find((item) => item.id === req.params.id);
    if (!key) return res.status(404).json({ error: 'API-avainta ei löytynyt.' });
    return res.json({ value: key.value });
  } catch {
    return handleApiKeyError(res);
  }
});

app.delete('/api/local/api-keys/:id', requireLocalSecretAccess, async (req, res) => {
  try {
    const removed = await mutateApiKeyVault((current) => {
      const key = current.find((item) => item.id === req.params.id);
      return { keys: current.filter((item) => item.id !== req.params.id), result: key || null };
    });
    if (!removed) return res.status(404).json({ error: 'API-avainta ei löytynyt.' });
    return res.json({ removed: removed.name });
  } catch {
    return handleApiKeyError(res);
  }
});

// Same-origin bridge for Helsinki's CityJSON building WFS. The target URL,
// type name, CRS and output format are fixed here; callers can only choose a
// small bounding circle and a capped feature count, so this is not an open proxy.
app.get('/api/helsinki/cityjson/buildings', async (req, res) => {
  const x = Number(req.query.x ?? DEFAULT_VIEW.easting);
  const y = Number(req.query.y ?? DEFAULT_VIEW.northing);
  const radius = Number(req.query.radius ?? 150);
  const count = Number(req.query.count ?? 20);

  if (
    !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) ||
    !Number.isInteger(count) || count < 1 || count > 50 ||
    radius < 25 || radius > 500 ||
    x < 25400000 || x > 25550000 || y < 6650000 || y > 6700000
  ) {
    return res.status(400).json({
      error: 'Virheelliset hakuarvot. Keskipisteen on oltava Helsingin alueella, säteen 25–500 m ja tulosrajan 1–50.',
    });
  }

  const bbox = [x - radius, y - radius, x + radius, y + radius];
  const crs = 'urn:ogc:def:crs:EPSG::3879';
  const upstreamUrl = new URL(CITY_MODEL_WFS);
  upstreamUrl.search = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: 'bldg:Building',
    srsName: crs,
    bbox: `${bbox.join(',')},${crs}`,
    startIndex: '0',
    count: String(count),
    outputFormat: 'application/json',
  }).toString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CITY_MODEL_WFS_TIMEOUT_MS);
  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: controller.signal,
    });
    if (!upstream.ok) {
      return res.status(502).json({
        error: 'Helsingin kaupunkimalli-WFS palautti virheen.',
        upstreamStatus: upstream.status,
      });
    }

    const declaredLength = Number(upstream.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > CITY_MODEL_WFS_MAX_BYTES) {
      return res.status(502).json({ error: 'WFS-vastaus ylitti sovelluksen kokorajan.' });
    }
    if (!upstream.body) {
      return res.status(502).json({ error: 'WFS ei palauttanut vastaussisältöä.' });
    }

    const reader = upstream.body.getReader();
    const chunks = [];
    let byteLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > CITY_MODEL_WFS_MAX_BYTES) {
        await reader.cancel();
        return res.status(502).json({ error: 'WFS-vastaus ylitti sovelluksen kokorajan.' });
      }
      chunks.push(value);
    }

    const body = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    let data;
    try {
      data = JSON.parse(new TextDecoder().decode(body));
    } catch {
      return res.status(502).json({
        error: 'WFS-vastaus ei ollut kelvollista JSON-dataa.',
        contentType: upstream.headers.get('content-type') || '',
      });
    }

    const format = data?.type === 'CityJSON'
      ? 'CityJSON'
      : Array.isArray(data?.features)
        ? 'GeoJSON'
        : 'JSON';
    res.json({
      source: 'Helsingin kaupunkimalli-WFS',
      endpoint: CITY_MODEL_WFS,
      typeName: 'bldg:Building',
      crs: 'EPSG:3879',
      bbox,
      requestedCount: count,
      format,
      data,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Helsingin 3D-WFS ei vastannut 60 sekunnissa. Rajaa hakualuetta tai yritä myöhemmin uudelleen.',
      });
    }
    return res.status(502).json({ error: 'Yhteys Helsingin kaupunkimalli-WFS:ään epäonnistui.' });
  } finally {
    clearTimeout(timeout);
  }
});

// Fast, authoritative Helsinki building footprints for scaffold mass-model
// selection. The 3D CityDB endpoint can time out under load; this route keeps
// geometry and register attributes usable while labeling height as an estimate.
app.get('/api/helsinki/building-footprints', async (req, res) => {
  const x = Number(req.query.x ?? DEFAULT_VIEW.easting);
  const y = Number(req.query.y ?? DEFAULT_VIEW.northing);
  const radius = Number(req.query.radius ?? 150);
  const count = Number(req.query.count ?? 20);
  if (
    !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) ||
    !Number.isInteger(count) || count < 1 || count > 50 || radius < 25 || radius > 500 ||
    x < 25400000 || x > 25550000 || y < 6650000 || y > 6700000
  ) {
    return res.status(400).json({ error: 'Virheelliset hakuarvot. Keskipisteen on oltava Helsingin alueella, säteen 25–500 m ja tulosrajan 1–50.' });
  }
  const bbox = [x - radius, y - radius, x + radius, y + radius];
  const upstreamUrl = new URL(HELSINKI_FOOTPRINT_WFS);
  upstreamUrl.search = new URLSearchParams({
    service: 'WFS', version: '2.0.0', request: 'GetFeature',
    typeNames: 'avoindata:Rakennukset_alue_rekisteritiedot',
    srsName: 'EPSG:3879', bbox: `${bbox.join(',')},EPSG:3879`,
    count: String(count), outputFormat: 'application/json',
  }).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const upstream = await fetch(upstreamUrl, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: controller.signal });
    if (!upstream.ok) return res.status(502).json({ error: 'Helsingin rakennusrekisteri palautti virheen.', upstreamStatus: upstream.status });
    const declaredLength = Number(upstream.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > CITY_MODEL_WFS_MAX_BYTES) return res.status(502).json({ error: 'Rakennusrekisterin vastaus ylitti sovelluksen kokorajan.' });
    if (!upstream.body) return res.status(502).json({ error: 'Helsingin rakennusrekisteri ei palauttanut vastaussisältöä.' });
    const reader = upstream.body.getReader();
    const chunks = [];
    let byteLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > CITY_MODEL_WFS_MAX_BYTES) {
        await reader.cancel();
        return res.status(502).json({ error: 'Rakennusrekisterin vastaus ylitti sovelluksen kokorajan.' });
      }
      chunks.push(value);
    }
    const body = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    const text = new TextDecoder().decode(body);
    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'Helsingin rakennusrekisteri ei palauttanut kelvollista GeoJSON-dataa.' }); }
    if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) return res.status(502).json({ error: 'Helsingin rakennusrekisterin vastaus ei ollut GeoJSON FeatureCollection.' });
    res.set('Cache-Control', 'public, max-age=120');
    return res.json({ source: 'Helsingin kaupungin rakennusten alue- ja rekisteritiedot', endpoint: HELSINKI_FOOTPRINT_WFS, typeName: 'avoindata:Rakennukset_alue_rekisteritiedot', crs: 'EPSG:3879', bbox, format: 'GeoJSON', data });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ error: 'Helsingin rakennusrekisteri ei vastannut 20 sekunnissa. Rajaa hakualuetta tai yritä myöhemmin uudelleen.' });
    return res.status(502).json({ error: 'Yhteys Helsingin rakennusrekisteriin epäonnistui.' });
  } finally { clearTimeout(timeout); }
});

// Fixed-source GTK soil lookup for a selected Helsinki coordinate. The map
// layers report mapped soil classes, not site-specific bearing capacity.
app.get('/api/gtk/soil-point', async (req, res) => {
  const x = Number(req.query.x), y = Number(req.query.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 25400000 || x > 25550000 || y < 6650000 || y > 6700000) {
    return res.status(400).json({ error: 'Valitse ensin rakennus Helsingin EPSG:3879-alueelta.' });
  }
  const [easting, northing] = proj4('EPSG:3879', 'EPSG:3067', [x, y]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const queryLayer = async (layerId) => {
    const url = new URL(`${GTK_SOIL_MAPSERVER}/${layerId}/query`);
    url.search = new URLSearchParams({
      geometry: `${easting},${northing}`, geometryType: 'esriGeometryPoint', inSR: '3067',
      spatialRel: 'esriSpatialRelIntersects', outFields: '*', returnGeometry: 'false', f: 'json',
    }).toString();
    const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: controller.signal });
    if (!response.ok) throw new Error(`GTK palautti HTTP ${response.status}`);
    const data = await response.json();
    if (data?.error) throw new Error(data.error.message || 'GTK:n maaperäpalvelu palautti virheen.');
    return data.features?.[0]?.attributes || null;
  };
  try {
    const detailed = await Promise.all([queryLayer(28), queryLayer(34)]);
    let scale = '1:20 000 / 1:50 000';
    let [surface, subsoil] = detailed;
    if (!surface && !subsoil) {
      [surface, subsoil] = await Promise.all([queryLayer(40), queryLayer(41)]);
      scale = '1:200 000';
    }
    const labelFrom = (attributes, keys) => {
      if (!attributes) return '';
      for (const key of keys) {
        const value = Object.entries(attributes).find(([name]) => name.toUpperCase() === key)?.[1];
        if (value != null && String(value).trim()) return String(value);
      }
      return '';
    };
    const summarize = (attributes, layerId) => attributes ? {
      label: labelFrom(attributes, ['PINTAMAALAJI', 'POHJAMAALAJI', 'MAALAJI', 'TUNNUS', 'NIMI']) || 'Maalajikuvio löytyi; luokkatunnus tarkistettava',
      code: labelFrom(attributes, ['PINTAMAALAJI_KOODI', 'POHJAMAALAJI_KOODI', 'KOODI']),
      layerId,
    } : null;
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json({
      source: 'GTK Maankamara · Maaperä', endpoint: GTK_SOIL_MAPSERVER,
      sourceUrl: 'https://www.gtk.fi/palvelut/aineistot-ja-verkkopalvelut/rajapintapalvelut/maapera-karttatasot-wms-rajapinnassa/',
      retrievedAt: new Date().toISOString(), crs: 'EPSG:3067', scale,
      surface: summarize(surface, surface ? (scale === '1:200 000' ? 40 : 28) : null),
      subsoil: summarize(subsoil, subsoil ? (scale === '1:200 000' ? 41 : 34) : null),
      coverage: surface || subsoil ? 'mapped' : 'unmapped',
      strength: { status: 'not-assessed', note: 'GTK:n karttaluokitus ei anna kohteen perustusten kantavuutta. Tarvitaan kohdekohtainen pohjatutkimus ja geotekninen arvio.' },
    });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ error: 'GTK:n maaperäpalvelu ei vastannut 15 sekunnissa. Yritä myöhemmin uudelleen.' });
    return res.status(502).json({ error: `GTK:n maaperätietoa ei saatu: ${error.message}` });
  } finally {
    clearTimeout(timeout);
  }
});

// Address / feature search
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const category = (req.query.category || 'Addresses').toString();
  const max = parseInt(req.query.max, 10) || 8;
  if (q.length < 2) return res.json({ features: [] });

  try {
    const r = await apiFetch('/api-sw/search', {
      method: 'POST',
      body: {
        search: q,
        skipfeatures: 0,
        maxfeatures: max,
        params: {},
        category,
        where: '',
        srs: 'EPSG:3879',
      },
    });
    if (!r.ok) return res.status(r.status).json({ error: 'search failed' });
    const data = await r.json();
    const features = (data.features || []).map((f) => ({
      name: f.properties.visibleName || f.properties.address_fi || 'Result',
      longName: f.properties.visibleNameLong || '',
      category: f.properties.category || category,
      type: f.properties.type || '',
      easting: f.geometry ? f.geometry.coordinates[0] : null,
      northing: f.geometry ? f.geometry.coordinates[1] : null,
    }));
    res.json({ features });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Building-drawing discovery is routed through the already configured local DataBridge.
// Keep its address fixed to localhost: the browser never chooses an arbitrary proxy URL.
app.post('/api/building-drawings/search', async (req, res) => {
  const address = String(req.body?.address || '').trim().slice(0, 240);
  const parcel = String(req.body?.parcel || '').trim().slice(0, 80);
  if (!address && !parcel) return res.status(400).json({ error: 'Rakennuksen osoite tai kiinteistötunnus puuttuu.' });
  const query = `${address} ${parcel} julkisivupiirustus rakennuspiirustus pohjapiirustus leikkaus`.trim().slice(0, 300);
  const addressMatch = address.match(/(.+?)\s+(\d+[a-z]?)(?:,|$)/i);
  const streetNeedle = addressMatch?.[1]?.trim().toLocaleLowerCase('fi') || '';
  const numberNeedle = addressMatch?.[2]?.toLocaleLowerCase('fi') || '';
  const parcelNeedle = parcel.replace(/[^0-9a-z]/gi, '').toLocaleLowerCase('fi');
  let geographicBbox = '';
  let projectedBbox = '';
  const coordinates = req.body?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const lon = Number(coordinates[0]), lat = Number(coordinates[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat) && lon >= 19 && lon <= 32 && lat >= 59 && lat <= 71) {
      const radius = 0.0012;
      geographicBbox = `${lon-radius},${lat-radius},${lon+radius},${lat+radius},EPSG:4326`;
      const [easting,northing] = proj4('EPSG:4326','EPSG:3067',[lon,lat]);
      projectedBbox = `${easting-120},${northing-120},${easting+120},${northing+120}`;
    }
  }
  const api = 'http://127.0.0.1:3017/api';
  const sources = [
    { id: 'museo', source: 'museo', layer: 'rajapinta_suojellut:suojellut_rakennukset_piste', label: 'Museovirasto · suojellut rakennukset' },
    { id: 'ryhti_building', source: 'ryhti_building', label: 'Ryhti · rakennushankkeet' },
    { id: 'ryhti_permit', source: 'ryhti_permit', label: 'Ryhti · rakennusluvat' },
    { id: 'ryhti_plan', source: 'ryhti_plan', label: 'Ryhti · kaavat' },
    { id: 'vayla', source: 'vayla', layer: 'hanketiedot:tiehankkeet', label: 'Väylävirasto · hankkeet' },
  ];
  const webSources = [
    { id: 'google', provider: 'google', label: 'Google Custom Search' },
    { id: 'duckduckgo', provider: 'duckduckgo', label: 'DuckDuckGo Instant Answers' },
    { id: 'brave', provider: 'brave', label: 'Brave Search' },
  ];
  const lookup = async (source) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 32000);
    try {
      const endpoint = source.provider ? `${api}/web-search` : `${api}/live-search`;
      const body = source.provider
        ? { provider: source.provider, query, limit: 10 }
        : { source: source.source, query, limit: 50, ...(source.layer ? { layer: source.layer } : {}), ...(source.source.startsWith('ryhti_') && projectedBbox ? { bbox: projectedBbox } : {}), ...((source.source === 'museo' || source.source === 'vayla') && geographicBbox ? { bbox: geographicBbox.replace(',EPSG:4326', ',4326') } : {}) };
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Crawler vastasi HTTP ${response.status}`);
      const items = (payload.items || []).filter((item) => {
        const text = `${item.title || ''} ${(item.details || []).map((row) => row.value).join(' ')}`.toLocaleLowerCase('fi');
        const normalized = text.replace(/[^a-z0-9äöå]/gi, ' ').replace(/\s+/g, ' ').trim();
        const sameParcel = parcelNeedle && normalized.replace(/[^a-z0-9]/gi, '').includes(parcelNeedle);
        const sameAddress = streetNeedle && normalized.includes(streetNeedle) && new RegExp(`\\b${numberNeedle}\\b`, 'i').test(normalized);
        if (!sameParcel && !sameAddress) return false;
        if (source.provider) return /(piirust|julkisivu|rakennuspiirustus|pohjapiirustus|fasad|ritning|arkisto)/i.test(text);
        return /(piirust|julkisivu|rakennus|asemakaava|lupa|suojeltu|hanke|osoite)/i.test(text);
      }).slice(0, 10).map((item) => ({ ...item, category: /julkisivu|fasad/i.test(item.title || '') ? 'Julkisivu' : /pohja|planritning/i.test(item.title || '') ? 'Pohjapiirustus' : /leikkaus|sektion/i.test(item.title || '') ? 'Leikkaus' : /rakenne/i.test(item.title || '') ? 'Rakenne' : 'Mahdollinen lähde', source: payload.source || source.label }));
      return { id: source.id, label: payload.source || source.label, status: 'ok', count: items.length, items, note: payload.note || '' };
    } catch (error) {
      return { id: source.id, label: source.label, status: 'unavailable', count: 0, items: [], note: error.name === 'AbortError' ? 'Haku aikakatkaistiin.' : error.message || 'Lähde ei vastannut.' };
    } finally { clearTimeout(timer); }
  };
  const results = await Promise.all([...sources, ...webSources].map(lookup));
  res.json({ query, searchedAt: new Date().toISOString(), sources: results, items: results.flatMap((source) => source.items), note: 'Crawler hakee julkisista rajapinnoista ja käytössä olevista hakupalveluista. Hakutulos on ehdokas; piirustus on tarkistettava alkuperäisestä arkistosta.' });
});

// Coordinate transform (e.g. WGS84 lat/lon -> EPSG:3879)
app.get('/api/transform', async (req, res) => {
  const { x, y, source = 'EPSG:4326', target = 'EPSG:3879' } = req.query;
  if (x == null || y == null)
    return res.status(400).json({ error: 'x and y required' });
  try {
    const r = await apiFetch(
      `/api-sw/coordinates?x=${encodeURIComponent(x)}&y=${encodeURIComponent(
        y
      )}&sourceSRS=${encodeURIComponent(source)}&targetSRS=${encodeURIComponent(
        target
      )}`
    );
    if (!r.ok) return res.status(r.status).json({ error: 'transform failed' });
    const coords = await r.json(); // [easting, northing]
    res.json({ easting: coords[0], northing: coords[1] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Create an embeddable map
app.post('/api/embed', async (req, res) => {
  const b = req.body || {};
  const easting = Number(b.easting ?? DEFAULT_VIEW.easting);
  const northing = Number(b.northing ?? DEFAULT_VIEW.northing);
  const resolution = Number(b.resolution ?? DEFAULT_VIEW.resolution);

  const opts = {
    language: b.language || 'fi',
    minimap: !!b.minimap,
    legend: !!b.legend,
    maptools: !!b.maptools,
    maplink: !!b.maplink,
    leftmenu: !!b.leftmenu,
    wheelzoom: b.wheelzoom !== false,
    allow3d: b.allow3d || 0,
    text: b.text || '',
  };

  try {
    // Assemble the layer stack: base map first, then overlays.
    const layers = [baseLayer(b.baseMap || 'Karttasarja')];
    const overlayIds = Array.isArray(b.overlays) ? b.overlays : [];
    for (const id of overlayIds) {
      const layer = await getLayerStyle(id);
      if (layer) layers.push(layer);
    }

    const state = buildState({ easting, northing, resolution, layers });
    const r = await apiFetch('/api-sw/shorten', {
      method: 'POST',
      body: { state },
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'shorten failed', detail: t });
    }
    const data = await r.json();
    const code = data.id;

    const embedUrl = buildEmbedUrl(code, opts);
    const width = b.width || 640;
    const height = b.height || 480;

    res.json({
      code,
      embedUrl,
      iframe: buildIframe(embedUrl, width, height),
      fullUrl: `${BASE}/link/${code}`,
      state,
      view: { easting, northing, resolution },
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Load a stored state from a short code
app.get('/api/embed/:code', async (req, res) => {
  try {
    const r = await apiFetch(
      `/api-sw/shorten?linkId=${encodeURIComponent(req.params.code)}`
    );
    if (!r.ok) return res.status(r.status).json({ error: 'not found' });
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Helsinki Map Embed Builder running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
