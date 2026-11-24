#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const destination = path.resolve(__dirname, '../public-static/data/mms-archive/telinekataja/catalogs');
const sourcePage = 'https://telinekataja.fi/en/scaffolding/brochures-and-instructions/';
const documents = [
  ['Asennusohje-Allround-fi.pdf','https://telinekataja.fi/media/filer_public/8c/81/8c818fab-5d3d-438e-948b-9a489d05ea4e/allround.pdf','Asennusohje suomeksi · Allround'],
  ['Asennusohje-ARS-fi.pdf','https://telinekataja.fi/media/filer_public/70/cf/70cf0095-e836-45ae-8930-8bfb8aac79a3/ars.pdf','Asennusohje suomeksi · ARS'],
  ['Asennusohje-KH-saasuoja-fi.pdf','https://telinekataja.fi/media/filer_public/22/a3/22a383a1-8554-497c-9f26-b5bb1d86abe9/kh-saasuoja.pdf','Asennusohje suomeksi · KH-sääsuoja'],
  ['Asennusohje-KH-XL-saasuoja-fi.pdf','https://telinekataja.fi/media/filer_public/bf/fb/bffbc0ae-4ecc-4a5f-ab7b-e91ea131bd91/kh-xl-saasuoja.pdf','Asennusohje suomeksi · KH XL -sääsuoja'],
  ['Asennusohje-siirreltava-teline-fi.pdf','https://telinekataja.fi/media/filer_public/e7/71/e771f00e-5b17-456c-b3f1-c21615fd2ca5/siirreltava-teline.pdf','Asennusohje suomeksi · siirrettävä teline'],
  ['Asennusohje-TG-60-tukitorni-fi.pdf','https://telinekataja.fi/media/filer_public/6a/79/6a799dd4-078a-4b9e-8acd-9e1d86ac7aae/tg-60-tukitorni.pdf','Asennusohje suomeksi · TG-60-tukitorni'],
  ['Asennusohje-Allround-en.pdf','https://telinekataja.fi/media/filer_public/f5/6d/f56daa50-ab76-47e1-abd3-aaaadb793671/allround_en.pdf','Installation instructions · Allround · English'],
  ['Lumenpudotustuotteet-fi.pdf','https://telinekataja.fi/media/filer_public/ce/84/ce84f9e6-7bd4-4033-8468-71f1e103c7fb/lumenpudotustuotteet.pdf','Lumenpudotustuotteet'],
  ['Lumenpoistoon-varautuminen-fi.pdf','https://telinekataja.fi/media/filer_public/c5/31/c53129ba-8c04-4fb5-9457-a62303acb2e1/lumenpoistoon-varautuminen.pdf','Lumenpoistoon varautuminen'],
  ['Pakkausohje-AR-seinakonsoli-fi.pdf','https://telinekataja.fi/media/filer_public/60/89/608903ef-4b8a-40f6-8660-859341a31421/ar_seinakonsolin_purku_ja_pakkausohje.pdf','Seinäkonsolin purku- ja pakkausohje · AR'],
  ['Pakkausohje-ARS-silloitus-fi.pdf','https://telinekataja.fi/media/filer_public/73/1b/731b1d51-857f-49c4-aae4-8b000f4d0d28/ars_silloituksen_purku_ja_pakkausohje.pdf','Silloituksen purku- ja pakkausohje · ARS'],
  ['Pakkausohje-FW-silloitus-fi.pdf','https://telinekataja.fi/media/filer_public/4c/2b/4c2b33b6-eae9-412c-8dce-f9613f6120ea/fw_silloituksen_purku_ja_pakkausohje.pdf','Silloituksen purku- ja pakkausohje · FW'],
  ['Kalustonippuohje-AR-fi-en-et.pdf','https://telinekataja.fi/media/filer_public/46/9f/469f0843-05c3-4eb8-8f73-7b3738875b09/kalustonuippuohje-ar-fin-eng-est.pdf','Kalustonippuohje · AR · suomi, englanti, viro'],
  ['Kalustonippuohje-KH-KHXL-fi-en-et.pdf','https://telinekataja.fi/media/filer_public/38/ac/38ac2d3c-5366-43ff-87d7-97b0ee0c59ed/kalustonippuohje-kh-khxl-fin-eng-est.pdf','Kalustonippuohje · KH/KH XL · suomi, englanti, viro'],
  ['Pakkaus-varastointi-kuljetus-KH-kattopeitteet-fi.pdf','https://telinekataja.fi/media/filer_public/de/ce/dece0523-1fee-4b4d-a863-70bce99af665/kh-kattopeitteiden-pakkaus-varastointi-kuljetus.pdf','KH-kattopeitteiden pakkaus, varastointi ja kuljetus'],
  ['Pakkaus-varastointi-kuljetus-KH-katusekate-et.pdf','https://telinekataja.fi/media/filer_public/47/13/4713d1f8-5b11-400f-bb4b-9e4a26924894/kh-katusekatede-pakkimine-ladustamine-ja-transport.pdf','KH-katusekatteiden pakkaus, varastointi ja kuljetus · viro'],
  ['Packing-storage-transport-KH-tarpaulins-en.pdf','https://telinekataja.fi/media/filer_public/0e/1e/0e1e5e42-b200-429e-b39a-bb01c7ae2e8d/packing-storage-and-transport-of-the-kh-tarpaulins.pdf','Packing, storage and transport of KH tarpaulins · English'],
  ['Pakkausohje-siirtokiskot-pyorastot-fi.pdf','https://telinekataja.fi/media/filer_public/42/89/42898d60-8746-4c7d-b436-ca8369c50947/siirtokiskojen_ja_pyorastojen_purku_ja_pakkausohje.pdf','Siirtokiskojen ja pyörästöjen purku- ja pakkausohje'],
  ['Layher-Allround-Catalogue-en-2021.pdf','https://telinekataja.fi/media/filer_public/b0/50/b050d79c-e4a0-4f69-868c-72d8031b08da/en_allround_catalogue_2021.pdf','Layher Allround Catalogue 2021 · English'],
  ['Layher-Protective-Systems-Catalogue-en-2021.pdf','https://telinekataja.fi/media/filer_public/85/20/85200166-fb2f-4dba-8512-91ea77f33786/en_protective_system_catalogue_2021.pdf','Layher Protective Systems Catalogue 2021 · English'],
  ['Layher-Access-Technology-Catalogue-en-2017.pdf','https://telinekataja.fi/media/filer_public/ef/28/ef2891e1-fe53-415e-baa3-e6e2f4a869de/access_technology_catalogue_2017.pdf','Layher Access Technology Catalogue 2017 · English'],
  ['Layher-Blitz-Catalogue-en-2021.pdf','https://telinekataja.fi/media/filer_public/55/3a/553a0739-df6b-4f44-8912-f39f48ec0db7/en_speedy_catalogue_2021.pdf','Layher Blitz Catalogue 2021 · English'],
  ['Layher-Accessories-Catalogue-en-2021.pdf','https://telinekataja.fi/media/filer_public/78/14/78144995-86c2-4431-9e3b-205c6db5f2ee/en_system-free_accessories_catalogue_2021.pdf','Layher Accessories Catalogue 2021 · English'],
  ['Layher-Event-Catalogue-en-2021.pdf','https://telinekataja.fi/media/filer_public/1f/e9/1fe9a16f-e6c0-4e62-a098-bacbe87ad7de/en_event_catalogue_2021.pdf','Layher Event Catalogue 2021 · English'],
];

async function fetchOne([name, sourceUrl, title]) {
  const target = path.join(destination, name);
  let bytes;
  if (fs.existsSync(target) && fs.readFileSync(target).subarray(0,5).toString() === '%PDF-') bytes = fs.readFileSync(target);
  else {
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(300000), headers: { 'User-Agent': 'TelineHallinta document archive/1.0' } });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.subarray(0,5).toString() !== '%PDF-') throw new Error(`${name}: response was not PDF`);
    fs.writeFileSync(target, bytes);
  }
  return {name,title,sourceUrl,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),localPath:`/data/mms-archive/telinekataja/catalogs/${encodeURIComponent(name)}`};
}

(async () => {
  fs.mkdirSync(destination, {recursive:true});
  const results = new Array(documents.length);
  let next = 0;
  await Promise.all(Array.from({length:3}, async () => {
    while (next < documents.length) {
      const index = next++;
      try { results[index] = {status:'fulfilled',value:await fetchOne(documents[index])}; }
      catch (reason) { results[index] = {status:'rejected',reason}; }
    }
  }));
  const ok = results.filter(x=>x.status==='fulfilled').map(x=>x.value);
  const failed = results.filter(x=>x.status==='rejected').map(x=>String(x.reason));
  fs.writeFileSync(path.join(destination,'sources.json'), `${JSON.stringify({sourcePage,retrievedAt:new Date().toISOString(),documents:ok,failed},null,2)}\n`);
  console.log(JSON.stringify({downloaded:ok.length,failed},null,2));
  if (failed.length) process.exitCode=1;
})();
