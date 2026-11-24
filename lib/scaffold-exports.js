'use strict';

function xml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function csv(rows) {
  return '\ufeff' + rows.map((row) => row.map((cell) => '"' + String(cell ?? '').replaceAll('"', '""') + '"').join(';')).join('\r\n');
}

function buildScaffoldSvg(project) {
  const d = project.model.dimensions;
  const workPurpose = String(project.geometry.workPurpose || '').replace(/\s+/g, ' ').trim().slice(0, 140) || 'Ei kirjattu';
  const denominator = Number(project.geometry.scale) || 100;
  // SVG user units are millimetres: 1 m of the structure is exactly 1000 / denominator units.
  const scale = 1000 / denominator;
  const left = 20;
  const top = 48;
  const right = left + d.modeledLengthM * scale;
  const full = left + d.targetLengthM * scale;
  const roof = top;
  const bottom = roof + d.modeledHeightM * scale;
  const dimY = bottom + 10;
  const planTitleY = dimY + 18;
  const planY = planTitleY + 8;
  const planDepth = Math.max(0, project.geometry.buildingDepthM * scale);
  const roofDims = project.model.kederRoof?.valid ? project.model.kederRoof.dimensions : null;
  const legendX = Math.max(60, full, right) + 20;
  const width = legendX + 116;
  const height = planY + planDepth + 30 + (roofDims ? 12 : 0);
  const parts = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + 'mm" height="' + height + 'mm" viewBox="0 0 ' + width + ' ' + height + '">',
    '<rect width="100%" height="100%" fill="#fff"/>',
    '<style>text{font-family:Arial,sans-serif;fill:#253747}.title{font-size:6px;font-weight:700}.sub{font-size:4px}.small{font-size:3px}.line{stroke:#156f59;stroke-width:.8;fill:none}.ledger{stroke:#3976aa;stroke-width:.55}.dim{stroke:#687b82;stroke-width:.25;fill:none}.deck{stroke:#d59a28;stroke-width:2}.warning{fill:#9b4141}</style>',
  ];
  parts.push(
    '<text class="title" x="20" y="12">' + xml(project.name) + ' · rev ' + project.revision + '</text>',
    '<text class="sub" x="20" y="21">' + xml(project.model.system.name) + ' · julkisivu · luonnos, tarkistustila: ' + xml(project.workflow?.state || 'draft') + '</text>',
    '<text class="small" x="20" y="29">Työn tarkoitus: ' + xml(workPurpose) + '</text>',
    '<text class="small" x="20" y="36">Tavoite ' + d.targetLengthM.toFixed(2) + ' × ' + d.targetHeightM.toFixed(2) + ' m · mallinnettu ' + d.modeledLengthM.toFixed(2) + ' × ' + d.modeledHeightM.toFixed(2) + ' m · 1:' + denominator + ' (SVG:n fyysinen koko säilyttää mittakaavan)</text>',
    '<text class="sub" x="' + left + '" y="42">JULKISIVU</text>',
    '<rect x="' + left + '" y="' + roof + '" width="' + Math.max(0, right - left) + '" height="' + Math.max(0, bottom - roof) + '" fill="#eef2f4" stroke="#aab5bc" stroke-width=".3"/>',
  );
  if (d.bays > 0) {
    for (let i = 0; i <= d.bays; i += 1) {
      const x = left + (d.bayStartsM?.[i] ?? i * d.bayLengthM) * scale;
      parts.push('<path class="line" d="M' + x + ' ' + bottom + ' V' + roof + '"/>');
    }
    for (let level = 0; level <= d.lifts; level += 1) {
      const y = bottom - level * d.liftHeightM * scale;
      parts.push('<path class="ledger" d="M' + left + ' ' + y + ' H' + right + '"/>');
      if (level < d.lifts) for (const bay of d.braceBayIndexes || []) {
        const x1 = left + (d.bayStartsM?.[bay] ?? bay * d.bayLengthM) * scale;
        const x2 = x1 + (d.bayLengthsM?.[bay] ?? d.bayLengthM) * scale;
        const y2 = bottom - (level + 1) * d.liftHeightM * scale;
        parts.push('<path d="M' + x1 + ' ' + y + ' L' + x2 + ' ' + y2 + '" stroke="#c7782d" stroke-width=".6"/>');
      }
      if (level > 0 && d.platformLevels.includes(level)) parts.push('<path class="deck" d="M' + left + ' ' + (y - 1) + ' H' + right + '"/>');
    }
  }
  parts.push('<text class="sub" x="' + legendX + '" y="36">PIIRUSTUKSEN SELITE</text>');
  const legendRows = [
    { label: 'PLAN · suuntaa-antava pohja' },
    { label: 'ELEV. · julkisivu' },
    { label: 'Rakennuksen massa', color: '#aab5bc', fill: '#eef2f4', box: true },
    { label: 'Telineen pystylinjat', color: '#156f59' },
    { label: 'Vaakajuoksut', color: '#3976aa' },
    { label: 'Diagonaalit', color: '#c7782d' },
    { label: 'Työtasojen taso', color: '#d59a28', width: 2 },
    { label: 'Mittojen apuviivat', color: '#687b82', width: .25 },
  ];
  legendRows.forEach((row, index) => {
    const y = 45 + index * 7;
    if (row.box) parts.push('<rect x="' + legendX + '" y="' + (y - 2.7) + '" width="6" height="3.2" fill="' + row.fill + '" stroke="' + row.color + '" stroke-width=".3"/>');
    else if (row.color) parts.push('<path d="M' + legendX + ' ' + (y - 1) + ' H' + (legendX + 7) + '" stroke="' + row.color + '" stroke-width="' + (row.width || .7) + '"/>');
    parts.push('<text class="small" x="' + (legendX + 10) + '" y="' + y + '">' + xml(row.label) + '</text>');
  });
  parts.push('<text class="small" x="' + legendX + '" y="108">Värit selittävät tämän viennin merkkejä.</text>');
  parts.push('<text class="small" x="' + legendX + '" y="114">Projektin ja valmistajan tunnukset: tarkista lähdeselitteestä.</text>');
  parts.push('<text class="small" x="' + legendX + '" y="120">Tässä viennissä ei ole leikkaus- tai detaljinäkymää.</text>');
  parts.push(
    '<path class="dim" d="M' + left + ' ' + dimY + ' H' + right + ' M' + left + ' ' + (dimY - 2) + ' V' + (dimY + 2) + ' M' + right + ' ' + (dimY - 2) + ' V' + (dimY + 2) + '"/>',
    '<text class="small" x="' + ((left + right) / 2) + '" y="' + (dimY + 5) + '" text-anchor="middle">' + d.bays + ' kenttää · ' + d.modeledLengthM.toFixed(2) + ' m · ' + (d.bayLengthsM || []).map((length) => length.toFixed(2)).join(' + ') + ' m</text>',
    '<text class="small" x="' + (left - 4) + '" y="' + ((bottom + roof) / 2) + '" transform="rotate(-90 ' + (left - 4) + ' ' + ((bottom + roof) / 2) + ')" text-anchor="middle">' + d.lifts + ' × ' + d.liftHeightM.toFixed(2) + ' m = ' + d.modeledHeightM.toFixed(2) + ' m</text>',
  );
  if (d.uncoveredLengthM > 0.001) {
    parts.push('<path d="M' + right + ' ' + bottom + ' H' + full + '" stroke="#c75050" stroke-width=".8" stroke-dasharray="2 1.3"/>');
    parts.push('<text class="small warning" x="' + (right + 2) + '" y="' + (bottom + 4) + '">' + d.uncoveredLengthM.toFixed(2) + ' m tavoitepituudesta avoinna</text>');
  }
 else if (d.overrunLengthM > 0.001) {
    parts.push('<path d="M' + full + ' ' + bottom + ' H' + right + '" stroke="#c75050" stroke-width=".8" stroke-dasharray="2 1.3"/>');
    parts.push('<text class="small warning" x="' + (full + 2) + '" y="' + (bottom + 4) + '">' + d.overrunLengthM.toFixed(2) + ' m tavoitepituuden ylitys</text>');
  }
  parts.push(
    '<text class="sub" x="' + left + '" y="' + planTitleY + '">POHJAN SUUNTAA ANTAVA SYVYYS</text>',
    '<rect x="' + left + '" y="' + planY + '" width="' + Math.max(0, right - left) + '" height="' + planDepth + '" fill="#e7ecef" stroke="#8a9aa5" stroke-width=".3"/>',
    '<path d="M' + left + ' ' + (planY - 3) + ' H' + right + ' M' + left + ' ' + (planY - 4.5) + ' V' + (planY - 1.5) + ' M' + right + ' ' + (planY - 4.5) + ' V' + (planY - 1.5) + '" class="dim"/>',
    '<text class="small" x="' + ((left + right) / 2) + '" y="' + (planY - 5) + '" text-anchor="middle">Syvyys ' + project.geometry.buildingDepthM.toFixed(2) + ' m · käyttäjän/arvion lähde tarkistettava</text>',
    roofDims ? '<text class="small" x="20" y="' + (height - 28) + '">Keder Roof XL 18° · B=' + roofDims.roofWidthM.toFixed(2) + ' m × L=' + roofDims.roofLengthM.toFixed(2) + ' m · kattotuolivälit ' + roofDims.roofBayLengthsM.map((length) => length.toFixed(2)).join(' + ') + ' m</text>' : '',
    '<text class="small" x="20" y="' + (height - 16) + '">Lähde: ' + xml(project.building.source) + ' · CRS ' + xml(project.building.projectCrs) + ' · korkeus ' + xml(project.building.height.status) + ' · revisio ' + xml(project.updatedAt) + '</text>',
    '<text class="small warning" x="20" y="' + (height - 10) + '">Geometrinen luonnos ja lähteistetty BOM eivät ole rakenteellinen mitoitus tai käyttöönottohyväksyntä.</text>',
    '</svg>',
  );
  return parts.join('');
}

function buildScaffoldBomCsv(project) {
  const rows = [
    ['Telinekonttori BOM', ''],
    ['Projekti', project.name],
    ['Projektitunnus', project.id],
    ['Revisio', project.revision],
    ['Työn tarkoitus', project.geometry.workPurpose || 'Ei kirjattu'],
    ['Tarkistustila', project.workflow?.state || 'draft'],
    ['Valmistaja', project.model.system.manufacturer],
    ['Järjestelmä', project.model.system.name],
    ['Järjestelmäohje', project.model.system.manualRevision],
    ['Järjestelmäohjeen lähde', project.model.system.manualUrl],
    ['Rakennuslähde', project.building.source],
    ['Lähdekoordinaatisto', project.building.sourceCrs],
    ['Projektikoordinaatisto', project.building.projectCrs],
    ['Haettu / tarkistettu', project.building.retrievedAt || 'Ei ilmoitettu'],
    [],
    ['Mallin tuotenumero', 'Valittu katalogituotenumero', 'Katalogikomponentti', 'Katalogi / revisio', 'Katalogilähde', 'Katalogiliitoksen tila', 'Mallikomponentti', 'Määrä', 'Yksikkö', 'Tietotila', 'Resepti', 'Lähde', 'Lähdesivu', 'Mallin revisio', 'Osto €/kpl', 'Vuokra €/kpl/pv', 'Vuokrapäiviä', 'Osto yhteensä €', 'Vuokra yhteensä €'],
  ];
  for (const line of project.model.bom) {
    const price = project.pricing.components?.[line.id] || {};
    const match = line.catalogLink || project.pricing.catalogLinks?.[line.id] || {};
    rows.push([line.itemNo, match.itemNo || '', match.name || '', [match.system, match.revision].filter(Boolean).join(' · '), match.source || '', match.status || (match.itemNo ? 'user-selected-needs-compatibility-review' : ''), line.name, line.quantity, line.unit, line.quantityStatus, line.recipe, line.source, line.sourcePage, line.catalogRevision, price.purchasePerUnit || 0, price.rentalPerUnitDay || 0, price.rentalDays || 0, line.quantity * (price.purchasePerUnit || 0), line.quantity * (price.rentalPerUnitDay || 0) * (price.rentalDays || 0)]);
  }
  rows.push(
    [],
    ['Avoimet mitoitus- ja yhteensopivuuskohdat', ''],
    ...project.model.unresolved.map((row) => [row.label, row.reason]),
    [],
    ['Osto, €', project.costSummary.purchase],
    ['Vuokra, €', project.costSummary.rental],
    ['Työ, €', project.costSummary.labor],
    ['Kuljetus, €', project.costSummary.transport],
    ['Muut, €', project.costSummary.other],
    ['Yhteensä, €', project.costSummary.total],
    ['Työ-/kuljetushinnat', 'Käyttäjän ilmoittamat; tarkista ennen tilausta.'],
  );
  return csv(rows);
}

function buildScaffoldQuoteCsv(project) {
  const unpricedCount = (project.model.bom || []).filter((line) => {
    const price = project.pricing.components?.[line.id] || {};
    return !(Number(price.purchasePerUnit) > 0 || Number(price.rentalPerUnitDay) > 0);
  }).length;
  const missingPriceSourceCount = (project.model.bom || []).filter((line) => {
    const price = project.pricing.components?.[line.id] || {};
    return (Number(price.purchasePerUnit) > 0 || Number(price.rentalPerUnitDay) > 0) && !String(price.priceSource || '').trim();
  }).length;
  const quoteTerms = project.pricing.quoteTerms || {};
  const missingTerms = [project.costSummary.marginPercent == null, project.costSummary.vatPercent == null, !quoteTerms.validUntil, !quoteTerms.priceEnteredBy].filter(Boolean).length;
  const rows = [
    ['Telinekonttori · tarjousluonnos', ''],
    ['Tila', 'Luonnos · tarkista hinnat, määrät ja avoimet suunnittelutiedot ennen lähetystä'],
    ['Hinnoittelun tila', unpricedCount || missingPriceSourceCount || missingTerms ? `KESKEN · ${unpricedCount} BOM-riviltä puuttuu hinta, ${missingPriceSourceCount} hinnan lähde ja ${missingTerms} tarjousparametria` : 'Hinnoitellut BOM-rivit ja tarjousparametrit on annettu · tarkista vielä ennen lähetystä'],
    ['Projekti', project.name],
    ['Projektitunnus', project.id],
    ['Revisio', project.revision],
    ['Asiakas', project.customerName || 'Ei valittu'],
    ['Kohde', project.building.name || project.building.address || 'Käyttäjän antama kohde'],
    ['Rakennuslähde', project.building.source],
    ['Rakennuskorkeuden tila', project.building.height.status],
    ['Tarjous / hinnoittelun valuutta', project.costSummary.currency || 'EUR'],
    ['Kate myyntihinnasta, %', project.costSummary.marginPercent == null ? 'Määrittämättä' : project.costSummary.marginPercent],
    ['ALV, %', project.costSummary.vatPercent == null ? 'Määrittämättä' : project.costSummary.vatPercent],
    ['Hinnat voimassa asti', project.pricing.quoteTerms?.validUntil || 'Ei ilmoitettu'],
    ['Hinnan syöttäjä', project.pricing.quoteTerms?.priceEnteredBy || 'Ei ilmoitettu'],
    [],
    ['Rivi', 'Mallin tuotenumero', 'Katalogituotenumero', 'Katalogituote', 'Katalogirevisio', 'Katalogiliitoksen tila', 'Kuvaus', 'Määrä', 'Yksikkö', 'Yksikköhinta', 'Päivät', 'Yhteensä', 'Hinnan lähde', 'Hinta tarkistettu'],
  ];
  for (const line of project.model.bom) {
    const price = project.pricing.components?.[line.id] || {};
    const match = line.catalogLink || project.pricing.catalogLinks?.[line.id] || {};
    const quantity = Number(line.quantity) || 0;
    const purchasePerUnit = Number(price.purchasePerUnit) || 0;
    const rentalPerUnitDay = Number(price.rentalPerUnitDay) || 0;
    const rentalDays = Number(price.rentalDays) || 0;
    if (purchasePerUnit) rows.push(['Osto', line.itemNo, match.itemNo || '', match.name || '', match.revision || '', match.status || '', line.name, quantity, line.unit, purchasePerUnit, '', quantity * purchasePerUnit, price.priceSource || 'Käyttäjän hintasyöte', price.priceCheckedAt || '']);
    if (rentalPerUnitDay) rows.push(['Vuokra', line.itemNo, match.itemNo || '', match.name || '', match.revision || '', match.status || '', line.name, quantity, line.unit, rentalPerUnitDay, rentalDays, quantity * rentalPerUnitDay * rentalDays, price.priceSource || 'Käyttäjän hintasyöte', price.priceCheckedAt || '']);
  }
  for (const row of project.pricing.labor || []) {
    const hours = Number(row.hours) || 0, rate = Number(row.ratePerHour) || 0;
    if (hours || rate) rows.push(['Työ', '', row.description || 'Työ', hours, 'h', rate, '', hours * rate, [row.rateSource || 'Työhinnan lähde puuttuu', 'tunnit: ' + (row.source || 'Ei ilmoitettu')].join(' · ')]);
  }
  for (const row of project.pricing.transport || []) {
    const quantity = Number(row.quantity) || 0, rate = Number(row.amountPerUnit) || 0;
    if (quantity || rate) rows.push(['Kuljetus', '', row.description || 'Kuljetus', quantity, 'kpl', rate, '', quantity * rate, [row.rateSource || 'Kuljetushinnan lähde puuttuu', row.source || 'Kuljetusmäärän lähde puuttuu'].join(' · ')]);
  }
  const pricing = project.pricing;
  if (Number(pricing.otherCosts)) rows.push(['Muut kulut', '', pricing.otherCostsSource || 'Muut kulut', 1, 'erä', Number(pricing.otherCosts), '', Number(pricing.otherCosts), pricing.otherCostsSource || 'Käyttäjän ilmoittama']);
  rows.push(
    [],
    ['Osto yhteensä', project.costSummary.purchase],
    ['Vuokra yhteensä', project.costSummary.rental],
    ['Työ yhteensä', project.costSummary.labor],
    ['Kuljetus yhteensä', project.costSummary.transport],
    ['Muut kulut yhteensä', project.costSummary.other],
    ['Kustannuspohja ilman katetta ja ALV:tä', project.costSummary.costTotal ?? project.costSummary.total],
    ['Kate, €', project.costSummary.margin == null ? 'Määrittämättä' : project.costSummary.margin],
    ['Myyntihinta ilman ALV:tä', project.costSummary.netTotal ?? project.costSummary.total],
    ['ALV, €', project.costSummary.vat == null ? 'Määrittämättä' : project.costSummary.vat],
    ['Tarjousluonnoksen summa sis. ALV', project.costSummary.grossTotal == null ? 'Määrittämättä' : project.costSummary.grossTotal],
    [],
    ['Avoin tarkistettava kohta', 'Huomio'],
    ...project.model.unresolved.map((row) => [row.label, row.reason]),
    [],
    ['Rajaus', 'Tämä tiedosto on hinnoitteluluonnos. Se ei ole lähetetty tarjous eikä rakenteellisen mitoituksen hyväksyntä.'],
  );
  return csv(rows);
}

function buildScaffoldQuoteHtml(project) {
  const summary = project.costSummary || {};
  const pricing = project.pricing || {};
  const terms = pricing.quoteTerms || {};
  const money = (value) => value == null ? 'Määrittämättä' : Number(value).toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const rows = [];
  for (const line of project.model.bom || []) {
    const price = pricing.components?.[line.id] || {};
    const match = line.catalogLink || pricing.catalogLinks?.[line.id] || {};
    const base = [line.itemNo, match.itemNo || '', match.name || '', line.name, `${Number(line.quantity) || 0} ${line.unit}`];
    const add = (kind, unitPrice, days, amount) => rows.push(`<tr><td>${xml(kind)}</td>${base.map((cell) => `<td>${xml(cell)}</td>`).join('')}<td>${unitPrice == null ? 'Avoin' : money(unitPrice)}</td><td>${days ?? '—'}</td><td>${money(amount)}</td><td>${xml(price.priceSource || 'Lähde puuttuu')}</td><td>${xml(price.priceCheckedAt || 'Ei tarkistuspäivää')}</td></tr>`);
    if (Number(price.purchasePerUnit) > 0) add('Osto', Number(price.purchasePerUnit), '—', line.quantity * Number(price.purchasePerUnit));
    if (Number(price.rentalPerUnitDay) > 0) add('Vuokra', Number(price.rentalPerUnitDay), Number(price.rentalDays) || 0, line.quantity * Number(price.rentalPerUnitDay) * (Number(price.rentalDays) || 0));
    if (!(Number(price.purchasePerUnit) > 0 || Number(price.rentalPerUnitDay) > 0)) add('Avoin hinta', null, '—', null);
  }
  for (const row of pricing.labor || []) if (Number(row.hours) || Number(row.ratePerHour)) rows.push(`<tr><td>Työ</td><td>—</td><td>—</td><td>—</td><td>${xml(row.description || 'Työ')}</td><td>${Number(row.hours) || 0} h</td><td>${money(row.ratePerHour)}</td><td>—</td><td>${money((Number(row.hours) || 0) * (Number(row.ratePerHour) || 0))}</td><td>${xml([row.rateSource || 'Työhinnan lähde puuttuu', 'tunnit: ' + (row.source || 'Ei ilmoitettu')].join(' · '))}</td><td>Ei ilmoitettu</td></tr>`);
  for (const row of pricing.transport || []) if (Number(row.quantity) || Number(row.amountPerUnit)) rows.push(`<tr><td>Kuljetus</td><td>—</td><td>—</td><td>—</td><td>${xml(row.description || 'Kuljetus')}</td><td>${Number(row.quantity) || 0} kpl</td><td>${money(row.amountPerUnit)}</td><td>—</td><td>${money((Number(row.quantity) || 0) * (Number(row.amountPerUnit) || 0))}</td><td>${xml([row.rateSource || 'Kuljetushinnan lähde puuttuu', row.source || 'Kuljetusmäärän lähde puuttuu'].join(' · '))}</td><td>Ei ilmoitettu</td></tr>`);
  if (Number(pricing.otherCosts)) rows.push(`<tr><td>Muut kulut</td><td>—</td><td>—</td><td>—</td><td>${xml(pricing.otherCostsSource || 'Muut kulut')}</td><td>1 erä</td><td>${money(pricing.otherCosts)}</td><td>—</td><td>${money(pricing.otherCosts)}</td><td>${xml(pricing.otherCostsSource || 'Lähde puuttuu')}</td><td>Ei ilmoitettu</td></tr>`);
  const totals = [
    ['Osto', summary.purchase], ['Vuokra', summary.rental], ['Työ', summary.labor], ['Kuljetus', summary.transport], ['Muut kustannukset', summary.other],
    ['Kustannuspohja', summary.costTotal ?? summary.total], ['Kate', summary.margin], ['Myyntihinta ilman ALV:tä', summary.netTotal ?? summary.total], ['ALV', summary.vat], ['Yhteensä ALV:n kanssa', summary.grossTotal],
  ].map(([label, amount]) => `<div><small>${xml(label)}</small><strong>${money(amount)}</strong></div>`).join('');
  const unresolved = (project.model.unresolved || []).map((row) => `<li><strong>${xml(row.label)}:</strong> ${xml(row.reason)}</li>`).join('');
  return `<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>${xml(project.name)} · tarjousluonnos rev ${project.revision}</title><style>@page{size:A4;margin:14mm}body{font:10px Arial,sans-serif;color:#253747}h1{font-size:20px;margin:5mm 0}h2{font-size:14px;margin:7mm 0 3mm}.meta{color:#526572;line-height:1.5}.badge{display:inline-block;border:1px solid #bd8147;padding:4px 7px;color:#864d16;font-weight:bold}.terms,.totals{display:grid;grid-template-columns:repeat(2,1fr);gap:5px 16px;margin:6mm 0}.terms div,.totals div{padding:5px;border-bottom:1px solid #d8e0e5}.terms strong,.totals strong{display:block}table{width:100%;border-collapse:collapse;font-size:7px}th,td{text-align:left;vertical-align:top;padding:3px;border-bottom:1px solid #d8e0e5;overflow-wrap:anywhere}th{background:#eff3f5}.note{color:#8c3737;font-weight:bold}.total{font-size:14px}.print-button{margin:5mm 0}@media print{.print-button{display:none}}</style></head><body><span class="badge">TARJOUSLUONNOS · EI LÄHETETTY</span><h1>${xml(project.name)} · revisio ${project.revision}</h1><p class="meta">Asiakas: ${xml(project.customerName || 'Ei valittu')}<br>Kohde: ${xml(project.building.name || project.building.address || 'Käyttäjän antama kohde')}<br>Rakennuslähde: ${xml(project.building.source || 'Ei ilmoitettu')} · CRS ${xml(project.building.projectCrs || 'Ei ilmoitettu')}<br>Luotu / päivitetty: ${xml(project.updatedAt || 'Ei ilmoitettu')} · valuutta EUR</p><div class="terms"><div><small>Hinnat voimassa asti</small><strong>${xml(terms.validUntil || 'Ei ilmoitettu')}</strong></div><div><small>Hinnan syöttäjä</small><strong>${xml(terms.priceEnteredBy || 'Ei ilmoitettu')}</strong></div><div><small>Kate myyntihinnasta</small><strong>${summary.marginPercent == null ? 'Määrittämättä' : xml(summary.marginPercent) + ' %'}</strong></div><div><small>ALV</small><strong>${summary.vatPercent == null ? 'Määrittämättä' : xml(summary.vatPercent) + ' %'}</strong></div></div><h2>Hinnoitellut ja avoimet rivit</h2><table><thead><tr><th>Tapa</th><th>Mallin nro</th><th>Katalogin nro</th><th>Katalogituote</th><th>Kuvaus</th><th>Määrä / yksikkö</th><th>Yksikköhinta</th><th>Päivät</th><th>Yhteensä</th><th>Hinnan lähde</th><th>Tarkistettu</th></tr></thead><tbody>${rows.join('')}</tbody></table><h2>Yhteenveto</h2><div class="totals">${totals}</div><h2>Avoimet suunnittelutiedot</h2><ul>${unresolved}</ul><p class="note">Tarjous on luonnos. Rakennuksen mitat, komponenttivalinnat ja hinnat pitää tarkistaa. Tämä geometrinen malli ja BOM eivät ole rakenteellinen mitoitus, valmistajan kokoonpanohyväksyntä eivätkä työmaan käyttöönottolupa.</p><button class="print-button" onclick="window.print()">Tulosta / tallenna PDF</button><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script></body></html>`;
}

function scaffoldCadFrame(project) {
  const selection = project.geometry?.facadeSelection;
  if (selection?.source === 'obj-hull') {
    const raw = Array.isArray(selection.direction) ? selection.direction.map(Number) : [1, 0];
    const magnitude = Math.hypot(raw[0], raw[1]) || 1;
    const ux = raw[0] / magnitude, uy = raw[1] / magnitude;
    const outward = [uy, -ux];
    const length = Number(project.geometry.targetLengthM) || Number(selection.lengthM) || 1;
    const depth = Number(project.geometry.buildingDepthM) || 1;
    const ring = [[0,0],[ux*length,uy*length],[ux*length-outward[0]*depth,uy*length-outward[1]*depth],[-outward[0]*depth,-outward[1]*depth]];
    return { ring, start:ring[0], ux, uy, outward, sourceOrigin:null, sourceCrs:'', sourceFootprint:false, facadeLength:length };
  }
  let ring = (project.building.footprint || []).map((point) => [Number(point[0]), Number(point[1])]);
  if (ring.length > 1 && Math.hypot(ring[0][0]-ring.at(-1)[0],ring[0][1]-ring.at(-1)[1]) < 0.01) ring = ring.slice(0,-1);
  const dimensions = project.model.dimensions;
  if (ring.length >= 3) {
    const origin = ring[0];
    const local = ring.map(([x,y]) => [x-origin[0],y-origin[1]]);
    const area2 = local.reduce((sum,point,index)=>{const next=local[(index+1)%local.length];return sum+point[0]*next[1]-next[0]*point[1];},0);
    let index = Number.isInteger(project.building.facadeIndex) ? project.building.facadeIndex : -1;
    if (index < 0 || index >= local.length) index = local.map((point,i)=>({i,length:Math.hypot(local[(i+1)%local.length][0]-point[0],local[(i+1)%local.length][1]-point[1])})).sort((a,b)=>b.length-a.length)[0].i;
    const start = local[index], end = local[(index+1)%local.length];
    const length = Math.hypot(end[0]-start[0],end[1]-start[1]) || 1;
    const ux=(end[0]-start[0])/length,uy=(end[1]-start[1])/length;
    const outward = area2 > 0 ? [uy,-ux] : [-uy,ux];
    return { ring: local, start, ux, uy, outward, sourceOrigin: origin, sourceCrs: project.building.projectCrs || '', sourceFootprint: true, facadeLength: length };
  }
  return { ring: [[0,0],[project.geometry.targetLengthM,0],[project.geometry.targetLengthM,project.geometry.buildingDepthM],[0,project.geometry.buildingDepthM]], start:[0,0], ux:1, uy:0, outward:[0,-1], sourceOrigin:null, sourceCrs:'', sourceFootprint:false, facadeLength:project.geometry.targetLengthM };
}

function cadFrameMetadata(frame) {
  if (!frame.sourceFootprint || !frame.sourceOrigin) return 'CAD coordinates are project-local; no georeferenced source footprint.';
  const fixed = (value) => Number(value).toFixed(6);
  return `Local origin ${frame.sourceCrs || 'project CRS'} E=${fixed(frame.sourceOrigin[0])} N=${fixed(frame.sourceOrigin[1])}; local X/Y map 1:1 to CRS E/N offsets; selected facade vector (${fixed(frame.ux)},${fixed(frame.uy)}), outward (${fixed(frame.outward[0])},${fixed(frame.outward[1])}).`;
}

function buildScaffoldObj(project) {
  const frame=scaffoldCadFrame(project),d=project.model.dimensions;
  const buildingHeight=Number(project.building.height?.value)||Number(project.geometry.targetHeightM)||1;
  const vertices=[],faces=[];
  const addVertex=(x,y,z)=>{vertices.push([x,y,z]);return vertices.length;};
  const addFace=(indices)=>faces.push(indices);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normalize=(a)=>{const n=Math.hypot(...a)||1;return a.map((value)=>value/n);};
  const addRod=(start,end)=>{
    const direction=normalize(end.map((value,index)=>value-start[index]));
    const reference=Math.abs(direction[2])<0.9?[0,0,1]:[0,1,0];
    const u=normalize(cross(direction,reference)),v=cross(direction,u),radius=0.02415,sides=8;
    const bottom=[],top=[];
    for(let i=0;i<sides;i++){
      const angle=2*Math.PI*i/sides,offset=u.map((value,index)=>radius*(Math.cos(angle)*value+Math.sin(angle)*v[index]));
      bottom.push(addVertex(...start.map((value,index)=>value+offset[index])));
      top.push(addVertex(...end.map((value,index)=>value+offset[index])));
    }
    for(let i=0;i<sides;i++){const next=(i+1)%sides;addFace([bottom[i],bottom[next],top[next],top[i]]);}
    addFace([...bottom].reverse());addFace(top);
  };
  const massBottom=frame.ring.map(([x,y])=>addVertex(x,y,0));
  const massTop=frame.ring.map(([x,y])=>addVertex(x,y,buildingHeight));
  addFace([...massBottom].reverse());addFace(massTop);
  for(let i=0;i<frame.ring.length;i++){const n=(i+1)%frame.ring.length;addFace([massBottom[i],massBottom[n],massTop[n],massTop[i]]);}
  const bays=d.bays,levels=d.lifts,step=d.bayLengthM,bayStarts=d.bayStartsM||Array.from({length:bays},(_,i)=>i*step),bayEnds=bayStarts.map((start,i)=>start+(d.bayLengthsM?.[i]??step)),baseOffset=0.2,outerOffset=0.77;
  const point=(along,offset,z)=>[frame.start[0]+frame.ux*along+frame.outward[0]*offset,frame.start[1]+frame.uy*along+frame.outward[1]*offset,z];
  const scaffoldBase=vertices.length;
  for(let bay=0;bay<=bays;bay++)for(const offset of [baseOffset,outerOffset]){
    addRod(point(bayStarts[bay]??d.modeledLengthM,offset,0),point(bayStarts[bay]??d.modeledLengthM,offset,d.modeledHeightM));
  }
  for(let level=0;level<=levels;level++){
    const z=level*d.liftHeightM;
    for(const offset of [baseOffset,outerOffset])for(let bay=0;bay<bays;bay++)addRod(point(bayStarts[bay],offset,z),point(bayEnds[bay],offset,z));
    for(let bay=0;bay<=bays;bay++)addRod(point(bayStarts[bay]??d.modeledLengthM,baseOffset,z),point(bayStarts[bay]??d.modeledLengthM,outerOffset,z));
  }
  for(let level=0;level<levels;level++)for(const bay of d.braceBayIndexes||[]){const z=level*d.liftHeightM;addRod(point(bayStarts[bay],outerOffset,z),point(bayEnds[bay],outerOffset,z+d.liftHeightM));}
  for(const level of d.platformLevels){const z=level*d.liftHeightM;for(let bay=0;bay<bays;bay++){addRod(point(bayStarts[bay],baseOffset,z),point(bayStarts[bay],outerOffset,z));addRod(point(bayEnds[bay],baseOffset,z),point(bayEnds[bay],outerOffset,z));}}
  const roofBase=vertices.length,roofFaceBase=faces.length,keder=project.model.kederRoof?.dimensions;
  if(project.model.kederRoof?.valid&&keder?.facadeA&&keder?.facadeB){
    const toLocal=(point,source)=>source==='building-footprint'&&frame.sourceOrigin?[Number(point[0])-frame.sourceOrigin[0],Number(point[1])-frame.sourceOrigin[1]]:[Number(point[0]),Number(point[1])];
    const aStart=toLocal(keder.facadeA.start,keder.facadeA.source),aEnd=toLocal(keder.facadeA.end,keder.facadeA.source),bRawStart=toLocal(keder.facadeB.start,keder.facadeB.source),bRawEnd=toLocal(keder.facadeB.end,keder.facadeB.source),aDx=aEnd[0]-aStart[0],aDy=aEnd[1]-aStart[1];
    const sameDirection=aDx*(bRawEnd[0]-bRawStart[0])+aDy*(bRawEnd[1]-bRawStart[1])>=0,bStart=sameDirection?bRawStart:bRawEnd,bEnd=sameDirection?bRawEnd:bRawStart;
    const roofLength=Number(keder.roofLengthM)||0,roofWidth=Number(keder.roofWidthM)||0,eaveZ=Math.max(buildingHeight,Number(d.modeledHeightM)||0),rise=Number(keder.roofRiseM)||0;
    const lengths=Array.isArray(keder.roofBayLengthsM)?keder.roofBayLengthsM.map(Number):[roofLength],positions=[0];for(const length of lengths)positions.push(Math.min(roofLength,positions.at(-1)+length));
    const sections=positions.map((distance)=>{const t=Math.max(0,Math.min(1,distance/(roofLength||1))),pa=[aStart[0]+aDx*t,aStart[1]+aDy*t],pb=[bStart[0]+(bEnd[0]-bStart[0])*t,bStart[1]+(bEnd[1]-bStart[1])*t],vx=pb[0]-pa[0],vy=pb[1]-pa[1],span=Math.hypot(vx,vy)||1,ux=vx/span,uy=vy/span,mid=[(pa[0]+pb[0])/2,(pa[1]+pb[1])/2];return {pa,pb,left:[mid[0]-ux*roofWidth/2,mid[1]-uy*roofWidth/2,eaveZ],ridge:[mid[0],mid[1],eaveZ+rise],right:[mid[0]+ux*roofWidth/2,mid[1]+uy*roofWidth/2,eaveZ]};});
    for(const section of sections){addRod(section.left,section.ridge);addRod(section.ridge,section.right);addRod(section.left,section.right);addRod([section.pa[0],section.pa[1],0],[section.pa[0],section.pa[1],eaveZ]);addRod([section.pb[0],section.pb[1],0],[section.pb[0],section.pb[1],eaveZ]);const divisions=Math.max(3,Math.ceil(roofWidth));for(let i=1;i<divisions;i++){const t=i/divisions,p=[section.left[0]+(section.right[0]-section.left[0])*t,section.left[1]+(section.right[1]-section.left[1])*t,eaveZ+rise*(1-Math.abs(2*t-1))];addRod(p,[p[0],p[1],eaveZ]);}}
    for(let bay=0;bay<sections.length-1;bay++){const current=sections[bay],next=sections[bay+1];const addQuad=(points)=>addFace(points.map(([x,y,z])=>addVertex(x,y,z)));addQuad([current.left,next.left,next.ridge,current.ridge]);addQuad([current.ridge,next.ridge,next.right,current.right]);const stations=Math.max(1,Math.ceil((Number(keder.slopeLengthM)||roofWidth/2)/(keder.bracingVariant==='heavy'?1:2)));for(let station=0;station<=stations;station++){const t=station/stations;for(const side of ['left','right']){const p=side==='left'?current.left:current.right,q=side==='left'?current.ridge:current.ridge,r=side==='left'?next.left:next.right,s=side==='left'?next.ridge:next.ridge,at=(a,b)=>a.map((value,index)=>value+(b[index]-value)*t);addRod(at(p,q),at(r,s));}}}
  }
  const clean=(value)=>String(value||'').replace(/[\r\n]+/g,' ').replace(/[\u0000-\u001f]/g,' ');
  const comments=[`Telinekonttori ${clean(project.name)} project=${project.id} revision=${project.revision}`,'Coordinate system=project-local; source CRS is recorded below; units=m; up=Z',`Building source=${clean(project.building.source)} CRS=${clean(project.building.projectCrs)} sourceFootprint=${frame.sourceFootprint}`,cadFrameMetadata(frame),`Height status=${clean(project.building.height?.status)} value=${buildingHeight}m`,'Scaffold bars use a 48.3 mm illustrative display envelope; verify real component sections.',project.model.kederRoof?.valid?'Keder Roof XL 18 degree trusses, braces and tarp surfaces are manual-based visual geometry.':'Keder Roof XL is disabled or has unresolved facade geometry.','Geometric draft; not a structural design or erection approval.'];
  const output=['# Telinekonttori CAD OBJ',...comments.map((line)=>'# '+line),`o ${clean(project.name).replace(/\s+/g,'_')||'TelineProject'}`,'g building_mass',...vertices.slice(0,scaffoldBase).map((v)=>`v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`),...faces.slice(0,frame.ring.length+2).map((face)=>`f ${face.join(' ')}`),'g scaffold_parametric_frame',...vertices.slice(scaffoldBase,roofBase).map((v)=>`v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`),...faces.slice(frame.ring.length+2,roofFaceBase).map((face)=>`f ${face.join(' ')}`),'g keder_roof_xl',...vertices.slice(roofBase).map((v)=>`v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`),...faces.slice(roofFaceBase).map((face)=>`f ${face.join(' ')}`)];
  return output.join('\n')+'\n';
}

function buildScaffoldDxf(project) {
  const frame=scaffoldCadFrame(project),d=project.model.dimensions;
  const scale=1000, buildingHeight=Number(project.building.height?.value)||Number(project.geometry.targetHeightM)||1;
  const workPurpose=String(project.geometry.workPurpose||'').replace(/\s+/g,' ').trim().slice(0,180)||'Not recorded';
  const layerNames=['0','BUILDING_PLAN','BUILDING_ELEVATION','SCAFFOLD_STANDARDS','SCAFFOLD_PLAN_LEDGER','SCAFFOLD_LEDGER','SCAFFOLD_TRANSOMS','SCAFFOLD_DECK','SCAFFOLD_DIAGONALS','DIMENSIONS','PROJECT_META','WARNING'];
  const vportTableHandle=(layerNames.length+2).toString(16).toUpperCase(),vportRecordHandle=(layerNames.length+3).toString(16).toUpperCase();
  const blockRecordTableHandle=(layerNames.length+4).toString(16).toUpperCase(),modelSpaceBlockHandle=(layerNames.length+5).toString(16).toUpperCase(),paperSpaceBlockHandle=(layerNames.length+6).toString(16).toUpperCase();
  const modelBlockStart=(layerNames.length+7).toString(16).toUpperCase(),modelBlockEnd=(layerNames.length+8).toString(16).toUpperCase(),paperBlockStart=(layerNames.length+9).toString(16).toUpperCase(),paperBlockEnd=(layerNames.length+10).toString(16).toUpperCase();
  const firstEntityHandle=layerNames.length+11;
  const entities=[];
  const entity=(type,subclass,layer,data)=>entities.push(['0',type,'5','0','330',modelSpaceBlockHandle,'100','AcDbEntity','8',layer,'100',subclass,...data]);
  const line=(a,b,layer)=>entity('LINE','AcDbLine',layer,['10',a[0].toFixed(3),'20',a[1].toFixed(3),'30','0','11',b[0].toFixed(3),'21',b[1].toFixed(3),'31','0']);
  const text=(at,value,height,layer)=>entity('TEXT','AcDbText',layer,['10',at[0].toFixed(3),'20',at[1].toFixed(3),'30','0','40',String(height),'1',String(value).replace(/[\r\n\u0000-\u001f]/g,' ').slice(0,240)]);
  const circle=(at,radius,layer)=>entity('CIRCLE','AcDbCircle',layer,['10',at[0].toFixed(3),'20',at[1].toFixed(3),'30','0','40',String(radius)]);
  const plan=(along,offset)=>[(frame.start[0]+frame.ux*along+frame.outward[0]*offset)*scale,(frame.start[1]+frame.uy*along+frame.outward[1]*offset)*scale];
  const poly=(points,layer)=>points.forEach((p,i)=>line(p,points[(i+1)%points.length],layer));
  poly(frame.ring.map(([x,y])=>[x*scale,y*scale]),'BUILDING_PLAN');
  if(d.bays>0){
    const starts=d.bayStartsM||Array.from({length:d.bays},(_,i)=>i*d.bayLengthM),ends=starts.map((start,i)=>start+(d.bayLengthsM?.[i]??d.bayLengthM));
    for(let bay=0;bay<=d.bays;bay++)for(const offset of [0.2,0.77])circle(plan(starts[bay]??d.modeledLengthM,offset),40,'SCAFFOLD_STANDARDS');
    for(let bay=0;bay<d.bays;bay++)for(const offset of [0.2,0.77])line(plan(starts[bay],offset),plan(ends[bay],offset),'SCAFFOLD_PLAN_LEDGER');
    for(let bay=0;bay<=d.bays;bay++)line(plan(starts[bay]??d.modeledLengthM,0.2),plan(starts[bay]??d.modeledLengthM,0.77),'SCAFFOLD_TRANSOMS');
  }
  const planYs=frame.ring.map((point)=>point[1]*scale),elevationY=Math.max(...planYs,0)+5000;
  const target=project.geometry.targetLengthM*scale,modeled=d.modeledLengthM*scale,h=buildingHeight*scale,scaffoldH=d.modeledHeightM*scale;
  poly([[0,elevationY],[target,elevationY],[target,elevationY+h],[0,elevationY+h]],'BUILDING_ELEVATION');
  if(d.bays>0){
    const starts=d.bayStartsM||Array.from({length:d.bays},(_,i)=>i*d.bayLengthM);
    for(let bay=0;bay<=d.bays;bay++)line([(starts[bay]??d.modeledLengthM)*scale,elevationY],[(starts[bay]??d.modeledLengthM)*scale,elevationY+scaffoldH],'SCAFFOLD_STANDARDS');
    for(let level=0;level<=d.lifts;level++){const y=elevationY+level*d.liftHeightM*scale;line([0,y],[modeled,y],'SCAFFOLD_LEDGER');if(level>0&&d.platformLevels.includes(level))line([0,y],[modeled,y],'SCAFFOLD_DECK');}
    for(let level=0;level<d.lifts;level++)for(const bay of d.braceBayIndexes||[]){const x1=(starts[bay]??0)*scale,x2=x1+(d.bayLengthsM?.[bay]??d.bayLengthM)*scale,y1=elevationY+level*d.liftHeightM*scale,y2=elevationY+(level+1)*d.liftHeightM*scale;line([x1,y1],[x2,y2],'SCAFFOLD_DIAGONALS');}
  }
  const planXs=frame.ring.map((point)=>point[0]*scale),legendX=Math.max(...planXs,target,modeled)+2500,legendTop=elevationY+Math.max(h,scaffoldH)+1500;
  text([legendX,legendTop],'DRAWING KEY | THIS EXPORT',220,'PROJECT_META');
  const legendRows=[
    {label:'PLAN = simplified plan / footprint view'},
    {label:'ELEV = facade elevation view'},
    {label:'Building mass outline',layer:'BUILDING_ELEVATION'},
    {label:'Scaffold standard lines',layer:'SCAFFOLD_STANDARDS'},
    {label:'Ledgers / horizontal runs',layer:'SCAFFOLD_LEDGER'},
    {label:'Plan transoms',layer:'SCAFFOLD_TRANSOMS'},
    {label:'Platform level',layer:'SCAFFOLD_DECK'},
    {label:'Diagonal braces',layer:'SCAFFOLD_DIAGONALS'},
    {label:'Dimensions / guide lines',layer:'DIMENSIONS'},
  ];
  legendRows.forEach((row,index)=>{const y=legendTop-500-(index*420);if(row.layer)line([legendX,y],[legendX+1100,y],row.layer);text([legendX+(row.layer?1400:0),y-50],row.label,135,'PROJECT_META');});
  text([legendX,legendTop-4600],'Colors explain only this export. Confirm project and manufacturer symbols in their source legend.',120,'WARNING');
  text([legendX,legendTop-4900],'This file has plan and elevation views only; section/detail references are not generated.',120,'WARNING');
  text([0,elevationY+h+1500],`${project.name} | REV ${project.revision} | ${project.model.system.name} | UNITS mm`,350,'PROJECT_META');
  text([0,elevationY+h+900],`Building source: ${project.building.source} | source CRS: ${project.building.sourceCrs} -> project CRS: ${project.building.projectCrs} | height status: ${project.building.height?.status}`,180,'PROJECT_META');
  text([0,elevationY+h+700],`Work purpose: ${workPurpose}`,150,'PROJECT_META');
  text([0,elevationY+h+450],cadFrameMetadata(frame),120,'PROJECT_META');
  text([0,elevationY-1200],`Elevation 1:1 | target ${project.geometry.targetLengthM}m x ${project.geometry.targetHeightM}m | modeled ${d.modeledLengthM}m x ${d.modeledHeightM}m`,180,'DIMENSIONS');
  text([0,Math.min(...planYs,0)-2000],`Plan | building depth ${project.geometry.buildingDepthM}m | selected source facade ${frame.sourceFootprint?'yes':'approximate rectangular input'}`,180,'DIMENSIONS');
  text([0,elevationY-1800],'Geometric draft only; not a structural design or erection approval.',180,'WARNING');
  entities.forEach((record,index)=>{const handle=(firstEntityHandle+index).toString(16).toUpperCase();record[3]=handle;});
  const pairs=[];for(const record of entities)pairs.push(...record);
  const layerColors={0:7,BUILDING_PLAN:8,BUILDING_ELEVATION:8,SCAFFOLD_STANDARDS:3,SCAFFOLD_PLAN_LEDGER:5,SCAFFOLD_LEDGER:5,SCAFFOLD_TRANSOMS:4,SCAFFOLD_DECK:2,SCAFFOLD_DIAGONALS:30,DIMENSIONS:8,PROJECT_META:1,WARNING:1};
  const layerTable=layerNames.flatMap((name,index)=>['0','LAYER','5',(index+2).toString(16).toUpperCase(),'330','1','100','AcDbSymbolTableRecord','100','AcDbLayerTableRecord','2',name,'70','0','62',String(layerColors[name]??7),'6','CONTINUOUS']);
  const handSeed=(firstEntityHandle+entities.length).toString(16).toUpperCase();
  const xs=[],ys=[];
  for(const record of entities){
    const type=record[1],values=new Map();
    for(let i=0;i<record.length;i+=2){const code=record[i],value=record[i+1];if(['10','11','20','21','40','1'].includes(code))values.set(code,value);}
    const x=Number(values.get('10')),y=Number(values.get('20'));
    if(Number.isFinite(x)&&Number.isFinite(y)){
      if(type==='CIRCLE'){const radius=Number(values.get('40'))||0;xs.push(x-radius,x+radius);ys.push(y-radius,y+radius);}
      else if(type==='TEXT'){const height=Number(values.get('40'))||0,width=Math.max(height*0.5,String(values.get('1')||'').length*height*0.8);xs.push(x,x+width);ys.push(y-height*0.25,y+height*1.25);}
      else{xs.push(x);ys.push(y);}
    }
    const endX=Number(values.get('11')),endY=Number(values.get('21'));
    if(Number.isFinite(endX))xs.push(endX);
    if(Number.isFinite(endY))ys.push(endY);
  }
  const pad=500,minX=(Math.min(...xs)-pad).toFixed(3),minY=(Math.min(...ys)-pad).toFixed(3),maxX=(Math.max(...xs)+pad).toFixed(3),maxY=(Math.max(...ys)+pad).toFixed(3);
  const viewCenterX=((Number(minX)+Number(maxX))/2).toFixed(3),viewCenterY=((Number(minY)+Number(maxY))/2).toFixed(3),viewHeight=((Number(maxY)-Number(minY))*1.1).toFixed(3);
  // LibreCAD restores VPORT through an offset formula that applies its center
  // twice. Keep canonical drawing extents/$VIEWCTR above and compensate only
  // the active VPORT's opening center for a typical wide desktop viewport.
  const libreCadViewCenterX=(Number(viewCenterX)/2+Number(viewHeight)/2).toFixed(3);
  const libreCadViewCenterY=(Number(viewCenterY)/2+Number(viewHeight)/4).toFixed(3);
  const viewHeader=['9','$VIEWCTR','10',viewCenterX,'20',viewCenterY,'9','$VIEWSIZE','40',viewHeight];
  const drawingExtents=['9','$EXTMIN','10',minX,'20',minY,'30','0','9','$EXTMAX','10',maxX,'20',maxY,'30','0','9','$LIMMIN','10',minX,'20',minY,'9','$LIMMAX','10',maxX,'20',maxY];
  const vportTable=['0','TABLE','2','VPORT','5',vportTableHandle,'330','0','100','AcDbSymbolTable','70','1','0','VPORT','5',vportRecordHandle,'330',vportTableHandle,'100','AcDbSymbolTableRecord','100','AcDbViewportTableRecord','2','*Active','70','0','10','0','20','0','11','1','21','1','12',libreCadViewCenterX,'22',libreCadViewCenterY,'13','0','23','0','14','0.5','24','0.5','15','0.5','25','0.5','16','0','26','0','36','1','17','0','27','0','37','0','40',viewHeight,'41','2','42','50','43','0','44','0','50','0','51','0','71','0','72','1000','73','1','74','3','75','0','76','0','77','0','78','0','281','0','65','0','146','0','0','ENDTAB'];
  const blockRecordTable=['0','TABLE','2','BLOCK_RECORD','5',blockRecordTableHandle,'330','0','100','AcDbSymbolTable','70','2','0','BLOCK_RECORD','5',modelSpaceBlockHandle,'330',blockRecordTableHandle,'100','AcDbSymbolTableRecord','100','AcDbBlockTableRecord','2','*Model_Space','70','0','280','1','281','0','0','BLOCK_RECORD','5',paperSpaceBlockHandle,'330',blockRecordTableHandle,'100','AcDbSymbolTableRecord','100','AcDbBlockTableRecord','2','*Paper_Space','70','0','280','1','281','0','0','ENDTAB'];
  const blockSection=['0','SECTION','2','BLOCKS','0','BLOCK','5',modelBlockStart,'330',modelSpaceBlockHandle,'100','AcDbEntity','8','0','100','AcDbBlockBegin','2','*Model_Space','70','0','10','0','20','0','30','0','3','*Model_Space','1','','0','ENDBLK','5',modelBlockEnd,'330',modelSpaceBlockHandle,'100','AcDbEntity','8','0','100','AcDbBlockEnd','0','BLOCK','5',paperBlockStart,'330',paperSpaceBlockHandle,'100','AcDbEntity','8','0','100','AcDbBlockBegin','2','*Paper_Space','70','0','10','0','20','0','30','0','3','*Paper_Space','1','','0','ENDBLK','5',paperBlockEnd,'330',paperSpaceBlockHandle,'100','AcDbEntity','8','0','100','AcDbBlockEnd','0','ENDSEC'];
  return ['0','SECTION','2','HEADER','9','$ACADVER','1','AC1015','9','$INSUNITS','70','4','9','$MEASUREMENT','70','1',...viewHeader,...drawingExtents,'9','$HANDSEED','5',handSeed,'0','ENDSEC','0','SECTION','2','TABLES',...vportTable,'0','TABLE','2','LAYER','5','1','330','0','100','AcDbSymbolTable','70',String(layerNames.length),...layerTable,'0','ENDTAB',...blockRecordTable,'0','ENDSEC',...blockSection,'0','SECTION','2','ENTITIES',...pairs,'0','ENDSEC','0','EOF',''].join('\n');
}

function buildScaffoldFreeCadMacro(project) {
  const ring = (project.building.footprint || []).map((point) => [Number(point[0]), Number(point[1])])
    .filter((point) => point.every(Number.isFinite));
  if (ring.length > 1 && Math.hypot(ring[0][0] - ring.at(-1)[0], ring[0][1] - ring.at(-1)[1]) < 0.01) ring.pop();
  const dims = project.model.dimensions;
  const payload = {
    name: project.name,
    id: project.id,
    revision: project.revision,
    address: project.building.name || project.building.address || '',
    source: project.geometry.facadeSelection?.source === 'obj-hull' ? 'Tuotu OBJ · paikallinen julkisivusuunta; ei georeferoitu' : project.building.source || '',
    sourceCrs: project.geometry.facadeSelection?.source === 'obj-hull' ? 'OBJ-local' : project.building.sourceCrs || '',
    projectCrs: project.geometry.facadeSelection?.source === 'obj-hull' ? 'LOCAL' : project.building.projectCrs || '',
    footprint: project.geometry.facadeSelection?.source === 'obj-hull' ? [] : ring,
    facadeIndex: project.geometry.facadeSelection?.source === 'obj-hull' ? 0 : project.building.facadeIndex,
    facadeDirection: project.geometry.facadeSelection?.direction || null,
    facadeSource: project.geometry.facadeSelection?.source || '',
    buildingHeightM: Number(project.building.height?.value) || Number(project.geometry.targetHeightM) || 1,
    heightStatus: project.building.height?.status || 'estimate',
    targetLengthM: Number(project.geometry.targetLengthM) || 0,
    targetDepthM: Number(project.geometry.buildingDepthM) || 0,
    scaffoldLengthM: Number(dims.modeledLengthM) || 0,
    scaffoldHeightM: Number(dims.modeledHeightM) || 0,
    bays: Number(dims.bays) || 0,
    lifts: Number(dims.lifts) || 0,
    bayLengthM: Number(dims.bayLengthM) || 3.05,
    bayLengthsM: Array.isArray(dims.bayLengthsM) ? dims.bayLengthsM : [],
    bayStartsM: Array.isArray(dims.bayStartsM) ? dims.bayStartsM : [],
    braceBayIndexes: Array.isArray(dims.braceBayIndexes) ? dims.braceBayIndexes : [],
    loadClass: Number(dims.loadClass) || 3,
    liftHeightM: Number(dims.liftHeightM) || 2,
    platformLevels: Array.isArray(dims.platformLevels) ? dims.platformLevels : [],
    scaffoldWidthM: Number(dims.bayWidthM) || 0.77,
  };
  const json = JSON.stringify(JSON.stringify(payload));
  return `# -*- coding: utf-8 -*-
# Telinekonttori FreeCAD macro · generated project model
# Open this file in FreeCAD to create editable CAD document objects.
# Edit the DATA parameter block and rerun the macro to rebuild the geometry.
# Geometric draft only; review every dimension and resolve open design items.
import FreeCAD as App
import Part
import json
import math
import os

DATA = json.loads(${json})
DOC_NAME = 'Telinekonttori_' + ''.join(c if c.isalnum() else '_' for c in DATA['name'])[:32]
if DOC_NAME in App.listDocuments():
    App.closeDocument(DOC_NAME)
doc = App.newDocument(DOC_NAME)
V = App.Vector
MM = 1000.0

def feature(name, label, shape, role):
    obj = doc.addObject('PartDesign::Feature', name)
    obj.Label = label
    obj.Shape = shape
    obj.addProperty('App::PropertyString', 'ComponentRole', 'Telinekonttori')
    obj.ComponentRole = role
    obj.addProperty('App::PropertyString', 'ProjectId', 'Telinekonttori')
    obj.ProjectId = DATA['id']
    obj.addProperty('App::PropertyInteger', 'ProjectRevision', 'Telinekonttori')
    obj.ProjectRevision = DATA['revision']
    return obj

ring = DATA['footprint']
if len(ring) < 3:
    ring = [[0, 0], [DATA['targetLengthM'], 0],
            [DATA['targetLengthM'], DATA['targetDepthM']], [0, DATA['targetDepthM']]]
if DATA.get('facadeSource') == 'obj-hull' and DATA.get('facadeDirection'):
    direction = DATA['facadeDirection']
    magnitude = math.hypot(direction[0], direction[1]) or 1.0
    ux, uy = direction[0]/magnitude, direction[1]/magnitude
    ox, oy = uy, -ux
    length = max(DATA['targetLengthM'], 0.001)
    depth = max(DATA['targetDepthM'], 0.001)
    ring = [[0, 0], [ux*length, uy*length],
            [ux*length-ox*depth, uy*length-oy*depth], [-ox*depth, -oy*depth]]
origin = ring[0]
local = [[(p[0]-origin[0])*MM, (p[1]-origin[1])*MM] for p in ring]
wire = Part.makePolygon([V(x, y, 0) for x, y in local] + [V(local[0][0], local[0][1], 0)])
height = max(1.0, DATA['buildingHeightM'] * MM)
building = feature('BuildingMass', 'Rakennuksen massamalli · ' + DATA['address'],
                   Part.Face(wire).extrude(V(0, 0, height)), 'building-mass')
for prop, value in [('Source', DATA['source']), ('SourceCRS', DATA['sourceCrs']),
                    ('ProjectCRS', DATA['projectCrs']), ('HeightStatus', DATA['heightStatus'])]:
    building.addProperty('App::PropertyString', prop, 'Lähdetiedot')
    setattr(building, prop, value)
building.addProperty('App::PropertyLength', 'BuildingHeight', 'Parametrit')
building.BuildingHeight = height

index = DATA['facadeIndex']
if not isinstance(index, int) or index < 0 or index >= len(local):
    index = max(range(len(local)), key=lambda i: math.hypot(local[(i+1) % len(local)][0]-local[i][0], local[(i+1) % len(local)][1]-local[i][1]))
start, end = local[index], local[(index+1) % len(local)]
dx, dy = end[0]-start[0], end[1]-start[1]
facade = math.hypot(dx, dy) or 1.0
ux, uy = dx/facade, dy/facade
area2 = sum(local[i][0]*local[(i+1) % len(local)][1]-local[(i+1) % len(local)][0]*local[i][1] for i in range(len(local)))
ox, oy = (uy, -ux) if area2 > 0 else (-uy, ux)
bay = DATA['bayLengthM']*MM
bay_starts = [value*MM for value in DATA.get('bayStartsM', [])]
bay_lengths = [value*MM for value in DATA.get('bayLengthsM', [])]
def bay_x(i):
    return bay_starts[i] if i < len(bay_starts) else i*bay
def bay_end(i):
    return bay_x(i) + (bay_lengths[i] if i < len(bay_lengths) else bay)
width = DATA['scaffoldWidthM']*MM
scaffold_height = DATA['scaffoldHeightM']*MM
scaffold_length = DATA['scaffoldLengthM']*MM
radius = 24.15
solids = {'Standards': [], 'Ledgers': [], 'Transoms': [], 'Diagonals': [], 'Decks': [], 'Guardrails': [], 'Toeboards': []}
def point(along, offset, z):
    return V(start[0]+ux*along+ox*offset, start[1]+uy*along+oy*offset, z)
def tube(a, b):
    delta = b.sub(a)
    length = delta.Length
    if length > 0.1:
        solids[current].append(Part.makeCylinder(radius, length, a, delta.normalize()))

for i in range(DATA['bays']+1):
    for offset in (200.0, width):
        current = 'Standards'
        tube(point(bay_x(i), offset, 0), point(bay_x(i), offset, scaffold_height))
for level in range(DATA['lifts']+1):
    z = level*DATA['liftHeightM']*MM
    current = 'Ledgers'
    for offset in (200.0, width):
        for i in range(DATA['bays']):
            tube(point(bay_x(i), offset, z), point(bay_end(i), offset, z))
    current = 'Transoms'
    for i in range(DATA['bays']+1):
        tube(point(bay_x(i), 200.0, z), point(bay_x(i), width, z))
    if level < DATA['lifts']:
        current = 'Diagonals'
        for i in DATA.get('braceBayIndexes', []):
            tube(point(bay_x(i), width, z), point(bay_end(i), width, z+DATA['liftHeightM']*MM))
for level in DATA['platformLevels']:
    z = int(level)*DATA['liftHeightM']*MM
    for i in range(DATA['bays']):
        corners = [point(bay_x(i), 200.0, z), point(bay_end(i), 200.0, z),
                   point(bay_end(i), width, z), point(bay_x(i), width, z)]
        wire = Part.makePolygon(corners + [corners[0]])
        solids['Decks'].append(Part.Face(wire).extrude(V(0, 0, 50.0)))
        current = 'Guardrails'
        for rail_z in (z+500.0, z+1000.0):
            tube(point(bay_x(i), width, rail_z), point(bay_end(i), width, rail_z))
        board = [point(bay_x(i), width, z), point(bay_end(i), width, z),
                 point(bay_end(i), width, z+200.0), point(bay_x(i), width, z+200.0)]
        solids['Toeboards'].append(Part.Face(Part.makePolygon(board+[board[0]])).extrude(V(ox*20.0, oy*20.0, 0)))
    current = 'Guardrails'
    for i in range(DATA['bays']+1):
        tube(point(bay_x(i), width, z), point(bay_x(i), width, z+1000.0))

group = doc.addObject('App::DocumentObjectGroup', 'ScaffoldFrame')
group.Label = 'Parametrinen teline · Layher Allround · geometrialuonnos'
for key, label in [('Standards', 'Pystyrungot'), ('Ledgers', 'Vaakajuoksut'), ('Transoms', 'Poikittaispalkit'), ('Diagonals', 'Pystydiagonaalit · vähintään joka 5. kenttä')]:
    if solids[key]:
        obj = feature('Scaffold'+key, label, Part.makeCompound(solids[key]), 'scaffold-'+key.lower())
        obj.addProperty('App::PropertyLength', 'BayLength', 'Parametrit'); obj.BayLength = bay
        obj.addProperty('App::PropertyLength', 'LiftHeight', 'Parametrit'); obj.LiftHeight = DATA['liftHeightM']*MM
        obj.addProperty('App::PropertyInteger', 'BayCount', 'Parametrit'); obj.BayCount = DATA['bays']
        obj.addProperty('App::PropertyInteger', 'LiftCount', 'Parametrit'); obj.LiftCount = DATA['lifts']
        group.addObject(obj)
if solids['Decks']:
    obj = feature('ScaffoldDecks', 'Työtasot · mallinnettu suorakulmaisina osina', Part.makeCompound(solids['Decks']), 'scaffold-decks')
    obj.addProperty('App::PropertyString', 'PlatformLevels', 'Parametrit')
    obj.PlatformLevels = ', '.join(str(level) for level in DATA['platformLevels'])
    group.addObject(obj)
for key, label in [('Guardrails', 'Suojakaiteet · geometrialuonnos'), ('Toeboards', 'Varvaslistat · geometrialuonnos')]:
    if solids[key]:
        group.addObject(feature('Scaffold'+key, label, Part.makeCompound(solids[key]), 'scaffold-'+key.lower()))

doc.recompute()
Gui.activeDocument().activeView().viewAxonometric()
Gui.activeDocument().activeView().fitAll()
default_name = ''.join(c if c.isalnum() or c in '-_' else '_' for c in DATA['name']).strip('_') or 'telineprojekti'
try:
    from PySide6 import QtWidgets
except ImportError:
    from PySide import QtGui as QtWidgets
save_path, selected_filter = QtWidgets.QFileDialog.getSaveFileName(
    None, 'Tallenna Telinekonttori FreeCAD-malli', default_name + '_rev' + str(DATA['revision']) + '.FCStd', 'FreeCAD document (*.FCStd)')
if save_path:
    if not save_path.lower().endswith('.fcstd'):
        save_path += '.FCStd'
    doc.recompute()
    doc.saveAs(save_path)
    App.Console.PrintMessage('Telinekonttori: CAD-luonnos tallennettiin tiedostoon ' + save_path + '. Tarkista avoimet suunnittelukohdat ennen käyttöä.\\n')
else:
    App.Console.PrintMessage('Telinekonttori: CAD-luonnos luotiin mutta sitä ei tallennettu. Valitse FreeCADissa Tiedosto > Tallenna nimellä.\\n')
`;
}

const exportApi = { buildScaffoldBomCsv, buildScaffoldDxf, buildScaffoldFreeCadMacro, buildScaffoldObj, buildScaffoldQuoteCsv, buildScaffoldQuoteHtml, buildScaffoldSvg };
if (typeof module !== 'undefined' && module.exports) module.exports = exportApi;
else if (typeof globalThis !== 'undefined') globalThis.TelineExports = exportApi;
