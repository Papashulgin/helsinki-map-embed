#!/usr/bin/env node
'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../public-static');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/mms-archive/manifest.json'),'utf8'));
const sourcePages={
 alfix:'https://www.alfix-systems.com/en/downloads/downloads-instructions-for-erection-and-use/',
 haki:'https://www.haki.com/resources?tags=Manual#document-filter',
 huennebeck:'https://products.huennebeck.com/downloads#c20061',
 doka:'https://direct.doka.com/',
 'scafom-rux':'https://www.scafom-rux.com/en/solutions/modular-scaffolds/ringscaff-modular-scaffold',
 'tobler-ag':'https://www.tobler-ag.com/en/service/downloads/',
 telinekataja:'https://telinekataja.fi/en/scaffolding/brochures-and-instructions/',
 wellmade:'https://www.wm-scaffold.com/scaffold-catalogue/',
};
const id=(s)=>s.toLocaleLowerCase('en').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections=manifest.vendors.map(v=>{
 const slug=v.archiveUrl?.match(/#([^\s]+)/)?.[1]|| (v.name.includes('Layher')?'telinekataja':v.name.includes('SCAFOM')?'scafom-rux':v.name.includes('Wellmade')?'wellmade':id(v.name));
 const files=v.files.filter(f=>/manual|instruction|guide|AuV|Asennus|pakkaus/i.test(f.name));
 if(!files.length)return '';
 return `<section class="vendor" id="${esc(slug)}"><h2>${esc(v.name)} <small>${files.length} käyttöohjetta</small></h2>${sourcePages[slug]?`<p><a href="${esc(sourcePages[slug])}">Virallinen dokumenttilähde ↗</a></p>`:''}<ul>${files.map(f=>`<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a> <small>${(f.bytes/1048576).toLocaleString('fi-FI',{maximumFractionDigits:1})} MB</small></li>`).join('')}</ul></section>`;
}).join('\n');
const html=`<!doctype html><html lang="fi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MMS · telinejärjestelmien käyttöohjeet</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:1000px;margin:32px auto;padding:0 20px;color:#202632;background:#f5f7fa}h1,h2{line-height:1.2}a{color:#075ba7}.vendor{background:#fff;border:1px solid #dce3eb;border-radius:12px;padding:18px;margin:18px 0;scroll-margin-top:16px}.vendor li{margin:.5rem 0}small{color:#667587}.vendor h2 small{font-size:.65em}.tag{display:inline-block;background:#e9f2fb;border-radius:99px;padding:3px 9px;font-size:13px}</style></head><body><p><a href="/workspace.html?page=manufacturing">← MMS · Valmistus</a></p><h1>Telinejärjestelmien käyttö- ja asennusohjeet</h1><p><span class="tag">Paikallinen arkisto</span> PDF:t ja niiden lähteet valmistajien virallisilta sivuilta.</p><p>Ohjeiden painosvuodet vaihtelevat. Tarkista valmistajan lataussivulta uusin voimassa oleva painos ja tuotekohtainen soveltuvuus ennen käyttöä.</p>${sections}</body></html>`;
const out=path.join(root,'archive/scaffold-manuals/index.html');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);console.log('Generated scaffold manual index.');
