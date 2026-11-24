'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const STAGES = ['Uusi', 'Kelpuutus', 'Yhteydenotto', 'Tarjousvalmistelu', 'Tarjous lähetetty', 'Voitettu', 'Hävitty'];
const LEGACY_STAGES = {
  Yhteydenotto: 'Yhteydenotto',
  Neuvottelu: 'Tarjousvalmistelu',
  Tarjous: 'Tarjous lähetetty',
  Voitettu: 'Voitettu',
  Hävitty: 'Hävitty',
};
const DEFAULT_DB_PATH = path.join(__dirname, '..', '.local-data', 'telinehallinta.sqlite');

function now() { return new Date().toISOString(); }
function trimmed(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
function nullable(value, max = 500) { const out = trimmed(value, max); return out || null; }
function validBusinessId(value) { return /^\d{7}-\d$/.test(String(value || '').trim()); }
function validDateOnly(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text;
}
function validHttpUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(String(value)).protocol); }
  catch { return false; }
}
function legacyId(prefix, value) {
  return `${prefix}-${crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24)}`;
}
function normalizedName(value) {
  return trimmed(value, 200).toLocaleLowerCase('fi-FI').replace(/\s+/g, ' ').replace(/[.,]/g, '').trim();
}

function openCrmStore(filename = process.env.TELINEHALLINTA_CRM_DB || DEFAULT_DB_PATH) {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  try { fs.chmodSync(path.dirname(filename), 0o700); } catch {}
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      business_id TEXT,
      name TEXT NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      x REAL,
      y REAL,
      location_status TEXT NOT NULL DEFAULT 'missing' CHECK(location_status IN ('missing','unverified','confirmed')),
      location_source TEXT,
      location_label TEXT,
      profile_json TEXT NOT NULL DEFAULT '{}',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS companies_business_id_idx ON companies(business_id) WHERE business_id IS NOT NULL AND business_id <> '';
    CREATE INDEX IF NOT EXISTS companies_name_idx ON companies(name COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS company_contacts (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      source_url TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS company_contacts_company_idx ON company_contacts(company_id, name COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS company_addresses (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL,
      address_type TEXT NOT NULL DEFAULT 'office',
      source_url TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS company_addresses_company_idx ON company_addresses(company_id, is_primary DESC);

    CREATE TABLE IF NOT EXISTS buildings (
      ratu TEXT PRIMARY KEY,
      gml_id TEXT,
      name TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      x REAL,
      y REAL,
      source TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
      title TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      source_id TEXT,
      source_url TEXT,
      procurement_type TEXT,
      procurement_deadline TEXT,
      procurement_published_at TEXT,
      cpv_codes TEXT NOT NULL DEFAULT '',
      procurement_estimated_value REAL,
      procurement_currency TEXT,
      stage TEXT NOT NULL DEFAULT 'Uusi' CHECK(stage IN ('Uusi','Kelpuutus','Yhteydenotto','Tarjousvalmistelu','Tarjous lähetetty','Voitettu','Hävitty')),
      value REAL NOT NULL DEFAULT 0 CHECK(value >= 0),
      next_action TEXT NOT NULL DEFAULT '',
      next_action_due TEXT,
      building_ratu TEXT REFERENCES buildings(ratu) ON UPDATE CASCADE ON DELETE SET NULL,
      review_required INTEGER NOT NULL DEFAULT 0,
      review_note TEXT,
      legacy_stage TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'not-eligible' CHECK(sync_status IN ('not-eligible','waiting-contract','pending','failed','synced')),
      external_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS opportunities_source_id_idx ON opportunities(source, source_id) WHERE source_id IS NOT NULL AND source_id <> '';
    CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON opportunities(stage);
    CREATE INDEX IF NOT EXISTS opportunities_company_idx ON opportunities(company_id);

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      source_url TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS activities_opportunity_idx ON activities(opportunity_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS drawings (
      id TEXT PRIMARY KEY,
      ratu TEXT REFERENCES buildings(ratu) ON UPDATE CASCADE ON DELETE SET NULL,
      legacy_id TEXT UNIQUE,
      title TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'Telinepiirustus / 3D-malli',
      format TEXT NOT NULL DEFAULT '',
      revision TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      review_required INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS drawings_ratu_idx ON drawings(ratu);

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      idempotency_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'waiting-contract' CHECK(status IN ('waiting-contract','pending','failed','synced')),
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sync_outbox_status_idx ON sync_outbox(status, updated_at DESC);

    CREATE TABLE IF NOT EXISTS crm_migrations (
      migration_key TEXT PRIMARY KEY,
      imported_at TEXT NOT NULL,
      customers_imported INTEGER NOT NULL DEFAULT 0,
      drawings_imported INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Keep existing local databases compatible with the added HILMA tracking fields.
  const opportunityColumns = new Set(db.prepare('PRAGMA table_info(opportunities)').all().map((column) => column.name));
  const companyColumns = new Set(db.prepare('PRAGMA table_info(companies)').all().map((column) => column.name));
  if (!companyColumns.has('profile_json')) db.exec("ALTER TABLE companies ADD COLUMN profile_json TEXT NOT NULL DEFAULT '{}'");
  for (const [name, declaration] of [
    ['procurement_type', 'TEXT'],
    ['procurement_deadline', 'TEXT'],
    ['procurement_published_at', 'TEXT'],
    ['cpv_codes', "TEXT NOT NULL DEFAULT ''"],
    ['procurement_estimated_value', 'REAL'],
    ['procurement_currency', 'TEXT'],
  ]) {
    if (!opportunityColumns.has(name)) db.exec(`ALTER TABLE opportunities ADD COLUMN ${name} ${declaration}`);
  }

  const companyByBusinessId = db.prepare('SELECT * FROM companies WHERE business_id = ?');
  const companyById = db.prepare('SELECT * FROM companies WHERE id = ?');
  const insertCompany = db.prepare(`INSERT INTO companies (id,business_id,name,contact,email,address,x,y,location_status,location_source,location_label,profile_json,is_demo,created_at,updated_at)
    VALUES (@id,@business_id,@name,@contact,@email,@address,@x,@y,@location_status,@location_source,@location_label,@profile_json,@is_demo,@created_at,@updated_at)`);
  const upsertBuildingStmt = db.prepare(`INSERT INTO buildings (ratu,gml_id,name,address,x,y,source,created_at,updated_at)
    VALUES (@ratu,@gml_id,@name,@address,@x,@y,@source,@created_at,@updated_at)
    ON CONFLICT(ratu) DO UPDATE SET
      gml_id=COALESCE(excluded.gml_id,buildings.gml_id), name=CASE WHEN excluded.name<>'' THEN excluded.name ELSE buildings.name END,
      address=CASE WHEN excluded.address<>'' THEN excluded.address ELSE buildings.address END,
      x=COALESCE(excluded.x,buildings.x), y=COALESCE(excluded.y,buildings.y),
      source=COALESCE(excluded.source,buildings.source), updated_at=excluded.updated_at`);

  function companyRecord(input, { id, isDemo = false } = {}) {
    const businessId = validBusinessId(input.businessId) ? String(input.businessId).trim() : null;
    const existing = businessId ? companyByBusinessId.get(businessId) : null;
    if (existing) {
      const address = trimmed(input.address,400);
      const addressChanged = Boolean(address && address !== existing.address);
      const profile = cleanProfile(input.profile && typeof input.profile === 'object' ? input.profile : {}, JSON.parse(existing.profile_json || '{}'));
      db.prepare(`UPDATE companies SET name=CASE WHEN @name<>'' THEN @name ELSE name END,
        contact=CASE WHEN @contact<>'' THEN @contact ELSE contact END,
        email=CASE WHEN @email<>'' THEN @email ELSE email END,
        address=CASE WHEN @address<>'' THEN @address ELSE address END,
        profile_json=@profile_json,
        x=CASE WHEN @address_changed THEN NULL ELSE x END,y=CASE WHEN @address_changed THEN NULL ELSE y END,
        location_status=CASE WHEN @address_changed THEN 'unverified' ELSE location_status END,
        updated_at=@updated_at WHERE id=@id`)
        .run({ id: existing.id, name: trimmed(input.name, 200), contact: trimmed(input.contact, 200), email: trimmed(input.email, 254), address, profile_json: JSON.stringify(profile), address_changed: addressChanged ? 1 : 0, updated_at: now() });
      return companyById.get(existing.id);
    }
    const at = now();
    const record = {
      id: id || crypto.randomUUID(), business_id: businessId, name: trimmed(input.name, 200),
      contact: trimmed(input.contact, 200), email: trimmed(input.email, 254), address: trimmed(input.address, 400),
      x: null, y: null, location_status: 'missing', location_source: null, location_label: null,
      profile_json: JSON.stringify(cleanProfile(input.profile && typeof input.profile === 'object' ? input.profile : {})),
      is_demo: isDemo ? 1 : 0, created_at: at, updated_at: at,
    };
    if (!record.name) throw new Error('Yrityksen nimi puuttuu.');
    insertCompany.run(record);
    return companyById.get(record.id);
  }

  function createOpportunity(input) {
    const title = trimmed(input.title || input.name || input.company, 300);
    if (!title) throw new Error('Myyntimahdollisuuden nimi puuttuu.');
    const source = trimmed(input.source || 'manual', 80) || 'manual';
    const sourceId = nullable(input.sourceId, 180);
    if (sourceId) {
      const existing = db.prepare('SELECT id FROM opportunities WHERE source=? AND source_id=?').get(source, sourceId);
      if (existing) return { opportunity: getOpportunity(existing.id), duplicate: true, possibleDuplicates: [] };
    }
    const contact = trimmed(input.contact, 200);
    const email = trimmed(input.email, 254);
    const address = trimmed(input.address, 400);
    const companyName = trimmed(input.companyName || input.company || title, 200);
    let company;
    let possibleDuplicates = [];
    if (input.companyId) {
      company = companyById.get(trimmed(input.companyId, 80));
      if (!company) throw new Error('Valittua yritystä ei löytynyt.');
    } else {
      const suppliedBusinessId = trimmed(input.businessId,30);
      if (suppliedBusinessId && !validBusinessId(suppliedBusinessId)) throw new Error('Y-tunnuksen muoto on virheellinen. Käytä muotoa 1234567-8.');
      const businessId = validBusinessId(suppliedBusinessId) ? suppliedBusinessId : null;
      if (!businessId) {
        const target = normalizedName(companyName);
        possibleDuplicates = db.prepare('SELECT id,name,business_id FROM companies ORDER BY name LIMIT 500').all()
          .filter((item) => normalizedName(item.name) === target).slice(0, 5);
      }
      company = companyRecord({ name: companyName, businessId, contact, email, address }, { isDemo: input.isDemo });
    }
    const rawStage = trimmed(input.stage, 80);
    const stage = STAGES.includes(rawStage) ? rawStage : (LEGACY_STAGES[rawStage] || 'Uusi');
    const at = now();
    const id = trimmed(input.id, 80) || crypto.randomUUID();
    const buildingRatu = nullable(input.buildingRatu || input.ratu, 80);
    const unknownBuilding = buildingRatu && !db.prepare('SELECT 1 FROM buildings WHERE ratu=?').get(buildingRatu);
    if (unknownBuilding) upsertBuildingStmt.run({ ratu: buildingRatu, gml_id: null, name: '', address: '', x: null, y: null, source: 'CRM · RATU tarkistettava', created_at: at, updated_at: at });
    const procurementEstimatedValue = Number.isFinite(Number(input.procurementEstimatedValue)) && input.procurementEstimatedValue !== '' && input.procurementEstimatedValue != null ? Math.max(0, Number(input.procurementEstimatedValue)) : null;
    const procurementDeadline = nullable(input.procurementDeadline, 40);
    db.prepare(`INSERT INTO opportunities (id,company_id,title,source,source_id,source_url,procurement_type,procurement_deadline,procurement_published_at,cpv_codes,procurement_estimated_value,procurement_currency,stage,value,next_action,next_action_due,building_ratu,review_required,review_note,legacy_stage,is_demo,sync_status,created_at,updated_at)
      VALUES (@id,@company_id,@title,@source,@source_id,@source_url,@procurement_type,@procurement_deadline,@procurement_published_at,@cpv_codes,@procurement_estimated_value,@procurement_currency,@stage,@value,@next_action,@next_action_due,@building_ratu,@review_required,@review_note,@legacy_stage,@is_demo,'not-eligible',@created_at,@updated_at)`)
      .run({ id, company_id: company.id, title, source, source_id: sourceId, source_url: validHttpUrl(input.sourceUrl) ? String(input.sourceUrl) : null,
        procurement_type: nullable(input.procurementType, 120), procurement_deadline: procurementDeadline,
        procurement_published_at: nullable(input.procurementPublishedAt, 40), cpv_codes: trimmed(input.cpvCodes, 240),
        procurement_estimated_value: procurementEstimatedValue, procurement_currency: trimmed(input.procurementCurrency, 8),
        stage, value: Math.max(0, Number(input.value) || 0), next_action: trimmed(input.nextAction || input.nextStep, 300),
        next_action_due: nullable(input.nextActionDue || input.dueDate || (procurementDeadline ? procurementDeadline.slice(0,10) : ''), 30), building_ratu: buildingRatu,
        review_required: input.reviewRequired || unknownBuilding || (!STAGES.includes(rawStage) && Boolean(rawStage)) || possibleDuplicates.length ? 1 : 0,
        review_note: nullable(input.reviewNote || (possibleDuplicates.length ? 'Tarkista mahdollinen samanniminen yritys.' : unknownBuilding ? 'RATU-tunnusta ei ole vielä yhdistetty vahvistettuun rakennuskohteeseen.' : ''), 500),
        legacy_stage: nullable(input.legacyStage || (!STAGES.includes(rawStage) ? rawStage : ''), 80), is_demo: input.isDemo ? 1 : 0, created_at: at, updated_at: at });
    db.prepare('INSERT INTO activities (id,opportunity_id,kind,summary,source_url,created_at) VALUES (?,?,?,?,?,?)')
      .run(crypto.randomUUID(), id, trimmed(input.activityKind || 'created', 40), trimmed(input.activitySummary || 'Myyntimahdollisuus lisätty.', 500), validHttpUrl(input.sourceUrl) ? String(input.sourceUrl) : null, at);
    return { opportunity: getOpportunity(id), duplicate: false, possibleDuplicates };
  }

  function createCompany(input = {}) {
    const suppliedBusinessId = trimmed(input.businessId,30);
    if (suppliedBusinessId && !validBusinessId(suppliedBusinessId)) throw new Error('Y-tunnuksen muoto on virheellinen. Käytä muotoa 1234567-8.');
    const businessId = suppliedBusinessId || null;
    if (businessId) {
      const existing = companyByBusinessId.get(businessId);
      if (existing) return { company: existing, duplicate: true, possibleDuplicates: [] };
    }
    let possibleDuplicates = [];
    if (!businessId) {
      const target = normalizedName(input.name);
      if (target) possibleDuplicates = db.prepare('SELECT id,name,business_id FROM companies ORDER BY name LIMIT 500').all()
        .filter((item) => normalizedName(item.name) === target).slice(0,5);
    }
    const company = companyRecord({ ...input, businessId }, { isDemo: input.isDemo });
    return { company, duplicate: false, possibleDuplicates };
  }

  const getOpportunity = (id) => db.prepare(`SELECT o.*, c.business_id AS businessId, c.name AS company, c.contact, c.email, c.address,
      c.x AS companyX, c.y AS companyY, c.location_status AS locationStatus, c.location_source AS locationSource, c.location_label AS locationLabel
    FROM opportunities o JOIN companies c ON c.id=o.company_id WHERE o.id=?`).get(id);

  const listOpportunities = ({ stage = '', query = '' } = {}) => {
    let rows = db.prepare(`SELECT o.*, c.business_id AS businessId, c.name AS company, c.contact, c.email, c.address,
      c.x AS companyX, c.y AS companyY, c.location_status AS locationStatus, c.location_source AS locationSource, c.location_label AS locationLabel
      FROM opportunities o JOIN companies c ON c.id=o.company_id ORDER BY o.updated_at DESC`).all();
    if (stage && STAGES.includes(stage)) rows = rows.filter((row) => row.stage === stage);
    const term = trimmed(query, 100).toLocaleLowerCase('fi-FI');
    if (term) rows = rows.filter((row) => `${row.company} ${row.title} ${row.businessId || ''} ${row.source || ''}`.toLocaleLowerCase('fi-FI').includes(term));
    return rows;
  };

  function updateOpportunity(id, patch) {
    const before = getOpportunity(id);
    if (!before) return null;
    const allowed = ['title','stage','value','nextAction','nextActionDue','buildingRatu','reviewRequired','reviewNote'];
    const next = { ...before };
    for (const key of allowed) if (Object.hasOwn(patch || {}, key)) next[key] = patch[key];
    if (!Object.hasOwn(patch || {}, 'nextAction')) next.nextAction = before.next_action;
    if (!Object.hasOwn(patch || {}, 'nextActionDue')) next.nextActionDue = before.next_action_due;
    if (!Object.hasOwn(patch || {}, 'buildingRatu')) next.buildingRatu = before.building_ratu;
    if (!STAGES.includes(next.stage)) throw new Error('Tuntematon myyntivaihe.');
    const at = now();
    const ratu = nullable(next.buildingRatu, 80);
    const unknownBuilding = ratu && !db.prepare(`SELECT 1 FROM buildings WHERE ratu=? AND (name<>'' OR address<>'' OR x IS NOT NULL)`).get(ratu);
    if (unknownBuilding) upsertBuildingStmt.run({ ratu, gml_id: null, name: '', address: '', x: null, y: null, source: 'CRM · RATU tarkistettava', created_at: at, updated_at: at });
    const transaction = db.transaction(() => {
      db.prepare(`UPDATE opportunities SET title=?,stage=?,value=?,next_action=?,next_action_due=?,building_ratu=?,review_required=?,review_note=?,updated_at=? WHERE id=?`)
        .run(trimmed(next.title,300)||before.title,next.stage,Math.max(0,Number(next.value)||0),trimmed(next.nextAction,300),nullable(next.nextActionDue,30),ratu,(next.reviewRequired||unknownBuilding)?1:0,nullable(next.reviewNote || (unknownBuilding ? 'RATU-tunnusta ei ole vielä yhdistetty vahvistettuun rakennuskohteeseen.' : ''),500),at,id);
      const addChangeActivity = (kind, summary) => db.prepare('INSERT INTO activities (id,opportunity_id,kind,summary,created_at) VALUES (?,?,?,?,?)')
        .run(crypto.randomUUID(), id, kind, summary, at);
      if (before.stage !== next.stage) {
        addChangeActivity('stage', `${before.stage} → ${next.stage}`);
        if (before.stage === 'Kelpuutus' && next.stage === 'Yhteydenotto' && !before.is_demo) {
          const syncId = crypto.randomUUID();
          const payload = JSON.stringify({ localOpportunityId: id, company: before.company, businessId: before.businessId, title: next.title, stage: next.stage, value: next.value, nextAction: next.nextAction, sourceUrl: before.source_url, buildingRatu: ratu });
          db.prepare(`INSERT OR IGNORE INTO sync_outbox (id,opportunity_id,idempotency_key,status,payload_json,created_at,updated_at) VALUES (?,?,?,'waiting-contract',?,?,?)`)
            .run(syncId, id, `qualified:${id}`, payload, at, at);
          db.prepare(`UPDATE opportunities SET sync_status='waiting-contract' WHERE id=?`).run(id);
        }
      }
      const nextAction = trimmed(next.nextAction,300);
      if ((before.next_action || '') !== nextAction) addChangeActivity('follow-up', `Seuraava tehtävä päivitetty: ${nextAction || 'poistettu'}`);
      const nextActionDue = nullable(next.nextActionDue,30) || null;
      if ((before.next_action_due || null) !== nextActionDue) addChangeActivity('follow-up-due', `Seuraavan tehtävän määräpäivä: ${nextActionDue || 'poistettu'}`);
      const nextValue = Math.max(0,Number(next.value)||0);
      if ((Number(before.value)||0) !== nextValue) addChangeActivity('value', `Mahdollisuuden arvio: ${new Intl.NumberFormat('fi-FI',{maximumFractionDigits:0}).format(Number(before.value)||0)} € → ${new Intl.NumberFormat('fi-FI',{maximumFractionDigits:0}).format(nextValue)} €`);
      if ((before.building_ratu || '') !== (ratu || '')) addChangeActivity('building', `Rakennuksen RATU: ${ratu || 'poistettu'}`);
    });
    transaction();
    return getOpportunity(id);
  }

  function updateCompanyLocation(id, location) {
    const x = Number(location.x), y = Number(location.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 25400000 || x > 25550000 || y < 6650000 || y > 6700000) throw new Error('Valitse Helsingin alueen karttaosuma.');
    const label = trimmed(location.label, 300);
    const source = trimmed(location.source || 'Helsingin karttapalvelun osoitehaku', 180);
    const result = db.prepare(`UPDATE companies SET x=?,y=?,location_status='confirmed',location_source=?,location_label=?,address=CASE WHEN ?<>'' THEN ? ELSE address END,updated_at=? WHERE id=?`)
      .run(x,y,source,label,label,label,now(),id);
    return result.changes ? companyById.get(id) : null;
  }

  function addActivity(opportunityId, input) {
    if (!getOpportunity(opportunityId)) return null;
    const summary = trimmed(input.summary, 1000);
    if (!summary) throw new Error('Kirjaa aktiviteetin sisältö.');
    const item = { id: crypto.randomUUID(), opportunity_id: opportunityId, kind: trimmed(input.kind || 'note',40), summary,
      source_url: validHttpUrl(input.sourceUrl) ? String(input.sourceUrl) : null, created_at: now() };
    db.prepare('INSERT INTO activities (id,opportunity_id,kind,summary,source_url,created_at) VALUES (@id,@opportunity_id,@kind,@summary,@source_url,@created_at)').run(item);
    return item;
  }

  function listActivities(opportunityId) {
    return db.prepare('SELECT * FROM activities WHERE opportunity_id=? ORDER BY created_at DESC').all(opportunityId);
  }

  function completeNextAction(id, input = '') {
    const before = getOpportunity(id);
    if (!before) return null;
    const action = trimmed(before.next_action, 300);
    if (!action) throw new Error('Mahdollisuudella ei ole avointa tehtävää kuitattavaksi.');
    const options = input && typeof input === 'object' ? input : { note: input };
    const at = now();
    const detail = trimmed(options.note, 500);
    const nextAction = trimmed(options.nextAction, 300);
    const nextActionDue = nullable(options.nextActionDue, 10);
    if (nextActionDue && (!nextAction || !validDateOnly(nextActionDue))) throw new Error('Uusi määräpäivä vaatii seuraavan tehtävän ja kelvollisen päivämäärän.');
    const summary = `Tehtävä tehty: ${action}${detail ? ` · ${detail}` : ''}`;
    const completionId = crypto.randomUUID();
    const transaction = db.transaction(() => {
      db.prepare('UPDATE opportunities SET next_action=?,next_action_due=?,updated_at=? WHERE id=?').run(nextAction, nextAction ? nextActionDue : null, at, id);
      db.prepare('INSERT INTO activities (id,opportunity_id,kind,summary,created_at) VALUES (?,?,?,?,?)')
        .run(completionId, id, 'follow-up-completed', summary, at);
      if (nextAction) {
        db.prepare('INSERT INTO activities (id,opportunity_id,kind,summary,created_at) VALUES (?,?,?,?,?)')
          .run(crypto.randomUUID(), id, 'follow-up', `Seuraava tehtävä kirjattu: ${nextAction}${nextActionDue ? ` · määräpäivä ${nextActionDue}` : ''}`, at);
      }
    });
    transaction();
    return { opportunity: getOpportunity(id), activity: db.prepare('SELECT * FROM activities WHERE id=?').get(completionId) };
  }

  function upsertBuilding(input) {
    const ratu = trimmed(input.ratu || input.RATU, 80);
    if (!ratu) throw new Error('RATU-tunnus puuttuu.');
    const at = now();
    const x = input.x == null || input.x === '' ? null : Number(input.x);
    const y = input.y == null || input.y === '' ? null : Number(input.y);
    if ((x != null || y != null) && (!Number.isFinite(x) || !Number.isFinite(y) || x < 25400000 || x > 25550000 || y < 6650000 || y > 6700000)) throw new Error('Rakennuskohteen koordinaattien pitää olla Helsingin alueella EPSG:3879-järjestelmässä.');
    upsertBuildingStmt.run({ ratu, gml_id: nullable(input.gmlId || input.gml_id, 180), name: trimmed(input.name,240), address: trimmed(input.address,400),
      x, y,
      source: nullable(input.source,180), created_at: at, updated_at: at });
    return db.prepare('SELECT * FROM buildings WHERE ratu=?').get(ratu);
  }

  function addDrawing(input) {
    const ratu = trimmed(input.ratu || input.RATU, 80);
    const title = trimmed(input.title, 240);
    const url = trimmed(input.url, 2000);
    if (!ratu && !input.reviewRequired) throw new Error('RATU-tunnus vaaditaan piirustusviitteelle.');
    if (!title) throw new Error('Piirustuksen nimi puuttuu.');
    if (!validHttpUrl(url)) throw new Error('Tallennusosoitteen pitää alkaa http:// tai https://.');
    const at = now();
    const unknownBuilding = ratu && !db.prepare(`SELECT 1 FROM buildings WHERE ratu=? AND (name<>'' OR address<>'' OR x IS NOT NULL)`).get(ratu);
    if (unknownBuilding) upsertBuildingStmt.run({ ratu, gml_id: null, name: trimmed(input.buildingName,240), address: '', x: null, y: null, source: 'Piirustusarkisto · RATU tarkistettava', created_at: at, updated_at: at });
    const result = { id: crypto.randomUUID(), ratu: ratu || null, legacy_id: nullable(input.legacyId,180), title, kind: trimmed(input.kind || input.type || 'Telinepiirustus / 3D-malli',100),
      format: trimmed(input.format,30), revision: trimmed(input.revision,100), url, notes: trimmed(input.notes,1000), review_required: (input.reviewRequired || unknownBuilding)?1:0, created_at: at, updated_at: at };
    if (result.legacy_id) {
      db.prepare(`INSERT INTO drawings (id,ratu,legacy_id,title,kind,format,revision,url,notes,review_required,created_at,updated_at)
        VALUES (@id,@ratu,@legacy_id,@title,@kind,@format,@revision,@url,@notes,@review_required,@created_at,@updated_at)
        ON CONFLICT(legacy_id) DO UPDATE SET ratu=excluded.ratu,title=excluded.title,kind=excluded.kind,format=excluded.format,revision=excluded.revision,url=excluded.url,notes=excluded.notes,review_required=excluded.review_required,updated_at=excluded.updated_at`).run(result);
      return db.prepare('SELECT * FROM drawings WHERE legacy_id=?').get(result.legacy_id);
    }
    db.prepare(`INSERT INTO drawings (id,ratu,legacy_id,title,kind,format,revision,url,notes,review_required,created_at,updated_at)
      VALUES (@id,@ratu,@legacy_id,@title,@kind,@format,@revision,@url,@notes,@review_required,@created_at,@updated_at)`).run(result);
    return result;
  }

  function listDrawings(ratu = '') {
    if (ratu) return db.prepare('SELECT * FROM drawings WHERE ratu=? ORDER BY updated_at DESC').all(trimmed(ratu,80));
    return db.prepare('SELECT * FROM drawings WHERE ratu IS NULL OR review_required=1 ORDER BY updated_at DESC').all();
  }
  function listAllDrawings() { return db.prepare('SELECT * FROM drawings ORDER BY updated_at DESC').all(); }

  function removeDrawing(id) { return db.prepare('DELETE FROM drawings WHERE id=?').run(id).changes > 0; }
  function removeOpportunity(id) { return db.prepare('DELETE FROM opportunities WHERE id=?').run(id).changes > 0; }
  function removeCompany(id) {
    const company = companyById.get(trimmed(id,80));
    if (!company) return false;
    if (db.prepare('SELECT 1 FROM opportunities WHERE company_id=? LIMIT 1').get(company.id)) throw new Error('Yrityksellä on myyntimahdollisuuksia. Poista tai siirrä ne ennen yrityksen poistoa.');
    return db.prepare('DELETE FROM companies WHERE id=?').run(company.id).changes > 0;
  }

  function migrateLegacy(payload) {
    const migrationKey = trimmed(payload.migrationKey || 'telinehallinta-localStorage-v1', 100);
    const previous = db.prepare('SELECT * FROM crm_migrations WHERE migration_key=?').get(migrationKey);
    if (previous) return { alreadyImported: true, ...previous };
    const customers = Array.isArray(payload.customers) ? payload.customers.slice(0, 2000) : [];
    const resources = Array.isArray(payload.designResources) ? payload.designResources.slice(0, 2000) : [];
    let customersImported = 0, drawingsImported = 0;
    const transaction = db.transaction(() => {
      for (const old of customers) {
        const oldId = trimmed(old.id, 120) || crypto.randomUUID();
        const companyId = legacyId('legacy-company', oldId);
        const isDemo = /^customer-[1-3]$/.test(oldId) && /(?:Helsingin Julkisivut|Kalasataman Rakennuttajat|Pohjolan Korjausrakentaminen)/.test(String(old.company || ''));
        const company = companyRecord({ name: old.company, businessId: old.businessId, contact: old.contact, email: old.email }, { id: companyId, isDemo });
        const exists = db.prepare('SELECT id FROM opportunities WHERE source=? AND source_id=?').get('localStorage-v1', oldId);
        if (exists) continue;
        createOpportunity({ id: legacyId('legacy-opportunity', oldId), companyId: company.id, companyName: old.company, title: old.company,
          source: 'localStorage-v1', sourceId: oldId, stage: old.stage, legacyStage: LEGACY_STAGES[old.stage] ? old.stage : null,
          reviewRequired: ['Neuvottelu','Tarjous'].includes(old.stage), reviewNote: ['Neuvottelu','Tarjous'].includes(old.stage) ? `Tarkista vanhan vaiheen “${old.stage}” siirto.` : '',
          value: old.value, nextAction: old.nextStep, nextActionDue: old.nextActionDue, isDemo });
        customersImported += 1;
      }
      for (const old of resources) {
        if (!old?.url || !validHttpUrl(old.url)) continue;
        const isDrawing = /piirustus|3d-malli|cad/i.test(`${old.type || ''} ${old.title || ''}`);
        if (!isDrawing) continue;
        const ratu = nullable(old.buildingRatuId || old.ratu || old.RATU,80);
        addDrawing({ legacyId: `localStorage-resource:${trimmed(old.id,120) || crypto.randomUUID()}`, ratu,
          title: old.title || 'Vanha piirustusviite', kind: old.type, format: old.format, revision: old.revision, url: old.url, notes: old.notes,
          reviewRequired: !ratu });
        drawingsImported += 1;
      }
      db.prepare('INSERT INTO crm_migrations (migration_key,imported_at,customers_imported,drawings_imported) VALUES (?,?,?,?)')
        .run(migrationKey, now(), customersImported, drawingsImported);
    });
    transaction();
    return { alreadyImported: false, migrationKey, customersImported, drawingsImported };
  }

  function companyDirectoryRecord(row) {
    return { ...row, profile: JSON.parse(row.profile_json || '{}'),
      contacts: db.prepare('SELECT * FROM company_contacts WHERE company_id=? ORDER BY name COLLATE NOCASE').all(row.id),
      addresses: db.prepare('SELECT * FROM company_addresses WHERE company_id=? ORDER BY is_primary DESC, label COLLATE NOCASE').all(row.id) };
  }
  function listCompanies() { return db.prepare('SELECT * FROM companies ORDER BY name COLLATE NOCASE').all().map(companyDirectoryRecord); }
  function importManufacturerCatalog(items = []) {
    let imported = 0;
    for (const item of Array.isArray(items) ? items.slice(0, 100) : []) {
      const name = trimmed(item.name, 200);
      if (!name) continue;
      const profile = { category: 'manufacturer', categories: ['manufacturer'], profileStatus: ['needs-review','verified'].includes(item.status) ? item.status : 'catalog',
        manufacturerSystem: trimmed(item.system, 300), catalogComponentCount: Number.isFinite(Number(item.componentCount)) ? Number(item.componentCount) : null,
        logoUrl: trimmed(item.logoUrl, 500), sourceUrl: validHttpUrl(item.sourceUrl) ? item.sourceUrl : '', directorySource: trimmed(item.directorySource || 'Scaffold manufacturer catalog', 200),
        ...(item.note ? { futureNotes: trimmed(item.note, 1000) } : {}), ...(item.profile && typeof item.profile === 'object' ? item.profile : {}) };
      const existing = db.prepare('SELECT * FROM companies WHERE name=? COLLATE NOCASE ORDER BY is_demo ASC LIMIT 1').get(name);
      if (existing) {
        const current = JSON.parse(existing.profile_json || '{}');
        const merged = { ...profile, ...current };
        if (current.category == null) merged.category = 'manufacturer';
        db.prepare(`UPDATE companies SET profile_json=?,business_id=COALESCE(NULLIF(business_id,''),?),contact=CASE WHEN contact='' THEN ? ELSE contact END,
          email=CASE WHEN email='' THEN ? ELSE email END,address=CASE WHEN address='' THEN ? ELSE address END,updated_at=? WHERE id=?`)
          .run(JSON.stringify(merged), validBusinessId(item.businessId) ? String(item.businessId) : null, trimmed(item.contact,200), trimmed(item.email,254), trimmed(item.address,400), now(), existing.id);
        for (const contact of Array.isArray(item.contacts) ? item.contacts.slice(0,30) : []) {
          const contactName = trimmed(contact.name,200); const contactEmail = trimmed(contact.email,254);
          if (!contactName || db.prepare('SELECT 1 FROM company_contacts WHERE company_id=? AND name=? AND email=?').get(existing.id,contactName,contactEmail)) continue;
          addCompanyContact(existing.id, contact);
        }
        for (const address of Array.isArray(item.addresses) ? item.addresses.slice(0,30) : []) {
          const addressText = trimmed(address.address,400); const label = trimmed(address.label,120);
          if (!addressText || db.prepare('SELECT 1 FROM company_addresses WHERE company_id=? AND label=? AND address=?').get(existing.id,label,addressText)) continue;
          addCompanyAddress(existing.id,address);
        }
        continue;
      }
      const created = companyRecord({ name, profile, businessId: item.businessId, contact: item.contact, email: item.email, address: item.address });
      for (const contact of Array.isArray(item.contacts) ? item.contacts.slice(0,30) : []) addCompanyContact(created.id,contact);
      for (const address of Array.isArray(item.addresses) ? item.addresses.slice(0,30) : []) addCompanyAddress(created.id,address);
      imported += 1;
    }
    return { imported, total: items.length };
  }

  const PROFILE_CATEGORIES = new Set(['manufacturer','services','auxiliary','subcontractor','consulting','design','other']);
  function cleanProfile(input = {}, before = {}) {
    const profile = { ...before };
    const category = trimmed(input.category ?? profile.category, 40);
    if (category && !PROFILE_CATEGORIES.has(category)) throw new Error('Tuntematon yrityskategoria.');
    if (category) profile.category = category;
    if (Object.hasOwn(input, 'categories')) profile.categories = (Array.isArray(input.categories) ? input.categories : String(input.categories || '').split(/[,;]+/)).map((value) => trimmed(value, 50)).filter(Boolean).slice(0, 12);
    for (const key of ['foundedYear','latestAccountsYear','revenueYear','workforceYear']) {
      if (!Object.hasOwn(input, key)) continue;
      const value = input[key] === '' || input[key] == null ? null : Number(input[key]);
      if (value != null && (!Number.isInteger(value) || value < 1800 || value > new Date().getFullYear())) throw new Error(`${key}: vuosiluku ei kelpaa.`);
      profile[key] = value;
    }
    for (const key of ['revenueEur','workforce','marketSharePct','futurePoints','catalogComponentCount']) {
      if (!Object.hasOwn(input, key)) continue;
      const value = input[key] === '' || input[key] == null ? null : Number(input[key]);
      const maximum = key === 'marketSharePct' || key === 'futurePoints' ? 100 : 1_000_000_000_000;
      if (value != null && (!Number.isFinite(value) || value < 0 || value > maximum || (key === 'futurePoints' && !Number.isInteger(value)))) throw new Error(`${key}: lukuarvo ei kelpaa.`);
      profile[key] = value;
    }
    for (const key of ['geoLatitude','geoLongitude']) {
      if (!Object.hasOwn(input, key)) continue;
      const value = input[key] === '' || input[key] == null ? null : Number(input[key]);
      const min = key === 'geoLatitude' ? -90 : -180;
      const max = key === 'geoLatitude' ? 90 : 180;
      if (value != null && (!Number.isFinite(value) || value < min || value > max)) throw new Error(`${key}: koordinaatti ei kelpaa.`);
      profile[key] = value;
    }
    for (const key of ['website','profileSourceUrl','accountsSourceUrl','revenueSourceUrl','workforceSourceUrl','marketShareSourceUrl','futureSourceUrl','geoSourceUrl']) {
      if (!Object.hasOwn(input, key)) continue;
      const value = trimmed(input[key], 2000);
      if (value && !validHttpUrl(value)) throw new Error(`${key}: lähdeosoitteen pitää olla http- tai https-osoite.`);
      profile[key] = value || '';
    }
    for (const key of ['manufacturerSystem','futureNotes','profileStatus','geoConfidence']) if (Object.hasOwn(input, key)) profile[key] = trimmed(input[key], key === 'futureNotes' ? 1000 : 300);
    if (Object.hasOwn(input, 'lastVerifiedAt')) profile.lastVerifiedAt = trimmed(input.lastVerifiedAt, 40);
    return profile;
  }

  function addCompanyContact(companyId, input = {}) {
    const company = companyById.get(trimmed(companyId,80));
    if (!company) throw new Error('Yritystä ei löytynyt.');
    const name = trimmed(input.name,200);
    if (!name) throw new Error('Yhteyshenkilön nimi puuttuu.');
    const email = trimmed(input.email,254);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Sähköpostiosoite ei kelpaa.');
    const at = now(); const id = crypto.randomUUID();
    db.prepare('INSERT INTO company_contacts (id,company_id,name,role,email,phone,source_url,verified_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, company.id, name, trimmed(input.role,200), email, trimmed(input.phone,80), validHttpUrl(input.sourceUrl) ? input.sourceUrl : null, nullable(input.verifiedAt,40), at, at);
    return db.prepare('SELECT * FROM company_contacts WHERE id=?').get(id);
  }
  function removeCompanyContact(id) { return db.prepare('DELETE FROM company_contacts WHERE id=?').run(trimmed(id,80)).changes > 0; }
  function addCompanyAddress(companyId, input = {}) {
    const company = companyById.get(trimmed(companyId,80));
    if (!company) throw new Error('Yritystä ei löytynyt.');
    const address = trimmed(input.address,400);
    if (!address) throw new Error('Osoite puuttuu.');
    const at = now(); const id = crypto.randomUUID();
    db.prepare('INSERT INTO company_addresses (id,company_id,label,address,address_type,source_url,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, company.id, trimmed(input.label,120), address, trimmed(input.addressType || 'office',40), validHttpUrl(input.sourceUrl) ? input.sourceUrl : null, input.isPrimary ? 1 : 0, at, at);
    return db.prepare('SELECT * FROM company_addresses WHERE id=?').get(id);
  }
  function removeCompanyAddress(id) { return db.prepare('DELETE FROM company_addresses WHERE id=?').run(trimmed(id,80)).changes > 0; }
  function updateCompany(id, patch = {}) {
    const before = companyById.get(trimmed(id,80));
    if (!before) return null;
    const businessId = Object.hasOwn(patch, 'businessId')
      ? (validBusinessId(patch.businessId) ? String(patch.businessId).trim() : null)
      : before.business_id;
    if (Object.hasOwn(patch, 'businessId') && trimmed(patch.businessId,30) && !validBusinessId(patch.businessId)) throw new Error('Y-tunnuksen muoto on virheellinen. Käytä muotoa 1234567-8.');
    const contact = trimmed(patch.contact ?? before.contact,200);
    const email = trimmed(patch.email ?? before.email,254);
    const address = trimmed(patch.address ?? before.address,400);
    const priorProfile = JSON.parse(before.profile_json || '{}');
    const nextProfile = cleanProfile(patch.profile && typeof patch.profile === 'object' ? patch.profile : {}, priorProfile);
    const addressChanged = address !== before.address;
    const at = now();
    const transaction = db.transaction(() => {
      db.prepare(`UPDATE companies SET business_id=?,name=?,contact=?,email=?,address=?,profile_json=?,x=CASE WHEN ? THEN NULL ELSE x END,y=CASE WHEN ? THEN NULL ELSE y END,location_status=CASE WHEN ? THEN 'unverified' ELSE location_status END,updated_at=? WHERE id=?`)
        .run(businessId, trimmed(patch.name ?? before.name,200) || before.name, contact, email, address, JSON.stringify(nextProfile), addressChanged ? 1 : 0, addressChanged ? 1 : 0, addressChanged ? 1 : 0, at, before.id);
      if (contact !== before.contact || email !== before.email) {
        const changes = [];
        if (contact !== before.contact) changes.push('yhteyshenkilö');
        if (email !== before.email) changes.push('sähköposti');
        for (const row of db.prepare('SELECT id FROM opportunities WHERE company_id=?').all(before.id)) {
          db.prepare('INSERT INTO activities (id,opportunity_id,kind,summary,created_at) VALUES (?,?,?,?,?)')
            .run(crypto.randomUUID(), row.id, 'contact', `Yrityksen ${changes.join(' ja ')} päivitettiin.`, at);
        }
      }
    });
    transaction();
    return companyById.get(before.id);
  }
  function listBuildings() { return db.prepare('SELECT * FROM buildings ORDER BY updated_at DESC').all(); }
  function listMapFeatures() {
    const features = [];
    for (const company of db.prepare("SELECT * FROM companies WHERE x IS NOT NULL AND y IS NOT NULL AND location_status='confirmed'").all()) {
      features.push({ type: 'company', id: company.id, label: company.name, x: company.x, y: company.y, businessId: company.business_id, address: company.location_label || company.address });
    }
    for (const row of db.prepare(`SELECT b.*, (SELECT o.id FROM opportunities o WHERE o.building_ratu=b.ratu ORDER BY o.updated_at DESC LIMIT 1) AS opportunity_id,
      (SELECT o.title FROM opportunities o WHERE o.building_ratu=b.ratu ORDER BY o.updated_at DESC LIMIT 1) AS opportunity_title
      FROM buildings b WHERE b.x IS NOT NULL AND b.y IS NOT NULL`).all()) {
      features.push({ type: 'building', id: row.ratu, ratu: row.ratu, label: row.name || row.opportunity_title, opportunityId: row.opportunity_id, x: row.x, y: row.y });
    }
    return features;
  }
  function listSync() { return db.prepare(`SELECT s.*,o.title,o.stage,c.name AS company FROM sync_outbox s JOIN opportunities o ON o.id=s.opportunity_id JOIN companies c ON c.id=o.company_id ORDER BY s.updated_at DESC`).all().map((row) => ({ ...row, payload_json: undefined, payload: JSON.parse(row.payload_json) })); }
  function exportCsv() {
    const rows = [['Yritys','Y-tunnus','Mahdollisuus','Vaihe','Arvo EUR','Seuraava toimi','Määräpäivä','Lähde','Lähdelinkki','RATU','Ilmoitustyyppi','Tarjousmääräaika','Julkaistu','CPV','Hankinnan arvioitu arvo','Valuutta'],
      ...listOpportunities().map((item) => [item.company,item.businessId,item.title,item.stage,item.value,item.next_action,item.next_action_due,item.source,item.source_url,item.building_ratu,item.procurement_type,item.procurement_deadline,item.procurement_published_at,item.cpv_codes,item.procurement_estimated_value,item.procurement_currency])];
    const cell = (value) => {
      const text = String(value ?? '');
      const safe = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"','""')}"`;
    };
    return '\ufeff' + rows.map((row) => row.map(cell).join(';')).join('\r\n');
  }
  function exportFollowUpsIcs() {
    const escapeText = (value) => String(value || '')
      .replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const events = listOpportunities()
      .filter((item) => String(item.next_action || '').trim() && /^\d{4}-\d{2}-\d{2}$/.test(item.next_action_due || ''))
      .map((item) => {
        const title = `${item.company || 'Yritys'}: ${item.next_action}`;
        const description = `${item.title}\nMahdollisuus CRM:ssä: ${item.id}`;
        return ['BEGIN:VEVENT', `UID:${item.id}@telinehallinta.local`, `DTSTAMP:${stamp}`,
          `DTSTART;VALUE=DATE:${item.next_action_due.replace(/-/g, '')}`,
          `SUMMARY:${escapeText(title)}`, `DESCRIPTION:${escapeText(description)}`, 'END:VEVENT'].join('\r\n');
      });
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Telinekonttori//CRM Follow-ups//FI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...events, 'END:VCALENDAR', ''].join('\r\n');
  }

  return {
    db, close: () => db.close(), stages: STAGES, listOpportunities, getOpportunity, createOpportunity, updateOpportunity, createCompany,
    updateCompanyLocation, updateCompany, addActivity, listActivities, completeNextAction, upsertBuilding, listBuildings, addDrawing, listDrawings, listAllDrawings, removeDrawing, removeOpportunity,
    migrateLegacy, listCompanies, importManufacturerCatalog, addCompanyContact, removeCompanyContact, addCompanyAddress, removeCompanyAddress, removeCompany, listMapFeatures, listSync, exportCsv, exportFollowUpsIcs,
  };
}

module.exports = { DEFAULT_DB_PATH, STAGES, LEGACY_STAGES, openCrmStore, validBusinessId, validHttpUrl };
