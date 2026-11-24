'use strict';

const EPSG_3879_DEF = '+proj=tmerc +lat_0=0 +lon_0=25 +k=1 +x_0=25500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs';
const HAKI_MANUAL_URL = 'https://api.haki.com/storage/media/891c12fc-c878-4217-911c-330920eb16ee/manual_haki_universal_international_en.pdf';

const HAKI_UNIVERSAL_2024 = Object.freeze({
  id: 'haki-universal',
  manufacturer: 'HAKI',
  name: 'HAKI Universal',
  manualRevision: 'International User Manual, © HAKI AB 2024',
  manualUrl: HAKI_MANUAL_URL,
  manualBayLengthM: 3.05,
  manualLiftHeightM: 2,
  manualBayWidthsM: Object.freeze([0.7, 0.77, 1.01, 1.25, 1.655]),
  selectedBayWidthM: 0.77,
  catalogStatus: 'verified-primary-source-selected-items',
  components: Object.freeze([
    { key: 'base-jack', itemNo: '2071000', name: 'Base jack BS', size: 'säädettävä 55–570 mm', weightKg: 5, page: 4, recipe: '2 tukijalkaa per pystylinja' },
    { key: 'standard-2000', itemNo: '7016200', name: 'Standard S 2000', size: '2000 mm', weightKg: 10.1, page: 4, recipe: '2 pystyriviä × pystylinjat × nousut' },
    { key: 'ledger-3050', itemNo: '7021302', name: 'Ledger beam LBL 3050', size: '3050 mm', weightKg: 12.3, page: 4, recipe: '2 pitkittäisriviä × kentät × nousut' },
    { key: 'transom-770', itemNo: '7022073', name: 'Single tube beam ERB 770', size: '770 mm', weightKg: 3.6, page: 5, recipe: 'poikittaispalkki jokaiselle pystylinjalle ja nousulle' },
    { key: 'guardrail-3050', itemNo: '7052304', name: 'Guardrail frame GFL 3050', size: '3050 mm', weightKg: 10.5, page: 5, recipe: 'Automaattisesti 1 ulkoreunan kehys / kenttä / jokainen käyttäjän merkitsemä työtaso' },
    { key: 'deck-3050-600', itemNo: '4071308', name: 'Decking Unit W=600 mm · AL', size: '3050 × 600 mm', weightKg: 18.5, page: 6, recipe: '1 yksikkö / kenttä / käyttäjän merkitsemä työtaso' },
    { key: 'toeboard-3050', itemNo: '4161301', name: 'Toeboard AL 3050', size: '3050 mm', weightKg: 5.5, page: 6, recipe: 'Automaattisesti 1 ulkoreunan varvaslauta / kenttä / jokainen käyttäjän merkitsemä työtaso' },
    { key: 'diagonal-3050', itemNo: '7121304', name: 'Diagonal brace DS 3050', size: '3050 mm bay · L=3450 mm', weightKg: 14.2, page: 5, recipe: 'määrä jätetään suunnittelijan sidonta- ja jäykistyssuunnitelmasta' },
  ].map((item) => Object.freeze({
    ...item,
    manufacturer: 'HAKI',
    system: 'HAKI Universal',
    catalogRevision: 'User Manual International 2024',
    source: HAKI_MANUAL_URL,
    sourcePage: item.page,
    dataStatus: 'verified-from-original-manual',
  }))),
});

const LAYHER_ALLROUND = Object.freeze({
  id: 'layher-allround', manufacturer: 'Layher', name: 'Allround Scaffolding',
  manualRevision: 'Asennus- ja käyttöohje 04/2018',
  manualUrl: '/archive/layher-allround/Layher-Allround-Asennus-ja-kayttoohje-fi-2018-04.pdf',
  catalogUrl: '/archive/layher-allround/Layher-Allround-Catalogue-en-2021.pdf',
  catalogRevision: 'Allround Catalogue 2021/2022, Edition 04.2021',
  // Catalogue lengths used by the local ledger rows. The bay is the measured
  // node-to-node distance selected for this draft; compatibility still needs review.
  bays: Object.freeze([
    { lengthM: .50, itemNo: '2601.050', name: 'Allround O-ledger LW, steel, metric', weightKg: 2.2 },
    { lengthM: .73, itemNo: '2601.073', name: 'Allround O-ledger LW', weightKg: 2.9, diagonalItemNo: '2683.073', diagonalWeightKg: 7.1 },
    { lengthM: 1, itemNo: '2601.100', name: 'Allround O-ledger LW, steel, metric', weightKg: 3.7, diagonalItemNo: '2683.100', diagonalWeightKg: 7.3 },
    { lengthM: 1.09, itemNo: '2601.109', name: 'Allround O-ledger LW', weightKg: 4.0, diagonalItemNo: '2683.109', diagonalWeightKg: 7.0 },
    { lengthM: 1.40, itemNo: '2601.140', name: 'Allround O-ledger LW', weightKg: 5.0, diagonalItemNo: '2683.140', diagonalWeightKg: 7.9 },
    { lengthM: 1.50, itemNo: '2601.150', name: 'Allround O-ledger LW, steel, metric', weightKg: 5.3 },
    { lengthM: 1.57, itemNo: '2601.157', name: 'Allround O-ledger LW', weightKg: 5.5, diagonalItemNo: '2683.157', diagonalWeightKg: 8.2 },
    { lengthM: 2, itemNo: '2601.200', name: 'Allround O-ledger LW, steel, metric', weightKg: 6.8, diagonalItemNo: '2683.200', diagonalWeightKg: 8.8 },
    { lengthM: 2.07, itemNo: '2601.207', name: 'Allround O-ledger LW', weightKg: 7.0, diagonalItemNo: '2683.207', diagonalWeightKg: 8.9 },
    { lengthM: 2.50, itemNo: '2601.250', name: 'Allround O-ledger LW, steel, metric', weightKg: 8.3, diagonalItemNo: '2683.250', diagonalWeightKg: 9.9 },
    { lengthM: 2.57, itemNo: '2601.257', name: 'Allround O-ledger LW', weightKg: 8.5, diagonalItemNo: '2683.257', diagonalWeightKg: 10.0 },
    { lengthM: 3, itemNo: '2601.300', name: 'Allround O-ledger LW, steel, metric', weightKg: 9.9, diagonalItemNo: '2683.300', diagonalWeightKg: 11.0 },
    { lengthM: 3.07, itemNo: '2601.307', name: 'Allround O-ledger LW', weightKg: 10.1, diagonalItemNo: '2683.307', diagonalWeightKg: 11.1 },
  ].map(Object.freeze)),
});

const LAYHER_O_STEEL_TOE_BOARDS = Object.freeze([
  { lengthM: 0.73, itemNo: '2643.073', weightKg: 1.7 },
  { lengthM: 1.09, itemNo: '2643.109', weightKg: 2.4 },
  { lengthM: 1.40, itemNo: '2643.140', weightKg: 3.0 },
  { lengthM: 1.57, itemNo: '2643.157', weightKg: 3.3 },
  { lengthM: 2.07, itemNo: '2643.207', weightKg: 4.3 },
  { lengthM: 2.57, itemNo: '2643.257', weightKg: 5.3 },
  { lengthM: 3.07, itemNo: '2643.307', weightKg: 6.2 },
].map(Object.freeze));

const LAYHER_KEDER_XL = Object.freeze({
  id: 'layher-keder-xl', manufacturer: 'Layher', name: 'Keder Roof XL',
  manualRevision: 'Keder Roof XL Manual, Edition 01.2014',
  manualUrl: '/archive/layher-keder-xl/Keder-Roof-XL-Manual-PDF.pdf',
  catalogRevision: 'Keder Roof XL Manual, Edition 01.2014',
  maximumRoofBayM: 2.57,
  supportAxisOptionsM: Object.freeze([0.73, 1.09]),
  // Manual p. 6, double-pitch roof 18 degrees. Tarp lengths are the source
  // table values; exact 5972.xxx tarp stock codes are deferred to current list.
  doublePitch18: Object.freeze([
    [5.90, 0, 0, 10.50, 5.80], [9.70, 2, 0, 14.50, 9.60],
    [11.60, 0, 2, 16.50, 11.50], [13.50, 4, 0, 18.50, 13.40],
    [15.40, 2, 2, 20.50, 15.30], [17.30, 0, 4, 22.50, 17.20],
    [19.20, 4, 2, 24.50, 19.10], [21.10, 2, 4, 26.50, 21.00],
    [23.00, 0, 6, 28.50, 22.90], [24.90, 4, 4, 30.50, 24.80],
    [26.80, 2, 6, 32.50, 26.70], [28.70, 0, 8, 34.50, 28.60],
    [30.60, 4, 6, 36.50, 30.50], [32.50, 2, 8, 38.50, 32.40],
  ].map(([roofWidthM, lattice2m, lattice3m, roofTarpLengthM, gableTarpLengthM]) => Object.freeze({ roofWidthM, eavesSections: 2, ridgeSections: 1, lattice2m, lattice3m, roofTarpLengthM, gableTarpLengthM }))),
});

function deriveLayherKederRoof(input = {}) {
  if (!input.enabled) return { enabled: false, valid: false, system: { id: LAYHER_KEDER_XL.id, name: LAYHER_KEDER_XL.name, manualRevision: LAYHER_KEDER_XL.manualRevision, manualUrl: LAYHER_KEDER_XL.manualUrl }, dimensions: null, bom: [], warnings: [], unresolved: [] };
  const supportAxisM = Number(input.supportAxisM ?? 0.73);
  const bracingVariant = ['light', 'standard', 'heavy'].includes(input.bracingVariant) ? input.bracingVariant : 'standard';
  const facades = Array.isArray(input.facades) ? input.facades.slice(0, 2) : [];
  const unresolved = [];
  const warnings = [];
  if (!LAYHER_KEDER_XL.supportAxisOptionsM.includes(supportAxisM)) unresolved.push({ id: 'keder-axis', label: 'Keder XL -tukikehän akselimitta', reason: 'Valitse ohjeen mukainen 0,73 m tai 1,09 m tukikehä.' });
  if (facades.length !== 2) unresolved.push({ id: 'keder-opposite-facades', label: 'Sääsuojan vastakkaiset julkisivut', reason: 'Valitse mallista kaksi vastakkaista ja keskenään yhdensuuntaista julkisivua.' });
  const endpoints = facades.map((face) => {
    const start = Array.isArray(face?.start) && face.start.slice(0, 2).every(Number.isFinite) ? face.start.slice(0, 2).map(Number) : null;
    const end = Array.isArray(face?.end) && face.end.slice(0, 2).every(Number.isFinite) ? face.end.slice(0, 2).map(Number) : null;
    if (!start || !end) return null;
    const dx = end[0] - start[0], dy = end[1] - start[1], lengthM = Math.hypot(dx, dy);
    return { ...face, start, end, direction: [dx / (lengthM || 1), dy / (lengthM || 1)], lengthM };
  });
  let roofLine = null;
  if (endpoints.length === 2 && endpoints.every(Boolean)) {
    const [a, b] = endpoints;
    const dot = Math.abs(a.direction[0] * b.direction[0] + a.direction[1] * b.direction[1]);
    const axisSep = a.ringSize === b.ringSize && Number.isInteger(a.index) && Number.isInteger(b.index) && a.ringSize >= 4
      ? Math.min((a.index - b.index + a.ringSize) % a.ringSize, (b.index - a.index + a.ringSize) % a.ringSize) : null;
    const adjacent = axisSep === 1 || axisSep === a.ringSize - 1;
    const opposite = axisSep == null || (a.ringSize % 2 === 0 && axisSep === a.ringSize / 2);
    const midA = [(a.start[0] + a.end[0]) / 2, (a.start[1] + a.end[1]) / 2];
    const midB = [(b.start[0] + b.end[0]) / 2, (b.start[1] + b.end[1]) / 2];
    const separationM = Math.abs((midB[0] - midA[0]) * a.direction[1] - (midB[1] - midA[1]) * a.direction[0]);
    const lengthMismatch = Math.abs(a.lengthM - b.lengthM) / Math.max(a.lengthM, b.lengthM, 0.001);
    if (dot < Math.cos(Math.PI / 60) || separationM < 0.1 || adjacent || !opposite || lengthMismatch > 0.1) {
      unresolved.push({ id: 'keder-facade-pair-geometry', label: 'Vastakkaisten julkisivujen geometria', reason: 'Valittujen sivujen pitää olla erilliset, yhdensuuntaiset ja pituudeltaan yhteensopivat. Epäsäännöllinen tai vino pohja pitää sovittaa käsin.' });
    } else if (supportAxisM > 0) {
      const roofLengthM = Math.min(a.lengthM, b.lengthM);
      const nominalExternalM = separationM + supportAxisM;
      const nominalInternalM = Math.max(0, separationM - supportAxisM);
      const row = LAYHER_KEDER_XL.doublePitch18.find((item) => item.roofWidthM + 1e-8 >= nominalExternalM);
      if (!row) unresolved.push({ id: 'keder-span-table', label: 'Kattotuolin jänneväli', reason: `Ohjeen 18° taulukko ei kata vaadittua ulkonimellismittaa ${nominalExternalM.toFixed(2)} m (enimmäisleveys 32,50 m).` });
      else {
        const roofBayCount = Math.max(1, Math.ceil((roofLengthM - 1e-8) / LAYHER_KEDER_XL.maximumRoofBayM));
        const roofBayLengthsM = Array.from({ length: roofBayCount }, (_, index) => Number((index === roofBayCount - 1 ? roofLengthM - LAYHER_KEDER_XL.maximumRoofBayM * (roofBayCount - 1) : LAYHER_KEDER_XL.maximumRoofBayM).toFixed(3)));
        const slopeLengthM = row.roofWidthM / (2 * Math.cos(Math.PI / 10));
        const intervalM = bracingVariant === 'heavy' ? 1 : 2;
        const braceStationsPerSlope = Math.max(1, Math.ceil(slopeLengthM / intervalM));
        const trussCount = roofBayCount + 1;
        roofLine = {
          facadeA: { source: String(a.source || ''), index: Number(a.index), label: String(a.label || `Julkisivu ${Number(a.index) + 1}`), start: a.start, end: a.end, lengthM: a.lengthM },
          facadeB: { source: String(b.source || ''), index: Number(b.index), label: String(b.label || `Julkisivu ${Number(b.index) + 1}`), start: b.start, end: b.end, lengthM: b.lengthM },
          roofLengthM, supportSpanM: separationM, supportAxisM, nominalExternalM, nominalInternalM,
          roofWidthM: row.roofWidthM, roofRiseM: Number((row.roofWidthM / 2 * Math.tan(Math.PI / 10)).toFixed(3)),
          roofBayCount, roofBayLengthsM, trussCount, slopeLengthM: Number(slopeLengthM.toFixed(3)), bracingVariant,
          braceStationsPerSlope, lattice2m: row.lattice2m, lattice3m: row.lattice3m,
          roofTarpLengthM: row.roofTarpLengthM, gableTarpLengthM: row.gableTarpLengthM,
        };
      }
    }
  }
  const bom = [];
  const row = (item) => {
    if (!item.quantity || item.quantity <= 0) return;
    bom.push({ ...item, manufacturer: 'Layher', system: LAYHER_KEDER_XL.name, unit: 'kpl', unitWeightKg: item.weightKg ?? null, totalWeightKg: item.weightKg == null ? null : Number((item.weightKg * item.quantity).toFixed(1)), source: LAYHER_KEDER_XL.manualUrl, catalogRevision: LAYHER_KEDER_XL.catalogRevision, dataStatus: item.dataStatus || 'manual-based-geometric-draft', quantityStatus: item.quantityStatus || 'calculated-geometric-draft' });
  };
  if (roofLine) {
    const c = roofLine, trusses = c.trussCount, jointsPerTruss = 2 + c.lattice2m + c.lattice3m;
    row({ id: 'keder-xl-eaves-section', itemNo: '5975.100', name: 'Keder Roof XL -räystäsosa', size: '2,00 m', quantity: 2 * trusses, weightKg: 14.3, sourcePage: 32, recipe: `2 kpl / kattotuoli × ${trusses} kattotuolia` });
    row({ id: 'keder-xl-ridge-section-18', itemNo: '5975.110', name: 'Keder Roof XL -harjaosa 18°', size: '2,10 m', quantity: trusses, weightKg: 24.5, sourcePage: 32, recipe: `1 kpl / kattotuoli × ${trusses} kattotuolia` });
    row({ id: 'keder-xl-lattice-beam-2m', itemNo: '5975.200', name: 'Keder Roof XL -alumiiniristikko', size: '2,00 m', quantity: c.lattice2m * trusses, weightKg: 17.3, sourcePage: 32, recipe: `${c.lattice2m} kpl / kattotuoli × ${trusses}` });
    row({ id: 'keder-xl-lattice-beam-3m', itemNo: '5975.300', name: 'Keder Roof XL -alumiiniristikko', size: '3,00 m', quantity: c.lattice3m * trusses, weightKg: 24.4, sourcePage: 32, recipe: `${c.lattice3m} kpl / kattotuoli × ${trusses}` });
    const supportItem = supportAxisM === 1.09 ? { itemNo: '5975.109', size: '1,09 m', weightKg: 22.4 } : { itemNo: '5975.073', size: '0,73 m', weightKg: 19.1 };
    row({ id: 'keder-xl-support', ...supportItem, name: 'Keder Roof XL -kattotuki', quantity: 2 * trusses, sourcePage: 33, recipe: `2 kpl / kattotuoli × ${trusses} kattotuolia` });
    row({ id: 'keder-xl-locking-pin', itemNo: '4000.001', name: 'Lukitustappi', size: 'Ø11 mm', quantity: 2 * trusses, weightKg: 0.2, sourcePage: 36, recipe: `1 / kattotuki; tarkista tuen liitostapa` });
    row({ id: 'keder-xl-roof-brace', itemNo: '5940.257', name: 'Keder Roof XL -jäykiste', size: '2,57 m kattotuoliväli', quantity: 2 * c.braceStationsPerSlope * c.roofBayCount, weightKg: 10, sourcePage: 32, recipe: `2 lappeella × ${c.braceStationsPerSlope} asemaa / lape × ${c.roofBayCount} kattotuoliväliä; ${c.bracingVariant}-jako` });
    row({ id: 'keder-xl-roof-ledger', itemNo: '5972.257', name: 'Keder-katon vaakajuoksu', size: '2,57 m', quantity: 2 * c.braceStationsPerSlope * c.roofBayCount, weightKg: 4.2, sourcePage: 32, recipe: `Ohjeen poikittaisjäykistyksen luonnos: 2 lappeen vaakajuoksut × asemat × kattotuolivälit` });
    const horizontalItem = c.bracingVariant === 'light' ? { itemNo: '5939.200', name: 'Vaakadiagonaali 2 m jaolla', weightKg: 5.0 } : { itemNo: '5939.100', name: 'Vaakadiagonaali 1 m jaolla', weightKg: 4.2 };
    const diagonalCount = c.bracingVariant === 'light' ? 2 * Math.max(1, c.braceStationsPerSlope - 1) * c.roofBayCount : 2 * c.braceStationsPerSlope * c.roofBayCount;
    row({ id: 'keder-xl-horizontal-diagonal', ...horizontalItem, size: c.bracingVariant === 'light' ? '3,37 m · 2 m tolppaväli' : '2,87 m · 1 m tolppaväli', quantity: diagonalCount, sourcePage: 32, recipe: `${c.bracingVariant}-jäykistysvaihtoehdon geometrinen määräluonnos` });
    row({ id: 'keder-xl-joint-seal', itemNo: '5971.001', name: 'Keder-kiskon tiiviste', size: 'yläpaarteen liitos', quantity: jointsPerTruss * trusses, weightKg: 0.1, sourcePage: 33, recipe: `${jointsPerTruss} yläpaarteen liitosta / kattotuoli × ${trusses}` });
    row({ id: 'keder-xl-bolt-60', itemNo: '4905.060', name: 'Erikoispultti M12 × 60 mm mutterilla', size: 'alapaarteen liitos', quantity: 2 * jointsPerTruss * trusses, weightKg: 0.1, sourcePage: 33, recipe: '2 kpl / kattotuolin jatkos; vaihtoehtona valmistajan hyväksymä Ø12 tappi' });
    row({ id: 'keder-xl-bolt-90', itemNo: '5975.090', name: 'Erikoispultti M12 × 90 mm mutterilla', size: 'yläpaarteen liitos', quantity: 2 * jointsPerTruss * trusses, weightKg: 0.1, sourcePage: 33, recipe: '2 kpl / kattotuolin jatkos; vaihtoehtona tappi ja varmistustappi' });
    row({ id: 'keder-xl-tarpaulin-b1', itemNo: '5972.xxx · hinnaston tunnus tarkistettava', name: 'Keder-kattokangas B1', size: `2,57 m × ${c.roofTarpLengthM.toFixed(2)} m`, quantity: c.roofBayLengthsM.filter((length) => length > 2.07).length, weightKg: null, sourcePage: 35, recipe: 'Kangasosan tarkka tunnus ja saatavuus Layherin ajantasaisesta suojajärjestelmähinnastosta' });
    row({ id: 'keder-xl-tarpaulin-b2', itemNo: '5972.xxx · hinnaston tunnus tarkistettava', name: 'Keder-kattokangas B2', size: `2,07 m × ${c.roofTarpLengthM.toFixed(2)} m`, quantity: c.roofBayLengthsM.filter((length) => length <= 2.07).length, weightKg: null, sourcePage: 35, recipe: 'Sovitus lyhyeen viimeiseen kenttään pitää vahvistaa hinnastosta' });
    row({ id: 'keder-xl-insertion-set', itemNo: '5971.400', name: 'Kattokankaan asennussarja', size: '3,00 m', quantity: 1, weightKg: 5.8, sourcePage: 34, recipe: 'Kankaan vetoon koko suojakaton asennuksessa' });
    warnings.push(`Kattotuolijako on enintään ${LAYHER_KEDER_XL.maximumRoofBayM.toFixed(2)} m. Kattokankaiden 5972.xxx-tuotetunnukset ja määrä varmistetaan ajantasaisesta hinnastosta.`);
    warnings.push(`Keder XL:n tuuli-, lumi-, sidonta-, perustamis- ja kokonaisvakausmitoitus sekä tukitelineen erillinen tarkistus puuttuvat tästä luonnoksesta.`);
    unresolved.push({ id: 'keder-tie-choice', label: 'Kattotuolin vetoside', reason: 'Ohjeen kuormataulukot erottelevat vetoside- ja sidettömät kokoonpanot; valinta, osat ja kuormat pitää vahvistaa rakennesuunnittelussa.' });
    unresolved.push({ id: 'keder-gable-and-clips', label: 'Päätykankaat ja kangaskiinnikkeet', reason: 'Päätykankaita tarvitaan jännevälistä riippuen 2 tai 4 osaa; kangaskiinnikkeiden jako on ohjeen mukaan 30–40 cm keskialueella. Vahvista kappalemäärät ja 5972.xxx-tunnukset hinnastosta.' });
    unresolved.push({ id: 'keder-support-scaffold', label: 'Layher Allround -tukiteline', reason: 'Kattojen tuet tarvitsevat lukitukset ja kokonaisrakenteen vakavuuden; tukiteline, ankkurointi, ballastointi ja kuormansiirto maahan mitoitetaan tapauskohtaisesti.' });
    unresolved.push({ id: 'keder-load-check', label: 'Sääsuojan kuormitus ja hyväksyntä', reason: 'Manuaalin mukainen geometria ei mitoita paikallista tuulta, lunta, sidontoja, tukitelineen perustamista eikä kokonaisvakavuutta.' });
    if (Number(input.loadClass) >= 4) warnings.push(`Layher-telineen kuormaluokka ${Number(input.loadClass)} ei määritä Keder Roof XL:n kuormankestoa; katon kuormat ja tukiteline on tarkistettava erikseen.`);
    if (c.roofBayLengthsM.some((length) => Math.abs(length - 2.57) > 0.01 && Math.abs(length - 2.07) > 0.01)) unresolved.push({ id: 'keder-last-tarp-module', label: 'Viimeisen kattokankaan mitoitus', reason: 'Viimeinen kattotuoliväli ei ole ohjeessa mainittu 2,57 m (B1) tai 2,07 m (B2). Varmista katkaisu/saatavuus Layherin hinnastosta ennen tilausta.' });
  }
  if (!roofLine && !unresolved.length) unresolved.push({ id: 'keder-roof-pair', label: 'Keder Roof XL -geometria', reason: 'Valitse vastakkaiset julkisivut, jotta katon jänneväli ja osataulukko voidaan määrittää.' });
  return {
    enabled: true, valid: Boolean(roofLine), system: { id: LAYHER_KEDER_XL.id, manufacturer: LAYHER_KEDER_XL.manufacturer, name: LAYHER_KEDER_XL.name, manualRevision: LAYHER_KEDER_XL.manualRevision, manualUrl: LAYHER_KEDER_XL.manualUrl, catalogRevision: LAYHER_KEDER_XL.catalogRevision },
    dimensions: roofLine, bom, warnings, unresolved,
    calculationBoundary: 'Layher Keder Roof XL Manual Edition 01.2014 -taulukkoon perustuva geometrinen osaluonnos; ei kuormamitoitus eikä asennushyväksyntä.',
  };
}

function registerCrs(proj4) {
  if (!proj4 || typeof proj4.defs !== 'function') throw new TypeError('proj4-kirjastoa ei ole ladattu.');
  proj4.defs('EPSG:3879', EPSG_3879_DEF);
  proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs +type=crs');
}

function projectCoordinate(coord, sourceCrs = 'EPSG:4326', proj4Impl) {
  if (!Array.isArray(coord) || coord.length < 2 || !coord.slice(0, 2).every(Number.isFinite)) {
    throw new TypeError('Koordinaatin pitää sisältää kaksi äärellistä lukua.');
  }
  const proj = proj4Impl || (typeof window !== 'undefined' ? window.proj4 : require('proj4'));
  registerCrs(proj);
  const normalized = String(sourceCrs || '').toUpperCase();
  let result;
  if (normalized === 'EPSG:3879' || normalized === 'ETRS-GK25' || normalized === 'GK25FIN') result = [Number(coord[0]), Number(coord[1])];
  else if (normalized === 'EPSG:4326' || normalized === 'CRS:84' || normalized === 'WGS84') result = proj('EPSG:4326', 'EPSG:3879', [Number(coord[0]), Number(coord[1])]);
  else if (normalized === 'EPSG:3067' || normalized === 'ETRS-TM35FIN') result = proj('EPSG:3067', 'EPSG:3879', [Number(coord[0]), Number(coord[1])]);
  else throw new RangeError(`Tuntematon lähdekoordinaatisto: ${sourceCrs}`);
  if (!result.slice(0, 2).every(Number.isFinite)) throw new RangeError('Koordinaattimuunnos tuotti virheellisen tuloksen.');
  return [result[0], result[1]];
}

function unprojectCoordinate(coord, targetCrs = 'EPSG:4326', proj4Impl) {
  if (!Array.isArray(coord) || coord.length < 2 || !coord.slice(0, 2).every(Number.isFinite)) throw new TypeError('Koordinaatin pitää sisältää kaksi äärellistä lukua.');
  const proj = proj4Impl || (typeof window !== 'undefined' ? window.proj4 : require('proj4'));
  registerCrs(proj);
  const normalized = String(targetCrs || '').toUpperCase();
  if (normalized === 'EPSG:3879' || normalized === 'ETRS-GK25' || normalized === 'GK25FIN') return [Number(coord[0]), Number(coord[1])];
  if (!['EPSG:4326', 'CRS:84', 'WGS84', 'EPSG:3067', 'ETRS-TM35FIN'].includes(normalized)) throw new RangeError(`Tuntematon kohdekoordinaatisto: ${targetCrs}`);
  const output = ['EPSG:3067', 'ETRS-TM35FIN'].includes(normalized) ? 'EPSG:3067' : 'EPSG:4326';
  const result = proj('EPSG:3879', output, [Number(coord[0]), Number(coord[1])]);
  if (!result.slice(0, 2).every(Number.isFinite)) throw new RangeError('Koordinaattimuunnos tuotti virheellisen tuloksen.');
  return [result[0], result[1]];
}

function cleanRing(ring) {
  if (!Array.isArray(ring)) return [];
  const points = ring.filter((p) => Array.isArray(p) && p.length >= 2 && p.slice(0, 2).every(Number.isFinite)).map((p) => [Number(p[0]), Number(p[1])]);
  if (points.length > 1 && Math.hypot(points[0][0] - points.at(-1)[0], points[0][1] - points.at(-1)[1]) < 1e-6) points.pop();
  return points;
}

function parseObjMass(source) {
  const text = String(source ?? '');
  const axes = text.match(/^#\s*Coordinate system[:=][^\r\n]*\bup\s*=\s*([XYZ])\b/im);
  const verticalAxis = axes?.[1]?.toLowerCase() || (/^#\s*Teline(?:Hallinta|konttori) CAD OBJ\b/im.test(text) ? 'z' : 'y');
  const vertices = [], faces = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'v' && parts.length >= 4) {
      const point = parts.slice(1, 4).map(Number);
      if (point.every(Number.isFinite)) vertices.push(point);
    } else if (parts[0] === 'f' && parts.length >= 4) {
      const indexes = parts.slice(1).map((item) => Number(item.split('/')[0])).map((index) => index < 0 ? vertices.length + index : index - 1);
      for (let index = 1; index < indexes.length - 1; index += 1) {
        const face = [indexes[0], indexes[index], indexes[index + 1]];
        if (face.every((vertex) => Number.isInteger(vertex) && vertex >= 0 && vertex < vertices.length)) faces.push(face);
      }
    }
  }
  if (vertices.length < 3) throw new Error('OBJ-tiedostosta ei löytynyt pisteitä.');
  const toYUp = verticalAxis === 'z' ? ([x, y, z]) => [x, z, y]
    : verticalAxis === 'x' ? ([x, y, z]) => [y, x, z]
      : ([x, y, z]) => [x, y, z];
  const normalizedVertices = vertices.map(toYUp);
  const min = [0, 1, 2].map((axis) => Math.min(...normalizedVertices.map((point) => point[axis])));
  const max = [0, 1, 2].map((axis) => Math.max(...normalizedVertices.map((point) => point[axis])));
  return {
    vertices: normalizedVertices,
    faces,
    sourceVerticalAxis: verticalAxis.toUpperCase(),
    bounds: { width: max[0] - min[0] || 1, height: max[1] - min[1] || 1, depth: max[2] - min[2] || 1 },
    min,
    max,
  };
}

function polygonMetrics(ring) {
  const points = cleanRing(ring);
  if (points.length < 3) return { points, perimeterM: 0, areaM2: 0, sides: [], longestSide: null, secondarySide: null, bounds: null };
  const sides = points.map((a, index) => {
    const b = points[(index + 1) % points.length];
    return { index, start: a, end: b, lengthM: Math.hypot(b[0] - a[0], b[1] - a[1]) };
  }).filter((side) => side.lengthM > 0.001);
  const doubleArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const longestSide = sides.reduce((best, side) => !best || side.lengthM > best.lengthM ? side : best, null);
  const secondarySide = sides.filter((side) => side.lengthM < longestSide.lengthM - 0.01).reduce((best, side) => !best || side.lengthM > best.lengthM ? side : best, null) || longestSide;
  return {
    points,
    perimeterM: sides.reduce((sum, side) => sum + side.lengthM, 0),
    areaM2: Math.abs(doubleArea) / 2,
    sides,
    longestSide,
    secondarySide,
    bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
  };
}

function objFacadeSides(model) {
  const points = [...new Map((model?.vertices || []).filter((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[2]))
    .map((point) => [`${Number(point[0]).toFixed(6)},${Number(point[2]).toFixed(6)}`, [Number(point[0]), Number(point[2])]])).values()]
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (points.length < 3) return [];
  const cross = (origin, a, b) => (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
  const lower = [];
  for (const point of points) { while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), point) <= 1e-8) lower.pop(); lower.push(point); }
  const upper = [];
  for (const point of [...points].reverse()) { while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), point) <= 1e-8) upper.pop(); upper.push(point); }
  lower.pop(); upper.pop();
  const hull = lower.concat(upper);
  if (hull.length < 3) return [];
  return hull.map((start, index) => {
    const end = hull[(index + 1) % hull.length];
    return { index, label: `Julkisivu ${index + 1}`, start, end, lengthM: Math.hypot(end[0] - start[0], end[1] - start[1]) };
  });
}

function projectRing(ring, sourceCrs, proj4Impl) {
  return cleanRing(ring).map((point) => projectCoordinate(point, sourceCrs, proj4Impl));
}

function cityJsonGroundRing(feature, cityJson, options = {}) {
  const vertices = cityJson?.vertices;
  if (!Array.isArray(vertices)) return null;
  const scale = cityJson.transform?.scale || [1, 1, 1];
  const translate = cityJson.transform?.translate || [0, 0, 0];
  const rings = [];
  const readRing = (indexes) => {
    const points = indexes.map((index) => {
      const point = vertices[index];
      if (!Array.isArray(point) || point.length < 3) return null;
      return point.slice(0, 3).map((value, axis) => Number(value) * Number(scale[axis] ?? 1) + Number(translate[axis] ?? 0));
    });
    if (points.some((point) => !point || !point.every(Number.isFinite))) return;
    if (points.length > 1 && indexes[0] === indexes.at(-1)) points.pop();
    if (new Set(points.map((point) => `${point[0]},${point[1]},${point[2]}`)).size < 3) return;
    const zValues = points.map((point) => point[2]);
    if (Math.max(...zValues) - Math.min(...zValues) > (Number(options.planarityToleranceM) || 0.15)) return;
    const area2 = points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0);
    const areaM2 = Math.abs(area2) / 2;
    if (areaM2 > 0.01) rings.push({ points, baseZ: Math.min(...zValues), areaM2 });
  };
  const visit = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 3 && node.every(Number.isInteger)) readRing(node);
    else node.forEach(visit);
  };
  for (const geometry of Array.isArray(feature?.geometry) ? feature.geometry : []) visit(geometry.boundaries);
  if (!rings.length) return null;
  const lowest = Math.min(...rings.map((ring) => ring.baseZ));
  const baseTolerance = Number(options.baseToleranceM) || 0.25;
  const baseRings = rings.filter((ring) => ring.baseZ <= lowest + baseTolerance);
  baseRings.sort((a, b) => b.areaM2 - a.areaM2);
  return baseRings[0].points.map(([x, y]) => [x, y]);
}

function cityJsonVerticalExtent(feature, cityJson) {
  const vertices = cityJson?.vertices;
  if (Array.isArray(vertices)) {
    const scale = cityJson.transform?.scale || [1, 1, 1], translate = cityJson.transform?.translate || [0, 0, 0], indexes = new Set();
    const visit = (node) => {
      if (!Array.isArray(node)) return;
      if (node.length && node.every(Number.isInteger)) for (const index of node) indexes.add(index);
      else node.forEach(visit);
    };
    for (const geometry of Array.isArray(feature?.geometry) ? feature.geometry : []) visit(geometry.boundaries);
    const values = [...indexes].map((index) => {
      const point = vertices[index];
      if (!Array.isArray(point) || point.length < 3) return NaN;
      return Number(point[2]) * Number(scale[2] ?? 1) + Number(translate[2] ?? 0);
    }).filter(Number.isFinite);
    if (values.length) {
      let minZ = Infinity, maxZ = -Infinity;
      for (const value of values) { minZ = Math.min(minZ, value); maxZ = Math.max(maxZ, value); }
      return { minZ, maxZ, heightM: maxZ - minZ, vertexCount: values.length, method: 'CityJSON-vertex-Z-extent' };
    }
  }
  const coordinates = [];
  const visitCoordinates = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 3 && node.slice(0, 3).every((value) => Number.isFinite(Number(value)))) coordinates.push(Number(node[2]));
    else node.forEach(visitCoordinates);
  };
  visitCoordinates(feature?.geometry?.coordinates);
  if (coordinates.length) {
    let minZ = Infinity, maxZ = -Infinity;
    for (const value of coordinates) { minZ = Math.min(minZ, value); maxZ = Math.max(maxZ, value); }
    return { minZ, maxZ, heightM: maxZ - minZ, vertexCount: coordinates.length, method: 'GeoJSON-vertex-Z-extent' };
  }
  return null;
}

function parseAsciiGrid(input, options = {}) {
  const source = String(input || '').replace(/^\uFEFF/, '');
  if (source.length > (Number(options.maxTextBytes) || 80_000_000)) throw new RangeError('ASCII Grid -tiedosto on liian suuri selaimessa käsiteltäväksi. Rajaa vienti rakennuksen ympärille ja kokeile uudelleen.');
  const lines = source.split(/\r?\n/);
  const header = {};
  let dataStart = 0;
  for (; dataStart < lines.length; dataStart += 1) {
    const line = lines[dataStart].trim();
    if (!line) continue;
    const match = line.match(/^([a-z_]+)\s+([-+]?\d*\.?\d+(?:e[-+]?\d+)?)/i);
    if (!match || !['ncols', 'nrows', 'xllcorner', 'xllcenter', 'yllcorner', 'yllcenter', 'cellsize', 'nodata_value'].includes(match[1].toLowerCase())) break;
    header[match[1].toLowerCase()] = Number(match[2]);
  }
  const ncols = Math.floor(header.ncols), nrows = Math.floor(header.nrows), cellSizeM = Number(header.cellsize);
  const xCorner = Number.isFinite(header.xllcorner), yCorner = Number.isFinite(header.yllcorner), xCenter = Number.isFinite(header.xllcenter), yCenter = Number.isFinite(header.yllcenter);
  const xOrigin = Number(xCorner ? header.xllcorner : header.xllcenter), yOrigin = Number(yCorner ? header.yllcorner : header.yllcenter);
  if (!Number.isInteger(ncols) || !Number.isInteger(nrows) || ncols < 1 || nrows < 1 || ncols * nrows > 5_000_000 || !Number.isFinite(cellSizeM) || cellSizeM <= 0 || !Number.isFinite(xOrigin) || !Number.isFinite(yOrigin) || xCorner === xCenter || yCorner === yCenter) {
    throw new TypeError('ASCII Grid -otsakkeesta pitää löytyä sarakkeet, rivit, solukoko, xllcorner/xllcenter ja yllcorner/yllcenter. Ruudukon enimmäiskoko on 5 miljoonaa solua.');
  }
  const values = [];
  for (let row = dataStart; row < lines.length; row += 1) {
    const line = lines[row].trim();
    if (!line) continue;
    const rowValues = line.split(/\s+/).map(Number);
    if (rowValues.length !== ncols || rowValues.some((value) => !Number.isFinite(value))) throw new TypeError(`ASCII Grid -tiedoston rivillä ${values.length + 1} on virheellinen solumäärä tai korkeus.`);
    values.push(rowValues);
  }
  if (values.length !== nrows) throw new TypeError(`ASCII Grid -tiedostossa ilmoitetaan ${nrows} riviä, mutta tiedostossa on ${values.length}.`);
  return { ncols, nrows, cellSizeM, xOrigin, yOrigin, xCenterOffsetM: xCorner ? cellSizeM / 2 : 0, yCenterOffsetM: yCorner ? cellSizeM / 2 : 0, noDataValue: Number.isFinite(header.nodata_value) ? header.nodata_value : -9999, values };
}

function terrainGridCenter(grid, row, col) {
  return [grid.xOrigin + (col * grid.cellSizeM) + grid.xCenterOffsetM, grid.yOrigin + ((grid.nrows - 1 - row) * grid.cellSizeM) + grid.yCenterOffsetM];
}

function pointInsideRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > point[1]) !== (yj > point[1])) && point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || 1e-20) + xi) inside = !inside;
  }
  return inside;
}

function pointRingDistance(point, ring) {
  let minimum = Infinity;
  for (let index = 0; index < ring.length; index += 1) {
    const start = ring[index], end = ring[(index + 1) % ring.length], dx = end[0] - start[0], dy = end[1] - start[1];
    const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy || 1)));
    minimum = Math.min(minimum, Math.hypot(point[0] - start[0] - t * dx, point[1] - start[1] - t * dy));
  }
  return minimum;
}

function analyzeTerrainGrid(grid, footprint, sourceCrs = 'EPSG:3067', proj4Impl, options = {}) {
  const ring = cleanRing(footprint);
  if (ring.length < 3) throw new TypeError('Maaston laskentaa varten tarvitaan vähintään kolmen pisteen rakennuspolygon.');
  if (!grid?.values || grid.values.length !== grid.nrows) throw new TypeError('Korkeusruudukko ei ole kelvollinen.');
  const projected = ring.map((point) => unprojectCoordinate(point, sourceCrs, proj4Impl));
  const minX = Math.min(...projected.map((point) => point[0])) - 10.5, maxX = Math.max(...projected.map((point) => point[0])) + 10.5;
  const minY = Math.min(...projected.map((point) => point[1])) - 10.5, maxY = Math.max(...projected.map((point) => point[1])) + 10.5;
  const colAt = (x) => Math.floor((x - grid.xOrigin - grid.xCenterOffsetM) / grid.cellSizeM + 0.5);
  const rowAt = (y) => grid.nrows - 1 - Math.floor((y - grid.yOrigin - grid.yCenterOffsetM) / grid.cellSizeM + 0.5);
  const colMin = Math.max(0, Math.min(grid.ncols - 1, colAt(minX))), colMax = Math.max(0, Math.min(grid.ncols - 1, colAt(maxX)));
  const rowMin = Math.max(0, Math.min(grid.nrows - 1, rowAt(maxY))), rowMax = Math.max(0, Math.min(grid.nrows - 1, rowAt(minY)));
  const bands = [
    { id: '0-2', minDistanceM: 0, maxDistanceM: 2, color: '#e49a3a', count: 0, minElevationM: null, maxElevationM: null, elevationSumM: 0 },
    { id: '2-5', minDistanceM: 2, maxDistanceM: 5, color: '#41a78b', count: 0, minElevationM: null, maxElevationM: null, elevationSumM: 0 },
    { id: '5-10', minDistanceM: 5, maxDistanceM: 10.5, color: '#4886bd', count: 0, minElevationM: null, maxElevationM: null, elevationSumM: 0 },
  ];
  const allSamples = [];
  for (let row = rowMin; row <= rowMax; row += 1) for (let col = colMin; col <= colMax; col += 1) {
    const elevation = Number(grid.values[row]?.[col]);
    if (!Number.isFinite(elevation) || Math.abs(elevation - grid.noDataValue) < 1e-9) continue;
    const coordinate = terrainGridCenter(grid, row, col), projectPoint = projectCoordinate(coordinate, sourceCrs, proj4Impl);
    if (pointInsideRing(projectPoint, ring)) continue;
    const distanceM = pointRingDistance(projectPoint, ring);
    const bandIndex = distanceM < 2 ? 0 : distanceM < 5 ? 1 : distanceM <= 10 ? 2 : -1;
    if (bandIndex < 0) continue;
    const band = bands[bandIndex];
    band.count += 1;
    band.elevationSumM += elevation;
    band.minElevationM = band.minElevationM == null ? elevation : Math.min(band.minElevationM, elevation);
    band.maxElevationM = band.maxElevationM == null ? elevation : Math.max(band.maxElevationM, elevation);
    allSamples.push({ x: projectPoint[0], y: projectPoint[1], z: elevation, distanceM, bandIndex });
  }
  const referenceBand = bands.find((band) => band.count), reference = referenceBand ? referenceBand.elevationSumM / referenceBand.count : NaN;
  for (const band of bands) {
    band.meanElevationM = band.count ? band.elevationSumM / band.count : null;
    band.elevationRangeM = band.count ? band.maxElevationM - band.minElevationM : null;
    band.differenceFromReferenceM = band.count && Number.isFinite(reference) ? band.meanElevationM - reference : null;
    delete band.elevationSumM;
  }
  const maxSamples = Math.max(30, Math.min(2500, Math.floor(Number(options.maxSamples) || 2200)));
  const step = Math.max(1, Math.ceil(allSamples.length / maxSamples));
  const samples = allSamples.filter((_, index) => index % step === 0).map((sample) => ({ ...sample, z: Number(sample.z.toFixed(2)), distanceM: Number(sample.distanceM.toFixed(2)) }));
  const persistMaxSamples = Math.max(20, Math.min(240, Math.floor(Number(options.persistMaxSamples) || 120)));
  const persistStep = Math.max(1, Math.ceil(samples.length / persistMaxSamples));
  return {
    crs: 'EPSG:3879', sourceCrs: String(sourceCrs), cellSizeM: grid.cellSizeM,
    referenceElevationM: Number.isFinite(reference) ? Number(reference.toFixed(2)) : null,
    referenceBandId: referenceBand?.id || null,
    bands, sampleCount: allSamples.length,
    samples,
    persistedSamples: samples.filter((_, index) => index % persistStep === 0).map((sample) => [Number(sample.x.toFixed(2)), Number(sample.y.toFixed(2)), sample.z, sample.bandIndex]),
  };
}

function normalizedLevels(value, maxLevels) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(/[;,\s]+/);
  const levels = [...new Set(raw.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= maxLevels))].sort((a, b) => a - b);
  return levels;
}

function chooseLayherBayLayout(targetLengthM, requestedBays = null, toeBoardCompatibleOnly = false) {
  const limitCm = Math.floor(targetLengthM * 100 + 1e-7);
  const maxBays = requestedBays == null || requestedBays === '' ? 100 : Number(requestedBays);
  const components = toeBoardCompatibleOnly
    ? LAYHER_ALLROUND.bays.filter((bay) => LAYHER_O_STEEL_TOE_BOARDS.some((toeBoard) => Math.abs(toeBoard.lengthM - bay.lengthM) < 0.001))
    : LAYHER_ALLROUND.bays;
  const best = Array(limitCm + 1).fill(null);
  best[0] = [];
  for (let cm = 1; cm <= limitCm; cm += 1) {
    for (const component of components) {
      const size = Math.round(component.lengthM * 100);
      if (cm < size || !best[cm - size] || best[cm - size].length >= maxBays) continue;
      const candidate = [...best[cm - size], component];
      if (!best[cm] || candidate.length < best[cm].length) best[cm] = candidate;
    }
  }
  let layout = best[limitCm];
  if (!layout) {
    for (let cm = limitCm; cm >= 0; cm -= 1) {
      if (best[cm]) { layout = best[cm]; break; }
    }
  }
  return layout || [];
}

function deriveLayherAllround(input = {}) {
  const targetLengthM = Number(input.targetLengthM ?? input.length ?? 0);
  const targetHeightM = Number(input.targetHeightM ?? input.height ?? 0);
  if (!Number.isFinite(targetLengthM) || targetLengthM < 0 || targetLengthM > 300) throw new RangeError('Julkisivun tavoitepituuden on oltava välillä 0–300 m.');
  if (!Number.isFinite(targetHeightM) || targetHeightM < 0 || targetHeightM > 120) throw new RangeError('Telinekorkeuden on oltava välillä 0–120 m.');
  const requestedBays = input.bayCount ?? input.manualBayCount;
  if (requestedBays != null && requestedBays !== '') {
    const count = Number(requestedBays);
    if (!Number.isInteger(count) || count < 0 || count > 100) throw new RangeError('Kenttien enimmäismäärän pitää olla kokonaisluku välillä 0–100.');
  }
  const loadClass = Number(input.loadClass ?? 3);
  if (!Number.isInteger(loadClass) || loadClass < 1 || loadClass > 6) throw new RangeError('Kuormaluokan pitää olla kokonaisluku 1–6.');
  const liftHeightM = 2;
  const lifts = targetHeightM > 0 ? Math.ceil((targetHeightM - 1e-8) / liftHeightM) : 0;
  const platformLevels = normalizedLevels(input.platformLevels ?? input.deckedLifts ?? '', lifts);
  const layout = chooseLayherBayLayout(targetLengthM, requestedBays, platformLevels.length > 0);
  const bays = layout.length;
  const bayLengthsM = layout.map((item) => item.lengthM);
  const modeledLengthM = Number(bayLengthsM.reduce((sum, length) => sum + length, 0).toFixed(3));
  const lengthDifferenceM = Number((targetLengthM - modeledLengthM).toFixed(3));
  const bayLengthM = bays ? Math.max(...bayLengthsM) : 0;
  const supportLines = bays + 1;
  const standards = supportLines * 2 * lifts;
  const basePlates = supportLines * 2;
  const ledgersByLength = new Map();
  for (const bay of layout) {
    const key = bay.itemNo;
    ledgersByLength.set(key, { bay, quantity: (ledgersByLength.get(key)?.quantity || 0) + 2 * (lifts + 1) });
  }
  // The Finnish Layher manual calls for vertical bracing at least in every
  // fifth bay. A continuous brace line contains one brace per lift interval.
  const braceBayIndexes = bays ? Array.from({ length: Math.ceil(bays / 5) }, (_, index) => {
    const start = index * 5, end = Math.min(bays - 1, start + 4);
    for (let bay = end; bay >= start; bay -= 1) if (layout[bay]?.diagonalItemNo) return bay;
    return end;
  }) : [];
  const braceStations = braceBayIndexes.length;
  const diagonalQuantity = braceStations * lifts;
  const sourcePage = (page) => page;
  const bom = [];
  const row = (item) => bom.push({
    ...item, unit: 'kpl', unitWeightKg: item.weightKg ?? null,
    totalWeightKg: item.weightKg == null ? null : Number((item.weightKg * item.quantity).toFixed(1)),
    source: item.source || LAYHER_ALLROUND.catalogUrl, catalogRevision: LAYHER_ALLROUND.catalogRevision,
    dataStatus: 'catalogue-reference-review-required', quantityStatus: 'calculated-geometric-draft',
  });
  if (basePlates) row({ id: 'layher-base-plate-60', itemNo: '4001.060', manufacturer: 'Layher', system: LAYHER_ALLROUND.name, name: 'Base plate 60', size: 'säätöjalan tyyppi tarkistettava', quantity: basePlates, weightKg: 3.6, sourcePage: sourcePage(11), recipe: '2 pohjalevyä per pystylinja; alustan ja säätöalueen valinta suunnittelijalta' });
  if (standards) row({ id: 'layher-standard-2000', itemNo: '2603.200', manufacturer: 'Layher', system: LAYHER_ALLROUND.name, name: 'Standard, steel, with pressed-in spigot', size: '2.00 m', quantity: standards, weightKg: 10.1, sourcePage: sourcePage(13), recipe: '2 pystyriviä × (kentät + 1) pystylinjaa × 2 m nousuja' });
  for (const { bay, quantity } of ledgersByLength.values()) row({ id: `layher-ledger-${bay.itemNo}`, itemNo: bay.itemNo, manufacturer: 'Layher', system: LAYHER_ALLROUND.name, name: bay.name, size: `${bay.lengthM.toFixed(2)} m`, quantity, weightKg: bay.weightKg, sourcePage: 17, recipe: `2 pitkittäisriviä × ${lifts + 1} vaakatasoa × ${quantity / (2 * (lifts + 1))} tämän mittaista kenttää` });
  if (platformLevels.length) {
    const guardrailsByLedger = new Map();
    for (const bay of layout) {
      const existing = guardrailsByLedger.get(bay.itemNo) || { bay, bays: 0 };
      existing.bays += 1;
      guardrailsByLedger.set(bay.itemNo, existing);
    }
    for (const { bay, bays: bayCount } of guardrailsByLedger.values()) row({
      id: `layher-platform-guardrail-${bay.itemNo}`, itemNo: bay.itemNo, manufacturer: 'Layher', system: LAYHER_ALLROUND.name,
      name: 'Allround O-juoksu · käsijohde ja välijohde', size: `${bay.lengthM.toFixed(2)} m · 2 vaakajuoksua / työtaso`,
      quantity: 2 * bayCount * platformLevels.length, weightKg: bay.weightKg, sourcePage: 17,
      recipe: `Automaattinen suojaus: käsijohde + välijohde telineen ulkosivulle, 2 juoksua × ${bayCount} kenttää × ${platformLevels.length} valittua työtasoa; asennuskorkeus ja liittymät tarkistettava ohjeesta`,
    });
  }
  const toeBoardsByItem = new Map(), unsupportedToeBoardLengths = new Set();
  if (platformLevels.length) for (const bay of layout) {
    const toeBoard = LAYHER_O_STEEL_TOE_BOARDS.find((item) => Math.abs(item.lengthM - bay.lengthM) < 0.001);
    if (!toeBoard) { unsupportedToeBoardLengths.add(bay.lengthM); continue; }
    const existing = toeBoardsByItem.get(toeBoard.itemNo) || { toeBoard, bays: 0 };
    existing.bays += 1;
    toeBoardsByItem.set(toeBoard.itemNo, existing);
  }
  for (const { toeBoard, bays: bayCount } of toeBoardsByItem.values()) row({
    id: `layher-toeboard-o-steel-${toeBoard.itemNo}`, itemNo: toeBoard.itemNo, manufacturer: 'Layher', system: LAYHER_ALLROUND.name,
    name: 'O-teräsjalkalista T18', size: `${toeBoard.lengthM.toFixed(2)} × 0.15 m`,
    quantity: bayCount * platformLevels.length, weightKg: toeBoard.weightKg, sourcePage: 31,
    recipe: `Automaattinen varvaslauta (jalkalista): 1 ulkoreuna / kenttä / ${platformLevels.length} valittua työtasoa`,
  });
  const diagonalRefs = new Map();
  for (const index of braceBayIndexes) {
    const bay = layout[index], itemNo = bay?.diagonalItemNo || `ei katalogiviitettä · ${bay?.lengthM?.toFixed(2) || '?'} m × 2.00 m`;
    diagonalRefs.set(itemNo, { bay, quantity: (diagonalRefs.get(itemNo)?.quantity || 0) + lifts });
  }
  for (const [itemNo, entry] of diagonalRefs) if (entry.quantity > 0) row({ id: `layher-diagonal-${itemNo.replace(/[^a-z0-9]+/gi, '-')}`, itemNo, manufacturer: 'Layher', system: LAYHER_ALLROUND.name, name: 'Diagonal brace LW, steel', size: `${entry.bay.lengthM.toFixed(2)} × 2.00 m`, quantity: entry.quantity, weightKg: entry.bay.diagonalWeightKg, source: LAYHER_ALLROUND.catalogUrl, sourcePage: 21, recipe: `${entry.quantity / Math.max(1, lifts)} jäykistyslinja × ${lifts} nousuväliä; vähintään joka 5. kenttä` });
  const warnings = [];
  if (lengthDifferenceM > .001) warnings.push(`${lengthDifferenceM.toFixed(2)} m julkisivusta jää kattamatta. Kenttäjako optimoitiin Layherin katalogin nimellispituuksista ilman ylitystä.`);
  if (platformLevels.length && lengthDifferenceM > .001) warnings.push('Työtasojen jalkalistojen vuoksi kenttäjako käyttää O-teräsjalkalistan tuoteluettelosta löytyviä yhteensopivia pituuksia; lyhyttä päätemittaa ei korvata pidemmällä osalla.');
  if (requestedBays != null && requestedBays !== '' && bays < Number(requestedBays)) warnings.push(`Kenttien enimmäismäärä ${requestedBays}; tavoitepituutta ei saatu kokonaan katettua tällä rajalla.`);
  if (targetHeightM - Math.floor(targetHeightM / liftHeightM) * liftHeightM > .001) warnings.push('Korkeus pyöristyy 2,00 m nousuun; ylin taso ylittää tavoitekorkeuden. Tarkista kokoonpano ohjeesta.');
  if (loadClass >= 4 && bays) warnings.push(`Kuormaluokka ${loadClass}: Layher-ohje varoittaa, että suuri kuormaluokka voi vaatia tiheämpää jäykistystä; luokkakohtaista väliä ei anneta tässä laskennassa, joten diagonaalijako tarkistettava suunnittelijalla.`);
  if (!platformLevels.length) warnings.push('Työtasojen nousuja ei ole määritetty. Kun työtaso merkitään, sen käsijohteet, välijohteet ja yhteensopivat varvaslaudat lisätään automaattisesti BOMiin.');
  return {
    system: { id: LAYHER_ALLROUND.id, manufacturer: LAYHER_ALLROUND.manufacturer, name: LAYHER_ALLROUND.name, manualRevision: LAYHER_ALLROUND.manualRevision, manualUrl: LAYHER_ALLROUND.manualUrl, catalogRevision: LAYHER_ALLROUND.catalogRevision, catalogStatus: 'local-catalogue-data-draft' },
    dimensions: { targetLengthM, modeledLengthM, lengthDifferenceM, uncoveredLengthM: Math.max(0, lengthDifferenceM), overrunLengthM: 0, targetHeightM, modeledHeightM: Number((lifts * liftHeightM).toFixed(3)), heightOverrunM: Number((lifts * liftHeightM - targetHeightM).toFixed(3)), bayLengthM, bayLengthsM, bayStartsM: bayLengthsM.reduce((starts, length) => [...starts, Number((starts.at(-1) + length).toFixed(3))], [0]).slice(0, -1), bayWidthM: null, liftHeightM, bays, manualBayCount: requestedBays == null || requestedBays === '' ? null : Number(requestedBays), lifts, supportLines, supportLegs: basePlates, platformLevels, loadClass, braceStations, braceBayIndexes, diagonalQuantity },
    bom,
    unresolved: [
      { id: 'deck-width', label: 'Telineleveys ja työtasot', reason: 'Valitse kuormaluokkaan ja Allround-katalogin taulukkoon sopiva U-juoksu-, taso- ja leveyskokoonpano.' },
      { id: 'transoms-guardrails', label: 'Telineleveys, poikittaisjuoksut ja päätykaiteet', reason: `Telineen leveys ja päätyjen sivusuojaus pitää määrittää. ${platformLevels.length ? 'Valittujen työtasojen ulkosivun käsijohde ja välijohde on laskettu Layherin O-juoksuina.' : 'Ulkosivun kaiteet lasketaan, kun työtasojen nousut on valittu.'}` },
      ...(platformLevels.length ? [{ id: 'platform-end-protection', label: 'Työtasojen sisä- ja päätyreunojen suojaus', reason: 'Tämä julkisivuluonnos laskee pitkän ulkoreunan kaiteet ja jalkalistat. Sisäreunan seinäväli, telineen poikittaisleveys sekä kenttien päätyjen kaiteet ja jalkalistat ratkaistaan, kun leveys ja päätykokoonpano on määritetty.' }] : []),
      { id: 'bracing-load-path', label: 'Kolmiulotteinen jäykistys ja kuormareitti', reason: 'BOM laskee vain Layher-ohjeen mukaisen julkisivudiagonaalien geometrisen vähimmäisluonnoksen (vähintään joka viides kenttä). Poikittais- ja vaakatasojäykistys, päiden ja aukkojen kierto, sidonnat, peitteiden tuulikuorma sekä pystytys- ja purkuvaiheet on tarkistettava kokonaisesta rakennesuunnitelmasta. Kaide ei automaattisesti korvaa jäykistettä.' },
      { id: 'ties-anchors', label: 'Sidonnat ja ankkurointi', reason: 'Tarve ja sijoittelu vaativat rakennus-, tuuli- ja kuormakohtaisen suunnitelman.' },
      { id: 'foundations', label: 'Alusta, pohjalevyt ja kantavuus', reason: 'Alustan kantavuus, kuormanjako ja säätöjalkojen valinta on tarkistettava.' },
      { id: 'access', label: 'Nousutiet ja kulkuturvallisuus', reason: 'Portaat, nousutiet ja putoamissuojaus eivät sisälly perusreseptin BOMiin.' },
      { id: 'structural-review', label: 'Rakenteellinen mitoitus ja hyväksyntä', reason: 'Geometrinen BOM ei laske tuulta, kapasiteetteja, sidontaa eikä vakavuutta.' },
    ],
    warnings,
    status: bays > 0 && lifts > 0 && platformLevels.length ? 'draft-open-items' : 'incomplete',
    calculationBoundary: 'Layher-katalogiin ja asennusohjeen vähimmäisjulkisivudiagonaaliin perustuva geometrinen luonnos; poikittais- ja vaakatasojäykistys, sidonnat, tuulikuorma, kuormareitin jatkuvuus ja vaihekohtainen vakavuus eivät sisälly. Ei kokoonpanohyväksyntä eikä rakenteellinen mitoitus.',
  };
}

function deriveHakiUniversal(input = {}) {
  const selectedSystem = input.system || input.scaffoldSystem || 'layher-allround';
  if (selectedSystem === 'layher-allround' || selectedSystem === 'Layher Allround') return deriveLayherAllround(input);
  const targetLengthM = Number(input.targetLengthM ?? input.length ?? 0);
  const targetHeightM = Number(input.targetHeightM ?? input.height ?? 0);
  const platformLevelsInput = input.platformLevels ?? input.deckedLifts ?? '';
  if (!Number.isFinite(targetLengthM) || targetLengthM < 0 || targetLengthM > 300) throw new RangeError('Julkisivun tavoitepituuden on oltava välillä 0–300 m.');
  if (!Number.isFinite(targetHeightM) || targetHeightM < 0 || targetHeightM > 120) throw new RangeError('Telinekorkeuden on oltava välillä 0–120 m.');
  const bayLengthM = HAKI_UNIVERSAL_2024.manualBayLengthM;
  const liftHeightM = HAKI_UNIVERSAL_2024.manualLiftHeightM;
  const requestedBays = input.bayCount ?? input.manualBayCount;
  if (requestedBays != null && requestedBays !== '') {
    const parsed = Number(requestedBays);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) throw new RangeError('Kenttien määrän pitää olla kokonaisluku välillä 0–100.');
  }
  const bays = requestedBays == null || requestedBays === ''
    ? Math.floor((targetLengthM + 1e-8) / bayLengthM)
    : Number(requestedBays);
  const lifts = targetHeightM > 0 ? Math.ceil((targetHeightM - 1e-8) / liftHeightM) : 0;
  const modeledLengthM = Number((bays * bayLengthM).toFixed(3));
  const lengthDifferenceM = Number((targetLengthM - modeledLengthM).toFixed(3));
  const modeledHeightM = Number((lifts * liftHeightM).toFixed(3));
  const platformLevels = normalizedLevels(platformLevelsInput, lifts);
  const supportLines = bays + 1;
  const supportLegs = bays > 0 ? supportLines * 2 : 0;
  const counts = {
    'base-jack': supportLegs,
    'standard-2000': supportLegs * lifts,
    'ledger-3050': 2 * bays * lifts,
    'transom-770': supportLines * lifts,
    'guardrail-3050': bays * platformLevels.length,
    'deck-3050-600': bays * platformLevels.length,
    'toeboard-3050': bays * platformLevels.length,
  };
  const bom = HAKI_UNIVERSAL_2024.components.filter((component) => counts[component.key] > 0).map((component) => ({
    id: component.key,
    itemNo: component.itemNo,
    manufacturer: component.manufacturer,
    system: component.system,
    name: component.name,
    size: component.size,
    unit: 'kpl',
    quantity: counts[component.key],
    unitWeightKg: component.weightKg,
    totalWeightKg: Number((component.weightKg * counts[component.key]).toFixed(1)),
    source: component.source,
    sourcePage: component.sourcePage,
    catalogRevision: component.catalogRevision,
    dataStatus: component.dataStatus,
    quantityStatus: 'calculated-geometric-draft',
    recipe: component.recipe,
  }));
  const unresolved = [
    { id: 'facade-bracing', label: 'Julkisivun diagonaalijäykistys', reason: 'Määrä ja sijoittelu jätetään suunnittelijan jäykistyssuunnitelman mukaan; automaattista määrää ei arvata. Tarkista myös poikittais- ja vaakatasojäykistys sekä jatkuva kuormareitti.', suggestedItemNo: '7121304' },
    { id: 'ties-anchors', label: 'Sidonnat ja ankkurointi', reason: 'Tarve, paikka ja kestävyys vaativat rakennus- ja kuormakohtaisen suunnitelman.' },
    { id: 'foundations', label: 'Alusta, pohjalevyt ja kantavuus', reason: 'Kantavuutta ja painumaa ei johdeta rakennusgeometriasta.' },
    { id: 'access', label: 'Nousutiet, portaat ja kulkuturvallisuus', reason: 'Kulkureitti ja nousukomponentit eivät sisälly perusreseptin määrään.' },
    { id: 'edge-protection', label: 'Päätyjen ja paluukulmien reunasuojaus', reason: 'Perusresepti laskee vain julkisivun pitkän ulkoreunan; päät ja palautukset pitää täydentää.' },
    { id: 'structural-review', label: 'Rakenteellinen mitoitus ja hyväksyntä', reason: 'Tämä moduuli ei laske kuormia, kestävyyksiä, tuulta eikä vakavuutta.' },
  ];
  const warnings = [];
  if (bays === 0 && targetLengthM > 0) warnings.push(`Tavoitepituus ${targetLengthM.toFixed(2)} m on alle HAKI Universal -manuaalin 3,05 m kentän; yhtään täyttä kenttää ei muodostettu.`);
  if (lengthDifferenceM > 0.001) warnings.push(`${lengthDifferenceM.toFixed(2)} m julkisivusta jää kattamatta. Kenttiä ei venytetty tai pyöristetty yli tavoitteen.`);
  if (lengthDifferenceM < -0.001) warnings.push(`${Math.abs(lengthDifferenceM).toFixed(2)} m teline ylittää julkisivun tavoitepituuden valitun kenttämäärän vuoksi. Tarkista sijoittelu.`);
  if (modeledHeightM - targetHeightM > 0.001) warnings.push(`Moduulirunko on ${(modeledHeightM - targetHeightM).toFixed(2)} m tavoitekorkeutta korkeampi; tarkista korkeus ja standardikokoonpano suunnitelmasta.`);
  if (!platformLevels.length) warnings.push('Työtasojen nousuja ei ole määritetty. Kun työtaso merkitään, HAKI-manuaalin mukaiset tasot, kaidekehykset ja varvaslaudat lisätään automaattisesti BOMiin.');
  return {
    system: { id: HAKI_UNIVERSAL_2024.id, manufacturer: HAKI_UNIVERSAL_2024.manufacturer, name: HAKI_UNIVERSAL_2024.name, manualRevision: HAKI_UNIVERSAL_2024.manualRevision, manualUrl: HAKI_MANUAL_URL, catalogStatus: HAKI_UNIVERSAL_2024.catalogStatus },
    dimensions: { targetLengthM, modeledLengthM, lengthDifferenceM, uncoveredLengthM: Math.max(0, lengthDifferenceM), overrunLengthM: Math.max(0, -lengthDifferenceM), targetHeightM, modeledHeightM, heightOverrunM: Number((modeledHeightM - targetHeightM).toFixed(3)), bayLengthM, bayWidthM: HAKI_UNIVERSAL_2024.selectedBayWidthM, liftHeightM, bays, manualBayCount: requestedBays == null || requestedBays === '' ? null : bays, lifts, supportLines, supportLegs, platformLevels },
    bom,
    unresolved,
    warnings,
    status: bays > 0 && lifts > 0 && platformLevels.length > 0 ? 'draft-open-items' : 'incomplete',
    calculationBoundary: 'Geometrinen ja dokumentoitu osamäärän luonnos. Ei valmistajan kokoonpanohyväksyntä eikä rakenteellinen mitoitus.',
  };
}

function deriveLayherStairTower(input = {}) {
  const targetHeightM = Number(input.targetHeightM ?? input.heightM ?? 20);
  if (!Number.isFinite(targetHeightM) || targetHeightM <= 0 || targetHeightM > 120) throw new RangeError('Porrastornin tavoitekorkeuden pitää olla välillä 0–120 m.');
  const bayLengthM = Number(input.bayLengthM) === 3.07 ? 3.07 : 2.57;
  const widthM = Math.max(1.4, Number(input.widthM) || 1.4);
  const liftHeightM = 2;
  const lifts = Math.ceil((targetHeightM - 1e-8) / liftHeightM);
  const modeledHeightM = Number((lifts * liftHeightM).toFixed(3));
  const loadClass = Number(input.loadClass) || 3;
  const longLedger = LAYHER_ALLROUND.bays.find((bay) => bay.lengthM === bayLengthM);
  const shortLedger = LAYHER_ALLROUND.bays.find((bay) => bay.lengthM === 1.4);
  const stairs = bayLengthM === 3.07
    ? { itemNo: '1753.307', guardrailItemNo: '2638.307', weightKg: 26.3, guardrailWeightKg: 20.1 }
    : { itemNo: '1753.257', guardrailItemNo: '2638.257', weightKg: 21.9, guardrailWeightKg: 18.1 };
  const bom = [];
  const add = (item) => bom.push({
    ...item,
    unit: 'kpl',
    unitWeightKg: item.weightKg ?? null,
    totalWeightKg: item.weightKg == null ? null : Number((item.weightKg * item.quantity).toFixed(1)),
    manufacturer: 'Layher',
    system: LAYHER_ALLROUND.name,
    source: LAYHER_ALLROUND.catalogUrl,
    catalogRevision: LAYHER_ALLROUND.catalogRevision,
    dataStatus: 'catalogue-reference-review-required',
    quantityStatus: 'calculated-geometric-draft',
  });
  add({ id: 'layher-stairtower-base-plate', itemNo: '4001.060', name: 'Porrastornin säätöjalka / pohjalevy', size: '4 tukipistettä', quantity: 4, weightKg: 3.6, sourcePage: 11, recipe: '4 pystyputkea; alustan kantavuus ja kuormanjako tarkistettava' });
  add({ id: 'layher-stairtower-standard-2000', itemNo: '2603.200', name: 'Allround-pystyputki 2,00 m', size: '2,00 m', quantity: 4 * lifts, weightKg: 10.1, sourcePage: 13, recipe: `4 pystyputkea × ${lifts} nousua` });
  add({ id: 'layher-stairtower-ledger-long', itemNo: longLedger.itemNo, name: longLedger.name, size: `${bayLengthM.toFixed(2)} m`, quantity: 2 * (lifts + 1), weightKg: longLedger.weightKg, sourcePage: 17, recipe: `2 pitkää sivua × ${lifts + 1} vaakatasoa` });
  add({ id: 'layher-stairtower-ledger-short', itemNo: shortLedger.itemNo, name: shortLedger.name, size: '1,40 m', quantity: 2 * (lifts + 1), weightKg: shortLedger.weightKg, sourcePage: 17, recipe: `2 lyhyttä sivua × ${lifts + 1} vaakatasoa; tornin vähimmäisleveys 1,40 m` });
  add({ id: `layher-platform-stairway-${bayLengthM}`, itemNo: stairs.itemNo, name: 'Platform stairway U-version · luokka A', size: `${bayLengthM.toFixed(2)} × 0,64 m · nousu 2,00 m · 2,5 kN/m²`, quantity: lifts, weightKg: stairs.weightKg, sourcePage: 39, recipe: `1 porrastaso / 2,00 m nousu × ${lifts} nousua` });
  add({ id: `layher-stairway-guardrail-${bayLengthM}`, itemNo: stairs.guardrailItemNo, name: 'Porraskaide, U-haarukka', size: `${bayLengthM.toFixed(2)} m · 2,00 m korkea`, quantity: 2 * lifts, weightKg: stairs.guardrailWeightKg, sourcePage: 39, recipe: `2 kaidetta / porrasnousu × ${lifts}; tarkista kokoonpano-ohjeesta` });
  add({ id: 'layher-stairway-internal-guardrail', itemNo: '1752.007', name: 'Sisäpuolinen T12-porraskaide', size: '2,00 m', quantity: lifts, weightKg: 13.5, sourcePage: 39, recipe: 'Laskettu vastakkaissuuntaisille porrassyöksyille; määrä tarkistettava kokoonpanokuvasta' });
  add({ id: 'layher-stairway-start-guardrail', itemNo: '1752.009', name: 'Porraskaiteen alkukaide', size: '0,90 × 1,70 m', quantity: 1, weightKg: 9.9, sourcePage: 39, recipe: '1 / porrastorni, lähtötaso' });
  add({ id: 'layher-stairwell-guardrail', itemNo: '1752.004', name: 'Porrasaukon kaide', size: 'Layher-luettelon osa', quantity: 1, weightKg: 6.2, sourcePage: 39, recipe: '1 / ylimmän tason porrastila; tarkista uloskäynnin ratkaisu' });
  add({ id: 'layher-stairway-guardrail-post', itemNo: '2638.400', name: 'Porraskaiteen pystytolppa', size: 'ylimmän tason uloskäynti', quantity: 1, weightKg: 6.1, sourcePage: 39, recipe: '1 / porrastorni' });
  add({ id: 'layher-stairway-top-o-ledger', itemNo: '2638.401', name: 'O-juoksu kiilapäällä ja U-haarukalla', size: '1,90 m · 2,57 m kenttä', quantity: 1, weightKg: 7.8, sourcePage: 39, recipe: '1 / ylimmän tason porrasaukon kaide' });
  const warnings = [];
  if (modeledHeightM - targetHeightM > .001) warnings.push(`Tornin tavoitekorkeus ${targetHeightM.toFixed(2)} m pyöristyy ${modeledHeightM.toFixed(2)} m:iin 2,00 m:n porrastasoilla.`);
  if (loadClass >= 4) warnings.push(`Julkisivun kuormaluokka ${loadClass}: luokan A porrastasolle on katalogissa ilmoitettu 2,5 kN/m²; yhteensopivuus vaatii tarkistuksen.`);
  return {
    dimensions: { targetHeightM, modeledHeightM, liftHeightM, lifts, bayLengthM, widthM, minimumWidthM: 1.4, stairFlights: lifts, stairLoadCapacityKNM2: 2.5 },
    bom,
    warnings,
    unresolved: [
      { id: 'stairtower-anchors-foundation', label: 'Porrastornin alusta, ankkurointi ja jäykistys', reason: 'Layher-ohje edellyttää alustan kantavuuden tarkistamista sekä porrastornin ankkurointia lujuuslaskelmien mukaan; niitä ei ole ratkaistu tässä geometrisessa osaluonnoksessa.' },
      { id: 'stairtower-landing-integration', label: 'Välitasot, liittyminen julkisivutelineeseen ja putoamissuojaus', reason: 'Liittymä, välitasojen kokoonpano, kulkuaukot ja suojaukset tarkistetaan kohdekohtaisesta kokoonpanokuvasta.' },
    ],
    status: 'draft-open-items',
    calculationBoundary: 'Layher Allround -katalogin osaviitteisiin sekä asennusohjeen neljän pystyputken ja vähintään 1,40 m leveyden periaatteisiin perustuva 3D- ja BOM-luonnos; ei kuorma-, vakavuus- eikä ankkurointimitoitus.',
  };
}

function priceSummary(model, pricing = {}) {
  const prices = pricing.components && typeof pricing.components === 'object' ? pricing.components : {};
  const purchase = model.bom.reduce((sum, line) => sum + line.quantity * (Number(prices[line.id]?.purchasePerUnit) || 0), 0);
  const rental = model.bom.reduce((sum, line) => {
    const row = prices[line.id] || {};
    return sum + line.quantity * (Number(row.rentalPerUnitDay) || 0) * (Number(row.rentalDays) || 0);
  }, 0);
  const labor = Array.isArray(pricing.labor) ? pricing.labor.reduce((sum, row) => sum + (Number(row.hours) || 0) * (Number(row.ratePerHour) || 0), 0) : 0;
  const transport = Array.isArray(pricing.transport) ? pricing.transport.reduce((sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.amountPerUnit) || 0), 0) : 0;
  const other = Number(pricing.otherCosts) || 0;
  const costTotal = money(purchase + rental + labor + transport + other);
  const quote = pricing.quoteTerms || {};
  const marginPercent = quote.marginPercent == null || quote.marginPercent === '' ? null : Number(quote.marginPercent);
  const vatPercent = quote.vatPercent == null || quote.vatPercent === '' ? null : Number(quote.vatPercent);
  const validRate = (value) => Number.isFinite(value) && value >= 0 && value <= 100;
  if (marginPercent !== null && (!validRate(marginPercent) || marginPercent >= 100)) throw new RangeError('Kateprosentin pitää olla välillä 0–99,99.');
  if (vatPercent !== null && !validRate(vatPercent)) throw new RangeError('ALV-prosentin pitää olla välillä 0–100.');
  const netTotal = marginPercent === null ? costTotal : money(costTotal / (1 - marginPercent / 100));
  const margin = marginPercent === null ? null : money(netTotal - costTotal);
  const vat = vatPercent === null ? null : money(netTotal * vatPercent / 100);
  const grossTotal = vatPercent === null ? null : money(netTotal + vat);
  return {
    currency: 'EUR',
    purchase: money(purchase), rental: money(rental), labor: money(labor), transport: money(transport), other: money(other),
    costTotal, total: costTotal,
    marginPercent, margin, netTotal, vatPercent, vat, grossTotal,
    quoteComplete: marginPercent !== null && vatPercent !== null,
  };
}

function money(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }

function calculateAreaPolygon(ring) { return polygonMetrics(ring).areaM2; }

const domainApi = { EPSG_3879_DEF, HAKI_MANUAL_URL, HAKI_UNIVERSAL_2024, LAYHER_ALLROUND, LAYHER_KEDER_XL, analyzeTerrainGrid, calculateAreaPolygon, cityJsonGroundRing, cityJsonVerticalExtent, deriveHakiUniversal, deriveLayherAllround, deriveLayherKederRoof, deriveLayherStairTower, objFacadeSides, parseAsciiGrid, parseObjMass, polygonMetrics, priceSummary, projectCoordinate, projectRing, unprojectCoordinate };
if (typeof module !== 'undefined' && module.exports) module.exports = domainApi;
else if (typeof globalThis !== 'undefined') globalThis.TelineDomain = domainApi;
