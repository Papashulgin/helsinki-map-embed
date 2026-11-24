(() => {
  'use strict';

  const KEY = 'telinehallinta-map-data-v1';
  const LIMIT = 6;
  const COLORS = ['#177a88','#ab4937','#7658a4','#518345','#b67418','#3769aa'];
  const labels = { wms:'Viranomaiskartat', local:'Paikalliset aineistot', dataset:'Täydentävät aineistot', download:'Latauslähteet' };
  let selected = [];
  let opacity = .7;
  let mounted = null;
  let metadata = null;
  const definitions = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    selected = [...new Set(Array.isArray(saved.ids) ? saved.ids.filter((id) => typeof id === 'string' && /^(wms-[a-f0-9]{20}|local-[a-z0-9_]+)$/.test(id)) : [])].slice(0,LIMIT);
    if (Number.isFinite(saved.opacity)) opacity = Math.min(1,Math.max(.1,saved.opacity));
  } catch { /* Use the default selection if browser storage is unavailable. */ }

  const html = (value) => String(value ?? '').replace(/[&<>"']/g,(c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link = (value) => {
    try { const url = new URL(value,location.origin); return ['http:','https:'].includes(url.protocol) ? url.href : '#'; }
    catch { return '#'; }
  };
  const persist = () => { try { localStorage.setItem(KEY,JSON.stringify({ids:selected,opacity})); } catch { /* The current map remains usable. */ } };
  const number = (value) => Number(value || 0).toLocaleString('fi-FI');

  async function request(url, signal) {
    const response = await fetch(url,{signal,headers:{Accept:'application/json'}});
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Aineistohaku epäonnistui (${response.status}).`);
    }
    return response.json();
  }

  function markup({compact=false}={}) {
    return `<section class="panel map-data-panel ${compact?'map-data-compact':''}" id="mapDataCatalogue" aria-label="Suomen kartta-aineistot">
      <div class="panel-head"><div><h2>Suomen kartta-aineistot</h2><p data-map-data-summary>Ladataan aineistohakemistoa…</p></div>${compact?'<a class="button button-sm" href="?page=mapdata" data-page="mapdata">Kaikki aineistot</a>':''}</div>
      <div class="panel-body">
        <div class="map-data-downloads"><a class="button button-sm" href="/api/map-data/downloads/package">↓ QGIS-paketti · 16 Mt</a><a class="button button-sm" href="/api/map-data/downloads/geopackage">↓ GeoPackage</a><a class="button button-sm" href="/api/map-data/downloads/notes">Lähteet ja käyttöohje</a></div>
        <p class="muted small">WMS-tasot ovat karttakuvia. Paikalliset aluejaot ja Paavo sisältyvät GeoPackageen. Suuret koko maan aineistot avataan lähdepalveluista.</p>
        <div class="map-data-filters">
          <label>Hae aineistoa<input data-map-data-search type="search" placeholder="Rakennukset, kaava, pohjavesi…" maxlength="200"></label>
          <label>Tuottaja<select data-map-data-provider><option value="">Kaikki tuottajat</option></select></label>
          <label>Aineistotyyppi<select data-map-data-kind><option value="">Kaikki aineistotyypit</option>${Object.entries(labels).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label>
          <label class="map-data-map-only"><input data-map-data-only type="checkbox"> Vain tähän karttaan lisättävät</label>
        </div>
        <div class="map-data-selected"><div class="map-data-selected-head"><strong>Kartalle valitut <span data-map-data-selected-count>0</span> / ${LIMIT}</strong><button type="button" class="button button-sm" data-map-data-action="clear">Tyhjennä tasot</button></div><div data-map-data-active></div>
          <label class="map-data-opacity">Tasojen peittävyys <input data-map-data-opacity type="range" min="10" max="100" step="5" value="${Math.round(opacity*100)}"><output data-map-data-opacity-value>${Math.round(opacity*100)} %</output></label>
        </div>
        <p class="map-data-status" data-map-data-status role="status" aria-live="polite"></p>
        <p class="muted small" data-map-data-count></p>
        <div class="map-data-results" data-map-data-results></div>
        <div class="map-data-pagination"><button class="button button-sm" type="button" data-map-data-action="previous" disabled>Edelliset</button><span data-map-data-page></span><button class="button button-sm" type="button" data-map-data-action="next" disabled>Seuraavat</button></div>
        <p class="muted small">Koottu 30.10.2026. Mukana on vuosiversioita ja päällekkäisiä julkaisuja. Aineistojen kattavuus ja käyttöehdot vaihtelevat.</p>
      </div></section>`;
  }

  function alive(context) { return mounted === context && !context.destroyed && context.root.isConnected; }
  function status(context, text, error=false) {
    if (!alive(context)) return;
    const node = context.root.querySelector('[data-map-data-status]');
    node.textContent = text; node.classList.toggle('is-error',error);
  }

  function activeMarkup(context) {
    if (!alive(context)) return;
    context.root.querySelector('[data-map-data-selected-count]').textContent = selected.length;
    context.root.querySelector('[data-map-data-active]').innerHTML = selected.map((id,index) => {
      const item = definitions.get(id), entry = context.overlays.get(id);
      return `<div class="map-data-active-row"><span class="map-data-color" style="background:${COLORS[index%COLORS.length]}"></span><span><strong>${html(item?.title || 'Valittu taso')}</strong><small>${html(entry?.error || (context.map ? (entry?.loading ? 'Ladataan kartalle…' : 'Valittu kartalle') : 'Valittu työmaakartalle'))}</small></span>${entry?.error?`<button type="button" class="button button-sm" data-map-data-action="retry" data-map-data-id="${html(id)}">Yritä uudelleen</button>`:''}<button type="button" class="button button-sm" data-map-data-action="remove" data-map-data-id="${html(id)}" aria-label="Poista kartalta: ${html(item?.title || 'taso')}">×</button></div>`;
    }).join('') || '<p class="muted small">Lisää hakemistosta karttataso. Valinta säilyy tässä selaimessa.</p>';
  }

  function resultsMarkup(context) {
    if (!alive(context)) return;
    context.root.querySelector('[data-map-data-results]').innerHTML = context.items.map((item) => {
      const active = selected.includes(item.id);
      return `<article class="map-data-card"><div class="map-data-card-head"><strong>${html(item.title)}</strong><span class="tag ${item.legacy?'amber':item.kind==='local'?'green':'blue'}">${html(item.legacy?'Vanha julkaisu':labels[item.kind])}</span></div><p>${html(item.provider)}${item.sourceDate?' · '+html(item.sourceDate):''}</p>${item.description?`<p class="map-data-description">${html(item.description.slice(0,340))}</p>`:''}
        <details><summary>Lähde ja käyttöehdot</summary><p>${html(item.licence)}</p>${item.note?`<p>${html(item.note)}</p>`:''}<small>${html(item.layerName || item.category || '')}</small></details>
        <div class="map-data-card-actions">${item.mapAvailable?`<button type="button" class="button button-sm ${active?'':'button-primary'}" data-map-data-action="toggle" data-map-data-id="${html(item.id)}" aria-pressed="${active}">${active?'✓ Poista kartalta':'＋ Lisää kartalle'}</button>`:`<span class="muted small">${item.restricted?'Rajoitettu käyttölupa':item.kind==='wms'?'Käytä QGISissä tai lähdepalvelussa':item.kind==='local'?'Sisältyy GeoPackageen':'Avaa aineiston latauslähde'}</span>`}${item.downloadUrl?`<a class="button button-sm" href="${html(link(item.downloadUrl))}">↓ GeoPackage</a>`:''}<a class="button button-sm" href="${html(link(item.sourceUrl))}" target="_blank" rel="noopener noreferrer">Avaa lähde ↗</a></div></article>`;
    }).join('') || '<div class="empty-state"><strong>Ei osumia</strong>Kokeile lyhyempää hakusanaa tai vaihda tuottajaa.</div>';
    context.root.querySelector('[data-map-data-count]').textContent = `${number(context.total)} osumaa`;
    context.root.querySelector('[data-map-data-page]').textContent = `Sivu ${Math.floor(context.offset/context.limit)+1} / ${Math.max(1,Math.ceil(context.total/context.limit))}`;
    context.root.querySelector('[data-map-data-action="previous"]').disabled = context.offset === 0;
    context.root.querySelector('[data-map-data-action="next"]').disabled = context.offset + context.limit >= context.total;
  }

  async function search(context) {
    context.searchController?.abort();
    const controller = new AbortController(); context.searchController = controller;
    const params = new URLSearchParams({q:context.root.querySelector('[data-map-data-search]').value,
      provider:context.root.querySelector('[data-map-data-provider]').value,kind:context.root.querySelector('[data-map-data-kind]').value,
      mapOnly:context.root.querySelector('[data-map-data-only]').checked?'1':'0',offset:String(context.offset),limit:String(context.limit)});
    try {
      const data = await request('/api/map-data/catalog?'+params,controller.signal);
      if (!alive(context) || context.searchController !== controller) return;
      context.items = data.items; context.total = data.total;
      data.items.forEach((item)=>definitions.set(item.id,item));
      resultsMarkup(context);
    } catch (error) { if (error.name !== 'AbortError') status(context,error.message,true); }
  }

  async function applySelection(context) {
    if (!alive(context) || !context.map || !window.L) return;
    for (const [id,entry] of context.overlays) if (!selected.includes(id)) {
      entry.controller?.abort(); entry.layer?.remove(); context.overlays.delete(id);
    }
    for (const id of selected) {
      const item = definitions.get(id);
      if (!item || context.overlays.has(id)) continue;
      const entry = {loading:true,error:'',layer:null,controller:new AbortController()};
      context.overlays.set(id,entry);
      const attribution = `<a href="${html(link(item.sourceUrl))}" target="_blank" rel="noopener">${html(item.kind==='local'?item.licence:item.provider)}</a>`;
      try {
        if (item.kind === 'local' && item.geojsonUrl) {
          const timeout = setTimeout(()=>entry.controller.abort(),20000);
          let data;
          try { data = await request(item.geojsonUrl,entry.controller.signal); } finally { clearTimeout(timeout); }
          if (!alive(context) || !selected.includes(id) || context.overlays.get(id) !== entry) continue;
          if (data.type !== 'FeatureCollection') throw new Error('Paikallinen aineisto ei ole kelvollinen karttataso.');
          entry.layer = L.geoJSON(data,{attribution,style:{color:COLORS[selected.indexOf(id)%COLORS.length],weight:1.5,fillOpacity:opacity*.25,opacity},
            onEachFeature(feature,layer) {
              const properties = feature.properties || {};
              layer.bindPopup(`<strong>${html(properties.nimi || item.title)}</strong><br>${html(item.licence)}${properties.vuosi?'<br>Aluejako '+html(properties.vuosi):''}`);
            }}).addTo(context.map);
          entry.loading = false;
        } else if (item.kind === 'wms' && item.serviceUrl && item.webCrs) {
          const crs = item.webCrs === 'EPSG:900913' ? L.extend({},L.CRS.EPSG3857,{code:'EPSG:900913'}) : L.CRS.EPSG3857;
          entry.layer = L.tileLayer.wms(link(item.serviceUrl),{layers:item.layerName,styles:'',format:'image/png',transparent:true,
            version:'1.1.1',crs,opacity,attribution,maxZoom:21,keepBuffer:1,updateWhenIdle:true});
          entry.layer.on('loading',()=>{if (!alive(context))return;entry.loading=true;entry.error='';activeMarkup(context);});
          entry.layer.on('tileerror',()=>{if (!alive(context))return;entry.loading=false;entry.error='Karttapalvelu ei toimittanut karttakuvaa.';activeMarkup(context);});
          entry.layer.on('load',()=>{if (!alive(context))return;entry.loading=false;activeMarkup(context);});
          entry.layer.addTo(context.map);
        }
      } catch (error) {
        if (!alive(context) || !selected.includes(id) || context.overlays.get(id) !== entry) continue;
        entry.loading = false; entry.error = error.name === 'AbortError' ? 'Aineiston lataus aikakatkaistiin.' : error.message;
      }
    }
    if (alive(context)) {
      selected.forEach((id,index)=>context.overlays.get(id)?.layer?.setZIndex?.(300+index));
      activeMarkup(context);
    }
  }

  function updateSelection(context) {
    persist(); activeMarkup(context); resultsMarkup(context);
    void applySelection(context);
  }

  async function click(context,event) {
    const button = event.target.closest('[data-map-data-action]');
    if (!button || !context.root.contains(button)) return;
    const action = button.dataset.mapDataAction, id = button.dataset.mapDataId;
    if (action === 'previous' || action === 'next') {
      context.offset = Math.max(0,context.offset+(action==='next'?context.limit:-context.limit));
      void search(context); return;
    }
    if (action === 'clear') selected = [];
    else if (action === 'remove') selected = selected.filter((value)=>value!==id);
    else if (action === 'retry') {
      const entry = context.overlays.get(id); entry?.controller.abort(); entry?.layer?.remove(); context.overlays.delete(id);
    } else if (action === 'toggle') {
      if (selected.includes(id)) selected = selected.filter((value)=>value!==id);
      else {
        const item = definitions.get(id);
        if (!item?.mapAvailable) return;
        if (selected.length >= LIMIT) { status(context,`Kartalla voi olla enintään ${LIMIT} aineistotasoa. Poista ensin jokin valituista.`,true); return; }
        selected.push(id); persist();
        context.onMapRequest?.();
        if (!alive(context)) return;
        status(context,item.legacy?'Vanha julkaisu lisättiin. Tarkista ajantasaisuus lähdepalvelusta.':'Aineisto lisättiin kartan valintaan.');
      }
    } else return;
    updateSelection(context);
  }

  function detach() {
    if (!mounted) return;
    const context = mounted; context.destroyed = true; mounted = null;
    clearTimeout(context.debounce); context.searchController?.abort(); context.controller.abort();
    context.root.removeEventListener('click',context.click);
    context.root.removeEventListener('input',context.input);
    context.root.removeEventListener('change',context.change);
    for (const entry of context.overlays.values()) { entry.controller.abort(); entry.layer?.off?.(); entry.layer?.remove(); }
    context.overlays.clear();
  }

  async function mount(root,{map=null,onMapRequest=null,compact=false}={}) {
    detach();
    if (!root) return;
    const context = {root,map,onMapRequest,items:[],total:0,offset:0,limit:compact?6:20,overlays:new Map(),controller:new AbortController(),destroyed:false};
    mounted = context;
    context.click = (event)=>void click(context,event);
    context.input = (event)=>{
      if (event.target.matches('[data-map-data-search]')) {
        clearTimeout(context.debounce); context.offset=0; context.debounce=setTimeout(()=>void search(context),180);
      }
      if (event.target.matches('[data-map-data-opacity]')) {
        opacity=Number(event.target.value)/100; persist();
        root.querySelector('[data-map-data-opacity-value]').textContent=`${event.target.value} %`;
        for (const entry of context.overlays.values()) {
          entry.layer?.setOpacity?.(opacity); entry.layer?.setStyle?.({opacity,fillOpacity:opacity*.25});
        }
      }
    };
    context.change = (event)=>{if (event.target.matches('[data-map-data-provider],[data-map-data-kind],[data-map-data-only]')) {context.offset=0;void search(context);}};
    root.addEventListener('click',context.click); root.addEventListener('input',context.input); root.addEventListener('change',context.change);
    activeMarkup(context);
    try {
      metadata ||= await request('/api/map-data/metadata',context.controller.signal);
      if (!alive(context)) return;
      root.querySelector('[data-map-data-summary]').textContent=`${number(metadata.summary.wms_layer_references)} karttatasoviittausta · ${metadata.summary.offline_spatial_layers} paikallista aineistoa`;
      root.querySelector('[data-map-data-provider]').innerHTML='<option value="">Kaikki tuottajat</option>'+metadata.providers.map((provider)=>`<option>${html(provider)}</option>`).join('');
      await search(context);
      if (selected.length) {
        const restoredIds = selected.slice();
        const result = await request('/api/map-data/selection?'+new URLSearchParams({ids:restoredIds.join(',')}),context.controller.signal);
        if (!alive(context)) return;
        result.items.forEach((item)=>definitions.set(item.id,item));
        selected = selected.filter((id)=>!restoredIds.includes(id) || result.items.some((item)=>item.id===id)); persist();
        await applySelection(context); activeMarkup(context); resultsMarkup(context);
      }
    } catch (error) { if (error.name !== 'AbortError') status(context,error.message,true); }
  }

  window.TelineMapData = {markup,mount,detach};
})();
