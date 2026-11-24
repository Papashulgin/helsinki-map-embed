#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../public-static/data/mms-archive');
const categories = [
  ['EVENT', 'Tapahtuma- ja katsomotelineet'],
  ['FACADE', 'Julkisivu-, korjaus- ja ripustetut telineet'],
  ['INDUSTRY', 'Teollisuus-, silta- ja infrastruktuurikohteet'],
  ['NAVAL', 'Laiva- ja telakkaympäristöt'],
  ['AVIATION', 'Ilmailuympäristön mallit'],
];
const vendors = [
  ['ALFIX', 'alfix', '/assets/logos/manufacturers/alfix.png'],
  ['HAKI', 'haki', '/assets/logos/manufacturers/haki.webp'],
  ['Hünnebeck', 'huennebeck', ''],
  ['Doka', 'doka', ''],
  ['Layher · Telinekataja', 'telinekataja', ''],
  ['Tianjin Wellmade Scaffold · Kwikstage', 'wellmade', ''],
  ['TOBLER AG', 'tobler-ag', '/assets/logos/manufacturers/tobler.svg'],
  ['AT-PAC', 'at-pac', '/assets/logos/manufacturers/at-pac.webp'],
  ['SCAFOM-RUX', 'scafom-rux', '/assets/logos/manufacturers/scafomrux.svg'],
];
function listFiles(dir, prefix) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(absolute, path.posix.join(prefix, entry.name));
    if (!/\.(pdf|zip)$/i.test(entry.name)) return [];
    return [{ name: entry.name, url: `/data/mms-archive/${encodeURI(path.posix.join(prefix, entry.name))}`, bytes: fs.statSync(absolute).size }];
  }).sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
const data = {
  title: 'MMS · paikallinen valmistaja- ja 3D-arkisto',
  vendors: vendors.map(([name, folder, logo]) => ({
    name,
    logo,
    ...(folder === 'alfix' ? { priceCatalogUrl: '/data/mms-archive/alfix/catalogs/alfix-price-list.html' } : {}),
    ...(['alfix','haki','huennebeck','doka','scafom-rux'].includes(folder) ? { archiveUrl: `/archive/scaffold-manuals/index.html#${folder}` } : {}),
    ...(folder === 'telinekataja' ? { archiveUrl: '/archive/telinekataja/index.html' } : {}),
    ...(folder === 'wellmade' ? { archiveUrl: '/archive/kwikstage/index.html' } : {}),
    files: listFiles(path.join(root, folder, 'catalogs'), `${folder}/catalogs`),
  })),
  categories: categories.map(([name, description]) => ({
    name,
    description,
    files: listFiles(path.join(root, '3d-models', name), `3d-models/${name}`),
  })),
  notes: [
    'Toimittajien käyttöoppaat ja mallien sisältö on tarkistettava alkuperäiseltä valmistajalta ennen suunnittelua tai hankintaa.',
    '3D-luokat ovat tiedostointia nimien perusteella; ne eivät vahvista mallin sisältöä tai teknistä kelpoisuutta.',
    'AT-PAC-katalogeja tai AVIATION-malleja ei ollut toimitetussa aineistossa.',
    'Kaksi cathedral PERI ZIPiä oli SHA-256-tarkistussummaltaan identtisiä; arkistossa säilytetään yksi kopio.',
  ],
};
const jsonPath = path.join(root, 'manifest.json');
const jsPath = path.resolve(__dirname, '../public-static/data/mms-archive.js');
fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync(jsPath, `/* Generated from data/mms-archive/manifest.json; do not edit by hand. */\nwindow.workspaceMmsArchiveData=${JSON.stringify(data)};\n`);
console.log(`MMS archive manifest written: ${data.vendors.reduce((n, v) => n + v.files.length, 0)} manuals and catalogues; ${data.categories.reduce((n, c) => n + c.files.length, 0)} 3D bundles.`);
