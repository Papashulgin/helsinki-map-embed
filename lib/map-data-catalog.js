'use strict';

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const DATA_DIRECTORY = path.join(__dirname, '..', 'public-static', 'data', 'finland-map-data');
const MAX_SELECTION = 6;

function createCatalog(snapshot) {
  const items = snapshot.items.filter((item) => item && typeof item.id === 'string');
  const byId = new Map(items.map((item) => [item.id, item]));
  const ranked = items.slice().sort((a, b) => Number(b.featured) - Number(a.featured)
    || Number(a.kind !== 'local') - Number(b.kind !== 'local') || a.title.localeCompare(b.title, 'fi'));
  const searches = new Map(items.map((item) => [item.id, [item.title,item.layerName,item.provider,item.description,item.note,item.category].join(' ').toLocaleLowerCase('fi')]));
  return {
    metadata() {
      return { snapshotDate: snapshot.snapshotDate, summary: snapshot.summary, notice: snapshot.notice,
        maxSelection: MAX_SELECTION, downloads: snapshot.downloads,
        providers: [...new Set(items.map((item) => item.provider))].sort((a,b) => a.localeCompare(b,'fi')),
        kinds: ['wms','local','dataset','download'] };
    },
    query({ q='', provider='', kind='', mapOnly=false, offset=0, limit=20 } = {}) {
      const words = String(q).slice(0,200).trim().toLocaleLowerCase('fi').split(/\s+/).filter(Boolean);
      const filtered = ranked.filter((item) => (!provider || item.provider === provider) && (!kind || item.kind === kind)
        && (!mapOnly || item.mapAvailable) && words.every((word) => searches.get(item.id).includes(word)));
      return { items: filtered.slice(offset, offset + limit), total: filtered.length, offset, limit };
    },
    selection(ids) { return ids.map((id) => byId.get(id)).filter((item) => item?.mapAvailable).slice(0,MAX_SELECTION); },
  };
}

function createMapDataRouter({ snapshot, directory=DATA_DIRECTORY } = {}) {
  const router = express.Router();
  let catalog;
  const getCatalog = () => {
    if (!catalog) {
      snapshot ||= JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
      catalog = createCatalog(snapshot);
    }
    return catalog;
  };
  router.get('/metadata', (_req,res,next) => {
    try { res.json(getCatalog().metadata()); } catch (error) { next(error); }
  });
  router.get('/catalog', (req,res,next) => {
    const offset = Number(req.query.offset || 0), limit = Number(req.query.limit || 20);
    if (!Number.isInteger(offset) || offset < 0 || offset > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ error: 'Hakusivun koon pitää olla 1–50 ja aloituskohdan kelvollinen kokonaisluku.' });
    }
    if (['q','provider','kind'].some((key) => req.query[key] !== undefined && typeof req.query[key] !== 'string')) {
      return res.status(400).json({ error: 'Anna yksi hakusana, tuottaja ja aineistotyyppi.' });
    }
    if (req.query.kind && !['wms','local','dataset','download'].includes(req.query.kind)) {
      return res.status(400).json({ error: 'Tuntematon aineistotyyppi.' });
    }
    try { return res.json(getCatalog().query({ ...req.query, mapOnly:req.query.mapOnly === '1', offset, limit })); }
    catch (error) { return next(error); }
  });
  router.get('/selection', (req,res,next) => {
    if (typeof req.query.ids !== 'string' || req.query.ids.length > 600) return res.status(400).json({ error:'Anna valittujen karttatasojen tunnisteet.' });
    const ids = [...new Set(req.query.ids.split(',').filter(Boolean))];
    if (ids.length > MAX_SELECTION || ids.some((id) => !/^(wms-[a-f0-9]{20}|local-[a-z0-9_]+)$/.test(id))) {
      return res.status(400).json({ error:`Kartalle voi valita enintään ${MAX_SELECTION} hakemiston tasoa.` });
    }
    try { return res.json({ items:getCatalog().selection(ids) }); } catch (error) { return next(error); }
  });
  router.get('/downloads/:id', (req,res,next) => {
    try {
      const entry = getCatalog().metadata().downloads.find((item) => item.id === req.params.id);
      if (!entry) return res.status(404).json({ error:'Lataustiedostoa ei löytynyt.' });
      // File paths come exclusively from the imported snapshot, never from the request.
      if (path.basename(entry.filename) !== entry.filename) throw new Error('Invalid map-data filename');
      return res.download(path.join(directory,entry.filename), entry.filename);
    } catch (error) { return next(error); }
  });
  router.use((error,_req,res,_next) => {
    console.error('Map-data catalogue:', error.message);
    res.status(503).json({ error:'Suomen kartta-aineistohakemistoa ei saatu luettua.' });
  });
  return router;
}

module.exports = { createCatalog, createMapDataRouter, MAX_SELECTION };
