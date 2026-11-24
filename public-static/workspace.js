(() => {
  'use strict';

  const STORAGE_KEY = 'telinehallinta-local-workspace-v1';
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  const TODAY_ISO = toIso(TODAY);
  const PAGE_META = {
    dashboard: { label: 'Dashboard', icon: '⌖', title: 'Dashboard', description: 'Yleiskatsaus, tiimit, analytiikka ja työtilan riskit.' },
    city: { label: 'Kaupunki · asiointi', icon: '🏛', title: 'Kaupunki · asiointi ja luvat', description: 'Kaupunkikohteet, rakentamisen luvat ja viranomaisasioinnin reitit.' },
    finance: { label: 'Finance · FMS', icon: '€', title: 'Finance · FMS', description: 'Projektien budjetti-, lasku- ja talousseurannan paikallinen työtila.' },
    mobile: { label: 'Mobiili', icon: '▣', title: 'Mobiilityötila', description: 'Työvuoro, tehtävät ja viestit kenttäkäyttöön.' },
    tasks: { label: 'Tehtävät', icon: '✓', title: 'Tehtävät', description: 'Hallitse projektien ja työmaiden tehtäviä.' },
    calendar: { label: 'Kalenteri', icon: '▦', title: 'Kalenteri', description: 'Työmaat, määräajat ja työvuorot kuukausinäkymässä.' },
    time: { label: 'Työajanseuranta', icon: '◷', title: 'Työajanseuranta', description: 'Kirjaa työvuorot työmaittain ja tarkastele yhteenvetoa.' },
    profile: { label: 'Oma profiili', icon: '◉', title: 'Oma profiili', description: 'Tämän selaimen paikallisen demo-käyttäjän tiedot.' },
    certificates: { label: 'Sertifikaatit', icon: '▤', title: 'Sertifikaatit', description: 'Seuraa pätevyyksien voimassaoloa ja lisää sertifikaatteja.' },
    design: { label: 'Suunnittelu & CAD', icon: '▱', title: 'GeoBIM · Suunnittelu & CAD', description: 'Yhdistä paikkatieto, mallit, suunnittelu ja työmaakohtaiset aineistot.' },
    scaffold: { label: 'Telinekartta & piirustus', icon: '▦', title: 'Telinekartta & piirustus', description: 'Valitse rakennus Helsingin kartalta ja tee skaalattu telinehahmotelma.' },
    weather: { label: 'Sää & aika', icon: '☼', title: 'Sää ja aika · Helsinki', description: 'Ajantasainen säämalli, työmaan olosuhteet ja Suomen aikavyöhykkeen kello.' },
    osint: { label: 'Markkina- ja hankintavahti', icon: '⌕', title: 'Markkina- ja hankintavahti', description: 'Seuraa julkisia hankintoja ja markkinasignaaleja sekä lisää valitut tiedot CRM-putkeen.' },
    crm: { label: 'CRMS · Asiakkuudet', icon: '◎', title: 'Asiakkuuksien hallinta · CRMS', description: 'Customer Relationship Management System: asiakkaat, myyntivaiheet ja seuraavat toimet.' },
    bom: { label: 'BOM · WMS', icon: '▤', title: 'Materiaalit · BOM / WMS', description: 'Layher Allround on oletuskatalogi; rajaa haku järjestelmään, kokoa materiaaliluettelo ja vie CSV.' },
    wms: { label: 'WMS · Varasto', icon: '▤', title: 'Varastonhallinta · WMS', description: 'Warehouse Management System: kalusto, varastoryhmät ja saldot.' },
    lms: { label: 'LMS · Logistiikka', icon: '⇄', title: 'Logistiikan hallinta · LMS', description: 'Logistics Management System: toimitusaikataulut, kuormat ja työmaavastaanotto.' },
    logistics: { label: 'LMS · Logistiikka', icon: '⇄', title: 'Logistiikan hallinta · LMS', description: 'Logistics Management System: toimitusaikataulut, kuormat ja työmaavastaanotto.' },
    rental: { label: 'Rakennuskonevuokraamo', icon: '⚒', title: 'Rakennuskonevuokraamo · RENT', description: 'Vuokrakalusto, henkilönostimet ja työmaatoimitukset.' },
    manufacturing: { label: 'MMS · Valmistus', icon: '▦', title: 'Valmistus- ja toimittajahallinta · MMS', description: 'Manufacturing Management System: valmistajat, tuotantoryhmät ja BOM-kirjastot.' },
    legal: { label: 'Legal · Juridiikka', icon: '⚖', title: 'Legal · Juridiikan hallinta', description: 'Finlex-säädöshaku, sopimusviitteet, auditointi ja vaatimustenmukaisuus.' },
    finlex: { label: 'Finlex · Säädöshaku', icon: '§', title: 'Finlex · Säädöshaku', description: 'Hae voimassa olevien säädösten nimiä Finlexin avoimesta rajapinnasta.' },
    contracts: { label: 'Sopimukset ja asiakirjat', icon: '▤', title: 'Sopimus- ja asiakirjaviitteet', description: 'Projektien sopimus-, lupa- ja viranomaisasiakirjojen paikallinen viiterekisteri.' },
    compliance: { label: 'Laki · Audit · Compliance', icon: '⚖', title: 'Juridiikka, auditointi ja vaatimustenmukaisuus', description: 'Sopimukset, auditoinnit, vaatimukset sekä sertifiointien hallinta.' },
    hr: { label: 'HRMS · Henkilöstö', icon: '♙', title: 'Henkilöstöhallinta · HRMS', description: 'Human Resource Management System: henkilöstö, pätevyydet, perehdytys ja työmaalle kohdistaminen.' },
    courses: { label: 'Koulutus & pätevyydet', icon: '▣', title: 'Koulutus ja sertifiointi', description: 'Perehdytys- ja turvallisuuskoulutukset kategorioittain ja etenemisseurannalla.' },
    questions: { label: 'Kysymykset', icon: '✉', title: 'Kysy käyttäjältä', description: 'Kirjaa työmaakohtaiset kysymykset ja seuraa, mihin tarvitaan vastaus.' },
    gis: { label: 'GeoBIM & kartat', icon: '⌖', title: 'GeoBIM · Kartat ja paikkatieto', description: 'Yhdistä paikkatieto ja BIM sekä avaa kartta-, rakennus- ja pistepilvinäkymät.' },
    mapdata: { label: 'Suomen kartta-aineistot', icon: '▧', title: 'Suomen kartta-aineistot', description: 'Hae viranomaisaineistoja, lisää tasoja työmaakartalle ja lataa QGIS-aineistot.' },
    blueprints: { label: 'Piirustusarkisto', icon: '▧', title: 'Piirustusarkisto · CAD / Blueprint Vault', description: 'Tallenna CAD-, piirustus- ja blueprint-aineistojen projektiviitteet.' },
    knowledge: { label: 'Telineohjeet & tietopankki', icon: '▤', title: 'Telineohjeet · CAD-tietopankki', description: 'Hae telinepiirustusten työvaiheita, piirustusnäkymiä ja osien perusnimistöä.' },
    dev: { label: 'Isometrinen valinta & Dev UI', icon: '▧', title: 'Isometrinen valinta · Dev UI', description: 'Valitse työtilan moduulit isometrisestä kartasta ja hahmottele niiden järjestystä.' },
    settings: { label: 'Asetukset', icon: '⚙', title: 'Asetukset', description: 'Hallitse paikallisen työtilan näkymää ja asetuksia.' },
  };
  const BUILDING_ARCHIVE_REFERENCES = [{
    address: 'Mannerheimintie 5',
    ratu: '391',
    vtjPrt: '103036835V',
    parcel: '091-002-0096-0034',
    title: 'Stockmann / ABC City · arkistopiirustus',
    description: 'Å uppföras å ABC City tillhöriga tomten No 1 vid Östra Henriksgatan i kvarteret No 95 av Helsingfors stad · första byggnadsperioden.',
    facade: 'Fasad mot Alexandersgatan',
    scanUrl: '/assets/building-reference-drawings/mannerheimintie-5.jpg',
    archiveUrl: 'https://yksa.disec.fi/Yksa4/id/167421523809800/?view=list&_displayStart=0&back=true&history=1&ref=results&_sort=4%2Cdesc#tab/overview',
    sourceLabel: 'Yksa · Helsingin kaupunginarkisto · kortti 167421523809800',
    verification: 'Tämä käyttäjän lisäämä Stockmann / ABC City -arkistoviite ei varmista vastaavuutta nykyiseen Mannerheimintie 5:n rakennukseen. Uusi ylioppilastalo tunnistetaan erikseen toimitetusta valokuvasta; Stockmann-piirustuksia ei käytetä tämän mallin geometrian lähteenä.',
    modelUrl: '/assets/building-models/mannerheimintie-5/mannerheimintie-5.glb',
    modelObjUrl: '/assets/building-models/mannerheimintie-5/mannerheimintie-5.obj',
    modelBlendUrl: '/assets/building-models/mannerheimintie-5/mannerheimintie-5.blend',
    modelMetadataUrl: '/assets/building-models/mannerheimintie-5/model-metadata.json',
    historicSources: [
      { title: 'Nykyvalokuva · käyttäjän toimittama', file: 'mansku5-photo.jpeg', record: 'Kuvan tunniste: Uusi ylioppilastalo, Mannerheimintie 5', url: '' },
      { title: 'Kupolitorni · Helsingin kaupunginmuseon selvitys (2020)', file: '', record: 'Kaula 4,3 m · puolipallon säde 4,3 m · lyhty 2/3 säteestä', url: 'https://www.hel.fi/static/liitteet/museo/Lausunnot%202020/HKM%20Uusi%20ylioppilastalo%20torni.pdf' },
      { title: 'Kahden siiven sijoittelu · Finnish Architecture', file: '', record: 'Mannerheimintien suuntainen katuosa · tontin sisäosan siipi · pyöristetty torninivel', url: 'https://www.finnisharchitecture.fi/projects/new-student-house' },
      { title: 'Nykykuvat · katto ja dormerit · Ylva', file: '', record: 'Kattomuodon visuaalinen lähde; kattokulmat mallissa arvioitu', url: 'https://ylva.fi/kohteet/uusi-ylioppilastalo/' },
      { title: 'Aukionpuoleinen pääty · Helsingin yliopisto', file: '', record: 'Pelkistetty klassinen frontoni ja tornin sijainti julkisivujen nivelkohdassa', url: 'https://www.avoin.helsinki.fi/oppimateriaalit/taidehistoria/virtuaali/uusi_yo.shtml' },
      { title: 'Rakennuksen pohja · Helsingin rakennusrekisteri WFS', file: '', record: 'Nykyinen rakennuspolygon ja rekisterin 8 kerrosta', url: '' },
    ],
  }];
  const DESIGN_GUIDES = [
    { category:'Ennen CADia', title:'Tarkista lähtötiedot ennen piirtämistä', summary:'Varmista rakennuksen muoto, korkeudet ja aukot sekä työmaan kulku, esteet ja telineen käyttötarkoitus ennen pohjapiirustusta.', checks:['Tarkista rakennuspiirustusten versio ja olennaiset mitat paikan päällä tai hyväksytystä lähteestä.','Merkitse sisäänkäynnit, kulkureitit, rajat, katokset, parvekkeet, putket ja lastausalueet.','Kirjaa telineen käyttötarkoitus ja avoimet lähtötietokysymykset; älä täydennä puuttuvia tietoja arvauksella.'], source:'https://scaffolddesignhub.com/scaffold-cad-drawings/#index_id1', sourceLabel:'Scaffold CAD Drawings · What to Check Before Opening CAD' },
    { category:'Näkymät', title:'Lue sama teline pohjasta, julkisivusta ja leikkauksesta', summary:'Pohja näyttää sijainnin ja horisontaalisen asettelun (X+Y), julkisivu korkeussuunnan (X+Z) ja leikkaus telineen syvyyden sekä rakennussuhteen (Y+Z). Yksi näkymä ei yksin todista kokonaisuutta.', checks:['Seuraa samaa kenttää, sisäänkäyntiä, porrasta ja työtasoa kaikissa asiaan liittyvissä näkymissä.','Täsmäytä pohjan kentät ja kulku julkisivun nousuihin, alustoihin, sidontoihin ja jäykistykseen.','Tarkista leikkauksesta leveys, julkisivuvälys, ulokkeet, taso ja liittymä juuri leikkausviivan kohdalla. Yksi tyypillinen leikkaus ei kuvaa poikkeavia parveke-, katos- tai kattokohtia.','Tarkista, että pohja, julkisivu, leikkaus ja detalji käyttävät samaa revisiota; selvitä ristiriita äläkä päätä itse kumpi piirustus pätee.','Layherin lähdeaineisto määrittää saatavilla olevia poikittaisia nimellismittoja, mutta ne eivät ole sama asia kuin käyttöleveys tai kohteessa mitattu julkisivuvälys. Layherin 0,30 m on ohjeen esimerkki, ei yleinen lakiraja. SVG/DXF-vienneistä puuttuu mitoitettu leikkaus, kunnes kohdekohtainen välys ja tasokokoonpano on mitattu.'], source:'https://scaffolddesignhub.com/scaffold-plan-elevation-section/', sourceLabel:'Scaffold Design Hub · Plan vs Elevation vs Section' },
    { category:'Jäykistys ja vakavuus', title:'Tarkista jäykistys osana jatkuvaa kuormareittiä', summary:'Julkisivudiagonaali on vain yksi osa kolmiulotteista vakavuusjärjestelmää. Seuraa vaakavoima rungosta jäykisteiden ja suunniteltujen sidontojen kautta niitä vastaanottavaan rakenteeseen.', checks:['Erota julkisivu-, poikittais- ja vaakatasojäykistys sekä X-ristit, polvijäykisteet ja raker-tuet. Älä oleta paikallisen tuen korvaavan pääjäykistystä; tarkista tehtävä pohjasta, julkisivusta ja leikkauksesta.','Erota jäykiste, rakennukseen kiinnittävä sidonta ja putoamissuojaava kaide. Älä käytä kaidetta jäykisteenä, ellei valitun järjestelmän hyväksytty ohje nimenomaan anna sille tätä tehtävää.','Seuraa kuormareittiä: tuuli tai peite → telineen runko → jäykistys → suunniteltu sidonta tai muu tuki → kantava rakenne. Tarkista, että liittymät ja kiinnitysalusta on suunniteltu.','Tarkista ensimmäiset ja viimeiset kentät, nurkat ja palautukset sekä ovet, lastausaukot, porrastornit, siltaukset ja ulokkeet. Aukko tai este ei oikeuta poistamaan jäykistettä ilman hyväksyttyä korvaavaa ratkaisua.','Arvioi uudelleen, jos sidontaa tai diagonaalia siirretään, verkko tai peite lisätään, telineeseen tulee poikkeama tai pystytys-/purkuvaihe muuttuu. Vertaa työmaan toteutusta samaan revisioon.','Layher Allroundin 2018 ohje antaa julkisivudiagonaalille vähimmäisohjeen vähintään joka viidenteen kenttään. Suurempi kuormitus voi vaatia tiheämpää jäykistystä; luokkakohtaista jakoa tämä luonnos ei päättele. Artikkelin Japan- ja USA-esimerkkilukuja ei siirretä sellaisenaan Suomen tai Layherin mitoitussäännöiksi.'], source:'https://scaffolddesignhub.com/scaffold-bracing-explained/', sourceLabel:'Scaffold Design Hub · Scaffold Bracing Explained' },
    { category:'Piirustusstandardi', title:'Lukitse yksiköt, mittakaava ja piirustuspohja', summary:'Yhdenmukainen pohjakuva, kerrosnimet, symbolit ja otsikkotaulu auttavat suunnittelijaa, työnjohtoa ja asentajaa lukemaan samaa suunnitelmaa.', checks:['Valitse projektin yksiköt, mittakaava, tulostuskoko ja piirustuspohja.','Erota rakennus, teline, kulku, sidonnat ja huomautukset selkeiksi CAD-tasoiksi.','Käytä toistuville osille ja symboleille hallittuja lohkoja; tarkista ne kohteeseen ennen käyttöä.','Merkitse piirustuksen tarkoitus ja tila, jotta luonnos ei sekoitu hyväksyttyyn toteutuspiirustukseen.'], source:'https://scaffolddesignhub.com/scaffold-cad-drawings/#index_id21', sourceLabel:'Scaffold CAD Drawings · Layers, blocks and templates' },
    { category:'Versiot ja julkaisu', title:'Tee revisioista jäljitettäviä ja tarkista julkaistu PDF', summary:'Piirustuksen muutos pitää pystyä yhdistämään sen syyhyn, ajankohtaan ja oikeaan versioon. Tarkista myös valmis vienti, ei pelkkää CAD-näkymää.', checks:['Merkitse revisiotunnus, päivämäärä, muutoksen kuvaus ja tarkastustila.','Varmista, että työmaalle jaettu linkki tai tuloste osoittaa uusimpaan revisioon.','Avaa PDF-vienti ja tarkista mittakaava, viivanpaksuudet, tekstien luettavuus ja sivujen rajaus.','Tarkista pohja-, julkisivu- ja leikkauskuvat uudelleen jokaisen muutoksen jälkeen.'], source:'https://scaffolddesignhub.com/scaffold-cad-drawings/#index_id18', sourceLabel:'Scaffold CAD Drawings · Revision record and PDF review' },
    { category:'Piirustusmerkinnät', title:'Selitä symbolit tämän piirustuksen omassa selitteessä', summary:'Pohja, julkisivu, leikkaus ja detalji luetaan yhdessä. Lyhenteiden ja valmistajakohtaisten tunnusten merkitykset vahvistetaan projektin selitteestä ja lähdeasiakirjoista.', checks:['Merkitse näkymät ja viittaukset johdonmukaisesti; seuraa leikkaus- ja detaljiviitteet oikeaan näkymään.','Kirjaa piirustuskohtainen symboli- ja lyhenneluettelo. PLAN, ELEV., SEC., DETAIL, GA, NTS, TYP, CL, Ø, @, EQ ja REF ovat yleisiä esimerkkejä, joiden tulkinta riippuu asiayhteydestä.','Merkitse tuote- ja valmistajatunnukset lähteineen; älä päättele yhteensopivuutta nimen tai symbolin perusteella.','Tarkista revisio, mitat, tasot sekä pohjan ja julkisivun vastaavuus, ja poista tarpeeton päällekkäinen merkintä.','Jos merkintä jää epäselväksi, kirjaa avoin kysymys ja selvitä se suunnittelijalta ennen käyttöä.'], source:'https://scaffolddesignhub.com/scaffold-drawing-symbols/', sourceLabel:'Scaffold Design Hub · Scaffold Drawing Symbols and Abbreviations Explained' },
    { category:'Detaljisuunnittelu', title:'Piirrä detalji, kun se poistaa paikallisen epäselvyyden', summary:'Pohja, julkisivu tai leikkaus voi jättää poikkeavan kohdan avoimeksi. Detalji rajataan ratkaistavaan kysymykseen, sidotaan sijaintiin ja koordinoidaan muihin näkymiin.', checks:['Arvioi, selviääkö ehto jo pohjasta, julkisivusta, leikkauksesta ja huomautuksista. Lisää detalji vain, jos lukija muuten joutuisi arvaamaan tärkeän paikallisen järjestelyn.','Tarkista erityisesti kulmat ja syvennykset, aukot ja kulkureitit, konsolit ja paikalliset ulokkeet, katot ja parapetit, tasomuutokset sekä telineen ja rakennuksen liitännät.','Anna detaljille tunnus, sijainti ja selkeä kysymys. Näytä tehtävän kannalta tarpeelliset mitat, rakennussuhde, paikalliset osat sekä viitteet muihin näkymiin.','Tarkista sidonnan tai muun rakennusliittymän fyysinen toteutettavuus kohteen tiedoilla; symboli tai graafinen detalji ei osoita kelvollista kiinnityskohtaa.','Vie muutokset kaikkiin vaikutuksen alaisiin pohjiin, julkisivuihin, leikkauksiin, huomautuksiin ja osaluetteloihin. Älä kopioi vanhaa detaljia uuteen kohteeseen tarkistamatta olosuhteita.','Piirustus selventää järjestelyä, mutta ei osoita rakenteellista kapasiteettia. Vahvistus ja vaadittavat detaljit riippuvat projektista, järjestelmästä, valmistajaohjeesta ja sovellettavista vaatimuksista.'], source:'https://scaffolddesignhub.com/scaffold-detail-drawings/', sourceLabel:'Scaffold Design Hub · Scaffold Details Explained' },
    { category:'Suunnittelupolku', title:'Etene kohteesta koordinoituun piirustukseen', summary:'Aloita rakennuksesta, työmaasta ja työn tarpeesta. Lukitse järjestelmä ja geometria ennen kuin viimeistelet pohjan, julkisivun, leikkaukset, kulun, jäykistyksen ja detaljit.', checks:['Kerää rakennus- ja työmaatiedot; merkitse vahvistamattomat mitat ja oletukset näkyvästi.','Määritä käyttötarkoitus, työskentelytasot, kulku, materiaalinkäsittely ja muut suunnittelun lähtötarpeet.','Vahvista käytettävä telinejärjestelmä, oikeat moduulit, komponentit ja valmistaja-asiakirjan revisio.','Ratkaise pohja, välykset, todelliset kenttäjaot, kulmat ja yläkerrosten poikkeamat yhdessä.','Sovita julkisivu rakennuksen kerroksiin, lattioihin, alapään tasoihin, kattoon, tasoihin ja suojauksiin.','Lisää tarvittavat leikkaukset ja detaljit; koordinoi kulku, sidonnat ja jäykistys aukkoihin ja työalueisiin.','Tarkista mitat, selitteet, revisiot, lähteet ja kaikkien näkymien yhteensopivuus kuin lukisit piirustuksen ensimmäistä kertaa.'], source:'https://scaffolddesignhub.com/how-to-create-scaffold-drawing/', sourceLabel:'Scaffold Design Hub · How to Create a Scaffold Drawing' },
    { category:'Materiaalit ja BOM', title:'Pidä materiaalimäärät sidottuna piirustusversioon', summary:'Piirustus auttaa määrälaskennassa, mutta osaluettelo pitää tarkistaa aina viimeisintä revisiota vasten.', checks:['Erittele määräluetteloon osan nimike, järjestelmä, määrä ja viite tai lähde.','Täsmäytä osat ja määrät piirustuksen kenttiin, tasoihin ja kulkuosiin.','Päivitä määräluettelo jokaisen piirustusrevision jälkeen.','Vahvista yhteensopivuus valmistajan ajantasaisesta järjestelmädokumentaatiosta.'], source:'https://scaffolddesignhub.com/scaffold-cad-drawings/#index_id24', sourceLabel:'Scaffold CAD Drawings · Material take-off and work planning' },
    { category:'Osanimistö', title:'Tunnista osat järjestelmän ja tehtävän mukaan', summary:'Pystyt, vaakasiteet, poikittaisosat, vinotuet, työtasot, kaiteet, jalat, liittimet, portaat ja sidonnat muodostavat järjestelmän. Sama nimitys tai mitta ei yksin osoita yhteensopivuutta.', checks:['Kirjaa komponentin nimi, järjestelmä ja valmistajan tuoteviite.','Tarkista osan kunto, mitat ja sopivuus saman järjestelmän voimassa olevasta ohjeesta.','Älä päättele kuormankestoa tai rakenteellista kelpoisuutta osanimistosta tai tästä tiivistelmästä.'], source:'https://scaffolddesignhub.com/scaffolding-parts/', sourceLabel:'Scaffolding Parts Explained · Names, Sizes and Functions' },
  ];
  const SITES = [
    { id: 'site-hakaniemi', name: 'Hakaniemen julkisivutyömaa', city: 'Helsinki · Hakaniemi', status: 'Aktiivinen' },
    { id: 'site-kalasatama', name: 'Kalasataman asuinkohde', city: 'Helsinki · Kalasatama', status: 'Suunnittelussa' },
    { id: 'site-kamppi', name: 'Kampin saneerauskohde', city: 'Helsinki · Kamppi', status: 'Tauolla' },
  ];
  const TASK_STATES = ['Tekemättä', 'Käynnissä', 'Valmis'];
  const PRIORITIES = ['Matala', 'Normaali', 'Korkea'];
  const CERTIFICATE_TYPES = ['Valttikortti', 'Työturvallisuuskortti', 'Tulityökortti', 'Henkilönostinkortti', 'Ensiapukortti', 'Muu pätevyys'];
  const NAV_GROUPS = [
    ['YLEISKUVA', ['dashboard', 'city']],
    ['ASIAKKUUDET JA MARKKINAT', ['crm', 'osint', 'questions']],
    ['TYÖMAA, TELINEET JA KALUSTO', ['scaffold', 'rental', 'wms', 'lms']],
    ['VALMISTUS JA TOIMITTAJAT', ['manufacturing']],
    ['TALOUS JA RAHOITUS', ['finance']],
    ['KARTAT, SÄÄ JA PIIRUSTUKSET', ['gis', 'weather', 'design', 'knowledge', 'blueprints']],
    ['HRMS, KOULUTUS JA SERTIFIOINTI', ['hr', 'courses', 'certificates', 'profile']],
    ['LEGAL · JURIDIIKKA', ['legal']],
    ['OPERATIIVINEN TYÖ', ['tasks', 'calendar', 'time', 'mobile']],
    ['HALLINTA', ['dev', 'settings']],
  ];
  const MANAGEMENT_DESTINATIONS = [
    ['wms', 'WMS · Telinevarasto', 'Aita, hyllyt ja kalustoryhmät', '13%', '60%'],
    ['rental', 'Rakennuskonevuokraamo', 'Nostimet ja RENT-piha', '31%', '35%'],
    ['lms', 'LMS · Logistiikka', 'Kuorma-autojen lastauspiha ja työmaatoimitukset', '24%', '58%'],
    ['finance', 'Finance · Wall Street', 'Pankki, pörssi ja projektitalous', '40%', '51%'],
    ['courses', 'Koulutus & pätevyydet', 'Perehdytys ja sertifiointi', '44%', '21%'],
    ['hr', 'HRMS · Henkilöstö', 'Tiimi ja työmaalle kohdistus', '49%', '49%'],
    ['legal', 'Legal · Juridiikka', 'Finlex, sopimukset ja auditointi', '62%', '28%'],
    ['city', 'Viranomaiset & lupapalvelut', 'Hallintorakennukset, luvat ja poliisi', '80%', '51%'],
    ['crm', 'CRMS · Asiakkuudet', 'Lasipintainen asiakastalo', '56%', '61%'],
    ['osint', 'Markkina- ja hankintavahti', 'CRM:n viereinen lähdeseuranta', '68%', '57%'],
    ['manufacturing', 'MMS · Valmistus', 'Tehdas ja toimittajat', '86%', '19%'],
    ['design', 'Suunnittelu & CAD', 'Suunnittelupöytä ja piirustukset', '29%', '84%'],
    ['blueprints', 'Piirustusarkisto', 'CAD- ja blueprint-aineistot', '17%', '78%'],
    ['scaffold', 'Telinehallinta', 'Rakenteilla oleva talo ja telineet', '86%', '64%'],
    ['gis', 'GeoBIM · Kartat', 'Karttapiste ja rakennukset', '52%', '83%'],
  ];
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function toIso(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function addDays(date, count) {
    const value = new Date(date);
    value.setDate(value.getDate() + count);
    return value;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function formatDate(value, options = { day: 'numeric', month: 'short' }) {
    if (!value) return '—';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fi-FI', options).format(date);
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat('fi-FI', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  function formatHours(ms) {
    const totalMinutes = Math.max(0, Math.round(ms / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} h${minutes ? ` ${String(minutes).padStart(2, '0')} min` : ''}`;
  }

  function seedState() {
    return {
      tasks: [
        { id: 'task-1', title: 'Tarkasta telineen kiinnitykset', description: 'Varmista ankkuroinnit ennen seuraavaa työvaihetta.', siteId: SITES[0].id, project: 'Julkisivun kunnostus', assignee: 'Demo-tekijä', status: 'Käynnissä', priority: 'Korkea', dueDate: toIso(addDays(TODAY, 1)), estimate: 2 },
        { id: 'task-2', title: 'Päivitä työmaan turvallisuussuunnitelma', description: 'Käy läpi kulkureitit ja suojausmerkinnät.', siteId: SITES[1].id, project: 'Asuinkohde', assignee: 'Tiimi A', status: 'Tekemättä', priority: 'Normaali', dueDate: toIso(addDays(TODAY, 3)), estimate: 1.5 },
        { id: 'task-3', title: 'Vapauta huoltotaso', description: '', siteId: SITES[0].id, project: 'Julkisivun kunnostus', assignee: 'Demo-tekijä', status: 'Valmis', priority: 'Matala', dueDate: toIso(addDays(TODAY, -1)), estimate: 1 },
      ],
      logs: [],
      activeShift: null,
      certificates: [
        { id: 'cert-1', employee: 'Demo-tekijä', type: 'Työturvallisuuskortti', number: 'DEMO-1001', issuer: 'Paikallinen esimerkkitieto', validUntil: toIso(addDays(TODAY, 240)) },
        { id: 'cert-2', employee: 'Tiimi A', type: 'Tulityökortti', number: 'DEMO-1002', issuer: 'Paikallinen esimerkkitieto', validUntil: toIso(addDays(TODAY, 24)) },
        { id: 'cert-3', employee: 'Tiimi B', type: 'Henkilönostinkortti', number: 'DEMO-1003', issuer: 'Paikallinen esimerkkitieto', validUntil: toIso(addDays(TODAY, -12)) },
      ],
      designResources: [],
      scaffoldCalculations: [],
      scaffoldProjects: [],
      scaffoldAdminImports: [],
      customers: [
        { id: 'customer-1', company: 'Helsingin Julkisivut Oy', contact: 'Marja Koski', email: 'marja@example.fi', stage: 'Tarjous', value: 48000, nextStep: 'Tarkista tarjous 2.11.' },
        { id: 'customer-2', company: 'Kalasataman Rakennuttajat Oy', contact: 'Olli Niemi', email: 'olli@example.fi', stage: 'Yhteydenotto', value: 18500, nextStep: 'Sovi kartoitus' },
        { id: 'customer-3', company: 'Pohjolan Korjausrakentaminen Oy', contact: 'Aino Lahti', email: '', stage: 'Neuvottelu', value: 32000, nextStep: 'Päivitä materiaalimäärä' },
      ],
      employees: [
        { id: 'employee-1', name: 'Demo-tekijä', role: 'Telineasentaja', email: '', siteId: SITES[0].id, status: 'Aktiivinen' },
        { id: 'employee-2', name: 'Tiimi A', role: 'Työnjohtaja', email: '', siteId: SITES[1].id, status: 'Aktiivinen' },
        { id: 'employee-3', name: 'Tiimi B', role: 'Telineasentaja', email: '', siteId: SITES[0].id, status: 'Aktiivinen' },
      ],
      courses: [
        { id: 'course-1', title: 'Työturvallisuuden perehdytys', category: 'Perehdytys', duration: '45 min', progress: 100, owner: 'Demo-tekijä' },
        { id: 'course-2', title: 'Telineen käyttöönoton tarkistus', category: 'Telineet', duration: '30 min', progress: 45, owner: 'Tiimi A' },
        { id: 'course-3', title: 'Putoamissuojaus työmaalla', category: 'Turvallisuus', duration: '1 h', progress: 0, owner: 'Tiimi B' },
        { id: 'course-4', title: 'Henkilönostimen työmaaohje', category: 'Laitteet', duration: '35 min', progress: 0, owner: 'Demo-tekijä' },
      ],
      questions: [],
      legalRecords: [],
      bomItems: [],
      bomProjectId: '',
      geoMapView: 'map',
      bomManufacturer: 'Layher',
      bomSystem: 'Allround Scaffolding',
      bomQuery: '',
      logisticsDeliveries: [
        { id: 'delivery-1', title: 'Julkisivutelineen täydennys', siteId: SITES[0].id, vehicle: 'Kuorma-auto · HIJ-284', date: toIso(TODAY), time: '08:30', status: 'Lastaus', load: 'Pystyt, vaakaputket, työtasot' },
        { id: 'delivery-2', title: 'Työtasojen palautus', siteId: SITES[1].id, vehicle: 'Nosturiauto · KLM-615', date: toIso(addDays(TODAY, 1)), time: '13:00', status: 'Suunniteltu', load: 'Työtasot ja kaiteet' },
        { id: 'delivery-3', title: 'Pientarvikkeet ja ankkurit', siteId: SITES[2].id, vehicle: 'Pakettiauto · ABC-932', date: toIso(TODAY), time: '10:15', status: 'Perillä', load: 'Kiinnikkeet, ankkurit' },
      ],
      logisticsFilter: 'Kaikki',
      knowledgeCategory: 'Kaikki',
      lmsCategory: 'Kaikki',
      devLayout: [
        { id: 'layout-1', view: 'dashboard', span: 6 },
        { id: 'layout-legal', view: 'legal', span: 4 },
        { id: 'layout-2', view: 'crm', span: 6 },
        { id: 'layout-3', view: 'gis', span: 4 },
        { id: 'layout-4', view: 'bom', span: 4 },
      ],
      dashboardTab: 'overview',
      alerts: [],
      calendarEvents: [
        { id: 'event-1', date: toIso(addDays(TODAY, 1)), title: 'Telineen tarkastus', type: 'inspection', siteId: SITES[0].id },
        { id: 'event-2', date: toIso(addDays(TODAY, 4)), title: 'Työmaan aloitus', type: 'site-start', siteId: SITES[1].id },
        { id: 'event-3', date: toIso(addDays(TODAY, 8)), title: 'Lasku erääntyy', type: 'invoice', siteId: SITES[0].id },
        { id: 'event-4', date: toIso(addDays(TODAY, 12)), title: 'Työmaan päättyminen', type: 'site-end', siteId: SITES[2].id },
      ],
      profile: { name: 'Demo-käyttäjä', role: 'Työmaan työntekijä', phone: '', email: '' },
      preferences: { language: 'fi', theme: 'light', palette: 'christiania', units: 'metric', floorHeight: 3, autosave: true, cursorStyle: 'ratchet', cursorSize: 56, weatherWidgetPositionVersion: 3, weatherWidgetPosition: { left: 70, top: 8 } },
      calendarDate: toIso(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)),
      settingsTab: 'general',
      mobileTab: 'time',
      filters: { taskSearch: '', taskStatus: 'Kaikki tilat', taskPriority: 'Kaikki prioriteetit', certificateSearch: '', certificateType: 'Kaikki tyypit', siteSearch: '', siteStatus: 'Kaikki tilat' },
    };
  }

  function loadState() {
    const initial = seedState();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return initial;
      const devLayout = Array.isArray(saved.devLayout) ? [...saved.devLayout] : initial.devLayout;
      if (!saved.devLegalTileMigrated) {
        if (!devLayout.some((tile) => tile.view === 'legal')) {
          const dashboardIndex = devLayout.findIndex((tile) => tile.view === 'dashboard');
          devLayout.splice(dashboardIndex < 0 ? 0 : dashboardIndex + 1, 0, { id: 'layout-legal', view: 'legal', span: 4 });
        }
        saved.devLegalTileMigrated = true;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, devLayout })); } catch { /* The in-memory migration remains usable. */ }
      }
      const preferences = { ...initial.preferences, ...(saved.preferences || {}) };
      if (!['christiania', 'traditional', 'engineering', 'future', 'ancient', 'paperwork', 'spring', 'summer', 'autumn', 'winter'].includes(preferences.palette)) preferences.palette = 'christiania';
      if (Number(preferences.weatherWidgetPositionVersion) < 3) {
        preferences.weatherWidgetPositionVersion = 3;
        preferences.weatherWidgetPosition = { ...initial.preferences.weatherWidgetPosition };
      }
      return {
        ...initial,
        ...saved,
        bomManufacturer: typeof saved.bomManufacturer === 'string' && saved.bomManufacturer ? saved.bomManufacturer : 'Layher',
        bomSystem: typeof saved.bomSystem === 'string' && saved.bomSystem ? saved.bomSystem : (saved.bomManufacturer === 'Layher' || !saved.bomManufacturer ? 'Allround Scaffolding' : ''),
        tasks: Array.isArray(saved.tasks) ? saved.tasks : initial.tasks,
        logs: Array.isArray(saved.logs) ? saved.logs : [],
        certificates: Array.isArray(saved.certificates) ? saved.certificates : initial.certificates,
        designResources: Array.isArray(saved.designResources) ? saved.designResources : [],
        scaffoldCalculations: Array.isArray(saved.scaffoldCalculations) ? saved.scaffoldCalculations : [],
        scaffoldProjects: Array.isArray(saved.scaffoldProjects) ? saved.scaffoldProjects : [],
        scaffoldAdminImports: Array.isArray(saved.scaffoldAdminImports) ? saved.scaffoldAdminImports : [],
        customers: Array.isArray(saved.customers) ? saved.customers : initial.customers,
        employees: Array.isArray(saved.employees) ? saved.employees : initial.employees,
        courses: Array.isArray(saved.courses) ? saved.courses : initial.courses,
        questions: Array.isArray(saved.questions) ? saved.questions : [],
        legalRecords: Array.isArray(saved.legalRecords) ? saved.legalRecords : [],
        bomItems: Array.isArray(saved.bomItems) ? saved.bomItems : [],
        logisticsDeliveries: Array.isArray(saved.logisticsDeliveries) ? saved.logisticsDeliveries : initial.logisticsDeliveries,
        devLayout,
        devLegalTileMigrated: true,
        alerts: Array.isArray(saved.alerts) ? saved.alerts : [],
        calendarEvents: Array.isArray(saved.calendarEvents) ? saved.calendarEvents : initial.calendarEvents,
        profile: { ...initial.profile, ...(saved.profile || {}) },
        preferences,
        filters: { ...initial.filters, ...(saved.filters || {}) },
      };
    } catch {
      return initial;
    }
  }

  let state = loadState();
  let currentPage = readPage();
  let liveWeather = { timezone: 'Europe/Helsinki', timezone_abbreviation: '', current: null, error: '', fetchedAt: null };
  let liveWeatherPromise = null;
  let finlexSearchState = { query: '', results: [], loading: false, error: '' };
  let weatherWidgetDrag = null;
  let weatherWidgetClickSuppressedUntil = 0;
  let selectedScaffoldBuilding = null;
  let selectedScaffoldFacade = null;
  let selectedScaffoldFacadeSource = '';
  let selectedScaffoldRoofFacades = [];
  let facadeScaffoldPlans = [];
  let scaffoldCornerReviews = [];
  let scaffoldDrawingReviews = [];
  let selectedScaffoldCornerKey = '';
  let scaffoldStairTowers = [];
  let stairTowerPlacementMode = false;
  let stairTowerPlacementRemaining = 0;
  let scaffoldBuildingGeometryApplied = false;
  let scaffoldTerrainGrid = null;
  let scaffoldTerrainAnalysis = null;
  let scaffoldTerrainFileMeta = null;
  let scaffoldGroundData = null;
  let scaffoldGroundDataBuildingId = '';
  let scaffoldTerrainAnalysisKey = '';
  let scaffoldBuildingMap = null;
  let scaffoldTerrainCellLayer = null;
  let scaffoldProjectRecords = [];
  let scaffoldProjectsLoaded = false;
  let scaffoldProjectsLoading = false;
  let bomLinkedProject = null;
  let bomLinkedProjectLoading = false;
  let bomLinkedProjectError = '';
  let bomLinkTargetId = '';
  let scaffoldDeepLinkOpening = false;
  let activeScaffoldProject = null;
  let scaffoldProjectDirty = false;
  let scaffoldProjectFiles = [];
  let scaffoldFileLoadToken = 0;
  let importedScaffoldFileId = '';
  let pendingScaffoldModelFile = null;
  let scaffoldTemplates = [];
  let scaffoldTemplatesLoaded = false;
  let scaffoldCustomerOptionsLoading = false;
  let scaffoldCustomerOptionsAt = 0;
  let scaffoldRecommendation = null;
  let scaffoldPricingDraft = { components: {}, labor: [], transport: [], otherCosts: 0, otherCostsSource: '' };
  let scaffoldLaborSources = { Asennus: 'Käyttäjän syöttämä työarvio', Purku: 'Käyttäjän syöttämä työarvio', Tarkastus: 'Käyttäjän syöttämä työarvio' };
  let geoWorkspaceMap = null;
  let geoMarkerLayer = null;
  let geoMarkerObjects = new Map();
  let geoMarkersLoaded = false;
  let geoPlaceMarkerMode = false;
  let scaffoldSelectableParts = [];
  const selectedScaffoldParts = new Set();
  const previewScaffoldParts = new Set();
  let hoveredScaffoldPart = null;
  let scaffoldGeometrySignature = '';
  let importedScaffoldObj = null;
  let scaffoldCatalog = [];
  let scaffoldManufacturers = [];
  let scaffoldCatalogDataPromise = null;
  let bomCatalogLoading = false;
  let bomCatalogError = '';
  let settingsSearchText = '';
  let knowledgeSearchText = '';
  let toastTimeout = 0;
  const CRM_STAGES = ['Uusi', 'Kelpuutus', 'Yhteydenotto', 'Tarjousvalmistelu', 'Tarjous lähetetty', 'Voitettu', 'Hävitty'];
  const WAREHOUSE_STOCK = [
    ['Telineputket', 84, '%', 'green', 'Halli A · R3'],
    ['Työtasot', 62, '%', 'blue', 'Halli B · R1'],
    ['Kaiteet ja varvaslistat', 47, '%', 'amber', 'Halli A · R5'],
    ['Ankkurit ja kiinnikkeet', 91, '%', 'green', 'Halli C · R2'],
  ];
  const CRM_MAP_BOUNDS = { minX: 25486580, maxX: 25506580, minY: 6667003, maxY: 6679003 };
  let crmData = null;
  let crmLoaded = false;
  let crmLoading = false;
  let crmLoadError = '';
  let crmNotice = '';
  let crmExpandedId = '';
  let crmActivities = {};
  let crmAddressTarget = null;
  let crmAddressCandidates = [];
  let crmBuildingLocation = null;
  let scaffoldDeliveries = [];
  let scaffoldDeliveriesLoaded = false;
  let scaffoldDeliveriesLoading = false;

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { toast('Tallennus ei onnistunut. Selaimen tallennustila voi olla täynnä.'); }
  }

  async function crmRequest(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || `CRM-pyyntö epäonnistui (HTTP ${response.status}).`);
    return payload;
  }

  async function loadCrm() {
    if (crmLoading) return;
    crmLoading = true;
    crmLoadError = '';
    try {
      let legacy = {};
      try { legacy = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || state; } catch { legacy = state; }
      const migration = await crmRequest('/api/crm/migrate', { method: 'POST', body: JSON.stringify({ customers: Array.isArray(legacy.customers) ? legacy.customers : [], designResources: Array.isArray(legacy.designResources) ? legacy.designResources : [] }) });
      crmData = await crmRequest('/api/crm/bootstrap');
      crmLoaded = true;
      crmNotice = migration.alreadyImported ? '' : `Vanhan selaintallennuksen siirto valmis: ${migration.customersImported} asiakasta ja ${migration.drawingsImported} piirustusviitettä. Selainkopio säilyy tarkistusta varten.`;
    } catch (error) {
      crmLoadError = error.message || 'Paikalliseen CRM-palvelimeen ei saatu yhteyttä.';
      crmLoaded = false;
    } finally {
      crmLoading = false;
      if (currentPage === 'crm') render();
    }
  }

  async function refreshCrm() {
    try {
      crmData = await crmRequest('/api/crm/bootstrap');
      crmLoaded = true;
      crmLoadError = '';
      render();
    } catch (error) {
      crmLoadError = error.message || 'CRM-tietojen päivitys epäonnistui.';
      render();
    }
  }

  function readPage() {
    const page = new URLSearchParams(location.search).get('page');
    return PAGE_META[page] ? page : 'dashboard';
  }

  function renderNav() {
    const nav = $('#primaryNav');
    nav.innerHTML = mindmapNavMarkup();
    $('#pageCrumb').textContent = PAGE_META[currentPage].label;
    const drawerMap = $('#drawerMapStage');
    if (drawerMap) {
      const mapLinks = MANAGEMENT_DESTINATIONS.map(([page, label, detail, x, y]) => `<a class="drawer-map-hotspot${currentPage === page ? ' active' : ''}" href="?page=${page}" data-page="${page}" style="left:${x};top:${y}" aria-label="Avaa ${escapeHtml(label)}: ${escapeHtml(detail)}" title="${escapeHtml(label)}"><span>${escapeHtml(PAGE_META[page]?.icon || '⌘')}</span></a>`).join('');
      drawerMap.innerHTML = `<img src="assets/illustrations/management-isometric-finance-civic.png" alt="Isometrinen moduulikartta, jossa pankkikortteli sekä viranomais- ja poliisialue" width="1774" height="887" loading="lazy">${mapLinks}`;
    }
    document.querySelectorAll('#mobileNav [data-page]').forEach((link) => {
      const active = link.dataset.page === currentPage;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const primaryPages = ['dashboard', 'tasks', 'scaffold', 'time'];
    $('#mobileMore')?.classList.toggle('active', !primaryPages.includes(currentPage));
  }

  function mindmapNavMarkup() {
    return NAV_GROUPS.map(([label, pages]) => {
      const legalPages = ['finlex', 'contracts', 'compliance'];
      const groupActive = pages.includes(currentPage) || (label === 'KARTAT, SÄÄ JA PIIRUSTUKSET' && currentPage === 'mapdata') || (label === 'TYÖMAA, TELINEET JA KALUSTO' && currentPage === 'bom') || (label === 'LEGAL · JURIDIIKKA' && legalPages.includes(currentPage));
      const groupIcon = PAGE_META[pages[0]]?.icon || '⌘';
      return `<details class="mindmap-branch"${groupActive ? ' open' : ''}><summary><span class="mindmap-branch-icon" aria-hidden="true">${escapeHtml(groupIcon)}</span><span>${escapeHtml(label)}</span><i aria-hidden="true">⌄</i></summary><div class="mindmap-children">${pages.map((page) => {
        const item = PAGE_META[page];
        const activeClass = currentPage === page ? 'active' : currentPage === 'mapdata' && page === 'gis' || currentPage === 'bom' && page === 'wms' || legalPages.includes(currentPage) && page === 'legal' ? 'ancestor' : '';
        const parentLink = `<a href="?page=${page}" data-page="${page}" class="mindmap-link ${activeClass}"${currentPage === page ? ' aria-current="page"' : ''}><span class="mindmap-page-icon" aria-hidden="true">${escapeHtml(item.icon)}</span><span>${escapeHtml(item.label)}</span>${page === 'tasks' ? `<small class="nav-count">${state.tasks.filter((task) => task.status !== 'Valmis').length}</small>` : ''}</a>`;
        if (page === 'legal') {
          const children = [['finlex', PAGE_META.finlex], ['contracts', PAGE_META.contracts], ['compliance', { ...PAGE_META.compliance, label: 'Audit · Compliance' }]];
          const childLinks = children.map(([key, child]) => `<a href="?page=${key}" data-page="${key}" class="mindmap-link mindmap-nested-link ${currentPage === key ? 'active' : ''}"${currentPage === key ? ' aria-current="page"' : ''}><span class="mindmap-page-icon" aria-hidden="true">${escapeHtml(child.icon)}</span><span>${escapeHtml(child.label)}</span></a>`).join('');
          return `<div class="mindmap-wms-branch">${parentLink}<div class="mindmap-wms-child legal-mindmap-child">${childLinks}</div></div>`;
        }
        if (page === 'gis') {
          return `<div class="mindmap-wms-branch">${parentLink}<div class="mindmap-wms-child"><a href="?page=mapdata" data-page="mapdata" class="mindmap-link mindmap-nested-link ${currentPage === 'mapdata' ? 'active' : ''}"${currentPage === 'mapdata' ? ' aria-current="page"' : ''}><span class="mindmap-page-icon" aria-hidden="true">▧</span><span>Suomen kartta-aineistot</span></a></div></div>`;
        }
        if (page !== 'wms') return parentLink;
        const bom = PAGE_META.bom;
        const bomLink = `<a href="?page=bom" data-page="bom" class="mindmap-link mindmap-nested-link ${currentPage === 'bom' ? 'active' : ''}"${currentPage === 'bom' ? ' aria-current="page"' : ''}><span class="mindmap-page-icon" aria-hidden="true">${escapeHtml(bom.icon)}</span><span>${escapeHtml(bom.label)}</span></a>`;
        return `<div class="mindmap-wms-branch">${parentLink}<div class="mindmap-wms-child">${bomLink}</div></div>`;
      }).join('')}</div></details>`;
    }).join('');
  }

  function siteName(id) {
    return SITES.find((site) => site.id === id)?.name || 'Työmaa ei valittu';
  }

  function statusTag(status) {
    const cls = { 'Suunnittelussa': 'purple', 'Aktiivinen': 'blue', 'Käynnissä': 'blue', 'Tauolla': 'amber', 'Tekemättä': '', 'Valmis': 'green', 'Myöhässä': 'red' }[status] || '';
    return `<span class="tag ${cls}">${escapeHtml(status)}</span>`;
  }

  function heading(title, description, action = '') {
    return `<div class="page-heading"><div><p class="eyebrow">TYÖTILA</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ''}</div>`;
  }

  function metric(icon, label, value, detail, color = '') {
    return `<div class="metric"><span class="metric-icon ${color}" aria-hidden="true">${icon}</span><span><span class="metric-label">${escapeHtml(label)}</span><strong class="metric-value">${escapeHtml(value)}</strong><span class="metric-foot">${escapeHtml(detail)}</span></span></div>`;
  }

  function workspaceArtHero(eyebrow, title, description, asset, alt, actions = '') {
    return `<section class="panel workspace-art-hero"><div class="workspace-art-copy"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p>${actions ? `<div class="workspace-art-actions">${actions}</div>` : ''}</div><img src="${escapeHtml(asset)}" alt="${escapeHtml(alt)}" loading="lazy"></section>`;
  }

  function weatherCondition(code, isDay = 1) {
    const value = Number(code);
    if (value === 0) return { icon: isDay ? 'sun' : 'moon', label: 'Selkeää' };
    if (value === 1) return { icon: isDay ? 'sun' : 'moon', label: 'Enimmäkseen selkeää' };
    if (value === 2) return { icon: 'cloud', label: 'Puolipilvistä' };
    if (value === 3) return { icon: 'cloud', label: 'Pilvistä' };
    if ([45, 48].includes(value)) return { icon: 'fog', label: 'Sumua' };
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(value)) return { icon: 'rain', label: [51, 53, 55, 56, 57].includes(value) ? 'Tihkusadetta' : 'Sadetta' };
    if ([71, 73, 75, 77, 85, 86].includes(value)) return { icon: 'snow', label: 'Lumisadetta' };
    if ([95, 96, 99].includes(value)) return { icon: 'storm', label: 'Ukkosta' };
    return { icon: 'cloud', label: 'Säätilanne' };
  }

  function readWeatherWidgetPosition() {
    const saved = state.preferences.weatherWidgetPosition || {};
    const left = Number(saved.left);
    const top = Number(saved.top);
    return {
      left: Number.isFinite(left) ? Math.max(0, Math.min(100, left)) : 70,
      top: Number.isFinite(top) ? Math.max(0, Math.min(100, top)) : 8,
    };
  }

  function limitWeatherWidgetPosition(widget, stage, left, top) {
    const width = stage.clientWidth || stage.getBoundingClientRect().width || 1;
    const height = stage.clientHeight || stage.getBoundingClientRect().height || 1;
    const maxLeft = Math.max(0, ((width - widget.offsetWidth) / width) * 100);
    const maxTop = Math.max(0, ((height - widget.offsetHeight) / height) * 100);
    return {
      left: Math.max(0, Math.min(maxLeft, Number(left) || 0)),
      top: Math.max(0, Math.min(maxTop, Number(top) || 0)),
    };
  }

  function placeWeatherWidget(widget, stage, left, top) {
    const position = limitWeatherWidgetPosition(widget, stage, left, top);
    widget.style.left = `${position.left}%`;
    widget.style.top = `${position.top}%`;
    return position;
  }

  function applyWeatherWidgetPosition() {
    const widget = $('[data-weather-widget]');
    const stage = widget?.closest('.management-hub-stage');
    if (!widget || !stage) return;
    const saved = readWeatherWidgetPosition();
    const position = placeWeatherWidget(widget, stage, saved.left, saved.top);
    state.preferences.weatherWidgetPosition = position;
  }

  function bindWeatherWidgetControls() {
    document.addEventListener('pointerdown', (event) => {
      const widget = event.target.closest?.('[data-weather-widget]');
      if (!widget || event.button !== 0 || weatherWidgetDrag) return;
      const stage = widget?.closest('.management-hub-stage');
      if (!widget || !stage) return;
      weatherWidgetDrag = {
        widget,
        stage,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        position: { left: widget.offsetLeft / stage.clientWidth * 100, top: widget.offsetTop / stage.clientHeight * 100 },
      };
      try { widget.setPointerCapture(event.pointerId); } catch { /* Pointer capture can be unavailable in embedded browsers. */ }
    }, true);

    document.addEventListener('pointermove', (event) => {
      if (!weatherWidgetDrag || weatherWidgetDrag.pointerId !== event.pointerId) return;
      const { widget, stage, startX, startY, position } = weatherWidgetDrag;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (!weatherWidgetDrag.moved && Math.hypot(deltaX, deltaY) < 5) return;
      weatherWidgetDrag.moved = true;
      widget.classList.add('is-dragging');
      const rect = stage.getBoundingClientRect();
      const next = placeWeatherWidget(widget, stage,
        position.left + (deltaX / (rect.width || 1)) * 100,
        position.top + (deltaY / (rect.height || 1)) * 100);
      state.preferences.weatherWidgetPosition = next;
      event.preventDefault();
    }, { passive: false });

    const finishDrag = (event) => {
      if (!weatherWidgetDrag || weatherWidgetDrag.pointerId !== event.pointerId) return;
      const { widget, moved } = weatherWidgetDrag;
      widget.classList.remove('is-dragging');
      if (moved) {
        state.preferences.weatherWidgetPosition = readWeatherWidgetPosition();
        persist();
        weatherWidgetClickSuppressedUntil = Date.now() + 450;
      }
      weatherWidgetDrag = null;
    };
    document.addEventListener('pointerup', finishDrag, true);
    document.addEventListener('pointercancel', finishDrag, true);
    document.addEventListener('click', (event) => {
      if (Date.now() > weatherWidgetClickSuppressedUntil) return;
      if (!event.target.closest?.('[data-weather-widget] a')) return;
      event.preventDefault();
      event.stopPropagation();
      weatherWidgetClickSuppressedUntil = 0;
    }, true);

    document.addEventListener('keydown', (event) => {
      const handle = event.target.closest?.('[data-weather-widget-handle]');
      if (!handle || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const widget = handle.closest('[data-weather-widget]');
      const stage = widget?.closest('.management-hub-stage');
      if (!widget || !stage) return;
      const position = readWeatherWidgetPosition();
      const step = event.shiftKey ? 5 : 2;
      const left = position.left + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0);
      const top = position.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0);
      state.preferences.weatherWidgetPosition = placeWeatherWidget(widget, stage, left, top);
      persist();
      event.preventDefault();
    });
  }

  function formatHelsinkiClock() {
    const timeZone = liveWeather.timezone || 'Europe/Helsinki';
    return new Intl.DateTimeFormat('fi-FI', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(new Date());
  }

  function formatHelsinkiDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fi-FI', { timeZone: liveWeather.timezone || 'Europe/Helsinki', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  function formatWeatherNumber(value, digits = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat('fi-FI', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(number) : '—';
  }

  function updateWeatherComponents() {
    const current = liveWeather.current;
    const condition = current ? weatherCondition(current.weather_code, current.is_day) : { icon: 'unknown', label: liveWeather.error ? 'Säätietoa ei juuri nyt saada' : 'Haetaan säätilannetta…' };
    const temperature = current ? `${formatWeatherNumber(current.temperature_2m)} °C` : '— °C';
    const humidity = current ? `${formatWeatherNumber(current.relative_humidity_2m)} %` : '—';
    const wind = current ? `${formatWeatherNumber(current.wind_speed_10m, 1)} m/s` : '—';
    const precipitation = current ? `${formatWeatherNumber(current.precipitation, 1)} mm` : '—';
    const validAt = current?.time ? `Säämallin aika ${formatHelsinkiDateTime(current.time)}` : 'Säätietoja ladataan Open-Meteosta.';
    const sourceStatus = current
      ? `${liveWeather.error ? 'Yhteys katkesi · näytetään viimeisin tieto' : 'Open-Meteo · päivitys 15 min välein'}${liveWeather.timezone_abbreviation ? ` · ${liveWeather.timezone_abbreviation}` : ''}`
      : liveWeather.error ? 'Sääpalveluun ei saatu yhteyttä. Yritä päivittää.' : 'Haetaan ajantasaista säämallia…';
    $$('[data-weather-icon]').forEach((element) => { element.src = `assets/icons/weather/${condition.icon}.svg`; element.alt = condition.label; });
    $$('[data-weather-condition]').forEach((element) => { element.textContent = condition.label; });
    $$('[data-weather-temperature]').forEach((element) => { element.textContent = temperature; });
    $$('[data-weather-apparent]').forEach((element) => { element.textContent = current ? `${formatWeatherNumber(current.apparent_temperature)} °C` : '—'; });
    $$('[data-weather-humidity]').forEach((element) => { element.textContent = humidity; });
    $$('[data-weather-wind]').forEach((element) => { element.textContent = wind; });
    $$('[data-weather-precipitation]').forEach((element) => { element.textContent = precipitation; });
    $$('[data-weather-clock]').forEach((element) => { element.textContent = formatHelsinkiClock(); });
    $$('[data-weather-updated]').forEach((element) => { element.textContent = validAt; });
    $$('[data-weather-source-status]').forEach((element) => { element.textContent = sourceStatus; });
  }

  async function fetchLiveWeather() {
    if (liveWeatherPromise) return liveWeatherPromise;
    const params = new URLSearchParams({
      latitude: '60.1699',
      longitude: '24.9384',
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m',
      timezone: 'Europe/Helsinki',
      temperature_unit: 'celsius',
      wind_speed_unit: 'ms',
      forecast_days: '1',
    });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    liveWeatherPromise = fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.error) throw new Error(payload.reason || `Sääpalvelu vastasi HTTP ${response.status}.`);
        if (!payload.current || !Number.isFinite(Number(payload.current.temperature_2m))) throw new Error('Sääpalvelun vastaus ei sisältänyt nykytilannetta.');
        liveWeather = { ...payload, error: '', fetchedAt: Date.now() };
      })
      .catch((error) => { liveWeather.error = error?.name === 'AbortError' ? 'Säähaku aikakatkaistiin.' : (error.message || 'Säähaku epäonnistui.'); })
      .finally(() => { window.clearTimeout(timeout); liveWeatherPromise = null; updateWeatherComponents(); });
    return liveWeatherPromise;
  }

  function dashboardManagementHub() {
    const weatherPosition = readWeatherWidgetPosition();
    const weather = `<div class="management-weather-widget" data-weather-widget style="left:${weatherPosition.left}%;top:${weatherPosition.top}%"><button class="management-weather-grip" type="button" data-weather-widget-handle aria-label="Siirrä sää- ja aikawidgetiä nuolinäppäimillä tai vetämällä kortista" title="Vedä kortista tai tartu tähän kahvaan"><span aria-hidden="true">⠿</span></button><a class="management-weather-chip" href="?page=weather" data-page="weather" aria-label="Avaa Helsingin sää ja aika" draggable="false"><img class="management-weather-icon" data-weather-icon src="assets/icons/weather/unknown.svg" alt="Säätä haetaan" width="36" height="36" draggable="false"><span class="management-weather-info"><strong data-weather-temperature>— °C</strong><small data-weather-condition>Haetaan säätä…</small><small data-weather-clock>${formatHelsinkiClock()}</small></span></a></div>`;
    const hotspots = MANAGEMENT_DESTINATIONS.map(([page, label, detail, x, y]) => `<a class="management-hotspot" href="?page=${page}" data-page="${page}" style="left:${x};top:${y}" aria-label="Avaa ${escapeHtml(label)}: ${escapeHtml(detail)}" title="${escapeHtml(label)}"><span class="management-hotspot-marker">${escapeHtml(PAGE_META[page].icon)}</span><span class="management-hotspot-label">${escapeHtml(label)}</span><span class="management-hotspot-preview"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></span></a>`).join('');
    const moduleLinks = MANAGEMENT_DESTINATIONS.map(([page, label, detail]) => `<a href="?page=${page}" data-page="${page}"><span aria-hidden="true">${escapeHtml(PAGE_META[page]?.icon || '⌘')}</span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></a>`).join('');
    const buildingId = `<details class="map-blueprint-id" style="left:43.4%;top:76.9%"><summary aria-label="Avaa rakennuksen tunnus ja piirustus" title="Rakennuksen tunnus · avaa piirustuksen"><span class="blueprint-id-mark" aria-hidden="true"><span class="blueprint-id-roll"></span><span class="blueprint-id-paper"><i></i><i></i><i></i></span></span><span class="blueprint-id-label">RAK-ID</span></summary><div class="blueprint-id-popover"><strong>Rakennuksen tunnus</strong><p>Tunnista kohteen rakennus ja avaa siihen liittyvät piirustusviitteet.</p><a class="button button-sm button-primary" href="?page=blueprints" data-page="blueprints">Avaa piirustusarkisto ↗</a></div></details>`;
    return `<section class="panel management-hub"><div class="panel-head"><div><p class="eyebrow">TYÖMAAN HALLINTA</p><h2>Aloita työ isometrisestä kartasta</h2><p>Valitse kartan alue tai avaa järjestelmän alalehdet mindmapista. Kaikki samat kohteet löytyvät myös luettelosta.</p></div><span class="tag blue">${MANAGEMENT_DESTINATIONS.length} moduulia</span></div><div class="management-hub-layout"><div class="management-map-scroll" role="region" aria-label="Isometrinen moduulikartta. Pyyhkäise sivusuunnassa nähdäksesi kartan kokonaan." tabindex="0"><div class="management-hub-stage"><img src="assets/illustrations/management-isometric-finance-civic.png" alt="Isometrinen työmaa- ja kaupunkikartta, jossa pankki- ja Wall Street -kortteli sekä viranomaisten lupakeskus ja poliisiasema" width="1774" height="887" fetchpriority="high">${weather}${hotspots}${buildingId}</div></div><section class="mindmap-panel" aria-label="Työtilan näkymät"><div class="mindmap-panel-head"><span class="mindmap-root-icon" aria-hidden="true">⌘</span><span><strong>Työtilan järjestelmät</strong><small>Valitse haara avataksesi alalehdet</small></span></div><nav id="mindmapNav" class="mindmap-nav mindmap-nav-panel" aria-label="Mindmap-tyyliset alalehdet"></nav><a class="mindmap-dev-link" href="?page=dev" data-page="dev"><span aria-hidden="true">▧</span> Muokkaa työtilan hahmotelmaa</a></section></div><details class="management-list-fallback"><summary>Avaa moduulit luettelona</summary><div class="management-hub-links">${moduleLinks}</div></details></section>`;
  }

  function financeDistrictPanel() {
    return `<section class="panel finance-district-panel"><div class="finance-district-copy"><p class="eyebrow">FINANCE · WALL STREET</p><h2>Pankki- ja talouskortteli</h2><p>Oma isometrinen alue pankille, pörssimäiselle yrityskadulle ja projektitalouden työkaluille.</p><a class="button button-primary" href="#financeEntry">＋ Lisää talousmuistio</a><a class="button" href="?page=contracts" data-page="contracts">▤ Sopimukset</a></div><div class="finance-district-window" role="img" aria-label="Lähikuva isometrisen kaupungin pankista ja Wall Street -tyylisestä finanssikorttelista"><span class="finance-district-bank-marker" aria-hidden="true">€</span><span class="finance-district-label">PANKKI · FINANCE</span></div></section>`;
  }

  function dashboardQuickActions() {
    return `<section class="dashboard-quick-actions" aria-label="Työmaan pikatoiminnot"><div><p class="eyebrow">KENTÄN PIKATOIMINNOT</p><h2>Mitä haluat tehdä?</h2></div><button class="quick-action-primary" data-action="new-task" type="button"><span aria-hidden="true">＋</span><strong>Uusi tehtävä</strong><small>Kirjaa työ ja vastuuhenkilö</small></button><a href="?page=time" data-page="time"><span aria-hidden="true">◷</span><strong>Kirjaa työaika</strong><small>Aloita tai tarkista vuoro</small></a><a href="?page=questions" data-page="questions"><span aria-hidden="true">✉</span><strong>Viestit ja kysymykset</strong><small>Seuraa työmaan avoimia asioita</small></a><a href="?page=scaffold" data-page="scaffold"><span aria-hidden="true">▦</span><strong>Työmaatiedot</strong><small>Avaa telineprojekti ja piirustus</small></a></section>`;
  }

  function siteRows() {
    const query = (state.filters.siteSearch || '').toLocaleLowerCase('fi');
    const sites = SITES.filter((site) => {
      const matchesText = `${site.name} ${site.city}`.toLocaleLowerCase('fi').includes(query);
      return matchesText && (state.filters.siteStatus === 'Kaikki tilat' || site.status === state.filters.siteStatus);
    });
    if (!sites.length) return '<div class="empty-state"><strong>Ei hakua vastaavia työmaita</strong>Muuta hakua tai tilasuodatusta.</div>';
    return sites.map((site) => {
      const dot = site.status === 'Tauolla' ? 'paused' : site.status === 'Suunnittelussa' ? 'planning' : '';
      const active = state.tasks.filter((task) => task.siteId === site.id && task.status !== 'Valmis').length;
      return `<div class="site-row"><i class="site-pin ${dot}" aria-hidden="true"></i><div><div class="site-name">${escapeHtml(site.name)}</div><div class="site-meta">${escapeHtml(site.city)} · ${active} avointa tehtävää</div></div>${statusTag(site.status)}</div>`;
    }).join('');
  }

  function recentTasks(limit = 4) {
    if (!state.tasks.length) return '<div class="empty-state"><strong>Ei tehtäviä</strong>Lisää ensimmäinen tehtävä työmaalle.</div>';
    return state.tasks.slice(0, limit).map((task) => `<div class="task-row"><button class="task-check ${task.status === 'Valmis' ? 'done' : ''}" type="button" data-action="toggle-task" data-id="${escapeHtml(task.id)}" aria-label="${task.status === 'Valmis' ? 'Avaa tehtävä uudelleen' : 'Merkitse tehtävä valmiiksi'}">${task.status === 'Valmis' ? '✓' : ''}</button><div class="task-row-main"><div class="task-row-title">${escapeHtml(task.title)}</div><div class="task-row-meta">${escapeHtml(siteName(task.siteId))} · ${statusTag(task.status)}</div></div><span class="task-row-date">${formatDate(task.dueDate)}</span></div>`).join('');
  }

  function dashboardProcessPanel() {
    const steps = [['scaffold','01','⌂','Kohde'],['blueprints','02','▧','Piirustus'],['bom','03','▤','BOM'],['courses','04','✓','Perehdytys']];
    return `<section class="panel dashboard-process-panel"><img src="assets/ui-packs/process-scaffold-work.jpg" alt="Työmaan työntekijät kokoavat telinettä ja nostavat rakennusosia vaiheittaisen workflow’n aikana" loading="lazy"><div><p class="eyebrow">PIPELINE · SUUNNITTELUSTA TYÖMAALLE</p><h2>Yksi selkeä työpolku</h2><p>Valitse vaiheesta suoraan kohde, piirustus, osaluettelo tai perehdytys.</p><div class="dashboard-process-steps" aria-label="Työmaan workflow-vaiheet">${steps.map(([page,number,icon,label])=>`<a href="?page=${page}" data-page="${page}"><small>${number}</small><span aria-hidden="true">${icon}</span><strong>${label}</strong><i aria-hidden="true">↗</i></a>`).join('')}</div></div></section>`;
  }

  function dashboardInvestmentBrief() {
    return `<section class="panel business-brief"><div class="panel-head"><div><p class="eyebrow">HANKKEEN ESITTELY · KRIITTINEN SKENAARIO</p><h2>Telinekonttori: suunnittelutyökalusta toteutusverkostoksi</h2><p>Paikallinen prototyyppi yhdistää rakennuskohteen, piirustushaun, 3D-luonnoksen, telineen materiaalilistan ja leadien hallinnan samaan työpolkuun.</p></div><span class="tag amber">Ei vielä validoitu liiketoiminta</span></div><div class="panel-body"><div class="business-brief-facts"><article><strong>Käytetty työmäärä</strong><b>Ei mitattu</b><small>Työtilan tuntiseurannassa ei ole kehitystunteja. Tuntimäärää tai kehityskustannusta ei voi esittää luotettavasti.</small></article><article><strong>Nykyinen vaihe</strong><b>Toimiva prototyyppi</b><small>Paikalliset kartta-, rakennus-, CAD/BOM-, CRM- ja crawler-virrat ovat kokeiltavissa; tuotanto, asiakkaat ja maksavat sopimukset eivät ole tässä työtilassa varmennettuja.</small></article><article><strong>Ensisijainen tavoite</strong><b>Maksettu pilotti</b><small>Vahvista yhdellä alueella, että piirustus → mitoitettu suunnitteluluonnos → tarjous → toteutettu työ tuottaa asiakkaalle säästöä.</small></article></div><h3>Liikevaihtoskenaario, jos myynti ja toimitus saadaan käyntiin</h3><p class="business-brief-note">Nämä ovat suunnitteluoletuksia, eivät ennusteita tai tilauskantaa. 1 ja 6 kk ovat kumulatiivisia; 1, 3 ja 5 vuotta ovat kyseisen vuoden liikevaihtoa. Oletuksena yksi oma tai kumppaniryhmä alussa, 5–10 kelpuutettua liidiä kuukaudessa, 15–20 % voittoprosentti ja noin 10–20 t€ keskimääräinen urakka. Hinnat, kalusto, palkat, vakuutukset, alihankinta ja käyttöpääoma voivat muuttaa tulosta olennaisesti.</p><div class="table-scroll"><table class="data-table business-brief-table"><thead><tr><th>Aikajänne</th><th>Mahdollinen liikevaihto</th><th>Välitavoite ja ehto</th></tr></thead><tbody><tr><td>1 kk</td><td>0–20 t€</td><td>Ensimmäinen maksettu pieni työ; useimmiten vielä myyntiä ja kustannusten selvitystä.</td></tr><tr><td>6 kk</td><td>50–200 t€ kumulatiivisesti</td><td>Toistuvat liidit, referenssit ja vähintään yksi toimiva toimitusryhmä.</td></tr><tr><td>1 v</td><td>200–600 t€ / vuosi</td><td>Yksi ryhmä tai vakaa alihankkijapari, mitattu kate, maksuehdot ja uusinta-asiakkaita.</td></tr><tr><td>3 v</td><td>0,8–2,5 M€ / vuosi</td><td>Useita samanaikaisia töitä, työnjohto ja alihankinta; kasvu vaatii kassaa ja laadunhallintaa.</td></tr><tr><td>5 v</td><td>2–6 M€ / vuosi</td><td>Alueellinen verkosto, useita luotettavia toteutusryhmiä ja vakaa tilaajakanava. Yläraja edellyttää isompia urakoita tai merkittävää kumppaniverkostoa.</td></tr></tbody></table></div><div class="business-brief-grid"><article><h3>Laajentuminen ja ulkoistus</h3><p>Älä palkkaa tai ulkoista pelkän leadimäärän perusteella. Ulkoista asennusryhmiä vasta, kun allekirjoitettu tilauskanta, osaaminen, vastuuvakuutus, perehdytys, turvallisuusmenettelyt ja työn vastaanotto on tarkistettu. Pidä asiakasvastuu, suunnittelun laadunvarmistus, aikataulu ja hyväksyntä nimetyllä vastuuhenkilöllä.</p></article><article><h3>Leadit eivät ole liikevaihtoa</h3><p>Seuraa erikseen liidi → kelpuutettu tarjous → voitettu tilaus → laskutettu työ → kassaan saatu maksu. Jos yritys toimii välittäjänä eikä urakan päätoimittajana, liikevaihto on välityspalkkio, ei koko urakkasumma. Esimerkiksi 1 M€ kumppanitöitä 5–10 % palkkiolla tuottaisi 50–100 t€ palkkioliikevaihtoa ennen kuluja.</p></article><article><h3>Markkinaosuus</h3><p>Tilastokeskuksen mukaan Suomen rakentamisen toimialan (F) yritysten liikevaihto oli 41,4 mrd € ja yrityksiä 55 598 vuonna 2025. <a href="https://stat.fi/fi/julkaisu/cmfqomge7027p08vykcomtyes" target="_blank" rel="noopener noreferrer">Lähde: Tilastokeskus ↗</a> Tätä koko toimialaa ei pidä käyttää telinepalvelun TAMina: tarkkaa teline- ja julkisivupalvelujen markkinarajausta ei ole vahvistettu. Koko rakennusalan nimittäjällä 2–6 M€ olisi vain noin 0,005–0,015 %, mutta se ei ole todellinen kohdemarkkinan markkinaosuus.</p></article></div><p class="business-brief-warning"><strong>Kriittinen tilannekuva:</strong> nykyinen näyttö todistaa ohjelmistoprototyypin etenemisestä, ei kysynnästä, kannattavuudesta tai markkinaosuudesta. Ennen kasvusuunnitelmaa tarvitaan 10–20 asiakashaastattelua, vähintään 3 maksettua pilottia, toteutuneiden urakoiden kate- ja kassavirtadata sekä vahvistettu vakuutus-, turvallisuus- ja alihankintamalli.</p></div></section>`;
  }

  function dashboardView() {
    const tabs=[['overview','Yleiskatsaus'],['teams','Tiimit'],['analytics','Analytiikka'],['risks','Riskianalyysi']];
    const tab=state.dashboardTab||'overview';
    const content=tab==='teams'?dashboardTeamsView():tab==='analytics'?dashboardAnalyticsView():tab==='risks'?dashboardRisksView():dashboardOverviewView();
    return `${heading('Telinekonttori', 'Valitse moduuli kartasta tai jatka suoraan työmaan tehtäviin.')}
      ${dashboardManagementHub()}
      ${dashboardQuickActions()}
      <div class="dashboard-tabs" role="tablist" aria-label="Hallintapaneelin näkymät">${tabs.map(([id,label])=>`<button type="button" role="tab" aria-selected="${tab===id}" class="dashboard-tab ${tab===id?'active':''}" data-action="dashboard-tab" data-tab="${id}">${label}</button>`).join('')}</div>
      <section role="tabpanel" class="dashboard-tab-panel">${content}</section>
      <details class="dashboard-more-info"><summary>Hankkeen suunnitelma ja työpolun hahmotelma</summary><div>${dashboardProcessPanel()}${dashboardInvestmentBrief()}</div></details>`;
  }

  function dashboardOverviewView() {
    const openTasks=state.tasks.filter((task)=>task.status!=='Valmis').length;
    const activeSites=SITES.filter((site)=>site.status==='Aktiivinen').length;
    const expiring=state.certificates.filter((cert)=>dayDistance(cert.validUntil)<=30).length;
    const pendingHours=state.logs.filter((log)=>log.status==='Odottaa').length;
    const mapSrc='https://kartta.hel.fi/embed/?layers=Karttasarja&minimap=1&maptools=1&legend=1&leftmenu=1&setlanguage=fi&easting=25496825&northing=6673044&resolution=4';
    const highlights=[];
    if(expiring)highlights.push(`${expiring} pätevyyttä vanhentunut tai vanhenee 30 päivän sisällä.`);
    const overdue=state.tasks.filter((task)=>task.status!=='Valmis'&&task.dueDate<TODAY_ISO).length;
    if(overdue)highlights.push(`${overdue} tehtävän määräaika on ohitettu.`);
    if(!highlights.length)highlights.push('Ei avoimia huomioita työtilan nykyisissä tiedoissa.');
    return `<div class="metric-grid">${metric('⌖','Aktiiviset työmaat',activeSites,`${SITES.length} työmaata työtilassa`,'blue')}${metric('♙','Työntekijät',new Set(state.certificates.map((cert)=>cert.employee).filter(Boolean)).size,'henkilöä pätevyysrekisterissä','purple')}${metric('◷','Odottavat tunnit',pendingHours,'kirjattua hyväksyntäjonoa','amber')}${metric('€','Kuukauden laskutus','—','laskutustietoja ei ole tässä työtilassa','green')}</div>
      <div class="dashboard-grid"><section class="panel map-panel"><div class="panel-head"><div><h2>Työmaakartta</h2><p>Helsingin kaupungin karttapalvelu</p></div><span class="map-live"><i></i> Karttapalvelu</span></div><iframe class="map-frame" src="${mapSrc}" title="Helsingin upotettu kartta" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen"></iframe><div class="map-attribution"><span>Kartta-aineisto: © Helsingin kaupunki · <a href="https://kartta.hel.fi/" target="_blank" rel="noopener">kartta.hel.fi</a></span><span class="map-actions"><a href="buildings.html">3D-rakennukset ↗</a><a href="matrix-coderain.html">Karttakuva ↗</a></span></div></section>
      <div class="side-stack"><section class="panel"><div class="panel-head"><div><h2>Huomioitavaa</h2><p>Työtilan tarkistettavat asiat</p></div><span class="tag amber">${highlights.length}</span></div><div class="panel-body dashboard-highlight-list">${highlights.map((item)=>`<p>${escapeHtml(item)}</p>`).join('')}</div></section><section class="panel"><div class="panel-head"><div><h2>Aktiiviset työmaat</h2><p>Projektien tämänhetkinen tila</p></div><a class="button button-sm" href="?page=tasks" data-page="tasks">Tehtävät</a></div><div class="panel-body site-list">${siteRows()}</div></section><section class="panel"><div class="panel-head"><div><h2>Viimeisimmät tunnit</h2><p>${state.logs.length} kirjattua työvuoroa</p></div><a class="button button-sm" href="?page=time" data-page="time">Työajat</a></div><div class="panel-body dashboard-hours-list">${state.logs.slice(-5).reverse().map((log)=>`<div><strong>${escapeHtml(log.employee||state.profile.name||'Työntekijä')}</strong><span>${escapeHtml(siteName(log.siteId))}</span><b>${escapeHtml(log.total||formatHours(log.durationMs||0))}</b><em>${escapeHtml(log.status||'Tallennettu')}</em></div>`).join('')||'<p class="muted">Työvuoroja ei ole vielä kirjattu.</p>'}</div></section></div></div>
      <div class="dashboard-bottom-grid"><section class="panel"><div class="panel-head"><div><h2>Viimeisimmät tehtävät</h2><p>${openTasks} avointa tehtävää</p></div><a class="button button-sm" href="?page=tasks" data-page="tasks">Kaikki tehtävät</a></div><div class="panel-body task-list">${recentTasks(4)}</div></section><section class="panel"><div class="panel-head"><div><h2>Pätevyydet</h2><p>Vanhentuneet ja lähiaikoina vanhenevat</p></div><a class="button button-sm" href="?page=certificates" data-page="certificates">Avaa rekisteri</a></div><div class="panel-body dashboard-hours-list">${state.certificates.filter((cert)=>dayDistance(cert.validUntil)<=30).map((cert)=>`<div><strong>${escapeHtml(cert.type)}</strong><span>${escapeHtml(cert.employee)}</span><b>${escapeHtml(cert.validUntil)}</b><em>${dayDistance(cert.validUntil)<0?'Vanhentunut':'Vanhenee pian'}</em></div>`).join('')||'<p class="muted">Ei lähiaikoina vanhenevia pätevyyksiä.</p>'}</div></section></div>`;
  }

  function dashboardTeamsView() {
    const assignees=[...new Set(state.tasks.map((task)=>task.assignee).filter(Boolean))];
    const hours=(siteId)=>state.logs.filter((log)=>log.siteId===siteId).reduce((sum,log)=>sum+Number(log.durationMs||0),0);
    return `<div class="dashboard-team-toolbar"><span class="tag blue">${assignees.length} tehtäville merkittyä vastuuhenkilöä</span><span class="muted small">Työtilassa ei ole erillistä tiimien jäsenrekisteriä; kooste näyttää nykyiset tehtävävastuut.</span></div><div class="dashboard-team-grid">${SITES.map((site)=>{const tasks=state.tasks.filter((task)=>task.siteId===site.id),owners=[...new Set(tasks.map((task)=>task.assignee).filter(Boolean))];return `<article class="panel dashboard-team-card"><div class="panel-head"><div><h2>${escapeHtml(site.name)}</h2><p>${escapeHtml(site.city)} · ${escapeHtml(site.status)}</p></div><span class="tag">${owners.length} vastuuhenkilöä</span></div><div class="panel-body"><div class="dashboard-team-stats"><div><strong>${owners.length}</strong><span>Vastuuhenkilöitä</span></div><div><strong>${formatHours(hours(site.id))}</strong><span>Kirjatut tunnit</span></div><div><strong>${tasks.filter((task)=>task.status!=='Valmis').length}</strong><span>Avoimia tehtäviä</span></div></div><h3>Tehtävävastuut</h3>${owners.length?owners.map((owner)=>`<div class="dashboard-owner-row"><span class="avatar-small">${escapeHtml(owner.slice(0,2).toUpperCase())}</span><span>${escapeHtml(owner)}</span><strong>${tasks.filter((task)=>task.assignee===owner&&task.status!=='Valmis').length} avointa</strong></div>`).join(''):'<p class="muted">Ei tehtäville merkittyjä vastuuhenkilöitä.</p>'}<h3>Työmaan tehtävät</h3><p>${tasks.length} tehtävää · ${tasks.filter((task)=>task.status==='Valmis').length} valmista</p></div></article>`;}).join('')}</div>`;
  }

  function dashboardAnalyticsView() {
    const siteFilter=state.dashboardAnalyticsSite||'';
    const logs=state.logs.filter((log)=>!siteFilter||log.siteId===siteFilter);
    const tasks=state.tasks.filter((task)=>!siteFilter||task.siteId===siteFilter);
    const totalMs=logs.reduce((sum,log)=>sum+Number(log.durationMs||0),0)+(state.activeShift&&(!siteFilter||state.activeShift.siteId===siteFilter)?currentShiftMs():0);
    const completed=tasks.filter((task)=>task.status==='Valmis').length;
    const progress=SITES.filter((site)=>!siteFilter||site.id===siteFilter).map((site)=>{const items=tasks.filter((task)=>task.siteId===site.id);return {site,percent:items.length?Math.round(items.filter((task)=>task.status==='Valmis').length/items.length*100):0,items:items.length};});
    const days=Array.from({length:7},(_,i)=>{const date=addDays(TODAY,i-6),iso=toIso(date);const ms=logs.filter((log)=>log.date===iso).reduce((sum,log)=>sum+Number(log.durationMs||0),0);return {date,iso,ms,hours:ms/3600000};});
    const max=Math.max(1,...days.map((d)=>d.hours));
    return `<div class="dashboard-analytics-top"><span class="tag blue">Työtilan tallennetut tiedot</span><label>Työmaa<select id="dashboardAnalyticsSite"><option value="">Kaikki työmaat</option>${SITES.map((site)=>`<option value="${site.id}" ${siteFilter===site.id?'selected':''}>${escapeHtml(site.name)}</option>`).join('')}</select></label></div><div class="metric-grid">${metric('◷','Kirjatut työtunnit',formatHours(totalMs),'tallennetut työvuorot','blue')}${metric('✓','Tehtävien valmistuminen',`${completed}/${tasks.length}`,'valmista tehtävää','green')}${metric('⌂','Työmaat',progress.length,'suodatuksessa','purple')}${metric('▤','Kaluston käyttöaste','—','kalustokirjanpitoa ei ole liitetty','amber')}</div><div class="dashboard-analytics-grid"><section class="panel"><div class="panel-head"><div><h2>Työtuntien trendi</h2><p>Viimeiset 7 päivää</p></div></div><div class="panel-body dashboard-bar-chart">${days.map((item)=>`<div class="dashboard-bar-column"><div class="dashboard-bar-value">${item.hours.toFixed(1)} h</div><div class="dashboard-bar-track"><i style="height:${Math.max(item.hours?5:0,item.hours/max*100)}%"></i></div><span>${new Intl.DateTimeFormat('fi-FI',{weekday:'short',day:'numeric'}).format(item.date)}</span></div>`).join('')}</div><p class="dashboard-legend"><i></i>Kirjatut tunnit</p></section><section class="panel"><div class="panel-head"><div><h2>Tehtävien tila</h2><p>Valmiit ja työn alla</p></div></div><div class="panel-body dashboard-status-chart">${TASK_STATES.map((status)=>{const count=tasks.filter((task)=>task.status===status).length;return `<div><span>${status}</span><div class="dashboard-progress"><i class="${status==='Valmis'?'green':status==='Käynnissä'?'blue':'amber'}" style="width:${tasks.length?count/tasks.length*100:0}%"></i></div><strong>${count}</strong></div>`;}).join('')}</div><p class="muted small">Raportti käyttää tämän työtilan tehtäviä. Ylityö- ja kalustotietoja ei ole tallennettuna.</p></section></div><section class="panel dashboard-progress-panel"><div class="panel-head"><div><h2>Työmaiden eteneminen</h2><p>Valmiiden tehtävien osuus</p></div></div><div class="panel-body dashboard-site-progress">${progress.map(({site,percent,items})=>`<div><div><strong>${escapeHtml(site.name)}</strong><span>${escapeHtml(site.city)}</span></div><div class="dashboard-progress"><i class="green" style="width:${percent}%"></i></div><strong>${items?`${percent}%`:'—'}</strong><small>${items} tehtävää</small></div>`).join('')}</div></section><div class="dashboard-export-row"><span class="muted small">Työtunteja yhteensä ${formatHours(totalMs)} · ${tasks.length} tehtävää</span><button class="button button-sm" data-action="download-dashboard-report" type="button">Lataa CSV</button></div>`;
  }

  function dashboardRisksView() {
    const risks=[];
    for(const cert of state.certificates){const days=dayDistance(cert.validUntil);if(days<=30)risks.push({type:'Pätevyys',title:`${cert.type} · ${cert.employee}`,detail:days<0?`Vanhentunut ${Math.abs(days)} päivää sitten`:`Vanhenee ${days} päivän kuluttua`,level:days<0?'Kriittinen':'Korkea',score:days<0?90:70});}
    for(const task of state.tasks){if(task.status!=='Valmis'&&task.dueDate<TODAY_ISO){const days=Math.abs(dayDistance(task.dueDate));risks.push({type:'Määräaika',title:task.title,detail:`${siteName(task.siteId)} · ${days} päivää myöhässä`,level:days>7?'Korkea':'Keskitaso',score:days>7?72:50});}}
    risks.sort((a,b)=>b.score-a.score);
    const mean=risks.length?Math.round(risks.reduce((sum,r)=>sum+r.score,0)/risks.length):0;
    const delay=state.tasks.filter((task)=>task.status!=='Valmis'&&task.dueDate<TODAY_ISO).reduce((sum,task)=>sum+Math.abs(dayDistance(task.dueDate)),0);
    const costs='—';
    return `<div class="metric-grid">${metric('⚠','Tunnistettua riskiä',risks.length,'säännöillä löydettyä huomiota',risks.length?'amber':'green')}${metric('€','Arvioitu kustannusvaikutus',costs,'kustannustietoja ei ole','purple')}${metric('◷','Viivästyspäivät',delay,'myöhässä olevista avoimista tehtävistä','blue')}${metric('◎','Keskimääräinen riskipiste',mean,'sääntöpohjainen 0–100','amber')}</div><div class="dashboard-risk-charts"><section class="panel"><div class="panel-head"><div><h2>Riskijakauma vakavuuden mukaan</h2><p>Työtilan tiedoista</p></div></div><div class="panel-body dashboard-risk-bars">${['Kriittinen','Korkea','Keskitaso','Matala'].map((level)=>{const count=risks.filter((risk)=>risk.level===level).length;return `<div><span>${level}</span><div class="dashboard-progress"><i class="${level==='Kriittinen'?'red':level==='Korkea'?'amber':'blue'}" style="width:${risks.length?count/risks.length*100:0}%"></i></div><strong>${count}</strong></div>`;}).join('')}</div></section><section class="panel"><div class="panel-head"><div><h2>Riskit tyypeittäin</h2><p>Tunnistetut aineistot</p></div></div><div class="panel-body dashboard-risk-bars">${['Pätevyys','Määräaika'].map((type)=>{const count=risks.filter((risk)=>risk.type===type).length;return `<div><span>${type}</span><div class="dashboard-progress"><i class="purple" style="width:${risks.length?count/risks.length*100:0}%"></i></div><strong>${count}</strong></div>`;}).join('')}</div></section></div><section class="panel"><div class="panel-head"><div><h2>Kriittisimmät riskit</h2><p>Pätevyydet ja tehtävien määräajat</p></div><span class="tag ${risks.length?'amber':'green'}">${risks.length}</span></div><div class="panel-body dashboard-risk-list">${risks.length?risks.map((risk)=>`<article><span class="tag ${risk.level==='Kriittinen'?'red':'amber'}">${risk.level} · ${risk.score}/100</span><div><strong>${escapeHtml(risk.title)}</strong><small>${escapeHtml(risk.type)} · ${escapeHtml(risk.detail)}</small></div></article>`).join(''):'<p class="muted">Ei tunnistettuja riskejä tämän työtilan nykyisistä pätevyys- ja tehtävätiedoista.</p>'}</div></section><div class="privacy-note"><strong>Riskikatsauksen rajaus:</strong> tämä näkymä käyttää läpinäkyviä sääntöjä pätevyysrekisterin ja tehtävien määräaikojen tarkistamiseen. Se ei sisällä tekoälyanalyysiä, turvallisuuskuvien käsittelyä, sääennustetta eikä taloudellista riskimallia.</div>`;
  }

  function taskView() {
    const search = state.filters.taskSearch.toLocaleLowerCase('fi');
    const tasks = state.tasks.filter((task) => {
      const matchesSearch = [task.title, task.description, task.project, task.assignee, siteName(task.siteId)].join(' ').toLocaleLowerCase('fi').includes(search);
      const matchesStatus = state.filters.taskStatus === 'Kaikki tilat' || task.status === state.filters.taskStatus;
      const matchesPriority = state.filters.taskPriority === 'Kaikki prioriteetit' || task.priority === state.filters.taskPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
    const lateCount = state.tasks.filter((task) => task.status !== 'Valmis' && task.dueDate < TODAY_ISO).length;
    return `${heading('Tehtävät', 'Hallitse projektien ja työmaiden tehtäviä.', `<button class="button button-primary" data-action="new-task" type="button">＋ Uusi tehtävä</button>`)}
      <div class="metric-grid">${metric('▤', 'Yhteensä', state.tasks.length, 'kaikki tehtävät', 'blue')}${metric('○', 'Tekemättä', state.tasks.filter((task) => task.status === 'Tekemättä').length, 'aloittamatta', 'amber')}${metric('◷', 'Käynnissä', state.tasks.filter((task) => task.status === 'Käynnissä').length, 'aktiiviset', 'purple')}${metric('✓', 'Myöhässä', lateCount, 'määräaika ohitettu', lateCount ? 'amber' : 'green')}</div>
      <div class="toolbar"><input class="search-input" type="search" id="taskSearch" placeholder="Hae tehtävää, työmaata tai vastuuhenkilöä…" value="${escapeHtml(state.filters.taskSearch)}" aria-label="Hae tehtäviä"><select class="select-control" id="taskStatusFilter" aria-label="Suodata tilan mukaan">${['Kaikki tilat', ...TASK_STATES].map((item) => `<option ${state.filters.taskStatus === item ? 'selected' : ''}>${item}</option>`).join('')}</select><select class="select-control" id="taskPriorityFilter" aria-label="Suodata prioriteetin mukaan">${['Kaikki prioriteetit', ...PRIORITIES].map((item) => `<option ${state.filters.taskPriority === item ? 'selected' : ''}>${item}</option>`).join('')}</select><span class="tag">${tasks.length} näytetty</span></div>
      <div class="task-board">${tasks.length ? tasks.map((task) => `<article class="task-card"><div class="task-card-main"><button class="task-check ${task.status === 'Valmis' ? 'done' : ''}" type="button" data-action="toggle-task" data-id="${escapeHtml(task.id)}" aria-label="Vaihda tehtävän tilaa">${task.status === 'Valmis' ? '✓' : ''}</button><div><div class="task-card-title">${escapeHtml(task.title)}</div><div class="task-card-desc">${escapeHtml(task.description || 'Ei kuvausta')}</div></div></div><div class="task-meta-cell"><div class="task-card-label">Työmaa</div><div class="task-card-value">${escapeHtml(siteName(task.siteId))}</div></div><div class="task-meta-cell task-assignee"><div class="task-card-label">Vastuuhenkilö</div><div class="task-card-value">${escapeHtml(task.assignee)}</div></div><div class="task-meta-cell"><div class="task-card-label">Tila · määräaika</div><div class="task-card-value">${statusTag(task.status)} <span>${formatDate(task.dueDate)}</span></div></div><span class="tag ${task.priority === 'Korkea' ? 'red' : task.priority === 'Normaali' ? 'blue' : ''}">${escapeHtml(task.priority)}</span></article>`).join('') : '<div class="empty-state"><strong>Ei hakua vastaavia tehtäviä</strong>Muuta hakua tai suodattimia.</div>'}</div>`;
  }

  function calendarView() {
    const selected = new Date(`${state.calendarDate || TODAY_ISO}T12:00:00`);
    const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const mondayOffset = (monthStart.getDay() + 6) % 7;
    const gridStart = addDays(monthStart, -mondayOffset);
    const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
    const monthLabel = new Intl.DateTimeFormat('fi-FI', { month: 'long', year: 'numeric' }).format(selected);
    const cells = days.map((day) => {
      const iso = toIso(day);
      const outside = day.getMonth() !== selected.getMonth();
      const dayTasks = state.tasks.filter((task) => task.dueDate === iso);
      const dayEvents = (state.calendarEvents || []).filter((event) => event.date === iso);
      const shift = state.logs.find((log) => log.date === iso);
      return `<div class="calendar-day ${outside ? 'outside' : ''} ${iso === TODAY_ISO ? 'today' : ''}"><div class="calendar-date">${day.getDate()}</div><div class="calendar-events">${dayTasks.slice(0, 3).map((task) => `<div class="calendar-event ${task.status === 'Valmis' ? 'done' : task.dueDate < TODAY_ISO ? 'overdue' : ''}" title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</div>`).join('')}${dayEvents.slice(0, 2).map((item) => `<div class="calendar-event event-${escapeHtml(item.type)}" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>`).join('')}${shift ? `<div class="calendar-event event-work">Työvuoro ${escapeHtml(shift.total || '')}</div>` : ''}</div></div>`;
    }).join('');
    return `${heading('Kalenteri', 'Työmaat, tarkastukset, määräajat ja työajat.', `<div class="calendar-tools"><button class="button button-sm" data-action="prev-month" type="button" aria-label="Edellinen kuukausi">‹</button><span class="calendar-month">${escapeHtml(monthLabel)}</span><button class="button button-sm" data-action="today-month" type="button">Tänään</button><button class="button button-sm" data-action="next-month" type="button" aria-label="Seuraava kuukausi">›</button></div>`)}<section class="panel"><div class="panel-head"><div><h2>Kuukausinäkymä</h2><p>Työmaiden aloitukset, tarkastukset, määräajat ja työajat</p></div><button class="button button-sm" data-action="new-task" type="button">＋ Lisää tehtävä</button></div><div class="panel-body"><div class="calendar-grid">${['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'].map((day) => `<div class="calendar-weekday">${day}</div>`).join('')}${cells}</div><div class="calendar-legend"><span><i class="legend-dot"></i>Työmaan aloitus / päättyminen</span><span><i class="legend-dot purple"></i>Tarkastus</span><span><i class="legend-dot green"></i>Työaika / valmis</span><span><i class="legend-dot amber"></i>Lasku</span><span><i class="legend-dot red"></i>Ohitettu määräaika</span></div></div></section>`;
  }

  function currentShiftMs() {
    return state.activeShift ? Date.now() - new Date(state.activeShift.startedAt).getTime() : 0;
  }

  function todayHours() {
    const logged = state.logs.filter((log) => log.date === TODAY_ISO).reduce((sum, log) => sum + Number(log.durationMs || 0), 0);
    return logged + currentShiftMs();
  }

  function logTable() {
    const rows = state.logs.slice().reverse().slice(0, 10);
    return rows.length ? rows.map((log) => `<tr><td>${formatDate(log.date, { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>${escapeHtml(siteName(log.siteId))}</td><td>${escapeHtml(log.startedAt ? formatTime(log.startedAt) : '—')}${log.endedAt ? `–${formatTime(log.endedAt)}` : ''}</td><td>${escapeHtml(log.total || formatHours(log.durationMs || 0))}</td><td>${log.status === 'Käynnissä' ? statusTag('Käynnissä') : statusTag('Valmis')}</td></tr>`).join('') : '<tr><td colspan="5" class="muted">Työvuoroja ei ole vielä kirjattu.</td></tr>';
  }

  function worktimePanel(isMobile = false) {
    return `<section class="panel clock-panel"><p class="eyebrow">${isMobile ? 'TYÖVUORO' : 'TYÖAJAN KIRJAUS'}</p><div class="clock-face" id="clockFace">${formatHours(todayHours())}</div><p class="clock-state">${state.activeShift ? 'Työvuoro käynnissä' : 'Ei aktiivista työvuoroa'}</p><p class="clock-description">${state.activeShift ? `${escapeHtml(siteName(state.activeShift.siteId))} · alkoi ${formatTime(state.activeShift.startedAt)}` : 'Valitse työmaa ja aloita työvuoron kirjaus.'}</p><label class="sr-only" for="workSiteSelect">Valitse työmaa</label><select class="select-control" id="workSiteSelect">${SITES.map((site) => `<option value="${site.id}" ${state.activeShift?.siteId === site.id ? 'selected' : ''}>${escapeHtml(site.name)}</option>`).join('')}</select>${state.activeShift ? '<button class="button button-danger" data-action="clock-out" type="button">■ Päätä työvuoro</button>' : '<button class="button button-primary" data-action="clock-in" type="button">▶ Aloita työvuoro</button>'}</section>`;
  }

  function timeView() {
    return `${heading('Työajanseuranta', 'Aloita työvuoro ja tarkastele paikallisia työaikamerkintöjä.')}
      <div class="time-grid">${worktimePanel()}<div><section class="panel"><div class="panel-head"><div><h2>Tämän päivän yhteenveto</h2><p>${formatDate(TODAY_ISO, { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>${statusTag(state.activeShift ? 'Käynnissä' : 'Valmis')}</div><div class="panel-body"><div class="summary-strip"><div class="summary-item"><span>Työtunnit tänään</span><strong id="hoursSummary">${formatHours(todayHours())}</strong></div><div class="summary-item"><span>Aktiivinen työmaa</span><strong style="font-size:10px">${escapeHtml(state.activeShift ? siteName(state.activeShift.siteId) : '—')}</strong></div><div class="summary-item"><span>Tallennettuja vuoroja</span><strong>${state.logs.length}</strong></div></div><h3 class="eyebrow">VIIMEISIMMÄT TYÖVUOROT</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Päivä</th><th>Työmaa</th><th>Aika</th><th>Kesto</th><th>Tila</th></tr></thead><tbody>${logTable()}</tbody></table></div></div></section></div></div>`;
  }

  function mobileView() {
    const tab = state.mobileTab || 'time';
    const taskList = state.tasks.filter((task) => task.status !== 'Valmis');
    let content = '';
    if (tab === 'time') content = `<h2>Aloita työvuoro</h2>${worktimePanel(true)}<div class="summary-strip" style="margin-top:12px"><div class="summary-item"><span>Työtunnit tänään</span><strong>${formatHours(todayHours())}</strong></div><div class="summary-item"><span>Ylityöt</span><strong>0 h</strong></div><div class="summary-item"><span>Tehtäviä tänään</span><strong>${taskList.length}</strong></div></div>`;
    if (tab === 'tasks') content = `<h2>Omat tehtävät</h2>${taskList.length ? taskList.map((task) => `<div class="task-row"><button class="task-check" type="button" data-action="toggle-task" data-id="${escapeHtml(task.id)}" aria-label="Merkitse valmiiksi"></button><div class="task-row-main"><div class="task-row-title">${escapeHtml(task.title)}</div><div class="task-row-meta">${escapeHtml(siteName(task.siteId))} · ${formatDate(task.dueDate)}</div></div>${statusTag(task.priority)}</div>`).join('') : '<div class="empty-state"><strong>Ei avoimia tehtäviä</strong>Kaikki tehtävät ovat valmiit.</div>'}`;
    if (tab === 'messages') content = `<h2>Viestit</h2><div class="message-row"><strong>Tervetuloa työtilaan</strong><p>Tämä paikallinen näkymä käyttää vain esimerkkitietoja. Viestitoiminto ei ole yhdistetty palvelimeen.</p></div>`;
    return `${heading('Mobiilityötila', 'Työvuoro ja omat tehtävät puhelimelle sopivassa näkymässä.')}<section class="mobile-card"><div class="mobile-hero"><div class="mobile-profile"><span class="avatar">D</span><span><strong>${escapeHtml(state.profile.name || 'Demo-käyttäjä')}</strong><small>${escapeHtml(state.profile.role || 'Työmaan työntekijä')}</small></span></div><div class="mobile-stats"><div class="mobile-stat"><span>Työvuoro</span><strong>${state.activeShift ? 'Aktiivinen' : 'Ei aktiivinen'}</strong></div><div class="mobile-stat"><span>Tehtävät</span><strong>${taskList.length} avointa</strong></div></div></div><div class="mobile-body"><div class="mobile-tabs" role="tablist"><button type="button" role="tab" data-action="mobile-tab" data-tab="time" class="${tab === 'time' ? 'active' : ''}">◷ Työaika</button><button type="button" role="tab" data-action="mobile-tab" data-tab="tasks" class="${tab === 'tasks' ? 'active' : ''}">✓ Tehtävät</button><button type="button" role="tab" data-action="mobile-tab" data-tab="messages" class="${tab === 'messages' ? 'active' : ''}">▱ Viestit</button></div>${content}</div></section>`;
  }

  function profileView() {
    return `${heading('Oma profiili', 'Tiedot kuuluvat vain tämän selaimen paikalliseen demo-työtilaan.', `<button class="button button-primary" data-action="edit-profile" type="button">Muokkaa tietoja</button>`)}<section class="panel"><div class="panel-head"><div><h2>Profiili</h2><p>Paikallisen käyttäjän tiedot</p></div><span class="tag green">Demo</span></div><div class="panel-body"><div class="summary-strip"><div class="summary-item"><span>Nimi</span><strong>${escapeHtml(state.profile.name || 'Demo-käyttäjä')}</strong></div><div class="summary-item"><span>Rooli</span><strong>${escapeHtml(state.profile.role || '—')}</strong></div><div class="summary-item"><span>Sähköposti</span><strong style="font-size:10px">${escapeHtml(state.profile.email || 'Ei asetettu')}</strong></div></div><div class="form-grid"><div class="privacy-note">Profiilin muutokset tallentuvat selaimen paikalliseen tallennustilaan. Tietoja ei lähetetä Base44-palveluun.</div><div class="privacy-note">Sertifikaatit ja työaikamerkinnät käyttävät samoja paikallisia esimerkkiprofiilin nimiä.</div></div></div></section>`;
  }

  function certificateView() {
    const search = state.filters.certificateSearch.toLocaleLowerCase('fi');
    const certs = state.certificates.filter((cert) => `${cert.type} ${cert.employee} ${cert.number}`.toLocaleLowerCase('fi').includes(search) && (state.filters.certificateType === 'Kaikki tyypit' || cert.type === state.filters.certificateType));
    const types = [...new Set(state.certificates.map((cert) => cert.type).filter(Boolean))];
    const expired = state.certificates.filter((cert) => dayDistance(cert.validUntil) < 0).length;
    const soon = state.certificates.filter((cert) => dayDistance(cert.validUntil) >= 0 && dayDistance(cert.validUntil) <= 30).length;
    const cards = certs.map((cert) => {
      const remaining = dayDistance(cert.validUntil);
      const expired = remaining < 0;
      const near = remaining >= 0 && remaining <= 30;
      const tag = expired ? '<span class="tag red">Vanhentunut</span>' : near ? '<span class="tag amber">Vanhenee pian</span>' : '<span class="tag green">Voimassa</span>';
      return `<article class="certificate-card">${tag}<h3>${escapeHtml(cert.type)}</h3><p>${escapeHtml(cert.employee)}</p><div class="certificate-info"><span>Myönnetty<strong>${formatDate(cert.issuedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span><span>Voimassa asti<strong>${formatDate(cert.validUntil, { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span><span>Tunniste<strong>${escapeHtml(cert.number || '—')}</strong></span></div></article>`;
    }).join('');
    return `${heading('Sertifikaatit', 'Seuraa työmaan henkilöstön pätevyyksiä ja voimassaoloa.', `<button class="button button-primary" data-action="new-certificate" type="button">＋ Lisää sertifikaatti</button>`)}<div class="metric-grid">${metric('▤', 'Yhteensä', state.certificates.length, 'sertifikaattia', 'blue')}${metric('✓', 'Voimassa', state.certificates.length - expired - soon, 'yli 30 päivää jäljellä', 'green')}${metric('◷', 'Vanhenee pian', soon, 'seuraavan 30 päivän aikana', 'amber')}${metric('!', 'Vanhentunut', expired, 'tarkista pätevyys', 'purple')}</div>${expired || soon ? `<div class="cert-alert">⚠ ${expired ? `${expired} vanhentunut` : ''}${expired && soon ? ' ja ' : ''}${soon ? `${soon} vanhenee 30 päivän kuluessa` : ''}. Tarkista työvuoron pätevyydet ennen työskentelyä.</div>` : ''}<div class="toolbar"><input id="certificateSearch" class="search-input" type="search" placeholder="Hae henkilön tai pätevyyden mukaan…" aria-label="Hae sertifikaatteja" value="${escapeHtml(state.filters.certificateSearch)}"><select id="certificateTypeFilter" class="select-control" aria-label="Suodata pätevyyden tyypin mukaan"><option ${state.filters.certificateType === 'Kaikki tyypit' ? 'selected' : ''}>Kaikki tyypit</option>${types.map((type) => `<option ${state.filters.certificateType === type ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('')}</select><span class="tag">${certs.length} näytetty</span></div><div class="certificate-grid">${cards || '<div class="empty-state"><strong>Ei sertifikaatteja</strong>Lisää paikalliseen työtilaan ensimmäinen pätevyys.</div>'}</div>`;
  }

  function dayDistance(dateString) {
    if (!dateString) return Infinity;
    const date = new Date(`${dateString}T00:00:00`);
    return Math.floor((date - TODAY) / 86400000);
  }

  function scaffoldSupportView() {
    const stages = [
      ['loads-transfer', 'Kuormat ja kuormansiirto'], ['foundations', 'Perustukset ja alusta'],
      ['standards-platforms', 'Pystyrakenteet ja työtasot'], ['bracing-ties', 'Jäykistys ja sidonnat'],
      ['global-stability', 'Kokonaisvakavuus'],
    ];
    const history = (state.scaffoldCalculations || []).map((calc) => `<article class="scaffold-calc-card"><div class="panel-head"><div><h3>${escapeHtml(calc.inputSnapshot?.project?.name || 'Nimetön projekti')}</h3><p>${escapeHtml(calc.inputSnapshot?.project?.drawingRevision || 'Ei piirustusrevisiota')} · ${formatDate((calc.createdAt || '').slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><span class="tag ${calc.status === 'reviewed' ? 'green' : calc.status === 'incomplete' || calc.status === 'stale' ? 'amber' : 'blue'}">${calc.status === 'reviewed' ? 'Tarkastettu' : calc.status === 'incomplete' ? 'Puutteellinen' : calc.status === 'stale' ? 'Vanhentunut · uusi laskenta tarvitaan' : 'Suunnittelijan tarkastus'}</span></div><div class="panel-body"><p>${escapeHtml(calc.method || '')}</p><ul>${(calc.checks || []).map((check) => `<li>${escapeHtml(check.label)}: ${check.result ? `Ed/Rd ${check.result.utilization} (${escapeHtml(check.result.unit)})${check.status === 'exceeds-input-ratio' ? ' · YLITTÄÄ syötetyn Rd-arvon' : ''}` : 'tiedot puuttuvat'}</li>`).join('')}</ul>${calc.missing?.length ? `<div class="privacy-note"><strong>Lisätiedot:</strong> ${calc.missing.map(escapeHtml).join(' · ')}</div>` : ''}${calc.review ? `<p class="small">Tarkastaja ${escapeHtml(calc.review.name)} · ${escapeHtml(calc.review.date)}</p>` : `<form class="scaffold-review-form" data-calc-review="${escapeHtml(calc.id)}"><label>Nimi <input name="reviewer" required placeholder="Tarkastajan nimi"></label><label><input name="confirm" type="checkbox" required> Olen pätevä tarkastaja ja olen tarkastanut tämän vedoksen</label><button class="button button-sm" type="submit" ${(calc.status === 'incomplete' || calc.status === 'stale') ? 'disabled' : ''}>Kirjaa tarkastus</button></form>`}</div></article>`).join('') || '<div class="empty-state"><strong>Ei laskelmia</strong>Tallenna ensin projektin lähtötiedot ja tarkastusvertailut.</div>';
    return `<section class="panel scaffold-panel"><div class="panel-head"><div><p class="eyebrow">PAIKALLINEN PÄÄTÖSTUKI · VERSIOITU VEDOS</p><h2>Telineiden mitoitustuki</h2><p>Viisi tarkastusvaihetta. Vain lähteistettyjen Ed- ja Rd-arvojen suhde lasketaan.</p></div><span class="tag amber">Ei automaattista hyväksyntää</span></div><div class="panel-body"><div class="privacy-note"><strong>Suunnittelijan vastuu:</strong> Suomessa telineen lujuus, jäykkyys ja vakaus sekä rakennesuunnitelman sisältö määräytyvät sovellettavien vaatimusten mukaan. Työkalu ei johda kuormia tai kapasiteetteja. ${'<a href="https://www.finlex.fi/fi/lainsaadanto/saadoskokoelma/2009/205" target="_blank" rel="noopener noreferrer">Asetus 205/2009, 51 ja 53 § ↗</a>'}</div><form id="scaffoldCalculationForm"><h3>Projektin ja työmaan lähtötiedot</h3><div class="form-grid scaffold-form-grid"><label>Projektin nimi *<input name="projectName" required></label><label>Piirustuksen revisio *<input name="drawingRevision" required></label><label>Järjestelmä- ja komponenttirevisio *<input name="systemRevision" required placeholder="Valmistajan asiakirjan revisio"></label><label>Geometria / käyttötarkoitus *<textarea name="geometry" required placeholder="Mitat, tasot, kentät, käyttötarkoitus"></textarea></label><label>Alusta ja ympäristö *<textarea name="siteConditions" required placeholder="Kantava alusta, olosuhteet, epävarmuudet"></textarea></label><label>Kuormaperusta ja lähde *<input name="loadsBasis" required placeholder="Kuvaus, standardi/asiakirja ja revisio"></label></div><h3>Syötetyt tarkistusparit</h3><p class="muted small">Ed ja Rd on tuotava hyväksyttävästä suunnitelma- tai valmistajadokumentista. Käytä samassa vertailussa samaa yksikköä. Jokaisella rivillä on oltava lähde ja dokumentin revisio.</p><div class="scaffold-stage-grid">${stages.map(([id, label]) => `<fieldset><legend>${label}</legend><label>Komponentti / tarkastuskohta<input name="${id}-component" required></label><div class="scaffold-input-pair"><label>Ed<input name="${id}-ed" type="number" min="0" step="any" required></label><label>Rd<input name="${id}-rd" type="number" min="0.000001" step="any" required></label><label>Yksikkö<input name="${id}-unit" required placeholder="kN, kN/m²…"></label></div><label>Lähde-URL<input name="${id}-source" type="url" required placeholder="https://…"></label><label>Lähdedokumentin revisio<input name="${id}-revision" required></label></fieldset>`).join('')}</div><div class="scaffold-form-actions"><button class="button button-primary" type="submit">Laske ja tallenna vedos</button><span class="muted small">Versiot: moottori 0.1.0 · yleiskirjasto generic-0.1.0 (ei varmennettuja komponenttiarvoja)</span></div><p id="scaffoldCalcStatus" class="small" role="status"></p></form><h3>Tallennetut vedokset</h3><div class="scaffold-calc-list">${history}</div></div></section>`;
  }

  function designWorkflowPanel() {
    const steps = [
      ['gis', 'GeoBIM-kohde', 'architecture-building.png'],
      ['blueprints', 'Piirustus', 'architecture-drafting.png'],
      ['bom', 'Materiaalit', 'construction-load.png'],
      ['courses', 'Perehdytys', 'architecture-safety.png'],
    ];
    return `<section class="panel design-workflow-panel"><div class="panel-head"><div><p class="eyebrow">TYÖMAAN SUUNNITTELUPOLKU</p><h2>Kohteesta toteutukseen</h2><p>Siirry suoraan työmaan seuraavaan vaiheeseen.</p></div><span class="tag blue">4 vaihetta</span></div><div class="panel-body design-workflow-body"><nav class="design-workflow-steps" aria-label="Suunnittelun työvaiheet">${steps.map(([page, label, icon], index) => `<a class="design-workflow-step" href="?page=${page}" data-page="${page}"><span class="design-workflow-icon"><img src="assets/ui-packs/${icon}" alt="" loading="lazy"></span><span><small>0${index + 1}</small><strong>${label}</strong></span><i aria-hidden="true">↗</i></a>`).join('')}</nav><img class="design-workflow-art" src="assets/ui-packs/architecture-scaffold-background.jpg" alt="Arkkitehtoninen luonnos rakennuksen ympärille suunnitellusta telineestä" loading="lazy"></div></section>`;
  }

  function scaffoldDesignWorkflowPanel() {
    const steps = [
      ['scaffold-source-geometry', '01', 'Kohde ja työmaa', 'Rakennus, ympäristö, mitatut ja epävarmat tiedot'],
      ['scaffold-system-geometry', '02', 'Työn tarve ja järjestelmä', 'Käyttötarkoitus, komponentit, moduulit ja geometria'],
      ['scaffold-drawing-panel', '03', 'Pohja ja kenttäjako', 'Välykset, todelliset kentät, kulmat ja yleisala'],
      ['scaffoldCanvasWrap', '04', 'Julkisivu ja tasot', 'Kerrokset, alustat sekä ala- ja yläliittymät'],
      ['scaffold-access-stability', '05', 'Kulku, sidonnat ja jäykistys', 'Sovita porrastornit, kulku, aukot ja tuenta'],
      ['scaffold-drawing-review', '06', 'Leikkaukset ja detaljit', 'Kirjaa tarvittavat näkymät ja liitä CAD-aineisto'],
      ['scaffold-project-section', '07', 'Ristiintarkistus ja revisio', 'Vertaa näkymiä, tarkista lähteet ja tallenna revisio'],
    ];
    return `<section class="panel scaffold-workflow-panel" aria-labelledby="scaffoldWorkflowTitle"><div class="panel-head"><div><p class="eyebrow">SCAFFOLD DESIGN HUB · SUUNNITTELUN VAIHEET</p><h2 id="scaffoldWorkflowTitle">Etene kohteesta tarkistuskelpoiseen piirustusvedokseen</h2><p>Avaa työvaihe suoraan tämän projektin lomakkeesta tai katselmuksesta.</p></div><a class="button button-sm" href="?page=knowledge" data-page="knowledge">Avaa koko suunnittelupolun opas ↗</a></div><div class="panel-body"><nav class="scaffold-workflow-steps" aria-label="Telinepiirustuksen suunnitteluvaiheet">${steps.map(([target, number, title, description]) => `<a href="#${target}" class="scaffold-workflow-step"><span>${number}</span><strong>${title}</strong><small>${description}</small></a>`).join('')}</nav><p class="muted small">Tämä on etenemisreitti, ei automaattinen hyväksyntä. Projektin katselmuksesta kirjataan poikkeamat ja avoimet tiedot; leikkaus- ja detaljipiirustukset tehdään erillisessä CAD-aineistossa tarvittaessa.</p></div></section>`;
  }

  function knowledgeView() {
    const categories=['Kaikki',...new Set(DESIGN_GUIDES.map((guide)=>guide.category))];
    const query=knowledgeSearchText.trim().toLocaleLowerCase('fi');
    const guides=DESIGN_GUIDES.filter((guide)=>(state.knowledgeCategory==='Kaikki'||!state.knowledgeCategory||guide.category===state.knowledgeCategory)&&(!query||`${guide.title} ${guide.summary} ${guide.category} ${guide.checks.join(' ')}`.toLocaleLowerCase('fi').includes(query)));
    const cards=guides.map((guide,index)=>`<article class="panel design-guide-card"><div class="panel-head"><div><span class="tag blue">${escapeHtml(guide.category)}</span><h2>${escapeHtml(guide.title)}</h2></div><span class="design-guide-index">${String(index+1).padStart(2,'0')}</span></div><div class="panel-body"><p>${escapeHtml(guide.summary)}</p><details><summary>Avaa työmaan muistilista</summary><ul>${guide.checks.map((check)=>`<li>${escapeHtml(check)}</li>`).join('')}</ul></details><a class="design-guide-source" href="${escapeHtml(guide.source)}" target="_blank" rel="noopener noreferrer">Lähde: ${escapeHtml(guide.sourceLabel)} ↗</a></div></article>`).join('');
    return `${heading('Telineohjeet · CAD-tietopankki','Scaffold Design Hub -oppaan pohjalta koottu suomenkielinen muistipankki piirustusten tekemiseen, tarkastamiseen ja määrälaskentaan.',`<a class="button" href="?page=design" data-page="design">Avaa Suunnittelu & CAD</a><a class="button button-primary" href="?page=blueprints" data-page="blueprints">Piirustusarkisto</a>`)}${workspaceArtHero('DRAWING KNOWLEDGE · SITE REVIEW','Piirustusohjeet yhdessä paikassa','Hae aiheita ja avaa työmaalla käytettävät muistilistat. Jokainen ohje näyttää alkuperäisen lähteen.', 'assets/illustrations/design-planning-isometric.png','Isometrinen CAD-suunnittelupöytä ja rakennustelinepiirustus')}<section class="panel design-knowledge-tools"><div class="panel-head"><div><h2>Hae ohjeista</h2><p>${guides.length} / ${DESIGN_GUIDES.length} ohjetta · aihekohtaiset tiivistelmät ja lähdelinkit</p></div><span class="tag blue">${DESIGN_GUIDES.length} oppikorttia</span></div><div class="panel-body"><label class="sr-only" for="knowledgeSearch">Hae telineohjeista</label><input class="search-input knowledge-search" id="knowledgeSearch" type="search" placeholder="Hae esim. sidonta, revisio, kerros, PDF…" value="${escapeHtml(knowledgeSearchText)}"><div class="knowledge-filters" role="group" aria-label="Suodata ohjeita aihealueen mukaan">${categories.map((category)=>`<button class="button button-sm ${(!state.knowledgeCategory&&category==='Kaikki')||state.knowledgeCategory===category?'button-primary':''}" data-action="knowledge-filter" data-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`).join('')}</div></div></section><div class="design-guide-grid">${cards||'<div class="empty-state"><strong>Ei osumia</strong>Tyhjennä haku tai valitse toinen aihealue.</div>'}</div><section class="panel design-knowledge-sources"><div class="panel-head"><div><h2>Lähteet ja käyttörajaus</h2><p>Pankki kokoaa käytännön piirustus- ja tarkistusperiaatteita.</p></div><span class="tag amber">Tarkista projektissa</span></div><div class="panel-body"><p>Oppikortit ovat suomenkielisiä tiivistelmiä Scaffold Design Hubin piirustus- ja osanimistöoppaista. Lähdeartikkelit käsittelevät käytännön CAD-työskentelyä, ja niiden ohjeet tulee sovittaa Suomen sääntelyyn, projektin vaatimuksiin ja valitun valmistajan ajantasaisiin asiakirjoihin.</p><p class="privacy-note"><strong>Ei rakennesuunnitelma:</strong> tämä pankki ei määritä telineen mitoitusta, kuormankestoa, sidontavälejä tai hyväksyttävyyttä. Rakenteellinen suunnittelu ja hyväksyntä kuuluvat tehtävään pätevälle suunnittelijalle.</p><div class="knowledge-source-links"><a href="https://scaffolddesignhub.com/scaffold-cad-drawings/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · Scaffold CAD Drawings ↗</a><a href="https://scaffolddesignhub.com/scaffolding-parts/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · Scaffolding Parts Explained ↗</a><a href="https://scaffolddesignhub.com/scaffold-drawing-symbols/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · Drawing Symbols and Abbreviations ↗</a><a href="https://scaffolddesignhub.com/scaffold-plan-elevation-section/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · Plan vs Elevation vs Section ↗</a><a href="https://scaffolddesignhub.com/scaffold-bracing-explained/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · Scaffold Bracing Explained ↗</a><a href="https://data.finlex.fi/fi/lainsaadanto/2009/205" target="_blank" rel="noopener noreferrer">Finlex · VNa 205/2009 ↗</a><a href="/archive/layher-allround/">Paikallinen Layher Allround -ohjearkisto ↗</a><a href="https://scaffolddesignhub.com/scaffold-detail-drawings/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · Scaffold Details Explained ↗</a><a href="https://scaffolddesignhub.com/how-to-create-scaffold-drawing/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · Step-by-Step Drawing Workflow ↗</a></div><a class="button button-sm" href="?page=blueprints" data-page="blueprints">Lisää työmaan piirustus- tai ohjeviite</a></div></section>`;
  }

  function designView() {
    const resources = state.designResources || [];
    const actions = `<a class="button button-primary" href="?page=knowledge" data-page="knowledge">▤ Avaa ohjepankki</a><a class="button" href="?page=blueprints" data-page="blueprints">▧ Piirustusarkisto</a><a class="button" href="?page=scaffold" data-page="scaffold">▦ Telinekarttasuunnittelu</a>`;
    const cards = resources.length ? resources.map((item) => `<article class="design-resource"><div class="design-resource-top"><span class="tag">${escapeHtml(item.type)}</span><button class="button button-sm" data-action="delete-design-resource" data-id="${escapeHtml(item.id)}" type="button" aria-label="Poista ${escapeHtml(item.title)}">Poista</button></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(siteName(item.siteId))} · ${escapeHtml(item.format || 'Tiedostomuotoa ei merkitty')}${item.revision ? ` · ${escapeHtml(item.revision)}` : ''}</p>${item.notes ? `<p class="design-resource-notes">${escapeHtml(item.notes)}</p>` : ''}${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Avaa aineisto ↗</a>` : '<span class="muted small">Aineistolle ei ole lisätty linkkiä.</span>'}</article>`).join('') : '<div class="empty-state design-empty"><strong>Ei projektiaineistoja</strong>Lisää työmaalle materiaaliluettelon, asennusohjeen tai CAD-aineiston linkki. Varsinaiset DWG-, DXF-, IPT- ja PDF-tiedostot säilyvät niille tarkoitetussa tiedostopalvelussa.</div>';
    return `${heading('Suunnittelu & CAD', 'GeoBIM, 2D/3D-suunnittelu, telinepiirustukset ja projektikohtaiset aineistot.', actions)}${workspaceArtHero('SUUNNITTELUJÄRJESTELMÄT', 'GeoBIM, CAD ja työmaamallit', 'Yhdistä paikkatiedon kohteet, rakennusmallit sekä 2D- ja 3D-suunnittelun projektiviitteet.', 'assets/illustrations/design-planning-isometric.png', 'Isometrinen rakennus- ja telinemalli, piirustusarkki ja suunnitteluvälineet')}<div class="metric-grid design-metrics">${metric('▤', '2D-vienti', 'DXF · SVG · PDF', 'Mittapiirustus projektirevisiosta', 'blue')}${metric('◇', '3D / CAD-vienti', 'OBJ · FCStd', 'Rakennusmassa ja FreeCAD-telinegeometria', 'purple')}${metric('▱', 'Projektiaineistot', resources.length, 'Tallennettuja linkkiviitteitä', 'green')}${metric('⌂', 'Suunnittelu', 'Julkisivut', 'Valitse sivu ja muokkaa parametreja', 'amber')}</div><div class="design-capability-grid"><section class="panel design-capability"><div class="panel-head"><div><p class="eyebrow">2D-DRAFTING · DRAWING · ANNOTATION</p><h2>CAD-piirustukset</h2></div><span class="tag blue">DXF · SVG · PDF</span></div><div class="panel-body"><p>Telineprojektin pohja ja julkisivuluonnos viedään DXF-muodossa. SVG ja tulostettava PDF syntyvät samasta tallennetusta projektirevisiosta.</p><small class="muted">Avaa telineprojekti, valitse rakennuksen sivu ja tarkista kentät, tasot sekä mitat ennen vientiä. DXF voidaan avata yhteensopivassa CAD-ohjelmassa jatkomuokkausta varten.</small></div></section><section class="panel design-capability"><div class="panel-head"><div><p class="eyebrow">3D-MODELLING · BUILDING + SCAFFOLD</p><h2>3D-mallit</h2></div><span class="tag purple">OBJ · FCStd · FCMacro</span></div><div class="panel-body"><p>Rakennuksen lähdepolygonista ja valitusta telinejulkisivusta muodostetaan samaan malliin sidottu 3D-massa ja telinekehikko.</p><small class="muted">OBJ on siirrettävä geometriaformaatti. FCStd tallentaa rakennusmassan ja telineosien CAD-mallin; FCMacro luo mallin uudelleen projektin parametreista. Rakenteellinen mitoitus ja hyväksyntä tarkistetaan erikseen.</small></div></section></div>${designWorkflowPanel()}<section class="panel design-checklist-panel"><div class="panel-head"><div><h2>CAD-piirustuksen työmaakatselmus</h2><p>Tarkista selkeys, työmaan olosuhteet sekä piirustuksen ja materiaalimäärien yhdenmukaisuus.</p></div><a class="button button-sm" href="?page=blueprints" data-page="blueprints">Avaa piirustusarkisto ↗</a></div><div class="panel-body"><ul class="design-checklist"><li>Varmista rakennuksen mitat, korkeus, sisäänkäynnit, parvekkeet, katokset ja ulkonevat rakenteet.</li><li>Näytä telineen etäisyys julkisivusta, kulkureitit, porras-/nousutornit ja työtasot.</li><li>Tarkista sidontapisteiden sijainti ja mahdolliset törmäykset työmaan esteisiin.</li><li>Vertaa pohja-, julkisivu- ja leikkauskuvia: kerrosvälit, aukot, tasot ja kenttien määrä täsmäävät.</li><li>Varmista, että käytössä on oikea revisio ja muutokset ovat jäljitettävissä.</li><li>Täsmäytä materiaaliluettelon määrät uusimpaan piirustusversioon.</li></ul><div class="privacy-note"><strong>Rajaus:</strong> suunnitteluopas käsittelee piirustusten luettavuutta ja työmaaviestintää. Se ei vahvista telineen rakenteellista riittävyyttä eikä korvaa sovellettavia määräyksiä, valmistajan ohjeita tai pätevän suunnittelijan hyväksyntää.</div></div></section><section class="panel design-resources-panel"><div class="panel-head"><div><h2>Projektikohtaiset resurssit</h2><p>Materiaaliluettelot, asennusohjeet ja CAD-mallien viitteet.</p></div><span class="tag">${resources.length} aineistoa</span></div><div class="panel-body"><div class="design-resource-grid">${cards}</div><div class="privacy-note">Aineistoviitteet tallentuvat tähän selaimeen. Varsinaiset CAD-tiedostot säilyvät tiedostopalvelussa.</div></div></section>${scaffoldSupportView()}`;
  }

  function blueprintsView() {
    const resources = state.designResources || [];
    const cards = resources.length ? resources.map((item) => `<article class="design-resource"><div class="design-resource-top"><span class="tag">${escapeHtml(item.type)}</span><button class="button button-sm" data-action="delete-design-resource" data-id="${escapeHtml(item.id)}" type="button" aria-label="Poista ${escapeHtml(item.title)}">Poista</button></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(siteName(item.siteId))} · ${escapeHtml(item.format || 'Tiedostomuotoa ei merkitty')}${item.revision ? ` · ${escapeHtml(item.revision)}` : ''}</p>${item.notes ? `<p class="design-resource-notes">${escapeHtml(item.notes)}</p>` : ''}${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Avaa aineisto ↗</a>` : '<span class="muted small">Aineistolle ei ole lisätty linkkiä.</span>'}</article>`).join('') : '<div class="empty-state design-empty"><strong>Arkisto on tyhjä</strong>Lisää projektin CAD-piirustuksen, blueprintin tai muun teknisen aineiston viite.</div>';
    return `${heading('Piirustusarkisto · CAD / Blueprint Vault', 'Kokoa työmaiden piirustusten, CAD-mallien ja blueprint-aineistojen versioidut viitteet.', `<button class="button button-primary" data-action="new-design-resource" data-type="CAD-piirustus" type="button">＋ Tallenna piirustus</button>`)}${workspaceArtHero('CAD · BLUEPRINT · REVISION', 'Piirustukset yhdessä arkistossa', 'Tallenna piirustuksen nimi, työmaa, tiedostomuoto, revisio ja avattava aineistolinkki.', 'assets/illustrations/maps-drawings-isometric.png', 'Isometrinen kartta, rakennuksen blueprint ja tekninen mitta-asteikko', `<a class="button" href="?page=design" data-page="design">Avaa suunnittelunäkymä</a>`)}<div class="metric-grid">${metric('▧', 'Aineistoviitteitä', resources.length, 'tämän selaimen arkistossa', 'blue')}${metric('▤', 'Piirustustyyppejä', new Set(resources.map((item) => item.type).filter(Boolean)).size, 'CAD, blueprint, ohjeet ja BOM', 'purple')}${metric('⌂', 'Työmaita', new Set(resources.map((item) => item.siteId).filter(Boolean)).size, 'aineistoon liitettyä kohdetta', 'green')}${metric('↗', 'Tallennustapa', 'Linkit', 'tiedostot säilyvät omassa varastossa', 'amber')}</div><section class="panel design-resources-panel"><div class="panel-head"><div><h2>CAD- ja blueprint-arkisto</h2><p>${resources.length} aineistoviitettä · uusimmat ensin</p></div><span class="tag blue">Paikallinen luettelo</span></div><div class="panel-body"><div class="design-resource-grid">${cards}</div><div class="privacy-note">Arkisto tallentaa metatiedot ja linkit tähän selaimeen. Se ei lataa tai kopioi tiedostosisältöä.</div></div></section>`;
  }

  function scaffoldEquipmentPanel() {
    return `<section class="panel scaffold-equipment-panel"><div class="panel-body scaffold-equipment-body"><img src="assets/ui-packs/lifting-machinery.jpg" alt="Kuvitus saksinostimista, puominostimista, portaista ja telineistä" loading="lazy"><div><p class="eyebrow">KUVITUS KORKEALLA TYÖSKENTELYYN</p><h2>Nosto- ja telineratkaisut</h2><p>Kalustokuva auttaa hahmottamaan työvaiheessa tarvittavia vaihtoehtoja. Tarkista työmaakohtainen saatavuus, tarkastukset ja nostosuunnitelma erikseen.</p><div class="scaffold-equipment-tags"><span class="tag blue">Saksinostimet</span><span class="tag blue">Puominostimet</span><span class="tag">Porrasratkaisut</span><span class="tag">Telineet</span></div></div></div></section>`;
  }

  function scaffoldRecommendationMarkup(result) {
    if (!result) return '<p class="muted small">Suositus näkyy, kun historiassa on vähintään kolme tallennettua projektia.</p>';
    if (!result.available) return `<p>${escapeHtml(result.reason)} Tallennettuja vertailuja: ${result.sampleCount}.</p>`;
    const estimate = result.laborEstimate;
    const labor = estimate?.available
      ? `<p><strong>Työmääräarvio yhteensä:</strong> ${Number(estimate.hours).toLocaleString('fi-FI',{maximumFractionDigits:2})} h · vertailuväli ${Number(estimate.range.min).toLocaleString('fi-FI')}–${Number(estimate.range.max).toLocaleString('fi-FI')} h · ${estimate.sampleCount} projektia</p><ul class="scaffold-labor-breakdown">${[['Asennus',estimate.activities?.installation],['Purku',estimate.activities?.dismantling],['Tarkastus',estimate.activities?.inspection]].map(([label,item])=>`<li><strong>${label}:</strong> ${item?.available?`${Number(item.hours).toLocaleString('fi-FI',{maximumFractionDigits:2})} h · ${item.sampleCount} vertailuprojektia`:`ei kopioitavaa arviota · ${item?.sampleCount||0}/${item?.minimumSamples||3} vertailuprojektia`}</li>`).join('')}</ul>`
      : `<p><strong>Työmääräarviota ei ehdoteta:</strong> ${escapeHtml(estimate?.reason || 'Vertailukelpoiset työtunnit puuttuvat.')} (${estimate?.sampleCount||0}/${estimate?.minimumSamples||3} vertailuprojektia)</p>`;
    return `<p><strong>Vertailu:</strong> ${result.sampleCount} anonymisoitua projektia · samankaltaisuus ${Math.round(result.similarity*100)}%</p>${labor}<p>Tarjousarvio ${Number(result.quote.total).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})} · vertailuväli ${Number(result.quoteRange.min).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})}–${Number(result.quoteRange.max).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})}</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Komponentti</th><th>Määrä</th><th>Osto €/kpl</th><th>Vuokra €/kpl/pv</th></tr></thead><tbody>${result.bom.map((row)=>`<tr><td>${escapeHtml(row.name)}</td><td>${row.quantity}</td><td>${row.purchasePerUnit.toFixed(2)}</td><td>${row.rentalPerUnitDay.toFixed(2)}</td></tr>`).join('')}</tbody></table></div><button class="button button-sm" id="scaffoldApplyRecommendation" type="button">Kopioi BOM- ja työarvio luonnokseen</button><small>${escapeHtml(result.basis)} Suositus on tarkistettava.</small>`;
  }

  function kederXLPreviewOptions() {
    const groups = [
      ['Kokoonpano ja kattorakenne', [
        ['roof-demo-590-257', 'Keder Roof XL -kokoonpano · 5,90 × 2,57 m · 18° (s. 6)'],
        ['lattice-2m', 'Ristikkopalkki · 2,00 m · 5975.200 (s. 32)'],
        ['lattice-3m', 'Ristikkopalkki · 3,00 m · 5975.300 (s. 32)'],
        ['ridge-18', 'Harjaosa 18° · 2,10 m · 5975.110 (s. 32)'],
        ['ridge-20', 'Harjaosa 20° · 2,10 m · 5975.120 (s. 32)'],
        ['monopitch', 'Yksilappeisen katon ristikkopalkki · 1,06 m · 5975.106 (s. 32)'],
        ['eaves', 'Räystäsosa · 2,00 m · 5975.100 (s. 32)'],
        ['brace', 'Jäykiste · 2,57 m · 5940.257 (s. 32)'],
        ['hdiag-287', 'Vaakadiagonaali · 2,87 m · 5939.100 (s. 32)'],
        ['hdiag-337', 'Vaakadiagonaali · 3,37 m · 5939.200 (s. 32)'],
        ['ledger', 'Keder-kattovaakajuoksu · 2,57 m · 5972.257 (s. 32)'],
        ['support-073', 'Keder Roof XL -tuki · 0,73 m · 5975.073 (s. 33)'],
        ['support-109', 'Keder Roof XL -tuki · 1,09 m · 5975.109 (s. 33)'],
        ['roof-support', 'Jäykkä kattotuki 18° · 0,73 m · 5938.030 (s. 36)'],
      ]],
      ['Peitteet, keder-kisko ja syöttö', [
        ['roof-tarp-b1', 'Kattokangas B1 · 2,57 m · 5972.xxx (s. 35)'],
        ['roof-tarp-b2', 'Kattokangas B2 · 2,07 m · 5972.xxx (s. 35)'],
        ['gable-tarp-b1', 'Päätypeite B1 · 2,57 m · 5972.xxx (s. 35)'],
        ['gable-tarp-b2', 'Päätypeite B2 · 2,07 m · 5972.xxx (s. 35)'],
        ['tarp-clip', 'Peitteen kiinnike · 5971.140 (50 kpl) (s. 35)'],
        ['rail-seal', 'Keder-kiskon tiiviste · 5971.001 (s. 33)'],
        ['insertion-set', 'Peitteen syöttösarja · 3,00 m · 5971.400 (s. 34)'],
        ['insertion-roller', 'Peitteen syöttörulla · 5971.401 (s. 34)'],
        ['rail-3m', 'Kisko · 3,00 m · 5941.300 (s. 35)'],
        ['t12-adapter', 'Kiskon T12-adapteri · 0,80 m · 5938.027 (s. 35)'],
        ['t12-trolley', 'T12-vaunu · 5938.026 (s. 35)'],
        ['t12-connector', 'T12-vaunun liitin · 5938.019 (s. 35)'],
      ]],
      ['Sidonta ja liitososat', [
        ['tie-fastening', 'Sidontakiinnike · 5975.000 (s. 33)'],
        ['tie-strap-connection', 'Sidontaliitos kiristyshihnalle · 5975.010 (s. 33)'],
        ['tie-rod-connection', 'Sidontaliitos kierretangolle · 5975.020 (s. 34)'],
        ['tie-connection-piece', 'Sidonnan liitoskappale · 5975.030 (s. 34)'],
        ['tie-rod-connector', 'Kierretangon liitin WAF 30 × 90 · 5976.000 (s. 34)'],
        ['tie-rod-2m', 'Sidontakierretanko · 2,00 m · 5976.200 (s. 34)'],
        ['tie-rod-3m', 'Sidontakierretanko · 3,00 m · 5976.300 (s. 34)'],
        ['tie-rod-4m', 'Sidontakierretanko · 4,00 m · 5976.400 (s. 34)'],
        ['tie-rod-5m', 'Sidontakierretanko · 5,00 m · 5976.500 (s. 34)'],
        ['t4-spigot', 'Ristikkopalkin liitintappi T4 · Ø38 × 0,44 m · 4922.000 (s. 36)'],
        ['double-coupler-19', 'Kaksoisliitin WAF 19 · 4700.019 (s. 36)'],
        ['double-coupler-22', 'Kaksoisliitin WAF 22 · 4700.022 (s. 36)'],
        ['special-bolt-60', 'Erikoispultti M12 × 60 mm · 4905.060 (s. 33)'],
        ['special-bolt-90', 'Erikoispultti M12 × 90 mm · 5975.090 (s. 33)'],
        ['beam-pin', 'Ristikkopalkin lukitustappi Ø12 · 4905.666 (s. 33)'],
        ['pin-95', 'Tappi Ø12 × 95 mm · 5976.090 (s. 33)'],
        ['pin-65', 'Tappi Ø12 × 65 mm · 4905.065 (s. 33)'],
        ['locking-pin', 'Lukitussokka Ø2,8 mm · 4905.000 (s. 33)'],
        ['red-locking-pin', 'Punainen lukitustappi Ø11 mm · 4000.001 (s. 36)'],
        ['lashing-strap-5m', 'Kuormaliina 5 t · 5,00 m · 5976.600 (s. 34)'],
        ['wedge-strap-6m', 'Polyesterihihna kiilalukolla · 6,00 m · 5976.610 (s. 34)'],
      ]],
    ];
    return groups.map(([label, parts]) => `<optgroup label="Layher Keder Roof XL · ${label}">${parts.map(([id, name], index) => `<option value="layher-keder-xl:${id}"${id === 'roof-demo-590-257' ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('')}</optgroup>`).join('');
  }

  function laborHoursFor(pricing, description, legacyFallback = false) {
    const rows = Array.isArray(pricing?.labor) ? pricing.labor : [];
    const target = String(description || '').toLocaleLowerCase('fi');
    const exact = rows.find((row) => String(row.description || '').toLocaleLowerCase('fi') === target);
    if (exact) return Number(exact.hours) || 0;
    const legacy = rows.find((row) => ['työ', 'asennus'].includes(String(row.description || '').toLocaleLowerCase('fi')));
    return legacyFallback && legacy ? Number(legacy.hours) || 0 : 0;
  }
  const DEFAULT_INSTALLATION_ESTIMATE_BASIS = Object.freeze({ enabled: true, dismantlingEnabled: true, inspectionEnabled: true, minutesPerPart: 3, inspectionMinutesPerPart: 1, referenceHeightM: 10, heightIncreasePercentPer10M: 10, crewSize: 2 });
  function scaffoldInstallationEstimateBasis(pricing = {}, isNewProject = false) {
    const basis = pricing?.installationEstimateBasis;
    const legacyHours = laborHoursFor(pricing, 'Asennus', true);
    const dismantlingHours = laborHoursFor(pricing, 'Purku');
    const inspectionHours = laborHoursFor(pricing, 'Tarkastus');
    return {
      enabled: basis?.enabled == null ? Boolean(isNewProject || legacyHours <= 0) : Boolean(basis.enabled),
      dismantlingEnabled: basis?.dismantlingEnabled == null ? Boolean(isNewProject || dismantlingHours <= 0) : Boolean(basis.dismantlingEnabled),
      inspectionEnabled: basis?.inspectionEnabled == null ? Boolean(isNewProject || inspectionHours <= 0) : Boolean(basis.inspectionEnabled),
      minutesPerPart: Number.isFinite(Number(basis?.minutesPerPart)) ? Number(basis.minutesPerPart) : DEFAULT_INSTALLATION_ESTIMATE_BASIS.minutesPerPart,
      inspectionMinutesPerPart: Number.isFinite(Number(basis?.inspectionMinutesPerPart)) ? Number(basis.inspectionMinutesPerPart) : DEFAULT_INSTALLATION_ESTIMATE_BASIS.inspectionMinutesPerPart,
      referenceHeightM: Number.isFinite(Number(basis?.referenceHeightM)) ? Number(basis.referenceHeightM) : DEFAULT_INSTALLATION_ESTIMATE_BASIS.referenceHeightM,
      heightIncreasePercentPer10M: Number.isFinite(Number(basis?.heightIncreasePercentPer10M)) ? Number(basis.heightIncreasePercentPer10M) : DEFAULT_INSTALLATION_ESTIMATE_BASIS.heightIncreasePercentPer10M,
      crewSize: Number.isInteger(Number(basis?.crewSize)) && Number(basis.crewSize) >= 1 && Number(basis.crewSize) <= 50 ? Number(basis.crewSize) : DEFAULT_INSTALLATION_ESTIMATE_BASIS.crewSize,
    };
  }
  function setScaffoldInstallationEstimateControls(pricing = {}, isNewProject = false) {
    const basis = scaffoldInstallationEstimateBasis(pricing, isNewProject);
    const enabled = $('#scaffoldInstallAuto');
    if (enabled) enabled.checked = basis.enabled;
    const dismantlingEnabled = $('#scaffoldDismantleAuto');
    if (dismantlingEnabled) dismantlingEnabled.checked = basis.dismantlingEnabled;
    const inspectionEnabled = $('#scaffoldInspectionAuto');
    if (inspectionEnabled) inspectionEnabled.checked = basis.inspectionEnabled;
    const minutes = $('#scaffoldInstallMinutesPerPart');
    if (minutes) minutes.value = String(basis.minutesPerPart);
    const inspectionMinutes = $('#scaffoldInspectionMinutesPerPart');
    if (inspectionMinutes) inspectionMinutes.value = String(basis.inspectionMinutesPerPart);
    const referenceHeight = $('#scaffoldInstallReferenceHeight');
    if (referenceHeight) referenceHeight.value = String(basis.referenceHeightM);
    const increase = $('#scaffoldInstallHeightIncrease');
    if (increase) increase.value = String(basis.heightIncreasePercentPer10M);
    const crewSize = $('#scaffoldInstallCrewSize');
    if (crewSize) crewSize.value = String(basis.crewSize);
    const hours = $('#scaffoldInstallHours');
    if (hours) hours.readOnly = basis.enabled;
    const dismantlingHours = $('#scaffoldDismantleHours');
    if (dismantlingHours) dismantlingHours.readOnly = basis.dismantlingEnabled;
    const inspectionHours = $('#scaffoldInspectionHours');
    if (inspectionHours) inspectionHours.readOnly = basis.inspectionEnabled;
  }
  function scaffoldView() {
    const options = scaffoldProjectRecords.map((project) => `<option value="${escapeHtml(project.id)}" ${activeScaffoldProject?.id === project.id ? 'selected' : ''}>${escapeHtml(project.name)} · rev ${project.revision} · ${escapeHtml(project.buildingName)}</option>`).join('');
    const project = activeScaffoldProject;
    const pricing = project?.pricing || {};
    const installationEstimate = scaffoldInstallationEstimateBasis(pricing, !project);
    const revisions = project?.revision ? `<span class="tag blue">rev ${project.revision}</span>` : '<span class="tag amber">Tallentamaton</span>';
    const workflow = project?.workflow || { state: 'draft' };
    const customerOptions = (crmData?.companies||[]).map((company)=>`<option value="${escapeHtml(company.id)}" ${project?.customerId===company.id?'selected':''}>${escapeHtml(company.name)}</option>`).join('');
    const templateOptions = scaffoldTemplates.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
    const fileRows = scaffoldProjectFiles.map((file) => { const cadFile = /\.(?:fcstd|fcmacro)$/i.test(file.filename); return `<li><a href="${escapeHtml(file.downloadUrl)}" ${cadFile ? 'download' : 'target="_blank" rel="noopener"'}>${cadFile ? 'Lataa FreeCAD-tiedosto · ' : ''}${escapeHtml(file.filename)}</a><span>${escapeHtml(file.kind)} · rev ${file.revision} · ${(file.sizeBytes/1024).toFixed(0)} kt · ${escapeHtml(file.sha256.slice(0,12))}…</span></li>`; }).join('') || '<li class="muted small">Ei tallennettuja piirustuksia tai 3D-malleja.</li>';
    const recommendation = scaffoldRecommendationMarkup(scaffoldRecommendation);
    const review = project ? `<form id="scaffoldReviewForm" class="scaffold-review-form"><input type="hidden" name="expectedRevision" value="${project.revision}"><label>Tarkastaja<input name="reviewer" required maxlength="160" placeholder="Nimi"></label><label>Kirjaus<select name="decision"><option value="reviewed">Tarkastettu</option><option value="changes-requested">Muutoksia tarvitaan</option></select></label><label>Huomio<input name="note" maxlength="2000" placeholder="Tarkastuksen huomio"></label><button class="button button-sm" type="submit">Kirjaa revisioon</button></form>` : '<p class="muted small">Tallenna projektin ensimmäinen revisio ennen tarkastusmerkintää.</p>';
    return `${heading('Telinekartta & piirustus', 'Yksi palvelimelle tallennettava projekti sisältää kohteen, EPSG:3879-geometrian, Layher Allround -mallin ja valinnaisen Keder XL -sääsuojan, lähteistetyn BOMin, kustannukset ja revisiot.', `<button class="button" data-action="new-scaffold-project" type="button">＋ Uusi projekti</button><button class="button button-primary" data-action="save-scaffold-project" type="button">Tallenna revisio</button>`)}${scaffoldEquipmentPanel()}${scaffoldDesignWorkflowPanel()}
      <section id="scaffold-project-section" class="panel scaffold-project-panel"><div class="panel-head"><div><h2>Projektitietue · ${revisions}</h2><p>${project ? `Tallennettu ${escapeHtml(project.updatedAt)} · tarkastustila ${escapeHtml(workflow.state || 'draft')}` : 'Uusi projekti tallentuu palvelimen SQLite-tietokantaan.'}</p></div><div class="heading-actions"><a class="button button-sm" href="/archive/layher-allround/" target="_blank" rel="noopener noreferrer">Layher Allround -ohjeet ↗</a><a class="button button-sm" href="/archive/layher-keder-xl/" target="_blank" rel="noopener noreferrer">Keder XL -ohjeet ↗</a></div></div><div class="panel-body"><label class="scaffold-project-picker">Avaa palvelimelle tallennettu projekti<select id="scaffoldProjectSelect"><option value="">${scaffoldProjectsLoaded ? 'Uusi / tallentamaton projekti' : 'Ladataan projekteja…'}</option>${options}</select></label>${review}<div id="scaffoldRevisionList" class="scaffold-revision-list"><span class="muted small">${project ? 'Ladataan revisiohistoriaa…' : 'Revisiohistoria muodostuu tallennuksessa.'}</span></div><p class="privacy-note">Tarkastusmerkintä on paikallinen työnkulun kirjaus, ei digitaalinen allekirjoitus, mitoitushyväksyntä tai tuotantokäytön hyväksyntä.</p></div></section>
      <div class="panel-body scaffold-persist-grid"><section><h3>Kohteen aineistot</h3>${project ? `<div class="scaffold-file-controls"><select id="scaffoldFileKind"><option value="drawing">Piirustus</option><option value="building-model">Rakennuksen 3D-malli</option><option value="scaffold-model">Telinemalli / piirustus</option><option value="other">Muu projektiaineisto</option></select><input id="scaffoldFileInput" type="file" accept=".pdf,.dwg,.dxf,.svg,.obj,.mtl,.glb,.gltf,.ifc,.stl,.step,.stp,.fcstd,.fcmacro,.png,.jpg,.jpeg"><button class="button button-sm" id="scaffoldUploadFile" type="button">Tallenna tiedosto</button></div>` : '<p class="muted small">Tallenna projekti ensin, niin voit liittää piirustuksia ja 3D-malleja.</p>'}<ul id="scaffoldFileList" class="scaffold-file-list">${fileRows}</ul></section><section><h3>Telinemallipohjat</h3><div class="scaffold-file-controls"><select id="scaffoldTemplateSelect"><option value="">${templateOptions ? 'Valitse tallennettu malli' : 'Ei telinemallipohjia'}</option>${templateOptions}</select><button class="button button-sm" id="scaffoldApplyTemplate" type="button">Käytä mallia</button><button class="button button-sm" id="scaffoldSaveTemplate" type="button" ${project?'':'disabled'}>Tallenna tämän projektin malli</button></div><p class="muted small">Malli kopioi parametrit. Pohja säilyy muuttumattomana.</p></section><section class="scaffold-recommendations"><h3>Anonymisoitu BOM- ja tarjousvertailu</h3><button class="button button-sm" id="scaffoldGetRecommendation" type="button">Hae historiavertailu</button><div id="scaffoldRecommendationResult">${recommendation}</div></section></div>
      <div class="scaffold-studio-layout">
      <section id="scaffold-source-geometry" class="panel"><div class="panel-head"><div><h2>1 · Rakennuksen lähdegeometria</h2><p>Helsingin avoin rakennusrekisteri WFS · osoitehaku tai karttaklikkaus</p></div><a class="button button-sm" href="buildings.html?picker=1&amp;parentOrigin=${encodeURIComponent(window.location.origin)}" target="_blank" rel="noopener">3D-kaupunkimalli · valitse ↗</a></div><form id="scaffoldAddressSearch" class="building-address-search panel-body"><label for="scaffoldAddressInput">Hae rakennuksen osoitteella Helsingissä</label><div class="building-address-row"><input id="scaffoldAddressInput" name="address" autocomplete="street-address" placeholder="Esim. Bulevardi 27, Helsinki" required><button class="button button-primary" type="submit">Hae osoite</button></div></form><div class="scaffold-footprint-tools"><input id="scaffoldManualFootprintName" maxlength="200" placeholder="Kohteen nimi · esim. Uschakoffin talo"><button class="button button-sm" id="scaffoldFootprintDraw" type="button">Piirrä rakennuksen pohja</button><button class="button button-sm" id="scaffoldFootprintUndo" type="button" disabled>Poista viimeinen piste</button><button class="button button-sm button-primary" id="scaffoldFootprintFinish" type="button" disabled>Valmis · käytä pohjaa</button><button class="button button-sm" id="scaffoldFootprintCancel" type="button" disabled>Peruuta</button><span id="scaffoldFootprintStatus" role="status">Valitse kartan rakennus tai piirrä puuttuva pohja.</span></div><div id="scaffoldBuildingMap" class="scaffold-building-map" role="application" aria-label="Telinehallinnan rakennuskartta"></div><section class="panel-body scaffold-ground-tools"><div><h3>Maasto ja maaperä rakennuksen ympärillä</h3><p class="muted small">Tuo MML:n 2 m korkeusmallista rajattu ASCII Grid (.asc). Laskenta mittaa korkeusvyöhykkeet rakennuspolygonin reunasta 0–2 m, 2–5 m ja 5–10 m. GTK:n karttaluokka haetaan erikseen.</p></div><div class="scaffold-terrain-controls"><label>Korkeusruudukko · ASCII Grid<input id="scaffoldTerrainFile" type="file" accept=".asc,.txt,text/plain"></label><label>Ruudukon koordinaatisto<select id="scaffoldTerrainCrs"><option value="EPSG:3067" selected>EPSG:3067 · ETRS-TM35FIN (MML)</option><option value="EPSG:3879">EPSG:3879 · ETRS-GK25FIN</option></select></label></div><p class="muted small">Lähteet: <a href="https://www.maanmittauslaitos.fi/kartat-ja-paikkatieto/aineistot-ja-rajapinnat/tuotekuvaukset/korkeusmalli-2-m" target="_blank" rel="noopener noreferrer">MML Korkeusmalli 2 m · ASCII Grid ↗</a> · <a href="https://www.maanmittauslaitos.fi/ortokuvien-ja-korkeusmallien-kyselypalvelu" target="_blank" rel="noopener noreferrer">MML:n korkeusmallien WCS ↗</a> · <a href="https://gtkdata.gtk.fi/arcgis/rest/services/Maankamara/Maapera/MapServer" target="_blank" rel="noopener noreferrer">GTK Maankamara ↗</a>. MML:n WCS vaatii palveluavaimen. Lukuarvot ja korkeusjärjestelmä tulevat tuodusta tiedostosta; tarkista ne lähteestä.</p><p id="scaffoldTerrainImportStatus" class="small" role="status">Valitse rakennus ja sen ympäristön kattava korkeusruudukko.</p><div id="scaffoldTerrainSummary" class="scaffold-terrain-summary" aria-live="polite"><span class="muted small">Korkeuserot näkyvät, kun rakennus ja korkeusruudukko on valittu.</span></div><div id="scaffoldTerrainProfile" class="scaffold-terrain-profile" aria-label="Maaston korkeusvyöhykkeet massamallin ympärillä"></div><div class="scaffold-soil-tools"><div><strong>Maapohjan koostumus ja lujuustiedon tila</strong><p class="muted small">GTK:n maalajiluokka kertoo kartoitettujen pintamaiden ja pohjamaan luokituksen; se ei sisällä työmaan perustusten kantavuuslukua.</p></div><button class="button button-sm" id="scaffoldFetchGround" type="button" disabled>Hae GTK:n maaperätieto</button></div><div id="scaffoldGroundSummary" class="scaffold-ground-summary" aria-live="polite"><span class="muted small">Valitse rakennus, niin haen GTK:n karttaluokan.</span><span><b>Kantavuus:</b> ei arvioitavissa maaperäkartasta · pohjatutkimus tarvitaan.</span></div></section><div class="panel-body"><p class="muted small">Rakennuspolygonin WGS84-koordinaatit muunnetaan proj4-kirjastolla EPSG:3879-järjestelmään ennen mittojen johtamista ja tallennusta.</p><p id="scaffoldInfoMapStatus" class="small" role="status"></p><div id="scaffoldInfoBuildingCard" class="building-info-card"><strong>Valitse rakennus</strong><span>Rakennuskortti ja piirustushaut tulevat tähän.</span></div><details class="building-advanced-search"><summary>Rakennusrekisterin koordinaattihaku</summary><p class="muted small">Helsingin rakennusten alue- ja rekisteritiedot (EPSG:3879). Massamallin korkeus arvioidaan kerrosluvusta, jos 3D-korkeutta ei ole saatavilla.</p><form id="scaffoldBuildingSearch" class="scaffold-map-search"><label>GK25FIN X (m)<input name="x" type="number" value="25496825" required></label><label>GK25FIN Y (m)<input name="y" type="number" value="6673044" required></label><label>Säde (m)<input name="radius" type="number" min="25" max="500" value="150" required></label><button class="button" type="submit">Hae rakennuksia</button></form><p id="scaffoldBuildingStatus" class="small" role="status"></p><div id="scaffoldBuildingResults" class="scaffold-building-results"></div></details></div></section>
        <section id="scaffold-system-geometry" class="panel"><div class="panel-head"><div><h2>2 · Yhteinen järjestelmä- ja geometriamalli</h2><p>Julkisivun Layher Allround -katalogin mukaiset kenttäpituudet ja ohjeen 2,00 m perusnousu.</p></div><span class="tag amber">Luonnos · mitoitus avoinna</span></div><div class="panel-body"><div id="scaffoldSelectedBuilding" class="privacy-note">Rakennusta ei ole valittu. Korkeus, syvyys ja käsin annetut mitat merkitään lähteineen.</div><form id="scaffoldLayoutForm" class="scaffold-layout-form"><label class="span-two">Projektin nimi<input name="name" value="Telineprojekti" required maxlength="160"></label><label class="span-two">CRM-asiakas<select name="customerId"><option value="">Ei liitetty CRM-yritykseen</option>${customerOptions}</select></label><label class="span-two">Asiakkaan nimi (tarvittaessa)<input name="customerName" value="${escapeHtml(project?.customerName||'')}" maxlength="200" placeholder="Asiakkaan yritys"></label><label class="span-two">Työn tarkoitus ja käyttövaatimukset<textarea name="workPurpose" rows="2" maxlength="1500" placeholder="Esim. maalaus / julkisivukorjaus; työtasot, kulku, materiaalinkäsittely, verkotus ja työn kesto">${escapeHtml(project?.geometry?.workPurpose||'')}</textarea></label><label>Julkisivun pituus (m)<input name="length" type="number" value="${project?.geometry?.targetLengthM ?? ''}" min="0" max="300" step="0.01" required></label><label>Rakennuksen syvyys (m)<input name="buildingDepth" type="number" value="${project?.geometry?.buildingDepthM ?? ''}" min="0" max="200" step="0.01" required></label><label>Rakennuksen korkeus (m)<input name="buildingHeight" type="number" value="${project?.building?.height?.value ?? ''}" min="0" max="200" step="0.1" required></label><label>Korkeuden tietotila<select name="buildingHeightStatus"><option value="user">Käyttäjän syöttämä</option><option value="estimate">Arvioitu</option><option value="source">Lähteestä</option><option value="verified">Tarkistettu</option></select></label><label class="span-two">Korkeuden lähde tai menetelmä<input name="buildingHeightSource" value="${escapeHtml(project?.building?.height?.source || '')}" maxlength="1000" placeholder="Lähde, mittaus tai arvio"></label><label>Telineen tavoitekorkeus (m)<input name="height" type="number" value="${project?.geometry?.targetHeightM ?? ''}" min="0" max="120" step="0.1" required></label><label>Kenttien enimmäismäärä <small>tyhjä = optimoi koko julkisivulle</small><input name="bayCount" type="number" min="0" max="100" step="1" value="${project?.geometry?.bayCount ?? ''}" placeholder="Automaattinen"></label><label>Kuormaluokka<select name="loadClass"><option value="1" ${Number(project?.geometry?.loadClass??3)===1?'selected':''}>1</option><option value="2" ${Number(project?.geometry?.loadClass??3)===2?'selected':''}>2</option><option value="3" ${Number(project?.geometry?.loadClass??3)===3?'selected':''}>3</option><option value="4" ${Number(project?.geometry?.loadClass??3)===4?'selected':''}>4</option><option value="5" ${Number(project?.geometry?.loadClass??3)===5?'selected':''}>5</option><option value="6" ${Number(project?.geometry?.loadClass??3)===6?'selected':''}>6</option></select><small>Diagonaalit vähintään joka 5. kenttään; luokilla 4–6 erillinen jäykistystarkistus.</small></label><label>Työtasojen nousut<input name="platformLevels" value="${(project?.geometry?.platformLevels||[]).join('; ')}" placeholder="esim. 2; 4; 6" aria-describedby="scaffoldPlatformHelp"><small id="scaffoldPlatformHelp">Merkitse työtason nousut puolipisteillä (esim. 2; 4; 6). Jokaiselle valitulle tasolle lisätään automaattisesti järjestelmän mukaiset käsijohteet, välijohteet ja yhteensopivat varvaslaudat (jalkalistat).</small></label><label>Piirtoasteikko<select name="scale"><option value="50">1:50</option><option value="100" selected>1:100</option><option value="200">1:200</option><option value="250">1:250</option><option value="500">1:500</option></select></label><label class="span-two scaffold-keder-toggle"><input name="kederRoofEnabled" type="checkbox" ${project?.geometry?.kederRoof?.enabled?'checked':''}> Lisää Layher Keder Roof XL -sääsuoja · kaksilappeinen 18°</label><label>Kattotuen akselimitta<select name="kederRoofAxis"><option value="0.73" ${Number(project?.geometry?.kederRoof?.supportAxisM??0.73)===0.73?'selected':''}>0,73 m</option><option value="1.09" ${Number(project?.geometry?.kederRoof?.supportAxisM??0.73)===1.09?'selected':''}>1,09 m</option></select></label><label>Katon jäykistys<select name="kederRoofBracing"><option value="light" ${project?.geometry?.kederRoof?.bracingVariant==='light'?'selected':''}>Light · 2 m</option><option value="standard" ${!project?.geometry?.kederRoof?.bracingVariant||project?.geometry?.kederRoof?.bracingVariant==='standard'?'selected':''}>Standard · 2 m</option><option value="heavy" ${project?.geometry?.kederRoof?.bracingVariant==='heavy'?'selected':''}>Heavy · 1 m</option></select></label><p class="span-two muted small scaffold-keder-help">Kytke valinta päälle ja valitse alla olevasta mallista kaksi vastakkaista, yhdensuuntaista julkisivua. Kattotuoliväli enintään 2,57 m; 18° kattotaulukko alkaa 5,90 m leveydestä.</p><button class="button button-primary" type="submit">Päivitä malli</button></form><p class="scaffold-origin-note">Tietotilat: lähteestä · käyttäjän syöttämä · arvio · tarkistettu. EPSG:3879-polygonin sivumitat lasketaan metreinä; tavoite ja mallin moduulimitat näytetään erikseen.</p></div></section>
      </div>
      <section id="scaffold-drawing-panel" class="panel scaffold-drawing-panel"><div class="panel-head"><div><h2>3 · Yhdestä mallista johdetut 2D, 3D ja BOM</h2><p>Layher Allround -kentät ja valinnainen Keder Roof XL käyttävät samaa rakennusmallia; kattotuolijaon enimmäismitta 2,57 m näkyy erikseen.</p></div><div class="heading-actions"><button class="button button-sm" data-action="export-scaffold-fcmacro" type="button">Vie FreeCAD · FCMacro</button><button class="button button-sm" data-action="export-scaffold-dxf" type="button">Vie CAD · DXF</button><button class="button button-sm" data-action="export-scaffold-obj" type="button">Vie 3D · OBJ</button><button class="button button-sm" data-action="export-scaffold-svg" type="button">Vie SVG</button><button class="button button-sm" data-action="export-scaffold-pdf" type="button">Tulosta piirustus / PDF</button><button class="button button-sm" data-action="download-scaffold-bom" type="button">Vie BOM CSV</button><button class="button button-sm" data-action="export-scaffold-quote" type="button">Vie tarjousluonnos CSV</button><button class="button button-sm" data-action="export-scaffold-quote-pdf" type="button">Tulosta tarjous / PDF</button><button class="button button-sm button-primary" data-action="push-scaffold-quote" type="button">Vie CRM-tarjousputkeen</button></div></div><div class="scaffold-view-comparison" role="group" aria-label="Pohjan, julkisivun ja leikkauksen tehtävät"><article><span class="tag blue">PLAN · X + Y · POHJA</span><strong>Missä teline kulkee?</strong><p>DXF näyttää rakennuksen ääriviivan ja valitun julkisivun telinerivejä. SVG:n pohjakuva on vain rakennussyvyyden suuntakaavio.</p></article><article><span class="tag blue">ELEVATION · X + Z · JULKISIVU</span><strong>Miten teline nousee?</strong><p>Alla oleva vuorovaikutteinen julkisivu näyttää kentät, nousut ja malliin syötetyt tasot. Tarkista rakennuksen kerrokset ja työskentelykohdat erikseen.</p></article><article><span class="tag amber">SECTION · Y + Z · LEIKKAUS</span><strong>Miten teline sopii rakennuksen viereen?</strong><p>Allroundin U-jokkataulukossa on poikittaisia nimellismittoja, kuten 0,73 m ja 1,09 m; Keder XL käyttää 0,73 m tai 1,09 m tukikehän akselimittaa. Nämä eivät yksin määritä käyttöleveyttä, ulokkeita tai julkisivuvälystä.</p></article></div><p class="privacy-note scaffold-view-note"><strong>Julkisivuvälys mitataan kohteessa.</strong> Layherin 2018 ohje mainitsee 0,30 m:n esimerkkinä, ei yleisenä raja-arvona; sisäsuoja voi olla tarpeen pienemmälläkin välillä. Parveke, sisäänkäyntikatos ja kattoreuna voivat tarvita omat leikkauksensa. <a href="#scaffold-project-section">Liitä kohdekohtainen leikkaus projektiaineistoon</a>. Lähteet: <a href="/archive/layher-allround/">Allround-ohje ja katalogi ↗</a> · <a href="/archive/layher-keder-xl/">Keder XL -ohje ↗</a> · <a href="https://data.finlex.fi/fi/lainsaadanto/2009/205" target="_blank" rel="noopener noreferrer">ajantasainen VNa 205/2009 ↗</a> · <a href="https://finlex.fi/fi/lainsaadanto/1998/156" target="_blank" rel="noopener noreferrer">kumottu STM 156/1998 ↗</a>. Mitattu julkisivun ja sisimmän työtason väli sekä tasokokoonpano puuttuvat, joten vienti ei muodosta mitoitettua leikkausta.</p><div class="scaffold-drawings"><div><h3>Julkisivu · Layher Allround -kentät, koko peittoa optimoiden</h3><div id="scaffoldCanvasWrap" class="scaffold-canvas-wrap" tabindex="0" role="group" aria-label="Telinejulkisivun valinta. Klikkaa osaa tai piirrä valinta-alue."><canvas id="scaffoldFacadeCanvas" width="1100" height="500" aria-label="Layher Allround -telineen julkisivuluonnos"></canvas><svg id="scaffoldCursorOverlay" class="scaffold-cursor-overlay" aria-hidden="true"><path id="scaffoldLassoPath" class="scaffold-lasso-path"></path><g id="scaffoldCursorCallout" class="scaffold-cursor-callout"><path id="scaffoldCursorBeam"></path><circle id="scaffoldCursorDot" r="3"></circle><text id="scaffoldCursorLabel"></text><text id="scaffoldCursorDetail"></text></g></svg><div id="scaffoldSelectionLoop" class="scaffold-selection-loop" aria-hidden="true"></div></div><div class="scaffold-selection-controls"><p id="scaffoldSelectionStatus" class="scaffold-selection-status" role="status" aria-live="polite">Valitse osia tarkastelua varten.</p><button class="button button-sm" id="scaffoldClearSelection" type="button">Tyhjennä valinta</button></div><p id="scaffoldDrawingMeta" class="muted small"></p><div id="scaffoldDrawingLegend" class="scaffold-drawing-key" aria-label="Tämän näkymän piirustusmerkkien selite"><span><i class="scaffold-key-swatch building"></i>Rakennuksen massa</span><span><i class="scaffold-key-swatch standards"></i>Pystylinjat</span><span><i class="scaffold-key-swatch ledgers"></i>Vaakajuoksut</span><span><i class="scaffold-key-swatch braces"></i>Diagonaalit</span><span><i class="scaffold-key-swatch deck"></i>Työtasot</span><small>Värit selittävät tämän näkymän piirrosmerkit. PLAN = suuntaa-antava pohja; ELEV. = julkisivu. Projektin ja valmistajan tunnukset tarkistetaan niiden omasta selitteestä. Tämä luonnos ei sisällä leikkaus- tai detaljinäkymää. <a href="?page=knowledge" data-page="knowledge">Avaa symboliopas</a></small></div><p id="scaffoldFacadeStatus" class="scaffold-facade-status" role="status">Valitse julkisivu 3D-mallista.</p></div><div><h3>Valmis rakennusmalli ja sama telinemoduuli</h3><div id="scaffold3dPreview" class="scaffold-3d-preview" aria-label="Rakennus- ja telinemallin 3D-luonnos"></div><div id="scaffoldTerrainMassLabel" class="scaffold-terrain-mass-label">Maastopinta näkyy 3D-massassa, kun korkeusruudukko on tuotu. Vyöhykkeet: 0–2 m · 2–5 m · 5–10 m rakennuksen reunasta.</div><div id="scaffoldFacadeOptions" class="scaffold-facade-options" role="group" aria-label="Valitse rakennuksen julkisivu tai Keder XL -katon sivut"></div><div class="scaffold-facade-plan-tools"><div><strong>Julkisivukohtaiset telineet</strong><p>Valitse yllä julkisivu ja lisää se omaksi telinekokoonpanoksi. Määritä jokaiselle sivulle omat speksit.</p></div><button class="button button-sm button-primary" id="scaffoldAddFacadePlan" type="button">＋ Lisää valittu julkisivu</button></div><div id="scaffoldFacadePlanList" class="scaffold-facade-plan-list" aria-live="polite"></div><section class="scaffold-corner-review" aria-labelledby="scaffoldCornerTitle"><div class="scaffold-corner-review-head"><div><strong id="scaffoldCornerTitle">Kulmasuunnittelu · vierekkäiset julkisivut</strong><p>Valitse kulma, vertaa sen kahta telinesivua ja kirjaa erikseen tarkistettavat asiat.</p></div><span class="tag amber">Suunnittelutarkistus</span></div><div id="scaffoldCornerReviewPanel" aria-live="polite"></div><p class="scaffold-corner-source">Periaatteet: <a href="https://scaffolddesignhub.com/scaffolding-building-corners/" target="_blank" rel="noopener noreferrer">Scaffolding Design Hub · building corners ↗</a>. Erityiskulmat tarvitsevat kohdekohtaisen detailin.</p><p class="privacy-note">Kulmalista ja luonnoskuva eivät laske kansien aukkoja tai liitosten kapasiteettia eivätkä hyväksy rakennetta. Tarkista järjestelmäohje, välykset, kulmayksityiskohta ja vakaus pätevän suunnittelijan kanssa.</p></section><section id="scaffold-drawing-review" class="scaffold-drawing-review" aria-labelledby="scaffoldDrawingReviewTitle"><div class="scaffold-corner-review-head"><div><strong id="scaffoldDrawingReviewTitle">Piirustus- ja työmaatilanteen tarkistus</strong><p>Tarkastele, vastaavatko rakennus, maasto, osat ja piirustukset samaa todellista kohdetta.</p></div><span id="scaffoldDrawingReviewSummary" class="tag amber">Tarkistus kesken</span></div><div id="scaffoldDrawingReviewList" class="scaffold-drawing-review-list" aria-live="polite"></div><p class="scaffold-corner-source">Lähde: <a href="https://scaffolddesignhub.com/scaffold-drawing-details/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · piirustuksista helposti unohtuvat yksityiskohdat ↗</a>. Avaa piirustukset, työmaatieto ja tarvittavat valokuvat yhdessä; kuvat eivät yksin varmista mittoja.</p><p class="scaffold-corner-source">Detaljin periaatteet: <a href="https://scaffolddesignhub.com/scaffold-detail-drawings/" target="_blank" rel="noopener noreferrer">Scaffold Design Hub · Scaffold Details Explained ↗</a>. Lisää suurennettu näkymä vain, kun se vastaa kirjattuun paikalliseen kysymykseen.</p><p class="privacy-note">Tämä on projektikohtainen tarkistusmuistio. Avoin kohta pyytää lisätietoa, eikä piirustuksen tai vakauden teknistä hyväksyntää. Lainsäädäntöesimerkit ja mitat on tarkistettava projektin sijaintimaan ajantasaisista ohjeista.</p></section><section id="scaffold-access-stability" class="scaffold-stairtower-tools" aria-labelledby="scaffoldStairTowerTitle"><div><strong id="scaffoldStairTowerTitle">Porrastornit · sijoita klikkaamalla 3D-mallia</strong><p>Lisää ensin teline halutulle julkisivulle. Määritä tornien määrä ja korkeus, käynnistä sijoitus ja klikkaa tornien keskikohdat rakennuksen sivulta.</p></div><div class="scaffold-stairtower-inputs"><label>Torneja sijoitettavaksi<input id="scaffoldStairTowerQty" type="number" min="1" max="20" step="1" value="2"></label><label>Korkeus m<input id="scaffoldStairTowerHeight" type="number" min="0.5" max="120" step="0.5" value="20"></label><label>Leveys m<input id="scaffoldStairTowerWidth" type="number" min="1.4" max="5" step="0.1" value="1.4"></label><label>Porrasmoduuli<select id="scaffoldStairTowerBay"><option value="2.57" selected>2,57 m · Layher 1753.257</option><option value="3.07">3,07 m · Layher 1753.307</option></select></label></div><div class="scaffold-stairtower-actions"><button class="button button-sm button-primary" id="scaffoldStartStairTowerPlacement" type="button">📍 Sijoita 2 porrastornia</button><button class="button button-sm" id="scaffoldCancelStairTowerPlacement" type="button" hidden>Peruuta sijoitus</button><span id="scaffoldStairTowerStatus" role="status" aria-live="polite">Porrastornin mallikorkeus pyöristyy 2,00 m:n moduuleihin.</span></div><div id="scaffoldStairTowerList" class="scaffold-stairtower-list" aria-live="polite"></div></section><p id="scaffoldKederStatus" class="privacy-note scaffold-keder-status" role="status" aria-live="polite">Kytke Keder XL päälle ja valitse kaksi vastakkaista julkisivua.</p><p id="scaffoldModelStatus" class="muted small">Valitse kartalta rakennuksen lähdepolygonin käyttö.</p></div></div><div class="panel-body"><div id="scaffoldBOMSummary" class="privacy-note"></div></div></section>
      <section class="panel keder-library"><div class="panel-head"><div><p class="eyebrow">ALLROUND · KEDER</p><h2>Komponenttikirjasto ja katosmallit</h2><p>Valitse Layher Keder Roof XL -kokoonpano tai manuaalissa lueteltu osa pyöritettäväksi 3D-näkymässä.</p></div><span class="tag blue">3D · m · lähdesivu näkyy</span></div><div class="panel-body"><div class="allround-viewer-controls"><label for="allroundModelSelect">Valitse kokoonpano tai 3D-osa<select id="allroundModelSelect">${kederXLPreviewOptions()}<optgroup label="Paketin kokoonpanot"><option value="assets/allround-keder-pack/glb/12_keder_roof/demo_keder_roof_4140x4140.glb">Keder-kattokokoonpano 4,14 × 4,14 m · GLB-paketti</option><option value="assets/allround-keder-pack/glb/11_demo_assembly/demo_assembly_2070x1090_2lifts.glb">Allround-kokoonpano · 2 kenttää / 2 nousua · GLB-paketti</option></optgroup><optgroup label="Keder-mallipaketin osat"><option value="assets/allround-keder-pack/glb/12_keder_roof/keder_truss_4140_rise900.glb">Keder-ristikko 4,14 m / nousu 0,90 m · GLB-paketti</option><option value="assets/allround-keder-pack/glb/12_keder_roof/keder_truss_3070_rise700.glb">Keder-ristikko 3,07 m / nousu 0,70 m · GLB-paketti</option><option value="assets/allround-keder-pack/glb/12_keder_roof/roof_ledger_2070.glb">Kattovaakajuoksu 2,07 m · GLB-paketti</option><option value="assets/allround-keder-pack/glb/12_keder_roof/roof_plan_diagonal_2070x2070.glb">Kattotason diagonaali 2,07 × 2,07 m · GLB-paketti</option></optgroup><optgroup label="Allround-mallipaketin osat">${[['Pystyrakenne','01_verticals/standard_2000.glb'],['Vaakajuoksu','02_ledgers/ledger_2070.glb'],['U-poikkipalkki','03_u_transoms/u_transom_2070.glb'],['Vahvistettu U-poikkipalkki','04_u_transoms_reinforced/u_transom_reinforced_2070.glb'],['Diagonaali','05_diagonals/diagonal_2070x2000.glb'],['Säätöjalka','06_base/base_jack_600.glb'],['Terästaso','07_platforms/steel_deck_2070x320.glb'],['Konsoli','08_consoles/console_730.glb'],['Porras','09_stairs/stair_2570x2000.glb'],['Nostopyörä','10_gin_wheel/gin_wheel.glb']].map(([name,file])=>`<option value="assets/allround-keder-pack/glb/${file}">${name} · GLB-paketti</option>`).join('')}</optgroup></select></label><p id="allroundModelStatus" role="status">Keder XL -kokoonpano · Layher-manuaali s. 6.</p></div><div id="allroundModelViewport" class="allround-model-viewport" aria-label="Allround- ja Keder-osien pyöritettävä 3D-näkymä"></div><div class="allround-viewer-help">Vedä pyörittääksesi · vieritä zoomataksesi · valitse toinen osa valikosta · <a href="assets/allround-keder-pack/previews/preview_closeups.png" target="_blank" rel="noopener">GLB-lähikuvat</a> · <a href="/archive/layher-keder-xl/Keder-Roof-XL-Manual-PDF.pdf#page=32" target="_blank" rel="noopener">Keder XL -manuaali, osaluettelo s. 32–36</a></div><div class="keder-library-grid"><img src="assets/allround-keder-pack/previews/preview_keder.png" alt="Keder-kattorakenteen ja Allround-telineen esikatselu"><p class="privacy-note">Layher-ohjeeseen perustuvat Keder XL -osat on mallinnettu havainnollistavina 3D-luonnoksina; ohjeessa ilmoitetut mitat, tuotenumero, paino ja sivu näkyvät valinnan yhteydessä. Profiilien ja liitosten yksityiskohtainen geometria ei ole valmistajan CAD-mallia. GLB-paketin erilliset mallit on merkitty pakettimalleiksi. Visualisointi ei ole mitoitus tai rakenteellinen hyväksyntä.</p></div></div><script type="module" src="allround-model-viewer.mjs"></script></section>
      <section id="scaffold-bom-section" class="panel"><div class="panel-head"><div><h2>4 · Layher Allround -BOM ja hinnat</h2><p>Parametrinen projektin BOM käyttää oletuksena Layher Allround -osia. Kenttäpituudet optimoidaan tavoitejulkisivuun; diagonaalit lasketaan vähintään joka viidenteen kenttään Layher-ohjeen mukaan.</p></div><a class="button button-sm" href="?page=bom" data-page="bom">Layher Allround -oletuskatalogi ↗</a><a class="button button-sm" href="${escapeHtml(project?.system?.manualUrl || window.TelineDomain?.LAYHER_ALLROUND?.manualUrl || '#')}" target="_blank" rel="noopener noreferrer">Layherin asennus- ja käyttöohje ↗</a></div><div class="panel-body"><div class="table-scroll"><table class="data-table scaffold-bom-table"><thead><tr><th>Osa / tuotenro</th><th>Määrä</th><th>Paino</th><th>Osto €/kpl</th><th>Vuokra €/kpl/pv</th><th>Päiviä</th><th>Osan lähde</th><th>Hinnan lähde / päivä</th></tr></thead><tbody id="scaffoldBomRows"></tbody></table></div><div class="scaffold-cost-inputs"><label>Asennus h (hlö)<input id="scaffoldInstallHours" type="number" min="0" step="0.25" value="${laborHoursFor(pricing,'Asennus',true)}" ${installationEstimate.enabled?'readonly':''}></label><label>Purku h (hlö)<input id="scaffoldDismantleHours" type="number" min="0" step="0.25" value="${laborHoursFor(pricing,'Purku')}" ${installationEstimate.dismantlingEnabled?'readonly':''}></label><label>Tarkastus h (hlö)<input id="scaffoldInspectionHours" type="number" min="0" step="0.25" value="${laborHoursFor(pricing,'Tarkastus')}" ${installationEstimate.inspectionEnabled?'readonly':''}></label><label>Työn €/hlö-h<input id="scaffoldLaborRate" type="number" min="0" step="0.01" value="${Number(pricing.labor?.[0]?.ratePerHour)||0}"></label><label>Kuljetukset kpl<input id="scaffoldTransportQuantity" type="number" min="0" step="1" value="${Number(pricing.transport?.[0]?.quantity)||0}"></label><label>Kuljetus €/kpl<input id="scaffoldTransportAmount" type="number" min="0" step="0.01" value="${Number(pricing.transport?.[0]?.amountPerUnit)||0}"></label><label>Muut kulut €<input id="scaffoldOtherCosts" type="number" min="0" step="0.01" value="${Number(pricing.otherCosts)||0}"></label></div><section class="scaffold-install-estimator"><label class="scaffold-install-auto"><input id="scaffoldInstallAuto" type="checkbox" ${installationEstimate.enabled?'checked':''}> Laske asennustunnit automaattisesti</label><label class="scaffold-install-auto"><input id="scaffoldDismantleAuto" type="checkbox" ${installationEstimate.dismantlingEnabled?'checked':''}> Laske purkutunnit automaattisesti samalla menekillä</label><label class="scaffold-install-auto"><input id="scaffoldInspectionAuto" type="checkbox" ${installationEstimate.inspectionEnabled?'checked':''}> Laske tarkastustunnit automaattisesti</label><div class="scaffold-install-estimator-fields"><label>Asennus + purku min / BOM-osa<input id="scaffoldInstallMinutesPerPart" type="number" min="0" max="600" step="0.1" value="${installationEstimate.minutesPerPart}"></label><label>Tarkastus min / BOM-osa<input id="scaffoldInspectionMinutesPerPart" type="number" min="0" max="600" step="0.1" value="${installationEstimate.inspectionMinutesPerPart}"></label><label>Korkeuslisä / 10 m yli vertailukorkeuden (%)<input id="scaffoldInstallHeightIncrease" type="number" min="0" max="500" step="1" value="${installationEstimate.heightIncreasePercentPer10M}"></label><label>Vertailukorkeus m<input id="scaffoldInstallReferenceHeight" type="number" min="0.1" max="120" step="0.1" value="${installationEstimate.referenceHeightM}"></label><label>Asennusmiehiä / asentajia<input id="scaffoldInstallCrewSize" type="number" min="1" max="50" step="1" value="${installationEstimate.crewSize}"><small>Muokattava työryhmän oletuskoko</small></label></div><div id="scaffoldInstallEstimateDetails" class="scaffold-install-estimate-details" role="status" aria-live="polite"></div><div id="scaffoldInstallCrewEstimate" class="scaffold-install-estimate-total" role="status" aria-live="polite"></div><p class="muted small">Karkea, muokattava oletus: asennus ja purku käyttävät samaa BOM-osamenekkiä; tarkastukselle on erillinen min/osa-asetus (luonnosoletus 1 min/osa). Kaikissa käytetään yhteistä korkeuskerrointa. Ryhmän kesto lasketaan henkilötyötunneista ja asentajamäärästä. Asentajamäärän oletus on 2 henkilöä; muuta se työmaan suunnitelmaan. Arvio ei ole valmistajan tai RATU:n työmenekki, eikä puuttuvia suunnitteluosia ole laskettu mukaan.</p></section><div class="scaffold-quote-terms"><h3>Tarjouksen ehdot</h3><label>Kate myyntihinnasta (%)<input id="scaffoldMarginPercent" type="number" min="0" max="99.99" step="0.1" value="${pricing.quoteTerms?.marginPercent ?? ''}" placeholder="Määritä"></label><label>ALV (%)<input id="scaffoldVatPercent" type="number" min="0" max="100" step="0.1" value="${pricing.quoteTerms?.vatPercent ?? ''}" placeholder="Määritä"></label><label>Hinnat voimassa asti<input id="scaffoldPriceValidUntil" type="date" value="${escapeHtml(pricing.quoteTerms?.validUntil || '')}"></label><label>Hinnan syöttäjä<input id="scaffoldPriceEnteredBy" maxlength="160" value="${escapeHtml(pricing.quoteTerms?.priceEnteredBy || '')}" placeholder="Nimi"></label><label>Työhinnan lähde<input id="scaffoldLaborPriceSource" maxlength="500" value="${escapeHtml(pricing.labor?.[0]?.source || 'Käyttäjän hintasyöte')}"></label><label>Kuljetushinnan lähde<input id="scaffoldTransportPriceSource" maxlength="500" value="${escapeHtml(pricing.transport?.[0]?.source || 'Käyttäjän hintasyöte')}"></label><label>Muiden kulujen lähde<input id="scaffoldOtherCostsPriceSource" maxlength="500" value="${escapeHtml(pricing.otherCostsSource || 'Käyttäjän hintasyöte')}"></label><span class="scaffold-currency">Valuutta: EUR</span><p>Kate lasketaan myyntihinnasta ilman ALV:tä: kustannus ÷ (1 − kate %). ALV ja kate on määritettävä erikseen; niitä ei oleteta.</p></div><div id="scaffoldCostSummary" class="scaffold-cost-summary"></div>${project?`<section class="scaffold-lms-link"><h3>Toimitus LMS:ään</h3><p id="scaffoldLmsRevisionStatus"></p><form id="scaffoldDeliveryForm" class="inline-form"><input type="hidden" name="expectedRevision" value="${project.revision}"><label>Toimituspäivä<input type="date" name="date" value="${TODAY_ISO}" required></label><label>Aika<input type="time" name="time" value="" required></label><label>Ajoneuvo / tunniste<input name="vehicle" maxlength="100" placeholder="Esim. kuorma-auto"></label><button class="button button-sm button-primary" type="submit" ${scaffoldProjectDirty?'disabled':''}>＋ Luo LMS-toimitus tästä BOMista</button></form></section>`: ''}<div id="scaffoldOpenItems" class="privacy-note"></div><p class="muted small">Hinnat ovat käyttäjän antamia hintarivejä. Ne eivät vaikuta geometriamitoitukseen. Rakenteellinen laskenta ja hyväksyntä ovat erillinen, ammattilaisen tarkastettava prosessi.</p></div></section>
      <section id="scaffold-provenance-section" class="panel"><div class="panel-head"><div><h2>5 · Tallennetun projektin tietotila</h2><p>Yhteinen lähde, geometriat, järjestelmä, BOM, kustannukset ja revisio tallentuvat yhtenä kokonaisuutena.</p></div></div><div class="panel-body"><div id="scaffoldProvenancePanel" class="scaffold-provenance-grid"></div></div></section>`;
  }

  function base44AdminView() {
    const latest=(state.scaffoldAdminImports||[])[0];
    const views=latest?.views||[], analyses=latest?.analyses||[], materials=latest?.materials||[], components=latest?.components||[];
    const viewCards=views.map((view)=>`<article class="base44-import-card"><span class="tag blue">Admin-näkymä</span><strong>${escapeHtml(view.title||view.name||view.label||'Nimetön näkymä')}</strong><small>${escapeHtml(view.description||view.route||view.path||'')}</small></article>`).join('');
    const rows=analyses.map((item)=>`<details class="base44-import-row"><summary>${escapeHtml(item.projectName||item.name||item.title||item.id||'Telineanalyysi')} · ${escapeHtml(item.status||item.state||'Tila ei ilmoitettu')}</summary><pre>${escapeHtml(JSON.stringify(item,null,2))}</pre></details>`).join('');
    return `<section class="panel base44-admin-panel"><div class="panel-head"><div><p class="eyebrow">BASE44 · READ-ONLY ADMIN DATA IMPORT</p><h2>Admin-näkymien ja analyysien tuonti</h2><p>Yhdistä Base44-sovelluksen suojattu JSON-vientifunktio.</p></div><span class="tag ${latest?'green':'amber'}">${latest?'Tuotu '+formatDate(latest.importedAt?.slice(0,10),{day:'numeric',month:'short',year:'numeric'}):'Ei API-yhteyttä'}</span></div><div class="panel-body"><form id="base44AdminImportForm" class="base44-import-form"><label>Base44-admin-vientifunktion HTTPS-URL<input name="endpoint" type="url" required placeholder="https://finnish-construction-compliance-sui-5106cde5.base44.app/api/…" value="${escapeHtml(localStorage.getItem('telinehallinta-base44-admin-endpoint-v1')||'')}"></label><button class="button button-primary" type="submit">Tuo admin-tiedot</button></form><p class="muted small">API-avain haetaan paikallisesta salaisuusholvista nimellä <strong>Base44 Scaffold Admin API</strong>. Tallenna se ensin Asetukset → API keys. Tuonti on vain luku; Base44:n admin-oikeuksilla toimivan vientifunktion pitää palauttaa JSON: <code>{ analyses, materials, components, views }</code>.</p><p id="base44AdminImportStatus" class="small" role="status"></p>${latest?`<div class="base44-import-summary">${[['Analyysit',analyses.length],['Materiaalit',materials.length],['Komponentit',components.length],['Näkymät',views.length]].map(([label,value])=>`<div class="summary-item"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><p class="muted small">Lähde ${escapeHtml(latest.source)} · skeemaversio ${escapeHtml(latest.schemaVersion||'unversioned')} · tuontiaika ${escapeHtml(latest.importedAt||'')}</p>${viewCards?`<h3>Tuodut admin-näkymät</h3><div class="base44-import-view-grid">${viewCards}</div>`:''}${rows?`<h3>ScaffoldAnalysis-tietueet</h3><div class="base44-import-records">${rows}</div>`:''}${materials.length?`<h3>Materiaalirivit</h3><div class="base44-import-records">${materials.slice(0,30).map((item)=>`<details class="base44-import-row"><summary>${escapeHtml(item.name||item.title||item.code||item.id||'Materiaali')}</summary><pre>${escapeHtml(JSON.stringify(item,null,2))}</pre></details>`).join('')}${materials.length>30?`<p class="muted small">Näytetään 30 / ${materials.length} materiaalia tässä näkymässä.</p>`:''}</div>`:''}`:'<div class="empty-state"><strong>Ei tuotuja admin-tietoja</strong>Kirjautumissivua ei voi lukea API:na. Kytke vain luku -JSON-vientifunktio Base44-sovellukseen ja syötä sen endpoint tähän.</div>'}<div class="privacy-note"><strong>Oikeusraja:</strong> tämä paikallinen palvelin ei voi käyttää Base44:n service role -oikeutta suoraan. Admin-data on tuotava Base44-sovelluksen omasta backend-funktiosta, joka tarkistaa tämän yhteyden API-avaimen. Tuodut vedokset säilyvät vain tämän selaimen paikallisessa työtilassa.</div></div></section>`;
  }

  function updateScaffoldSelectionStatus(message = '') {
    const status = $('#scaffoldSelectionStatus');
    if (!status) return;
    const labels = [...selectedScaffoldParts].map((id) => scaffoldSelectableParts.find((part) => part.id === id)?.label).filter(Boolean);
    const selected = labels.length ? `Valittuna ${labels.length} osaa${labels.length <= 3 ? ` · ${labels.join(', ')}` : ` · ${labels.slice(0, 3).join(', ')} ja ${labels.length - 3} muuta`}.` : 'Valittuna 0 osaa.';
    status.textContent = [message, selected].filter(Boolean).join(' ');
  }

  function initScaffoldSelectionCursor(canvas, draw) {
    const surface = $('#scaffoldCanvasWrap');
    const overlay = $('#scaffoldCursorOverlay');
    const lasso = $('#scaffoldLassoPath');
    const callout = $('#scaffoldCursorCallout');
    const beam = $('#scaffoldCursorBeam');
    const dot = $('#scaffoldCursorDot');
    const label = $('#scaffoldCursorLabel');
    const detail = $('#scaffoldCursorDetail');
    const loop = $('#scaffoldSelectionLoop');
    const cursor = $('#workspaceRatchetCursor');
    const clearButton = $('#scaffoldClearSelection');
    if (!surface || !overlay || !lasso || !loop || !cursor) return;

    let dragging = false;
    let moved = false;
    let startPoint = null;
    let points = [];

    function surfacePoint(event) {
      const bounds = surface.getBoundingClientRect();
      const canvasBounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      return {
        x, y,
        canvasX: (event.clientX - canvasBounds.left) * canvas.width / Math.max(1, canvasBounds.width),
        canvasY: (event.clientY - canvasBounds.top) * canvas.height / Math.max(1, canvasBounds.height),
      };
    }

    function distanceToSegment(x, y, part) {
      const dx = part.x2 - part.x1, dy = part.y2 - part.y1;
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared ? Math.max(0, Math.min(1, ((x - part.x1) * dx + (y - part.y1) * dy) / lengthSquared)) : 0;
      return Math.hypot(x - (part.x1 + t * dx), y - (part.y1 + t * dy));
    }

    function findPart(point) {
      const canvasBounds = canvas.getBoundingClientRect();
      const tolerance = Math.max(9, 12 * canvas.width / Math.max(1, canvasBounds.width));
      let nearest = null, nearestDistance = Infinity;
      for (const part of scaffoldSelectableParts) if (part.kind === 'segment') {
        const distance = distanceToSegment(point.canvasX, point.canvasY, part);
        if (distance < nearestDistance) { nearest = part; nearestDistance = distance; }
      }
      if (nearest && nearestDistance <= tolerance) return nearest;
      return [...scaffoldSelectableParts].reverse().find((part) => part.kind === 'area' && point.canvasX >= part.x && point.canvasX <= part.x + part.width && point.canvasY >= part.y && point.canvasY <= part.y + part.height) || null;
    }

    function partCenterOnSurface(part) {
      const bounds = canvas.getBoundingClientRect();
      const surfaceBounds = surface.getBoundingClientRect();
      return {
        x: bounds.left - surfaceBounds.left + part.cx * bounds.width / canvas.width,
        y: bounds.top - surfaceBounds.top + part.cy * bounds.height / canvas.height,
      };
    }

    function pointInPolygon(x, y, polygon) {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i], b = polygon[j];
        if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
      }
      return inside;
    }

    function previewForPolygon(polygon) {
      const result = new Set();
      if (polygon.length < 3) return result;
      for (const part of scaffoldSelectableParts) {
        const center = partCenterOnSurface(part);
        if (pointInPolygon(center.x, center.y, polygon)) result.add(part.id);
      }
      return result;
    }

    function syncOverlay() {
      const bounds = surface.getBoundingClientRect();
      overlay.setAttribute('viewBox', `0 0 ${Math.max(1, bounds.width)} ${Math.max(1, bounds.height)}`);
    }

    function updateCallout(point, part, lassoCount = null) {
      if (!part && lassoCount === null) { callout.classList.remove('visible'); return; }
      const selected = part && selectedScaffoldParts.has(part.id);
      label.textContent = lassoCount === null ? String(part.label).toLocaleUpperCase('fi') : 'SILMUKKA';
      detail.textContent = lassoCount === null ? (selected ? 'VALITTU · KLIKKAA POISTA' : 'KLIKKAA VALITAKSESI') : `${lassoCount} KOHDETTA SISÄLLÄ`;
      const width = Math.max(label.getComputedTextLength(), detail.getComputedTextLength());
      const direction = point.x + 34 + width + 18 < surface.clientWidth - 8 ? 1 : -1;
      const textY = point.y - 28 < 26 ? point.y + 28 : point.y - 28;
      const textX = point.x + direction * 32;
      beam.setAttribute('d', `M${point.x} ${point.y} L${point.x + direction * 22} ${textY} L${point.x + direction * (width + 42)} ${textY}`);
      dot.setAttribute('cx', point.x); dot.setAttribute('cy', point.y);
      label.setAttribute('x', textX); label.setAttribute('y', textY - 7);
      detail.setAttribute('x', textX); detail.setAttribute('y', textY + 9);
      label.setAttribute('text-anchor', direction > 0 ? 'start' : 'end');
      detail.setAttribute('text-anchor', direction > 0 ? 'start' : 'end');
      callout.classList.add('visible');
    }

    function moveCursor(point) {
      surface.classList.add('cursor-active');
      loop.style.left = `${point.x}px`;
      loop.style.top = `${point.y}px`;
      loop.classList.toggle('hovering', Boolean(hoveredScaffoldPart));
    }

    function clearLasso() {
      lasso.removeAttribute('d');
      points = [];
      previewScaffoldParts.clear();
      dragging = false;
      moved = false;
      startPoint = null;
      loop.classList.remove('down');
    }

    function clearSelection() {
      selectedScaffoldParts.clear();
      previewScaffoldParts.clear();
      draw();
      updateScaffoldSelectionStatus('Valinta tyhjennetty.');
      callout.classList.remove('visible');
    }

    syncOverlay();
    window.addEventListener('resize', syncOverlay);
    surface.addEventListener('pointerenter', (event) => moveCursor(surfacePoint(event)));
    surface.addEventListener('pointermove', (event) => {
      const point = surfacePoint(event);
      moveCursor(point);
      if (dragging) {
        if (Math.hypot(point.x - startPoint.x, point.y - startPoint.y) > 6) moved = true;
        if (moved) {
          points.push({ x: point.x, y: point.y });
          lasso.setAttribute('d', `M${points.map((item) => `${item.x} ${item.y}`).join(' L')} Z`);
          previewScaffoldParts.clear();
          for (const id of previewForPolygon(points)) previewScaffoldParts.add(id);
          draw();
          updateCallout(point, null, previewScaffoldParts.size);
        }
        return;
      }
      const next = findPart(point);
      if (next !== hoveredScaffoldPart) {
        hoveredScaffoldPart = next;
        draw();
      }
      updateCallout(point, hoveredScaffoldPart);
    });
    surface.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      surface.focus({ preventScroll: true });
      const point = surfacePoint(event);
      moveCursor(point);
      hoveredScaffoldPart = findPart(point);
      dragging = true; moved = false; startPoint = point; points = [{ x: point.x, y: point.y }];
      surface.setPointerCapture(event.pointerId);
      loop.classList.add('down');
      cursor.classList.remove('clicked'); void cursor.offsetWidth; cursor.classList.add('clicked');
      updateCallout(point, hoveredScaffoldPart);
      draw();
    });
    surface.addEventListener('pointerup', (event) => {
      if (!dragging) return;
      const point = surfacePoint(event);
      if (moved) {
        const last = points.at(-1);
        if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 1) points.push({ x: point.x, y: point.y });
        previewScaffoldParts.clear();
        for (const id of previewForPolygon(points)) previewScaffoldParts.add(id);
      }
      if (moved && points.length > 2) {
        const count = previewScaffoldParts.size;
        for (const id of previewScaffoldParts) selectedScaffoldParts.add(id);
        updateScaffoldSelectionStatus(`${count} osaa lisättiin silmukkavalintaan.`);
      } else if (hoveredScaffoldPart) {
        if (selectedScaffoldParts.has(hoveredScaffoldPart.id)) selectedScaffoldParts.delete(hoveredScaffoldPart.id);
        else selectedScaffoldParts.add(hoveredScaffoldPart.id);
        updateScaffoldSelectionStatus(selectedScaffoldParts.has(hoveredScaffoldPart.id) ? 'Osa valittu.' : 'Osavalinta poistettu.');
      }
      clearLasso();
      hoveredScaffoldPart = findPart(point);
      draw();
      updateScaffoldSelectionStatus();
      updateCallout(point, hoveredScaffoldPart);
    });
    surface.addEventListener('pointercancel', () => { clearLasso(); hoveredScaffoldPart = null; draw(); callout.classList.remove('visible'); });
    surface.addEventListener('pointerleave', () => {
      if (dragging) return;
      surface.classList.remove('cursor-active');
      loop.classList.remove('hovering');
      hoveredScaffoldPart = null;
      draw();
      callout.classList.remove('visible');
    });
    surface.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); clearSelection(); }
    });
    clearButton?.addEventListener('click', clearSelection);
    updateScaffoldSelectionStatus();
  }

  async function searchBuildingDrawings() {
    const status=$('#buildingCrawlerStatus'), target=$('#buildingCrawlerResults'), card=window._telinehallintaBuildingCard;
    if(!status||!card)return;
    status.textContent='Crawler hakee määritetyistä julkisista rakennus- ja verkkolähteistä…';
    target.innerHTML='';
    try {
      const response=await fetch('/api/building-drawings/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address:card.address,parcel:card.parcel,coordinates:card.coordinates})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Piirustushaku epäonnistui.');
      const sourceRows=(data.sources||[]).map((source)=>`<div class="building-crawler-source"><span class="rain-dot ${source.status==='ok'?(source.count?'found':'empty'):'error'}"></span><strong>${escapeHtml(source.label)}</strong><small>${source.status==='ok'?`${source.count} osumaa`:escapeHtml(source.note||'Ei käytettävissä')}</small></div>`).join('');
      const items=(data.items||[]).map((item)=>{const href=/^https:\/\//i.test(item.url||'')?item.url:'';return `<article class="building-drawing-result"><span class="tag">${escapeHtml(item.category||'Lähde')}</span><strong>${escapeHtml(item.title||'Nimetön tietue')}</strong><small>${escapeHtml(item.source||'')} · ${escapeHtml(item.id||'Ei arkistotunnusta')}</small>${(item.details||[]).slice(0,3).map((detail)=>`<small>${escapeHtml(detail.name)}: ${escapeHtml(detail.value)}</small>`).join('')}${href?`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Avaa alkuperäinen tietue ↗</a>`:''}</article>`}).join('');
      target.innerHTML=`<div class="building-crawler-summary">${sourceRows}</div>${items?`<div class="building-drawing-result-list">${items}</div>`:'<p class="muted small">Crawlerista ei saatu piirustusosumia. Tarkista lähteet tai käytä yllä olevia arkistolinkkejä.</p>'}<small class="muted">Haettu ${escapeHtml(new Date(data.searchedAt).toLocaleString('fi-FI'))}. ${escapeHtml(data.note||'')}</small>`;
      status.textContent=`Haku valmis: ${(data.items||[]).length} piirustus- tai arkistoehdokasta.`;
      window._telinehallintaDrawingSearch=data;
    } catch(error) {status.textContent=error.message||'Crawleriin ei saatu yhteyttä.';}
  }

  function downloadBuildingObj() {
    const card=window._telinehallintaBuildingCard,ring=selectedBuildingFootprint();
    if(!card||!ring||ring.length<3){toast('Rakennuksen jalanjälkeä ei ole mallinnettavaksi.');return;}
    const p=card.properties||{},floors=Math.max(1,Math.min(30,Number(p.i_kerrlkm)||3));
    const height=Math.max(2,Number($('#scaffoldLayoutForm [name=buildingHeight]')?.value)||floors*3.1);
    const minX=Math.min(...ring.map(x=>x[0])),minY=Math.min(...ring.map(x=>x[1])),vertices=[],faces=[];
    let obj='# Telinekonttori · LOD3-esiluonnos, metreissä\n# Johdettu rakennusrekisterin jalanjäljestä ja kerrosluvusta; ei piirustustulkinta tai varmennettu LOD3.\nmtllib rakennus-lod3.mtl\n';
    const vertex=(x,y,z)=>{vertices.push([x,y,z]);return vertices.length;};
    const face=(material,points)=>{obj+=`usemtl ${material}\n`;const ids=points.map((point)=>vertex(...point));obj+=`f ${ids.join(' ')}\n`;};
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length],ax=a[0]-minX,az=a[1]-minY,bx=b[0]-minX,bz=b[1]-minY;
      face('wall',[[ax,0,az],[bx,0,bz],[bx,height,bz],[ax,height,az]]);
      const length=Math.hypot(bx-ax,bz-az),count=Math.max(1,Math.floor(length/2.8));
      for(let level=0;level<Math.max(1,floors-1);level++)for(let n=0;n<count;n++){
        const t=(n+1)/(count+1),cx=ax+(bx-ax)*t,cz=az+(bz-az)*t,z0=Math.min(height-.5,(level+.42)*height/floors),z1=Math.min(height-.15,z0+Math.min(1.45,height/floors*.48));
        if(z1<=z0)continue;
        const half=Math.min(.55,length/(count+1)*.24),ux=(bx-ax)/Math.max(length,.001),uz=(bz-az)/Math.max(length,.001),offset=.035;
        face('glass',[[cx-ux*half, z0,cz-uz*half],[cx+ux*half,z0,cz+uz*half],[cx+ux*half,z1,cz+uz*half],[cx-ux*half,z1,cz-uz*half]].map(([x,y,z])=>[x+(-uz)*offset,y,z+ux*offset]));
      }
    }
    for(let i=1;i<ring.length-1;i++)face('roof',[[ring[0][0]-minX,height,ring[0][1]-minY],[ring[i][0]-minX,height,ring[i][1]-minY],[ring[i+1][0]-minX,height,ring[i+1][1]-minY]]);
    const mtl='newmtl wall\nKd 0.78 0.73 0.65\n\nnewmtl glass\nKd 0.16 0.42 0.59\n\nnewmtl roof\nKd 0.35 0.37 0.39\n';
    const name=(card.address||'rakennus').toLocaleLowerCase('fi').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'rakennus';
    downloadText(`${name}-lod3-luonnos.obj`,obj,'text/plain');downloadText('rakennus-lod3.mtl',mtl,'text/plain');
    toast(`OBJ-luonnos luotu · ${ring.length} seinäpintaa · ${floors} kerrosta · ${height.toFixed(1)} m.`);
  }

  function downloadBuildingRainbowSheet() {
    const card=window._telinehallintaBuildingCard;if(!card)return;
    const p=card.properties||{},sources=window._telinehallintaDrawingSearch?.sources||[];
    const rows=[['Rakennuksen osoite',card.address,'#31a56b'],['Kiinteistötunnus',card.parcel,'#31a56b'],['Rakennusjalanjälki','Helsingin WFS · EPSG:4326','#31a56b'],['Kerroksia',p.i_kerrlkm||'Ei rekisteritietoa',p.i_kerrlkm?'#31a56b':'#e0a126'],['Piirustuslöydöt',window._telinehallintaDrawingSearch?`${window._telinehallintaDrawingSearch.items.length} ehdokasta`:'Haku ei vielä ajettu',window._telinehallintaDrawingSearch?.items.length?'#31a56b':'#e0a126'],['LOD3-geometria','OBJ-esiluonnos · aukot johdettu kerrosarviosta','#d88a28'],...sources.map((source)=>[source.label,source.status==='ok'?`${source.count} osumaa`:source.note||'Ei käytettävissä',source.status==='ok'?(source.count?'#31a56b':'#e0a126'):'#d65353'])];
    const esc=(s)=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="${260+rows.length*52}" viewBox="0 0 1100 ${260+rows.length*52}"><rect width="100%" height="100%" fill="#f5f7f4"/><rect width="1100" height="178" fill="#123447"/><text x="54" y="57" fill="#8fe0c4" font-family="Arial" font-size="15" font-weight="bold" letter-spacing="3">TELINEHALLINTA · RAINBOW SHEET</text><text x="54" y="105" fill="white" font-family="Arial" font-size="30" font-weight="bold">${esc(card.address)}</text><text x="54" y="143" fill="#c9d8dc" font-family="Arial" font-size="16">Kiinteistötunnus ${esc(card.parcel)} · ${new Date().toLocaleString('fi-FI')}</text><text x="54" y="220" fill="#183343" font-family="Arial" font-size="20" font-weight="bold">Lähteiden ja mallin kattavuus</text>${rows.map(([label,value,color],i)=>{const y=252+i*52;return `<rect x="54" y="${y}" width="12" height="30" rx="6" fill="${color}"/><text x="82" y="${y+13}" fill="#183343" font-family="Arial" font-size="15" font-weight="bold">${esc(label)}</text><text x="400" y="${y+13}" fill="#40535a" font-family="Arial" font-size="14">${esc(value)}</text><line x1="82" y1="${y+31}" x2="1046" y2="${y+31}" stroke="#dce4df"/></g>`}).join('')}<text x="54" y="${225+rows.length*52}" fill="#8b5424" font-family="Arial" font-size="13">Värikoodi: vihreä = lähdetieto / osuma · keltainen = arvio tai tarkistettava · punainen = lähde ei käytettävissä.</text><text x="54" y="${248+rows.length*52}" fill="#596d73" font-family="Arial" font-size="12">LOD3-esiluonnos ei ole piirustuksista varmennettu BIM-malli. Tarkista aukot, kattomuoto ja mitat alkuperäisistä piirustuksista.</text></svg>`;
    downloadText('rainbow-sheet-rakennuskortti.svg',svg,'image/svg+xml');
  }

  function downloadText(name, content, type) {const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}

  function renderScaffoldBuildingCard(card,{title,properties={},facts=[],source,crs='EPSG:3879',retrievedAt=''}) {
    if(!card)return;
    const query=encodeURIComponent(`${title} julkisivupiirustus rakennuspiirustus`),addressQuery=encodeURIComponent(title);
    const details=facts.map(([key,value])=>`<span><b>${escapeHtml(key)}:</b> ${escapeHtml(value)}</span>`).join('');
    card.innerHTML=`<strong>${escapeHtml(title)}</strong><div class="building-card-facts">${details}<span><b>Lähde:</b> ${escapeHtml(source||'Ei ilmoitettu')}</span><span><b>Koordinaatisto:</b> ${escapeHtml(crs)}</span><span><b>Haettu:</b> ${escapeHtml(retrievedAt||'Ei ilmoitettu')}</span></div><div class="building-drawing-searches"><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?q=${query}">Piirustushaku verkosta ↗</a><a target="_blank" rel="noopener noreferrer" href="https://yksa.disec.fi/Yksa4/public/HELKA/">Sinetti-arkistohaku ↗</a><a target="_blank" rel="noopener noreferrer" href="https://finna.fi/Search/Results?lookfor=${addressQuery}&type=AllFields">Finna-haku ↗</a><a target="_blank" rel="noopener noreferrer" href="https://www.hel.fi/fi/kaupunkiymparisto-ja-liikenne/tontit-ja-rakentamisen-luvat/kaavat-kartat-ja-avustukset-rakentamiseen/kaavat-ja-kartat-rakentajalle">Rakennuspiirustusten tilaus ↗</a></div><div class="building-model-actions"><button type="button" class="button button-sm button-primary" data-action="search-building-drawings">Hae crawlerilla kaikista lähteistä</button><button type="button" class="button button-sm" data-action="download-building-obj">Luo rakennuksen 3D-massaluonnos · OBJ</button><button type="button" class="button button-sm" data-action="download-building-rainbow">Vie Rainbow sheet · SVG</button><button type="button" class="button button-sm" data-action="apply-info-building">Käytä samaa rakennuskorttia telineessä</button><label class="building-model-upload">Valmis rakennusmalli · OBJ<input type="file" accept=".obj,text/plain" data-building-obj-upload></label></div><div class="building-source-status" id="buildingCrawlerStatus" role="status"></div><div class="building-crawler-results" id="buildingCrawlerResults"></div><small class="muted">Yksi rakennuskortti yhdistää karttatunnisteen, lähdepolygonin ja siitä johdetun 3D-massan. Uschakoffin talo, Aleksanterin teatteri ja muut kohteet käyttävät samaa korttia. Lähdekorkeutta ei korvata arvauksella; arvio ja käyttäjän syöttämä korkeus merkitään erikseen.</small>`;
    const normalized=(value)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fi').trim();
    const addressText=normalized([title,properties.address,properties.name,properties.nimi,properties.katunimi_suomi,properties.katunimi,properties.osoite].filter(Boolean).join(' '));
    const references=BUILDING_ARCHIVE_REFERENCES.filter((reference)=>{
      const parcel=String(properties.c_kiinteistotunnus||properties.kiinteistotunnus||'').replace(/[-:\s]/g,'');
      const addressMatch=/\bmannerheimintie\s+5(?:\s|,|$)/.test(addressText);
      const fieldsMatch=normalized(properties.katunimi_suomi||properties.street_name)==='mannerheimintie'&&String(properties.osoitenumero||properties.house_number||'').trim()==='5';
      return addressMatch||fieldsMatch||String(properties.ratu||properties.RATU||'')===reference.ratu||String(properties.vtj_prt||properties.c_vtj_prt||'')===reference.vtjPrt||parcel===reference.parcel.replace(/-/g,'');
    });
    if(references.length){
      const archiveMarkup=references.map((reference)=>`<section class="building-archive-reference"><div class="building-archive-reference-head"><div><span class="building-archive-kicker">ARKISTOVIITE · YKSA</span><h3>Stockmann / ABC City · arkistoviite (${escapeHtml(reference.address)})</h3></div><span class="building-archive-status">Ei käytetty rakennusmallissa</span></div><p>${escapeHtml(reference.description)}</p><p><b>Julkisivumerkintä:</b> ${escapeHtml(reference.facade)}</p><p><b>Rakennuskortin tunnisteet:</b> RATU ${escapeHtml(reference.ratu)} · VTJ-PRT ${escapeHtml(reference.vtjPrt)} · kiinteistötunnus ${escapeHtml(reference.parcel)}</p><div class="building-archive-actions"><a class="button button-sm" target="_blank" rel="noopener noreferrer" href="${escapeHtml(reference.archiveUrl)}">Avaa alkuperäinen arkistokortti ↗</a><a class="button button-sm" href="${escapeHtml(reference.scanUrl)}" target="_blank" rel="noopener noreferrer">Avaa aiempi skannaus ↗</a></div><details class="building-archive-preview"><summary>Esikatsele liitetty arkistopiirustus</summary><a href="${escapeHtml(reference.scanUrl)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(reference.scanUrl)}" alt="Arkistopiirustus: ${escapeHtml(reference.title)}" loading="lazy"></a></details><small class="building-archive-note">${escapeHtml(reference.sourceLabel)}. ${escapeHtml(reference.verification)} Skannaus on lähdekuva, eikä sitä ole kalibroitu mittakaavaan.</small>
      <section class="building-model-study"><div class="building-model-study-head"><div><span class="building-archive-kicker">MUOKATTAVA 3D-LUONNOS</span><h3>Uusi ylioppilastalo · Mannerheimintie 5</h3></div><span class="building-archive-status">8 kerrosta · korkeus arvio</span></div><div class="building-model-viewer" data-building-model-viewer data-model-url="${escapeHtml(reference.modelUrl)}" aria-label="Pyöritettävä kolmiulotteinen rakennusluonnos"><div class="building-model-loading">Ladataan 3D-mallia…</div></div><div class="building-model-downloads"><a class="button button-sm button-primary" href="${escapeHtml(reference.modelUrl)}" download>Lataa GLB-malli</a><a class="button button-sm" href="${escapeHtml(reference.modelObjUrl)}" download>Lataa OBJ</a><a class="button button-sm" href="${escapeHtml(reference.modelBlendUrl)}" download>Avaa Blender-malli</a><a class="button button-sm" href="${escapeHtml(reference.modelMetadataUrl)}" target="_blank" rel="noopener noreferrer">Lähde- ja rajaustiedot</a></div><details class="building-model-source-preview"><summary>Mallin kuva-, sijoitus- ja kattolähteet</summary><div class="building-model-source-grid">${reference.historicSources.map((item)=>{const imageUrl=item.file?`/assets/building-models/mannerheimintie-5/archive-previews/${item.file}`:'';const image=item.file?`<a href="${imageUrl}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" alt="${escapeHtml(item.title)}" loading="lazy"></a>`:`<div class="building-model-source-text">${escapeHtml(item.record||'Lähde')}</div>`;return `<figure>${image}<figcaption><b>${escapeHtml(item.title)}</b><br>${item.url?`<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Avaa lähde ↗</a>`:escapeHtml(item.record||'')}</figcaption></figure>`;}).join('')}</div></details><small class="building-archive-note">WFS antaa pohjamuodon ja 8 kerrosta; arkkitehtuurilähteet antavat kahden siiven sijoittelun ja aukionpuoleisen päädyn. Dormerikattojen paikat ja kaltevuudet on arvioitu Ylvan ulkokuvista. Kupolin mitat tulevat kaupunginmuseolta. Malli ei ole varmennettu as-built-, LOD3- tai rakennesuunnittelumalli.</small></section></section>`).join('');
      card.insertAdjacentHTML('beforeend',archiveMarkup);
      card.querySelectorAll('[data-building-model-viewer]').forEach((viewer)=>import('./building-model-preview.mjs').then(({mountBuildingModelPreview})=>mountBuildingModelPreview(viewer)).catch((error)=>{viewer.textContent=`3D-esikatselua ei voitu avata: ${error.message}`;}));
    }
    card.querySelector('[data-action="search-building-drawings"]')?.addEventListener('click',()=>void searchBuildingDrawings());
    card.querySelector('[data-action="download-building-obj"]')?.addEventListener('click',downloadBuildingObj);
    card.querySelector('[data-action="download-building-rainbow"]')?.addEventListener('click',downloadBuildingRainbowSheet);
    card.querySelector('[data-building-obj-upload]')?.addEventListener('change',(event)=>{const file=event.target.files?.[0];if(file)void importScaffoldBuildingObj(file);});
    card.querySelector('[data-action="apply-info-building"]')?.addEventListener('click',applySelectedScaffoldBuildingToForm);
  }
  function renderScaffoldGroundData(data=scaffoldGroundData) {
    const container=$('#scaffoldGroundSummary');if(!container)return;
    if(!data){container.innerHTML='<span class="muted small">Valitse rakennus, niin haen GTK:n karttaluokan.</span><span><b>Kantavuus:</b> ei arvioitavissa maaperäkartasta · pohjatutkimus tarvitaan.</span>';return;}
    const soil=(label,row)=>row?`<div><b>${label}:</b> ${escapeHtml(row.label)}${row.code?` · ${escapeHtml(row.code)}`:''}</div>`:`<div><b>${label}:</b> GTK ei ilmoita maalajia valitussa kohdassa.</div>`;
    container.innerHTML=`${soil('Pintamaalaji',data.surface)}${soil('Pohjamaa',data.subsoil)}<small>${escapeHtml(data.source||'GTK Maankamara')} · mittakaava ${escapeHtml(data.scale||'ei ilmoitettu')} · ${escapeHtml(data.retrievedAt||'ajankohta puuttuu')} · <a href="${escapeHtml(data.sourceUrl||'https://gtkdata.gtk.fi/arcgis/rest/services/Maankamara/Maapera/MapServer')}" target="_blank" rel="noopener noreferrer">lähde ↗</a></small><span><b>Kantavuus:</b> ${escapeHtml(data.strength?.note||'Ei arvioitavissa GTK:n maalajikartasta; tarvitaan kohdekohtainen pohjatutkimus.')}</span>`;
  }
  function renderScaffoldTerrainMap() {
    if(!scaffoldTerrainCellLayer)return;
    scaffoldTerrainCellLayer.clearLayers();
    const ring=selectedBuildingFootprint()||[],analysis=scaffoldTerrainAnalysis;
    if(ring.length>=3&&window.L){const latlngs=ring.map((point)=>TelineDomain.unprojectCoordinate(point,'EPSG:4326')).map(([lon,lat])=>[lat,lon]);L.polygon(latlngs,{color:'#243d49',weight:2,fill:false,interactive:false}).addTo(scaffoldTerrainCellLayer);}
    if(!analysis?.samples?.length||!window.L)return;
    for(const sample of analysis.samples){
      const [lon,lat]=TelineDomain.unprojectCoordinate([sample.x,sample.y],'EPSG:4326'),band=analysis.bands?.[sample.bandIndex];
      L.circleMarker([lat,lon],{radius:2.3,color:band?.color||'#4886bd',weight:.5,fillColor:band?.color||'#4886bd',fillOpacity:.85,interactive:false}).addTo(scaffoldTerrainCellLayer);
    }
  }
  function renderScaffoldTerrainSummary() {
    const summary=$('#scaffoldTerrainSummary'),profile=$('#scaffoldTerrainProfile'),status=$('#scaffoldTerrainImportStatus'),massLabel=$('#scaffoldTerrainMassLabel');
    const analysis=scaffoldTerrainAnalysis;
    if(!summary)return;
    if(!analysis){
      summary.innerHTML='<span class="muted small">Korkeuserot näkyvät, kun rakennus ja sitä ympäröivä ASCII Grid on valittu.</span>';
      if(profile)profile.innerHTML='';
      if(massLabel)massLabel.textContent='Maastopinta näkyy 3D-massassa, kun korkeusruudukko on tuotu. Vyöhykkeet: 0–2 m · 2–5 m · 5–10 m rakennuksen reunasta.';
      return;
    }
    const source=scaffoldTerrainFileMeta?.filename||analysis.filename||'Tallennetun projektin GTK/MML maastotieto';
    const bands=analysis.bands||[];
    summary.innerHTML=bands.map((band)=>{
      const color=band.color||['#e49a3a','#41a78b','#4886bd'][bands.indexOf(band)],mean=band.meanElevationM==null?'ei kattavaa solua':`${Number(band.meanElevationM).toFixed(2)} m`,delta=band.differenceFromReferenceM==null?'':` · ${Number(band.differenceFromReferenceM)>=0?'+':''}${Number(band.differenceFromReferenceM).toFixed(2)} m vyöhykkeen ${analysis.referenceBandId||'vertailu'} keskiarvosta`,range=band.elevationRangeM==null?'':`vaihtelu ${Number(band.elevationRangeM).toFixed(2)} m`;
      return `<article class="scaffold-terrain-band" style="--terrain-band-color:${color}"><strong>${escapeHtml(band.id==='0-2'?'0–2 m':band.id==='2-5'?'2–5 m':'5–10 m')} · ${mean}</strong><small>${Number(band.count)||0} ruutusolua${delta}</small><small>${range||'Korkeusarvoja ei saatu tältä vyöhykkeeltä'}</small></article>`;
    }).join('')+`<span class="muted small scaffold-terrain-source">${escapeHtml(source)} · ${Number(analysis.cellSizeM||0).toFixed(2)} m solukoko · ${Number(analysis.sampleCount||0)} käyttökelpoista solua · korkeusjärjestelmä tarkistettava lähdetiedostosta.</span>`;
    const valid=bands.filter((band)=>band.count&&Number.isFinite(band.meanElevationM));
    if(profile){
      if(!valid.length)profile.innerHTML='<span class="muted small">Tuotu ruudukko ei kata rakennuksen ulkopuolista 10 m vyöhykettä.</span>';
      else{
        const values=bands.flatMap((band)=>[band.minElevationM,band.maxElevationM,band.meanElevationM]).filter(Number.isFinite),minimum=Math.min(...values),maximum=Math.max(...values),span=Math.max(.15,maximum-minimum),y=(value)=>78-((value-minimum)/span)*49,xs=[18,146,322,642];
        const marks=bands.map((band,index)=>{
          const x0=xs[index],x1=xs[index+1],center=(x0+x1)/2,color=band.color||['#e49a3a','#41a78b','#4886bd'][index];
          if(!band.count)return `<rect x="${x0}" y="17" width="${x1-x0}" height="70" fill="${color}" fill-opacity=".07"/><text x="${center}" y="105" text-anchor="middle" font-size="10" fill="#5b6973">${index===0?'0–2 m':index===1?'2–5 m':'5–10 m'} · ei dataa</text>`;
          return `<rect x="${x0}" y="17" width="${x1-x0}" height="70" fill="${color}" fill-opacity=".08"/><line x1="${center}" y1="${y(band.minElevationM)}" x2="${center}" y2="${y(band.maxElevationM)}" stroke="${color}" stroke-width="3"/><line x1="${center-7}" y1="${y(band.minElevationM)}" x2="${center+7}" y2="${y(band.minElevationM)}" stroke="${color}"/><line x1="${center-7}" y1="${y(band.maxElevationM)}" x2="${center+7}" y2="${y(band.maxElevationM)}" stroke="${color}"/><circle cx="${center}" cy="${y(band.meanElevationM)}" r="4" fill="${color}" stroke="#fff" stroke-width="1.5"/><text x="${center}" y="${Math.max(13,y(band.meanElevationM)-8)}" text-anchor="middle" font-size="10" fill="#33434b">${Number(band.meanElevationM).toFixed(2)} m</text><text x="${center}" y="105" text-anchor="middle" font-size="10" fill="#5b6973">${index===0?'0–2 m':index===1?'2–5 m':'5–10 m'}</text>`;
        }).join('');
        profile.innerHTML=`<svg viewBox="0 0 660 116" role="img" aria-label="Korkeusvyöhykkeiden minimi, keskiarvo ja maksimi"><text x="10" y="12" font-size="9" fill="#5b6973">Maanpinnan korkeus · pystyasteikko ${minimum.toFixed(2)}–${maximum.toFixed(2)} m · piste = vyöhykkeen keskiarvo</text>${marks}<line x1="18" y1="88" x2="642" y2="88" stroke="#77868e"/><text x="18" y="114" font-size="9" fill="#5b6973">Rakennuksen ulkoreuna → etäisyys</text></svg>`;
      }
    }
    if(massLabel)massLabel.textContent=`Maasto 3D-massassa: ${analysis.samples?.length||0} näytesolua · ${Number(analysis.cellSizeM||0).toFixed(2)} m solukoko · suhteellinen korkeus vyöhykkeen ${analysis.referenceBandId||'vertailu'} keskiarvoon ${analysis.referenceElevationM==null?'—':Number(analysis.referenceElevationM).toFixed(2)+' m'}. Vyöhykkeet: 0–2, 2–5 ja 5–10 m.`;
  }
  function syncScaffoldTerrainAnalysis(force=false) {
    const footprint=selectedBuildingFootprint()||[],id=String(selectedScaffoldBuilding?.id||''),fileName=scaffoldTerrainFileMeta?.filename||'',crs=scaffoldTerrainFileMeta?.crs||$('#scaffoldTerrainCrs')?.value||'EPSG:3067',key=`${id}|${fileName}|${crs}|${footprint.map((point)=>point.map((n)=>Number(n).toFixed(2)).join(',')).join(';')}`;
    const groundButton=$('#scaffoldFetchGround');if(groundButton)groundButton.disabled=footprint.length<3;
    if(!force&&key===scaffoldTerrainAnalysisKey)return;
    scaffoldTerrainAnalysisKey=key;
    const attrs=selectedScaffoldBuilding?.object?.attributes||selectedScaffoldBuilding?.object?.properties||{};
    if(footprint.length>=3&&scaffoldTerrainGrid){
      try{
        const calculated=TelineDomain.analyzeTerrainGrid(scaffoldTerrainGrid,footprint,crs,window.proj4),meta=scaffoldTerrainFileMeta||{};
        scaffoldTerrainAnalysis={...calculated,filename:meta.filename||'',source:meta.source||'Käyttäjän tuoma ASCII Grid',sourceCrs:crs,verticalDatum:'Tarkista alkuperäislähteestä',computedAt:new Date().toISOString()};
        attrs.terrainModel={source:scaffoldTerrainAnalysis.source,filename:scaffoldTerrainAnalysis.filename,sourceCrs:crs,cellSizeM:calculated.cellSizeM,verticalDatum:scaffoldTerrainAnalysis.verticalDatum,computedAt:scaffoldTerrainAnalysis.computedAt,referenceElevationM:calculated.referenceElevationM,referenceBandId:calculated.referenceBandId,sampleCount:calculated.sampleCount,bands:calculated.bands,persistedSamples:calculated.persistedSamples};
      }catch(error){
        scaffoldTerrainAnalysis=null;
        const status=$('#scaffoldTerrainImportStatus');if(status)status.textContent=error.message||'Maastoruudukkoa ei voitu sovittaa rakennuspolygonin ympärille.';
      }
    }else if(footprint.length>=3&&attrs.terrainModel){
      const saved=attrs.terrainModel;
      scaffoldTerrainAnalysis={...saved,bands:Array.isArray(saved.bands)?saved.bands:[],sampleCount:Number(saved.sampleCount)||0,samples:(saved.persistedSamples||[]).map((row)=>({x:Number(row[0]),y:Number(row[1]),z:Number(row[2]),bandIndex:Number(row[3])||0})),source:saved.source||'Tallennettu korkeusruudukon analyysi'};
      if(!scaffoldTerrainFileMeta&&saved.filename)scaffoldTerrainFileMeta={filename:saved.filename,crs:saved.sourceCrs||'EPSG:3067',source:saved.source||'Tallennettu korkeusruudukko'};
    }else{
      scaffoldTerrainAnalysis=null;
    }
    const currentId=id||'';
    if(scaffoldGroundDataBuildingId!==currentId){scaffoldGroundData=attrs.groundData||null;scaffoldGroundDataBuildingId=currentId;}
    renderScaffoldTerrainMap();renderScaffoldTerrainSummary();renderScaffoldGroundData();
    const status=$('#scaffoldTerrainImportStatus');
    if(status&&!status.textContent.includes('virhe')&&!status.textContent.includes('ei voitu'))status.textContent=footprint.length<3?'Valitse rakennuspolygonin sisältävä kohde ennen maastoanalyysia.':scaffoldTerrainAnalysis?`Analyysi valmis · lähde ${escapeHtml(scaffoldTerrainAnalysis.filename||'projektitieto')} · laskeva korkeusvyöhyke mitattu polygonin reunasta.`:scaffoldTerrainGrid?`Ruudukko ${escapeHtml(fileName)} ladattu; vyöhykettä ei voitu laskea valitulle kohteelle.`:'Valitse rakennus ja sen ympäristön kattava korkeusruudukko.';
  }
  function applySelectedScaffoldBuildingToForm(){
    const ring=selectedBuildingFootprint()||[],form=$('#scaffoldLayoutForm'),status=$('#scaffoldInfoMapStatus');
    if(!selectedScaffoldBuilding||ring.length<3||!form){if(status)status.textContent='Valitun rakennuksen EPSG:3879-polygonista ei saatu mittauskelpoista pohjaa.';return;}
    const metrics=TelineDomain.polygonMetrics(ring),attrs=selectedScaffoldBuilding.object?.attributes||selectedScaffoldBuilding.object?.properties||{},title=attrs.name||attrs.nimi||attrs.address||attrs.gmlid||selectedScaffoldBuilding.id||'Valittu rakennus';
    selectedScaffoldFacade=metrics.longestSide?{label:'Julkisivu '+(metrics.longestSide.index+1),length:metrics.longestSide.lengthM,index:metrics.longestSide.index}:null;
    selectedScaffoldFacadeSource=selectedScaffoldFacade?'building-footprint':'';scaffoldBuildingGeometryApplied=Boolean(selectedScaffoldFacade);
    form.elements.namedItem('name').value=`${title} · teline`;form.elements.namedItem('length').value=(metrics.longestSide?.lengthM||0).toFixed(2);form.elements.namedItem('buildingDepth').value=(metrics.secondarySide?.lengthM||0).toFixed(2);
    const attributeHeight=Number(attrs.measuredHeight||attrs.measured_height||attrs.height||attrs.rakennuksen_korkeus||0),verticalExtent=TelineDomain.cityJsonVerticalExtent(selectedScaffoldBuilding.object,selectedScaffoldBuilding.payload?.data),geometryHeight=Number(verticalExtent?.heightM)||0,floors=Number(attrs.i_kerrlkm||attrs.kerrosluku||attrs.storeysAboveGround||0),sourceHeight=attributeHeight||geometryHeight,estimatedHeight=sourceHeight>0?sourceHeight:(floors>0?floors*3.1:0);
    form.elements.namedItem('buildingHeight').value=estimatedHeight.toFixed(2);form.elements.namedItem('buildingHeightStatus').value=sourceHeight>0?'source':estimatedHeight?'estimate':'user';
    form.elements.namedItem('buildingHeightSource').value=attributeHeight>0?'Valitun rakennusmallin korkeusominaisuus; alkuperäinen määritelmä tarkistettava':geometryHeight>0?`3D-geometrian Z-laajuus: ${verticalExtent.minZ.toFixed(2)}–${verticalExtent.maxZ.toFixed(2)} m · ${geometryHeight.toFixed(2)} m (malligeometria, ei työmaamittaus)`:estimatedHeight?`${selectedScaffoldBuilding.payload?.source||'Rakennusrekisteri'} · ${floors} kerrosta × 3,1 m/kerros (arvio; tarkista piirustuksesta tai kohteessa)`:'Lähteestä ei löytynyt korkeutta; syötä käyttäjän arvo ja kirjaa sen lähde';
    $('#scaffoldSelectedBuilding').innerHTML=`<strong>${escapeHtml(title)}</strong> · ${escapeHtml(selectedScaffoldBuilding.payload?.source||'Rakennuskortin lähde')} · ${escapeHtml(selectedScaffoldBuilding.payload?.crs||'EPSG:3879')} · julkisivu ${metrics.longestSide?.lengthM.toFixed(2)||'—'} m · korkeus ${attributeHeight>0?'ominaisuudesta':geometryHeight>0?'3D-geometrian Z-laajuudesta':estimatedHeight?'arvioitu':'puuttuu'}.`;
    syncScaffoldTerrainAnalysis();form.dispatchEvent(new Event('input',{bubbles:true}));if(status)status.textContent='Sama karttatiedosta muodostettu rakennuskortti ja polygonin mitat liitettiin telineen yhteiseen 3D-malliin.';
  }

  function initBuildingCardMap() {
    const element = $('#scaffoldBuildingMap');
    if (!element || !window.L || element.dataset.mapReady) return;
    element.dataset.mapReady = 'true';
    const map = L.map(element, { scrollWheelZoom: true }).setView([60.1699, 24.9384], 16);
    scaffoldBuildingMap=map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Helsingin kaupungin rakennusdata'
    }).addTo(map);
    const picked = L.layerGroup().addTo(map);
    scaffoldTerrainCellLayer=L.layerGroup().addTo(map);
    scaffoldTerrainAnalysisKey='';
    renderScaffoldTerrainMap();
    const manualDrawing = L.layerGroup().addTo(map);
    let manualDrawingActive=false,manualFootprintPoints=[];
    const drawManualFootprintPreview=()=>{
      manualDrawing.clearLayers();
      if(manualFootprintPoints.length>1)L.polyline(manualFootprintPoints,{color:'#e28b2f',weight:3,dashArray:'6 5'}).addTo(manualDrawing);
      if(manualFootprintPoints.length>2)L.polygon(manualFootprintPoints,{color:'#e28b2f',weight:2,fillColor:'#f2b85b',fillOpacity:.18,dashArray:'6 4'}).addTo(manualDrawing);
      for(const point of manualFootprintPoints)L.circleMarker(point,{radius:5,color:'#fff',weight:2,fillColor:'#cf692d',fillOpacity:1}).addTo(manualDrawing);
      const undo=$('#scaffoldFootprintUndo'),finish=$('#scaffoldFootprintFinish');if(undo)undo.disabled=!manualFootprintPoints.length;if(finish)finish.disabled=manualFootprintPoints.length<3;
      const status=$('#scaffoldFootprintStatus');if(status)status.textContent=manualDrawingActive?`${manualFootprintPoints.length} pistettä · klikkaa rakennuksen kulmat myötäpäivään tai vastapäivään.`:'Valitse kartan rakennus tai piirrä puuttuva pohja.';
    };
    const stopManualFootprint=({discard=false}={})=>{
      manualDrawingActive=false;map.doubleClickZoom.enable();element.classList.remove('scaffold-map-drawing');
      if(discard)manualFootprintPoints=[];drawManualFootprintPreview();
      for(const id of ['scaffoldFootprintDraw','scaffoldFootprintUndo','scaffoldFootprintFinish','scaffoldFootprintCancel']){const button=$('#'+id);if(button)button.disabled=id==='scaffoldFootprintDraw'?false:true;}
    };
    const drawButton=$('#scaffoldFootprintDraw'),undoButton=$('#scaffoldFootprintUndo'),finishButton=$('#scaffoldFootprintFinish'),cancelButton=$('#scaffoldFootprintCancel');
    drawButton?.addEventListener('click',()=>{manualDrawingActive=true;manualFootprintPoints=[];manualDrawing.clearLayers();map.doubleClickZoom.disable();element.classList.add('scaffold-map-drawing');if(drawButton)drawButton.disabled=true;if(undoButton)undoButton.disabled=true;if(finishButton)finishButton.disabled=true;if(cancelButton)cancelButton.disabled=false;const status=$('#scaffoldFootprintStatus');if(status)status.textContent='Piirrä polygonin kulmapisteet kartalle ja valitse Valmis.';map.closePopup();});
    undoButton?.addEventListener('click',()=>{manualFootprintPoints.pop();drawManualFootprintPreview();});
    cancelButton?.addEventListener('click',()=>stopManualFootprint({discard:true}));
    finishButton?.addEventListener('click',()=>{
      if(manualFootprintPoints.length<3)return;
      const retrievedAt=new Date().toISOString(),coords=manualFootprintPoints.map((latlng)=>[latlng.lng,latlng.lat]),rawName=$('#scaffoldManualFootprintName')?.value?.trim(),name=rawName||'Kartalta piirretty rakennus';
      const completedPoints=[...manualFootprintPoints];picked.clearLayers();manualDrawing.clearLayers();manualFootprintPoints=[];L.polygon(completedPoints,{color:'#0b8069',weight:3,fillColor:'#30a889',fillOpacity:.2}).addTo(picked);
      selectedScaffoldBuilding={id:'manual-footprint-'+Date.now(),object:{attributes:{name,address:rawName||'',manualFootprint:true},geometry:{type:'Polygon',coordinates:[coords]}},payload:{source:'Käyttäjän kartalle piirtämä rakennuspolygon',format:'GeoJSON',crs:'EPSG:4326',sourceCrs:'EPSG:4326',retrievedAt,data:{}}};
      window._telinehallintaBuildingCard={address:name,parcel:'',properties:selectedScaffoldBuilding.object.attributes,source:selectedScaffoldBuilding.payload.source};
      const facts=[['Geometrian tila','Käyttäjän piirtämä'],['Pisteitä',String(coords.length)],['Tietolähde','Ei kaupungin rekisteripolygon; käyttäjän karttaluonnos']];
      renderScaffoldBuildingCard($('#scaffoldInfoBuildingCard'),{title:name,properties:selectedScaffoldBuilding.object.attributes,facts,source:selectedScaffoldBuilding.payload.source,crs:'WGS84 → EPSG:3879',retrievedAt});
      stopManualFootprint();applySelectedScaffoldBuildingToForm();
      const status=$('#scaffoldFootprintStatus');if(status)status.textContent='Käsin piirretty pohja on valittu. Tarkista pisteet, mittakaava ja kohdekorkeus.';
    });
    const wfs = 'https://kartta.hel.fi/ws/geoserver/avoindata/wfs';
    const status = $('#scaffoldInfoMapStatus');
    const card = $('#scaffoldInfoBuildingCard');
    const query = async (typeName, params) => {
      const url = new URL(wfs);
      Object.entries({service:'WFS',version:'2.0.0',request:'GetFeature',typeNames:`avoindata:${typeName}`,outputFormat:'application/json',srsName:'EPSG:4326',...params}).forEach(([key,value])=>url.searchParams.set(key,value));
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Helsingin WFS vastasi HTTP ${response.status}`);
      return response.json();
    };
    const pointInRing = (point, ring) => {
      let inside = false;
      for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
        const [xi,yi]=ring[i], [xj,yj]=ring[j];
        if(((yi>point[1])!==(yj>point[1])) && point[0]<(xj-xi)*(point[1]-yi)/(yj-yi||1e-20)+xi) inside=!inside;
      }
      return inside;
    };
    const includesPoint = (feature, point) => {
      const g=feature?.geometry, c=g?.coordinates;
      if(g?.type==='Polygon') return (c||[]).some(ring=>pointInRing(point,ring));
      if(g?.type==='MultiPolygon') return (c||[]).some(poly=>(poly||[]).some(ring=>pointInRing(point,ring)));
      return false;
    };
    const centerOf = (feature) => {
      const bounds=L.geoJSON(feature).getBounds();
      return bounds.isValid()?bounds.getCenter():null;
    };
    const getAddress = (p) => [p.katunimi_suomi, p.osoitenumero, p.postinumero, 'Helsinki'].filter(Boolean).join(' ');
    const showCard = async (feature, point) => {
      const p=feature.properties||{};
      const retrievedAt=new Date().toISOString();
      const address=p.name||p.nimi||getAddress(p)||'Helsinki · valittu rakennus';
      picked.clearLayers();
      L.geoJSON(feature,{style:{color:'#0b8069',weight:3,fillColor:'#30a889',fillOpacity:.25}}).addTo(picked);
      L.circleMarker([point[1],point[0]],{radius:6,color:'#fff',weight:2,fillColor:'#087c65',fillOpacity:1}).addTo(picked);
      const parcelRaw=p.c_kiinteistotunnus||p.kiinteistotunnus||'';
      const parcel=parcelRaw.split(/[-:]/).map(part=>String(Number(part))).join('-')||'Ei rekisteritunnusta';
      const facts=[['Kiinteistötunnus',parcel],['Rakennus',p.c_rakennusluokka||p.tyyppi||'—'],['Käyttötarkoitus',p.c_kayttark||'—'],['Kerroksia',p.i_kerrlkm||'—'],['Kerrosala',p.i_kerrosala?`${Math.round(Number(p.i_kerrosala)).toLocaleString('fi-FI')} m²`:'—'],['Valmistunut',p.c_valmpvm?String(p.c_valmpvm).slice(0,4):'—'],['VTJ-PRT',p.vtj_prt||'—']];
      const q=encodeURIComponent(`${address} julkisivupiirustus rakennuspiirustus`);
      const archiveQ=encodeURIComponent(`${address} kiinteistötunnus ${parcel}`);
      const st=encodeURIComponent(address);
      renderScaffoldBuildingCard(card,{title:address,properties:p,facts,source:'Helsingin kaupungin rakennusrekisteri WFS',crs:'EPSG:4326 → EPSG:3879',retrievedAt});
      status.textContent='Rakennuskortti päivitetty karttavalinnasta.';
      const sourceRing=feature.geometry?.type==='Polygon'?feature.geometry.coordinates?.[0]:feature.geometry?.type==='MultiPolygon'?feature.geometry.coordinates?.[0]?.[0]:null;
      const projectedRing=Array.isArray(sourceRing)?TelineDomain.projectRing(sourceRing,'EPSG:4326'):[];
      const modelFeature={attributes:{...p,name:address,address},geometry:{type:'Polygon',coordinates:[projectedRing]}};
      selectedScaffoldBuilding={id:p.vtj_prt||String(p.id),object:modelFeature,payload:{source:'Helsingin kaupungin rakennusrekisteri WFS',format:'GeoJSON',crs:'EPSG:3879',sourceCrs:'EPSG:4326',retrievedAt,data:{}}};
      selectedScaffoldFacade=null;
      selectedScaffoldRoofFacades=[];facadeScaffoldPlans=[];scaffoldCornerReviews=[];scaffoldDrawingReviews=[];selectedScaffoldCornerKey='';scaffoldStairTowers=[];stairTowerPlacementMode=false;stairTowerPlacementRemaining=0;
      scaffoldBuildingGeometryApplied=false;
      window._telinehallintaSelectedAddress={address,parcel,buildingId:p.vtj_prt||p.id,geometry:feature.geometry,properties:p,coordinates:point};
      window._telinehallintaBuildingCard={address,parcel,properties:p,coordinates:point,source:'Helsingin kaupungin rakennusrekisteri WFS'};
      syncScaffoldTerrainAnalysis();

    };
    const selectAt = async (latlng) => {
      const lon=latlng.lng, lat=latlng.lat, d=.00013;
      status.textContent='Haetaan valitun rakennuksen rekisteritietoja…';
      try {
        const bbox=`${lon-d},${lat-d},${lon+d},${lat+d},EPSG:4326`;
        const data=await query('Rakennukset_alue_rekisteritiedot',{bbox,count:'25'});
        const features=data.features||[];
        const feature=features.find(item=>includesPoint(item,[lon,lat]))||features.sort((a,b)=>{
          const ca=centerOf(a), cb=centerOf(b); return (ca?.distanceTo([lat,lon])??1e9)-(cb?.distanceTo([lat,lon])??1e9);
        })[0];
        if(!feature) throw new Error('Tästä kohdasta ei löytynyt rakennuspolygonin rekisteritietoja. Klikkaa rakennuksen keskiosaa.');
        await showCard(feature,[lon,lat]);
      } catch(error) { status.textContent=error.message||'Rakennuksen haku epäonnistui.'; }
    };
    map.on('click',event=>{if(manualDrawingActive){manualFootprintPoints.push(event.latlng);drawManualFootprintPreview();return;}selectAt(event.latlng);});
    window._telinehallintaSelectBuildingAt=selectAt;
    const form=$('#scaffoldAddressSearch');
    form?.addEventListener('submit',async(event)=>{
      event.preventDefault();
      const raw=$('#scaffoldAddressInput').value.trim();
      const match=raw.match(/^(.+?)\s+(\d+[a-zA-Z]?(?:[-–]\d+[a-zA-Z]?)?)\s*(?:,.*)?$/);
      if(!match){status.textContent='Anna katu ja talonnumero, esimerkiksi Bulevardi 27.';return;}
      const street=match[1].trim().replaceAll("'","''"), number=match[2].toLowerCase();
      status.textContent='Etsitään osoitetta Helsingin osoiterekisteristä…';
      try {
        const data=await query('Helsinki_osoitteet_rakennukset',{CQL_FILTER:`katunimi_suomi ILIKE '%${street}%'`,count:'250'});
        const rows=data.features||[];
        const valid=rows.filter(f=>{
          const value=String(f.properties?.osoitenumero||'').toLowerCase();
          if(value===number) return true;
          const range=value.match(/^(\d+)[a-z]?(?:[-–](\d+)[a-z]?)?$/), wanted=number.match(/^(\d+)/);
          return Boolean(range&&wanted&&Number(wanted[1])>=Number(range[1])&&Number(wanted[1])<=Number(range[2]||range[1]));
        });
        if(!valid.length) throw new Error('Osoitetta ei löytynyt. Tarkista kadunnimi ja talonnumero.');
        const addressFeature=valid[0], geom=addressFeature.geometry;
        let point=geom?.type==='Point'?geom.coordinates:null;
        if(!point){const b=L.geoJSON(addressFeature).getBounds().getCenter();point=[b.lng,b.lat];}
        map.setView([point[1],point[0]],19);
        await selectAt({lng:point[0],lat:point[1]});
      } catch(error) { status.textContent=error.message||'Osoitehaku epäonnistui.'; }
    });
    setTimeout(()=>map.invalidateSize(),100);
  }

  async function scaffoldApi(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { Accept:'application/json', ...(options.body?{'Content-Type':'application/json'}:{}), ...(options.headers||{}) } });
    const data=response.status===204?null:await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data?.error||('Tallennus epäonnistui ('+response.status+').'));
    return data;
  }
  async function loadScaffoldDeliveries() {
    if (scaffoldDeliveriesLoaded || scaffoldDeliveriesLoading) return;
    scaffoldDeliveriesLoading = true;
    try {
      const data = await scaffoldApi('/api/scaffold/deliveries');
      scaffoldDeliveries = data.deliveries || [];
      scaffoldDeliveriesLoaded = true;
    } catch (error) { toast(error.message || 'LMS-toimituksia ei voitu ladata.'); scaffoldDeliveriesLoaded = true; }
    finally { scaffoldDeliveriesLoading = false; if (currentPage === 'logistics' || currentPage === 'lms') render(); }
  }
  async function loadScaffoldProjectRecords() {
    if(scaffoldProjectsLoaded||scaffoldProjectsLoading)return;
    scaffoldProjectsLoading=true;
    try{const data=await scaffoldApi('/api/scaffold/projects');scaffoldProjectRecords=data.projects||[];scaffoldProjectsLoaded=true;if(state.bomProjectId)void loadBomLinkedProject(state.bomProjectId);if(currentPage==='scaffold'||currentPage==='bom')render();}
    catch(error){scaffoldProjectsLoaded=true;toast(error.message);}
    finally{scaffoldProjectsLoading=false;}
  }
  async function loadBomLinkedProject(id) {
    const projectId=String(id||'');
    if(!projectId){bomLinkedProject=null;bomLinkedProjectError='';render();return;}
    bomLinkedProjectLoading=true;bomLinkedProjectError='';
    try{const project=await scaffoldApi(`/api/scaffold/projects/${encodeURIComponent(projectId)}`);if(state.bomProjectId===projectId){bomLinkedProject=project;scaffoldProjectRecords=[{id:project.id,name:project.name,revision:project.revision,buildingName:project.building.name||project.building.address||'Käsin annettu kohde'},...scaffoldProjectRecords.filter((row)=>row.id!==project.id)];}}
    catch(error){if(state.bomProjectId===projectId){bomLinkedProject=null;bomLinkedProjectError=error.message||'Projektin BOMia ei saatu ladattua.';}}
    finally{bomLinkedProjectLoading=false;if(currentPage==='bom')render();}
  }
  async function openScaffoldProject(id) {
    if(scaffoldDeepLinkOpening)return;
    scaffoldDeepLinkOpening=true;
    try {
      const project=await scaffoldApi('/api/scaffold/projects/'+encodeURIComponent(id));
      activeScaffoldProject=project;applyScaffoldProject(project);scaffoldRecommendation=null;
      const url=new URL(window.location.href);url.searchParams.delete('projectId');window.history.replaceState({},'',url);
      render();
    } finally { scaffoldDeepLinkOpening=false; }
  }
  function openScaffoldProjectFromUrl() {
    const projectId=new URLSearchParams(window.location.search).get('projectId');
    if(!projectId||scaffoldDeepLinkOpening||activeScaffoldProject?.id===projectId)return;
    void openScaffoldProject(projectId).catch((error)=>toast(error.message||'Tallennettua telineprojektia ei voitu avata.'));
  }
  async function loadScaffoldRevisionList(id) {
    try{const data=await scaffoldApi('/api/scaffold/projects/'+encodeURIComponent(id)+'/revisions'),el=$('#scaffoldRevisionList');if(el&&activeScaffoldProject?.id===id)el.innerHTML=(data.revisions||[]).map((row)=>'<div class=\"scaffold-revision-row\"><strong>rev '+row.revision+' · '+escapeHtml(row.changeKind)+'</strong><small>'+escapeHtml(row.createdAt)+' · SHA-256 '+row.sha256.slice(0,16)+'…</small></div>').join('');}
    catch(error){const el=$('#scaffoldRevisionList');if(el)el.textContent=error.message;}
  }
  async function loadScaffoldFiles(id) {
    if (!id) { scaffoldProjectFiles=[]; return; }
    const token=++scaffoldFileLoadToken;
    try {
      const result=await scaffoldApi('/api/scaffold/projects/'+encodeURIComponent(id)+'/files');
      if(token!==scaffoldFileLoadToken||activeScaffoldProject?.id!==id)return;
      scaffoldProjectFiles=result.files||[];
      const list=$('#scaffoldFileList');
      if(list&&activeScaffoldProject?.id===id) list.innerHTML=scaffoldProjectFiles.map((file)=>`<li><a href="${escapeHtml(file.downloadUrl)}" target="_blank" rel="noopener">${escapeHtml(file.filename)}</a><span>${escapeHtml(file.kind)} · rev ${file.revision} · ${(file.sizeBytes/1024).toFixed(0)} kt · ${escapeHtml(file.sha256.slice(0,12))}…</span></li>`).join('')||'<li class="muted small">Ei tallennettuja projektiaineistoja.</li>';
      const savedModel=scaffoldProjectFiles.find((file)=>file.kind==='building-model'&&/\.obj$/i.test(file.filename));
      if(savedModel&&savedModel.id!==importedScaffoldFileId&&activeScaffoldProject?.id===id){
        const response=await fetch(savedModel.downloadUrl,{cache:'no-store'});
        if(!response.ok)throw new Error('Tallennettua rakennuksen OBJ-mallia ei voitu ladata.');
        const source=await response.text();
        if(token!==scaffoldFileLoadToken||activeScaffoldProject?.id!==id)return;
        importedScaffoldObj=parseObjMass(source);
        importedScaffoldFileId=savedModel.id;
        const facadeSelection=activeScaffoldProject.geometry?.facadeSelection;
        if(facadeSelection?.source==='obj-hull'){
          const side=TelineDomain.objFacadeSides(importedScaffoldObj)[facadeSelection.index];
          if(side){selectedScaffoldFacade={label:facadeSelection.label||side.label,length:side.lengthM,index:side.index,direction:facadeSelection.direction||[side.end[0]-side.start[0],side.end[1]-side.start[1]]};selectedScaffoldFacadeSource='obj-hull';}
        }
        const status=$('#scaffoldModelStatus');
        if(status)status.textContent=`Tallennettu rakennusmalli ${savedModel.filename} · pystyakseli ${importedScaffoldObj.sourceVerticalAxis}-up, muunnettu sisäiseen Y-up-näkymään · ${importedScaffoldObj.bounds.width.toFixed(2)} × ${importedScaffoldObj.bounds.height.toFixed(2)} × ${importedScaffoldObj.bounds.depth.toFixed(2)} m. Varmista yksikkö ja mallin revisio.`;
        if(currentPage==='scaffold')render();
      }
    }
    catch(error){const list=$('#scaffoldFileList');if(list)list.textContent=error.message;}
  }
  async function saveImportedScaffoldModel(project) {
    if(!pendingScaffoldModelFile||!project?.id)return;
    const file=pendingScaffoldModelFile;
    const response=await fetch(`/api/scaffold/projects/${encodeURIComponent(project.id)}/files`,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(file.name),'X-File-Kind':'building-model'},body:file});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Rakennuksen OBJ-mallia ei voitu tallentaa projektiin.');
    importedScaffoldFileId=data.id;
    pendingScaffoldModelFile=null;
    await loadScaffoldFiles(project.id);
  }
  function selectObjFacadeDefaults(model,form){
    const sides=TelineDomain.objFacadeSides(model).sort((a,b)=>b.lengthM-a.lengthM);
    const longest=sides[0];
    if(!longest)return;
    selectedScaffoldFacade={label:longest.label,length:longest.lengthM,index:longest.index,direction:[longest.end[0]-longest.start[0],longest.end[1]-longest.start[1]]};
    selectedScaffoldFacadeSource='obj-hull';
    if(form){form.elements.namedItem('length').value=longest.lengthM.toFixed(2);if(sides[1])form.elements.namedItem('buildingDepth').value=sides[1].lengthM.toFixed(2);}
  }
  async function importScaffoldBuildingObj(file) {
    try {
      importedScaffoldObj=parseObjMass(await file.text());
      importedScaffoldFileId='';pendingScaffoldModelFile=file;selectedScaffoldFacade=null;selectedScaffoldFacadeSource='';selectedScaffoldRoofFacades=[];facadeScaffoldPlans=[];scaffoldCornerReviews=[];scaffoldDrawingReviews=[];selectedScaffoldCornerKey='';scaffoldStairTowers=[];stairTowerPlacementMode=false;stairTowerPlacementRemaining=0;
      const height=importedScaffoldObj.bounds.height,form=$('#scaffoldLayoutForm');
      selectObjFacadeDefaults(importedScaffoldObj,form);
      if(form){form.elements.namedItem('buildingHeight').value=height.toFixed(2);form.elements.namedItem('buildingHeightStatus').value='estimate';form.elements.namedItem('buildingHeightSource').value=`Tuotu OBJ: ${file.name} · pystyakseli ${importedScaffoldObj.sourceVerticalAxis}-up, metriyksikön tarkistus vaaditaan`;form.dispatchEvent(new Event('input',{bubbles:true}));}
      const status=$('#scaffoldModelStatus');
      if(status)status.textContent=`Valmis OBJ-malli ${file.name} · pystyakseli ${importedScaffoldObj.sourceVerticalAxis} muunnettiin sisäiseen Y-up-näkymään. Varmista metriyksikkö; mitat ${importedScaffoldObj.bounds.width.toFixed(2)} × ${height.toFixed(2)} × ${importedScaffoldObj.bounds.depth.toFixed(2)} m.`;
      if(activeScaffoldProject){await saveImportedScaffoldModel(activeScaffoldProject);toast('Rakennuksen OBJ-malli tallennettiin projektiin.');}
      else toast('OBJ-malli liitettiin luonnokseen. Tallenna projekti, niin myös tiedosto säilyy.');
    } catch(error) { toast(error.message||'OBJ-mallia ei voitu lukea tai tallentaa.'); }
  }
  async function loadScaffoldTemplates() {
    if(scaffoldTemplatesLoaded)return;
    try { const result=await scaffoldApi('/api/scaffold/templates'); scaffoldTemplates=result.templates||[]; scaffoldTemplatesLoaded=true; if(currentPage==='scaffold')render(); }
    catch(error){toast(error.message);}
  }
  async function uploadScaffoldFile() {
    if(!activeScaffoldProject){toast('Tallenna projekti ennen tiedoston liittämistä.');return;}
    const file=$('#scaffoldFileInput')?.files?.[0];if(!file){toast('Valitse tallennettava tiedosto.');return;}
    const response=await fetch(`/api/scaffold/projects/${encodeURIComponent(activeScaffoldProject.id)}/files`,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(file.name),'X-File-Kind':$('#scaffoldFileKind')?.value||'other'},body:file});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Tiedostoa ei voitu tallentaa.');
    if(data.kind==='building-model'&&/\.obj$/i.test(data.filename)){
      importedScaffoldObj=parseObjMass(await file.text());importedScaffoldFileId=data.id;selectedScaffoldFacade=null;selectedScaffoldFacadeSource='';selectedScaffoldRoofFacades=[];facadeScaffoldPlans=[];scaffoldCornerReviews=[];scaffoldDrawingReviews=[];selectedScaffoldCornerKey='';scaffoldStairTowers=[];stairTowerPlacementMode=false;stairTowerPlacementRemaining=0;
      const form=$('#scaffoldLayoutForm');selectObjFacadeDefaults(importedScaffoldObj,form);if(form){form.elements.namedItem('buildingHeight').value=importedScaffoldObj.bounds.height.toFixed(2);form.elements.namedItem('buildingHeightStatus').value='estimate';form.elements.namedItem('buildingHeightSource').value=`Tallennettu OBJ: ${data.filename} · pystyakseli ${importedScaffoldObj.sourceVerticalAxis}-up, yksikkö tarkistettava`;form.dispatchEvent(new Event('input',{bubbles:true}));}
      $('#scaffoldModelStatus').textContent=`Tallennettu rakennuksen OBJ-malli ${data.filename}; pystyakseli ${importedScaffoldObj.sourceVerticalAxis}-up, sisäinen näkymä Y-up. Varmista yksikkö.`;
    }
    await loadScaffoldFiles(activeScaffoldProject.id);$('#scaffoldFileInput').value='';toast('Tiedosto tallennettiin projektirevisioon '+data.revision+'.');
  }
  async function saveScaffoldTemplate() {
    if(!activeScaffoldProject){toast('Tallenna projekti ensin.');return;}
    const name=window.prompt('Telinemallin nimi',activeScaffoldProject.name);if(name===null)return;
    const template=await scaffoldApi(`/api/scaffold/projects/${encodeURIComponent(activeScaffoldProject.id)}/templates`,{method:'POST',body:JSON.stringify({name})});
    scaffoldTemplates=[{id:template.id,name:template.name},...scaffoldTemplates];render();toast('Telinemallipohja tallennettiin.');
  }
  async function applyScaffoldTemplate() {
    const id=$('#scaffoldTemplateSelect')?.value;if(!id){toast('Valitse telinemallipohja.');return;}
    const result=await scaffoldApi('/api/scaffold/templates/'+encodeURIComponent(id));const t=result.template,form=$('#scaffoldLayoutForm');facadeScaffoldPlans=Array.isArray(t.geometry.facadeScaffolds)?structuredClone(t.geometry.facadeScaffolds):[];scaffoldStairTowers=Array.isArray(t.geometry.stairTowers)?structuredClone(t.geometry.stairTowers):[];
    for(const [key,value] of Object.entries({workPurpose:t.geometry.workPurpose||'',length:t.geometry.targetLengthM,height:t.geometry.targetHeightM,buildingDepth:t.geometry.buildingDepthM,platformLevels:(t.geometry.platformLevels||[]).join('; '),scale:t.geometry.scale,bayCount:t.geometry.bayCount??''}))form.elements.namedItem(key).value=value;
    scaffoldPricingDraft=structuredClone(t.pricing||{components:{},labor:[],transport:[],otherCosts:0});
    scaffoldLaborSources=Object.fromEntries(['Asennus','Purku','Tarkastus'].map((label)=>[label,scaffoldPricingDraft.labor?.find((row)=>String(row.description||'').toLocaleLowerCase('fi-FI')===label.toLocaleLowerCase('fi-FI'))?.source||'Käyttäjän syöttämä työarvio']));
    $('#scaffoldInstallHours').value=laborHoursFor(scaffoldPricingDraft,'Asennus',true);setScaffoldInstallationEstimateControls(scaffoldPricingDraft);$('#scaffoldDismantleHours').value=laborHoursFor(scaffoldPricingDraft,'Purku');$('#scaffoldInspectionHours').value=laborHoursFor(scaffoldPricingDraft,'Tarkastus');$('#scaffoldLaborRate').value=Number(scaffoldPricingDraft.labor?.[0]?.ratePerHour)||0;$('#scaffoldTransportQuantity').value=Number(scaffoldPricingDraft.transport?.[0]?.quantity)||0;$('#scaffoldTransportAmount').value=Number(scaffoldPricingDraft.transport?.[0]?.amountPerUnit)||0;$('#scaffoldOtherCosts').value=Number(scaffoldPricingDraft.otherCosts)||0;const terms=scaffoldPricingDraft.quoteTerms||{};$('#scaffoldMarginPercent').value=terms.marginPercent??'';$('#scaffoldVatPercent').value=terms.vatPercent??'';$('#scaffoldPriceValidUntil').value=terms.validUntil||'';$('#scaffoldPriceEnteredBy').value=terms.priceEnteredBy||'';$('#scaffoldLaborPriceSource').value=scaffoldPricingDraft.labor?.[0]?.rateSource||'Käyttäjän hintasyöte';$('#scaffoldTransportPriceSource').value=scaffoldPricingDraft.transport?.[0]?.rateSource||'Käyttäjän hintasyöte';$('#scaffoldOtherCostsPriceSource').value=scaffoldPricingDraft.otherCostsSource||'Käyttäjän hintasyöte';
    form.dispatchEvent(new Event('input',{bubbles:true}));toast('Mallin parametrit kopioitiin tähän projektiin. Tallennus luo uuden revision.');
  }
  async function loadScaffoldRecommendation() {
    const input=collectScaffoldProject();if(!input)return;
    scaffoldRecommendation=await scaffoldApi('/api/scaffold/recommendations',{method:'POST',body:JSON.stringify(input)});
    render();
  }
  function applyScaffoldRecommendation() {
    if(!scaffoldRecommendation?.available)return;
    const components={...scaffoldPricingDraft.components};
    for(const row of scaffoldRecommendation.bom)components[row.id]={...(components[row.id]||{}),purchasePerUnit:row.purchasePerUnit,rentalPerUnitDay:row.rentalPerUnitDay,rentalDays:row.rentalDays,priceSource:'Anonymisoitujen vertailuprojektien ehdotus · tarkistettava'};
    scaffoldPricingDraft={...scaffoldPricingDraft,components};
    const estimate=scaffoldRecommendation.laborEstimate;
    if(estimate?.available){for(const [key,id] of [['installation','scaffoldInstallHours'],['dismantling','scaffoldDismantleHours'],['inspection','scaffoldInspectionHours']]){const activity=estimate.activities?.[key];if(activity?.available){$('#'+id).value=Number(activity.hours).toFixed(2);const label=key==='installation'?'Asennus':key==='dismantling'?'Purku':'Tarkastus';scaffoldLaborSources[label]='Anonymisoitu historiavertailu · tarkistettava';if(key==='installation'){const auto=$('#scaffoldInstallAuto');if(auto)auto.checked=false;const hours=$('#scaffoldInstallHours');if(hours)hours.readOnly=false;}}}}
    $('#scaffoldOtherCosts').value=scaffoldRecommendation.quote.other;
    $('#scaffoldLayoutForm')?.dispatchEvent(new Event('input',{bubbles:true}));toast('BOM- ja työarvio kopioitiin tarkistettavaan luonnokseen. Tarkista määrät, tunnit ja hinnat ennen tarjousta.');
  }
  function applyScaffoldProject(project) {
    activeScaffoldProject=project||null;scaffoldProjectDirty=false;scaffoldPricingDraft=structuredClone(project?.pricing||{components:{},labor:[],transport:[],otherCosts:0});scaffoldLaborSources=Object.fromEntries(['Asennus','Purku','Tarkastus'].map((label)=>[label,scaffoldPricingDraft.labor?.find((row)=>String(row.description||'').toLocaleLowerCase('fi-FI')===label.toLocaleLowerCase('fi-FI'))?.source||'Käyttäjän syöttämä työarvio']));
    importedScaffoldObj=null;importedScaffoldFileId='';
    const form=$('#scaffoldLayoutForm');if(!form||!project)return;
    setScaffoldInstallationEstimateControls(scaffoldPricingDraft);
    const g=project.geometry,b=project.building;
    facadeScaffoldPlans=Array.isArray(g.facadeScaffolds)?structuredClone(g.facadeScaffolds):[];scaffoldStairTowers=Array.isArray(g.stairTowers)?structuredClone(g.stairTowers):[];scaffoldCornerReviews=Array.isArray(g.cornerReviews)?structuredClone(g.cornerReviews):[];scaffoldDrawingReviews=Array.isArray(g.designReviews)?structuredClone(g.designReviews):[];selectedScaffoldCornerKey='';stairTowerPlacementMode=false;stairTowerPlacementRemaining=0;
    for(const [key,value] of Object.entries({name:project.name,customerId:project.customerId||'',customerName:project.customerName||'',workPurpose:g.workPurpose||'',length:g.targetLengthM,height:g.targetHeightM,buildingDepth:g.buildingDepthM,buildingHeight:b.height.value,buildingHeightStatus:b.height.status,buildingHeightSource:b.height.source,platformLevels:(g.platformLevels||[]).join('; '),loadClass:g.loadClass??3,scale:g.scale,bayCount:g.bayCount??''}))form.elements.namedItem(key).value=value??'';
    selectedScaffoldBuilding=b.footprint?.length?{id:b.id,object:{attributes:{...(b.properties||{}),name:b.name,address:b.address},geometry:{type:'Polygon',coordinates:[b.footprint]}},payload:{source:b.source,sourceCrs:b.sourceCrs,crs:'EPSG:3879',retrievedAt:b.retrievedAt,data:{}}}:null;
    scaffoldTerrainAnalysisKey='';scaffoldGroundDataBuildingId='';
    scaffoldBuildingGeometryApplied=Boolean(b.footprint?.length&&Number.isInteger(b.facadeIndex));
    const savedFacade=scaffoldBuildingGeometryApplied?TelineDomain.polygonMetrics(b.footprint).sides.find((side)=>side.index===b.facadeIndex):null;
    const savedSelection=g.facadeSelection;
    selectedScaffoldFacade=savedSelection?{label:savedSelection.label,length:savedSelection.lengthM,index:savedSelection.index}:savedFacade?{label:'Julkisivu '+(savedFacade.index+1),length:savedFacade.lengthM,index:savedFacade.index}:null;
    selectedScaffoldFacadeSource=savedSelection?.source||(savedFacade?'building-footprint':'');
    selectedScaffoldRoofFacades=Array.isArray(g.kederRoof?.facades)?structuredClone(g.kederRoof.facades):[];
    const kederEnabled=form.elements.namedItem('kederRoofEnabled'),kederAxis=form.elements.namedItem('kederRoofAxis'),kederBracing=form.elements.namedItem('kederRoofBracing');
    if(kederEnabled)kederEnabled.checked=Boolean(g.kederRoof?.enabled);
    if(kederAxis)kederAxis.value=String(g.kederRoof?.supportAxisM||0.73);
    if(kederBracing)kederBracing.value=g.kederRoof?.bracingVariant||'standard';
    const card=$('#scaffoldSelectedBuilding');if(card)card.innerHTML='<strong>'+escapeHtml(b.address||b.name||'Käsin annettu kohde')+'</strong> · '+escapeHtml(b.source)+' · '+(b.footprint?.length?'EPSG:3879':'ei polygonigeometriaa')+' · korkeus '+escapeHtml(b.height.status)+': '+escapeHtml(b.height.source||'lähde puuttuu');
    if($('#scaffoldRevisionList')){ $('#scaffoldRevisionList').textContent='Ladataan revisiohistoriaa…';void loadScaffoldRevisionList(project.id);}
    void loadScaffoldFiles(project.id);
  }
  function readScaffoldPricingForm(){
    const ratePerHour=Number($('#scaffoldLaborRate')?.value)||0;
    const optionalPercent=(id)=>{const value=$('#'+id)?.value??'';return value===''?null:Number(value);};
    const quoteTerms={currency:'EUR',marginPercent:optionalPercent('scaffoldMarginPercent'),vatPercent:optionalPercent('scaffoldVatPercent'),validUntil:$('#scaffoldPriceValidUntil')?.value||'',priceEnteredBy:$('#scaffoldPriceEnteredBy')?.value?.trim()||''};
    return {components:structuredClone(scaffoldPricingDraft.components||{}),catalogLinks:structuredClone(scaffoldPricingDraft.catalogLinks||{}),installationEstimateBasis:{enabled:Boolean($('#scaffoldInstallAuto')?.checked),dismantlingEnabled:Boolean($('#scaffoldDismantleAuto')?.checked),inspectionEnabled:Boolean($('#scaffoldInspectionAuto')?.checked),minutesPerPart:Math.max(0,Number($('#scaffoldInstallMinutesPerPart')?.value)||0),inspectionMinutesPerPart:Math.max(0,Number($('#scaffoldInspectionMinutesPerPart')?.value)||0),referenceHeightM:Math.max(0.1,Number($('#scaffoldInstallReferenceHeight')?.value)||10),heightIncreasePercentPer10M:Math.max(0,Number($('#scaffoldInstallHeightIncrease')?.value)||0),crewSize:Math.max(1,Math.floor(Number($('#scaffoldInstallCrewSize')?.value)||2))},labor:[['Asennus','scaffoldInstallHours'],['Purku','scaffoldDismantleHours'],['Tarkastus','scaffoldInspectionHours']].map(([description,id])=>({description,hours:Number($('#'+id)?.value)||0,ratePerHour,source:scaffoldLaborSources[description]||'Käyttäjän syöttämä työarvio',rateSource:$('#scaffoldLaborPriceSource')?.value?.trim()||''})),transport:[{description:'Kuljetus',quantity:Number($('#scaffoldTransportQuantity')?.value)||0,amountPerUnit:Number($('#scaffoldTransportAmount')?.value)||0,source:'Käyttäjän syöttämä kuljetusmäärä',rateSource:$('#scaffoldTransportPriceSource')?.value?.trim()||''}],otherCosts:Number($('#scaffoldOtherCosts')?.value)||0,otherCostsSource:$('#scaffoldOtherCostsPriceSource')?.value?.trim()||'Käyttäjän hintasyöte',quoteTerms};
  }
  function collectScaffoldProject(){
    const form=$('#scaffoldLayoutForm');if(!form||!form.reportValidity())return null;
    const v=Object.fromEntries(new FormData(form).entries()),footprint=selectedBuildingFootprint()||[],source=selectedScaffoldBuilding?.payload?.source||'Käyttäjän syöttämät mitat; lähdegeometriaa ei valittu',buildingAttributes=selectedScaffoldBuilding?.object?.attributes||selectedScaffoldBuilding?.object?.properties||{},buildingAddress=buildingAttributes.address||[buildingAttributes.katunimi_suomi||buildingAttributes.street,buildingAttributes.osoitenumero||buildingAttributes.house_number].filter(Boolean).join(' ');
    const facadeSource=selectedScaffoldFacadeSource||'mass-model',footprintFacade=facadeSource==='building-footprint',facadeLengthStatus=footprintFacade?'source':facadeSource==='obj-hull'?'estimate':'user';
    const facadeLengthSource=footprintFacade?source:facadeSource==='obj-hull'?'Tuotu OBJ · rakennuksen vaakasuuntaisen pistehyllyn sivu; tarkista yksikkö ja julkisivumitta':'Käyttäjän syöttämä tai massamallista valittu julkisivumitta';
    const facadeSelection=selectedScaffoldFacade?{source:facadeSource,index:selectedScaffoldFacade.index,label:selectedScaffoldFacade.label,lengthM:selectedScaffoldFacade.length,direction:selectedScaffoldFacade.direction||null}:null;
    const building={id:selectedScaffoldBuilding?.id||'',name:buildingAttributes.name||buildingAttributes.gmlid||buildingAttributes.tyyppi||'',address:buildingAddress,parcelId:buildingAttributes.c_kiinteistotunnus||buildingAttributes.kiinteistotunnus||'',source,sourceCrs:selectedScaffoldBuilding?.payload?.sourceCrs||(footprint.length?'EPSG:4326':'user-input'),projectCrs:'EPSG:3879',retrievedAt:selectedScaffoldBuilding?.payload?.retrievedAt||'',footprint,footprintStatus:footprint.length?(buildingAttributes.manualFootprint?'user':'source'):'user',facadeIndex:footprintFacade?selectedScaffoldFacade?.index??null:null,height:{value:Number(v.buildingHeight),status:v.buildingHeightStatus,source:v.buildingHeightSource},properties:buildingAttributes};
    const kederRoof={enabled:Boolean(form.elements.namedItem('kederRoofEnabled')?.checked),supportAxisM:Number(form.elements.namedItem('kederRoofAxis')?.value)||0.73,bracingVariant:form.elements.namedItem('kederRoofBracing')?.value||'standard',facades:selectedScaffoldRoofFacades.map((face)=>({source:face.source,index:face.index,label:face.label,lengthM:face.lengthM,direction:face.direction,start:face.start,end:face.end,ringSize:face.ringSize}))};
    return {name:v.name,customerId:v.customerId||'',customerName:v.customerName||'',excludeProjectId:activeScaffoldProject?.id||'',building,geometry:{targetLengthM:Number(v.length),targetHeightM:Number(v.height),buildingDepthM:Number(v.buildingDepth),workPurpose:String(v.workPurpose||'').trim(),platformLevels:String(v.platformLevels||'').split(/[;,\\s]+/).filter(Boolean).map(Number),system:'layher-allround',loadClass:Number(v.loadClass)||3,bayCount:v.bayCount===''||!Number.isInteger(Number(v.bayCount))||Number(v.bayCount)<0||Number(v.bayCount)>100?null:Number(v.bayCount),scale:Number(v.scale),facadeSelection,facadeScaffolds:facadeScaffoldPlans.map((plan)=>({id:plan.id,source:plan.source,index:plan.index,label:plan.label,lengthM:plan.lengthM,targetHeightM:plan.targetHeightM,system:plan.system,loadClass:plan.loadClass,platformLevels:plan.platformLevels,bayCount:plan.bayCount,direction:plan.direction,start:plan.start,end:plan.end,ringSize:plan.ringSize})),stairTowers:scaffoldStairTowers.map((tower)=>({id:tower.id,source:tower.source,index:tower.index,label:tower.label,positionM:tower.positionM,targetHeightM:tower.targetHeightM,bayLengthM:tower.bayLengthM,widthM:tower.widthM})),cornerReviews:scaffoldCornerReviews.map((review)=>({key:review.key,checks:[...review.checks],note:review.note})),designReviews:scaffoldDrawingReviews.map((review)=>({id:review.id,status:review.status,note:review.note})),kederRoof},provenance:{targetLength:{status:facadeLengthStatus,source:facadeLengthSource,checkedAt:footprintFacade?building.retrievedAt:''},targetHeight:{status:building.height.status,source:building.height.source},buildingDepth:{status:scaffoldBuildingGeometryApplied?'estimate':'user',source:scaffoldBuildingGeometryApplied?source+' · EPSG:3879-polygonista johdettu':'Käyttäjän syöttämä rakennuksen syvyys',checkedAt:scaffoldBuildingGeometryApplied?building.retrievedAt:''}},pricing:readScaffoldPricingForm(),expectedRevision:activeScaffoldProject?.revision};
  }
  async function saveScaffoldProject(){
    const input=collectScaffoldProject();if(!input)return;
    try{const update=Boolean(activeScaffoldProject?.id),url=update?'/api/scaffold/projects/'+encodeURIComponent(activeScaffoldProject.id):'/api/scaffold/projects';const project=await scaffoldApi(url,{method:update?'PUT':'POST',body:JSON.stringify(input)});applyScaffoldProject(project);scaffoldProjectRecords=[{id:project.id,name:project.name,revision:project.revision,buildingName:project.building.name||'Käsin annettu kohde'},...scaffoldProjectRecords.filter((row)=>row.id!==project.id)];scaffoldProjectsLoaded=true;if(pendingScaffoldModelFile)await saveImportedScaffoldModel(project);render();toast('Projektin revisio '+project.revision+' tallennettiin palvelimelle.');return project;}
    catch(error){toast(error.message||'Telineprojektia ei voitu tallentaa.');return null;}
  }
  async function submitScaffoldReview(form){
    if(!activeScaffoldProject){toast('Tallenna projekti ennen tarkastuskirjausta.');return;}
    const values=Object.fromEntries(new FormData(form).entries());
    try{const project=await scaffoldApi('/api/scaffold/projects/'+encodeURIComponent(activeScaffoldProject.id)+'/review',{method:'POST',body:JSON.stringify({...values,expectedRevision:activeScaffoldProject.revision})});applyScaffoldProject(project);render();toast('Tarkastuskirjaus tallennettiin uuteen revisioon.');}
    catch(error){toast(error.message||'Tarkastuskirjausta ei voitu tallentaa.');}
  }
  function scaffoldExportName(project, extension){
    const stem=(project.name||'telineprojekti').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'telineprojekti';
    return stem+'-'+project.id.slice(0,8)+'-rev-'+project.revision+'.'+extension;
  }
  function downloadScaffoldFile(contents, type, filename){
    const url=URL.createObjectURL(new Blob([contents],{type})),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function buildScaffoldSvg(project){return TelineExports.buildScaffoldSvg(project);}
  async function persistGeneratedScaffoldFile(project, contents, filename, mime, kind){
    const response=await fetch(`/api/scaffold/projects/${encodeURIComponent(project.id)}/files`,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(filename),'X-File-Kind':kind},body:new Blob([contents],{type:mime})});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Tiedostoa ei voitu tallentaa projektiin.');
    downloadScaffoldFile(contents,mime,filename);await loadScaffoldFiles(project.id);return data;
  }
  async function exportScaffoldCad(format){
    const project=await saveScaffoldProject();if(!project)return;
    const isObj=format==='obj',content=isObj?TelineExports.buildScaffoldObj(project):TelineExports.buildScaffoldDxf(project),filename=scaffoldExportName(project,format),mime=isObj?'text/plain;charset=utf-8':'application/dxf';
    const data=await persistGeneratedScaffoldFile(project,content,filename,mime,isObj?'scaffold-model':'drawing');
    toast(`${isObj?'3D OBJ':'CAD DXF'} ladattiin ja tallennettiin projektiin rev ${data.revision}.`);
  }
  async function exportScaffoldFreeCadMacro(){
    const project=await saveScaffoldProject();if(!project)return;
    const content=TelineExports.buildScaffoldFreeCadMacro(project),filename=scaffoldExportName(project,'FCMacro');
    const data=await persistGeneratedScaffoldFile(project,content,filename,'text/plain;charset=utf-8','scaffold-model');
    toast(`FreeCAD-makro tallennettiin projektin rev ${data.revision} aineistoksi (${data.filename}).`);
  }
  async function exportScaffoldSvg(){
    const project=await saveScaffoldProject();if(!project)return;
    const data=await persistGeneratedScaffoldFile(project,buildScaffoldSvg(project),scaffoldExportName(project,'svg'),'image/svg+xml;charset=utf-8','drawing');
    toast(`Versioitu SVG-piirustus ladattiin ja tallennettiin projektiin rev ${data.revision}.`);
  }
  async function exportScaffoldBom(){
    const project=await saveScaffoldProject();if(!project)return;
    const csv=TelineExports.buildScaffoldBomCsv(project);
    const data=await persistGeneratedScaffoldFile(project,csv,scaffoldExportName(project,'csv'),'text/csv;charset=utf-8','other');
    toast(`Projektin rev ${project.revision} BOM CSV tallennettiin ja ladattiin (${data.filename}).`);
  }
  async function exportScaffoldQuote(){
    const project=await saveScaffoldProject();if(!project)return;
    const filename=scaffoldExportName(project,'csv').replace(/\.csv$/,'-tarjousluonnos.csv');
    const data=await persistGeneratedScaffoldFile(project,TelineExports.buildScaffoldQuoteCsv(project),filename,'text/csv;charset=utf-8','other');
    toast(`Tarjousluonnos tallennettiin projektin rev ${project.revision} aineistoksi (${data.filename}).`);
  }
  async function exportScaffoldQuotePdf(){
    const printWindow=window.open('','_blank');
    if(!printWindow){toast('Salli tulostusikkuna selaimessa ja yritä uudelleen.');return;}
    const project=await saveScaffoldProject();
    if(!project){printWindow.close();return;}
    printWindow.document.open();
    printWindow.document.write(TelineExports.buildScaffoldQuoteHtml(project));
    printWindow.document.close();
    toast(`Tarjousluonnoksen tulostusnäkymä avattiin projektin rev ${project.revision} tiedoilla. Valitse selaimen tulostuksesta Tallenna PDF:nä.`);
  }
  async function pushScaffoldQuoteToPipeline(){
    const project=await saveScaffoldProject();if(!project)return;
    const result=await scaffoldApi('/api/scaffold/projects/'+encodeURIComponent(project.id)+'/pipeline',{method:'POST',body:'{}'});
    if(crmLoaded)await refreshCrm();
    toast(result.duplicate?'CRM-tarjousputken summa ja vaihe päivitettiin. Tarjous on edelleen luonnos.':'Tarjousluonnos lisättiin CRM:n Tarjousvalmistelu-vaiheeseen.');
  }
  async function exportScaffoldPdf(){
    const printWindow=window.open('','_blank');
    if(!printWindow){toast('Salli tulostusikkuna selaimessa ja yritä uudelleen.');return;}
    const project=await saveScaffoldProject();if(!project){printWindow.close();return;}
    const svg=buildScaffoldSvg(project),rows=project.model.bom.map((line)=>'<tr><td>'+escapeHtml(line.itemNo)+'</td><td>'+escapeHtml(line.name)+'</td><td>'+line.quantity+' '+escapeHtml(line.unit)+'</td><td>'+escapeHtml(line.quantityStatus)+'</td><td>'+escapeHtml(line.catalogRevision)+' · s. '+line.sourcePage+'</td></tr>').join('');
    printWindow.document.open();
    const scale=1000/(Number(project.geometry.scale)||100),pageWidth=44+Math.max(project.geometry.targetLengthM,project.model.dimensions.modeledLengthM)*scale,pageHeight=42+project.model.dimensions.modeledHeightM*scale+10+18+8+project.geometry.buildingDepthM*scale+30;
    printWindow.document.write('<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>'+escapeHtml(scaffoldExportName(project,'pdf'))+'</title><style>@page{size:'+pageWidth+'mm '+pageHeight+'mm;margin:0}body{font:11px Arial,sans-serif;color:#253747;margin:0}h1{font-size:20px;margin:0 0 5mm}h2{font-size:14px;margin:8mm 0 3mm}.meta{color:#526572;line-height:1.5;margin:0 0 4mm}.drawing{display:block;width:auto;height:auto;max-width:none;max-height:none}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:5px;border-bottom:1px solid #d8e0e5}th{background:#eff3f5}.note{color:#8c3737;font-weight:bold}.page-break{break-before:page}.print-note{font-size:10px;color:#5e6c75}</style></head><body><h1>'+escapeHtml(project.name)+' · rev '+project.revision+'</h1><p class="meta">Tarkistustila '+escapeHtml(project.workflow?.state||'draft')+' · kohde '+escapeHtml(project.building.name||'Käyttäjän antama')+' · lähde '+escapeHtml(project.building.source)+' · CRS '+escapeHtml(project.building.projectCrs)+' · '+escapeHtml(project.updatedAt)+'</p><div class="drawing">'+svg+'</div><p class="print-note">Mittakaava säilyy vain tulostettaessa todellisessa koossa. Tulostusasetuksen sovittaminen paperille muuttaa mittakaavaa.</p><section class="page-break"><h2>Materiaaliluettelo · HAKI Universal</h2><table><thead><tr><th>Tuotenumero</th><th>Osa</th><th>Määrä</th><th>Tietotila</th><th>Lähde</th></tr></thead><tbody>'+rows+'</tbody></table><h2>Avoimet asiat</h2><ul>'+project.model.unresolved.map((row)=>'<li><strong>'+escapeHtml(row.label)+':</strong> '+escapeHtml(row.reason)+'</li>').join('')+'</ul><p class="note">Tämä geometrinen luonnos ja osamääräluonnos eivät ole rakenteellinen mitoitus, valmistajan kokoonpanohyväksyntä tai käyttöönottohyväksyntä.</p></section><script>window.addEventListener("load",()=>window.print());</script></body></html>');
    printWindow.document.close();
  }
  function renderScaffoldBom(model){
    const tbody=$('#scaffoldBomRows');if(!tbody)return;
    tbody.innerHTML=model.bom.map((line)=>{
      const price=scaffoldPricingDraft.components?.[line.id]||{};
      return '<tr><td><strong>'+escapeHtml(line.name)+'</strong><small>'+escapeHtml(line.itemNo)+' · '+escapeHtml(line.size)+' · '+line.quantityStatus+'</small>'+(line.recipe?'<small>'+escapeHtml(line.recipe)+'</small>':'')+(line.facadeBreakdown?.length?'<small>Julkisivut: '+line.facadeBreakdown.map((face)=>escapeHtml(face.label)+' ('+face.quantity+' kpl)').join(', ')+'</small>':'')+(line.towerBreakdown?.length?'<small>Porrastornit: '+line.towerBreakdown.map((tower)=>escapeHtml(tower.label)+' ('+tower.quantity+' kpl)').join(', ')+'</small>':'')+'</td><td>'+line.quantity+' '+line.unit+'</td><td>'+(line.totalWeightKg==null?'—':Number(line.totalWeightKg).toFixed(1)+' kg')+'</td><td><input type="number" min="0" step="0.01" value="'+(Number(price.purchasePerUnit)||0)+'" data-price-id="'+line.id+'" data-price-field="purchasePerUnit" aria-label="Ostohinta"></td><td><input type="number" min="0" step="0.01" value="'+(Number(price.rentalPerUnitDay)||0)+'" data-price-id="'+line.id+'" data-price-field="rentalPerUnitDay" aria-label="Vuokrahinta"></td><td><input type="number" min="0" step="1" value="'+(Number(price.rentalDays)||0)+'" data-price-id="'+line.id+'" data-price-field="rentalDays" aria-label="Vuokrapäivät"></td><td><a href="'+escapeHtml(line.source)+'" target="_blank" rel="noopener noreferrer">Lähde s. '+line.sourcePage+' ↗</a><small>'+escapeHtml(line.catalogRevision)+'</small></td><td><input type="text" maxlength="500" value="'+escapeHtml(price.priceSource||'')+'" placeholder="Esim. oma hinnasto / tarjous" data-price-id="'+line.id+'" data-price-field="priceSource" aria-label="Hinnan lähde"><input type="date" value="'+escapeHtml(price.priceCheckedAt||'')+'" data-price-id="'+line.id+'" data-price-field="priceCheckedAt" aria-label="Hinnan tarkistuspäivä"></td></tr>';
    }).join('')||'<tr><td colspan="8">Määrärivejä ei muodostu ennen mittoja.</td></tr>';
    tbody.oninput=(event)=>{
      const input=event.target.closest('[data-price-id]');if(!input)return;
      scaffoldPricingDraft.components=scaffoldPricingDraft.components||{};
      const prior=scaffoldPricingDraft.components[input.dataset.priceId]||{};
      const value=['priceSource','priceCheckedAt'].includes(input.dataset.priceField)?input.value:(Number(input.value)||0);
      scaffoldPricingDraft.components[input.dataset.priceId]={...prior,[input.dataset.priceField]:value};
      scaffoldProjectDirty=Boolean(activeScaffoldProject);
      const deliveryButton=$('#scaffoldDeliveryForm button[type=submit]');if(deliveryButton)deliveryButton.disabled=scaffoldProjectDirty;
      const lmsStatus=$('#scaffoldLmsRevisionStatus');
      if(lmsStatus&&activeScaffoldProject)lmsStatus.textContent=`Tallennettu rev ${activeScaffoldProject.revision}: BOM ${(activeScaffoldProject.model.bom||[]).reduce((sum,line)=>sum+(Number(line.quantity)||0),0)} kpl. Hinta tai hinnan lähdemerkintä muuttui; tallenna uusi revisio ennen LMS-toimitusta.`;
      updateScaffoldCostSummary(model);
    };
  }
  function updateScaffoldInstallationEstimate(bomModels, auxiliaryBom = [], stairTowerModels = []) {
    const enabled=Boolean($('#scaffoldInstallAuto')?.checked),dismantlingEnabled=Boolean($('#scaffoldDismantleAuto')?.checked),inspectionEnabled=Boolean($('#scaffoldInspectionAuto')?.checked),minutesInput=$('#scaffoldInstallMinutesPerPart'),inspectionMinutesInput=$('#scaffoldInspectionMinutesPerPart'),referenceHeightInput=$('#scaffoldInstallReferenceHeight'),increaseInput=$('#scaffoldInstallHeightIncrease'),crewSizeInput=$('#scaffoldInstallCrewSize'),hoursInput=$('#scaffoldInstallHours'),dismantlingHoursInput=$('#scaffoldDismantleHours'),inspectionHoursInput=$('#scaffoldInspectionHours'),details=$('#scaffoldInstallEstimateDetails');
    if(!minutesInput||!inspectionMinutesInput||!referenceHeightInput||!increaseInput||!crewSizeInput||!hoursInput||!dismantlingHoursInput||!inspectionHoursInput)return;
    const minutesPerPart=Math.max(0,Number(minutesInput.value)||0),inspectionMinutesPerPart=Math.max(0,Number(inspectionMinutesInput.value)||0),referenceHeightM=Math.max(0.1,Number(referenceHeightInput.value)||10),heightIncreasePercentPer10M=Math.max(0,Number(increaseInput.value)||0),crewSize=Math.min(50,Math.max(1,Math.floor(Number(crewSizeInput.value)||2))),formatter=new Intl.NumberFormat('fi-FI',{minimumFractionDigits:1,maximumFractionDigits:2});
    const estimateHours=(parts,heightFactor,minutes)=>Number((parts*minutes/60*heightFactor).toFixed(2));
    const rows=(bomModels||[]).map(({plan,model},index)=>{
      const parts=(model.bom||[]).reduce((sum,line)=>sum+Math.max(0,Number(line.quantity)||0),0),heightM=Math.max(0,Number(model.dimensions?.modeledHeightM)||Number(model.dimensions?.targetHeightM)||0),heightFactor=1+Math.max(0,heightM-referenceHeightM)/10*heightIncreasePercentPer10M/100;
      return {label:plan?.label||`Valittu julkisivu ${index+1}`,parts,heightM,heightFactor,installationHours:estimateHours(parts,heightFactor,minutesPerPart),dismantlingHours:estimateHours(parts,heightFactor,minutesPerPart),inspectionHours:estimateHours(parts,heightFactor,inspectionMinutesPerPart)};
    });
    const auxiliaryParts=(auxiliaryBom||[]).reduce((sum,line)=>sum+Math.max(0,Number(line.quantity)||0),0);
    if(auxiliaryParts){const heightM=Math.max(0,...rows.map((row)=>row.heightM)),heightFactor=1+Math.max(0,heightM-referenceHeightM)/10*heightIncreasePercentPer10M/100;rows.push({label:'Keder XL -sääsuoja',parts:auxiliaryParts,heightM,heightFactor,installationHours:estimateHours(auxiliaryParts,heightFactor,minutesPerPart),dismantlingHours:estimateHours(auxiliaryParts,heightFactor,minutesPerPart),inspectionHours:estimateHours(auxiliaryParts,heightFactor,inspectionMinutesPerPart)});}
    for(const {tower,model} of stairTowerModels||[]){const parts=(model.bom||[]).reduce((sum,line)=>sum+Math.max(0,Number(line.quantity)||0),0),heightM=Math.max(0,Number(model.dimensions?.modeledHeightM)||0),heightFactor=1+Math.max(0,heightM-referenceHeightM)/10*heightIncreasePercentPer10M/100;rows.push({label:`${tower.label} · porrastorni`,parts,heightM,heightFactor,installationHours:estimateHours(parts,heightFactor,minutesPerPart),dismantlingHours:estimateHours(parts,heightFactor,minutesPerPart),inspectionHours:estimateHours(parts,heightFactor,inspectionMinutesPerPart)});}
    const estimateRows=rows.filter((row)=>row.parts>0),totals={installation:0,dismantling:0,inspection:0};
    for(const row of estimateRows){totals.installation+=row.installationHours;totals.dismantling+=row.dismantlingHours;totals.inspection+=row.inspectionHours;}
    for(const key of Object.keys(totals))totals[key]=Number(totals[key].toFixed(2));
    if(details){
      details.innerHTML=estimateRows.length?estimateRows.map((row)=>`<div><strong>${escapeHtml(row.label)}</strong> · ${formatter.format(row.heightM)} m · ${row.parts} BOM-osaa × korkeuskerroin ${formatter.format(row.heightFactor)} · asennus ${formatter.format(row.installationHours)} h · purku ${formatter.format(row.dismantlingHours)} h · tarkastus ${formatter.format(row.inspectionHours)} h</div>`).join(''):`<span class="muted">Muodosta ensin telineen BOM mittojen tai lisättyjen julkisivujen perusteella.</span>`;
      if(estimateRows.length)details.insertAdjacentHTML('beforeend',`<div class="scaffold-install-estimate-total"><strong>Automaattiarviot: asennus ${formatter.format(totals.installation)} · purku ${formatter.format(totals.dismantling)} · tarkastus ${formatter.format(totals.inspection)} hlö-h</strong></div>`);
    }
    hoursInput.readOnly=enabled;dismantlingHoursInput.readOnly=dismantlingEnabled;inspectionHoursInput.readOnly=inspectionEnabled;
    const applyEstimate=(input,active,value,label)=>{if(!active)return;const next=value.toFixed(2),prior=Number(input.value);if(!Number.isFinite(prior)||Math.abs(prior-value)>=0.005){input.value=next;if(activeScaffoldProject)scaffoldProjectDirty=true;}scaffoldLaborSources[label]='Laskettu karkea arvio · BOM-osamäärä ja korkeuskerroin';};
    applyEstimate(hoursInput,enabled,totals.installation,'Asennus');
    applyEstimate(dismantlingHoursInput,dismantlingEnabled,totals.dismantling,'Purku');
    applyEstimate(inspectionHoursInput,inspectionEnabled,totals.inspection,'Tarkastus');
    updateScaffoldInstallationCrewEstimate({installation:enabled?totals.installation:hoursInput.value,dismantling:dismantlingEnabled?totals.dismantling:dismantlingHoursInput.value,inspection:inspectionEnabled?totals.inspection:inspectionHoursInput.value},crewSize);
  }
  function updateScaffoldInstallationCrewEstimate(activityHours, crewSize) {
    const result=$('#scaffoldInstallCrewEstimate');
    if(!result)return;
    const people=Math.min(50,Math.max(1,Math.floor(Number(crewSize)||2))),formatter=new Intl.NumberFormat('fi-FI',{minimumFractionDigits:1,maximumFractionDigits:2}),activities=[['Asennus',activityHours.installation],['Purku',activityHours.dismantling],['Tarkastus',activityHours.inspection]].map(([label,value])=>({label,hours:Math.max(0,Number(value)||0)})).filter((row)=>row.hours>0),total=activities.reduce((sum,row)=>sum+row.hours,0);
    result.innerHTML=total>0?`<strong>Miehitys ${people} asentajaa</strong> · ${activities.map((row)=>`${row.label.toLocaleLowerCase('fi')}: ${formatter.format(row.hours)} hlö-h ÷ ${people} = ${formatter.format(row.hours/people)} ryhmätuntia`).join(' · ')} · yhteensä ${formatter.format(total/people)} ryhmätuntia`:'<span class="muted">Työryhmän kesto näkyy, kun työvaiheille on tuntiarvio.</span>';
  }
  function updateScaffoldCostSummary(model){
    const el=$('#scaffoldCostSummary');if(!el)return;
    const pricing=readScaffoldPricingForm();
    let sum;try{sum=TelineDomain.priceSummary(model,pricing);}catch(error){el.innerHTML='<p class="scaffold-pricing-warning">'+escapeHtml(error.message||'Tarkista kate- ja ALV-prosentti.')+'</p>';return;}
    const money=(value)=>value==null?'Määritä':new Intl.NumberFormat('fi-FI',{style:'currency',currency:'EUR'}).format(value);
    const prices=scaffoldPricingDraft.components||{},bom=(model.bom||[]),unpriced=bom.filter((line)=>{const row=prices[line.id]||{};return !(Number(row.purchasePerUnit)>0||Number(row.rentalPerUnitDay)>0);}).length;
    const noSources=bom.filter((line)=>{const row=prices[line.id]||{};return (Number(row.purchasePerUnit)>0||Number(row.rentalPerUnitDay)>0)&&!String(row.priceSource||'').trim();}).length;
    const terms=pricing.quoteTerms,missing=[];
    const laborHours=pricing.labor.reduce((sum,row)=>sum+Math.max(0,Number(row.hours)||0),0),laborRate=Number(pricing.labor[0]?.ratePerHour)||0,laborRateSource=String(pricing.labor[0]?.rateSource||'').trim();
    if(sum.marginPercent==null)missing.push('kateprosentti puuttuu');
    if(sum.vatPercent==null)missing.push('ALV-prosentti puuttuu');
    if(unpriced)missing.push(`${unpriced} BOM-riviltä puuttuu hinta`);
    if(noSources)missing.push(`${noSources} BOM-hinnalta puuttuu lähde`);
    if(laborHours>0&&laborRate<=0)missing.push('työn €/hlö-h hinta puuttuu');
    if(laborHours>0&&laborRate>0&&!laborRateSource)missing.push('työhinnan lähde puuttuu');
    if(!terms.priceEnteredBy)missing.push('hinnan syöttäjä puuttuu');
    if(!terms.validUntil)missing.push('hintojen voimassaolo puuttuu');
    const warning=missing.length?`<p class="scaffold-pricing-warning">Tarjousluonnos keskeneräinen: ${escapeHtml(missing.join('; '))}. Puuttuvia tietoja ei täydennetä oletuksilla.</p>`:'<p class="scaffold-pricing-ready">Tarjousparametrit on annettu. Tarkista silti hinnat, määrät, voimassaolo ja avoimet suunnittelutiedot.</p>';
    const laborPriceMissing=laborHours>0&&laborRate<=0,rows=[['Osto',sum.purchase],['Vuokra',sum.rental],['Työ',laborPriceMissing?null:sum.labor],['Kuljetus',sum.transport],['Muut kustannukset',sum.other],['Kustannuspohja',laborPriceMissing?null:sum.costTotal],['Kate',laborPriceMissing?null:sum.margin],['Myyntihinta ilman ALV:tä',laborPriceMissing?null:sum.netTotal],['ALV',laborPriceMissing?null:sum.vat],['Yhteensä ALV:n kanssa',laborPriceMissing?null:sum.grossTotal]];
    const laborBreakdown=pricing.labor.map((row)=>{const hours=Math.max(0,Number(row.hours)||0),rate=Math.max(0,Number(row.ratePerHour)||0),amount=hours*rate;return `<div><small>${escapeHtml(row.description)} · ${hours.toLocaleString('fi-FI',{maximumFractionDigits:2})} hlö-h</small><strong>${money(hours>0&&rate<=0?null:amount)}</strong></div>`;}).join('');
    el.innerHTML=rows.map(([label,value])=>'<div><small>'+label+'</small><strong>'+money(value)+'</strong></div>').join('')+`<section class="scaffold-labor-cost-breakdown"><strong>Työn eurot työvaiheittain</strong>${laborBreakdown}</section>`+warning;
  }
  const PLATFORM_PROTECTION_SYSTEMS=new Set(['layher-allround','haki-universal']);
  function hasPlatformProtection(system){return PLATFORM_PROTECTION_SYSTEMS.has(system);}
  function hasScaffoldToeBoard(system,lengthM){const cm=Math.round(Number(lengthM)*100);return system==='layher-allround'?[73,109,140,157,207,257,307].includes(cm):system==='haki-universal'&&Math.abs(Number(lengthM)-3.05)<.01;}
  function makeScaffold3dSvg(model,targetLength){
    const d=model.dimensions,left=95,bottom=335,top=64,sx=560/Math.max(targetLength,d.modeledLengthM,d.bayLengthM),sy=(bottom-top)/Math.max(d.modeledHeightM,d.liftHeightM),right=left+d.modeledLengthM*sx,roof=bottom-d.modeledHeightM*sy;
    let svg='<svg viewBox=\"0 0 820 390\" role=\"img\" aria-label=\"Telineen 3D-julkisivuluonnos\"><polygon points=\"'+left+','+bottom+' '+right+','+bottom+' '+(right+70)+','+(bottom-44)+' '+(left+70)+','+(bottom-44)+'\" fill=\"#dfe8ee\" stroke=\"#8b9dac\"/><polygon points=\"'+left+','+bottom+' '+right+','+bottom+' '+right+','+roof+' '+left+','+roof+'\" fill=\"#f3f6f8\" stroke=\"#8b9dac\"/>';
    if(d.bays>0){
      for(let i=0;i<=d.bays;i++){const x=left+(d.bayStartsM?.[i]??i*d.bayLengthM)*sx;svg+='<path d=\"M'+x+','+bottom+' V'+roof+'\" stroke=\"#117a61\" stroke-width=\"3\"/>';}
      for(let level=0;level<=d.lifts;level++){const y=bottom-level*d.liftHeightM*sy;svg+='<path d=\"M'+left+','+y+' H'+right+'\" stroke=\"#3976aa\" stroke-width=\"2.2\"/>';if(level<d.lifts)for(const bay of d.braceBayIndexes||[]){const bx=left+(d.bayStartsM?.[bay]??bay*d.bayLengthM)*sx,bw=(d.bayLengthsM?.[bay]??d.bayLengthM)*sx,upper=bottom-(level+1)*d.liftHeightM*sy;svg+='<path d=\"M'+bx+','+y+' L'+(bx+bw)+','+upper+'\" stroke=\"#c7782d\" stroke-width=\"2\"/>';}if(hasPlatformProtection(model.platformGuardrailSystem)&&level>0&&d.platformLevels.includes(level)){for(let bay=0;bay<d.bays;bay++){const bx=left+(d.bayStartsM?.[bay]??bay*d.bayLengthM)*sx,bw=(d.bayLengthsM?.[bay]??d.bayLengthM)*sx,deckY=bottom-level*d.liftHeightM*sy;svg+=`<path d="M${bx},${deckY-.5*sy} H${bx+bw} M${bx},${deckY-1*sy} H${bx+bw}" stroke="#13795f" stroke-width="2.6"/>`;if(hasScaffoldToeBoard(model.platformGuardrailSystem,(d.bayLengthsM?.[bay]??d.bayLengthM)))svg+=`<path d="M${bx},${deckY} h${bw} v-${.15*sy} h-${bw} Z" fill="#c7962c" stroke="#805f1c" stroke-width=".6"/>`;}}}
    }
    if(d.uncoveredLengthM>.001)svg+='<text x=\"'+(right+5)+'\" y=\"'+(bottom+30)+'\" font-size=\"12\" fill=\"#a54242\">'+d.uncoveredLengthM.toFixed(2)+' m kattamatta</text>';
    return svg+'<text x=\"'+left+'\" y=\"32\" fill=\"#30475a\" font-size=\"13\">'+d.bays+' kenttää · '+d.modeledLengthM.toFixed(2)+' m · '+d.lifts+' × '+d.liftHeightM.toFixed(2)+' m nousut</text></svg>';
  }
  function combineScaffoldPreview(buildingSvg,scaffoldSvg){
    const inner=(markup)=>markup.replace(/^<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');
    return `<svg viewBox="0 0 820 410" role="img" aria-label="Rakennus ja sen julkisivulle asetettu parametrinen teline; rakennuksen julkisivua voi klikata"><g transform="scale(1.13889 1)">${inner(buildingSvg)}</g><g transform="scale(1 1.05128)" opacity=".78" pointer-events="none">${inner(scaffoldSvg)}</g></svg>`;
  }
  function renderScaffoldStairTowers() {
    const list=$('#scaffoldStairTowerList');
    if(!list)return;
    if(!scaffoldStairTowers.length){list.innerHTML='<p class="muted small">Ei sijoitettuja porrastorneja.</p>';return;}
    list.innerHTML=scaffoldStairTowers.map((tower,index)=>{
      const model=TelineDomain.deriveLayherStairTower(tower),dimensions=model.dimensions;
      return `<article class="scaffold-stairtower-card"><div><strong>${escapeHtml(tower.label)} · torni ${index+1}</strong><small>Keskikohta ${Number(tower.positionM).toFixed(2)} m · ${Number(tower.bayLengthM).toFixed(2)} m leveä moduuli · vähimmäisleveys ${dimensions.minimumWidthM.toFixed(2)} m · ${dimensions.lifts} × 2 m nousua</small></div><label>Korkeus m<input type="number" min="0.5" max="120" step="0.5" value="${Number(tower.targetHeightM)||20}" data-stairtower-id="${escapeHtml(tower.id)}" data-stairtower-field="targetHeightM"></label><button class="button button-sm" type="button" data-stairtower-remove="${escapeHtml(tower.id)}" aria-label="Poista porrastorni ${index+1}">Poista</button></article>`;
    }).join('');
  }
  function initScaffoldStudio(){
    void import('/allround-model-viewer.mjs').catch(()=>{});
    const form=$('#scaffoldLayoutForm');if(!form||form.dataset.initialized)return;form.dataset.initialized='true';initBuildingCardMap();const canvas=$('#scaffoldFacadeCanvas');let lastBom='',scaffold3dViewer=null,scaffold3dViewerLoading=false,latestScaffold3dConfig=null,latestFacadeOptions=[];
    const selectFacade=(face,source)=>{const edge=Number(face?.edgeLength)||Number(face?.lengthM)||Number(form.elements.namedItem('length').value)||0,index=Number(face?.facadeIndex??face?.index),direction=Array.isArray(face?.direction)?face.direction:(face?.start&&face?.end?[Number(face.end[0])-Number(face.start[0]),Number(face.end[1])-Number(face.start[1])]:null);selectedScaffoldFacade={label:face?.facade||face?.label||`Julkisivu ${index+1}`,length:edge,index,direction};selectedScaffoldFacadeSource=source;form.elements.namedItem('length').value=edge.toFixed(2);form.dispatchEvent(new Event('input',{bubbles:true}));};
    const chooseFacade=(face,source)=>{
      if(!form.elements.namedItem('kederRoofEnabled')?.checked){selectFacade(face,source);return;}
      const index=Number(face?.facadeIndex??face?.index),existing=selectedScaffoldRoofFacades.findIndex((item)=>item.index===index&&item.source===source);
      if(existing>=0)selectedScaffoldRoofFacades.splice(existing,1);
      else {
        const next={source,index,label:face?.facade||face?.label||`Julkisivu ${index+1}`,lengthM:Number(face?.edgeLength??face?.lengthM)||0,direction:face?.direction||null,start:face?.start||null,end:face?.end||null,ringSize:Number(face?.ringSize)||null};
        if(selectedScaffoldRoofFacades.length>=2)selectedScaffoldRoofFacades.splice(1,1,next);else selectedScaffoldRoofFacades.push(next);
      }
      const selectedFace=selectedScaffoldRoofFacades.find((item)=>item.index===index&&item.source===source)||face,selectedLength=Number(selectedFace?.edgeLength??selectedFace?.lengthM)||0;selectedScaffoldFacade={label:selectedFace?.facade||selectedFace?.label||`Julkisivu ${index+1}`,length:selectedLength,index,direction:selectedFace?.direction||null};selectedScaffoldFacadeSource=source;form.elements.namedItem('length').value=selectedLength.toFixed(2);
      const status=$('#scaffoldKederStatus');if(status)status.textContent=selectedScaffoldRoofFacades.length<2?`Valittu ${selectedScaffoldRoofFacades.length}/2 julkisivua. Valitse vastakkainen, yhdensuuntainen sivu.`:'Kaksi julkisivua valittu; tarkistan jännevälin ja katon moduulit.';
      form.dispatchEvent(new Event('input',{bubbles:true}));
    };
    const facadePlanList=$('#scaffoldFacadePlanList');
    const cornerPanel=$('#scaffoldCornerReviewPanel');
    const drawingReviewList=$('#scaffoldDrawingReviewList');
    const drawingReviewItems=[
      ['floor-geometry','Rakennuksen muoto tasoittain','Onko ulkolinja muuttuva kerrosten välillä? Vertaa pohjia, julkisivuja ja leikkauksia; huomioi sisäänvedot, parvekkeet ja ulokkeet.'],
      ['existing-conditions','Rakennuksen nykytila','Vastaavatko käytössä olevat piirustukset nykyistä rakennusta ja viimeisimpiä muutoksia? Kirjaa tarvittaessa työmaalla tarkistettavat kohdat.'],
      ['ground-levels','Maanpinta ja tukialusta','Onko maanpinnan korkeus ja ympäröivä tasoero kartoitettu? Tukialustan kantavuus ja perustaminen vaativat erillisen kohdekohtaisen tarkistuksen.'],
      ['reference-point','Mittaperusta ja aloituskohta','Käyttävätkö piirustus, mittaketjut ja työmaan aloitus samaa lähtöpistettä ja mittaperustaa?'],
      ['working-face','Työskentelypinta ja välys','Muuttuuko telineen ja todellisen työskentelypinnan väli ulokkeiden, syvennysten, pilareiden tai pintarakenteiden vuoksi?'],
      ['openings-access','Aukot, sisäänkäynnit ja kulku','Onko ovien käyttö, työntekijöiden reitit, materiaalien siirto ja tarvittava vapaa tila käsitelty?'],
      ['services-obstructions','Putket ja muut esteet','Onko putket, katokset, lasipinnat, syöksytorvet, kaivot, laitteet ja muut julkisivun esteet tunnistettu?'],
      ['external-constraints','Rajat ja ympäröivä alue','Vaikuttavatko tontin rajat, katu, naapurirakennukset, pylväät tai ilmajohdot sijoitukseen ja työmaan kulkureitteihin?'],
      ['component-buildability','Osien fyysinen asennettavuus','Voivatko valitun järjestelmän todelliset osat, liitokset ja kuljetettavat osat muodostaa piirustuksen mukaisen kokonaisuuden?'],
      ['design-basis-coordination','Mitoitusperuste ja rakenneratkaisu','Vastaavatko piirustuksessa näytetyt kokoonpano, kuormat, tuenta ja sidonnat erillistä laskenta- tai suunnitteluperustetta?'],
      ['revision-coordination','Revisioiden vaikutukset','Onko muutoksen vaikutus tarkistettu pohjaan, julkisivuihin, leikkauksiin, detaljeihin, osaluetteloon ja muihin toimitettaviin asiakirjoihin?'],
      ['drawing-legend','Symbolit, lyhenteet ja näkymäviitteet','Onko tämän piirustuksen oma selite mukana, ja ovatko lyhenteet, valmistajatunnukset sekä pohja-, julkisivu-, leikkaus- ja detaljiviittaukset tulkittavissa?'],
      ['detail-necessity','Paikallisen detaljin tarve','Selviääkö ehto pohjasta, julkisivusta tai leikkauksesta? Jos ei, kirjaa huomioon ratkaistava kysymys, sijainti ja ehdotetun detaljin tunnus. Aseta tilaksi “Detalji tarvitaan”, kun pääkuvia täydentävä kuva on tehtävä.'],
      ['detail-interface','Sidonnan tai rakennusliittymän toteutettavuus','Vastaavatko piirustuksen liittymäkohdat todellista rakennusta ja käytettävissä olevia työmaatietoja? Kirjaa aukot, ulokkeet, pinnat, esteet tai puuttuvat tarkistukset; detalji ei yksin vahvista kiinnitystä.'],
      ['detail-view-coordination','Detaljin yhteensovitus muihin näkymiin','Vastaavatko detaljin sijainti, mitat, osat ja tunnus pohjaa, julkisivua, leikkausta ja huomautuksia? Merkitse muutoksen vaikutukset kaikkiin näkymiin ja samaan revisioon.'],
      ['view-cross-check','Pohja–julkisivu–leikkaus-ristiintarkistus','Seuraa samaa kenttää, sisäänkäyntiä ja työtasoa kaikissa piirustuksissa. Täsmäytä kenttäjako, kulku ja nousut, ja tarkista leikkauksesta leveys sekä välys juuri sen sijainnissa. Varmista sama projektirevisio.'],
      ['bracing-load-path','Jäykistyksen jatkuvuus ja kuormareitti','Tarkista pituus-, poikittais- ja vaakatasojäykistys sekä kuormareitin jatkuvuus telineestä jäykisteiden ja suunniteltujen sidontojen kautta kantavaan rakenteeseen. Käy läpi päädyt, nurkat, aukot, kulkureitit, peitteet ja välivaiheet. Vertaa työmaalla asennettujen osien tyyppi, sijainti ja lukitut liitokset piirustukseen; kirjaa vaurioituneet tai luvatta poistetut osat. Kaide ei automaattisesti korvaa jäykistettä, eikä Layherin joka viidennen kentän vähimmäisohje yksin osoita rakenteellista riittävyyttä.'],
      ['work-requirements','Työn tavoite ja käyttövaatimukset','Onko työn tarkoitus, tarvittavat työtasot, kulku, materiaalinkäsittely, suojaus ja käytön kesto kirjattu ennen kenttä- ja tasoratkaisua?'],
      ['system-compatibility','Todellinen järjestelmä ja komponentit','Vastaavatko piirustuksen moduulit, osat, liitokset ja niiden rakenteelliset tehtävät työmaalle tulevaa järjestelmää? Fyysinen sopivuus ei yksin osoita rakenteellista yhteensopivuutta. Kirjaa valmistaja-asiakirjan lähde/revisio.'],
      ['critical-sections','Leikkausten kattavuus','Vaatiiko normaali julkisivu, parveke, katos, parapetti, kattoreuna, sisäänveto, lastausalue tai kulkureitti oman poikkileikkauksen? Liitä tarvittavat leikkauskuvat projektiaineistoon.'],
      ['access-stability','Kulun, sidontojen ja jäykistyksen yhteensovitus','Ovatko porrastornit, tikasaukot ja materiaalireitit sovitettu aukkoihin, työalueisiin, siteisiin ja diagonaaleihin niin, että todelliset liittymät tarkistetaan kohteessa?'],
      ['final-read-through','Piirustusluonnoksen itsenäinen lukukoe','Ymmärtäisikö piirustusta lukematon henkilö kohteen, järjestelmän, mittayksiköt, mittakaavan, lähteet, revisiot, rajaukset ja työmaalla varmistettavat asiat ilman arvailua?'],
      ['information-gaps','Puuttuvat lähtötiedot','Onko puutteelliset mitat, lähteet ja lisäselvitystä vaativat kohdat merkitty ennen piirustuksen viimeistelyä?'],
    ];
    const drawingReviewFor=(id)=>scaffoldDrawingReviews.find((row)=>row.id===id)||{id,status:'unchecked',note:''};
    const renderDrawingReviews=()=>{
      if(!drawingReviewList)return;
      const complete=scaffoldDrawingReviews.filter((row)=>['reviewed','not-applicable'].includes(row.status)).length,open=scaffoldDrawingReviews.filter((row)=>row.status==='open').length,detailNeeded=scaffoldDrawingReviews.filter((row)=>row.status==='detail-required').length,remaining=drawingReviewItems.length-complete-open-detailNeeded;
      const summary=$('#scaffoldDrawingReviewSummary');if(summary){summary.textContent=`${complete}/${drawingReviewItems.length} käsitelty · ${open} avointa${detailNeeded?` · ${detailNeeded} detaljia tehtävä`:''}${remaining?` · ${remaining} tarkistamatta`:''}`;summary.className=`tag ${open?'red':detailNeeded||remaining?'amber':'green'}`;}
      drawingReviewList.innerHTML=drawingReviewItems.map(([id,title,description])=>{const review=drawingReviewFor(id),detailItem=id==='detail-necessity';return `<article class="scaffold-drawing-review-item"><div class="scaffold-drawing-review-item-head"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></div><label>Tila<select data-drawing-review-id="${id}"><option value="unchecked" ${review.status==='unchecked'?'selected':''}>${detailItem?'Ei arvioitu':'Ei tarkistettu'}</option><option value="reviewed" ${review.status==='reviewed'?'selected':''}>${detailItem?'Arvioitu · pääkuvat riittävät':'Tarkistettu'}</option>${detailItem?`<option value="detail-required" ${review.status==='detail-required'?'selected':''}>Detalji tarvitaan · piirrettävä</option>`:''}<option value="open" ${review.status==='open'?'selected':''}>Avoin · lisätieto tarvitaan</option><option value="not-applicable" ${review.status==='not-applicable'?'selected':''}>Ei sovellu</option></select></label></div><label class="scaffold-drawing-review-note">Tunnus, lähde tai huomio<textarea rows="2" maxlength="1500" data-drawing-review-note="${id}" placeholder="Sijainti, detaljitunnus, piirustusrevisio tai avoin kysymys">${escapeHtml(review.note||'')}</textarea></label></article>`;}).join('');
    };
    const cornerChecklist=[
      ['geometry','Varmista kulman todellinen muoto, kulma, sisäänvedot ja ulokkeet'],
      ['clearance','Tarkista julkisivun ulokkeet, palvelut ja työskentelyvälykset'],
      ['frames','Tarkista pystyrunkojen kohtaaminen, törmäykset ja järjestelmien yhteensopivuus'],
      ['platforms','Tarkista työtasojen jatkuvuus, käyttöleveys ja mahdolliset aukot'],
      ['edge-protection','Tarkista avoimet reunat, turvakaiteet ja varvaslaudat'],
      ['ties-bracing','Tarkista sidonnat, jäykistys ja vakauden suunnitteluperusteet'],
      ['access','Tarkista kulku sekä pitkien osien ja materiaalien siirto kulman ohi'],
      ['detail-approval','Liitä kohdekohtainen kulmadetail ja pyydä valmistajan / suunnittelijan tarkistus'],
    ];
    let latestCornerRows=[];
    const cornerReviewFor=(key)=>scaffoldCornerReviews.find((row)=>row.key===key)||{key,checks:[],note:''};
    const renderCornerReviewPanel=()=>{
      if(!cornerPanel)return;
      if(!latestCornerRows.length){cornerPanel.innerHTML='<p class="scaffold-corner-empty">Rakennuksen pohjaa ei ole saatavilla. Kulmien suunnittelutarkistus tarvitsee polygonin tai vähintään rakennuksen pituus- ja syvyysmitat.</p>';return;}
      if(!latestCornerRows.some((row)=>row.key===selectedScaffoldCornerKey))selectedScaffoldCornerKey=latestCornerRows[0].key;
      const list=latestCornerRows.map((row)=>{const count=cornerReviewFor(row.key).checks?.length||0;return `<button class="scaffold-corner-option${row.key===selectedScaffoldCornerKey?' selected':''}" type="button" data-corner-select="${escapeHtml(row.key)}" aria-pressed="${row.key===selectedScaffoldCornerKey?'true':'false'}"><strong>Kulma ${row.index+1} · ${row.angleDeg.toFixed(1)}°</strong><small>${escapeHtml(row.first.label)} · ${row.first.lengthM.toFixed(2)} m ↔ ${escapeHtml(row.second.label)} · ${row.second.lengthM.toFixed(2)} m</small><small>${count}/${cornerChecklist.length} tarkistuskohtaa kirjattu · detaili avoin</small></button>`;}).join('');
      const row=latestCornerRows.find((item)=>item.key===selectedScaffoldCornerKey),review=cornerReviewFor(row.key),radians=row.angleDeg*Math.PI/180,rayX=78+43*Math.cos(radians),rayY=62-43*Math.sin(radians),largeArc=row.angleDeg>180?1:0,arcX=78+23*Math.cos(radians),arcY=62-23*Math.sin(radians);
      const scaffoldSpec=(plan)=>plan?`${plan.system==='layher-allround'?'Layher Allround':'HAKI Universal'} · ${Number(plan.targetHeightM).toFixed(1)} m · LC ${plan.loadClass} · tasot ${(plan.platformLevels||[]).join(', ')||'ei merkitty'}`:'Telinekokoonpano puuttuu';
      const differences=[];
      if(row.first.plan&&row.second.plan){
        if(row.first.plan.system!==row.second.plan.system)differences.push('järjestelmä');
        if(Math.abs(Number(row.first.plan.targetHeightM)-Number(row.second.plan.targetHeightM))>0.01)differences.push('korkeus');
        if(Number(row.first.plan.loadClass)!==Number(row.second.plan.loadClass))differences.push('kuormaluokka');
        if(JSON.stringify(row.first.plan.platformLevels||[])!==JSON.stringify(row.second.plan.platformLevels||[]))differences.push('työtasojen nousut');
      }
      const comparison=row.first.plan&&row.second.plan
        ? differences.length?`Näkyvät speksit eroavat: ${differences.join(', ')}. Kulmaliitos ja tasojen jatkuvuus pitää suunnitella erikseen.`:'Molemmilla sivuilla on samat näkyvät speksit. Kulmaliitos ja tasojen jatkuvuus pitää silti tarkistaa erikseen.'
        : 'Lisää telinekokoonpano molemmille sivuille ennen niiden keskinäistä tarkastelua.';
      const checks=cornerChecklist.map(([id,label])=>`<label class="scaffold-corner-check"><input type="checkbox" data-corner-check="${escapeHtml(row.key)}" data-check-id="${id}" ${(review.checks||[]).includes(id)?'checked':''}><span>${escapeHtml(label)}</span></label>`).join('');
      cornerPanel.innerHTML=`<div class="scaffold-corner-grid">${list}</div><article class="scaffold-corner-detail"><div class="scaffold-corner-detail-title"><div><strong>Kulma ${row.index+1} · ${row.angleDeg.toFixed(1)}° · ${escapeHtml(row.sourceLabel)}</strong><small>${escapeHtml(row.first.label)} ${row.first.lengthM.toFixed(2)} m · ${escapeHtml(row.second.label)} ${row.second.lengthM.toFixed(2)} m</small></div><span class="tag amber">Tarkistettava</span></div><div class="scaffold-corner-detail-body"><div><svg class="scaffold-corner-schematic" viewBox="0 0 170 120" role="img" aria-label="Periaatekuva kahdesta vierekkäisestä julkisivusta, kulma ${row.angleDeg.toFixed(1)} astetta"><path d="M 28 62 L 78 62 M 78 62 L ${rayX.toFixed(1)} ${rayY.toFixed(1)}" fill="none" stroke="#46616b" stroke-width="5" stroke-linecap="round"/><path d="M 101 62 A 23 23 0 ${largeArc} 0 ${arcX.toFixed(1)} ${arcY.toFixed(1)}" fill="none" stroke="#d47728" stroke-width="2"/><circle cx="78" cy="62" r="4" fill="#d47728"/><text x="16" y="85">Julkisivu ${row.previousIndex+1}</text><text x="82" y="20">Julkisivu ${row.index+1}</text><text x="105" y="104">Periaatekuva · ei mitoitettu</text></svg><p class="scaffold-corner-compare">${escapeHtml(comparison)}</p></div><div class="scaffold-corner-specs"><div><strong>${escapeHtml(row.first.label)}</strong><small>${escapeHtml(scaffoldSpec(row.first.plan))}</small></div><div><strong>${escapeHtml(row.second.label)}</strong><small>${escapeHtml(scaffoldSpec(row.second.plan))}</small></div></div></div><fieldset class="scaffold-corner-checklist"><legend>Kulman tarkistuslista · kirjaa kohdekohtainen havainto</legend>${checks}<label class="scaffold-corner-note">Huomiot ja tarvittava detaili<textarea rows="3" maxlength="2000" data-corner-note="${escapeHtml(row.key)}" placeholder="Kirjaa mitta, este, sovittu ratkaisu tai avoin kysymys">${escapeHtml(review.note||'')}</textarea></label></fieldset></article>`;
    };
    const renderCornerReviews=(ring,source)=>{
      if(!cornerPanel)return;
      const metrics=TelineDomain.polygonMetrics(ring),points=metrics.points||[];
      if(points.length<3){latestCornerRows=[];renderCornerReviewPanel();return;}
      const signedArea=points.reduce((sum,point,index)=>{const next=points[(index+1)%points.length];return sum+point[0]*next[1]-next[0]*point[1];},0),orientation=signedArea>=0?1:-1;
      latestCornerRows=points.map((point,index)=>{
        const previous=points[(index+points.length-1)%points.length],next=points[(index+1)%points.length],incoming=[point[0]-previous[0],point[1]-previous[1]],outgoing=[next[0]-point[0],next[1]-point[1]],turn=Math.atan2(incoming[0]*outgoing[1]-incoming[1]*outgoing[0],incoming[0]*outgoing[0]+incoming[1]*outgoing[1])*180/Math.PI,angleDeg=Math.max(0,Math.min(360,180-orientation*turn)),previousIndex=(index+points.length-1)%points.length,firstPlan=facadeScaffoldPlans.find((plan)=>plan.source===source&&plan.index===previousIndex),secondPlan=facadeScaffoldPlans.find((plan)=>plan.source===source&&plan.index===index),firstSide=metrics.sides.find((side)=>side.index===previousIndex),secondSide=metrics.sides.find((side)=>side.index===index),key=`${source}:corner:${index}`;
        return {key,index,previousIndex,angleDeg,sourceLabel:source==='building-footprint'?'rakennuspolygonista':source==='obj-hull'?'tuodusta OBJ-mallista':'mittaluonnoksesta',first:{label:firstPlan?.label||`Julkisivu ${previousIndex+1}`,lengthM:firstPlan?.lengthM||firstSide?.lengthM||0,plan:firstPlan},second:{label:secondPlan?.label||`Julkisivu ${index+1}`,lengthM:secondPlan?.lengthM||secondSide?.lengthM||0,plan:secondPlan}};
      });
      renderCornerReviewPanel();
    };
    const renderFacadeScaffoldPlans=()=>{
      if(!facadePlanList)return;
      if(!facadeScaffoldPlans.length){facadePlanList.innerHTML='<div class="scaffold-facade-plan-empty">Ei lisättyjä telineitä. Valitse rakennuksen julkisivu yllä ja lisää se omaksi kokoonpanokseen.</div>';return;}
      facadePlanList.innerHTML=facadeScaffoldPlans.map((plan,index)=>{
        let summary='Mitoitusluonnos päivittyy syötteistä.';
        try{const derived=TelineDomain.deriveHakiUniversal({system:plan.system,targetLengthM:plan.lengthM,targetHeightM:plan.targetHeightM,platformLevels:plan.platformLevels,loadClass:plan.loadClass,bayCount:plan.bayCount});const d=derived.dimensions;summary=`${derived.system.name} · ${d.bays} kenttää${d.bayLengthsM?.length?` (${d.bayLengthsM.map((length)=>length.toFixed(2)).join(' + ')} m)`:''} · ${d.lifts} nousua · ${d.platformLevels?.length||0} tasoa · LC ${plan.loadClass}. ${derived.warnings.length?derived.warnings.join(' '):'Määrät ovat geometrinen luonnos.'}`;}catch(error){summary=error.message||summary;}
        const levelText=(plan.platformLevels||[]).join('; '),bayText=plan.bayCount==null?'':String(plan.bayCount);
        return `<article class="scaffold-facade-plan-card" data-facade-plan-index="${index}"><div class="scaffold-facade-plan-head"><div><strong>${escapeHtml(plan.label)}</strong><small>${plan.lengthM.toFixed(2)} m · ${escapeHtml(plan.source)} · julkisivu ${plan.index+1}</small></div><div class="heading-actions"><button class="button button-sm" type="button" data-facade-plan-action="focus" data-facade-plan-index="${index}">Tarkastele</button><button class="button button-sm" type="button" data-facade-plan-action="remove" data-facade-plan-index="${index}">Poista</button></div></div><div class="scaffold-facade-plan-fields"><label>Telinejärjestelmä<select data-facade-plan-field="system"><option value="layher-allround" ${plan.system==='layher-allround'?'selected':''}>Layher Allround</option><option value="haki-universal" ${plan.system==='haki-universal'?'selected':''}>HAKI Universal</option></select></label><label>Telinekorkeus (m)<input type="number" min="0" max="120" step="0.1" value="${Number(plan.targetHeightM)||0}" data-facade-plan-field="targetHeightM"></label><label>Kuormaluokka<select data-facade-plan-field="loadClass">${[1,2,3,4,5,6].map((value)=>`<option value="${value}" ${Number(plan.loadClass)===value?'selected':''}>${value}</option>`).join('')}</select></label><label>Työtasojen nousut<input type="text" value="${escapeHtml(levelText)}" placeholder="esim. 2; 4; 6" data-facade-plan-field="platformLevels"><small>Kaiteet ja yhteensopiva varvaslauta (jalkalista) lisätään automaattisesti jokaiselle merkitylle työtasolle.</small></label><label>Kenttien enimmäismäärä<input type="number" min="0" max="100" step="1" value="${escapeHtml(bayText)}" placeholder="Automaattinen" data-facade-plan-field="bayCount"></label></div><p class="scaffold-facade-plan-summary">${escapeHtml(summary)}</p></article>`;
      }).join('');
    };
    const draw=()=>{
      syncScaffoldTerrainAnalysis();
      const v=Object.fromEntries(new FormData(form).entries()),activeFacadePlan=facadeScaffoldPlans.find((plan)=>plan.index===selectedScaffoldFacade?.index&&plan.source===selectedScaffoldFacadeSource),target=Math.max(0,Number(activeFacadePlan?.lengthM??v.length)||0),activeHeight=Number(activeFacadePlan?.targetHeightM??v.height)||0,activeLoadClass=Number(activeFacadePlan?.loadClass??v.loadClass)||3,activeLevels=activeFacadePlan?.platformLevels??v.platformLevels,activeBayCount=activeFacadePlan?.bayCount??(v.bayCount===''||!Number.isInteger(Number(v.bayCount))||Number(v.bayCount)<0||Number(v.bayCount)>100?null:Number(v.bayCount)),baseModel=TelineDomain.deriveHakiUniversal({system:activeFacadePlan?.system||'layher-allround',targetLengthM:target,targetHeightM:activeHeight,platformLevels:activeLevels||'',loadClass:activeLoadClass,bayCount:activeBayCount}),facadeModels=facadeScaffoldPlans.map((plan)=>({plan,model:TelineDomain.deriveHakiUniversal({system:plan.system,targetLengthM:plan.lengthM,targetHeightM:plan.targetHeightM,platformLevels:plan.platformLevels||'',loadClass:plan.loadClass,bayCount:plan.bayCount})})),bomModels=facadeModels.length?facadeModels:[{plan:null,model:baseModel}],bomById=new Map();for(const entry of bomModels)for(const row of entry.model.bom){const key=`${row.id}|${row.system}`,existing=bomById.get(key);if(existing){existing.quantity+=row.quantity;existing.totalWeightKg=existing.unitWeightKg==null?null:Number((existing.totalWeightKg+row.totalWeightKg).toFixed(1));if(entry.plan)existing.facadeBreakdown.push({label:entry.plan.label,quantity:row.quantity});}else bomById.set(key,{...row,facadeBreakdown:entry.plan?[{label:entry.plan.label,quantity:row.quantity}]:[]});}const facadeBom=[...bomById.values()],towerModels=scaffoldStairTowers.map((tower)=>({tower,model:TelineDomain.deriveLayherStairTower({...tower,loadClass:facadeScaffoldPlans.find((plan)=>plan.source===tower.source&&plan.index===tower.index)?.loadClass||3})})),combinedBomById=new Map(facadeBom.map((row)=>[`${row.id}|${row.system}`,{...row,towerBreakdown:[]} ]));for(const {tower,model:towerModel} of towerModels)for(const row of towerModel.bom){const key=`${row.id}|${row.system}`,existing=combinedBomById.get(key);if(existing){existing.quantity+=row.quantity;existing.totalWeightKg=existing.unitWeightKg==null?null:Number((existing.totalWeightKg+row.totalWeightKg).toFixed(1));existing.towerBreakdown.push({label:tower.label,quantity:row.quantity});}else combinedBomById.set(key,{...row,facadeBreakdown:[],towerBreakdown:[{label:tower.label,quantity:row.quantity}]});}const combinedBom=[...combinedBomById.values()],kederRoofModel=TelineDomain.deriveLayherKederRoof({enabled:Boolean(form.elements.namedItem('kederRoofEnabled')?.checked),supportAxisM:Number(form.elements.namedItem('kederRoofAxis')?.value)||0.73,bracingVariant:form.elements.namedItem('kederRoofBracing')?.value||'standard',facades:selectedScaffoldRoofFacades,loadClass:activeLoadClass}),facadeWarnings=facadeModels.flatMap(({plan,model:facadeModel})=>facadeModel.warnings.map((warning)=>`${plan.label}: ${warning}`)),facadeUnresolved=facadeModels.flatMap(({plan,model:facadeModel})=>facadeModel.unresolved.map((row)=>({...row,id:`${plan.id}:${row.id}`,label:`${plan.label}: ${row.label}`}))),towerWarnings=towerModels.flatMap(({tower,model:towerModel})=>towerModel.warnings.map((warning)=>`${tower.label} · porrastorni: ${warning}`)),towerUnresolved=towerModels.flatMap(({tower,model:towerModel})=>towerModel.unresolved.map((row)=>({...row,id:`${tower.id}:${row.id}`,label:`${tower.label} · porrastorni: ${row.label}`}))),model={...baseModel,system:facadeModels.length>1&&new Set(facadeModels.map(({model:row})=>row.system.id)).size>1?{...baseModel.system,id:'facade-specific-systems',name:'Julkisivukohtaiset järjestelmät'}:facadeModels[0]?.model.system||baseModel.system,platformGuardrailSystem:activeFacadePlan?.system||baseModel.system.id,bom:[...combinedBom,...kederRoofModel.bom],unresolved:[...(facadeModels.length?facadeUnresolved:baseModel.unresolved),...towerUnresolved,...kederRoofModel.unresolved],warnings:[...(facadeModels.length?facadeWarnings:baseModel.warnings),...towerWarnings,...kederRoofModel.warnings],facadeScaffolds:facadeModels.map(({plan,model:facadeModel})=>({...plan,dimensions:facadeModel.dimensions,status:facadeModel.status})),stairTowers:towerModels.map(({tower,model:towerModel})=>({...tower,dimensions:towerModel.dimensions,status:towerModel.status}))},d=model.dimensions,ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,buildingHeight=Math.max(0,Number(v.buildingHeight)||0),sig=target+'|'+activeHeight+'|'+activeLevels+'|'+activeLoadClass+'|'+activeBayCount+'|'+buildingHeight+'|'+facadeScaffoldPlans.map((plan)=>[plan.id,plan.system,plan.targetHeightM,plan.loadClass,plan.platformLevels.join(';'),plan.bayCount].join(':')).join('|')+'|'+scaffoldStairTowers.map((tower)=>[tower.id,tower.positionM,tower.targetHeightM,tower.bayLengthM,tower.widthM].join(':')).join('|')+'|'+(importedScaffoldObj?'obj':'registry');
      if(scaffoldGeometrySignature&&scaffoldGeometrySignature!==sig){selectedScaffoldParts.clear();previewScaffoldParts.clear();hoveredScaffoldPart=null;}scaffoldGeometrySignature=sig;ctx.clearRect(0,0,w,h);ctx.fillStyle='#fbfdff';ctx.fillRect(0,0,w,h);
      const pad=55,header=62,viewHeight=Math.max(d.modeledHeightM,buildingHeight,d.liftHeightM),u=Math.min((w-pad*2)/Math.max(target,d.modeledLengthM,d.bayLengthM),(h-pad*2-header)/Math.max(viewHeight,d.liftHeightM)),x=pad,baseY=h-pad,y=baseY-d.modeledHeightM*u,end=x+d.modeledLengthM*u,full=x+target*u;
      const gridTop=baseY-viewHeight*u;ctx.lineWidth=1;
      for(let metre=0;metre<=Math.ceil(Math.max(target,d.modeledLengthM));metre++){const gx=x+metre*u;ctx.strokeStyle=metre%5===0?'#b7c9c4':'#e2eae7';ctx.beginPath();ctx.moveTo(gx,gridTop);ctx.lineTo(gx,baseY);ctx.stroke();}
      for(let metre=0;metre<=Math.ceil(viewHeight);metre++){const gy=baseY-metre*u;ctx.strokeStyle=metre%5===0?'#b7c9c4':'#e2eae7';ctx.beginPath();ctx.moveTo(x,gy);ctx.lineTo(full,gy);ctx.stroke();}
      if(buildingHeight>0){const top=baseY-buildingHeight*u,floors=Math.max(1,Math.min(30,Number(selectedScaffoldBuilding?.object?.attributes?.i_kerrlkm||selectedScaffoldBuilding?.object?.attributes?.storeysAboveGround)||Math.round(buildingHeight/3.1)));ctx.fillStyle=importedScaffoldObj?'rgba(53,91,112,.15)':'rgba(103,123,136,.12)';ctx.fillRect(x,top,full-x,buildingHeight*u);ctx.strokeStyle='#637b88';ctx.lineWidth=2;ctx.strokeRect(x,top,full-x,buildingHeight*u);ctx.lineWidth=1;for(let floor=1;floor<floors;floor++){const fy=baseY-floor*buildingHeight/floors*u;ctx.strokeStyle='#81949c';ctx.beginPath();ctx.moveTo(x,fy);ctx.lineTo(full,fy);ctx.stroke();}const windowRows=Math.max(1,floors-1),windowCols=Math.max(1,Math.floor(target/3.2));for(let row=0;row<windowRows;row++)for(let col=0;col<windowCols;col++){const ww=Math.max(3,Math.min(16,u*.82)),wh=Math.max(4,Math.min(22,u*.55)),wx=x+(col+.5)*(full-x)/windowCols-ww/2,wy=baseY-(row+.58)*(buildingHeight/floors)*u-wh/2;ctx.fillStyle=importedScaffoldObj?'#5f8799':'#617580';ctx.fillRect(wx,wy,ww,wh);}ctx.fillStyle='#47616c';ctx.font='11px system-ui';ctx.fillText(importedScaffoldObj?'TUOTU 3D-MALLI':'RAKENNUKSEN JULKISIVU · mitat / tietotila tarkistettava',x+5,Math.max(14,top-6));}
      ctx.fillStyle='#edf1f4';ctx.fillRect(x,y,Math.max(0,end-x),d.modeledHeightM*u);ctx.fillStyle='rgba(200,65,65,.08)';if(full>end)ctx.fillRect(end,y,full-end,d.modeledHeightM*u);if(end>full)ctx.fillStyle='rgba(200,65,65,.12)';if(end>full)ctx.fillRect(full,y,end-full,d.modeledHeightM*u);ctx.strokeStyle='#8998a5';ctx.setLineDash([4,5]);ctx.strokeRect(x,y,Math.max(1,Math.max(full,end)-x),d.modeledHeightM*u);ctx.setLineDash([]);
      scaffoldSelectableParts=[];const seg=(id,label,x1,y1,x2,y2)=>scaffoldSelectableParts.push({id,label,kind:'segment',x1,y1,x2,y2,cx:(x1+x2)/2,cy:(y1+y2)/2});const area=(id,label,ax,ay,aw,ah)=>scaffoldSelectableParts.push({id,label,kind:'area',x:ax,y:ay,width:aw,height:ah,cx:ax+aw/2,cy:ay+ah/2});
      for(let i=0;i<d.bays;i++)for(const level of d.platformLevels)area('deck-'+i+'-'+level,'Työtaso · kenttä '+(i+1)+', nousu '+level,x+(d.bayStartsM?.[i]??i*d.bayLengthM)*u,h-pad-level*d.liftHeightM*u,(d.bayLengthsM?.[i]??d.bayLengthM)*u,Math.max(5,d.liftHeightM*u));
      if(d.bays>0){
        ctx.strokeStyle='#16775f';ctx.lineWidth=2.3;for(let i=0;i<=d.bays;i++){const bx=x+(d.bayStartsM?.[i]??i*d.bayLengthM)*u;seg('standard-'+i,'Pystylinja '+(i+1),bx,y,bx,h-pad);ctx.beginPath();ctx.moveTo(bx,y);ctx.lineTo(bx,h-pad);ctx.stroke();}
        for(let level=0;level<=d.lifts;level++){const by=h-pad-level*d.liftHeightM*u;seg('ledger-'+level,'Vaakajuoksu · taso '+level,x,by,end,by);ctx.strokeStyle='#3976aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,by);ctx.lineTo(end,by);ctx.stroke();if(level>0&&d.platformLevels.includes(level)){ctx.strokeStyle='#d59a28';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,by);ctx.lineTo(end,by);ctx.stroke();}if(level<d.lifts)for(const bay of d.braceBayIndexes||[]){const bx=x+(d.bayStartsM?.[bay]??bay*d.bayLengthM)*u,bw=(d.bayLengthsM?.[bay]??d.bayLengthM)*u,upper=h-pad-(level+1)*d.liftHeightM*u;ctx.strokeStyle='#c7782d';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+bw,upper);ctx.stroke();ctx.strokeStyle='#16775f';ctx.lineWidth=2.3;}if(hasPlatformProtection(model.platformGuardrailSystem)&&level>0&&d.platformLevels.includes(level)){ctx.strokeStyle='#13795f';ctx.lineWidth=2.6;for(let bay=0;bay<d.bays;bay++){const bx=x+(d.bayStartsM?.[bay]??bay*d.bayLengthM)*u,bw=(d.bayLengthsM?.[bay]??d.bayLengthM)*u;for(const rise of [.5,1]){ctx.beginPath();ctx.moveTo(bx,by-rise*u);ctx.lineTo(bx+bw,by-rise*u);ctx.stroke();}if(hasScaffoldToeBoard(model.platformGuardrailSystem,(d.bayLengthsM?.[bay]??d.bayLengthM))){ctx.fillStyle='#c7962c';ctx.fillRect(bx,by-Math.max(2,.15*u),bw,Math.max(2,.15*u));}}}}
      }
      for(const part of scaffoldSelectableParts)if(part.kind==='area'&&(selectedScaffoldParts.has(part.id)||previewScaffoldParts.has(part.id)||hoveredScaffoldPart?.id===part.id)){ctx.fillStyle='rgba(232,131,12,.2)';ctx.fillRect(part.x,part.y,part.width,part.height);}
      ctx.fillStyle='#263445';ctx.font='13px system-ui';ctx.fillText('TELINE '+d.modeledLengthM.toFixed(2)+' m · '+d.bays+' eripituista kenttää',x,22);ctx.fillStyle='#536773';ctx.font='12px system-ui';ctx.fillText('Korkeus '+d.modeledHeightM.toFixed(2)+' m · '+d.lifts+' nousua × '+d.liftHeightM.toFixed(2)+' m · tavoite '+target.toFixed(2)+' × '+Number(v.height||0).toFixed(2)+' m',x,43);
      if(d.lengthDifferenceM>.001){ctx.strokeStyle='#c75050';ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(end,h-pad+13);ctx.lineTo(full,h-pad+13);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#a54242';ctx.fillText(d.uncoveredLengthM.toFixed(2)+' m kattamatta',end+5,h-pad+32);}else if(d.overrunLengthM>.001){ctx.strokeStyle='#c75050';ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(full,h-pad+13);ctx.lineTo(end,h-pad+13);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#a54242';ctx.fillText(d.overrunLengthM.toFixed(2)+' m ylitys',full+5,h-pad+32);}
      $('#scaffoldDrawingMeta').textContent='Mitat metreissä · ruudukko 1 × 1 m (vahva viiva 5 m) · näkymä sovitettu, ei muuta geometriaa · tulostus 1:'+v.scale+' · julkisivu '+target.toFixed(2)+' m · rakennuskorkeus '+buildingHeight.toFixed(2)+' m · teline '+d.modeledLengthM.toFixed(2)+' × '+d.modeledHeightM.toFixed(2)+' m';
      const activeFacadePlanStatus=facadeScaffoldPlans.find((plan)=>plan.index===selectedScaffoldFacade?.index&&plan.source===selectedScaffoldFacadeSource);$('#scaffoldFacadeStatus').textContent=selectedScaffoldFacade?selectedScaffoldFacade.label+' · '+selectedScaffoldFacade.length.toFixed(2)+' m'+(activeFacadePlanStatus?` · ${activeFacadePlanStatus.system==='layher-allround'?'Layher Allround':'HAKI Universal'} · ${activeFacadePlanStatus.targetHeightM.toFixed(1)} m · LC ${activeFacadePlanStatus.loadClass}`:''):'Valitse rakennusjulkisivu 3D-mallista.';
      const preview=$('#scaffold3dPreview');
      const sourceFootprint=selectedBuildingFootprint()||[];
      const objSides=importedScaffoldObj?TelineDomain.objFacadeSides(importedScaffoldObj):[];
      const footprint=sourceFootprint.length?sourceFootprint:objSides.length?objSides.map((side)=>side.start):[];
      const fallbackRing=[[0,0],[target,0],[target,Number(v.buildingDepth)||12],[0,Number(v.buildingDepth)||12]];
      const modelRing=footprint.length?footprint:fallbackRing;
      const allSides=TelineDomain.polygonMetrics(modelRing).sides;
      const facadeOptions=(importedScaffoldObj?objSides.map((side)=>({index:side.index,label:side.label,lengthM:side.lengthM,start:side.start,end:side.end,ringSize:objSides.length,direction:[side.end[0]-side.start[0],side.end[1]-side.start[1]],source:'obj-hull'})):allSides.map((side)=>({index:side.index,label:`Julkisivu ${side.index+1}`,lengthM:side.lengthM,start:side.start,end:side.end,ringSize:allSides.length,direction:[side.end[0]-side.start[0],side.end[1]-side.start[1]],source:footprint.length?'building-footprint':'mass-model'}))).sort((a,b)=>b.lengthM-a.lengthM);latestFacadeOptions=facadeOptions;const cornerRing=importedScaffoldObj&&objSides.length?objSides.map((side)=>side.start):modelRing,cornerSource=importedScaffoldObj&&objSides.length?'obj-hull':footprint.length?'building-footprint':'mass-model';renderCornerReviews(cornerRing,cornerSource);
      const renderFacadeOption=(face)=>{const roofIndex=selectedScaffoldRoofFacades.findIndex((item)=>item.index===face.index&&item.source===face.source),plan=facadeScaffoldPlans.find((item)=>item.index===face.index&&item.source===face.source),roofRole=roofIndex===0?' · katto A':roofIndex===1?' · katto B':'',planRole=plan?' · teline lisätty':'',pressed=roofIndex>=0||Boolean(plan)||(selectedScaffoldFacade?.index===face.index&&selectedScaffoldFacadeSource===face.source);return `<button class="button button-sm scaffold-facade-option${roofIndex>=0?' keder-selected':''}${plan?' scaffold-facade-planned':''}" type="button" data-facade-index="${face.index}" data-facade="${escapeHtml(face.label)}" data-edge-length="${face.lengthM}" data-facade-direction="${escapeHtml(JSON.stringify(face.direction))}" data-face-start="${escapeHtml(JSON.stringify(face.start))}" data-face-end="${escapeHtml(JSON.stringify(face.end))}" data-ring-size="${face.ringSize}" data-facade-source="${face.source}" aria-pressed="${pressed?'true':'false'}">${escapeHtml(face.label)} · ${face.lengthM.toFixed(2)} m${roofRole}${planRole}</button>`;};
      const facadeOptionsEl=$('#scaffoldFacadeOptions');if(facadeOptionsEl){const primary=facadeOptions.slice(0,8),other=facadeOptions.slice(8);facadeOptionsEl.innerHTML='<span>Valitse sivu myös painikkeella · pisimmät ensin:</span>'+primary.map(renderFacadeOption).join('')+(other.length?`<details class="scaffold-facade-more"><summary>Näytä ${other.length} muuta reunaa</summary><div>${other.map(renderFacadeOption).join('')}</div></details>`:'');}
      const roofDimensions=kederRoofModel.dimensions;
      const kederRoofConfig=kederRoofModel.valid?{...roofDimensions,enabled:true,facadeAIndex:roofDimensions.facadeA.index,facadeBIndex:roofDimensions.facadeB.index,eaveHeightM:Math.max(buildingHeight,d.modeledHeightM)}:{enabled:false};
      const kederStatus=$('#scaffoldKederStatus');if(kederStatus){if(!kederRoofModel.enabled)kederStatus.textContent='Keder XL pois käytöstä. Kytke se päälle ja valitse vastakkaiset julkisivut.';else if(!roofDimensions)kederStatus.innerHTML='<strong>Katon mitoitusta ei voitu määrittää.</strong> '+kederRoofModel.unresolved.map((row)=>escapeHtml(row.reason)).join(' ');else{kederStatus.innerHTML=`<strong>Katto ${roofDimensions.roofWidthM.toFixed(2)} × ${roofDimensions.roofLengthM.toFixed(2)} m · nousu ${roofDimensions.roofRiseM.toFixed(2)} m.</strong> ${roofDimensions.trussCount} kattotuolia · ${roofDimensions.roofBayLengthsM.map((length)=>length.toFixed(2)+' m').join(' + ')} · jako enintään 2,57 m. Tukiväli ${roofDimensions.supportSpanM.toFixed(2)} m; nimellisleveydet Ni ${roofDimensions.nominalInternalM.toFixed(2)} / Na ${roofDimensions.nominalExternalM.toFixed(2)} m.`;}}
      latestScaffold3dConfig={footprint,platformGuardrailSystem:activeFacadePlan?.system||baseModel.system.id,buildingHeight:Number(v.buildingHeight)||importedScaffoldObj?.bounds.height||0,targetLength:target,modeledLength:d.modeledLengthM,depth:Number(v.buildingDepth)||0,scaffoldHeight:d.modeledHeightM,bayLength:d.bayLengthM,bayLengths:d.bayLengthsM,bayStarts:d.bayStartsM,braceBayIndexes:d.braceBayIndexes,loadClass:activeLoadClass,minimumFacadeLengthM:Math.min(...(d.bayLengthsM||[d.bayLengthM])),bays:d.bays,lifts:d.lifts,liftHeight:d.liftHeightM,platformLevels:d.platformLevels,facadeIndex:['building-footprint','mass-model','obj-hull'].includes(selectedScaffoldFacadeSource)?selectedScaffoldFacade?.index:null,facadeScaffolds:facadeModels.map(({plan,model:facadeModel})=>({index:plan.index,source:plan.source,system:plan.system,label:plan.label,lengthM:plan.lengthM,modeledLengthM:facadeModel.dimensions.modeledLengthM,scaffoldHeight:facadeModel.dimensions.modeledHeightM,bayLengths:facadeModel.dimensions.bayLengthsM,bayStarts:facadeModel.dimensions.bayStartsM,braceBayIndexes:facadeModel.dimensions.braceBayIndexes,loadClass:plan.loadClass,bays:facadeModel.dimensions.bays,lifts:facadeModel.dimensions.lifts,liftHeight:facadeModel.dimensions.liftHeightM,platformLevels:facadeModel.dimensions.platformLevels})),stairTowers:scaffoldStairTowers.map((tower)=>({index:tower.index,source:tower.source,positionM:tower.positionM,targetHeightM:tower.targetHeightM,bayLengthM:tower.bayLengthM,widthM:tower.widthM,label:tower.label})),stairTowerPlacementMode,kederSelectedFacadeIndexes:selectedScaffoldRoofFacades.map((face)=>face.index),kederRoof:kederRoofConfig,terrainReferenceElevationM:scaffoldTerrainAnalysis?.referenceElevationM??null,terrainCellSizeM:scaffoldTerrainAnalysis?.cellSizeM??0,terrainSamples:(scaffoldTerrainAnalysis?.samples||[]).slice(0,1800).map((sample)=>[sample.x,sample.y,sample.z,sample.bandIndex])};
      if(importedScaffoldObj&&!kederRoofModel.enabled&&!scaffoldStairTowers.length&&!stairTowerPlacementMode){preview.innerHTML=combineScaffoldPreview(drawBuildingMass(Number(v.buildingHeight)||0),makeScaffold3dSvg(model,target));preview.dataset.viewerFallback='true';}
      else if(scaffold3dViewer){scaffold3dViewer.render(preview,latestScaffold3dConfig);preview.dataset.viewerFallback='';}
      else {
        if(!scaffold3dViewer&&!preview.dataset.viewerFallback)preview.innerHTML=combineScaffoldPreview(drawBuildingMass(Number(v.buildingHeight)||0),makeScaffold3dSvg(model,target));
        if(!scaffold3dViewerLoading){scaffold3dViewerLoading=true;import('/scaffold-3d-viewer.mjs').then((viewer)=>{scaffold3dViewer=viewer;const current=$('#scaffold3dPreview');if(current&&latestScaffold3dConfig&&(!importedScaffoldObj||latestScaffold3dConfig.kederRoof?.enabled||latestScaffold3dConfig.stairTowers?.length||latestScaffold3dConfig.stairTowerPlacementMode)){viewer.render(current,latestScaffold3dConfig);current.dataset.viewerFallback='';}}).catch(()=>{});}
      }
      const cancelTowerPlacement=$('#scaffoldCancelStairTowerPlacement'),startTowerPlacement=$('#scaffoldStartStairTowerPlacement');if(cancelTowerPlacement)cancelTowerPlacement.hidden=!stairTowerPlacementMode;if(startTowerPlacement)startTowerPlacement.textContent=stairTowerPlacementMode?`Klikkaa ${stairTowerPlacementRemaining} tornin paikkaa`:`📍 Sijoita ${Number($('#scaffoldStairTowerQty')?.value)||2} porrastornia`;preview.classList.toggle('scaffold-stairtower-placing',stairTowerPlacementMode);
      updateScaffoldInstallationEstimate(bomModels,kederRoofModel.bom,towerModels);if(lastBom!==sig){renderScaffoldBom(model);lastBom=sig;}updateScaffoldCostSummary(model);renderScaffoldStairTowers();
      const totalPlannedBays=facadeModels.reduce((sum,entry)=>sum+entry.model.dimensions.bays,0),planSummary=facadeModels.length?`${facadeModels.length} julkisivua · yhteensä ${totalPlannedBays} kenttää`:`${d.bays} kenttää · ${d.lifts} nousua · LC ${activeLoadClass} · diagonaalit ${d.diagonalQuantity||0} kpl`;
      $('#scaffoldBOMSummary').innerHTML='<strong>'+escapeHtml(model.system.name)+'</strong> · '+planSummary+(scaffoldStairTowers.length?` · ${scaffoldStairTowers.length} porrastornia, mallikorkeus ${scaffoldStairTowers.map((tower)=>TelineDomain.deriveLayherStairTower(tower).dimensions.modeledHeightM.toFixed(2)+' m').join(' / ')}`:'')+' · BOM '+model.bom.reduce((n,row)=>n+row.quantity,0)+' kpl'+(kederRoofModel.valid?' · Keder Roof XL '+kederRoofModel.dimensions.roofWidthM.toFixed(2)+' × '+kederRoofModel.dimensions.roofLengthM.toFixed(2)+' m · '+kederRoofModel.dimensions.trussCount+' kattotuolia':'')+'. '+model.warnings.map(escapeHtml).join(' ');
      $('#scaffoldOpenItems').innerHTML='<strong>Avoimet suunnittelutiedot</strong><ul>'+model.unresolved.map((row)=>'<li><b>'+escapeHtml(row.label)+':</b> '+escapeHtml(row.reason)+'</li>').join('')+'</ul>';
      const lmsStatus=$('#scaffoldLmsRevisionStatus'),deliveryButton=$('#scaffoldDeliveryForm button[type=submit]');if(lmsStatus&&activeScaffoldProject){const savedQuantity=(activeScaffoldProject.model.bom||[]).reduce((sum,line)=>sum+(Number(line.quantity)||0),0),draftQuantity=model.bom.reduce((sum,line)=>sum+(Number(line.quantity)||0),0);lmsStatus.textContent=scaffoldProjectDirty?`Tallennettu rev ${activeScaffoldProject.revision}: BOM ${savedQuantity} kpl. Nykyinen luonnos: ${draftQuantity} kpl. Tallenna uusi revisio ennen LMS-toimitusta.`:`Tallennettu BOM ${savedQuantity} kpl · rev ${activeScaffoldProject.revision}.`;if(deliveryButton)deliveryButton.disabled=scaffoldProjectDirty;}
      const prov=activeScaffoldProject?.provenance||null;
      const liveFacadeProvenance=selectedScaffoldFacadeSource==='obj-hull'
        ? {source:`Tuotu OBJ · pohjahyllyn sivu ${selectedScaffoldFacade?.label||''} · yksikkö tarkistettava`,checkedAt:'Malliotteesta laskettu',status:'estimate'}
        : selectedScaffoldFacadeSource==='mass-model'
          ? {source:`Massamallin julkisivu ${selectedScaffoldFacade?.label||''}`,checkedAt:'Valittu aktiivisesta massamallista',status:'user'}
          : selectedScaffoldFacadeSource==='building-footprint'
            ? {source:selectedScaffoldBuilding?.payload?.source||'Rakennuksen lähdepolygonin sivu',checkedAt:selectedScaffoldBuilding?.payload?.retrievedAt||'Ei hakuajankohtaa',status:'source'}
            : null;
      const facadeProvenance=scaffoldProjectDirty||!prov?.targetLength?liveFacadeProvenance:prov.targetLength;
      $('#scaffoldProvenancePanel').innerHTML=[
        ['Rakennuspolygonin lähde',selectedScaffoldBuilding?.payload?.source||'Käyttäjän syöttämät mitat',selectedScaffoldBuilding?.payload?.retrievedAt||'Ei hakuajankohtaa',selectedScaffoldBuilding?.payload?.sourceCrs||'user-input','EPSG:3879'],
        ['Julkisivumitta',facadeProvenance?.source||(selectedScaffoldBuilding?'Polygonin pisin sivu':'Käyttäjän syöttämä'),facadeProvenance?.checkedAt||selectedScaffoldBuilding?.payload?.retrievedAt||'Ei tarkistusajankohtaa',facadeProvenance?.status||(selectedScaffoldBuilding?'source':'user'),selectedScaffoldFacadeSource==='obj-hull'?'OBJ · yksikkö tarkistettava':'EPSG:3879'],
        ['Rakennuksen korkeus',$('#scaffoldLayoutForm [name=buildingHeightSource]').value||'Lähde puuttuu','Tila: '+v.buildingHeightStatus,v.buildingHeightStatus,'käsin / ilmoitettu'],
        ['Järjestelmä',model.system.manualRevision,model.system.manualUrl,model.system.catalogStatus,'HAKI Universal'],
      ].map(([label,source,when,status,crs])=>'<article><strong>'+escapeHtml(label)+'</strong><small>Tietotila: '+escapeHtml(status)+'</small><small>Lähde: '+escapeHtml(source)+'</small><small>Tarkistus: '+escapeHtml(when||'Ei ilmoitettu')+' · '+escapeHtml(crs)+'</small></article>').join('');
      renderFacadeScaffoldPlans();renderDrawingReviews();
    };
    cornerPanel?.addEventListener('click',(event)=>{const button=event.target.closest('[data-corner-select]');if(!button)return;selectedScaffoldCornerKey=button.dataset.cornerSelect;renderCornerReviewPanel();});
    const saveCornerReview=(key,update)=>{let review=scaffoldCornerReviews.find((row)=>row.key===key);if(!review){review={key,checks:[],note:''};scaffoldCornerReviews.push(review);}update(review);review.checks=[...new Set(review.checks||[])];scaffoldProjectDirty=Boolean(activeScaffoldProject);const deliveryButton=$('#scaffoldDeliveryForm button[type=submit]');if(deliveryButton)deliveryButton.disabled=scaffoldProjectDirty;};
    cornerPanel?.addEventListener('change',(event)=>{const checkbox=event.target.closest('[data-corner-check]'),note=event.target.closest('[data-corner-note]');if(checkbox){const {cornerCheck:key,checkId}=checkbox.dataset;saveCornerReview(key,(review)=>{review.checks=review.checks||[];review.checks=checkbox.checked?[...review.checks,checkId]:review.checks.filter((id)=>id!==checkId);});renderCornerReviewPanel();}else if(note){saveCornerReview(note.dataset.cornerNote,(review)=>{review.note=note.value;});}});
    cornerPanel?.addEventListener('input',(event)=>{const note=event.target.closest('[data-corner-note]');if(note)saveCornerReview(note.dataset.cornerNote,(review)=>{review.note=note.value;});});
    const saveDrawingReview=(id,update)=>{let review=scaffoldDrawingReviews.find((row)=>row.id===id);if(!review){review={id,status:'unchecked',note:''};scaffoldDrawingReviews.push(review);}update(review);scaffoldProjectDirty=Boolean(activeScaffoldProject);const deliveryButton=$('#scaffoldDeliveryForm button[type=submit]');if(deliveryButton)deliveryButton.disabled=scaffoldProjectDirty;};
    drawingReviewList?.addEventListener('change',(event)=>{const select=event.target.closest('[data-drawing-review-id]');if(select){saveDrawingReview(select.dataset.drawingReviewId,(review)=>{review.status=select.value;});renderDrawingReviews();}});
    drawingReviewList?.addEventListener('input',(event)=>{const note=event.target.closest('[data-drawing-review-note]');if(note)saveDrawingReview(note.dataset.drawingReviewNote,(review)=>{review.note=note.value;});});
    form.addEventListener('input',()=>{scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();});form.addEventListener('change',()=>{scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();});form.addEventListener('submit',(event)=>{event.preventDefault();draw();});initScaffoldSelectionCursor(canvas,draw);
    $('#scaffoldTerrainFile')?.addEventListener('change',async(event)=>{
      const file=event.target.files?.[0];if(!file)return;const status=$('#scaffoldTerrainImportStatus');if(status)status.textContent=`Luen korkeusruudukkoa: ${file.name}…`;
      try{
        const grid=TelineDomain.parseAsciiGrid(await file.text());scaffoldTerrainGrid=grid;scaffoldTerrainFileMeta={filename:file.name,crs:$('#scaffoldTerrainCrs')?.value||'EPSG:3067',loadedAt:new Date().toISOString(),source:`Käyttäjän tuoma ASCII Grid · ${file.name}`};
        scaffoldTerrainAnalysisKey='';syncScaffoldTerrainAnalysis(true);if(status&&!scaffoldTerrainAnalysis)status.textContent=`Ruudukko ${file.name} luettiin (${grid.ncols} × ${grid.nrows}, ${grid.cellSizeM} m/solu). Valitse rakennus, jonka ympäristö sisältyy tiedostoon.`;
        scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();
      }catch(error){scaffoldTerrainGrid=null;scaffoldTerrainAnalysis=null;if(status)status.textContent=error.message||'Korkeusruudukkoa ei voitu lukea.';renderScaffoldTerrainMap();renderScaffoldTerrainSummary();}
    });
    $('#scaffoldTerrainCrs')?.addEventListener('change',()=>{if(!scaffoldTerrainGrid)return;if(scaffoldTerrainFileMeta)scaffoldTerrainFileMeta.crs=$('#scaffoldTerrainCrs').value;scaffoldTerrainAnalysisKey='';syncScaffoldTerrainAnalysis(true);scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();});
    $('#scaffoldFetchGround')?.addEventListener('click',async()=>{
      const ring=selectedBuildingFootprint()||[],status=$('#scaffoldInfoMapStatus'),button=$('#scaffoldFetchGround');if(ring.length<3){if(status)status.textContent='Valitse rakennuspolygonin sisältävä kohde ennen GTK-hakua.';return;}
      const x=ring.reduce((sum,point)=>sum+point[0],0)/ring.length,y=ring.reduce((sum,point)=>sum+point[1],0)/ring.length;
      if(button){button.disabled=true;button.textContent='Haetaan GTK:sta…';}
      try{
        const params=new URLSearchParams({x:String(x),y:String(y)}),response=await fetch('/api/gtk/soil-point?'+params),data=await response.json();if(!response.ok)throw new Error(data.error||'GTK:n maaperätietoa ei saatu.');
        scaffoldGroundData=data;scaffoldGroundDataBuildingId=String(selectedScaffoldBuilding?.id||'');
        const attrs=selectedScaffoldBuilding?.object?.attributes||selectedScaffoldBuilding?.object?.properties||{};attrs.groundData=data;
        renderScaffoldGroundData(data);scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();if(status)status.textContent=`GTK:n maaperäluokka haettu · mittakaava ${data.scale||'ei ilmoitettu'} · ${data.coverage==='mapped'?'maalajikuvio löytyi':'kartoitustieto puuttuu tästä pisteestä'}.`;
      }catch(error){if(status)status.textContent=error.message||'GTK:n maaperähaku epäonnistui.';}
      finally{if(button){button.disabled=false;button.textContent='Hae GTK:n maaperätieto';}syncScaffoldTerrainAnalysis();}
    });
    const refreshInstallationEstimate=()=>{const basis=scaffoldInstallationEstimateBasis({installationEstimateBasis:{enabled:Boolean($('#scaffoldInstallAuto')?.checked),dismantlingEnabled:Boolean($('#scaffoldDismantleAuto')?.checked),inspectionEnabled:Boolean($('#scaffoldInspectionAuto')?.checked),minutesPerPart:Number($('#scaffoldInstallMinutesPerPart')?.value),inspectionMinutesPerPart:Number($('#scaffoldInspectionMinutesPerPart')?.value),referenceHeightM:Number($('#scaffoldInstallReferenceHeight')?.value),heightIncreasePercentPer10M:Number($('#scaffoldInstallHeightIncrease')?.value),crewSize:Number($('#scaffoldInstallCrewSize')?.value)}});scaffoldPricingDraft={...scaffoldPricingDraft,installationEstimateBasis:basis};scaffoldProjectDirty=Boolean(activeScaffoldProject);const deliveryButton=$('#scaffoldDeliveryForm button[type=submit]');if(deliveryButton)deliveryButton.disabled=scaffoldProjectDirty;draw();};
    for(const id of ['scaffoldInstallAuto','scaffoldDismantleAuto','scaffoldInspectionAuto','scaffoldInstallMinutesPerPart','scaffoldInspectionMinutesPerPart','scaffoldInstallHeightIncrease','scaffoldInstallReferenceHeight','scaffoldInstallCrewSize'])$('#'+id)?.addEventListener('input',refreshInstallationEstimate);
    for(const id of ['scaffoldInstallAuto','scaffoldDismantleAuto','scaffoldInspectionAuto'])$('#'+id)?.addEventListener('change',refreshInstallationEstimate);
    $('#scaffoldUploadFile')?.addEventListener('click',()=>void uploadScaffoldFile().catch((error)=>toast(error.message)));
    $('#scaffoldSaveTemplate')?.addEventListener('click',()=>void saveScaffoldTemplate().catch((error)=>toast(error.message)));
    $('#scaffoldApplyTemplate')?.addEventListener('click',()=>void applyScaffoldTemplate().catch((error)=>toast(error.message)));
    $('#scaffoldGetRecommendation')?.addEventListener('click',()=>void loadScaffoldRecommendation().catch((error)=>toast(error.message)));
    $('#scaffoldApplyRecommendation')?.addEventListener('click',applyScaffoldRecommendation);
    form.elements.namedItem('customerId')?.addEventListener('change',(event)=>{const company=crmData?.companies?.find((row)=>row.id===event.target.value);if(company)form.elements.namedItem('customerName').value=company.name;});
    if(!scaffoldCustomerOptionsLoading&&Date.now()-scaffoldCustomerOptionsAt>30000){scaffoldCustomerOptionsLoading=true;crmRequest('/api/crm/bootstrap').then((data)=>{crmData=data;scaffoldCustomerOptionsAt=Date.now();if(currentPage==='scaffold')render();}).catch(()=>{}).finally(()=>{scaffoldCustomerOptionsLoading=false;});}
    if(!scaffoldTemplatesLoaded)void loadScaffoldTemplates();
    for(const [label,id] of [['Asennus','scaffoldInstallHours'],['Purku','scaffoldDismantleHours'],['Tarkastus','scaffoldInspectionHours']])$('#'+id)?.addEventListener('input',()=>{scaffoldLaborSources[label]='Käyttäjän muokkaama työarvio';updateScaffoldInstallationCrewEstimate({installation:$('#scaffoldInstallHours')?.value,dismantling:$('#scaffoldDismantleHours')?.value,inspection:$('#scaffoldInspectionHours')?.value},$('#scaffoldInstallCrewSize')?.value);});
    for(const id of ['scaffoldInstallHours','scaffoldDismantleHours','scaffoldInspectionHours','scaffoldLaborRate','scaffoldTransportQuantity','scaffoldTransportAmount','scaffoldOtherCosts','scaffoldMarginPercent','scaffoldVatPercent','scaffoldPriceValidUntil','scaffoldPriceEnteredBy','scaffoldLaborPriceSource','scaffoldTransportPriceSource','scaffoldOtherCostsPriceSource'])$('#'+id)?.addEventListener('input',()=>{scaffoldProjectDirty=Boolean(activeScaffoldProject);const deliveryButton=$('#scaffoldDeliveryForm button[type=submit]');if(deliveryButton)deliveryButton.disabled=scaffoldProjectDirty;const lmsStatus=$('#scaffoldLmsRevisionStatus');if(lmsStatus&&activeScaffoldProject)lmsStatus.textContent=`Tallennettu rev ${activeScaffoldProject.revision}: BOM ${(activeScaffoldProject.model.bom||[]).reduce((sum,line)=>sum+(Number(line.quantity)||0),0)} kpl. Hinta tai työarvio muuttui; tallenna uusi revisio ennen LMS-toimitusta.`;updateScaffoldCostSummary(TelineDomain.deriveHakiUniversal({targetLengthM:Number(form.elements.namedItem('length').value)||0,targetHeightM:Number(form.elements.namedItem('height').value)||0,platformLevels:form.elements.namedItem('platformLevels').value,loadClass:Number(form.elements.namedItem('loadClass').value)||3,bayCount:form.elements.namedItem('bayCount').value===''?null:Number(form.elements.namedItem('bayCount').value)}));});
    $('#scaffold3dPreview').addEventListener('click',(event)=>{
      const target=event.target.closest('[data-facade-index]')||event.target;
      if(target?.dataset?.facadeError){const status=$('#scaffoldModelStatus');if(status)status.textContent=target.dataset.facadeError;return;}
      if(!Number.isInteger(Number(target?.dataset?.facadeIndex)))return;
      const option=latestFacadeOptions.find((face)=>face.index===Number(target.dataset.facadeIndex));if(!option)return;
      if(stairTowerPlacementMode){
        const status=$('#scaffoldStairTowerStatus'),plan=facadeScaffoldPlans.find((row)=>row.source===option.source&&row.index===option.index);
        if(!plan){if(status)status.textContent=`Lisää ensin telinekokoonpano julkisivulle ${option.label}, sitten klikkaa tornin paikka.`;return;}
        const bayLengthM=Number($('#scaffoldStairTowerBay')?.value)||2.57,targetHeightM=Number($('#scaffoldStairTowerHeight')?.value)||20,widthM=Math.max(1.4,Number($('#scaffoldStairTowerWidth')?.value)||1.4);
        if(plan.lengthM+0.001<bayLengthM){if(status)status.textContent=`Julkisivu ${plan.label} on liian lyhyt ${bayLengthM.toFixed(2)} m:n porraskentälle.`;return;}
        let clickedPositionM=Number(target?.dataset?.edgePositionM);if(!Number.isFinite(clickedPositionM))clickedPositionM=Number(event.target?.dataset?.edgePositionM);if(!Number.isFinite(clickedPositionM))clickedPositionM=plan.lengthM/2;
        const positionM=Math.max(bayLengthM/2,Math.min(plan.lengthM-bayLengthM/2,clickedPositionM)),overlap=scaffoldStairTowers.some((tower)=>tower.source===option.source&&tower.index===option.index&&Math.abs(tower.positionM-positionM)<(tower.bayLengthM+bayLengthM)/2-0.001);
        if(overlap){if(status)status.textContent='Porrastorni menee päällekkäin aiemman tornin kanssa. Klikkaa julkisivulta toista kohtaa.';return;}
        const id=globalThis.crypto?.randomUUID?.()||`stair-tower-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        scaffoldStairTowers.push({id,source:option.source,index:option.index,label:plan.label,positionM,targetHeightM,bayLengthM,widthM});scaffoldProjectDirty=Boolean(activeScaffoldProject);stairTowerPlacementRemaining=Math.max(0,stairTowerPlacementRemaining-1);
        if(stairTowerPlacementRemaining===0){stairTowerPlacementMode=false;if(status)status.textContent=`Kaikki tornit sijoitettu. ${plan.label}: keskikohta ${positionM.toFixed(2)} m, mallikorkeus ${TelineDomain.deriveLayherStairTower({targetHeightM}).dimensions.modeledHeightM.toFixed(2)} m.`;}
        else if(status)status.textContent=`Torni sijoitettu (${scaffoldStairTowers.length}). Klikkaa vielä ${stairTowerPlacementRemaining} porrastornin paikkaa.`;
        draw();return;
      }
      chooseFacade(option,option.source);
    });
    $('#scaffoldStartStairTowerPlacement')?.addEventListener('click',()=>{
      const quantity=Number($('#scaffoldStairTowerQty')?.value),height=Number($('#scaffoldStairTowerHeight')?.value),width=Number($('#scaffoldStairTowerWidth')?.value),status=$('#scaffoldStairTowerStatus');
      if(!Number.isInteger(quantity)||quantity<1||quantity>20){if(status)status.textContent='Anna sijoitettavien tornien määräksi kokonaisluku 1–20.';return;}
      if(!Number.isFinite(height)||height<0.5||height>120){if(status)status.textContent='Anna tornin tavoitekorkeudeksi 0,5–120 m.';return;}
      if(!Number.isFinite(width)||width<1.4||width>5){if(status)status.textContent='Layher-ohjeen mukainen vähimmäisleveys on 1,40 m; enimmäisleveys tässä mallissa on 5 m.';return;}
      if(!facadeScaffoldPlans.length){if(status)status.textContent='Valitse julkisivu, lisää sille telinekokoonpano ja käynnistä porrastornien sijoitus uudelleen.';return;}
      stairTowerPlacementMode=true;stairTowerPlacementRemaining=quantity;if(status)status.textContent=`Sijoita ${quantity} porrastornia klikkaamalla telineellä varustettua julkisivua. Kukin porrasmoduuli vie ${Number($('#scaffoldStairTowerBay')?.value||2.57).toFixed(2)} m julkisivun pituudesta.`;
      const preview=$('#scaffold3dPreview');if(preview)preview.classList.add('scaffold-stairtower-placing');draw();
    });
    $('#scaffoldCancelStairTowerPlacement')?.addEventListener('click',()=>{stairTowerPlacementMode=false;stairTowerPlacementRemaining=0;const status=$('#scaffoldStairTowerStatus');if(status)status.textContent='Porrastornien sijoitus peruttiin.';$('#scaffold3dPreview')?.classList.remove('scaffold-stairtower-placing');draw();});
    const stairTowerList=$('#scaffoldStairTowerList');
    stairTowerList?.addEventListener('change',(event)=>{const input=event.target.closest('[data-stairtower-id][data-stairtower-field]');if(!input)return;const tower=scaffoldStairTowers.find((row)=>row.id===input.dataset.stairtowerId);if(!tower)return;const value=Number(input.value);if(input.dataset.stairtowerField==='targetHeightM'&&(!Number.isFinite(value)||value<0.5||value>120)){toast('Tornin korkeuden pitää olla välillä 0,5–120 m.');renderScaffoldStairTowers();return;}tower[input.dataset.stairtowerField]=value;scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();});
    stairTowerList?.addEventListener('click',(event)=>{const button=event.target.closest('[data-stairtower-remove]');if(!button)return;scaffoldStairTowers=scaffoldStairTowers.filter((tower)=>tower.id!==button.dataset.stairtowerRemove);scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();});
    $('#scaffoldFacadeOptions').addEventListener('click',(event)=>{const button=event.target.closest('[data-facade-index]');if(button)chooseFacade({facade:button.dataset.facade,edgeLength:button.dataset.edgeLength,facadeIndex:button.dataset.facadeIndex,direction:JSON.parse(button.dataset.facadeDirection||'null'),start:JSON.parse(button.dataset.faceStart||'null'),end:JSON.parse(button.dataset.faceEnd||'null'),ringSize:button.dataset.ringSize},button.dataset.facadeSource);});
    $('#scaffoldAddFacadePlan')?.addEventListener('click',()=>{
      if(!selectedScaffoldFacade||!Number.isInteger(Number(selectedScaffoldFacade.index))||!selectedScaffoldFacadeSource){toast('Valitse ensin rakennuksen julkisivu mallista.');return;}
      const source=selectedScaffoldFacadeSource,index=Number(selectedScaffoldFacade.index),exists=facadeScaffoldPlans.some((plan)=>plan.source===source&&plan.index===index);
      if(exists){toast('Tälle julkisivulle on jo oma telinekokoonpano. Muokkaa sen speksejä alla.');return;}
      const face=latestFacadeOptions.find((row)=>row.source===source&&row.index===index),values=Object.fromEntries(new FormData(form).entries());
      if(!face||face.lengthM<=0){toast('Julkisivun mitattu pituus puuttuu.');return;}
      facadeScaffoldPlans.push({id:`${source}-${index}`,source,index,label:face.label,lengthM:face.lengthM,direction:face.direction,start:face.start,end:face.end,ringSize:face.ringSize,system:'layher-allround',targetHeightM:Number(values.height)||0,loadClass:Number(values.loadClass)||3,platformLevels:String(values.platformLevels||'').split(/[;,\s]+/).filter(Boolean).map(Number),bayCount:values.bayCount===''||!Number.isInteger(Number(values.bayCount))||Number(values.bayCount)<0||Number(values.bayCount)>100?null:Number(values.bayCount)});
      scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();
    });
    const syncFacadePlanField=(event)=>{
      const card=event.target.closest('[data-facade-plan-index]'),field=event.target.closest('[data-facade-plan-field]');
      if(!card||!field)return;
      const plan=facadeScaffoldPlans[Number(card.dataset.facadePlanIndex)];if(!plan)return;
      const key=field.dataset.facadePlanField,next=key==='system'?field.value:key==='platformLevels'?field.value.split(/[;,\s]+/).filter(Boolean).map(Number):key==='bayCount'?(field.value===''?null:Number(field.value)):Number(field.value),current=plan[key],changed=Array.isArray(next)||Array.isArray(current)?JSON.stringify(next)!==JSON.stringify(current):next!==current;
      if(!changed)return;
      plan[key]=next;scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();
    };
    facadePlanList?.addEventListener('change',syncFacadePlanField);
    facadePlanList?.addEventListener('focusout',(event)=>{if(event.target.matches('[data-facade-plan-field]'))syncFacadePlanField(event);});
    facadePlanList?.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-facade-plan-action]');if(!button)return;
      const index=Number(button.dataset.facadePlanIndex),plan=facadeScaffoldPlans[index];if(!plan)return;
      if(button.dataset.facadePlanAction==='remove')facadeScaffoldPlans.splice(index,1);
      else if(button.dataset.facadePlanAction==='focus'){selectedScaffoldFacade={label:plan.label,length:plan.lengthM,index:plan.index,direction:plan.direction};selectedScaffoldFacadeSource=plan.source;form.elements.namedItem('length').value=plan.lengthM.toFixed(2);}
      scaffoldProjectDirty=Boolean(activeScaffoldProject);draw();
    });
    $('#scaffoldBuildingSearch')?.addEventListener('submit',async(event)=>{
      event.preventDefault();const params=new URLSearchParams(Object.fromEntries(new FormData(event.currentTarget).entries()));const status=$('#scaffoldBuildingStatus');status.textContent='Haetaan rakennuskohteita…';
      try{const r=await fetch('/api/helsinki/building-footprints?'+params),payload=await r.json();if(!r.ok)throw new Error(payload.error||'Rakennushaku epäonnistui.');const data=payload.data,rows=data?.CityObjects?Object.entries(data.CityObjects).map(([id,object])=>({id,object})):(data?.features||[]).map((object,i)=>({id:object.id||('kohde-'+(i+1)),object}));
        $('#scaffoldBuildingResults').innerHTML=rows.slice(0,30).map((row,i)=>'<button class=\"scaffold-building-option\" type=\"button\" data-building-index=\"'+i+'\"><strong>'+escapeHtml(row.object?.attributes?.name||row.object?.attributes?.gmlid||([row.object?.properties?.katunimi_suomi,row.object?.properties?.osoitenumero].filter(Boolean).join(' ')||((row.object?.properties?.tyyppi||'Rakennus')+' · tunnus '+(row.object?.properties?.ratu||row.object?.properties?.id||row.id))))+'</strong><small>'+escapeHtml(payload.format||'CityJSON')+' · '+escapeHtml(payload.crs||'EPSG:3879')+'</small></button>').join('')||'<p>Hakualueelta ei löytynyt rakennuksia.</p>';
        window._scaffoldBuildingRows=rows.slice(0,30).map((row)=>({...row,payload:{...payload,retrievedAt:new Date().toISOString(),sourceCrs:'EPSG:3879'}}));status.textContent=rows.length+' rakennuspolygonia haettu Helsingin rakennusrekisteristä.';
        $$('.scaffold-building-option').forEach((button)=>button.addEventListener('click',()=>{
          selectedScaffoldBuilding=window._scaffoldBuildingRows[Number(button.dataset.buildingIndex)];
          const attrs=selectedScaffoldBuilding.object.attributes||selectedScaffoldBuilding.object.properties||{},name=attrs.name||attrs.nimi||[attrs.katunimi_suomi,attrs.osoitenumero].filter(Boolean).join(' ')||attrs.gmlid||selectedScaffoldBuilding.id;
          const footprint=selectedBuildingFootprint()||[],metrics=footprint.length?TelineDomain.polygonMetrics(footprint):null;
          scaffoldBuildingGeometryApplied=Boolean(metrics?.longestSide);selectedScaffoldFacade=null;selectedScaffoldFacadeSource='';selectedScaffoldRoofFacades=[];facadeScaffoldPlans=[];scaffoldCornerReviews=[];scaffoldDrawingReviews=[];selectedScaffoldCornerKey='';scaffoldStairTowers=[];stairTowerPlacementMode=false;stairTowerPlacementRemaining=0;
          if(metrics?.longestSide){form.elements.namedItem('length').value=metrics.longestSide.lengthM.toFixed(2);form.elements.namedItem('buildingDepth').value=(metrics.secondarySide?.lengthM||0).toFixed(2);selectedScaffoldFacade={label:'Julkisivu '+(metrics.longestSide.index+1),length:metrics.longestSide.lengthM,index:metrics.longestSide.index};selectedScaffoldFacadeSource='building-footprint';}
          const floors=Number(attrs.i_kerrlkm||attrs.kerrosluku||0),attributeHeight=Number(attrs.measuredHeight||attrs.measured_height||attrs.height||0),verticalExtent=TelineDomain.cityJsonVerticalExtent(selectedScaffoldBuilding.object,selectedScaffoldBuilding.payload?.data),geometryHeight=Number(verticalExtent?.heightM)||0,sourceHeight=attributeHeight||geometryHeight,height=sourceHeight|| (floors>0?floors*3.1:0);
          if(height>0){form.elements.namedItem('buildingHeight').value=height.toFixed(2);form.elements.namedItem('buildingHeightStatus').value=sourceHeight?'source':'estimate';form.elements.namedItem('buildingHeightSource').value=attributeHeight?'Valitun 3D-aineiston korkeusominaisuus; alkuperäinen määritelmä tarkistettava':geometryHeight?`CityJSON-geometrian Z-laajuus ${verticalExtent.minZ.toFixed(2)}–${verticalExtent.maxZ.toFixed(2)} m · ${geometryHeight.toFixed(2)} m; malligeometria, tarkista korkeusjärjestelmä`:`Helsingin rakennusrekisteri · ${floors} kerrosta × 3,1 m/kerros (arvio; varmista piirustuksesta tai kohteessa)`;}
          form.elements.namedItem('name').value=name+' · teline';
          window._telinehallintaBuildingCard={address:name,parcel:attrs.c_kiinteistotunnus||attrs.kiinteistotunnus||'',properties:attrs,source:selectedScaffoldBuilding.payload?.source||'Helsingin rakennusrekisteri'};
          renderScaffoldBuildingCard($('#scaffoldInfoBuildingCard'),{title:name,properties:attrs,facts:Object.entries(attrs).slice(0,8),source:selectedScaffoldBuilding.payload?.source||'Helsingin rakennusrekisteri',crs:selectedScaffoldBuilding.payload?.crs||selectedScaffoldBuilding.payload?.sourceCrs||'EPSG:3879',retrievedAt:selectedScaffoldBuilding.payload?.retrievedAt||''});
          $('#scaffoldSelectedBuilding').innerHTML=`<strong>${escapeHtml(name)}</strong> · ${escapeHtml(selectedScaffoldBuilding.payload?.source||'Helsingin rakennusrekisteri')} · RATU ${escapeHtml(attrs.ratu||'—')} · ${metrics?.longestSide?`julkisivu ${metrics.longestSide.lengthM.toFixed(2)} m`:'polygonin mittaus epäonnistui'} · ${sourceHeight?'korkeus lähteestä':floors?`${floors} kerrosta, korkeusarvio ${height.toFixed(1)} m`:'korkeustieto puuttuu'} · tarkista ennen mitoitusta.`;
          form.dispatchEvent(new Event('input',{bubbles:true}));draw();
        }));
      }catch(error){status.textContent=error.message||'Rakennushaku epäonnistui.';}
    });
    $('#scaffoldProjectSelect')?.addEventListener('change',async(event)=>{if(!event.target.value){activeScaffoldProject=null;scaffoldProjectFiles=[];importedScaffoldObj=null;importedScaffoldFileId='';pendingScaffoldModelFile=null;scaffoldRecommendation=null;selectedScaffoldBuilding=null;selectedScaffoldFacade=null;selectedScaffoldFacadeSource='';selectedScaffoldRoofFacades=[];facadeScaffoldPlans=[];scaffoldCornerReviews=[];scaffoldDrawingReviews=[];selectedScaffoldCornerKey='';scaffoldStairTowers=[];stairTowerPlacementMode=false;stairTowerPlacementRemaining=0;scaffoldBuildingGeometryApplied=false;scaffoldLaborSources={Asennus:'Käyttäjän syöttämä työarvio',Purku:'Käyttäjän syöttämä työarvio',Tarkastus:'Käyttäjän syöttämä työarvio'};scaffoldPricingDraft={components:{},labor:[],transport:[],otherCosts:0,installationEstimateBasis:{...DEFAULT_INSTALLATION_ESTIMATE_BASIS}};form.reset();setScaffoldInstallationEstimateControls(scaffoldPricingDraft,true);draw();return;}try{const project=await scaffoldApi('/api/scaffold/projects/'+encodeURIComponent(event.target.value));applyScaffoldProject(project);scaffoldRecommendation=null;draw();render();}catch(error){toast(error.message);}});
    $('#scaffoldClearSelection')?.addEventListener('click',()=>{selectedScaffoldParts.clear();previewScaffoldParts.clear();draw();updateScaffoldSelectionStatus('Valinta tyhjennetty.');});
    if(!scaffoldProjectsLoaded)void loadScaffoldProjectRecords();
    if(activeScaffoldProject)applyScaffoldProject(activeScaffoldProject);draw();
  }

  function buildingExtent(feature, cityjson) {
    let coords=[];
    if(feature?.geometry?.coordinates){
      const walk=(value)=>{if(Array.isArray(value)&&value.length>=2&&value.slice(0,3).every((n)=>typeof n==='number'))coords.push(value);else if(Array.isArray(value))value.forEach(walk);};walk(feature.geometry.coordinates);
    } else {
      const vertices=cityjson?.vertices||[]; const transform=cityjson?.transform||{};
      const scale=transform.scale||[1,1,1], offset=transform.translate||[0,0,0];
      const visit=(value)=>{if(Array.isArray(value)&&value.length&&value.every((n)=>Number.isInteger(n))){for(const i of value){const v=vertices[i];if(v)coords.push(v.map((n,k)=>n*(scale[k]||1)+(offset[k]||0)));}}else if(Array.isArray(value))value.forEach(visit);};
      (feature?.geometry||[]).forEach((geometry)=>visit(geometry.boundaries));
    }
    if(!coords.length)return null;
    const xs=coords.map((v)=>v[0]),ys=coords.map((v)=>v[1]);
    const width=Math.max(...xs)-Math.min(...xs),depth=Math.max(...ys)-Math.min(...ys);
    return width>0&&depth>0?{width,depth}:null;
  }

  function convexHull(points) {
    const sorted=[...new Map(points.map((p)=>[`${p[0].toFixed(3)},${p[1].toFixed(3)}`,p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    if(sorted.length<3)return sorted;
    const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lower=[]; for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
    const upper=[]; for(const p of [...sorted].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
    lower.pop();upper.pop();return lower.concat(upper);
  }

  function selectedBuildingFootprint() {
    if(!selectedScaffoldBuilding)return null;
    const feature=selectedScaffoldBuilding.object, cityjson=selectedScaffoldBuilding.payload?.data;
    const geometry=feature?.geometry;
    if(geometry?.coordinates){
      const ring=geometry.type==='MultiPolygon'?geometry.coordinates[0]?.[0]:geometry.type==='Polygon'?geometry.coordinates[0]:null;
      if(Array.isArray(ring)&&ring.length>=3){
        const sourceCrs=selectedScaffoldBuilding.payload?.crs||selectedScaffoldBuilding.payload?.sourceCrs||'EPSG:3879';
        return TelineDomain.projectRing(ring,sourceCrs);
      }
    }
    const groundRing=TelineDomain.cityJsonGroundRing(feature,cityjson);
    if(groundRing?.length>=3)return TelineDomain.projectRing(groundRing,selectedScaffoldBuilding.payload?.crs||'EPSG:3879');
    const vertices=cityjson?.vertices||[], transform=cityjson?.transform||{}, scale=transform.scale||[1,1,1], offset=transform.translate||[0,0,0], coords=[];
    const visit=(node)=>{
      if(!Array.isArray(node))return;
      if(node.length&&node.every((n)=>Number.isInteger(n))){for(const index of node){const v=vertices[index];if(v)coords.push(v.map((n,k)=>n*(scale[k]??1)+(offset[k]??0)));}}
      else node.forEach(visit);
    };
    (Array.isArray(feature?.geometry)?feature.geometry:[]).forEach((surface)=>visit(surface.boundaries));
    return coords.length>=3?TelineDomain.projectRing(convexHull(coords.map((p)=>[p[0],p[1]])),selectedScaffoldBuilding.payload?.crs||'EPSG:3879'):null;
  }

  function drawBuildingMass(height) {
    const width=Math.max(1,Number($('#scaffoldLayoutForm [name=length]')?.value)||0), depth=Math.max(1,Number($('#scaffoldLayoutForm [name=buildingDepth]')?.value)||0);
    if(importedScaffoldObj)return objMassSvg(importedScaffoldObj);
    const footprint=selectedBuildingFootprint()||[[0,0],[width,0],[width,depth],[0,depth]];
    const minX=Math.min(...footprint.map((p)=>p[0])),maxX=Math.max(...footprint.map((p)=>p[0])),minY=Math.min(...footprint.map((p)=>p[1])),maxY=Math.max(...footprint.map((p)=>p[1]));
    const bx=maxX-minX||width, by=maxY-minY||depth, rise=Math.max(0,height);
    const scale=Math.min(410/Math.max(bx+by*.52,1),230/rise), project=(x,y,z)=>[160+(x-minX)*scale+(y-minY)*scale*.52,350-(y-minY)*scale*.28-z*scale];
    const ground=footprint.map(([x,y])=>project(x,y,0)), roof=footprint.map(([x,y])=>project(x,y,rise)), fmt=(pts)=>pts.map((p)=>p.map((n)=>n.toFixed(1)).join(',')).join(' ');
    const wallFaces=footprint.map((p,i)=>{const next=footprint[(i+1)%footprint.length], edge=Math.hypot(next[0]-p[0],next[1]-p[1]);return {i,edge,points:[ground[i],ground[(i+1)%ground.length],roof[(i+1)%roof.length],roof[i]],order:(ground[i][1]+ground[(i+1)%ground.length][1])/2};}).sort((a,b)=>b.order-a.order);
    let svg='<svg viewBox="0 0 720 410" role="img" aria-label="Rakennusmassamalli; klikkaa julkisivua">';
    for(const face of wallFaces){const label=`Julkisivu ${face.i+1}`,next=footprint[(face.i+1)%footprint.length];svg+=`<polygon class="scaffold-mass-face ${selectedScaffoldFacade?.label===label?'selected':''}" data-facade-index="${face.i}" data-facade="${label}" data-edge-length="${face.edge}" data-facade-direction="${escapeHtml(JSON.stringify([next[0]-footprint[face.i][0],next[1]-footprint[face.i][1]]))}" tabindex="0" role="button" aria-label="Valitse ${label}, pituus ${face.edge.toFixed(1)} metriä" points="${fmt(face.points)}"><title>${label} · ${face.edge.toFixed(1)} m</title></polygon>`;}
    svg+=`<polygon class="scaffold-mass-roof" points="${fmt(roof)}"><title>Rakennuksen yläpinta</title></polygon><text x="18" y="25" class="scaffold-mass-source">${importedScaffoldObj?'3D-malli':selectedScaffoldBuilding?'Helsingin rakennusdata':'Mitoista muodostettu massa'} · ${rise>0?rise.toFixed(1)+' m':'korkeus puuttuu · pohjageometria'}</text></svg>`;
    return svg;
  }

  function parseObjMass(source) {
    return TelineDomain.parseObjMass(source);
  }

  function objMassSvg(model) {
    const {vertices,faces,min,max}=model, width=max[0]-min[0]||1,height=max[1]-min[1]||1,depth=max[2]-min[2]||1;
    const scale=Math.min(420/(width+depth*.65),250/height), project=([x,y,z])=>[180+(x-min[0])*scale+(z-min[2])*scale*.65,340-(y-min[1])*scale-(z-min[2])*scale*.3];
    const triangles=faces.map((face)=>{const p=face.map((i)=>vertices[i]);return {p:p.map(project),depth:p.reduce((s,v)=>s+v[1],0)};}).sort((a,b)=>b.depth-a.depth);
    const minY=min[1],maxY=max[1];
    const sides=TelineDomain.objFacadeSides(model).map((side)=>{const points=[[side.start[0],minY,side.start[1]],[side.end[0],minY,side.end[1]],[side.end[0],maxY,side.end[1]],[side.start[0],maxY,side.start[1]]];return {...side,edge:side.lengthM,points:points.map(project),order:points.reduce((sum,point)=>sum+project(point)[1],0)/points.length};}).sort((a,b)=>a.order-b.order);
    let svg='<svg viewBox="0 0 720 410" role="img" aria-label="Tuotu OBJ-rakennusmalli; klikkaa julkisivua">';
    for(const tri of triangles)svg+=`<polygon class="scaffold-obj-surface" points="${tri.p.map((p)=>p.map((v)=>v.toFixed(1)).join(',')).join(' ')}"/>`;
    for(const side of sides)svg+=`<polygon class="scaffold-obj-facade ${selectedScaffoldFacadeSource==='obj-hull'&&selectedScaffoldFacade?.label===side.label?'selected':''}" data-facade-index="${side.index}" data-facade="${side.label}" data-edge-length="${side.edge}" data-facade-direction="${escapeHtml(JSON.stringify([side.end[0]-side.start[0],side.end[1]-side.start[1]]))}" tabindex="0" role="button" aria-label="Valitse ${side.label}, pohjahyllyn pituus ${side.edge.toFixed(2)} metriä" points="${side.points.map((p)=>p.map((v)=>v.toFixed(1)).join(',')).join(' ')}"><title>${side.label} · pohjahylly ${side.edge.toFixed(2)} m</title></polygon>`;
    return `${svg}<text x="18" y="25" class="scaffold-mass-source">Tuotu OBJ · klikattava sivu mitataan pohjahyllystä; tarkista mittayksikkö</text></svg>`;
  }

  function renderScaffoldCatalog() {
    const container=$('#scaffoldCatalogResults'); if(!container)return;
    const q=($('#scaffoldCatalogQuery')?.value||'').toLocaleLowerCase('fi');
    const maker=$('#scaffoldCatalogMaker')?.value||'';
    const matches=scaffoldCatalog.filter((item)=>(!maker||item['Valmistaja']===maker)&&(!q||Object.values(item).some((v)=>String(v).toLocaleLowerCase('fi').includes(q))));
    const shown=matches.slice(0,20);
    $('#scaffoldCatalogCount').textContent=`Näytetään ${shown.length} / ${matches.length} osaa${maker?` · ${maker}`:''}${matches.length>20?' · tarkenna hakua nähdäksesi muut osat':''}`;
    container.innerHTML=shown.length?shown.map((item)=>`<article class="scaffold-catalog-item"><strong>${escapeHtml(item['Nimike / variantti']||'Komponentti')}</strong><span>${escapeHtml(item['Valmistaja']||'')} · ${escapeHtml(item['Järjestelmä / katalogi']||'')} · ${escapeHtml(item['Tuotenumero / viite']||'')}</span><small>${escapeHtml(item['Mitta / nimellismitta']||'Mittaa ei ilmoitettu')} · ${escapeHtml(item['Paino (kg)']??'Painoa ei ilmoitettu')} kg · lähde: ${escapeHtml(item['Katalogiversio']||'versio tarkistettava')}</small></article>`).join(''):'<p class="muted small">Ei osumia. Rajaa valmistajaa tai muuta hakua.</p>';
  }

  function renderScaffoldManufacturers(manufacturers) {
    const grid=$('#scaffoldManufacturerCards');if(!grid)return;
    grid.innerHTML=manufacturers.map((item)=>{
      const name=String(item.manufacturer||'');
      const short=name.split(/\s+/).map((part)=>part[0]).join('').slice(0,3).toUpperCase();
      const logo=Boolean(item.logoUrl);
      const brand=logo?`<img src="${escapeHtml(item.logoUrl)}" alt="${escapeHtml(name)} logo" loading="lazy"><span class="scaffold-logo-fallback" hidden>${escapeHtml(short)}</span>`:`<span class="scaffold-text-wordmark">${escapeHtml(name)}</span>`;
      const source=item.brandSource||item.catalogUrl||'';
      return `<article class="scaffold-manufacturer-card"><button type="button" class="scaffold-manufacturer-select" data-manufacturer="${escapeHtml(name)}" aria-pressed="false"><span class="scaffold-manufacturer-logo">${brand}</span><strong>${escapeHtml(name)}</strong><span>${escapeHtml(item.systems||'Järjestelmä ei merkitty')}</span><small>${Number(item.componentCount||0).toLocaleString('fi-FI')} komponenttia</small></button>${source?`<a class="scaffold-brand-source" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer" aria-label="Avaa ${escapeHtml(name)} tuotemerkin lähde">Lähde ↗</a>`:''}</article>`;
    }).join('');
    $$('img',grid).forEach((img)=>img.addEventListener('error',()=>{img.hidden=true;const fallback=img.parentElement.querySelector('.scaffold-logo-fallback');if(fallback)fallback.hidden=false;}));
    $$('.scaffold-manufacturer-select',grid).forEach((button)=>button.addEventListener('click',()=>{
      const maker=button.dataset.manufacturer;$('#scaffoldCatalogMaker').value=maker;$('#scaffoldCatalogQuery').value='';
      syncScaffoldManufacturerSelection();
      renderScaffoldCatalog();$('#scaffoldCatalogQuery').focus({preventScroll:true});$('#scaffoldCatalogResults').scrollIntoView({behavior:'smooth',block:'nearest'});
    }));
  }

  function syncScaffoldManufacturerSelection() {
    const maker=$('#scaffoldCatalogMaker')?.value||'';
    $$('.scaffold-manufacturer-select').forEach((button)=>{const selected=button.dataset.manufacturer===maker;button.setAttribute('aria-pressed',String(selected));button.closest('.scaffold-manufacturer-card')?.classList.toggle('selected',selected);});
  }

  function weatherView() {
    const alerts = state.alerts;
    const warningCards = alerts.length
      ? alerts.map((alert) => `<article class="alert-card"><i class="alert-level ${alert.level === 'Korkea' ? 'high' : ''}" aria-hidden="true"></i><div><strong>${escapeHtml(alert.title)}</strong><p>${escapeHtml(alert.site)} · ${escapeHtml(alert.details || alert.level)}</p></div><button class="button button-sm" data-action="remove-alert" data-id="${escapeHtml(alert.id)}" type="button" aria-label="Poista varoitus">×</button></article>`).join('')
      : '<div class="weather-empty" style="min-height:160px"><div><div class="weather-empty-icon" aria-hidden="true">✓</div><strong>Ei aktiivisia varoituksia</strong><p>Voit lisätä sää- tai turvallisuushuomion työmaan vastuuhenkilöille.</p></div></div>';
    return `${heading('Sää ja aika · Helsinki', 'Ajantasainen säämalli, paikallinen kello aikavyöhykkeellä Europe/Helsinki ja työmaiden varoitukset.', `<button class="button" data-action="refresh-weather" type="button">↻ Päivitä sää</button><button class="button button-primary" data-action="new-alert" type="button">＋ Lisää varoitus</button>`)}
      <div class="weather-layout">
        <div class="side-stack">
          <section class="panel weather-live-panel"><div class="panel-head"><div><h2>Helsingin säätilanne</h2><p>Nykytila · automaattinen päivitys 15 minuutin välein</p></div><span class="tag blue">60,17° N · 24,94° E</span></div><div class="panel-body"><div class="weather-live-overview"><img class="weather-live-icon" data-weather-icon src="assets/icons/weather/unknown.svg" alt="Säätä haetaan" width="64" height="64"><span><small>NYKYINEN TILANNE</small><strong data-weather-condition>Haetaan säätilannetta…</strong><b data-weather-temperature>— °C</b></span></div><div class="weather-live-facts"><div><span>Tuntuu kuin</span><b data-weather-apparent>—</b></div><div><span>Ilmankosteus</span><b data-weather-humidity>—</b></div><div><span>Tuuli</span><b data-weather-wind>—</b></div><div><span>Sademäärä</span><b data-weather-precipitation>—</b></div></div><div class="weather-clock-row"><span>Suomen paikallisaika</span><strong data-weather-clock>${formatHelsinkiClock()}</strong></div><small class="weather-data-status" data-weather-source-status>Haetaan Open-Meteon säätietoja…</small><small class="weather-data-valid" data-weather-updated></small><p class="privacy-note">Open-Meteon nykytila perustuu 15 minuutin säämalliaineistoon. Kello käyttää Europe/Helsinki-aikavyöhykettä ja vaihtaa automaattisesti kesä- ja talviaikaan. <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Säätiedon lähde ↗</a></p></div></section>
          <section class="panel map-panel"><div class="panel-head"><div><h2>Kartat</h2><p>Helsingin karttapalvelu</p></div><a class="button button-sm" href="index.html">Karttarakentaja ↗</a></div><iframe class="map-frame" style="height:300px" src="https://kartta.hel.fi/embed/?layers=Karttasarja&amp;setlanguage=fi&amp;easting=25496825&amp;northing=6673044&amp;resolution=6" title="Helsingin kartta" loading="lazy"></iframe><div class="map-attribution"><span>© Helsingin kaupunki</span><span><a href="matrix-coderain.html">Lataa karttakuva ↗</a></span></div></section>
        </div>
        <section class="panel"><div class="panel-head"><div><h2>Manuaaliset varoitukset</h2><p>${alerts.length ? `${alerts.length} aktiivista huomiota` : 'Työmaiden turvallisuushuomiot'}</p></div><span class="tag ${alerts.length ? 'amber' : 'green'}">${alerts.length ? `${alerts.length} aktiivista` : 'Ei varoituksia'}</span></div><div class="panel-body">${warningCards}</div></section>
      </div>`;
  }

  async function loadApiKeyList() {
    const list = $('#apiKeyList');
    if (!list) return;
    list.textContent = 'Ladataan avainluetteloa…';
    try {
      const response = await fetch('/api/local/api-keys', { headers: { Accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Avainluetteloa ei voitu hakea.');
      const keys = Array.isArray(payload.keys) ? payload.keys : [];
      if (!keys.length) {
        list.innerHTML = '<p class="muted small">Tallennettuja API-avaimia ei vielä ole.</p>';
        return;
      }
      list.innerHTML = keys.map((key) => {
        const id = escapeHtml(key.id);
        return `<article class="api-key-row" data-api-key-row="${id}"><div class="api-key-info"><strong>${escapeHtml(key.name)}</strong><code data-api-key-secret data-masked="${escapeHtml(key.masked)}">${escapeHtml(key.masked)}</code></div><div class="api-key-actions"><button class="button button-sm" data-action="reveal-api-key" data-id="${id}" type="button" aria-label="Näytä ${escapeHtml(key.name)}-avain">👁 Näytä</button><button class="button button-danger button-sm" data-action="delete-api-key" data-id="${id}" type="button">Poista</button></div></article>`;
      }).join('');
    } catch (error) {
      list.innerHTML = `<p class="api-key-error">${escapeHtml(error.message || 'API-avainten hallinta ei ole käytettävissä.')}</p>`;
    }
  }

  async function revealApiKey(button) {
    const row = button.closest('[data-api-key-row]');
    const secret = row?.querySelector('[data-api-key-secret]');
    if (!row || !secret) return;
    if (button.dataset.revealed === 'true') {
      secret.textContent = secret.dataset.masked;
      button.dataset.revealed = 'false';
      button.textContent = '👁 Näytä';
      return;
    }
    button.disabled = true;
    try {
      const response = await fetch(`/api/local/api-keys/${encodeURIComponent(button.dataset.id)}/reveal`, {
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Avainta ei voitu näyttää.');
      secret.textContent = payload.value;
      button.dataset.revealed = 'true';
      button.textContent = '🙈 Piilota';
    } catch (error) {
      toast(error.message || 'Avainta ei voitu näyttää.');
    } finally {
      button.disabled = false;
    }
  }

  async function deleteApiKey(button) {
    const row = button.closest('[data-api-key-row]');
    const name = row?.querySelector('.api-key-info strong')?.textContent || 'API-avain';
    if (!window.confirm(`Poistetaanko ${name}?`)) return;
    button.disabled = true;
    try {
      const response = await fetch(`/api/local/api-keys/${encodeURIComponent(button.dataset.id)}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Avainta ei voitu poistaa.');
      toast(`${name}-avain poistettiin.`);
      loadApiKeyList();
    } catch (error) {
      button.disabled = false;
      toast(error.message || 'Avainta ei voitu poistaa.');
    }
  }

  function settingsView() {
    const tab = state.settingsTab || 'general';
    const tabs = [['general', '◎ Yleiset'], ['cursor', '↖ Hiiren osoitin'], ['profile', '◉ Profiili'], ['company', '▦ Yritys'], ['notifications', '♧ Ilmoitukset'], ['apiKeys', '🔑 API-avaimet'], ['privacy', '◈ Tietosuoja'], ['accessibility', '⚙ Saavutettavuus'], ['support', '◉ Tuki']];
    let content = '';
    if (tab === 'general') content = `<h2>Yleiset asetukset</h2><p>Sovelluksen perusasetukset</p><div class="form-grid"><div class="form-field"><label for="prefLanguage">Kieli</label><select id="prefLanguage"><option value="fi" ${state.preferences.language === 'fi' ? 'selected' : ''}>Suomi (FI)</option><option value="en" ${state.preferences.language === 'en' ? 'selected' : ''}>English (EN)</option><option value="sv" ${state.preferences.language === 'sv' ? 'selected' : ''}>Svenska (SV)</option></select></div><div class="form-field"><label for="prefTheme">Teema</label><select id="prefTheme"><option value="light" ${state.preferences.theme === 'light' ? 'selected' : ''}>Vaalea</option><option value="dark" ${state.preferences.theme === 'dark' ? 'selected' : ''}>Tumma</option></select></div><div class="form-field"><label for="prefPalette">Värimaailma</label><select id="prefPalette"><option value="christiania" ${state.preferences.palette === 'christiania' ? 'selected' : ''}>Keltainen / punainen</option><option value="traditional" ${state.preferences.palette === 'traditional' ? 'selected' : ''}>Perinteinen</option><option value="engineering" ${state.preferences.palette === 'engineering' ? 'selected' : ''}>Tekninen</option><option value="future" ${state.preferences.palette === 'future' ? 'selected' : ''}>Tulevaisuus</option><option value="ancient" ${state.preferences.palette === 'ancient' ? 'selected' : ''}>Antiikki</option><option value="paperwork" ${state.preferences.palette === 'paperwork' ? 'selected' : ''}>Paperityö</option><option value="spring" ${state.preferences.palette === 'spring' ? 'selected' : ''}>Kevät</option><option value="summer" ${state.preferences.palette === 'summer' ? 'selected' : ''}>Kesä</option><option value="autumn" ${state.preferences.palette === 'autumn' ? 'selected' : ''}>Syksy</option><option value="winter" ${state.preferences.palette === 'winter' ? 'selected' : ''}>Talvi</option></select><small class="muted">Väripaletti ei muuta vaaleaa/tummaa näyttötilaa.</small></div><div class="form-field"><label for="prefUnits">Mittayksiköt</label><select id="prefUnits"><option value="metric" ${state.preferences.units === 'metric' ? 'selected' : ''}>Metrijärjestelmä (m, kg)</option><option value="imperial" ${state.preferences.units === 'imperial' ? 'selected' : ''}>Imperial (ft, lb)</option></select></div><div class="form-field"><label for="floorHeight">Rakennusten kerroskorkeus (m)</label><input id="floorHeight" type="number" min="2" max="8" step="0.1" value="${escapeHtml(state.preferences.floorHeight)}"><small class="muted">Karttanäkymän arvioitu kerroskorkeus.</small></div></div><div class="switch-row"><span><strong>Automaattinen tallennus</strong><small>Tallenna muutokset automaattisesti tähän selaimeen.</small></span><input id="prefAutosave" type="checkbox" ${state.preferences.autosave ? 'checked' : ''} aria-label="Automaattinen tallennus"></div><div class="settings-save-row"><span class="muted small" id="settingsSaved">Asetukset tallentuvat selaimeen.</span><button class="button button-primary" data-action="save-settings" type="button">▣ Tallenna</button></div>`;
    else if (tab === 'cursor') content = `<h2>Hiiren osoitin</h2><p>Valitse räikkäosoitin tai laitteen oletusosoitin. Räikkä vaihtaa automaattisesti tumman teräksen ja vaalean teeman tumman version välillä.</p><div class="cursor-theme-preview-grid"><article class="cursor-theme-preview cursor-theme-light"><div class="cursor-preview-surface"><img src="assets/ui-packs/ratchet-light.png" alt="Tumma räikkäosoitin vaalealla taustalla" loading="lazy"></div><div><strong>Vaalea teema</strong><small>Tummanharmaa räikkä</small></div></article><article class="cursor-theme-preview cursor-theme-dark"><div class="cursor-preview-surface"><img src="assets/ui-packs/ratchet-silver.png" alt="Hopeinen räikkäosoitin tummalla taustalla" loading="lazy"></div><div><strong>Tumma teema</strong><small>Hopeinen räikkä</small></div></article></div><div class="form-grid cursor-settings-grid"><div class="form-field"><label for="prefCursorStyle">Osoitintyyli</label><select id="prefCursorStyle"><option value="ratchet" ${state.preferences.cursorStyle !== 'system' ? 'selected' : ''}>Telineräikkä · teeman mukaan</option><option value="system" ${state.preferences.cursorStyle === 'system' ? 'selected' : ''}>Laitteen oletusosoitin</option></select><small class="muted">Räikkä toimii työtilan sivuilla ja sovittaa värin teemaan.</small></div><div class="form-field"><label for="prefCursorSize">Osoittimen koko</label><select id="prefCursorSize"><option value="44" ${Number(state.preferences.cursorSize) === 44 ? 'selected' : ''}>Pieni · 44 px</option><option value="56" ${Number(state.preferences.cursorSize || 56) === 56 ? 'selected' : ''}>Normaali · 56 px</option><option value="72" ${Number(state.preferences.cursorSize) === 72 ? 'selected' : ''}>Suuri · 72 px</option></select><small class="muted">Koko tallentuu tämän selaimen asetuksiin.</small></div></div><div class="settings-save-row"><span class="muted small" id="settingsSaved">Asetukset tallentuvat selaimeen.</span><button class="button button-primary" data-action="save-settings" type="button">▣ Tallenna osoitinasetukset</button></div>`;
    else if (tab === 'apiKeys') content = `<h2>Rajapintojen API-avaimet</h2><p>Tallenna esimerkiksi HILMA-rajapinnan tilausavain paikalliseen, salattuun avainholviin. <a href="https://hns-hilma-prod-apim.developer.azure-api.net/signup" target="_blank" rel="noopener">Avaa HILMA Developer Portal ↗</a></p><form id="apiKeyForm" class="api-key-form"><div class="form-grid"><div class="form-field"><label for="apiKeyName">Palvelu</label><input id="apiKeyName" name="name" value="HILMA" maxlength="50" autocomplete="off" required></div><div class="form-field"><label for="apiKeyValue">API-avain</label><input id="apiKeyValue" name="value" type="password" minlength="8" maxlength="512" autocomplete="new-password" required></div></div><button class="button button-primary" type="submit">🔑 Tallenna avain</button><p class="api-key-status" id="apiKeyStatus" role="status" aria-live="polite"></p></form><div class="api-key-list" id="apiKeyList" aria-live="polite">Ladataan avainluetteloa…</div><div class="privacy-note"><strong>Tallennus:</strong> Node-palvelin salaa avaimet AES-256-GCM-menetelmällä. Avaintiedostot ovat projektin paikallisessa, Gitistä pois rajatussa kansiossa ja käyttöliittymän salausrajapinta sallii vain saman koneen yhteydet. Avain ei tallennu selaimen localStorageen. Käytä tätä paikallisessa työtilassa, älä julkisessa verkkopalvelussa.</div>`;
    else if (tab === 'profile') content = `<h2>Profiilin oletukset</h2><p>Paikallisen demo-käyttäjän näyttönimi ja rooli.</p><div class="form-grid"><div class="form-field"><label for="settingsName">Näyttönimi</label><input id="settingsName" value="${escapeHtml(state.profile.name)}"></div><div class="form-field"><label for="settingsRole">Rooli</label><input id="settingsRole" value="${escapeHtml(state.profile.role)}"></div></div><div class="settings-save-row"><span class="muted small">Tiedot eivät siirry verkkopalveluun.</span><button class="button button-primary" data-action="save-profile-settings" type="button">Tallenna</button></div>`;
    else if (tab === 'company') content = `<h2>Yrityksen asetukset</h2><p>Työtilan demoympäristön yritystiedot.</p><div class="form-grid"><div class="form-field"><label>Työtila</label><input value="Telinepalvelut · demo" readonly></div><div class="form-field"><label>Kohteiden määrä</label><input value="${SITES.length} esimerkkityömaata" readonly></div></div><div class="privacy-note">Oikean palvelun yritysrekisteriä, tunnuksia tai käyttäjiä ei kopioida paikalliseen työtilaan.</div>`;
    else if (tab === 'notifications') content = `<h2>Ilmoitukset</h2><p>Paikallisen näkymän muistutukset.</p><label class="switch-row"><span><strong>Sertifikaattien voimassaolomuistutus</strong><small>Näytä vanhenevat pätevyydet sertifikaattinäkymässä.</small></span><input type="checkbox" checked aria-label="Sertifikaattimuistutukset"></label><label class="switch-row"><span><strong>Määräaikojen korostus</strong><small>Näytä myöhässä olevat tehtävät työtilassa.</small></span><input type="checkbox" checked aria-label="Määräaikojen korostus"></label>`;
    else if (tab === 'privacy') content = `<h2>Tietosuoja ja tallennus</h2><p>Tämän paikallisen kopion tallennuskäytäntö.</p><div class="privacy-note"><strong>Tallennuspaikka:</strong> selaimen paikallinen localStorage (${STORAGE_KEY}).<br><strong>Verkkopyynnöt:</strong> kartat ja kaupunkiaineistot ladataan Helsingin karttapalvelusta; työtilan esimerkkitiedot eivät lähde selaimesta.<br><strong>Kirjautuminen:</strong> tähän näkymään ei ole kytketty Base44-kirjautumista.</div><div class="settings-save-row"><span class="muted small">Esimerkkitiedot voi poistaa selaimen asetuksista.</span><button class="button button-danger" data-action="reset-demo" type="button">Palauta esimerkkitila</button></div>`;
    else if (tab === 'accessibility') content = `<h2>Saavutettavuus</h2><p>Näkymä huomioi laitteen liikeasetuksen, näppäimistökohdistuksen ja ruudun koon.</p><label class="switch-row"><span><strong>Vähennä animaatioita</strong><small>Käytä laitteen asetusta, jos se on valittuna.</small></span><input type="checkbox" checked disabled aria-label="Vähennetty liike laitteen asetuksen mukaan"></label>`;
    else content = `<h2>Tuki</h2><p>Työtilan käyttö</p><div class="privacy-note">Tämä on paikallinen käyttöliittymäkopio. Kartta-, 3D-rakennus-, pistepilvi- ja karttakuvaominaisuudet löytyvät Kartat ja paikkatieto -osiosta.</div>`;
    return `${heading('Asetukset', 'Hallitse työtilan ulkoasua ja paikallisia oletuksia.')}<label class="sr-only" for="settingsSearch">Etsi asetusta</label><input class="search-input" id="settingsSearch" type="search" placeholder="Etsi asetusta…" value="${escapeHtml(settingsSearchText)}" style="margin-bottom:13px"><div class="settings-tabs" role="tablist">${tabs.map(([key, label]) => `<button type="button" role="tab" data-action="settings-tab" data-tab="${key}" class="${tab === key ? 'active' : ''}">${label}</button>`).join('')}</div><section class="panel settings-card">${content}</section>`;
  }

  function gisView() {
    const choices=MANAGEMENT_DESTINATIONS.map(([key,label])=>'<option value="'+escapeHtml(key)+'">'+escapeHtml(label)+'</option>').join('');
    return `${heading('GeoBIM · Kartat ja paikkatieto','Suomen viranomaisaineistot, paikalliset aluejaot ja työmaan karttamerkit. Valitse aineisto kartalle viereisestä hakemistosta.', '<a class="button" href="?page=mapdata" data-page="mapdata">Suomen kartta-aineistot</a>')}
      <div class="geo-data-layout"><section class="panel geo-workspace-panel"><div class="panel-head"><div><h2>Työmaakartta</h2><p>Karttamerkit tallentuvat palvelimelle · aineistovalinnat säilyvät tässä selaimessa</p></div><span class="tag green">Suomi</span></div><div class="panel-body">
      <div class="geo-toolbar"><div class="geo-mode-tabs"><button class="button" data-action="geo-mode" data-mode="map" type="button">2D-kartta</button><button class="button" data-action="geo-mode" data-mode="coderain" type="button">CodeRain · Helsinki</button><button class="button" data-action="geo-mode" data-mode="city3d" type="button">3D · Helsinki</button></div><div class="geo-mode-tabs"><button class="button button-sm" data-action="geo-fit-finland" type="button">Koko Suomi</button><button class="button button-sm" data-action="geo-fit-helsinki" type="button">Helsinki</button></div></div>
      <div class="geo-marker-controls"><select id="geoMarkerModule" aria-label="Hallintamoduuli">${choices}</select><button class="button button-primary" data-action="geo-place-toggle" type="button">＋ Sijoita kuvake kartalle</button><span class="muted small">Työmaamerkit · Helsinki</span></div>
      <p id="geoWorkspaceStatus" role="status">Lisää kartta-aineisto hakemistosta tai valitse moduuli ja sijoita sen kuvake kartalle.</p><div class="geo-map-view"><div id="geoWorkspaceMap" class="geo-map-canvas" data-geo-view="map"></div><iframe id="geoCodeRainFrame" class="geo-map-iframe" data-geo-view="coderain" title="Helsingin CodeRain-kartta" loading="lazy" hidden></iframe><iframe id="geoCity3dFrame" class="geo-map-iframe" data-geo-view="city3d" title="Helsingin 3D-kaupunkikartta" allow="fullscreen" loading="lazy" hidden></iframe></div>
      <div class="geo-map-attribution">Aineistotasojen lähteet ja käyttöehdot näkyvät kartan alareunassa ja aineistokorteissa. Karttamerkit EPSG:3879 · pohjakartta © OpenStreetMap contributors.</div><div id="geoMarkerList" class="geo-marker-list">Ladataan karttamerkkejä…</div></div></section>${window.TelineMapData.markup({compact:true})}</div>
      <section class="panel"><div class="panel-head"><div><h2>Muut paikkatietotyökalut</h2></div></div><div class="panel-body"><div class="tool-link-grid"><a class="tool-link-card" href="?page=mapdata" data-page="mapdata">Suomen aineistot ja QGIS-lataukset</a><a class="tool-link-card" href="index.html">Helsingin karttarakentaja ↗</a><a class="tool-link-card" href="pointcloud.html">LiDAR-pistepilvi ↗</a><a class="tool-link-card" href="gallery.html">Helsingin karttatasogalleria ↗</a></div></div></section>`;
  }

  function mapDataView() {
    return `${heading('Suomen kartta-aineistot','Hae viranomaiskarttoja ja latauslähteitä, valitse aineisto työmaakartalle tai lataa QGIS-paketti.', '<a class="button button-primary" href="?page=gis" data-page="gis">Avaa työmaakartta</a>')}${window.TelineMapData.markup()}`;
  }

  function setGeoMapMode(mode) {
    if(!['map','coderain','city3d'].includes(mode))return;
    if (mode !== 'map' && geoWorkspaceMap) {
      const center = geoWorkspaceMap.getCenter();
      if (center.lat < 60 || center.lat > 60.45 || center.lng < 24.5 || center.lng > 25.5) {
        toast('CodeRain ja 3D-kaupunkikartta ovat Helsingin aineistoja. Valitse ensin Helsinki.');
        mode = 'map';
      }
    }
    state.geoMapView=mode;persist();
    $$('[data-geo-view]').forEach((item)=>item.hidden=item.dataset.geoView!==mode);
    $$('.geo-mode-tabs [data-mode]').forEach((item)=>item.classList.toggle('button-primary',item.dataset.mode===mode));
    if(geoWorkspaceMap&&mode==='map')setTimeout(()=>geoWorkspaceMap.invalidateSize(),60);
    if(!geoWorkspaceMap||mode==='map')return;
    const c=geoWorkspaceMap.getCenter(),xy=TelineDomain.projectCoordinate([c.lng,c.lat],'EPSG:4326');
    const resolution=Math.min(64,Math.max(.5,156543*Math.cos(c.lat*Math.PI/180)/Math.pow(2,geoWorkspaceMap.getZoom())));
    if(mode==='coderain')$('#geoCodeRainFrame').src='matrix-coderain.html?embed=1&easting='+xy[0].toFixed(2)+'&northing='+xy[1].toFixed(2)+'&resolution='+resolution.toFixed(2);
    if(mode==='city3d')$('#geoCity3dFrame').src='https://kartta.hel.fi/embed/?'+new URLSearchParams({layers:'Karttasarja,3D-cesium-terrain,3D-cesium-buildings',easting:String(Math.round(xy[0])),northing:String(Math.round(xy[1])),resolution:resolution.toFixed(2),allow3d:'2',setlanguage:'fi'});
  }

  function geoMarkerIcon(row){
    const glyph=PAGE_META[row.moduleKey]?.icon||'⌂';
    return L.divIcon({className:'geo-isometric-icon-wrap',iconSize:[40,46],iconAnchor:[20,42],html:'<span class="geo-isometric-icon" aria-hidden="true"><i class="geo-cube-side"></i><b>'+escapeHtml(glyph)+'</b></span>'});
  }
  async function saveGeoMarker(input) {
    const saved=await scaffoldApi('/api/geo/management-markers',{method:'POST',body:JSON.stringify(input)});
    if(!geoMarkerLayer)return saved;
    let entry=geoMarkerObjects.get(saved.id);
    if(!entry){const latlng=TelineDomain.unprojectCoordinate([saved.easting,saved.northing]),layer=L.marker(latlng,{draggable:true,icon:geoMarkerIcon(saved)}).addTo(geoMarkerLayer);entry={marker:saved,layer};geoMarkerObjects.set(saved.id,entry);layer.on('dragend',async(event)=>{const ll=event.target.getLatLng(),xy=TelineDomain.projectCoordinate([ll.lng,ll.lat],'EPSG:4326');try{await saveGeoMarker({...entry.marker,easting:xy[0],northing:xy[1],source:'Siirretty kartalla · EPSG:4326 → EPSG:3879'});}catch(error){toast(error.message);}});}
    entry.marker=saved;entry.layer.setLatLng(TelineDomain.unprojectCoordinate([saved.easting,saved.northing]));entry.layer.bindPopup('<strong>'+escapeHtml(saved.title)+'</strong><br><small>'+saved.easting.toFixed(2)+', '+saved.northing.toFixed(2)+' EPSG:3879</small>');renderGeoMarkerList();return saved;
  }

  function renderGeoMarkerList(){
    const el=$('#geoMarkerList');if(!el)return;
    const rows=Array.from(geoMarkerObjects.entries());
    el.innerHTML=rows.map(([id,row])=>'<article class=\"geo-marker-row\"><span class=\"geo-iso-mini\">⌂</span><div><strong>'+escapeHtml(row.marker.title)+'</strong><small>'+escapeHtml(row.marker.moduleKey)+' · '+row.marker.easting.toFixed(2)+', '+row.marker.northing.toFixed(2)+' EPSG:3879</small></div><button class=\"button button-sm\" data-action=\"geo-focus-marker\" data-id=\"'+escapeHtml(id)+'\" type=\"button\">Näytä</button><button class=\"button button-sm\" data-action=\"geo-delete-marker\" data-id=\"'+escapeHtml(id)+'\" type=\"button\">Poista</button></article>').join('')||'<span class=\"muted small\">Karttamerkkejä ei ole vielä.</span>';
  }

  function initGeoWorkspace(){
    const el=$('#geoWorkspaceMap');if(!el||!window.L)return;
    geoWorkspaceMap=L.map(el).setView(state.geoMapCenter||[60.1699,24.9384],state.geoMapZoom||15);
    const map=geoWorkspaceMap;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>'}).addTo(geoWorkspaceMap);
    geoMarkerLayer=L.layerGroup().addTo(geoWorkspaceMap);
    geoWorkspaceMap.on('click',async(event)=>{if(!geoPlaceMarkerMode)return;const key=$('#geoMarkerModule').value,row=MANAGEMENT_DESTINATIONS.find((item)=>item[0]===key),xy=TelineDomain.projectCoordinate([event.latlng.lng,event.latlng.lat],'EPSG:4326');try{await saveGeoMarker({moduleKey:key,title:row?.[1]||key,easting:xy[0],northing:xy[1],crs:'EPSG:3879',source:'Karttavalinta · WGS84 → EPSG:3879'});geoPlaceMarkerMode=false;const button=$('[data-action=\"geo-place-toggle\"]');if(button)button.textContent='＋ Sijoita kuvake kartalle';$('#geoWorkspaceStatus').textContent='Merkki tallennettu EPSG:3879-koordinaateissa.';}catch(error){$('#geoWorkspaceStatus').textContent=error.message;}});
    geoWorkspaceMap.on('moveend',()=>{const c=geoWorkspaceMap.getCenter();state.geoMapCenter=[c.lat,c.lng];state.geoMapZoom=geoWorkspaceMap.getZoom();persist();});
    scaffoldApi('/api/geo/management-markers').then((data)=>{if(geoWorkspaceMap!==map||!geoMarkerLayer)return;for(const row of data.markers||[]){const marker=L.marker(TelineDomain.unprojectCoordinate([row.easting,row.northing]),{draggable:true,icon:geoMarkerIcon(row)}).addTo(geoMarkerLayer);const entry={marker:row,layer:marker};geoMarkerObjects.set(row.id,entry);marker.bindPopup('<strong>'+escapeHtml(row.title)+'</strong><br><small>'+row.easting.toFixed(2)+', '+row.northing.toFixed(2)+' EPSG:3879</small>');marker.on('dragend',async(event)=>{const ll=event.target.getLatLng(),xy=TelineDomain.projectCoordinate([ll.lng,ll.lat],'EPSG:4326');try{await saveGeoMarker({...row,easting:xy[0],northing:xy[1],source:'Siirretty kartalla · WGS84 → EPSG:3879'});}catch(error){toast(error.message);}});}geoMarkersLoaded=true;renderGeoMarkerList();}).catch((error)=>{if(geoWorkspaceMap===map&&$('#geoWorkspaceStatus'))$('#geoWorkspaceStatus').textContent=error.message;});
    setGeoMapMode(state.geoMapView||'map');setTimeout(()=>geoWorkspaceMap.invalidateSize(),60);
    void window.TelineMapData.mount($('#mapDataCatalogue'), {map,compact:true,onMapRequest:()=>setGeoMapMode('map')});
  }

  function crmView() {
    if (!crmLoaded || !crmData) return `${heading('CRMS · Asiakkuuksien hallinta', 'Customer Relationship Management System · yritykset, myyntimahdollisuudet ja rakennuskohteet tallentuvat palvelimelle.')}<section class="panel"><div class="panel-body">${crmLoading ? 'Ladataan asiakkuustietoja…' : `<p class="privacy-note">${escapeHtml(crmLoadError || 'Asiakastietoja ei ole vielä ladattu.')}</p><button class="button button-primary" data-action="crm-retry-load" type="button">Yritä uudelleen</button>`}</div></section>`;
    const opportunities = crmData.opportunities || [];
    const companies = crmData.companies || [];
    const buildings = crmData.buildings || [];
    const drawings = crmData.drawings || [];
    const totalValue = opportunities.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const formatMoney = (value) => new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value) || 0);
    const stageCount = (stage) => opportunities.filter((item) => item.stage === stage).length;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const dueDate = (item) => String(item.next_action_due ?? item.nextActionDue ?? '').slice(0,10);
    const followUpOrder = (a,b) => dueDate(a).localeCompare(dueDate(b)) || String(a.company || '').localeCompare(String(b.company || ''), 'fi');
    const openFollowUps = opportunities.filter((item) => String(item.next_action ?? item.nextAction ?? '').trim());
    const overdueFollowUps = openFollowUps.filter((item) => dueDate(item) && dueDate(item) < todayKey).sort(followUpOrder);
    const dueTodayFollowUps = openFollowUps.filter((item) => dueDate(item) === todayKey).sort(followUpOrder);
    const upcomingFollowUps = openFollowUps.filter((item) => dueDate(item) > todayKey).sort(followUpOrder);
    const stageOptions = (selected) => CRM_STAGES.map((stage) => `<option value="${escapeHtml(stage)}" ${selected === stage ? 'selected' : ''}>${escapeHtml(stage)}</option>`).join('');
    const categoryNames = { manufacturer: 'Valmistaja', services: 'Palvelut', auxiliary: 'Aputoimittaja', subcontractor: 'Aliurakoitsija', consulting: 'Konsultointi', design: 'Suunnittelu', other: 'Muu' };
    const rankWeights = { tradition: 20, revenueEur: 25, workforce: 20, marketSharePct: 20, futurePoints: 15 };
    const rankEligible = companies.filter((company) => {
      const p = company.profile || {};
      const hasNumber = (key) => p[key] != null && p[key] !== '' && Number.isFinite(Number(p[key]));
      return p.profileStatus !== 'needs-review' && hasNumber('foundedYear') && Number.isInteger(Number(p.foundedYear)) && hasNumber('revenueEur') && hasNumber('workforce') && hasNumber('marketSharePct') && hasNumber('futurePoints') && Boolean(p.profileSourceUrl) && Boolean(p.accountsSourceUrl || p.revenueSourceUrl) && Boolean(p.workforceSourceUrl) && Boolean(p.marketShareSourceUrl) && Boolean(p.futureSourceUrl);
    });
    const companyRanks = new Map();
    for (const category of new Set(rankEligible.map((company) => company.profile.category || 'other'))) {
      const group = rankEligible.filter((company) => (company.profile.category || 'other') === category);
      if (group.length < 2) continue;
      const values = (company, key) => key === 'tradition' ? new Date().getFullYear() - Number(company.profile.foundedYear) : Number(company.profile[key]);
      const ranges = Object.keys(rankWeights).map((key) => { const all = group.map((company) => values(company,key)); return [key,Math.min(...all),Math.max(...all)]; });
      const scores = group.map((company) => {
        const criterionScores = Object.fromEntries(ranges.map(([key,min,max]) => [key,max === min ? 50 : ((values(company,key)-min)/(max-min))*100]));
        const score = Object.entries(rankWeights).reduce((sum,[key,weight]) => sum + criterionScores[key] * weight / 100,0);
        return { company, score };
      }).sort((a,b) => b.score-a.score || a.company.name.localeCompare(b.company.name,'fi'));
      scores.forEach(({company,score},index) => companyRanks.set(company.id,{rank:index+1,score:Math.round(score)}));
    }
    const companyCards = companies.map((company) => {
      const profile = company.profile || {};
      const ranking = companyRanks.get(company.id);
      const category = profile.category || 'other';
      const statusLabel = profile.profileStatus === 'verified' ? 'Lähteellä vahvistettu' : profile.profileStatus === 'needs-review' ? 'Tarkistettava' : profile.profileStatus === 'catalog' ? 'Katalogimerkintä' : 'CRM-tietue';
      const metric = (label, value, suffix = '') => `<div><small>${label}</small><strong>${value == null || value === '' ? '—' : `${escapeHtml(value)}${suffix}`}</strong></div>`;
      const contacts = (company.contacts || []).map((contact) => `<li><strong>${escapeHtml(contact.name)}</strong>${contact.role ? ` · ${escapeHtml(contact.role)}` : ''}${contact.email ? ` · <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>` : ''}${contact.phone ? ` · ${escapeHtml(contact.phone)}` : ''}</li>`).join('');
      const addresses = (company.addresses || []).map((address) => `<li>${address.is_primary ? '<b>Ensisijainen · </b>' : ''}${escapeHtml(address.label ? `${address.label}: ` : '')}${escapeHtml(address.address)}${address.source_url ? ` · <a href="${escapeHtml(address.source_url)}" target="_blank" rel="noopener noreferrer">lähde ↗</a>` : ''}</li>`).join('');
      return `<article class="crm-company-card" data-crm-company-card data-category="${escapeHtml(category)}" data-search="${escapeHtml(`${company.name} ${company.business_id || ''} ${profile.manufacturerSystem || ''}`.toLocaleLowerCase('fi'))}"><header><div><span class="tag ${profile.profileStatus === 'needs-review' ? 'amber' : profile.profileStatus === 'verified' ? 'green' : 'blue'}">${escapeHtml(statusLabel)}</span><h3>${escapeHtml(company.name)}</h3><small>${escapeHtml(categoryNames[category] || category)}${company.business_id ? ` · Y-tunnus ${escapeHtml(company.business_id)}` : ''}</small></div><strong class="crm-company-rank">${ranking ? `#${ranking.rank} · ${ranking.score}/100` : '—'}<small>${ranking ? 'vertailupisteet' : profile.futurePoints != null ? `${escapeHtml(profile.futurePoints)} tulevaisuuspistettä · ei vertailurankia` : 'ei vielä vertailurankia'}</small></strong></header><p class="crm-company-system">${escapeHtml(profile.manufacturerSystem || profile.futureNotes || 'Järjestelmä / toimiala tarkistettava')}</p><div class="crm-company-metrics">${metric('Perustettu', profile.foundedYear)}${metric('Liikevaihto', profile.revenueEur == null ? null : formatMoney(profile.revenueEur), profile.revenueYear ? ` · ${profile.revenueYear}` : '')}${metric('Henkilöstö', profile.workforce, profile.workforceYear ? ` · ${profile.workforceYear}` : '')}${metric('Markkinaosuus', profile.marketSharePct, '%')}${metric('Viimeisin tilinpäätös', profile.latestAccountsYear)}${metric('Tulevaisuuspisteet', profile.futurePoints,' / 100')}</div><p class="hint">Vertailu lasketaan saman kategorian täydellisistä tietueista: perinne 20%, liikevaihto 25%, henkilöstö 20%, markkinaosuus 20% ja tulevaisuuspisteet 15%. Kaikilta viideltä arvolta vaaditaan lähde; puutteellisia kortteja ei järjestetä.</p>${profile.sourceUrl ? `<a href="${escapeHtml(profile.sourceUrl)}" target="_blank" rel="noopener noreferrer">Yrityksen / katalogin lähde ↗</a>` : ''}${profile.accountsSourceUrl ? `<a href="${escapeHtml(profile.accountsSourceUrl)}" target="_blank" rel="noopener noreferrer">Tilinpäätöslähde ↗</a>` : ''}<details><summary>Yhteystiedot ja osoitteet (${(company.contacts || []).length} yhteyshenkilöä · ${(company.addresses || []).length} osoitetta)</summary><ul>${contacts || '<li>Yhteyshenkilöitä ei ole lisätty.</li>'}</ul><ul>${addresses || (company.address ? `<li>${escapeHtml(company.address)}</li>` : '<li>Osoitteita ei ole lisätty.</li>')}</ul><form class="crm-company-contact-form" data-company-id="${escapeHtml(company.id)}"><input name="name" required placeholder="Yhteyshenkilö"><input name="role" placeholder="Rooli"><input name="email" type="email" placeholder="Sähköposti"><input name="phone" placeholder="Puhelin"><input name="sourceUrl" type="url" placeholder="Lähdelinkki"><button class="button button-sm" type="submit">Lisää kontakti</button></form><form class="crm-company-address-form" data-company-id="${escapeHtml(company.id)}"><input name="label" placeholder="Osoitteen nimi / toimipiste"><input name="address" required placeholder="Katuosoite, postinumero ja kaupunki"><input name="sourceUrl" type="url" placeholder="Lähdelinkki"><button class="button button-sm" type="submit">Lisää osoite</button></form></details></article>`;
    }).join('');
    const companyProfileForm = `<form id="crmCompanyProfileForm" class="crm-create-form crm-company-create-form"><h3>Päivitä yrityskortin lähteistetyt tiedot</h3><label>Yritys<select name="companyId" required>${companies.map((company)=>`<option value="${escapeHtml(company.id)}">${escapeHtml(company.name)}</option>`).join('')}</select></label><label>Kategoria<select name="category">${Object.entries(categoryNames).map(([value,label])=>`<option value="${value}">${escapeHtml(label)}</option>`).join('')}</select></label><label>Perustamisvuosi<input name="foundedYear" type="number" min="1800" max="${new Date().getFullYear()}"></label><label>Liikevaihto (€)<input name="revenueEur" type="number" min="0" step="1000"></label><label>Liikevaihdon tilikausi<input name="revenueYear" type="number" min="1800" max="${new Date().getFullYear()}"></label><label>Henkilöstömäärä<input name="workforce" type="number" min="0" step="1"></label><label>Henkilöstötiedon vuosi<input name="workforceYear" type="number" min="1800" max="${new Date().getFullYear()}"></label><label>Markkinaosuus (%)<input name="marketSharePct" type="number" min="0" max="100" step="0.1"></label><label>Viimeisin tilinpäätösvuosi<input name="latestAccountsYear" type="number" min="1800" max="${new Date().getFullYear()}"></label><label>Tulevaisuuspisteet (0–100)<input name="futurePoints" type="number" min="0" max="100" step="1"></label><label class="crm-wide">Tulevaisuusarvion perustelu<textarea name="futureNotes" maxlength="1000" placeholder="Arvio, päiväys ja perustelun lähde"></textarea></label><label>Lähde yritystiedoille<input name="profileSourceUrl" type="url" placeholder="https://…"></label><label>Lähde liikevaihdolle / tilinpäätökselle<input name="accountsSourceUrl" type="url" placeholder="https://…"></label><label>Lähde henkilöstölle<input name="workforceSourceUrl" type="url" placeholder="https://…"></label><label>Lähde markkinaosuudelle<input name="marketShareSourceUrl" type="url" placeholder="https://…"></label><label>Lähde tulevaisuuspisteille<input name="futureSourceUrl" type="url" placeholder="https://…"></label><button class="button button-primary" type="submit">Päivitä yrityskortti</button></form>`;
    const followUpRows = (items, label, period, overdue = false) => items.map((item) => {
      const due = dueDate(item);
      const lateDays = overdue ? Math.floor((new Date(`${todayKey}T00:00:00Z`) - new Date(`${due}T00:00:00Z`)) / 86400000) : 0;
      const dueLabel = due ? `${label}: ${formatDate(due)}${overdue ? ` · ${lateDays} pv myöhässä` : ''}` : label;
      return `<article class="crm-followup-row ${overdue ? 'overdue' : ''}" data-follow-up-period="${period}"><div><strong>${escapeHtml(item.company || 'Yritys')} · ${escapeHtml(item.title)}</strong><span>${escapeHtml(item.next_action ?? item.nextAction ?? '')}</span><small>${escapeHtml(dueLabel)}</small></div><label class="crm-reschedule"><span>Siirrä nykyinen tehtävä</span><input type="date" value="${escapeHtml(due)}" data-crm-reschedule-date="${escapeHtml(item.id)}" aria-label="Uusi eräpäivä: ${escapeHtml(item.title)}"></label><label class="crm-completion-note"><span>Tulos (valinnainen)</span><input type="text" maxlength="500" data-crm-completion-note="${escapeHtml(item.id)}" placeholder="Esim. soitto tehty"></label><label class="crm-next-action"><span>Seuraava tehtävä (valinnainen)</span><input type="text" maxlength="300" data-crm-next-action="${escapeHtml(item.id)}" placeholder="Esim. lähetä tarjous"></label><label class="crm-next-due"><span>Seuraavan määräpäivä</span><input type="date" data-crm-next-due="${escapeHtml(item.id)}" aria-label="Seuraavan tehtävän määräpäivä: ${escapeHtml(item.title)}"></label><button class="button button-sm" data-action="crm-open-opportunity" data-id="${escapeHtml(item.id)}" type="button">Avaa</button><button class="button button-sm" data-action="crm-reschedule-action" data-id="${escapeHtml(item.id)}" type="button">Siirrä</button><button class="button button-sm button-primary" data-action="crm-complete-action" data-id="${escapeHtml(item.id)}" type="button">Kirjaa tehdyksi</button></article>`;
    }).join('');
    const rows = opportunities.map((item) => {
      const nextAction = item.next_action ?? item.nextAction ?? '';
      const due = item.next_action_due ?? item.nextActionDue ?? '';
      const ratu = item.building_ratu ?? item.buildingRatu ?? '';
      const syncStatus = item.sync_status || item.syncStatus || 'not-eligible';
      const syncLabel = syncStatus === 'waiting-contract' ? 'ScaffoldingOS: sopimus puuttuu' : syncStatus === 'failed' ? 'ScaffoldingOS: vienti epäonnistui' : syncStatus === 'synced' ? 'ScaffoldingOS: viety' : 'Ei vientiä';
      const selected = crmExpandedId === item.id;
      const activities = crmActivities[item.id] || [];
      const projectLink = item.source === 'scaffold-project' && item.source_id ? `<a href="/?page=scaffold&amp;projectId=${encodeURIComponent(item.source_id)}">Avaa telineprojekti ↗</a>` : '';
      const sourceAmount = item.procurement_estimated_value != null ? `${new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 }).format(Number(item.procurement_estimated_value))} ${item.procurement_currency || ''}`.trim() : '';
      const tenderDetails = item.source === 'hilma' || item.source === 'ted' ? [item.procurement_type, item.cpv_codes ? `CPV ${item.cpv_codes}` : '', sourceAmount ? `Ilmoitettu arvo ${sourceAmount}` : ''].filter(Boolean).join(' · ') : '';
      return `<tr class="crm-opportunity-row ${item.review_required ? 'needs-review' : ''}" data-crm-stage-value="${escapeHtml(item.stage || '')}"><td><strong>${escapeHtml(item.company || 'Yritys')}</strong><small>${escapeHtml(item.title)}${item.businessId ? ` · Y-tunnus ${escapeHtml(item.businessId)}` : ''}</small><small>${escapeHtml(item.source || 'manual')}${item.is_demo ? ' · esimerkkitieto' : ''}${item.review_required ? ` · tarkista: ${escapeHtml(item.review_note || 'tietue')}` : ''}</small>${projectLink ? `<small>${projectLink}</small>` : ''}${tenderDetails ? `<small>${escapeHtml(tenderDetails)}</small>` : ''}</td><td><select class="crm-stage-select" data-crm-stage="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.title)} myyntivaihe">${stageOptions(item.stage)}</select></td><td><input class="crm-inline-input crm-value-input" type="number" min="0" step="100" value="${Number(item.value) || 0}" data-crm-patch="value" data-id="${escapeHtml(item.id)}" aria-label="Arvio euroina">${sourceAmount ? `<small>Hankinnan arvo: ${escapeHtml(sourceAmount)}</small>` : ''}</td><td>${item.procurement_deadline ? `<small class="crm-deadline">HILMA-määräaika: ${escapeHtml(formatDate(String(item.procurement_deadline).slice(0,10)))}</small>` : ''}<input class="crm-inline-input" value="${escapeHtml(nextAction)}" data-crm-patch="nextAction" data-id="${escapeHtml(item.id)}" placeholder="Seuraava toimi" aria-label="Seuraava toimi"><input class="crm-inline-input" type="date" value="${escapeHtml(due)}" data-crm-patch="nextActionDue" data-id="${escapeHtml(item.id)}" aria-label="Seuraavan toimen määräpäivä"></td><td><input class="crm-inline-input" value="${escapeHtml(ratu)}" data-crm-patch="buildingRatu" data-id="${escapeHtml(item.id)}" placeholder="RATU-tunnus" aria-label="Rakennuksen RATU-tunnus"><small>${escapeHtml(syncLabel)}</small></td><td><button class="button button-sm" data-action="crm-activities" data-id="${escapeHtml(item.id)}" type="button">${selected ? 'Sulje tiedot' : 'Avaa'}</button><button class="button button-sm" data-action="crm-delete-opportunity" data-id="${escapeHtml(item.id)}" type="button">Poista</button></td></tr>${selected ? `<tr class="crm-detail-row"><td colspan="6"><div class="crm-detail-grid"><section><h3>Yrityksen tiedot</h3><label>Yhteyshenkilö<input data-crm-company-field="contact" data-company-id="${escapeHtml(item.company_id)}" value="${escapeHtml(item.contact || '')}"></label><label>Sähköposti<input data-crm-company-field="email" data-company-id="${escapeHtml(item.company_id)}" type="email" value="${escapeHtml(item.email || '')}"></label><p class="hint">Yritys yhdistyy Y-tunnuksella. Osoitepiste tallentuu vasta karttaosuman valinnan jälkeen.</p></section><section><h3>Aktiviteetit</h3><form class="crm-activity-form" data-crm-activity-form="${escapeHtml(item.id)}"><input name="summary" required maxlength="1000" placeholder="Kirjaa puhelu, viesti tai muu tehty toimi"><button class="button button-sm button-primary" type="submit">Kirjaa</button></form><div class="crm-activity-list">${activities.map((activity) => `<article><strong>${escapeHtml(activity.kind)}</strong><span>${escapeHtml(activity.summary)}</span><small>${formatDate((activity.created_at || '').slice(0,10))}</small></article>`).join('') || '<small class="hint">Ei aktiviteetteja.</small>'}</div></section></div></td></tr>` : ''}`;
    }).join('');
    const features = crmData.mapFeatures || [];
    const wms = new URL('https://kartta.hel.fi/ws/geoserver/avoindata/wms');
    wms.search = new URLSearchParams({ SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.1.1', LAYERS: 'Opaskartta_Helsinki', STYLES: '', FORMAT: 'image/png', TRANSPARENT: 'false', SRS: 'EPSG:3879', BBOX: `${CRM_MAP_BOUNDS.minX},${CRM_MAP_BOUNDS.minY},${CRM_MAP_BOUNDS.maxX},${CRM_MAP_BOUNDS.maxY}`, WIDTH: '1200', HEIGHT: '720' }).toString();
    const pins = features.filter((feature) => Number.isFinite(Number(feature.x)) && Number.isFinite(Number(feature.y)) && Number(feature.x) >= CRM_MAP_BOUNDS.minX && Number(feature.x) <= CRM_MAP_BOUNDS.maxX && Number(feature.y) >= CRM_MAP_BOUNDS.minY && Number(feature.y) <= CRM_MAP_BOUNDS.maxY).map((feature) => {
      const left = ((Number(feature.x) - CRM_MAP_BOUNDS.minX) / (CRM_MAP_BOUNDS.maxX - CRM_MAP_BOUNDS.minX)) * 100;
      const top = (1 - (Number(feature.y) - CRM_MAP_BOUNDS.minY) / (CRM_MAP_BOUNDS.maxY - CRM_MAP_BOUNDS.minY)) * 100;
      const opportunity = opportunities.find((item) => item.id === feature.opportunityId || (feature.type === 'company' && item.company_id === feature.id));
      return `<button class="crm-map-pin ${feature.type === 'building' ? 'building' : ''}" type="button" style="left:${left}%;top:${top}%" title="${escapeHtml(feature.label)}" data-action="crm-open-opportunity" data-id="${escapeHtml(opportunity?.id || '')}"><span>${feature.type === 'building' ? '⌂' : '●'}</span><small>${escapeHtml(feature.label)}</small></button>`;
    }).join('');
    const addressOptions = companies.map((company) => `<option value="${escapeHtml(company.id)}">${escapeHtml(company.name)}${company.business_id ? ` · ${escapeHtml(company.business_id)}` : ''}</option>`).join('');
    const drawingRows = drawings.map((drawing) => `<tr><td><strong>${escapeHtml(drawing.title)}</strong><small>${escapeHtml(drawing.ratu || 'RATU puuttuu · tarkista')} · ${escapeHtml(drawing.kind || '')}</small></td><td>${escapeHtml(drawing.revision || '—')}</td><td><a href="${escapeHtml(drawing.url)}" target="_blank" rel="noopener noreferrer">Avaa viite ↗</a></td><td>${drawing.review_required ? '<span class="tag amber">Tarkistettava</span>' : '<span class="tag green">Liitetty</span>'}</td><td><button class="button button-sm" data-action="crm-delete-drawing" data-id="${escapeHtml(drawing.id)}" type="button">Poista</button></td></tr>`).join('');
    const syncItems = crmData.sync || [];
    return `${heading('CRMS · Asiakkuuksien hallinta', 'Customer Relationship Management System · yritykset, hankintamahdollisuudet, Helsinki-sijainnit ja RATU-piirustusviitteet.', `<a class="button" href="/company-locations.html">Avaa Suomen sijaintikartta ↗</a><a class="button button-primary" href="/api/crm/export.csv">Vie asiakkuudet CSV</a>`)}${crmNotice ? `<p class="privacy-note crm-notice">${escapeHtml(crmNotice)}</p>` : ''}${crmLoadError ? `<p class="privacy-note crm-error">${escapeHtml(crmLoadError)}</p>` : ''}${workspaceArtHero('CRMS · CUSTOMER RELATIONS', 'Asiakkuudet lasipintaisessa talossa', 'Yhdistä yritykset, asiakastapaamiset, työmaakohteet ja myyntimahdollisuudet samaan näkymään.', 'assets/illustrations/crm-glass-office-isometric.png', 'Isometrinen lasipintainen asiakastalo, jossa asiakkaat ja työmaan edustaja tapaavat', `<a class="button button-primary" href="#crmCompanyDirectory">Avaa yrityskortit</a><a class="button" href="/company-locations.html">Suomen sijaintikartta</a><a class="button" href="#crmOpportunityForm">＋ Lisää mahdollisuus</a>`)}<div class="metric-grid">${metric('◎','Yrityksiä',companies.length,'asiakkuustietokannassa','blue')}${metric('↗','Mahdollisuudet',opportunities.length,'myyntiputkessa','green')}${metric('€','Putken arvo',formatMoney(totalValue),'arvioidut mahdollisuudet','amber')}${metric('⇢','ScaffoldingOS-vienti',syncItems.length,syncItems.length ? 'odottaa sopimuksen vahvistusta' : 'API-sopimus vahvistamatta','purple')}</div>
      <section class="panel crm-directory-panel" id="crmCompanyDirectory"><div class="panel-head"><div><h2>Yritys- ja valmistajakortit</h2><p>${companies.length} yritystä · 13 nykyistä valmistajakatalogin nimeä, Talhu lisätty ja Moson odottaa tunnistusta</p></div><span class="tag blue">CRM-osoitekirja</span></div><div class="panel-body"><div class="crm-directory-toolbar"><label>Hae yritystä<input id="crmCompanySearch" type="search" placeholder="Nimi, Y-tunnus tai järjestelmä"></label><label>Kategoria<select id="crmCompanyCategory"><option value="">Kaikki kategoriat</option>${Object.entries(categoryNames).map(([value,label])=>`<option value="${value}">${escapeHtml(label)}</option>`).join('')}</select></label></div><div class="crm-company-grid">${companyCards || '<p class="hint">Yrityskortteja ei ole vielä.</p>'}</div><form id="crmCompanyCardForm" class="crm-create-form crm-company-create-form"><h3>Lisää yrityskortti</h3><label>Yrityksen nimi *<input name="name" required maxlength="200"></label><label>Y-tunnus<input name="businessId" pattern="[0-9]{7}-[0-9]" placeholder="1234567-8"></label><label>Kategoria<select name="category">${Object.entries(categoryNames).map(([value,label])=>`<option value="${value}">${escapeHtml(label)}</option>`).join('')}</select></label><label>Yhteyshenkilö<input name="contact" maxlength="200"></label><label>Sähköposti<input name="email" type="email"></label><label>Osoite<input name="address" maxlength="400"></label><label>Perustamisvuosi<input name="foundedYear" type="number" min="1800" max="${new Date().getFullYear()}"></label><label>Liikevaihto (€)<input name="revenueEur" type="number" min="0" step="1000"></label><label>Tilikausi<input name="revenueYear" type="number" min="1800" max="${new Date().getFullYear()}"></label><label>Henkilöstö<input name="workforce" type="number" min="0" step="1"></label><label>Markkinaosuus (%)<input name="marketSharePct" type="number" min="0" max="100" step="0.1"></label><label>Tulevaisuuspisteet (0–100)<input name="futurePoints" type="number" min="0" max="100" step="1"></label><label class="crm-wide">Tietolähteen URL<input name="profileSourceUrl" type="url" placeholder="https://…"></label><button class="button button-primary" type="submit">Tallenna yrityskortti</button></form>${companyProfileForm}<p class="privacy-note">Vertailujärjestystä ei näytetä ennen kuin yrityksille on lähteistetty vertailukelpoiset luvut. Työntekijä- ja markkinaosuuslukujen lähteet sekä PRH:n tilinpäätöskausi merkitään korttiin; tyhjiä arvoja ei päätellä.</p><section class="crm-research-sources"><h3>Yritystiedon ja rakennusalan lähteet</h3><div class="crm-source-grid">${(window.workspaceCrmResearchSources || []).map((source) => `<article><span class="tag">${escapeHtml(source.kind)}</span><strong><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)} ↗</a></strong><p>${escapeHtml(source.use)}</p></article>`).join('')}</div></section></div></section>
      <section class="panel crm-followup-panel"><div class="panel-head"><div><h2>CRM-seuranta · avoimet tehtävät</h2><p>${overdueFollowUps.length} myöhässä · ${dueTodayFollowUps.length} tänään · ${upcomingFollowUps.length} tulevaa · ${openFollowUps.filter((item) => !dueDate(item)).length} ilman määräpäivää</p></div><span class="tag ${overdueFollowUps.length ? 'amber' : 'green'}">${openFollowUps.length} avointa</span><a class="button button-sm" href="/api/crm/follow-ups.ics">Vie määräpäivät kalenteriin (.ics)</a></div><div class="panel-body"><div class="crm-followup-filters"><label>Hae seurattavaa<input id="crmFollowUpSearch" type="search" placeholder="Yritys, kohde tai seuraava tehtävä…" autocomplete="off"></label><label>Näytä<select id="crmFollowUpPeriodFilter"><option value="">Kaikki avoimet</option><option value="overdue">Myöhässä</option><option value="today">Tänään</option><option value="upcoming">Tulevat</option><option value="undated">Ilman määräpäivää</option></select></label><span id="crmFollowUpFilterCount" aria-live="polite">Näytetään ${openFollowUps.length} / ${openFollowUps.length}</span></div><div class="crm-followup-groups">${overdueFollowUps.length ? `<div class="crm-followup-group" data-follow-up-group="overdue"><h3>Myöhässä</h3>${followUpRows(overdueFollowUps,'Eräpäivä','overdue',true)}</div>` : ''}${dueTodayFollowUps.length ? `<div class="crm-followup-group" data-follow-up-group="today"><h3>Tänään</h3>${followUpRows(dueTodayFollowUps,'Eräpäivä','today')}</div>` : ''}${upcomingFollowUps.length ? `<div class="crm-followup-group" data-follow-up-group="upcoming"><h3>Tulevat</h3>${followUpRows(upcomingFollowUps,'Eräpäivä','upcoming')}</div>` : ''}${openFollowUps.filter((item) => !dueDate(item)).length ? `<div class="crm-followup-group" data-follow-up-group="undated"><h3>Ilman määräpäivää</h3>${followUpRows(openFollowUps.filter((item) => !dueDate(item)),'Ei eräpäivää','undated')}</div>` : ''}${openFollowUps.length ? '' : '<p class="hint">Ei avoimia seurattavia tehtäviä. Lisää seuraava tehtävä mahdollisuuden taulukkoon.</p>'}<p class="hint crm-followup-filter-empty" hidden>Hakuehdoilla ei löytynyt seurattavia tehtäviä.</p></div></div></section>
      <div class="crm-layout"><section class="panel"><div class="panel-head"><div><h2>Lisää myyntimahdollisuus</h2><p>Yritys ja mahdollisuus tallentuvat erillisinä tietueina.</p></div></div><div class="panel-body"><form id="crmOpportunityForm" class="crm-create-form"><label>Yritys / ostaja *<input name="companyName" required maxlength="200" placeholder="Yrityksen virallinen nimi"></label><label>Mahdollisuuden nimi *<input name="title" required maxlength="300" placeholder="Urakka, tarjouspyyntö tai myyntihanke"></label><label>Y-tunnus<input name="businessId" pattern="[0-9]{7}-[0-9]" placeholder="1234567-8"></label><label>Lähde<select name="source"><option value="manual">Käsin lisätty</option><option value="hilma">HILMA</option><option value="ted">TED</option><option value="ytj">YTJ / PRH</option><option value="websearch">Verkkohaku</option></select></label><label>Vaihe<select name="stage">${stageOptions('Uusi')}</select></label><label>Arvio (€)<input name="value" type="number" min="0" step="100" value="0"></label><label>Seuraava tehtävä<input name="nextAction" maxlength="300" placeholder="Esim. tarkista ilmoituksen ehdot"></label><label>Määräpäivä<input name="nextActionDue" type="date"></label><label class="crm-wide">Ilmoituksen tai lähteen linkki<input name="sourceUrl" type="url" placeholder="https://…"></label><button class="button button-primary" type="submit">＋ Lisää putkeen</button></form></div></section><section class="panel crm-pipeline"><div class="panel-head"><div><h2>Myyntivaiheet</h2><p>${opportunities.length} mahdollisuutta vaiheittain</p></div></div><div class="panel-body">${CRM_STAGES.map((stage)=>`<div class="crm-pipeline-row"><span>${escapeHtml(stage)}</span><div class="dashboard-progress"><i class="blue" style="width:${opportunities.length ? Math.max(4, stageCount(stage) / opportunities.length * 100) : 0}%"></i></div><strong>${stageCount(stage)}</strong></div>`).join('')}</div></section></div>
      <section class="panel crm-table-panel"><div class="panel-head"><div><h2>Myyntimahdollisuudet</h2><p>${opportunities.length} tietuetta · vaihe- ja tehtävämuutokset tallentuvat palvelimelle</p></div><button class="button button-sm" data-action="crm-reload" type="button">Päivitä</button></div><div class="panel-body"><div class="crm-opportunity-filters"><label>Hae yritystä tai mahdollisuutta<input id="crmOpportunitySearch" type="search" placeholder="Yritys, tarjous, lähde tai RATU…" autocomplete="off"></label><label>Myyntivaihe<select id="crmOpportunityStageFilter"><option value="">Kaikki vaiheet</option>${CRM_STAGES.map((stage) => `<option value="${escapeHtml(stage)}">${escapeHtml(stage)}</option>`).join('')}</select></label><span id="crmOpportunityFilterCount" aria-live="polite">Näytetään ${opportunities.length} / ${opportunities.length}</span></div><div class="table-scroll"><table class="data-table crm-table"><thead><tr><th>Yritys / mahdollisuus</th><th>Vaihe</th><th>Arvio</th><th>Seuraava tehtävä</th><th>Rakennus / RATU</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="6">Putki on tyhjä. Lisää mahdollisuus lomakkeesta tai avoimen lähdehaun tuloskortista.</td></tr>'}</tbody></table><p class="hint crm-filter-empty" hidden>Suodattimilla ei löytynyt myyntimahdollisuuksia.</p></div></div></section>
      <div class="crm-layout crm-lower-layout"><section class="panel"><div class="panel-head"><div><h2>Helsingin yritys- ja kohdekartta</h2><p>Vain käyttäjän vahvistamat osoitepisteet näytetään. Yrityksen sijainti ja työmaakohde ovat eri merkkejä.</p></div><span class="tag">EPSG:3879</span></div><div class="panel-body"><div class="crm-map"><img src="${escapeHtml(wms.toString())}" alt="Helsingin opaskartta" loading="lazy">${pins || '<div class="crm-map-empty">Vahvistettuja sijainteja ei ole vielä tallennettu.</div>'}</div><form id="crmAddressSearchForm" class="crm-address-form"><label>Yritys<select name="companyId" required>${addressOptions || '<option value="">Lisää ensin yritys</option>'}</select></label><label>Osoitehaku<input name="query" required minlength="2" placeholder="Helsingin katuosoite"></label><button class="button button-sm" type="submit">Hae osoitteita</button></form><div id="crmAddressResults"></div></div></section><section class="panel"><div class="panel-head"><div><h2>Rakennuskohde ja RATU</h2><p>Tallenna rakennus erillisenä mahdollisuudesta ja yhdistä se RATU-tunnuksella.</p></div></div><div class="panel-body"><form id="crmBuildingForm" class="crm-create-form"><label>RATU-tunnus *<input name="ratu" required maxlength="80" placeholder="Rakennuksen RATU"></label><label>Kohteen nimi<input name="name" maxlength="240" placeholder="Rakennuksen tai työmaan nimi"></label><label class="crm-wide">Osoite<input name="address" value="${escapeHtml(crmBuildingLocation?.label || '')}" placeholder="Valitse sijainti alla olevasta hausta"></label><label class="crm-wide">Sijaintihaku<input name="buildingQuery" placeholder="Hae kohteen osoitetta"></label><button class="button button-sm" type="button" data-action="crm-search-building-address">Hae kohteen osoite</button><small class="hint crm-wide" id="crmBuildingLocationStatus">${crmBuildingLocation ? `Valittu osoite: ${escapeHtml(crmBuildingLocation.label)} · EPSG:3879` : 'Kohde saa karttapisteen vasta, kun valitset hakutuloksen.'}</small><button class="button button-primary" type="submit">Tallenna rakennuskohde</button></form><div id="crmBuildingAddressResults"></div><div class="crm-building-list">${buildings.map((building)=>`<article><strong>${escapeHtml(building.name || building.ratu)}</strong><small>RATU ${escapeHtml(building.ratu)}${building.address ? ` · ${escapeHtml(building.address)}` : ''}</small><button class="button button-sm" data-action="crm-use-ratu" data-ratu="${escapeHtml(building.ratu)}" type="button">Valitse piirustuksille</button></article>`).join('') || '<p class="hint">Rakennuskohteita ei ole tallennettu.</p>'}</div></div></section></div>
      <section class="panel crm-drawings-panel"><div class="panel-head"><div><h2>Piirustusviitteet RATU-tunnuksella</h2><p>Tiedosto pysyy alkuperäisessä tallennuspaikassa; CRM tallentaa vain linkin ja metatiedot.</p></div></div><div class="panel-body"><form id="crmDrawingForm" class="crm-create-form"><label>RATU-tunnus *<input name="ratu" required maxlength="80" value="${escapeHtml(buildings[0]?.ratu || '')}"></label><label>Piirustuksen nimi *<input name="title" required maxlength="240" placeholder="Julkisivutelineen piirustus"></label><label>Revisio<input name="revision" maxlength="100" placeholder="Rev. 02"></label><label>Tallennusosoite *<input name="url" type="url" required placeholder="https://…"></label><label class="crm-wide">Huomiot<input name="notes" maxlength="1000" placeholder="Sisältö tai käyttörajoitus"></label><button class="button button-primary" type="submit">Tallenna piirustusviite</button></form><div class="table-scroll"><table class="data-table crm-table"><thead><tr><th>Piirustus / RATU</th><th>Revisio</th><th>Linkki</th><th>Tila</th><th></th></tr></thead><tbody>${drawingRows || '<tr><td colspan="5">Piirustusviitteitä ei ole tallennettu.</td></tr>'}</tbody></table></div></div></section>
      <section class="panel crm-sync-panel"><div class="panel-head"><div><h2>ScaffoldingOS-vientijono</h2><p>Yksisuuntainen vienti käynnistyy Kelpuutus → Yhteydenotto -siirtymästä.</p></div><span class="tag amber">API-sopimus vahvistamatta</span></div><div class="panel-body"><p class="privacy-note">ScaffoldingOSin osoitetta, polkua, tunnistusta ja kenttiä ei ole dokumentoitu tässä työtilassa. Siksi CRM ei lähetä kirjoittavia pyyntöjä. Kelpuutettu mahdollisuus näkyy odottavana; CSV-varavienti toimii yllä.</p>${syncItems.map((sync)=>`<article class="crm-sync-item"><strong>${escapeHtml(sync.company)} · ${escapeHtml(sync.title)}</strong><span>${escapeHtml(sync.status)} · ${escapeHtml(sync.updated_at || '')}</span></article>`).join('') || '<small class="hint">Ei vielä vientijonoon lisättyjä mahdollisuuksia.</small>'}</div></section>`;
  }

  function hrView() {
    const employees = state.employees || [];
    const active = employees.filter((item) => item.status === 'Aktiivinen').length;
    return `${heading('HRMS · Henkilöstöhallinta', 'Human Resource Management System · henkilöstö, osaaminen, työmaalle kohdistaminen ja perehdytys.', `<a class="button" href="?page=certificates" data-page="certificates">Avaa pätevyydet</a>`)}${workspaceArtHero('HRMS · PEOPLE & WORKFORCE', 'Ihmiset, osaaminen ja turvallinen työ', 'Henkilöstötiimi, perehdytys, suojavarusteet ja työmaakohtaiset pätevyydet omassa henkilöstöalueessa.', 'assets/illustrations/hrms-people-isometric.png', 'Isometrinen henkilöstökeskus, jossa rakennustyöntekijät osallistuvat perehdytykseen ja turvallisuuspalaveriin', `<a class="button button-primary" href="#employeeForm">＋ Lisää työntekijä</a><a class="button" href="?page=courses" data-page="courses">Avaa perehdytys ja koulutukset</a>`)}<div class="metric-grid">${metric('♙','Henkilöstöä',employees.length,'paikallisessa rooliluettelossa','blue')}${metric('✓','Aktiivisia',active,'työtilaan kohdistettu','green')}${metric('▤','Pätevyyksiä',state.certificates.length,'sertifikaattirekisterissä','purple')}${metric('⚠','Tarkistettavaa',state.certificates.filter((cert)=>dayDistance(cert.validUntil)<=30).length,'vanhentuu tai vanhentunut','amber')}</div><div class="crm-layout"><section class="panel"><div class="panel-head"><div><h2>Lisää työntekijä</h2><p>Henkilötiedot tallennetaan vain tämän selaimen työtilaan.</p></div></div><div class="panel-body"><form id="employeeForm" class="inline-form"><label>Nimi *<input name="name" required></label><label>Rooli<input name="role" placeholder="Esim. työnjohtaja"></label><label>Sähköposti<input name="email" type="email"></label><label>Työmaa<select name="siteId">${SITES.map((site)=>`<option value="${site.id}">${escapeHtml(site.name)}</option>`).join('')}</select></label><label>Tila<select name="status"><option>Aktiivinen</option><option>Poissa</option><option>Päättynyt</option></select></label><button class="button button-primary" type="submit">＋ Lisää henkilöstöön</button></form></div></section><section class="panel"><div class="panel-head"><div><h2>Henkilöstö ja työmaa</h2><p>Työvuoro- ja pätevyysnäkymät ovat linkitettyinä henkilöihin.</p></div></div><div class="panel-body employee-list">${employees.map((item)=>`<article class="employee-row"><span class="avatar-small">${escapeHtml(item.name.slice(0,2).toUpperCase())}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.role || 'Rooli puuttuu')} · ${escapeHtml(siteName(item.siteId))}</small></div><span class="tag ${item.status==='Aktiivinen'?'green':'amber'}">${escapeHtml(item.status)}</span><button class="button button-sm" data-action="remove-employee" data-id="${escapeHtml(item.id)}" type="button">Poista</button></article>`).join('') || '<p class="muted">Henkilöstöluettelo on tyhjä.</p>'}</div></section></div><section class="panel"><div class="panel-head"><div><h2>Pätevyydet</h2><p>Sertifikaattien seuranta on koottu samaan henkilöstöosioon.</p></div><a class="button button-sm" href="?page=certificates" data-page="certificates">Hallinnoi pätevyyksiä</a></div><div class="panel-body"><div class="certificate-grid">${employees.slice(0,3).map((employee)=>{const certs=state.certificates.filter((cert)=>cert.employee===employee.name);return `<article class="certificate-card"><span class="tag">${certs.length} pätevyyttä</span><h3>${escapeHtml(employee.name)}</h3><p>${certs.length?certs.map((cert)=>`${escapeHtml(cert.type)} · ${formatDate(cert.validUntil)}`).join('<br>'):'Ei kirjattuja pätevyyksiä'}</p></article>`;}).join('')}</div></div></section>`;
  }

  function coursesView() {
    const courses = state.courses || [];
    const categories = ['Kaikki', ...new Set(courses.map((course)=>course.category))];
    const visible = courses.filter((course)=>state.lmsCategory==='Kaikki'||course.category===state.lmsCategory);
    return `${heading('Koulutus & sertifiointi', 'Järjestä perehdytys- ja turvallisuuskoulutukset aihealueittain sekä seuraa etenemistä.', `<a class="button" href="?page=certificates" data-page="certificates">Avaa sertifikaatit</a><span class="tag">${courses.length} kurssia</span>`)}${workspaceArtHero('TRAINING · CERTIFICATION', 'Perehdytys, osaaminen ja pätevyydet', 'Koulutusalue kokoaa työmaaperehdytyksen ja henkilöstön pätevyyspolut samaan rakennukseen.', 'assets/illustrations/hrms-people-isometric.png', 'Isometrinen koulutus- ja henkilöstöalue, jossa tiimi osallistuu perehdytykseen', `<a class="button button-primary" href="?page=certificates" data-page="certificates">Hallinnoi pätevyyksiä</a><a class="button" href="?page=hr" data-page="hr">Avaa HRMS</a>`)}<div class="metric-grid">${metric('▣','Koulutuksia',courses.length,'demo-/työtilakirjastossa','blue')}${metric('✓','Valmiita',courses.filter((course)=>course.progress>=100).length,'etenemä 100 %','green')}${metric('◷','Aloitettuja',courses.filter((course)=>course.progress>0&&course.progress<100).length,'kesken olevat','amber')}${metric('♙','Henkilöitä',new Set(courses.map((course)=>course.owner).filter(Boolean)).size,'kurssivastuissa','purple')}</div><div class="lms-category-list" role="group" aria-label="Kurssikategoriat">${categories.map((category)=>`<button type="button" class="button ${state.lmsCategory===category?'button-primary':''}" data-action="course-filter" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}</div><div class="lms-course-grid">${visible.map((course)=>`<article class="panel lms-course"><div class="panel-head"><div><span class="tag purple">${escapeHtml(course.category)}</span><h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(course.duration)} · vastuuhenkilö ${escapeHtml(course.owner||'ei valittu')}</p></div></div><div class="panel-body"><div class="lms-progress-label"><span>Edistyminen</span><strong>${Math.min(100,Number(course.progress)||0)} %</strong></div><div class="dashboard-progress"><i class="green" style="width:${Math.min(100,Number(course.progress)||0)}%"></i></div><button class="button button-sm" data-action="advance-course" data-id="${escapeHtml(course.id)}" type="button">${course.progress>=100?'Merkitse uudelleen kesken':course.progress>0?'Merkitse valmiiksi':'Aloita kurssi'}</button></div></article>`).join('') || '<div class="empty-state"><strong>Ei kursseja tässä kategoriassa</strong>Vaihda suodatusta nähdäksesi muun koulutussisällön.</div>'}</div><p class="privacy-note">Koulutussisältö ja edistymisluvut ovat paikallisia esimerkkitietoja. Tämä näkymä ei vielä toimita verkkokursseja eikä anna virallisia pätevyyksiä.</p>`;
  }

  function questionsView() {
    const questions = state.questions || [];
    const workers = [...new Set((state.employees||[]).map((item)=>item.name))];
    return `${heading('Kysy käyttäjältä', 'Kerää käyttäjän tai työmaan yhteyshenkilön tarkennus ja pidä kysymys näkyvillä sen ratkeamiseen asti.')}<div class="question-layout"><section class="panel"><div class="panel-head"><div><h2>Uusi kysymys</h2><p>Kirjaa, keneltä vastausta odotetaan ja mihin projektiin se liittyy.</p></div></div><div class="panel-body"><form id="questionForm" class="inline-form"><label>Kysy henkilöltä<select name="to">${workers.map((name)=>`<option>${escapeHtml(name)}</option>`).join('') || '<option>Työmaan yhteyshenkilö</option>'}<option>Työmaan yhteyshenkilö</option></select></label><label>Työmaa<select name="siteId">${SITES.map((site)=>`<option value="${site.id}">${escapeHtml(site.name)}</option>`).join('')}</select></label><label class="span-two">Kysymys *<textarea name="text" required rows="3" placeholder="Mitä pitää tarkistaa ennen työn jatkamista?"></textarea></label><button class="button button-primary" type="submit">Lähetä kysymys työtilaan</button></form><p class="privacy-note">Tässä buildissa kysymys tallentuu paikalliseen työtilaan. Se ei lähetä ilmoitusta toiselle käyttäjälle tai palveluun.</p></div></section><section class="panel"><div class="panel-head"><div><h2>Kysymysjono</h2><p>${questions.filter((item)=>item.status!=='Vastattu').length} avointa · ${questions.length} yhteensä</p></div></div><div class="panel-body question-list">${questions.map((item)=>`<article class="question-card"><div><span class="tag ${item.status==='Vastattu'?'green':'amber'}">${escapeHtml(item.status)}</span><small>${escapeHtml(item.to)} · ${escapeHtml(siteName(item.siteId))} · ${formatDate(item.createdAt)}</small></div><p>${escapeHtml(item.text)}</p><div class="question-actions">${item.status!=='Vastattu'?`<button class="button button-sm" data-action="answer-question" data-id="${escapeHtml(item.id)}" type="button">Merkitse vastatuksi</button>`:''}<button class="button button-sm" data-action="remove-question" data-id="${escapeHtml(item.id)}" type="button">Poista</button></div></article>`).join('') || '<div class="empty-state"><strong>Ei avoimia kysymyksiä</strong>Lisää työmaalle tarkennettava asia lomakkeesta.</div>'}</div></section></div>`;
  }

  const DEV_VIEW_OPTIONS = [['dashboard','Dashboard'],['crm','CRMS'],['osint','Markkina- ja hankintavahti'],['scaffold','Telinehallinta'],['rental','Rakennuskonevuokraamo'],['wms','WMS · Varasto'],['lms','LMS · Logistiikka'],['manufacturing','MMS · Valmistus'],['bom','BOM · WMS'],['hr','HRMS · Henkilöstö'],['courses','Koulutus & pätevyydet'],['legal','Legal · Juridiikka'],['finlex','Finlex · Säädöshaku'],['contracts','Sopimusviitteet'],['compliance','Audit · Compliance'],['tasks','Tehtävät'],['gis','GeoBIM · Kartat'],['design','Suunnittelu & CAD'],['knowledge','Telineohjeet & tietopankki'],['blueprints','Piirustusarkisto'],['weather','Sää & aika'],['questions','Kysymykset']];
  function devView() {
    const tiles = state.devLayout || [];
    const selector = MANAGEMENT_DESTINATIONS.map(([page,label,detail,x,y])=>`<button class="dev-map-hotspot" type="button" data-action="add-layout-view" data-view="${page}" style="left:${x};top:${y}" aria-label="Lisää hahmotelmaan: ${escapeHtml(label)}" title="Lisää hahmotelmaan: ${escapeHtml(label)}"><span>${escapeHtml(PAGE_META[page]?.icon||'▧')}</span></button>`).join('');
    const bomChild = `<button class="dev-map-hotspot dev-map-hotspot-child" type="button" data-action="add-layout-view" data-view="bom" style="left:13%;top:68%" aria-label="Lisää BOM WMS-varaston alalehdeksi" title="BOM · WMS-varaston alalehti"><span>${escapeHtml(PAGE_META.bom.icon)}</span><small>BOM</small></button>`;
    return `${heading('Isometrinen valinta · Dev UI', 'Valitse näkymiä työtilan isometrisestä kartasta ja hahmottele niiden paikkaa sekä järjestystä.', `<button class="button button-primary" data-action="save-layout" type="button">✓ Tallenna hahmotelma</button>`)}<section class="panel dev-isometric-select"><div class="panel-head"><div><h2>Valitse moduuli työtilanäkymästä</h2><p>Napsauta isometrisen näkymän kuvaketta lisätäksesi sen hahmotelmaan. BOM löytyy WMS-varaston alamerkistä.</p></div><span class="tag blue">Isometrinen valinta</span></div><div class="dev-map-stage"><img src="assets/illustrations/management-isometric-finance-civic.png" alt="Työtilan isometrinen moduulikartta, jossa pankkikortteli sekä viranomaisten hallinto- ja poliisialue" width="1774" height="887" loading="lazy">${selector}${bomChild}</div><div class="dev-palette-extra"><strong>Muut moduulit</strong>${DEV_VIEW_OPTIONS.filter(([view])=>view!=='bom'&&!MANAGEMENT_DESTINATIONS.some(([mapped])=>mapped===view)).map(([view,label])=>`<button class="button button-sm" type="button" data-action="add-layout-view" data-view="${view}">＋ ${escapeHtml(label)}</button>`).join('')}</div></section><section class="panel dev-canvas-panel"><div class="panel-head"><div><h2>Työtilan hahmotelma</h2><p>Järjestä valitut moduulit vetämällä. Säädä leveyttä +/− painikkeilla.</p></div><span class="tag">${tiles.length} näkymää</span></div><div class="panel-body"><div id="devLayoutGrid" class="dev-layout-grid">${tiles.map((tile,index)=>{const option=DEV_VIEW_OPTIONS.find(([view])=>view===tile.view);const label=option?.[1]||PAGE_META[tile.view]?.label||tile.view;const parent=tile.view==='bom'?'<small class="dev-parent-indicator">↳ WMS alalehti</small>':tile.view==='legal'?'<small class="dev-parent-indicator">Finlex · sopimukset · audit</small>':'';return `<article class="dev-layout-tile${tile.view==='bom'?' dev-layout-tile-child':''}" draggable="true" data-layout-id="${escapeHtml(tile.id)}" style="grid-column:span ${Math.min(12,Math.max(2,Number(tile.span)||4))}"><div class="dev-tile-head"><span class="dev-drag-handle" aria-label="Vedä siirtääksesi">⠿</span><strong>${escapeHtml(label)}</strong>${parent}<span class="tag">${index+1}</span></div><div class="dev-tile-preview"><span class="dev-preview-icon">${escapeHtml(PAGE_META[tile.view]?.icon||'▧')}</span><span><b>${escapeHtml(PAGE_META[tile.view]?.title||label)}</b><small>${escapeHtml(PAGE_META[tile.view]?.description||'Näkymä suunnittelussa')}</small></span></div><div class="dev-tile-actions"><button class="button button-sm" data-action="resize-layout" data-id="${escapeHtml(tile.id)}" data-delta="-2" type="button" aria-label="Kavenna ${escapeHtml(label)}">− Leveys</button><button class="button button-sm" data-action="resize-layout" data-id="${escapeHtml(tile.id)}" data-delta="2" type="button" aria-label="Levennä ${escapeHtml(label)}">＋ Leveys</button><button class="button button-sm" data-action="move-layout" data-id="${escapeHtml(tile.id)}" data-delta="-1" type="button" aria-label="Siirrä ylös">↑</button><button class="button button-sm" data-action="move-layout" data-id="${escapeHtml(tile.id)}" data-delta="1" type="button" aria-label="Siirrä alas">↓</button><button class="button button-sm" data-action="remove-layout" data-id="${escapeHtml(tile.id)}" type="button">Poista</button></div></article>`;}).join('') || '<div class="empty-state"><strong>Tyhjä hahmotelma</strong>Lisää näkymiä paletista ja järjestä ne vetämällä.</div>'}</div><div class="dev-grid-scale"><span>12-osainen asetteluruudukko</span><span>≈ leveys työtilassa</span></div></div></section><p class="privacy-note">Tämä on työtilan asetteluluonnos. Muutokset tallentuvat selaimeen; varsinaisen näkymärakenteen julkaisu ja käyttöoikeudet hallitaan erikseen.</p><section class="dev-integrations"><h2>Integraatioiden kehitystyökalut</h2><p>Hallintaintegraatioiden asetukset ja tuodut lähdetiedot näkyvät tällä kehittäjänäkymällä.</p>${base44AdminView()}</section>`;
  }

  function loadWorkspaceScriptData(source, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(source, document.baseURI).href;
      script.async = true;
      script.addEventListener('load', () => {
        if (window[globalName]) resolve(window[globalName]);
        else reject(new Error(`Tietoaineisto ${source} ei sisältänyt odotettua dataa.`));
      }, { once: true });
      script.addEventListener('error', () => {
        script.remove();
        reject(new Error(`Tietoaineistoa ${source} ei voitu ladata.`));
      }, { once: true });
      document.head.appendChild(script);
    });
  }

  function loadScaffoldCatalogData() {
    if (!scaffoldCatalogDataPromise) {
      scaffoldCatalogDataPromise = Promise.all([
        loadWorkspaceScriptData('data/scaffold-components.js', 'workspaceScaffoldComponentData'),
        loadWorkspaceScriptData('data/scaffold-manufacturers.js', 'workspaceScaffoldManufacturerData'),
      ]).then(([components, manufacturers]) => ({ components, manufacturers })).catch((error) => {
        scaffoldCatalogDataPromise = null;
        throw error;
      });
    }
    return scaffoldCatalogDataPromise;
  }

  function loadBomCatalog() {
    if (bomCatalogLoading || bomCatalogError || (scaffoldCatalog.length && scaffoldManufacturers.length)) return;
    bomCatalogLoading = true;
    bomCatalogError = '';
    loadScaffoldCatalogData()
      .then(({ components, manufacturers }) => { scaffoldCatalog = components.items || []; scaffoldManufacturers = manufacturers.items || []; })
      .catch(()=>{bomCatalogError='Komponenttikirjastoa ei saatu ladattua. Tarkista, että data-kansio on workspace.html-tiedoston vieressä.';})
      .finally(()=>{bomCatalogLoading=false;if(currentPage==='bom'||currentPage==='manufacturing')render();});
  }

  function wmsView() {
    const groups = WAREHOUSE_STOCK;
    return `${heading('WMS · Varastonhallinta', 'Warehouse Management System · seuraa kalustoryhmiä, varastoalueita ja materiaalien saatavuutta.', '<a class="button" href="?page=bom" data-page="bom">Avaa BOM ↗</a>')}${workspaceArtHero('WMS · WAREHOUSE MANAGEMENT', 'Kalusto ja varastopaikat', 'Tarkastele telinemateriaalien varastoryhmiä. Näytetyt prosentit ovat käyttöliittymän esimerkkitietoja.', 'assets/illustrations/logistics-warehouse-isometric.png', 'Isometrinen työmaan varasto, kuorma-auto, trukki ja telinekalusto', '<a class="button button-primary" href="?page=lms" data-page="lms">Siirry logistiikkaan</a><a class="button" href="?page=bom" data-page="bom">Valitse BOM-komponentit</a>')}<div class="metric-grid">${metric('▤','Varastoryhmiä',groups.length,'esimerkkiryhmät','blue')}${metric('⌂','Varastoalueita',new Set(groups.map((item)=>item[4].split(' · ')[0])).size,'hallin alueet','purple')}${metric('↗','BOM-kirjasto','Avaa','valmistajan osaluettelo','green')}${metric('⇄','Toimitukset','LMS','erillinen logistiikkanäkymä','amber')}</div><div class="logistics-layout"><section class="panel"><div class="panel-head"><div><h2>Kalustoryhmät ja varastopaikat</h2><p>Esimerkkialueet voidaan yhdistää toimivaan varastosaldon tietolähteeseen.</p></div><span class="tag blue">WMS</span></div><div class="panel-body"><div class="wms-stock-grid">${groups.map(([name,value,unit,color,zone])=>`<article class="wms-stock-card"><div><strong>${escapeHtml(name)}</strong><span class="tag ${color}">${escapeHtml(zone)}</span></div><div class="dashboard-progress"><i class="${color}" style="width:${value}%"></i></div><p><b>${value}${unit}</b><span>esimerkkisaatavuus</span></p></article>`).join('')}</div><p class="privacy-note">Saatavuusprosentit ja varastopaikat ovat demotietoja, eivät reaaliaikaisia saldoja. Tässä buildissa ei ole vielä varastotapahtumien tai inventaarion palvelinliitäntää.</p></div></section><section class="panel"><div class="panel-head"><div><h2>Seuraavat työvaiheet</h2><p>Varasto, materiaaliluettelo ja toimitukset on eroteltu omiksi näkymikseen.</p></div></div><div class="panel-body"><div class="wms-next-links"><a class="tool-link-card" href="?page=bom" data-page="bom"><span class="tool-link-icon">▤</span><span><strong>BOM · materiaaliluettelo</strong><small>Valitse komponenttikirjasto valmistajan mukaan.</small></span></a><a class="tool-link-card" href="?page=lms" data-page="lms"><span class="tool-link-icon">⇄</span><span><strong>LMS · logistiikka</strong><small>Aikatauluta kuorma ja seuraa toimitusjonoa.</small></span></a></div></div></section></div>`;
  }

  function rentalView() {
    const fleet = [
      ['Saksinostimet', 'Henkilönostin', 4, 'Vapaa', 'green'],
      ['Nivelnostimet', 'Henkilönostin', 3, 'Vapaa', 'green'],
      ['Teleskooppipuominostimet', 'Henkilönostin', 2, 'Työmaalla', 'amber'],
      ['Telinekehät ja työtasot', 'Telinekalusto', 6, 'Vuokrattavissa', 'blue'],
    ];
    return `${heading('Rakennuskonevuokraamo · RENT', 'Henkilönostimet, telinekalusto ja työmaalle lähtevä vuokrakalusto.', `<a class="button" href="?page=wms" data-page="wms">Avaa WMS-varasto</a><a class="button button-primary" href="?page=lms" data-page="lms">Aikatauluta toimitus</a>`)}${workspaceArtHero('EQUIPMENT RENTAL · RENT', 'Vuokraamo nostimille ja työmaakalustolle', 'Aidattu vuokrauspiha yhdistää saksinostimet, puominostimet, telineosat ja kuljetukset samaan kalustoketjuun.', 'assets/illustrations/rental-yard-isometric.png', 'Isometrinen rakennuskonevuokraamo, RENT-kyltti, saksinostimet, puominostimet ja telinemateriaaleja', `<a class="button button-primary" href="?page=lms" data-page="lms">Järjestä nouto tai toimitus</a><a class="button" href="?page=wms" data-page="wms">Tarkastele varastosaldoja</a>`)}<div class="metric-grid">${metric('⚒','Kalustoryhmiä',fleet.length,'esimerkkivuokrakalusto','blue')}${metric('↗','Vapaana',fleet.filter((item)=>item[3]==='Vapaa').length,'esimerkkisaatavuus','green')}${metric('⇄','Kuljetukset','LMS','nouto ja työmaatoimitus','amber')}${metric('▤','Telineosat','WMS','varaston materiaaliryhmät','purple')}</div><section class="panel rental-fleet-panel"><div class="panel-head"><div><h2>Vuokrakaluston ryhmät</h2><p>Nostimet ja telinekalusto näkyvät vuokraamon omassa rakennuksessa.</p></div><span class="tag blue">RENT · kalustopiha</span></div><div class="panel-body"><div class="rental-equipment-grid">${fleet.map(([name,type,count,status,color])=>`<article class="rental-equipment-card"><span class="tag ${color}">${escapeHtml(status)}</span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(type)}</small><b>${count} kpl</b></article>`).join('')}</div><p class="privacy-note">Kalustoryhmät ja saatavuus ovat käyttöliittymän esimerkkitietoja. Vuokrasopimuksia tai reaaliaikaista vuokrakaluston varauskantaa ei ole vielä liitetty tähän buildiin.</p></div></section>`;
  }

  function mmsArchivePanel() {
    const archive = window.workspaceMmsArchiveData;
    if (!archive) return '<section class="panel mms-archive-panel"><div class="panel-body"><div class="empty-state"><strong>MMS-arkiston luetteloa ei saatu ladattua</strong>Paikalliset arkistotiedostot ovat palvelimen data/mms-archive-kansiossa.</div></div></section>';
    const fileLink = (file, kind) => `<a class="mms-archive-file" href="${escapeHtml(file.url)}" ${kind === '3D ZIP' ? `download="${escapeHtml(file.name)}"` : 'target="_blank" rel="noopener noreferrer"'}><span>${kind === '3D ZIP' ? '▧' : '▤'}</span><strong>${escapeHtml(file.name)}</strong><small>${(file.bytes / 1048576).toLocaleString('fi-FI',{maximumFractionDigits:1})} MB · ${kind === '3D ZIP' ? 'Lataa ZIP' : 'Avaa PDF'}</small></a>`;
    const vendors = archive.vendors.map((vendor) => `<article class="mms-vendor-archive"><div class="mms-vendor-heading">${vendor.logo ? `<img src="${escapeHtml(vendor.logo)}" alt="${escapeHtml(vendor.name)} logo" loading="lazy">` : `<span class="mms-vendor-logo-placeholder">${escapeHtml(vendor.name.slice(0,1))}</span>`}<div><h3>${escapeHtml(vendor.name)}</h3><small>${vendor.files.length ? `${vendor.files.length} käyttöohjetta ja katalogia` : 'Katalogiarkisto odottaa toimittajan tiedostoja'}</small></div>${vendor.priceCatalogUrl ? `<a class="button button-sm" href="${escapeHtml(vendor.priceCatalogUrl)}" target="_blank" rel="noopener noreferrer">Hinnat ↗</a>` : vendor.archiveUrl ? `<a class="button button-sm" href="${escapeHtml(vendor.archiveUrl)}" target="_blank" rel="noopener noreferrer">Katalogi ↗</a>` : ''}</div><div class="mms-archive-file-list">${vendor.files.map((file)=>fileLink(file,'PDF')).join('')||'<p class="muted small">Tässä aineistoerässä ei toimitettu katalogi-PDF:iä.</p>'}</div></article>`).join('');
    const categories = archive.categories.map((category) => `<article class="mms-model-category"><div class="mms-category-heading"><div><h3>${escapeHtml(category.name)}</h3><p>${escapeHtml(category.description)}</p></div><span class="tag ${category.files.length?'blue':'amber'}">${category.files.length} ZIP</span></div><div class="mms-archive-file-list">${category.files.map((file)=>fileLink(file,'3D ZIP')).join('')||'<p class="muted small">Ei vielä tähän luokkaan arkistoituja mallipaketteja.</p>'}</div></article>`).join('');
    return `<section class="panel mms-archive-panel"><div class="panel-head"><div><h2>MMS · valmistaja- ja 3D-arkisto</h2><p>Paikallisesti arkistoidut toimittajadokumentit ja ZIP-mallipaketit. Mallipaketit ladataan alkuperäisinä arkistoina.</p></div><span class="tag blue">MMS ARCHIVE</span></div><div class="panel-body"><div class="mms-archive-vendors">${vendors}</div><h3 class="mms-archive-section-title">3D-mallit ja projektiesimerkit</h3><div class="mms-model-category-grid">${categories}</div><p class="privacy-note">${archive.notes.map(escapeHtml).join(' ')}</p></div></section>`;
  }

  function manufacturingView() {
    const manufacturers = scaffoldManufacturers || [];
    const makerCards = manufacturers.map((item) => {
      const name = String(item.manufacturer || 'Valmistaja');
      const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0,3).toUpperCase();
      const logo = item.logoUrl ? `<img src="${escapeHtml(item.logoUrl)}" alt="${escapeHtml(name)} logo" loading="lazy">` : `<span>${escapeHtml(initials)}</span>`;
      const libraryLink = item.archiveUrl ? `<a class="button button-sm" href="${escapeHtml(item.archiveUrl)}" target="_blank" rel="noopener noreferrer">Avaa aineisto</a>` : '<a class="button button-sm" href="?page=bom" data-page="bom">Avaa kirjasto</a>';
      return `<article class="manufacturer-supplier-card"><span class="manufacturer-supplier-logo">${logo}</span><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(item.systems || 'Valmistajajärjestelmä')}</small><small>${Number(item.componentCount || 0).toLocaleString('fi-FI')} BOM-osaa</small></div>${libraryLink}</article>`;
    }).join('');
    const components = scaffoldCatalog.length;
    return `${heading('MMS · Valmistus ja toimittajat', 'Manufacturing Management System · tuotantolaitokset, valmistajarekisteri ja BOM-osakirjastot.', `<a class="button button-primary" href="?page=bom" data-page="bom">Valitse valmistajan BOM</a>`)}${workspaceArtHero('MMS · MANUFACTURING MANAGEMENT', 'Tehdas ja toimittajat kaupungin ulkoreunalla', 'Valmistusalue yhdistää tuotantohallin, laadunvarmistuksen, valmistajan tuotetiedot ja projektiin valittavat komponentit.', 'assets/illustrations/manufacturing-factory-isometric.png', 'Isometrinen telinerungon tuotantotehdas, kuormausalue, trukki ja toimittajatoimisto', `<a class="button button-primary" href="?page=bom" data-page="bom">Avaa BOM-kirjastot</a><a class="button" href="?page=wms" data-page="wms">Siirry telinevarastoon</a>`)}<div class="metric-grid">${metric('▦','Valmistajia',manufacturers.length || (bomCatalogLoading?'Ladataan…':'—'),'paikallisessa katalogissa','blue')}${metric('▤','Osarivejä',components || (bomCatalogLoading?'Ladataan…':'—'),'BOM-tietoaineistossa','purple')}${metric('⌂','Tuotantoalue','Tehdas','valmistus erillään varastoinnista','amber')}${metric('✓','Järjestelmät','BOM','valitse valmistajan kirjasto','green')}</div><section class="panel manufacturing-suppliers-panel"><div class="panel-head"><div><h2>Valmistajat ja tuoteryhmät</h2><p>Samasta valmistajakatalogista pääsee suoraan BOM-komponenttien valintaan.</p></div><span class="tag blue">${manufacturers.length} toimittajaa</span></div><div class="panel-body">${bomCatalogError ? `<p class="privacy-note">${escapeHtml(bomCatalogError)}</p>` : ''}<div class="manufacturer-supplier-grid">${makerCards || `<div class="empty-state"><strong>${bomCatalogLoading ? 'Valmistajaluetteloa ladataan…' : 'Valmistajaluetteloa ei saatu ladattua'}</strong><a href="?page=bom" data-page="bom">Avaa BOM-kirjasto</a></div>`}</div><p class="privacy-note">Valmistajalogot ja tuoteperheet käyttävät BOM-katalogin lähdemerkintöjä. Tuotetiedot ja saatavuus on tarkistettava valmistajalta ennen hankintaa.</p></div></section>${mmsArchivePanel()}`;
  }

  function legalView() {
    const records = state.legalRecords || [];
    const areas = [
      ['§','Finlex-säädöshaku','Hae voimassa olevien säädösten nimiä Finlexin avoimesta rajapinnasta.','finlex','Avaa säädöshaku'],
      ['▤','Sopimukset ja asiakirjat','Tallenna työmaan sopimus-, lupa- ja viranomaisasiakirjojen viitteet.','contracts','Avaa viiterekisteri'],
      ['✓','Auditointi ja compliance','Avaa auditointien, velvoitteiden ja tarkistuslistojen näkymä.','compliance','Avaa hallinta'],
      ['♙','Pätevyydet ja koulutus','Siirry henkilöstöpätevyyksiin ja koulutuksiin.','certificates','Avaa pätevyydet'],
      ['▦','Viranomaiset ja lupapalvelut','Avaa kaupungin lupa- ja asiointipalvelujen viralliset reitit.','city','Avaa kaupunkiosio'],
    ];
    return `${heading('Legal · Juridiikan hallinta','Finlex, sopimusviitteet, viranomaisasiointi, luvat, auditointi ja vaatimustenmukaisuus saman kokonaisuuden alla.',`<a class="button button-primary" href="?page=finlex" data-page="finlex">§ Hae Finlexistä</a><a class="button" href="?page=city" data-page="city">▦ Viranomaiset ja luvat</a>`)}${workspaceArtHero('LEGAL · JURIDIIKKA', 'Laki- ja vaatimustenmukaisuustalo', 'Työmaan juridinen alue yhdistää säädöshaun, sopimusviitteet, viranomaisasioinnin ja auditoinnin. Valitse oikea alalehti mindmapista tai tästä näkymästä.', 'assets/illustrations/legal-compliance-isometric.png', 'Isometrinen laki- ja auditointitalo, asiakirja-arkisto, vaatimustenmukaisuuden tarkistuslista ja auditointitiimi', `<a class="button button-primary" href="?page=finlex" data-page="finlex">Avaa Finlex-haku</a><a class="button" href="?page=contracts" data-page="contracts">Lisää asiakirjaviite</a>`)}<div class="metric-grid">${metric('§','Finlex','Avoin API','säädösten nimihaku','blue')}${metric('▤','Asiakirjaviitteitä',records.length,'tämän selaimen työtilassa','purple')}${metric('✓','Alalehtiä',areas.length,'Finlex · sopimukset · viranomaiset · audit','green')}${metric('⌂','Kytkennät','CRMS · työmaat · FMS','projektikohtaiset viitteet','amber')}</div><section class="panel legal-areas-panel"><div class="panel-head"><div><h2>Juridiikan alalehdet</h2><p>Valitse tehtävään sopiva näkymä.</p></div><span class="tag blue">LEGAL</span></div><div class="panel-body"><div class="compliance-area-grid">${areas.map(([icon,title,description,page,cta])=>`<article class="compliance-area-card"><span aria-hidden="true">${icon}</span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></div><a class="button button-sm" href="?page=${page}" data-page="${page}">${escapeHtml(cta)}</a></article>`).join('')}</div></div></section>`;
  }

  function cityView() {
    const services = [
      ['▦','Helsinki · rakennus- ja tonttiluvat','Lupapiste, rakennusvalvonta, katutyöt ja yleisen alueen luvat.','https://www.hel.fi/fi/kaupunkiymparisto-ja-liikenne/tontit-ja-rakentamisen-luvat/yhteystiedot-tontti-ja-lupa-asioissa','Avaa Helsingin lupaohjeet'],
      ['⌂','Suomi.fi · viranomaispalvelut','Etsi oikea julkinen palvelu, lupa tai asiointikanava hankkeen sijainnin mukaan.','https://www.suomi.fi/','Avaa Suomi.fi'],
      ['⚑','Poliisi · turvallisuus ja lupa-asiat','Poliisin julkiset lupa- ja turvallisuusohjeet. Hätätilanteessa käytä virallista hätänumeroa.','https://poliisi.fi/','Avaa poliisi.fi'],
      ['§','Turvallisuusselvitykset · SUPO / Pääesikunta','Viranomaisen selvitys edellyttää henkilön suostumusta; puolustushallinnon hakemukset käsittelee Pääesikunta. Tämä työtila ei käsittele hakemuksia eikä henkilötietoja.','https://asiointi.supo.fi/?lang=fi','Avaa SUPO-asiointi'],
      ['▣','Puolustushallinto · kohteet ja pääsy','Tarkista pääsy, luvat ja tietojen luovutus aina Puolustusvoimien virallisista kanavista. Työtila ei näytä tai tallenna rajoitettuja kohde- tai turvallisuustietoja.','https://puolustusvoimat.fi/','Avaa Puolustusvoimat'],
    ];
    return `${heading('Kaupunki · asiointi ja luvat','Isometrinen kaupunkinäkymä kokoaa työmaan ympärille kaupunkipalvelut, viranomaiset ja viralliset asiointikanavat.',`<a class="button button-primary" href="?page=legal" data-page="legal">⚖ Avaa juridiikka</a><a class="button" href="?page=gis" data-page="gis">⌖ Avaa kartat</a>`)}<section class="panel city-isometric-panel"><div class="panel-head"><div><h2>Kaupunkitoiminnot</h2><p>Valitse palvelu kortista; ulkoiset asiointipalvelut avautuvat uuteen välilehteen.</p></div><span class="tag blue">CITY · PUBLIC SERVICES</span></div><div class="city-isometric-stage"><div class="city-isometric-map"><img src="assets/illustrations/management-isometric-finance-civic.png" alt="Isometrinen työmaan kaupunkikartta, jossa näkyvät pankkikortteli sekä viranomaisten hallinto- ja poliisialue" loading="lazy"><a class="city-district-hotspot city-district-finance" href="?page=finance" data-page="finance" aria-label="Avaa Finance · pankki- ja Wall Street -kortteli"><span>€</span><small>Finance · pankki</small></a><a class="city-district-hotspot city-district-civic" href="#cityServices" aria-label="Siirry viranomaisten lupa- ja poliisipalveluihin"><span>▣</span><small>Luvat · hallinto · poliisi</small></a></div><div class="city-stage-caption"><strong>Kohde → kaupunki → viranomainen</strong><span>Oma hallinto- ja poliisialue; viralliset kanavat alla</span></div></div><div class="city-service-grid" id="cityServices">${services.map(([icon,title,description,url,cta])=>`<article class="city-service-card"><span class="city-service-icon" aria-hidden="true">${icon}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cta)} ↗</a></div></article>`).join('')}</div></section><div class="city-link-row"><a class="button" href="?page=contracts" data-page="contracts">▤ Tallenna asian asiakirjaviite</a><a class="button" href="?page=finance" data-page="finance">€ Finance · FMS</a><a class="button" href="?page=crm" data-page="crm">◎ Asiakkuus ja hanke</a></div><p class="privacy-note">Tämä on virallisiin palveluihin ohjaava työtilanäkymä, ei viranomaisasiointipalvelu eikä lupapäätös. Tarkista aina ajantasaiset ehdot, hakukelpoisuus ja määräajat asiointipalvelusta. Rajoitettujen tai salassa pidettävien kohteiden aineistoa ei käsitellä täällä.</p>`;
  }

  function financeView() {
    const records = Array.isArray(state.financeRecords) ? state.financeRecords : [];
    const total = records.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const rows = records.map((row) => `<article class="finance-record"><div><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.kind)} · ${escapeHtml(siteName(row.siteId))} · ${escapeHtml(row.createdAt)}</small></div><b>${escapeHtml(new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(Number(row.amount) || 0))}</b></article>`).join('');
    return `${heading('Finance · FMS','Projektien talousseuranta: kustannusarviot, laskumuistiot ja kassavirran työlista yhdessä paikallisessa näkymässä.',`<a class="button" href="?page=crm" data-page="crm">◎ Avaa asiakkuudet</a><a class="button" href="?page=contracts" data-page="contracts">▤ Sopimukset</a>`)}${financeDistrictPanel()}<div class="metric-grid">${metric('€','Paikalliset kirjaukset',records.length,'tämän selaimen tallennustilassa','blue')}${metric('Σ','Kirjausten summa',new Intl.NumberFormat('fi-FI',{style:'currency',currency:'EUR'}).format(total),'ei kirjanpidon saldo','purple')}${metric('↔','Pankkiyhteys','Ei liitetty','ei maksujen lähettämistä','amber')}${metric('▤','Maksuvalmius','Tarkistettava','vahvista luvut lähdejärjestelmästä','green')}</div><div class="finance-layout"><section class="panel" id="financeEntry"><div class="panel-head"><div><h2>Lisää talousmuistio</h2><p>Seurantamuistio, ei maksutoimeksianto eikä kirjanpitovienti.</p></div><span class="tag blue">Paikallinen</span></div><div class="panel-body"><form id="financeRecordForm" class="finance-form"><label>Kirjauksen tyyppi<select name="kind"><option>Lasku · seuranta</option><option>Kustannusarvio</option><option>Tuloarvio</option><option>Muu talousmuistio</option></select></label><label>Työmaa<select name="siteId">${SITES.map((site)=>`<option value="${site.id}">${escapeHtml(site.name)}</option>`).join('')}</select></label><label class="span-two">Otsikko *<input name="title" maxlength="120" placeholder="Esim. tarjouksen kustannusarvio" required></label><label>Summa (€)<input name="amount" type="number" min="0" max="100000000" step="0.01" value="0" required></label><button class="button button-primary" type="submit">＋ Tallenna muistio</button></form><p class="privacy-note">Kirjaukset tallentuvat selaimen localStorageen. Älä tallenna pankkitunnuksia, tilinumeroita, maksukorttitietoja tai tunnisteellisia maksutapahtumia.</p></div></section><section class="panel"><div class="panel-head"><div><h2>Projektin talousmuistiot</h2><p>${records.length} paikallista kirjausta</p></div></div><div class="panel-body finance-record-list">${rows||'<div class="empty-state"><strong>Ei talousmuistioita</strong>Lisää ensimmäinen seurantarivi oikealle.</div>'}</div></section></div><section class="finance-links"><h2>Ulkoiset talous- ja pankkipalvelut</h2><p>Avaa oman pankkisi, laskutuspalvelusi ja kirjanpidon järjestelmät niiden omasta kirjautumisesta. TelineHallinnan pankkiyhteys ei ole tällä hetkellä käytössä.</p><a class="button" href="?page=legal" data-page="legal">⚖ Rahoitus- ja sopimusasiakirjat</a><a class="button" href="?page=city" data-page="city">▦ Kaupunkiasiat ja luvat</a></section>`;
  }

  async function searchFinlex(query) {
    const clean = String(query || '').trim();
    if (clean.length < 2) {
      finlexSearchState = { ...finlexSearchState, query: clean, results: [], loading: false, error: 'Kirjoita vähintään kaksi merkkiä.' };
      render();
      return;
    }
    finlexSearchState = { query: clean, results: [], loading: true, error: '' };
    render();
    try {
      const response = await fetch(`/api/legal/finlex/search?q=${encodeURIComponent(clean)}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || `Finlex-haku epäonnistui (HTTP ${response.status}).`);
      finlexSearchState.results = Array.isArray(payload?.results) ? payload.results : [];
    } catch (error) {
      finlexSearchState.error = error.message || 'Finlex-haku ei onnistunut.';
    } finally {
      finlexSearchState.loading = false;
      render();
    }
  }

  function finlexView() {
    const results = finlexSearchState.results || [];
    const resultMarkup = finlexSearchState.loading
      ? '<div class="empty-state"><strong>Haetaan Finlexistä…</strong>Rajapinta hakee enintään viisi osumaa voimassa olevista säädöksistä.</div>'
      : finlexSearchState.error
        ? `<p class="finlex-error" role="alert">${escapeHtml(finlexSearchState.error)}</p>`
        : results.length
          ? `<div class="finlex-results">${results.map((item)=>`<article class="finlex-result"><span class="finlex-result-icon" aria-hidden="true">§</span><div><strong>${escapeHtml(item.title || 'Säädös')}</strong><small>${escapeHtml(item.number || 'Säädösnumero ei saatavilla')} · ${escapeHtml(item.status || 'Voimassa oleva säädös')}</small></div><a class="button button-sm" href="${escapeHtml(item.aknUri)}" target="_blank" rel="noopener noreferrer">Avaa Finlexissä ↗</a></article>`).join('')}</div>`
          : `<div class="empty-state"><strong>${finlexSearchState.query ? 'Ei osumia tällä nimihakusanalla' : 'Hae säädöksen nimellä'}</strong>${finlexSearchState.query ? 'Kokeile yleisempää termiä, esimerkiksi työturvallisuus tai rakentaminen.' : 'Haku käyttää Finlexin avointa säädösrajapintaa.'}</div>`;
    return `${heading('Finlex · Säädöshaku','Hae säädösten nimistä Finlexin avoimesta REST-rajapinnasta. Tulos avaa alkuperäisen Finlex-AKN-asiakirjan.',`<a class="button" href="https://www.finlex.fi/fi/avoin-data" target="_blank" rel="noopener noreferrer">Finlexin API-ohje ↗</a>`)}<section class="panel finlex-search-panel"><div class="panel-head"><div><h2>Voimassa olevat säädökset</h2><p>Haku kohdistuu säädöksen nimeen, ei kokotekstiin.</p></div><span class="tag blue">Finlex Open Data · REST</span></div><div class="panel-body"><form id="finlexSearchForm" class="finlex-search-form"><label for="finlexQuery">Säädöksen nimi tai aihe</label><div><input id="finlexQuery" name="query" type="search" minlength="2" maxlength="100" value="${escapeHtml(finlexSearchState.query)}" placeholder="Esim. työturvallisuus" required><button class="button button-primary" type="submit" ${finlexSearchState.loading?'disabled':''}>${finlexSearchState.loading?'Haetaan…':'Hae Finlexistä'}</button></div></form><p class="muted small">Hakutuloksia enintään 5 · Rajapinta: <code>/api/legal/finlex/search</code> → Finlex Open Data.</p>${resultMarkup}</div></section><section class="panel finlex-api-panel"><div class="panel-head"><div><h2>Rajapinnan tiedot</h2><p>Hakutulokset haetaan palvelimen kautta ja linkitetään viralliseen AKN-asiakirjaan.</p></div></div><div class="panel-body"><div class="finlex-api-facts"><span><b>Rajapinta</b><code>GET /akn/fi/act/statute-consolidated/list</code></span><span><b>Hakuparametrit</b><code>titleContains · isInForce · langAndVersion=fin@</code></span><span><b>Dokumentti</b><span>Finlexin avoin data · Akoma Ntoso XML</span></span></div><a href="https://www.finlex.fi/fi/avoin-data/integraation-pikaopas" target="_blank" rel="noopener noreferrer">Finlexin integraation pikaopas ↗</a></div></section>`;
  }

  function contractsView() {
    const records = state.legalRecords || [];
    return `${heading('Sopimus- ja asiakirjaviitteet','Kirjaa työmaan juridisten asiakirjojen tunnisteet ja linkit paikalliseen selaintyötilaan.',`<a class="button" href="?page=legal" data-page="legal">← Legal-etusivulle</a>`)}<div class="question-layout"><section class="panel"><div class="panel-head"><div><h2>Lisää viite</h2><p>Tiedosto jää omaan lähdejärjestelmään; tähän tallentuu viitetieto.</p></div></div><div class="panel-body"><form id="legalRecordForm" class="inline-form"><label>Asiakirjatyyppi<select name="recordType"><option>Sopimus</option><option>Lupa</option><option>Viranomaisasia</option><option>Vakuutus</option><option>Muu juridinen viite</option></select></label><label>Työmaa<select name="siteId">${SITES.map((site)=>`<option value="${site.id}">${escapeHtml(site.name)}</option>`).join('')}</select></label><label class="span-two">Otsikko *<input name="title" required maxlength="120" placeholder="Esim. työmaan urakkasopimus"></label><label>Vastapuoli / viranomainen<input name="counterparty" maxlength="100" placeholder="Yritys tai viranomainen"></label><label>Tunniste tai URL<input name="reference" maxlength="300" placeholder="Asiakirjatunnus tai linkki"></label><label>Tila<select name="status"><option>Tarkistettava</option><option>Luonnos</option><option>Voimassa</option><option>Arkistoitu</option></select></label><button class="button button-primary" type="submit">＋ Tallenna viite</button></form><p class="privacy-note">Viitteet tallentuvat tämän selaimen paikalliseen työtilaan. Varsinaiset tiedostot säilyvät niiden nykyisessä lähdejärjestelmässä.</p></div></section><section class="panel"><div class="panel-head"><div><h2>Viiterekisteri</h2><p>${records.length} asiakirjaviitettä · selaimen tallennustila</p></div><a class="button button-sm" href="?page=crm" data-page="crm">CRMS ↗</a></div><div class="panel-body question-list">${records.map((item)=>`<article class="question-card"><div><span class="tag blue">${escapeHtml(item.recordType)}</span><small>${escapeHtml(siteName(item.siteId))} · ${escapeHtml(item.counterparty||'Vastapuolta ei merkitty')}</small></div><p><strong>${escapeHtml(item.title)}</strong><br><span class="muted">${escapeHtml(item.status)}</span></p><div class="question-actions">${item.reference&&/^https?:\/\//i.test(item.reference)?`<a class="button button-sm" href="${escapeHtml(item.reference)}" target="_blank" rel="noopener noreferrer">Avaa asiakirja ↗</a>`:`<span class="muted small">${escapeHtml(item.reference||'Ei tunnistetta')}</span>`}<button class="button button-sm" data-action="remove-legal-record" data-id="${escapeHtml(item.id)}" type="button">Poista</button></div></article>`).join('')||'<div class="empty-state"><strong>Ei asiakirjaviitteitä</strong>Lisää tähän työmaan sopimus-, lupa- tai viranomaisasiakirjan tunniste.</div>'}</div></section></div>`;
  }

  function complianceView() {
    const areas = [
      ['§','Finlex-säädöshaku','Hae säädösten nimiä avoimesta Finlex-rajapinnasta.','finlex'],
      ['▤','Sopimus- ja asiakirjaviitteet','Työmaiden sopimus-, lupa- ja viranomaisviitteet.','contracts'],
      ['✓','Auditointi ja compliance','Sisäiset tarkastukset, havainnot ja korjaavien toimien seuranta.','compliance'],
      ['♙','Henkilöstösertifikaatit','Yritys-, järjestelmä- ja henkilöstösertifikaattien rekisteri.','certificates'],
    ];
    return `${heading('Auditointi · Compliance','Seuraa auditointien havaintoja, velvoitteita ja sertifiointien hallintaa.', `<a class="button" href="?page=legal" data-page="legal">← Legal-etusivulle</a>`)}${workspaceArtHero('AUDIT · COMPLIANCE', 'Laki- ja vaatimustenmukaisuustalo', 'Auditointi ja työmaakohtaiset velvoitteet ovat osa Legal-kokonaisuutta. Finlex-haku ja sopimusviitteet löytyvät Legal-haaran muilta alalehdiltä.', 'assets/illustrations/legal-compliance-isometric.png', 'Isometrinen laki- ja auditointitalo, asiakirja-arkisto, vaatimustenmukaisuuden tarkistuslista ja auditointitiimi', `<a class="button button-primary" href="?page=finlex" data-page="finlex">Avaa Finlex-haku</a><a class="button" href="?page=contracts" data-page="contracts">Asiakirjaviitteet</a>`)}<div class="metric-grid">${metric('⚖','Osa-aluetta',areas.length,'Finlex · sopimukset · audit · sertifikaatit','blue')}${metric('▤','Henkilöstöpätevyydet',state.certificates.length,'rekisterissä','purple')}${metric('▣','Koulutukset',(state.courses||[]).length,'perehdytys ja osaaminen','green')}${metric('⌂','Soveltamisala','Työmaa','projektikohtaiset viitteet','amber')}</div><section class="panel compliance-areas-panel"><div class="panel-head"><div><h2>Legal-haaran osa-alueet</h2><p>Siirry valitsemaasi juridiseen näkymään.</p></div><span class="tag blue">LEGAL · AUDIT · COMPLIANCE</span></div><div class="panel-body"><div class="compliance-area-grid">${areas.map(([icon,title,description,key])=>`<article class="compliance-area-card"><span aria-hidden="true">${icon}</span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></div><a class="button button-sm" href="?page=${key}" data-page="${key}">Avaa</a></article>`).join('')}</div><p class="privacy-note">Finlex-haku käyttää virallisen rajapinnan säädösnimiä. Sopimusnäkymä tallentaa viitetiedot selaimeen; tiedostoja ei kopioida tähän työtilaan.</p></div></section>`;
  }

  function logisticsView() {
    const deliveries=[...(state.logisticsDeliveries||[]),...scaffoldDeliveries];
    const filtered=deliveries.filter((item)=>state.logisticsFilter==='Kaikki'||item.status===state.logisticsFilter);
    const today=deliveries.filter((item)=>item.date===TODAY_ISO).length;
    const underway=deliveries.filter((item)=>['Lastaus','Matkalla'].includes(item.status)).length;
    const statuses=['Kaikki','Suunniteltu','Lastaus','Matkalla','Perillä','Palautettu','Valmis'];
    const stock=WAREHOUSE_STOCK;
    return `${heading('LMS · Logistiikan hallinta','Logistics Management System · aikatauluta työmaatoimitukset ja seuraa kuljetuksia sekä vastaanottoa.',`<a class="button" href="?page=wms" data-page="wms">Avaa WMS ↗</a>`)}
      ${workspaceArtHero('LMS · LOGISTICS MANAGEMENT', 'Toimitukset oikeaan aikaan, oikeaan paikkaan', 'Koontinäkymä kuormille, kuljetuksille ja työmaan vastaanotolle. Varaston saldot löytyvät WMS-näkymästä.', 'assets/illustrations/logistics-warehouse-isometric.png', 'Isometrinen työmaan logistiikka- ja varastokuvake: kuorma-auto, trukki ja telinekalusto', '<a class="button button-primary" href="#logisticsCreate">＋ Aikatauluta toimitus</a><a class="button" href="?page=wms" data-page="wms">Avaa WMS</a>')}
      <div class="metric-grid">${metric('⇄','Toimituksia tänään',today,'työtilan toimitusjonossa','blue')}${metric('▣','Kuljetuksessa',underway,'lastaus tai matkalla','amber')}${metric('♙','Työmaita',SITES.length,'joihin voi kohdistaa toimituksen','green')}${metric('▤','Varastoryhmiä',stock.length,'esimerkin saatavuusarviot','purple')}</div>
      <div class="logistics-layout"><section class="panel" id="logisticsCreate"><div class="panel-head"><div><h2>Aikatauluta toimitus</h2><p>Lisää kuorma paikalliseen toimitusjonoon.</p></div><span class="tag blue">Paikallinen työtila</span></div><div class="panel-body"><form id="logisticsDeliveryForm" class="logistics-form"><label>Toimituksen sisältö *<input name="title" required maxlength="120" placeholder="Esim. telineosien täydennys"></label><label>Työmaa<select name="siteId">${SITES.map((site)=>`<option value="${site.id}">${escapeHtml(site.name)}</option>`).join('')}</select></label><label>Ajoneuvo / tunniste<input name="vehicle" maxlength="80" placeholder="Kuorma-auto · ABC-123"></label><label>Päivä<input name="date" type="date" value="${TODAY_ISO}" required></label><label>Aika<input name="time" type="time" value="09:00" required></label><label>Kuorman kuvaus<input name="load" maxlength="160" placeholder="Materiaalit, määrät tai lavat"></label><button class="button button-primary" type="submit">＋ Lisää toimitusjonoon</button></form></div></section>
        <section class="panel logistics-stock-panel"><div class="panel-head"><div><h2>WMS · Varastokooste</h2><p>Varastopaikat ja materiaaliryhmät löytyvät omalta sivultaan.</p></div><a class="button button-sm" href="?page=wms" data-page="wms">Avaa WMS ↗</a></div><div class="panel-body logistics-stock-list">${stock.map(([name,value,unit,color])=>`<div class="logistics-stock-row"><span>${escapeHtml(name)}</span><div class="dashboard-progress"><i class="${color}" style="width:${value}%"></i></div><strong>${value}${unit}</strong></div>`).join('')}<p class="privacy-note">Saatavuusprosentit ovat käyttöliittymän esimerkkitietoja, eivät reaaliaikainen varastosaldo.</p></div></section></div>
      <section class="panel logistics-delivery-panel"><div class="panel-head"><div><h2>Toimitusjono</h2><p>${filtered.length} toimitusta · telineprojektien BOM-toimitukset tallentuvat palvelimelle; muut paikalliset luonnokset selaimeen.</p></div><div class="logistics-filters" role="group" aria-label="Suodata toimituksia">${statuses.map((status)=>`<button class="button button-sm ${state.logisticsFilter===status?'button-primary':''}" data-action="logistics-filter" data-status="${escapeHtml(status)}" type="button">${escapeHtml(status)}</button>`).join('')}</div></div><div class="panel-body logistics-delivery-list">${filtered.map((item)=>`<article class="logistics-delivery-row"><span class="logistics-truck-icon" aria-hidden="true">▰</span><div class="logistics-delivery-main"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.projectId?(item.buildingAddress||item.buildingName||'Telineprojekti'):siteName(item.siteId))} · ${formatDate(item.date,{day:'numeric',month:'short',year:'numeric'})} klo ${escapeHtml(item.time)}${item.projectId?` · rev ${item.projectRevision}`:''}</small><small>${escapeHtml(item.vehicle||'Ajoneuvoa ei merkitty')} · ${escapeHtml(item.projectId?`${item.totalQuantity} kpl · ${item.items.length} BOM-riviä`:item.load||'Kuorman kuvausta ei lisätty')}${item.projectId?` · <a href="/?page=scaffold&amp;projectId=${encodeURIComponent(item.projectId)}">Avaa projekti ↗</a>`:''}</small></div>${statusTag(item.status)}<button class="button button-sm" data-action="logistics-advance" data-id="${escapeHtml(item.id)}" type="button" ${item.status==='Valmis'?'disabled':''}>${item.status==='Perillä'?'Kuorma palautettu':item.status==='Palautettu'?'Merkitse valmiiksi':item.status==='Valmis'?'Valmis':'Päivitä tila'}</button></article>`).join('')||'<div class="empty-state"><strong>Ei toimituksia tässä suodatuksessa</strong>Lisää toimitus tai vaihda suodatusta.</div>'}</div></section>
      <p class="privacy-note">Tämä näkymä on paikallinen työnkulun luonnos. Se ei vielä varaa ajoneuvoja, lähetä kuljetustilausta tai synkronoi ulkoiseen varastonhallintaan.</p>`;
  }

  function bomView() {
    const selected = state.bomManufacturer || 'Layher';
    const availableSystems=[...new Set(scaffoldCatalog.filter((item)=>item['Valmistaja']===selected).map((item)=>String(item['Järjestelmä / katalogi']||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fi'));
    const selectedSystem=availableSystems.includes(state.bomSystem)?state.bomSystem:selected==='Layher'&&availableSystems.includes('Allround Scaffolding')?'Allround Scaffolding':availableSystems.length===1?availableSystems[0]:'';
    const query = (state.bomQuery || '').trim().toLocaleLowerCase('fi');
    const manufacturers = scaffoldManufacturers;
    const catalogRows = scaffoldCatalog.map((item,index)=>({...item,_index:index})).filter((item)=>(!selected||item['Valmistaja']===selected)&&(!selectedSystem||item['Järjestelmä / katalogi']===selectedSystem)&&(!query||Object.entries(item).some(([key,value])=>key!=='_index'&&String(value).toLocaleLowerCase('fi').includes(query)))).slice(0,18);
    const projectOptions=scaffoldProjectRecords.map((project)=>`<option value="${escapeHtml(project.id)}" ${state.bomProjectId===project.id?'selected':''}>${escapeHtml(project.name)} · rev ${project.revision} · ${escapeHtml(project.buildingName)}</option>`).join('');
    const linkedBom=bomLinkedProject?.model?.bom||[];
    const selectedBomTarget=linkedBom.find((line)=>line.id===bomLinkTargetId)||linkedBom[0]||null;
    if(selectedBomTarget)bomLinkTargetId=selectedBomTarget.id;
    const bomLinkOptions=linkedBom.map((line)=>`<option value="${escapeHtml(line.id)}" ${selectedBomTarget?.id===line.id?'selected':''}>${escapeHtml(line.itemNo)} · ${escapeHtml(line.name)}</option>`).join('');
    const linkedBomRows=linkedBom.map((line)=>`<tr><td><strong>${escapeHtml(line.name)}</strong><small>${escapeHtml(line.manufacturer)} · ${escapeHtml(line.system)} · ${escapeHtml(line.itemNo)} · ${escapeHtml(line.size)}</small></td><td>${Number(line.quantity)||0} ${escapeHtml(line.unit||'kpl')}</td><td>${line.totalWeightKg==null?'—':Number(line.totalWeightKg).toFixed(1)+' kg'}</td><td><a href="${escapeHtml(line.source)}" target="_blank" rel="noopener noreferrer">Lähde s. ${escapeHtml(line.sourcePage)} ↗</a><small>${escapeHtml(line.catalogRevision)} · ${escapeHtml(line.quantityStatus)}</small></td></tr>`).join('');
    const linkedPricing=bomLinkedProject?.costSummary;
    const makerCards = manufacturers.map((item)=>{
      const name=String(item.manufacturer||'');
      const short=name.split(/\s+/).map((part)=>part[0]).join('').slice(0,3).toUpperCase();
      const logo=Boolean(item.logoUrl);
      const image=logo?`<img src="${escapeHtml(item.logoUrl)}" alt="${escapeHtml(name)} logo" loading="lazy"><span class="scaffold-logo-fallback" hidden>${escapeHtml(short)}</span>`:`<span class="scaffold-text-wordmark">${escapeHtml(name)}</span>`;
      const source=item.brandSource||item.catalogUrl||'';
      return `<div class="bom-maker-option"><button class="bom-maker-card ${selected===name?'selected':''}" data-action="select-bom-manufacturer" data-manufacturer="${escapeHtml(name)}" type="button" aria-pressed="${selected===name}"><span class="scaffold-manufacturer-logo bom-maker-logo">${image}</span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(item.systems||'Järjestelmä ei merkitty')}</small><span>${Number(item.componentCount||0).toLocaleString('fi-FI')} osaa · ${selected===name?'Valittu':'Valitse kirjasto'}</span></button>${source?`<a class="bom-maker-source" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Logo- tai katalogilähde ↗</a>`:''}</div>`;
    }).join('');
    const componentCards=catalogRows.map((item)=>`<article class="bom-catalog-row"><div><strong>${escapeHtml(item['Nimike / variantti']||'Komponentti')}</strong><small>${escapeHtml(item['Valmistaja']||'')} · ${escapeHtml(item['Järjestelmä / katalogi']||'')} · ${escapeHtml(item['Tuotenumero / viite']||'')}</small><small>${escapeHtml(item['Mitta / nimellismitta']||'Mittaa ei ilmoitettu')} · ${escapeHtml(item['Tietojen tila']||'Tarkistettava')}</small></div><div class="bom-catalog-actions"><button class="button button-sm" data-action="add-bom-component" data-index="${item._index}" type="button">Lisää katalogikoriin</button>${bomLinkedProject&&item['Valmistaja']===bomLinkedProject.system?.manufacturer&&item['Järjestelmä / katalogi']===bomLinkedProject.system?.name?`<button class="button button-sm" data-action="link-catalog-to-project-bom" data-index="${item._index}" type="button" ${selectedBomTarget?'':'disabled'}>Liitä valittuun malliriviin</button>`:''}</div></article>`).join('');
    const bomRows=(state.bomItems||[]).map((item)=>`<tr><td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.manufacturer)} · ${escapeHtml(item.system)} · ${escapeHtml(item.reference)}</small></td><td><input class="bom-quantity" type="number" min="1" step="1" value="${Number(item.quantity)||1}" data-bom-quantity="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} määrä"></td><td>${escapeHtml(item.unit||'kpl')}</td><td>${item.source?`<a href="${escapeHtml(item.source)}" target="_blank" rel="noopener noreferrer">Lähde ↗</a>`:'—'}<small>${escapeHtml(item.revision||'Revisio tarkistettava')}</small></td><td><button class="button button-sm" data-action="remove-bom-item" data-id="${escapeHtml(item.id)}" type="button">Poista</button></td></tr>`).join('');
    return `${heading('Materiaaliluettelo · BOM', 'Näet tallennetun telineversion parametrisen BOMin ja voit pitää erillisen katalogikorin täydentäviä rivejä varten.', `<a class="button" href="?page=manufacturing" data-page="manufacturing">▤ MMS-arkisto</a><button class="button button-primary" data-action="export-bom" type="button">Vie katalogikori CSV</button>`)}<section class="panel bom-project-panel"><div class="panel-head"><div><h2>Telineprojektin revisio-BOM</h2><p>Projektin tallennettu mallirevisio on määrien lähde. Tämä taulukko on vain luku -näkymä.</p></div>${bomLinkedProject?`<span class="tag blue">Rev ${bomLinkedProject.revision}</span>`:''}</div><div class="panel-body"><label class="scaffold-project-picker">Valitse tallennettu telineprojekti<select id="bomProjectSelect"><option value="">${scaffoldProjectsLoaded?'Valitse projekti':'Ladataan projekteja…'}</option>${projectOptions}</select></label>${bomLinkedProjectError?`<p class="privacy-note">${escapeHtml(bomLinkedProjectError)}</p>`:''}${bomLinkedProjectLoading?'<p class="muted small">Ladataan projektin revisiota…</p>':''}${bomLinkedProject?`<div class="bom-project-summary"><div><strong>${escapeHtml(bomLinkedProject.name)}</strong><small>${escapeHtml(bomLinkedProject.building.name||bomLinkedProject.building.address||'Kohdetta ei nimetty')} · ${escapeHtml(bomLinkedProject.building.projectCrs||'CRS ei ilmoitettu')}</small></div><div><strong>${(Number(linkedPricing?.total)||0).toLocaleString('fi-FI',{style:'currency',currency:'EUR'})}</strong><small>Rev ${bomLinkedProject.revision} tarjousluonnoksen summa</small></div><a class="button button-sm" href="/?page=scaffold&amp;projectId=${encodeURIComponent(bomLinkedProject.id)}">Avaa telineprojekti ↗</a><button class="button button-sm" data-action="reload-linked-project-bom" type="button">Päivitä revisio</button><button class="button button-sm" data-action="download-linked-project-bom" type="button">Lataa rev ${bomLinkedProject.revision} BOM CSV</button></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Komponentti</th><th>Laskettu määrä</th><th>Paino</th><th>Lähde / tila</th></tr></thead><tbody>${linkedBomRows||'<tr><td colspan="4">Tähän revisioon ei muodostunut BOM-rivejä.</td></tr>'}</tbody></table></div><p class="privacy-note">Määrät ja tarjousarvo tulevat samasta tallennetusta projektiorevisiosta. Lähde: ${escapeHtml(bomLinkedProject.system?.manualRevision||'järjestelmärevisiota ei ilmoitettu')}. Tiedot ovat geometrinen luonnos; ratkaisemattomat jäykistys-, sidonta-, alusta- ja suunnittelijahyväksynnän kohdat tarkistetaan telineprojektissa.</p>`:'<p class="hint">Valitse projekti nähdäksesi saman revisioidun BOMin, joka lähtee LMS-toimitusjonoon ja tarjousluonnokseen.</p>'}</div></section><section class="panel bom-library-panel"><div class="panel-head"><div><h2>Komponenttikirjaston valmistaja</h2><p>Valmistajien merkit ja lähdesivut on tuotu komponenttikatalogin metatiedoista.</p></div><span class="tag blue">${manufacturers.length} valmistajaa</span></div><div class="panel-body"><div class="bom-maker-grid">${makerCards||'<span class="muted">Valmistajalistaa ladataan…</span>'}</div><div class="privacy-note">Layher Allround on oletuskatalogi. Katalogirivit on poimittu lähde-PDF:stä ja niiden tiedon tila näkyy jokaisella rivillä; tarkista tuotenumero alkuperäisestä oppaasta. Layher Event Systems pysyy erillisenä järjestelmänä. Parametrisen telineprojektin revisio-BOM käyttää oletuksena Layher Allround -osia ja asennusohjetta.</div></div></section><section class="panel bom-catalog-panel"><div class="panel-head"><div><h2>${selected?'Katalogihaku · '+escapeHtml(selected)+(selectedSystem?' · '+escapeHtml(selectedSystem):''):'Katalogihaku'}</h2><p>${selectedSystem?'Näytetään vain valitun valmistajan ja järjestelmän tietueet.':'Valitse järjestelmä ennen kuin lisäät sen osia katalogikoriin.'}</p></div><span class="tag">${scaffoldCatalog.length.toLocaleString('fi-FI')} lähderiviä</span></div><div class="panel-body"><div class="toolbar"><input id="bomSearch" class="search-input" type="search" placeholder="Hae nimeä, tuotenroa tai mittaa…" value="${escapeHtml(state.bomQuery||'')}" aria-label="Hae BOM-komponentteja"><label class="bom-system-filter">Järjestelmä<select id="bomSystemFilter" class="select-control" aria-label="Valitse komponenttijärjestelmä"><option value="">Valitse järjestelmä</option>${availableSystems.map((system)=>`<option value="${escapeHtml(system)}" ${selectedSystem===system?'selected':''}>${escapeHtml(system)}</option>`).join('')}</select></label><button class="button button-sm" data-action="clear-bom-maker" type="button">Palauta Layher Allround</button></div>${bomCatalogError?`<p class="privacy-note">${escapeHtml(bomCatalogError)}</p>`:''}<p class="muted small">${catalogRows.length} riviä näytetään · tarkenna hakua nähdäksesi lisää.</p><div class="bom-catalog-list">${selectedSystem?(componentCards||'<div class="empty-state"><strong>Ei osumia</strong>Muuta hakusanaa tai järjestelmää.</div>'):'<div class="empty-state"><strong>Valitse järjestelmä</strong>Valmistajan eri järjestelmien osia ei yhdistetä samaan näkymään.</div>'}</div></div></section><section class="panel bom-table-panel"><div class="panel-head"><div><h2>Vapaa katalogikori · ei liitetty telineprojektin revisioon</h2><p>${(state.bomItems||[]).length} riviä · selaimen paikallinen luonnos</p></div></div><div class="panel-body table-scroll"><table class="data-table"><thead><tr><th>Komponentti</th><th>Määrä</th><th>Yksikkö</th><th>Lähde / revisio</th><th></th></tr></thead><tbody>${bomRows||'<tr><td colspan="5">Kori on tyhjä. Valitse komponenttikirjasto ja lisää osia erillistä materiaalivertailua varten.</td></tr>'}</tbody></table><p class="privacy-note">Katalogikori on erillinen työtilavedos; sitä ei sisällytetä parametrisesta projektista vietyyn LMS-kuormaan tai tarjoukseen.</p></div></section>`;
  }

  function initBomCatalogLinkControls(){
    if(!bomLinkedProject)return;
    const lines=bomLinkedProject.model?.bom||[];
    const target=lines.find((line)=>line.id===bomLinkTargetId)||lines[0];
    if(target)bomLinkTargetId=target.id;
    const summary=$('.bom-project-summary');
    if(summary&&lines.length){
      const label=document.createElement('label');label.className='bom-link-target';label.textContent='Katalogiin liitettävä mallirivi';
      const select=document.createElement('select');select.id='bomLinkTargetSelect';
      for(const line of lines){const option=document.createElement('option');option.value=line.id;option.textContent=`${line.itemNo} · ${line.name}`;option.selected=line.id===target?.id;select.append(option);}
      label.append(select);summary.after(label);
    }
    const table=$('.bom-project-panel .data-table');
    const head=table?.querySelector('thead tr');
    if(head){const th=document.createElement('th');th.textContent='Katalogiliitos';head.append(th);}
    const rows=table?[...table.querySelectorAll('tbody tr')]:[];
    rows.forEach((row,index)=>{
      const line=lines[index];if(!line)return;
      const cell=document.createElement('td'),match=line.catalogLink;
      if(match){const strong=document.createElement('strong');strong.textContent=`${match.itemNo} · ${match.name}`;const detail=document.createElement('small');detail.textContent=`${match.manufacturer} · ${match.system} · ${match.size||'mittaa ei ilmoitettu'}`;const status=document.createElement('small');status.textContent=`${match.revision||'Revisiota ei ilmoitettu'} · käyttäjän valitsema; yhteensopivuus tarkistettava`;cell.append(strong,detail,status);const unlink=document.createElement('button');unlink.className='button button-sm';unlink.type='button';unlink.dataset.action='unlink-catalog-from-project-bom';unlink.dataset.lineId=line.id;unlink.textContent='Poista liitos';cell.append(unlink);}
      else {const tag=document.createElement('span');tag.className='tag amber';tag.textContent='Ei liitetty';cell.append(tag);}
      row.append(cell);
    });
    for(const card of $$('.bom-catalog-row')){
      const addButton=card.querySelector('[data-action="add-bom-component"]');
      const index=Number(addButton?.dataset.index),item=scaffoldCatalog[index];
      if(!item||item['Valmistaja']!==bomLinkedProject.system?.manufacturer||item['Järjestelmä / katalogi']!==bomLinkedProject.system?.name)continue;
      const actions=document.createElement('div');actions.className='bom-catalog-actions';
      if(addButton){card.replaceChild(actions,addButton);actions.append(addButton);}
      const link=document.createElement('button');link.className='button button-sm';link.type='button';link.dataset.action='link-catalog-to-project-bom';link.dataset.index=String(index);link.textContent=`Liitä: ${target?.name||'valitse mallirivi'}`;link.disabled=!target;actions.append(link);
    }
  }

  async function saveBomCatalogLink(lineId,itemIndex,remove=false){
    if(!bomLinkedProject){toast('Valitse tallennettu telineprojekti ennen katalogiliitosta.');return;}
    const line=(bomLinkedProject.model?.bom||[]).find((row)=>row.id===lineId);
    if(!line){toast('Valittu mallirivi ei kuulu tämän projektin BOMiin.');return;}
    const pricing=structuredClone(bomLinkedProject.pricing||{}),catalogLinks={...(pricing.catalogLinks||{})};
    if(remove)delete catalogLinks[lineId];
    else {
      const item=scaffoldCatalog[Number(itemIndex)];
      if(!item){toast('Valittu katalogirivi puuttuu. Lataa katalogi uudelleen.');return;}
      if(item['Valmistaja']!==bomLinkedProject.system?.manufacturer||item['Järjestelmä / katalogi']!==bomLinkedProject.system?.name){toast('Katalogirivin pitää olla projektin samaa valmistajaa ja järjestelmää.');return;}
      const itemNo=String(item['Tuotenumero / viite']||'').trim();
      if(!itemNo){toast('Valitulla katalogirivillä ei ole tuotenumeroa.');return;}
      catalogLinks[lineId]={catalogId:item['Valintatunniste (tuotekortti)']||itemNo,manufacturer:item['Valmistaja'],system:item['Järjestelmä / katalogi'],itemNo,name:item['Nimike / variantti']||'Komponentti',size:item['Mitta / nimellismitta']||'',source:item['Lähdeasiakirja / URL']||'',revision:item['Katalogiversio']||item['Tietojen tila']||''};
    }
    pricing.catalogLinks=catalogLinks;
    try{
      const project=await scaffoldApi(`/api/scaffold/projects/${encodeURIComponent(bomLinkedProject.id)}`,{method:'PUT',headers:{'If-Match':String(bomLinkedProject.revision)},body:JSON.stringify({...bomLinkedProject,pricing})});
      bomLinkedProject=project;scaffoldProjectRecords=[{id:project.id,name:project.name,revision:project.revision,buildingName:project.building.name||project.building.address||'Käsin annettu kohde'},...scaffoldProjectRecords.filter((row)=>row.id!==project.id)];
      const nextLine=(project.model.bom||[]).find((row)=>row.id===lineId);if(nextLine)bomLinkTargetId=nextLine.id;
      render();toast(remove?'Katalogiliitos poistettiin uutena projektirevisiona.':'Katalogitietue liitettiin malliriviin uutena projektirevisiona. Tarkista yhteensopivuus ennen toimitusta tai tarjousta.');
    }catch(error){toast(error.message||'Katalogiliitosta ei voitu tallentaa.');}
  }

  function osintView() {
    const crawlerUrl = new URL('http://127.0.0.1:3017/');
    crawlerUrl.search = new URLSearchParams({ embed: '1', live: 'hilma', query: 'rakennusurakka', parentOrigin: window.location.origin }).toString();
    return `${heading('Markkina- ja hankintavahti', 'Seuraa julkisia hankintoja ja rakennusalan markkinasignaaleja. Valitut osumat voi liittää CRM-putkeen.', `<button class="button" data-action="refresh-osint" type="button">↻ Päivitä markkinaseuranta</button><a class="button" href="${escapeHtml(crawlerUrl.toString())}" target="_blank" rel="noopener noreferrer">Avaa koko näkymä ↗</a>`)}${workspaceArtHero('PUBLIC MARKET INTELLIGENCE', 'Lähdeasema CRM:n vieressä', 'Julkisten hankintojen, yritystietojen ja rakennushankkeiden seuranta toimii CRM-asiakkuuksien rinnalla.', 'assets/illustrations/market-intelligence-isometric.png', 'Isometrinen tiedonhankinta-asema antenneineen, avoimien lähteiden näytöt ja CRM:ään yhdistetty tapaamistila', `<a class="button button-primary" href="?page=crm" data-page="crm">Siirry CRMS-asiakkuuksiin</a>`)}<section class="panel osint-module"><div class="panel-head"><div><h2>Hankinnat ja markkinasignaalit</h2><p>HILMA avautuu tuoreella rakennusurakkahaulla. Lisää valittu ilmoitus CRM:n myyntiputkeen tuloskortista.</p></div><span class="tag green">Julkiset lähteet</span></div><div class="osint-frame-wrap"><div class="osint-frame-loader"><img src="assets/latausindikaattori-ammattimainen.gif" alt="" width="96" height="81"><strong>Markkina- ja hankintavahti käynnistyy…</strong><span>Haetaan sisältöä paikallisesta lähdepalvelusta.</span></div><iframe id="osintModuleFrame" class="osint-module-frame" src="${escapeHtml(crawlerUrl.toString())}" title="Markkina- ja hankintavahti · julkiset tietolähteet" loading="eager" referrerpolicy="same-origin"></iframe></div><p class="muted small osint-module-note">HILMA-haku käyttää paikallista avainholvia ja hakee avoimet ilmoitukset HILMAsta. Tarkista ehdot ja määräajat alkuperäisestä ilmoituksesta.</p></section>`;
  }

  function render() {
    window.TelineMapData?.detach();
    if (currentPage === 'manufacturing') loadBomCatalog();
    if ((currentPage === 'logistics' || currentPage === 'lms') && !scaffoldDeliveriesLoaded && !scaffoldDeliveriesLoading) void loadScaffoldDeliveries();
    if (currentPage === 'crm' && !crmLoaded && !crmLoading && !crmLoadError) void loadCrm();
    if (geoWorkspaceMap) {
      geoWorkspaceMap.remove();
      geoWorkspaceMap = null;
      geoMarkerLayer = null;
      geoMarkerObjects.clear();
      geoMarkersLoaded = false;
      geoPlaceMarkerMode = false;
    }
    document.documentElement.lang = state.preferences.language || 'fi';
    document.documentElement.dataset.palette = ['christiania', 'traditional', 'engineering', 'future', 'ancient', 'paperwork', 'spring', 'summer', 'autumn', 'winter'].includes(state.preferences.palette) ? state.preferences.palette : 'christiania';
    document.body.classList.toggle('theme-dark', state.preferences.theme === 'dark');
    renderNav();
    const views = { dashboard: dashboardView, city: cityView, finance: financeView, tasks: taskView, calendar: calendarView, time: timeView, mobile: mobileView, profile: profileView, certificates: certificateView, design: designView, knowledge: knowledgeView, scaffold: scaffoldView, weather: weatherView, osint: osintView, crm: crmView, bom: bomView, wms: wmsView, logistics: logisticsView, lms: logisticsView, rental: rentalView, manufacturing: manufacturingView, legal: legalView, finlex: finlexView, contracts: contractsView, compliance: complianceView, hr: hrView, courses: coursesView, questions: questionsView, gis: gisView, mapdata: mapDataView, blueprints: blueprintsView, dev: devView, settings: settingsView };
    syncWorkspaceRatchetCursor();
    $('#appView').innerHTML = views[currentPage] ? views[currentPage]() : gisView();
    const dashboardMindmap = $('#mindmapNav');
    if (dashboardMindmap) dashboardMindmap.innerHTML = mindmapNavMarkup();
    applyWeatherWidgetPosition();
    updateWeatherComponents();
    $('#sidebarUser').textContent = state.profile.name || 'Demo-käyttäjä';
    const syncLabel = $('#syncIndicatorLabel');
    const persistenceLabels = {
      crm: 'CRM · tallennus palvelimelle',
      scaffold: 'Telineprojektit · tallennus palvelimelle',
      bom: 'Projektit palvelimella · katalogikori selaimessa',
      logistics: 'LMS-toimitukset · tallennus palvelimelle',
      lms: 'LMS-toimitukset · tallennus palvelimelle',
      design: 'Aineistoviitteet selaimessa · tiedostot palvelimella',
    };
    if (syncLabel) syncLabel.textContent = persistenceLabels[currentPage] || 'Työtilatiedot tallennetaan tähän selaimeen';
    const themeButton = $('.theme-toggle');
    if (themeButton) {
      const dark = state.preferences.theme === 'dark';
      themeButton.textContent = dark ? '☀ Vaalea' : '☾ Tumma';
      themeButton.setAttribute('aria-label', dark ? 'Vaihda vaaleaan teemaan' : 'Vaihda tummaan teemaan');
    }
    const loading = $('#workspaceLoading');
    if (loading) loading.hidden = true;
    $('#appView').focus({ preventScroll: true });
    if (currentPage === 'settings' && state.settingsTab === 'apiKeys') loadApiKeyList();
    if (currentPage === 'scaffold') { initScaffoldStudio(); openScaffoldProjectFromUrl(); }
    if (currentPage === 'gis') initGeoWorkspace();
    if (currentPage === 'mapdata') void window.TelineMapData.mount($('#mapDataCatalogue'), {onMapRequest:()=>navigate('gis')});
    if (currentPage === 'osint') {
      const frame=$('#osintModuleFrame');
      frame?.addEventListener('load',()=>frame.parentElement?.classList.add('is-loaded'),{once:true});
      if(frame)window.setTimeout(()=>frame.parentElement?.classList.add('is-loaded'),15000);
    }
    if (currentPage === 'bom') {
      loadBomCatalog();
      if(!scaffoldProjectsLoaded&&!scaffoldProjectsLoading)void loadScaffoldProjectRecords();
      if(state.bomProjectId&&(!bomLinkedProject||bomLinkedProject.id!==state.bomProjectId)&&!bomLinkedProjectLoading)void loadBomLinkedProject(state.bomProjectId);
      $$('.bom-maker-logo img').forEach((img)=>img.addEventListener('error',()=>{img.hidden=true;const fallback=img.parentElement.querySelector('.scaffold-logo-fallback');if(fallback)fallback.hidden=false;}));
      initBomCatalogLinkControls();
    }
  }

  function toast(message) {
    const element = $('#toast');
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => element.classList.remove('show'), 2700);
  }

  function closeMobileNav() {
    $('#sidebar').classList.remove('open');
    $('#sidebarScrim').classList.remove('show');
    $('#sidebar').setAttribute('aria-hidden', 'true');
    $('#menuToggle').setAttribute('aria-expanded', 'false');
    $('#mobileMore')?.setAttribute('aria-expanded', 'false');
  }

  function navigate(page, replace = false) {
    if (!PAGE_META[page]) return;
    currentPage = page;
    const url = new URL(location.href);
    if (page === 'dashboard') url.searchParams.delete('page');
    else url.searchParams.set('page', page);
    history[replace ? 'replaceState' : 'pushState']({ page }, '', `${url.pathname}${url.search}${url.hash}`);
    closeMobileNav();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formField(name, label, type = 'text', options = {}) {
    const required = options.required ? 'required' : '';
    const value = options.value == null ? '' : escapeHtml(options.value);
    const placeholder = options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : '';
    let control = '';
    if (type === 'textarea') control = `<textarea name="${name}" ${required}${placeholder}>${value}</textarea>`;
    else if (type === 'select') control = `<select name="${name}" ${required}>${options.items.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === options.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select>`;
    else control = `<input name="${name}" type="${type}" value="${value}" ${required}${placeholder}${options.min ? ` min="${options.min}"` : ''}${options.step ? ` step="${options.step}"` : ''}>`;
    const id = `field-${name}`;
    control = control.replace(`<${type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input'} `, `<${type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input'} id="${id}" `);
    return `<div class="form-field"><label for="${id}">${escapeHtml(label)}${options.required ? ' *' : ''}</label>${control}</div>`;
  }

  function openDialog(title, subtitle, fields, submitText, kind) {
    const modal = $('#modal');
    modal.innerHTML = `<form id="dialogForm" data-kind="${kind}"><div class="dialog-head"><div><h2 id="dialogTitle">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Sulje">×</button></div><div class="dialog-body"><div class="form-grid">${fields}</div></div><div class="dialog-actions"><button type="button" class="button" data-action="close-dialog">Peruuta</button><button class="button button-primary" type="submit">${escapeHtml(submitText)}</button></div></form>`;
    modal.showModal();
    const first = $('input,select,textarea', modal);
    if (first) first.focus();
  }

  function openTaskDialog() {
    const fields = formField('title', 'Otsikko', 'text', { required: true, placeholder: 'Esim. Tarkasta teline' }) +
      formField('description', 'Kuvaus', 'textarea', { placeholder: 'Tehtävän ohjeet ja lisätiedot' }) +
      formField('siteId', 'Työmaa', 'select', { required: true, items: SITES.map((site) => ({ value: site.id, label: site.name })), value: SITES[0].id }) +
      formField('project', 'Projekti', 'text', { placeholder: 'Projektin nimi' }) +
      formField('team', 'Tiimi', 'text', { placeholder: 'Tiimin nimi' }) +
      formField('assignee', 'Vastuuhenkilö', 'text', { value: state.profile.name || 'Demo-käyttäjä' }) +
      formField('status', 'Tila', 'select', { items: TASK_STATES.map((item) => ({ value: item, label: item })), value: 'Tekemättä' }) +
      formField('priority', 'Prioriteetti', 'select', { items: PRIORITIES.map((item) => ({ value: item, label: item })), value: 'Normaali' }) +
      formField('dueDate', 'Määräaika', 'date', { value: toIso(addDays(TODAY, 2)) }) +
      formField('estimate', 'Arvioitu aika (h)', 'number', { min: '0', step: '0.5', value: '1' }) +
      formField('notes', 'Huomiot', 'textarea', { placeholder: 'Lisähuomiot työryhmälle' });
    openDialog('Uusi tehtävä', 'Lisää työmaalle tehtävä paikalliseen työtilaan.', fields, 'Luo tehtävä', 'task');
  }

  function openCertificateDialog() {
    const fields = formField('employee', 'Työntekijä', 'select', { required: true, items: [...new Set([state.profile.name || 'Demo-käyttäjä', 'Tiimi A', 'Tiimi B'])].map((item) => ({ value: item, label: item })), value: state.profile.name || 'Demo-käyttäjä' }) +
      formField('type', 'Sertifikaattityyppi', 'select', { required: true, items: CERTIFICATE_TYPES.map((item) => ({ value: item, label: item })), value: CERTIFICATE_TYPES[1] }) +
      formField('number', 'Sertifikaattinumero', 'text', { placeholder: 'Paikallinen tunniste' }) +
      formField('issuedAt', 'Myöntämispäivä', 'date', { value: TODAY_ISO }) +
      formField('validUntil', 'Voimassa asti', 'date', { required: true }) +
      formField('issuer', 'Myöntäjä', 'text', { placeholder: 'Kouluttaja tai myöntäjä' });
    openDialog('Lisää sertifikaatti', 'Tallenna pätevyys tämän selaimen työtilaan.', fields, 'Lisää', 'certificate');
  }

  function openDesignResourceDialog(type = 'Materiaaliluettelo') {
    const categories = ['CAD-piirustus', 'Blueprint / tekninen piirustus', 'Telinepiirustus / 3D-malli', 'Materiaaliluettelo', 'Asennusohje'];
    const fields = formField('title', 'Aineiston nimi', 'text', { required: true, placeholder: type.includes('piirustus') || type.includes('Blueprint') ? 'Esim. Hakaniemi · julkisivu A · Rev. 02' : type === 'Asennusohje' ? 'Esim. Telineen pystytysohje' : 'Esim. Julkisivutelineen materiaalit' }) +
      formField('type', 'Aineistotyyppi', 'select', { required: true, items: categories.map((item) => ({ value: item, label: item })), value: categories.includes(type) ? type : categories[0] }) +
      formField('siteId', 'Työmaa / projekti', 'select', { required: true, items: SITES.map((site) => ({ value: site.id, label: site.name })) }) +
      formField('format', 'Tiedostomuoto', 'text', { placeholder: 'Esim. DWG, DXF, IPT, PDF' }) +
      formField('revision', 'Versio', 'text', { placeholder: 'Esim. Rev. 02' }) +
      formField('url', 'Aineiston linkki', 'url', { placeholder: 'https://…' }) +
      formField('notes', 'Huomiot', 'textarea', { placeholder: 'Työmaakohtainen sisältö tai käyttöohje' });
    openDialog('Lisää projektiaineisto', 'Tallenna aineiston tiedot ja linkki tähän selaimeen. Tiedostoa ei ladata sovellukseen.', fields, 'Tallenna aineistoviite', 'design-resource');
  }

  function openAlertDialog() {
    const fields = formField('title', 'Varoituksen otsikko', 'text', { required: true, placeholder: 'Esim. Voimakas tuuli' }) +
      formField('site', 'Työmaa', 'select', { required: true, items: SITES.map((site) => ({ value: site.name, label: site.name })) }) +
      formField('level', 'Vakavuus', 'select', { items: ['Huomio', 'Korkea'].map((item) => ({ value: item, label: item })), value: 'Huomio' }) +
      formField('details', 'Lisätiedot', 'textarea', { placeholder: 'Mitä työryhmän tulee huomioida?' });
    openDialog('Lisää varoitus', 'Lisää manuaalinen sää- tai turvallisuushuomio.', fields, 'Lisää varoitus', 'alert');
  }

  function openProfileDialog() {
    const fields = formField('name', 'Näyttönimi', 'text', { required: true, value: state.profile.name }) +
      formField('role', 'Rooli', 'text', { value: state.profile.role }) +
      formField('phone', 'Puhelin', 'tel', { value: state.profile.phone, placeholder: 'Valinnainen' }) +
      formField('email', 'Sähköposti', 'email', { value: state.profile.email, placeholder: 'Valinnainen' });
    openDialog('Muokkaa profiilia', 'Tiedot jäävät tähän selaimeen.', fields, 'Tallenna', 'profile');
  }

  function startShift() {
    if (state.activeShift) return toast('Työvuoro on jo käynnissä.');
    const siteId = $('#workSiteSelect')?.value || SITES[0].id;
    state.activeShift = { siteId, startedAt: new Date().toISOString() };
    persist();
    render();
    toast(`Työvuoro alkoi: ${siteName(siteId)}.`);
  }

  function endShift() {
    if (!state.activeShift) return;
    const endedAt = new Date().toISOString();
    const durationMs = Math.max(0, new Date(endedAt).getTime() - new Date(state.activeShift.startedAt).getTime());
    state.logs.push({ id: `log-${Date.now()}`, siteId: state.activeShift.siteId, startedAt: state.activeShift.startedAt, endedAt, date: toIso(new Date(state.activeShift.startedAt)), durationMs, total: formatHours(durationMs), status: 'Valmis' });
    state.activeShift = null;
    persist();
    render();
    toast('Työvuoro tallennettiin tähän selaimeen.');
  }

  function crmAddressChoices() {
    if (!crmAddressCandidates.length) return '';
    return `<div class="crm-address-results"><strong>Valitse oikea osoiteosuma</strong>${crmAddressCandidates.map((candidate,index)=>`<button class="crm-address-choice" data-action="crm-select-address" data-index="${index}" type="button"><span>${escapeHtml(candidate.name)}</span><small>${escapeHtml(candidate.longName || candidate.category || 'Helsingin osoitehaku')} · EPSG:3879 ${Number(candidate.easting).toFixed(0)}, ${Number(candidate.northing).toFixed(0)}</small></button>`).join('')}</div>`;
  }

  async function findCrmAddresses(query, target) {
    const clean = String(query || '').trim();
    if (clean.length < 2) return toast('Kirjoita vähintään kaksi merkkiä osoitehakuun.');
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(clean)}&category=Addresses&max=8`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Osoitehakua ei saatu tehtyä.');
      crmAddressCandidates = (data.features || []).filter((item) => item.easting != null && item.northing != null && Number.isFinite(Number(item.easting)) && Number.isFinite(Number(item.northing)) && Number(item.easting) >= 25400000 && Number(item.easting) <= 25550000 && Number(item.northing) >= 6650000 && Number(item.northing) <= 6700000);
      crmAddressTarget = target;
      const choices = crmAddressChoices();
      const targetElement = $(target.type === 'company' ? '#crmAddressResults' : '#crmBuildingAddressResults');
      if (targetElement) targetElement.innerHTML = choices || '<p class="hint">Osoitehakua ei löytynyt. Kokeile tarkempaa katuosoitetta.</p>';
    } catch (error) { toast(error.message || 'Osoitehaku epäonnistui.'); }
  }

  async function chooseCrmAddress(index) {
    const candidate = crmAddressCandidates[index];
    if (!candidate || !crmAddressTarget) return;
    const point = { x: Number(candidate.easting), y: Number(candidate.northing), label: candidate.longName || candidate.name, source: 'Helsingin karttapalvelun osoitehaku' };
    if (crmAddressTarget.type === 'company') {
      try {
        await crmRequest(`/api/crm/companies/${encodeURIComponent(crmAddressTarget.id)}`, { method: 'PATCH', body: JSON.stringify({ location: point }) });
        crmAddressCandidates = [];
        crmAddressTarget = null;
        toast('Yrityksen osoite ja EPSG:3879-piste vahvistettiin.');
        await refreshCrm();
      } catch (error) { toast(error.message); }
    } else {
      crmBuildingLocation = point;
      const address = $('#crmBuildingForm [name="address"]');
      const status = $('#crmBuildingLocationStatus');
      if (address) address.value = point.label;
      if (status) status.textContent = `Valittu osoite: ${point.label} · EPSG:3879 ${point.x.toFixed(0)}, ${point.y.toFixed(0)}`;
      crmAddressCandidates = [];
      crmAddressTarget = null;
      const result = $('#crmBuildingAddressResults');
      if (result) result.innerHTML = '';
    }
  }

  async function patchCrmOpportunity(id, patch) {
    try {
      await crmRequest(`/api/crm/opportunities/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
      crmNotice = '';
      await refreshCrm();
    } catch (error) { toast(error.message); }
  }

  async function saveCrmCompanyField(element) {
    try {
      await crmRequest(`/api/crm/companies/${encodeURIComponent(element.dataset.companyId)}`, { method: 'PATCH', body: JSON.stringify({ [element.dataset.crmCompanyField]: element.value.trim() }) });
      await refreshCrm();
      toast('Yrityksen yhteystieto tallennettiin.');
    } catch (error) { toast(error.message); }
  }

  async function showCrmActivities(id) {
    if (crmExpandedId === id) { crmExpandedId = ''; render(); return; }
    crmExpandedId = id;
    try { crmActivities[id] = await crmRequest(`/api/crm/opportunities/${encodeURIComponent(id)}/activities`); }
    catch (error) { toast(error.message); }
    render();
  }

  async function completeCrmFollowUp(id, note = '', row = null) {
    try {
      const nextAction = row?.querySelector('[data-crm-next-action]')?.value.trim() || '';
      const nextActionDue = row?.querySelector('[data-crm-next-due]')?.value || '';
      const result = await crmRequest(`/api/crm/opportunities/${encodeURIComponent(id)}/complete-action`, { method: 'POST', body: JSON.stringify({ note, nextAction, nextActionDue }) });
      crmActivities[id] = [result.activity, ...(crmActivities[id] || []).filter((activity) => activity.id !== result.activity.id)];
      crmNotice = nextAction ? 'Tehtävä kuitattiin ja seuraava tehtävä kirjattiin samassa tallennuksessa.' : 'Tehtävä kuitattiin tehdyksi ja merkittiin mahdollisuuden aktiviteetteihin.';
      await refreshCrm();
    } catch (error) { toast(error.message); }
  }

  async function rescheduleCrmFollowUp(id, dueDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate || '')) {
      toast('Valitse seurattavalle tehtävälle uusi eräpäivä.');
      return;
    }
    try {
      await crmRequest(`/api/crm/opportunities/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ nextActionDue: dueDate }) });
      crmNotice = `Seurantatehtävän eräpäivä siirrettiin päivälle ${formatDate(dueDate)}.`;
      await refreshCrm();
      toast('Seurannan eräpäivä päivitettiin.');
    } catch (error) { toast(error.message); }
  }

  function handleFormSubmit(event) {
    if (event.target.id === 'finlexSearchForm') {
      event.preventDefault();
      const query = new FormData(event.target).get('query');
      void searchFinlex(query);
      return;
    }
    if (event.target.id === 'legalRecordForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      state.legalRecords = state.legalRecords || [];
      state.legalRecords.unshift({ id: `legal-${Date.now()}`, recordType: String(values.recordType || 'Muu juridinen viite'), siteId: String(values.siteId || SITES[0].id), title: String(values.title || '').trim(), counterparty: String(values.counterparty || '').trim(), reference: String(values.reference || '').trim(), status: String(values.status || 'Tarkistettava'), createdAt: new Date().toISOString() });
      persist(); render(); toast('Asiakirjaviite tallennettiin tähän selaimeen.');
      return;
    }
    if (event.target.id === 'financeRecordForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      state.financeRecords = Array.isArray(state.financeRecords) ? state.financeRecords : [];
      state.financeRecords.unshift({ id: `finance-${Date.now()}`, kind: String(values.kind || 'Muu talousmuistio'), siteId: String(values.siteId || SITES[0].id), title: String(values.title || '').trim(), amount: Math.max(0, Number(values.amount) || 0), createdAt: toIso(TODAY) });
      persist(); render(); toast('Talousmuistio tallennettiin tähän selaimeen.');
      return;
    }
    if (event.target.id === 'scaffoldReviewForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      void submitScaffoldReview(form);
      return;
    }
    if (event.target.id === 'scaffoldDeliveryForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      if (scaffoldProjectDirty) { toast('Tallenna luonnos uudeksi projektiorevisioksi ennen LMS-toimitusta.'); return; }
      const values = Object.fromEntries(new FormData(form).entries());
      if (!activeScaffoldProject) { toast('Tallenna projekti ennen LMS-toimitusta.'); return; }
      void (async () => {
        const project = activeScaffoldProject;
        const result = await scaffoldApi(`/api/scaffold/projects/${encodeURIComponent(project.id)}/deliveries`, { method: 'POST', body: JSON.stringify(values) });
        scaffoldDeliveriesLoaded = false;
        await loadScaffoldDeliveries();
        toast(result.duplicate ? `Tämän revision LMS-toimitus oli jo jonossa (${result.delivery.date} ${result.delivery.time}).` : `BOM rev ${result.delivery.projectRevision} lisättiin LMS-toimitusjonoon (${result.delivery.totalQuantity} kpl).`);
      })().catch((error) => toast(error.message || 'LMS-toimitusta ei voitu luoda.'));
      return;
    }
    if (event.target.id === 'logisticsDeliveryForm') {
      event.preventDefault();
      const form=event.target;
      if(!form.reportValidity())return;
      const values=Object.fromEntries(new FormData(form).entries());
      state.logisticsDeliveries.unshift({id:`delivery-${Date.now()}`,...values,status:'Suunniteltu'});
      state.logisticsFilter='Kaikki';
      persist();render();toast('Toimitus lisättiin paikalliseen jonoon.');
      return;
    }
    if (event.target.id === 'crmOpportunityForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      crmRequest('/api/crm/opportunities', { method: 'POST', body: JSON.stringify({ ...values, value: Number(values.value) || 0 }) })
        .then(async (result) => {
          if (result.possibleDuplicates?.length) crmNotice = `Mahdollinen samanniminen yritys löytyi: ${result.possibleDuplicates.map((item) => item.name).join(', ')}. Tarkista yrityksen yhdistäminen.`;
          else crmNotice = result.duplicate ? 'Sama lähde ja ilmoitustunnus löytyivät jo. Uutta mahdollisuutta ei luotu.' : '';
          form.reset();
          await refreshCrm();
          toast(result.duplicate ? 'Ilmoitus on jo myyntiputkessa.' : 'Myyntimahdollisuus tallennettiin SQLiteen.');
        }).catch((error) => toast(error.message));
      return;
    }
    if (event.target.id === 'crmCompanyCardForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      const { category, foundedYear, revenueEur, revenueYear, workforce, marketSharePct, futurePoints, profileSourceUrl, ...company } = values;
      const profile = { category, foundedYear: foundedYear || null, revenueEur: revenueEur || null, revenueYear: revenueYear || null, workforce: workforce || null, marketSharePct: marketSharePct || null, futurePoints: futurePoints || null, profileSourceUrl };
      crmRequest('/api/crm/companies', { method: 'POST', body: JSON.stringify({ ...company, profile }) })
        .then(async (result) => { await refreshCrm(); toast(result.duplicate ? 'Yritys oli jo osoitekirjassa.' : 'Yrityskortti tallennettiin palvelimelle.'); })
        .catch((error) => toast(error.message));
      return;
    }
    if (event.target.id === 'crmCompanyProfileForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      const { companyId, ...profile } = values;
      crmRequest(`/api/crm/companies/${encodeURIComponent(companyId)}`, { method: 'PATCH', body: JSON.stringify({ profile }) })
        .then(async () => { await refreshCrm(); toast('Yrityskortin tiedot päivitettiin.'); })
        .catch((error) => toast(error.message));
      return;
    }
    if (event.target.matches('.crm-company-contact-form, .crm-company-address-form')) {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      const isContact = form.matches('.crm-company-contact-form');
      const route = isContact ? 'contacts' : 'addresses';
      crmRequest(`/api/crm/companies/${encodeURIComponent(form.dataset.companyId)}/${route}`, { method: 'POST', body: JSON.stringify(values) })
        .then(async () => { await refreshCrm(); toast(isContact ? 'Yhteyshenkilö lisättiin yrityskorttiin.' : 'Osoite lisättiin yrityskorttiin.'); })
        .catch((error) => toast(error.message));
      return;
    }
    if (event.target.id === 'crmAddressSearchForm') {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.target).entries());
      void findCrmAddresses(values.query, { type: 'company', id: values.companyId });
      return;
    }
    if (event.target.id === 'crmBuildingForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      const selected = crmBuildingLocation;
      crmRequest('/api/crm/buildings', { method: 'POST', body: JSON.stringify({ ratu: values.ratu, name: values.name, address: selected?.label || values.address, x: selected?.x, y: selected?.y, source: selected?.source || 'Käsin annettu rakennuskohde' }) })
        .then(async () => { crmBuildingLocation = null; await refreshCrm(); toast('Rakennuskohde tallennettiin.'); })
        .catch((error) => toast(error.message));
      return;
    }
    if (event.target.id === 'crmDrawingForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      crmRequest(`/api/buildings/${encodeURIComponent(values.ratu)}/drawings`, { method: 'POST', body: JSON.stringify(values) })
        .then(async (drawing) => { await refreshCrm(); toast(drawing.review_required ? 'Piirustusviite tallennettiin RATU-tarkistusta varten.' : 'Piirustusviite tallennettiin.'); })
        .catch((error) => toast(error.message));
      return;
    }
    const activityForm = event.target.closest?.('[data-crm-activity-form]');
    if (activityForm) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(activityForm).entries());
      const id = activityForm.dataset.crmActivityForm;
      crmRequest(`/api/crm/opportunities/${encodeURIComponent(id)}/activities`, { method: 'POST', body: JSON.stringify({ summary: values.summary, kind: 'yhteydenotto' }) })
        .then(async () => { crmActivities[id] = await crmRequest(`/api/crm/opportunities/${encodeURIComponent(id)}/activities`); render(); toast('Aktiviteetti kirjattiin.'); })
        .catch((error) => toast(error.message));
      return;
    }
    if (['customerForm','employeeForm','questionForm'].includes(event.target.id)) {
      event.preventDefault();
      const form=event.target;
      if(!form.reportValidity())return;
      const values=Object.fromEntries(new FormData(form).entries());
      if(form.id==='customerForm'){
        state.customers.unshift({id:`customer-${Date.now()}`,company:String(values.company||'').trim(),contact:String(values.contact||'').trim(),email:String(values.email||'').trim(),stage:values.stage||'Yhteydenotto',value:Number(values.value)||0,nextStep:String(values.nextStep||'').trim()});
        toast('Asiakas lisättiin paikalliseen CRM-näkymään.');
      } else if(form.id==='employeeForm'){
        state.employees.unshift({id:`employee-${Date.now()}`,name:String(values.name||'').trim(),role:String(values.role||'').trim(),email:String(values.email||'').trim(),siteId:values.siteId||SITES[0].id,status:values.status||'Aktiivinen'});
        toast('Työntekijä lisättiin henkilöstönäkymään.');
      } else {
        state.questions.unshift({id:`question-${Date.now()}`,to:String(values.to||'').trim(),siteId:values.siteId||SITES[0].id,text:String(values.text||'').trim(),status:'Odottaa vastausta',createdAt:toIso(new Date())});
        toast('Kysymys tallennettiin tähän paikalliseen työtilaan.');
      }
      persist();render();return;
    }
    if (event.target.id === 'base44AdminImportForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const endpoint = String(new FormData(form).get('endpoint') || '').trim();
      const status = $('#base44AdminImportStatus');
      localStorage.setItem('telinehallinta-base44-admin-endpoint-v1', endpoint);
      status.textContent = 'Haetaan Base44-admin-tietoja…';
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      fetch('/api/scaffold/admin-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || `Tuonti epäonnistui (HTTP ${response.status}).`);
          return payload;
        })
        .then((payload) => {
          if (new Blob([JSON.stringify(payload)]).size > 3 * 1024 * 1024) {
            throw new Error('Tuonti ylittää 3 Mt paikallisen selainvedoksen rajan. Rajaa Base44-vientiä tai tuo tiedot pienemmissä erissä.');
          }
          state.scaffoldAdminImports = state.scaffoldAdminImports || [];
          state.scaffoldAdminImports.unshift(payload);
          persist();
          render();
          toast(`Base44-tuonti valmis: ${payload.analyses.length} analyysiä, ${payload.components.length} komponenttia.`);
        })
        .catch((error) => {
          status.textContent = error.message || 'Base44-tuonti epäonnistui.';
          toast(status.textContent);
        })
        .finally(() => { submit.disabled = false; });
      return;
    }
    if (event.target.id === 'scaffoldCalculationForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const stageIds = ['loads-transfer', 'foundations', 'standards-platforms', 'bracing-ties', 'global-stability'];
      const body = {
        project: { name: data.projectName, drawingRevision: data.drawingRevision, systemRevision: data.systemRevision, geometry: data.geometry, siteConditions: data.siteConditions, loadsBasis: data.loadsBasis },
        stages: Object.fromEntries(stageIds.map((id) => [id, { component: data[`${id}-component`], ed: data[`${id}-ed`], rd: data[`${id}-rd`], unit: data[`${id}-unit`], source: data[`${id}-source`], documentRevision: data[`${id}-revision`] }])),
      };
      const status = $('#scaffoldCalcStatus');
      status.textContent = 'Lasketaan ja tallennetaan vedosta…';
      fetch('/api/scaffold/calculations', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
        .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Laskelmaa ei voitu laskea.'); return payload; })
        .then((calc) => {
          for (const previous of state.scaffoldCalculations) {
            if (previous.inputSnapshot?.project?.name === body.project.name) previous.status = 'stale';
          }
          state.scaffoldCalculations.unshift(calc);
          persist(); render();
          toast(calc.missing.length ? 'Vedoksen puutteet tallennettiin; tarkastusta ei voi kirjata.' : 'Laskentavedos tallennettiin suunnittelijan tarkastusta varten.');
        })
        .catch((error) => { status.textContent = error.message || 'Laskentaa ei voitu tehdä.'; });
      return;
    }
    if (event.target.matches('[data-calc-review]')) {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const calc = state.scaffoldCalculations.find((item) => item.id === form.dataset.calcReview);
      if (!calc || calc.status === 'incomplete' || calc.status === 'stale') return;
      calc.status = 'reviewed';
      calc.review = { name: String(new FormData(form).get('reviewer')).trim(), date: new Date().toISOString().slice(0, 10), note: 'Käyttäjän paikallisesti kirjaama tarkastus' };
      persist(); render(); toast('Tarkastajan kirjaus tallennettiin tähän selaimeen.');
      return;
    }
    if (event.target.id === 'apiKeyForm') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      const submit = form.querySelector('[type="submit"]');
      const status = $('#apiKeyStatus');
      submit.disabled = true;
      submit.textContent = 'Tallennetaan…';
      status.textContent = '';
      fetch('/api/local/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: $('#apiKeyName').value, value: $('#apiKeyValue').value }),
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'API-avainta ei voitu tallentaa.');
        const secretInput = $('#apiKeyValue');
        if (secretInput) secretInput.value = '';
        if (status?.isConnected) status.textContent = `${payload.key.name}-avain tallennettiin salattuun paikalliseen holviin.`;
        toast('API-avain tallennettiin.');
        loadApiKeyList();
      }).catch((error) => {
        if (status?.isConnected) status.textContent = error.message || 'API-avainta ei voitu tallentaa.';
      }).finally(() => {
        if (submit.isConnected) {
          submit.disabled = false;
          submit.textContent = '🔑 Tallenna avain';
        }
      });
      return;
    }
    if (event.target.id !== 'dialogForm') return;
    event.preventDefault();
    const form = event.target;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    if (form.dataset.kind === 'task') {
      state.tasks.unshift({ id: `task-${Date.now()}`, ...values, estimate: Number(values.estimate || 0) });
      toast('Tehtävä lisättiin työtilaan.');
    } else if (form.dataset.kind === 'certificate') {
      state.certificates.unshift({ id: `cert-${Date.now()}`, ...values });
      toast('Sertifikaatti lisättiin työtilaan.');
    } else if (form.dataset.kind === 'design-resource') {
      const url = String(values.url || '').trim();
      if (url) {
        try {
          const parsed = new URL(url);
          if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        } catch {
          toast('Aineiston linkin pitää alkaa http:// tai https://.');
          return;
        }
      }
      state.designResources.unshift({ id: `design-${Date.now()}`, ...values, url, createdAt: new Date().toISOString() });
      toast('Projektiaineisto tallennettiin tähän selaimeen.');
    } else if (form.dataset.kind === 'alert') {
      state.alerts.unshift({ id: `alert-${Date.now()}`, ...values });
      toast('Varoitus lisättiin työtilaan.');
    } else if (form.dataset.kind === 'profile') {
      state.profile = { ...state.profile, ...values };
      toast('Profiili tallennettiin tähän selaimeen.');
    }
    persist();
    $('#modal').close();
    render();
  }

  function savePreferences() {
    state.preferences = {
      ...state.preferences,
      language: $('#prefLanguage')?.value || state.preferences.language,
      theme: $('#prefTheme')?.value || state.preferences.theme,
      palette: $('#prefPalette')?.value || state.preferences.palette || 'christiania',
      units: $('#prefUnits')?.value || state.preferences.units,
      floorHeight: Number($('#floorHeight')?.value || state.preferences.floorHeight),
      autosave: $('#prefAutosave')?.checked ?? state.preferences.autosave,
      cursorStyle: $('#prefCursorStyle')?.value || state.preferences.cursorStyle || 'ratchet',
      cursorSize: Number($('#prefCursorSize')?.value || state.preferences.cursorSize || 56),
    };
    persist();
    render();
    toast('Asetukset tallennettiin.');
  }

  function doAction(action, element) {
    if (action === 'refresh-weather') { liveWeather.error = ''; void fetchLiveWeather(); toast('Helsingin säätiedot päivitetään.'); }
    else if (action === 'crm-retry-load') { crmLoadError = ''; void loadCrm(); }
    else if (action === 'crm-reload') void refreshCrm();
    else if (action === 'crm-activities') void showCrmActivities(element.dataset.id);
    else if (action === 'crm-open-opportunity') { if (element.dataset.id) void showCrmActivities(element.dataset.id); }
    else if (action === 'crm-complete-action') {
      const note = element.closest('.crm-followup-row')?.querySelector('[data-crm-completion-note]')?.value.trim() || '';
      void completeCrmFollowUp(element.dataset.id, note, element.closest('.crm-followup-row'));
    }
    else if (action === 'crm-reschedule-action') {
      const dueDate = element.closest('.crm-followup-row')?.querySelector('[data-crm-reschedule-date]')?.value || '';
      void rescheduleCrmFollowUp(element.dataset.id, dueDate);
    }
    else if (action === 'crm-select-address') void chooseCrmAddress(Number(element.dataset.index));
    else if (action === 'crm-search-building-address') void findCrmAddresses($('#crmBuildingForm [name="buildingQuery"]')?.value, { type: 'building' });
    else if (action === 'crm-use-ratu') { const input = $('#crmDrawingForm [name="ratu"]'); if (input) { input.value = element.dataset.ratu || ''; input.focus(); } }
    else if (action === 'crm-delete-opportunity') {
      if (window.confirm('Poistetaanko tämä myyntimahdollisuus ja sen aktiviteetit CRM:stä?')) crmRequest(`/api/crm/opportunities/${encodeURIComponent(element.dataset.id)}`, { method: 'DELETE' }).then(() => refreshCrm()).catch((error) => toast(error.message));
    }
    else if (action === 'crm-delete-drawing') {
      if (window.confirm('Poistetaanko piirustusviite? Alkuperäistä tiedostoa ei poisteta.')) crmRequest(`/api/crm/drawings/${encodeURIComponent(element.dataset.id)}`, { method: 'DELETE' }).then(() => refreshCrm()).catch((error) => toast(error.message));
    }
    else if (action === 'new-task') openTaskDialog();
    else if (action === 'toggle-theme') { state.preferences.theme=state.preferences.theme==='dark'?'light':'dark';persist();render(); }
    else if (action === 'dashboard-tab') { state.dashboardTab=element.dataset.tab; persist(); render(); }
    else if (action === 'download-dashboard-report') {
      const siteFilter=state.dashboardAnalyticsSite||'';
      const tasks=state.tasks.filter((task)=>!siteFilter||task.siteId===siteFilter);
      const rows=[['Tyyppi','Nimi / päivä','Työmaa','Tila','Määrä / tunnit'],...tasks.map((task)=>['Tehtävä',task.title,siteName(task.siteId),task.status,task.estimate||'']),...state.logs.filter((log)=>!siteFilter||log.siteId===siteFilter).map((log)=>['Työaika',log.date,siteName(log.siteId),log.status||'Tallennettu',log.total||formatHours(log.durationMs||0)])];
      const csv='\ufeff'+rows.map((row)=>row.map((cell)=>`"${String(cell??'').replaceAll('"','""')}"`).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='telinehallinta-dashboard.csv';link.click();URL.revokeObjectURL(url);
    }
    else if (action === 'clear-scaffold-maker') { $('#scaffoldCatalogMaker').value=''; syncScaffoldManufacturerSelection(); renderScaffoldCatalog(); }
    else if (action === 'new-scaffold-project') {
      activeScaffoldProject = null;
      selectedScaffoldBuilding = null;
      selectedScaffoldFacade = null;
      selectedScaffoldFacadeSource = '';
      selectedScaffoldRoofFacades = [];
      facadeScaffoldPlans = [];
      scaffoldCornerReviews = [];
      scaffoldDrawingReviews = [];
      selectedScaffoldCornerKey = '';
      scaffoldStairTowers = [];
      stairTowerPlacementMode = false;
      stairTowerPlacementRemaining = 0;
      scaffoldBuildingGeometryApplied = false;
      scaffoldPricingDraft = { components: {}, labor: [], transport: [], otherCosts: 0, otherCostsSource: '' };
      scaffoldLaborSources = { Asennus: 'Käyttäjän syöttämä työarvio', Purku: 'Käyttäjän syöttämä työarvio', Tarkastus: 'Käyttäjän syöttämä työarvio' };
      render();
      toast('Uusi tallentamaton telineprojekti avattiin.');
    }
    else if (action === 'save-scaffold-project') void saveScaffoldProject();
    else if (action === 'export-scaffold-fcmacro') void exportScaffoldFreeCadMacro().catch((error)=>toast(error.message||'FreeCAD-makron luonti epäonnistui.'));
    else if (action === 'export-scaffold-dxf') void exportScaffoldCad('dxf').catch((error)=>toast(error.message||'DXF-vienti epäonnistui.'));
    else if (action === 'export-scaffold-obj') void exportScaffoldCad('obj').catch((error)=>toast(error.message||'OBJ-vienti epäonnistui.'));
    else if (action === 'export-scaffold-svg') void exportScaffoldSvg().catch((error)=>toast(error.message||'SVG-vienti epäonnistui.'));
    else if (action === 'export-scaffold-pdf') void exportScaffoldPdf();
    else if (action === 'download-scaffold-bom') void exportScaffoldBom();
    else if (action === 'export-scaffold-quote') void exportScaffoldQuote().catch((error)=>toast(error.message||'Tarjousluonnosta ei voitu viedä.'));
    else if (action === 'export-scaffold-quote-pdf') void exportScaffoldQuotePdf().catch((error)=>toast(error.message||'Tarjousluonnoksen PDF-näkymää ei voitu avata.'));
    else if (action === 'push-scaffold-quote') void pushScaffoldQuoteToPipeline().catch((error)=>toast(error.message||'Tarjousta ei voitu liittää CRM-putkeen.'));
    else if (action === 'geo-mode') setGeoMapMode(element.dataset.mode);
    else if (action === 'geo-fit-finland') { setGeoMapMode('map'); geoWorkspaceMap?.fitBounds([[59.4,19],[70.2,31.7]]); }
    else if (action === 'geo-fit-helsinki') { setGeoMapMode('map'); geoWorkspaceMap?.setView([60.1699,24.9384],15); }
    else if (action === 'geo-place-toggle') {
      if (state.geoMapView !== 'map') {
        setGeoMapMode('map');
        toast('Kuvake sijoitetaan todelliseen 2D-karttaan. CodeRain- ja 3D-näkymässä näytetään sama tallennettu sijainti karttamerkkiluettelossa.');
      }
      geoPlaceMarkerMode = !geoPlaceMarkerMode;
      const button = $('[data-action="geo-place-toggle"]');
      if (button) button.textContent = geoPlaceMarkerMode ? '× Peruuta sijoitus' : '＋ Sijoita kuvake kartalle';
      const status = $('#geoWorkspaceStatus');
      if (status) status.textContent = geoPlaceMarkerMode ? 'Klikkaa todellista karttasijaintia. Merkki tallennetaan EPSG:3879-koordinaatteina.' : 'Sijoitus peruttiin.';
      geoWorkspaceMap?.getContainer().classList.toggle('geo-place-active', geoPlaceMarkerMode);
    }
    else if (action === 'geo-focus-marker') {
      const row = geoMarkerObjects.get(element.dataset.id);
      if (row && geoWorkspaceMap) {
        setGeoMapMode('map');
        geoWorkspaceMap.setView(row.layer.getLatLng(), 18);
        row.layer.openPopup();
      } else if (row) toast('Avaa 2D-kartta nähdäksesi karttamerkin sijainnin.');
    }
    else if (action === 'geo-delete-marker') {
      const id = element.dataset.id;
      scaffoldApi('/api/geo/management-markers/' + encodeURIComponent(id), { method: 'DELETE' })
        .then(() => { geoMarkerObjects.get(id)?.layer.remove(); geoMarkerObjects.delete(id); renderGeoMarkerList(); toast('Karttamerkki poistettiin.'); })
        .catch((error) => toast(error.message));
    }
    else if (action === 'logistics-filter') { state.logisticsFilter=element.dataset.status||'Kaikki';persist();render(); }
    else if (action === 'logistics-advance') {
      const item=(state.logisticsDeliveries||[]).find((delivery)=>delivery.id===element.dataset.id);
      const savedItem=scaffoldDeliveries.find((delivery)=>delivery.id===element.dataset.id);
      const flow=['Suunniteltu','Lastaus','Matkalla','Perillä','Palautettu','Valmis'];
      if(savedItem&&savedItem.status!=='Valmis'){
        const status=flow[(flow.indexOf(savedItem.status)+1)%flow.length];
        void scaffoldApi(`/api/scaffold/deliveries/${encodeURIComponent(savedItem.id)}`,{method:'PATCH',body:JSON.stringify({status})}).then((result)=>{Object.assign(savedItem,result.delivery);render();toast(`LMS-toimituksen tila tallennettiin: ${status}.`);}).catch((error)=>toast(error.message));
      } else if(item&&item.status!=='Valmis'){item.status=flow[(flow.indexOf(item.status)+1)%flow.length];persist();render();toast(`Toimituksen tila: ${item.status}.`);}
    }
    else if (action === 'select-bom-manufacturer') { const maker=element.dataset.manufacturer||'Layher';const systems=[...new Set(scaffoldCatalog.filter((item)=>item['Valmistaja']===maker).map((item)=>String(item['Järjestelmä / katalogi']||'').trim()).filter(Boolean))];state.bomManufacturer=maker;state.bomSystem=maker==='Layher'&&systems.includes('Allround Scaffolding')?'Allround Scaffolding':systems.length===1?systems[0]:'';state.bomQuery='';persist();render(); }
    else if (action === 'clear-bom-maker') { state.bomManufacturer='Layher';state.bomSystem='Allround Scaffolding';state.bomQuery='';persist();render(); }
    else if (action === 'add-bom-component') {
      const item=scaffoldCatalog[Number(element.dataset.index)];
      if(item){
        const key=item['Valintatunniste (tuotekortti)']||`${item['Valmistaja']}|${item['Järjestelmä / katalogi']}|${item['Tuotenumero / viite']}`;
        const existing=state.bomItems.find((row)=>row.selectionKey===key);
        if(existing)existing.quantity=(Number(existing.quantity)||1)+1;
        else state.bomItems.unshift({id:`bom-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,selectionKey:key,manufacturer:item['Valmistaja']||'',system:item['Järjestelmä / katalogi']||'',reference:item['Tuotenumero / viite']||'',name:item['Nimike / variantti']||'Komponentti',quantity:1,unit:'kpl',source:item['Lähdeasiakirja / URL']||'',revision:item['Katalogiversio']||item['Tietojen tila']||'Tarkistettava'});
        persist();render();toast('Komponentti lisättiin BOMiin.');
      }
    }
    else if (action === 'remove-bom-item') { state.bomItems=state.bomItems.filter((item)=>item.id!==element.dataset.id);persist();render();toast('BOM-rivi poistettiin.'); }
    else if (action === 'export-bom') {
      const rows=[['Valmistaja','Järjestelmä / katalogi','Tuotenumero / viite','Nimike','Määrä','Yksikkö','Katalogiversio','Lähde'],...(state.bomItems||[]).map((item)=>[item.manufacturer,item.system,item.reference,item.name,item.quantity,item.unit,item.revision,item.source])];
      const csv='\ufeff'+rows.map((row)=>row.map((cell)=>`"${String(cell??'').replaceAll('"','""')}"`).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='telinehallinta-bom.csv';link.click();URL.revokeObjectURL(url);
    }
    else if(action==='download-linked-project-bom'){
      if(!bomLinkedProject){toast('Valitse ensin tallennettu telineprojekti.');return;}
      const csv=TelineExports.buildScaffoldBomCsv(bomLinkedProject),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=scaffoldExportName(bomLinkedProject,'csv');link.click();URL.revokeObjectURL(url);toast(`Parametrinen BOM ladattiin projektin rev ${bomLinkedProject.revision} mukaan.`);
    }
    else if(action==='reload-linked-project-bom')void loadBomLinkedProject(state.bomProjectId);
    else if(action==='link-catalog-to-project-bom')void saveBomCatalogLink(bomLinkTargetId,element.dataset.index,false);
    else if(action==='unlink-catalog-from-project-bom')void saveBomCatalogLink(element.dataset.lineId,null,true);
    else if (action === 'remove-customer') { state.customers=state.customers.filter((item)=>item.id!==element.dataset.id);persist();render();toast('Asiakkuus poistettiin.'); }
    else if (action === 'remove-employee') { state.employees=state.employees.filter((item)=>item.id!==element.dataset.id);persist();render();toast('Henkilöstörivi poistettiin.'); }
    else if (action === 'advance-course') { const course=state.courses.find((item)=>item.id===element.dataset.id);if(course)course.progress=course.progress>=100?0:100;persist();render(); }
    else if (action === 'knowledge-filter') { state.knowledgeCategory=element.dataset.category||'Kaikki';persist();render(); }
    else if (action === 'course-filter') { state.lmsCategory=element.dataset.category||'Kaikki';persist();render(); }
    else if (action === 'answer-question') { const question=state.questions.find((item)=>item.id===element.dataset.id);if(question)question.status='Vastattu';persist();render(); }
    else if (action === 'remove-question') { state.questions=state.questions.filter((item)=>item.id!==element.dataset.id);persist();render(); }
    else if (action === 'remove-legal-record') { state.legalRecords=(state.legalRecords||[]).filter((item)=>item.id!==element.dataset.id);persist();render();toast('Asiakirjaviite poistettiin.'); }
    else if (action === 'add-layout-view') { state.devLayout.push({id:`layout-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,view:element.dataset.view,span:4});persist();render(); }
    else if (action === 'resize-layout') { const tile=state.devLayout.find((item)=>item.id===element.dataset.id);if(tile)tile.span=Math.min(12,Math.max(2,(Number(tile.span)||4)+Number(element.dataset.delta||0)));persist();render(); }
    else if (action === 'move-layout') { const index=state.devLayout.findIndex((item)=>item.id===element.dataset.id);const next=index+Number(element.dataset.delta||0);if(index>=0&&next>=0&&next<state.devLayout.length){const [tile]=state.devLayout.splice(index,1);state.devLayout.splice(next,0,tile);}persist();render(); }
    else if (action === 'remove-layout') { state.devLayout=state.devLayout.filter((item)=>item.id!==element.dataset.id);persist();render(); }
    else if (action === 'save-layout') { persist();toast('Näkymien hahmotelma tallennettiin tähän selaimeen.'); }
    else if (action === 'new-design-resource') openDesignResourceDialog(element.dataset.type);
    else if (action === 'delete-design-resource') {
      const resource = (state.designResources || []).find((item) => item.id === element.dataset.id);
      if (resource && window.confirm(`Poistetaanko aineistoviite ”${resource.title}”?`)) {
        state.designResources = state.designResources.filter((item) => item.id !== resource.id);
        persist(); render(); toast('Aineistoviite poistettiin.');
      }
    }
    else if (action === 'refresh-osint') {
      const frame = $('#osintModuleFrame');
      if (frame) {
        frame.parentElement?.classList.remove('is-loaded');
        frame.addEventListener('load',()=>frame.parentElement?.classList.add('is-loaded'),{once:true});
        window.setTimeout(()=>frame.parentElement?.classList.add('is-loaded'),15000);
        const url = new URL(frame.src);
        url.searchParams.set('refresh', String(Date.now()));
        frame.src = url.toString();
        toast('Markkina- ja hankintavahti päivitetään.');
      }
    }
    else if (action === 'new-certificate') openCertificateDialog();
    else if (action === 'new-alert') openAlertDialog();
    else if (action === 'edit-profile') openProfileDialog();
    else if (action === 'close-dialog') $('#modal').close();
    else if (action === 'clock-in') startShift();
    else if (action === 'clock-out') endShift();
    else if (action === 'remove-alert') {
      state.alerts = state.alerts.filter((alert) => alert.id !== element.dataset.id);
      persist(); render(); toast('Varoitus poistettiin työtilasta.');
    }
    else if (action === 'toggle-task') {
      const task = state.tasks.find((item) => item.id === element.dataset.id);
      if (task) task.status = task.status === 'Valmis' ? 'Tekemättä' : 'Valmis';
      persist(); render();
      toast(task?.status === 'Valmis' ? 'Tehtävä merkitty valmiiksi.' : 'Tehtävä avattiin uudelleen.');
    } else if (action === 'prev-month' || action === 'next-month' || action === 'today-month') {
      let date = new Date(`${state.calendarDate || TODAY_ISO}T12:00:00`);
      if (action === 'today-month') date = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
      if (action === 'prev-month') date = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      if (action === 'next-month') date = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      state.calendarDate = toIso(date); persist(); render();
    } else if (action === 'mobile-tab') { state.mobileTab = element.dataset.tab; render(); }
    else if (action === 'settings-tab') { state.settingsTab = element.dataset.tab; render(); }
    else if (action === 'reveal-api-key') revealApiKey(element);
    else if (action === 'delete-api-key') deleteApiKey(element);
    else if (action === 'save-settings') savePreferences();
    else if (action === 'save-profile-settings') {
      state.profile.name = $('#settingsName')?.value || 'Demo-käyttäjä';
      state.profile.role = $('#settingsRole')?.value || 'Työmaan työntekijä';
      persist(); render(); toast('Profiilin oletukset tallennettiin.');
    } else if (action === 'reset-demo') {
      state = seedState(); persist(); navigate('settings'); toast('Esimerkkitila palautettiin.');
    }
  }

  function handleInput(event) {
    if (event.target.id === 'crmCompanySearch') {
      applyCrmCompanyCardFilters();
    } else if (event.target.id === 'crmFollowUpSearch') {
      applyCrmFollowUpFilters();
    } else if (event.target.id === 'crmOpportunitySearch') {
      applyCrmOpportunityFilters();
    } else if (event.target.id === 'siteSearch') {
      state.filters.siteSearch = event.target.value;
      const cursor = event.target.selectionStart;
      render();
      const next = $('#siteSearch'); next?.focus(); next?.setSelectionRange(cursor, cursor);
      persist();
    } else if (event.target.id === 'taskSearch') {
      state.filters.taskSearch = event.target.value;
      const cursor = event.target.selectionStart;
      render();
      const next = $('#taskSearch'); next?.focus(); next?.setSelectionRange(cursor, cursor);
      persist();
    } else if (event.target.id === 'taskStatusFilter') {
      state.filters.taskStatus = event.target.value; persist(); render();
    } else if (event.target.id === 'taskPriorityFilter') {
      state.filters.taskPriority = event.target.value; persist(); render();
    } else if (event.target.id === 'certificateSearch') {
      state.filters.certificateSearch = event.target.value;
      const cursor = event.target.selectionStart;
      render();
      const next = $('#certificateSearch'); next?.focus(); next?.setSelectionRange(cursor, cursor);
      persist();
    } else if (event.target.id === 'settingsSearch') {
      settingsSearchText = event.target.value;
      const query = settingsSearchText.toLocaleLowerCase('fi');
      const tab = query.includes('hiir') || query.includes('osoitin') || query.includes('räikk') ? 'cursor' : query.includes('ilmoit') ? 'notifications' : query.includes('profiil') ? 'profile' : query.includes('api') || query.includes('avain') ? 'apiKeys' : query.includes('tietosuoja') || query.includes('tallenn') ? 'privacy' : query.includes('tuki') ? 'support' : 'general';
      if (query) {
        state.settingsTab = tab;
        const cursor = event.target.selectionStart;
        render();
        const next = $('#settingsSearch'); next?.focus(); next?.setSelectionRange(cursor, cursor);
      }
    } else if (event.target.id === 'knowledgeSearch') {
      knowledgeSearchText=event.target.value;
      const cursor=event.target.selectionStart;
      render();
      const next=$('#knowledgeSearch');next?.focus();next?.setSelectionRange(cursor,cursor);
    } else if (event.target.id === 'bomSearch') {
      state.bomQuery=event.target.value;
      const cursor=event.target.selectionStart;
      render();
      const next=$('#bomSearch');next?.focus();next?.setSelectionRange(cursor,cursor);
      persist();
    }
  }

  function applyCrmOpportunityFilters() {
    const table = $('.crm-table-panel .crm-table tbody');
    if (!table) return;
    const query = ($('#crmOpportunitySearch')?.value || '').trim().toLocaleLowerCase('fi');
    const stage = $('#crmOpportunityStageFilter')?.value || '';
    const rows = [...table.querySelectorAll('.crm-opportunity-row')];
    let visible = 0;
    for (const row of rows) {
      const inputValues = [...row.querySelectorAll('input')].map((input) => input.value).join(' ');
      const searchable = `${row.textContent || ''} ${inputValues}`.toLocaleLowerCase('fi');
      const matches = (!query || searchable.includes(query)) && (!stage || row.dataset.crmStageValue === stage);
      row.hidden = !matches;
      const details = row.nextElementSibling?.classList.contains('crm-detail-row') ? row.nextElementSibling : null;
      if (details) details.hidden = !matches;
      if (matches) visible += 1;
    }
    const count = $('#crmOpportunityFilterCount');
    if (count) count.textContent = `Näytetään ${visible} / ${rows.length}`;
    const empty = $('.crm-filter-empty');
    if (empty) empty.hidden = visible > 0 || rows.length === 0;
  }

  function applyCrmFollowUpFilters() {
    const panel = $('.crm-followup-panel');
    if (!panel) return;
    const query = ($('#crmFollowUpSearch')?.value || '').trim().toLocaleLowerCase('fi');
    const period = $('#crmFollowUpPeriodFilter')?.value || '';
    const rows = [...panel.querySelectorAll('.crm-followup-row')];
    let visible = 0;
    for (const row of rows) {
      const matches = (!query || (row.textContent || '').toLocaleLowerCase('fi').includes(query)) && (!period || row.dataset.followUpPeriod === period);
      row.hidden = !matches;
      if (matches) visible += 1;
    }
    for (const group of panel.querySelectorAll('.crm-followup-group')) group.hidden = !group.querySelector('.crm-followup-row:not([hidden])');
    const count = $('#crmFollowUpFilterCount');
    if (count) count.textContent = `Näytetään ${visible} / ${rows.length}`;
    const empty = $('.crm-followup-filter-empty');
    if (empty) empty.hidden = visible > 0 || rows.length === 0;
  }

  function handleChange(event) {
    if (event.target.id === 'crmCompanyCategory') { applyCrmCompanyCardFilters(); return; }
    if (event.target.id === 'crmFollowUpPeriodFilter') { applyCrmFollowUpFilters(); return; }
    if(event.target.id==='bomSystemFilter'){state.bomSystem=event.target.value;persist();render();return;}
    if(event.target.id==='bomProjectSelect'){
      state.bomProjectId=event.target.value;persist();bomLinkedProject=null;bomLinkedProjectError='';
      if(state.bomProjectId)void loadBomLinkedProject(state.bomProjectId);else render();
      return;
    }
    if(event.target.id==='bomLinkTargetSelect'){bomLinkTargetId=event.target.value;render();return;}
    if (event.target.id === 'crmOpportunityStageFilter') { applyCrmOpportunityFilters(); return; }
    if (event.target.matches('[data-crm-stage]')) { void patchCrmOpportunity(event.target.dataset.crmStage, { stage: event.target.value }); return; }
    if (event.target.matches('[data-crm-patch]')) {
      const key = event.target.dataset.crmPatch;
      const value = key === 'value' ? Number(event.target.value) || 0 : event.target.value;
      void patchCrmOpportunity(event.target.dataset.id, { [key]: value });
      return;
    }
    if (event.target.matches('[data-crm-company-field]')) { void saveCrmCompanyField(event.target); return; }
    if (event.target.id === 'dashboardAnalyticsSite') { state.dashboardAnalyticsSite=event.target.value; persist(); render(); }
    if (event.target.id === 'siteStatusFilter') { state.filters.siteStatus = event.target.value; persist(); render(); }
    if (event.target.id === 'taskStatusFilter') { state.filters.taskStatus = event.target.value; persist(); render(); }
    if (event.target.id === 'taskPriorityFilter') { state.filters.taskPriority = event.target.value; persist(); render(); }
    if (event.target.id === 'certificateTypeFilter') { state.filters.certificateType = event.target.value; persist(); render(); }
    if (event.target.id === 'prefTheme') { state.preferences.theme = event.target.value; document.body.classList.toggle('theme-dark', event.target.value === 'dark'); syncWorkspaceRatchetCursor(); }
    if (event.target.id === 'prefPalette') { state.preferences.palette = event.target.value; document.documentElement.dataset.palette = event.target.value; }
    if (event.target.id === 'prefCursorStyle') { state.preferences.cursorStyle = event.target.value; syncWorkspaceRatchetCursor(); }
    if (event.target.id === 'prefCursorSize') { state.preferences.cursorSize = Number(event.target.value) || 56; syncWorkspaceRatchetCursor(); }
    if (event.target.id === 'prefLanguage') state.preferences.language = event.target.value;
    if (event.target.id === 'prefUnits') state.preferences.units = event.target.value;
    if (event.target.id === 'prefAutosave') state.preferences.autosave = event.target.checked;
    if (event.target.matches('[data-bom-quantity]')) {
      const item=state.bomItems.find((row)=>row.id===event.target.dataset.bomQuantity);
      if(item){item.quantity=Math.max(1,Math.floor(Number(event.target.value)||1));persist();event.target.value=item.quantity;}
    }
  }

  function applyCrmCompanyCardFilters() {
    const query = ($('#crmCompanySearch')?.value || '').trim().toLocaleLowerCase('fi');
    const category = $('#crmCompanyCategory')?.value || '';
    for (const card of document.querySelectorAll('[data-crm-company-card]')) {
      card.hidden = Boolean((query && !card.dataset.search.includes(query)) || (category && card.dataset.category !== category));
    }
  }

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-page]');
    if (nav) {
      event.preventDefault();
      navigate(nav.dataset.page);
      return;
    }
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) doAction(actionButton.dataset.action, actionButton);
  });
  window.addEventListener('message', (event) => {
    if(event.origin===window.location.origin&&event.data?.type==='telinehallinta.building.pick.v1'){
      const picked=event.data.payload||{};
      selectedScaffoldBuilding={id:picked.id,object:picked.object||{},payload:{source:'Helsingin 3D-kaupunkimalli · CityJSON',format:'CityJSON',crs:picked.crs||'EPSG:3879',sourceCrs:picked.crs||'EPSG:3879',retrievedAt:new Date().toISOString(),data:picked.data||{}}};
      const attrs=picked.object?.attributes||picked.object?.properties||{};
      const name=attrs.name||attrs.nimi||attrs.gmlid||attrs.gml_id||picked.id||'Valittu 3D-rakennus';
      const ring=selectedBuildingFootprint();
      const metrics=ring?.length?TelineDomain.polygonMetrics(ring):null;
      scaffoldBuildingGeometryApplied=Boolean(metrics?.longestSide);selectedScaffoldFacade=null;selectedScaffoldFacadeSource='';selectedScaffoldRoofFacades=[];facadeScaffoldPlans=[];scaffoldCornerReviews=[];scaffoldDrawingReviews=[];selectedScaffoldCornerKey='';scaffoldStairTowers=[];stairTowerPlacementMode=false;stairTowerPlacementRemaining=0;
      if(metrics?.longestSide){
        selectedScaffoldFacade={label:'Julkisivu '+(metrics.longestSide.index+1),length:metrics.longestSide.lengthM,index:metrics.longestSide.index};
        selectedScaffoldFacadeSource='building-footprint';
        const form=$('#scaffoldLayoutForm');
        form.elements.namedItem('length').value=metrics.longestSide.lengthM.toFixed(2);
        const sides=metrics.sides.map(side=>side.lengthM).sort((a,b)=>b-a);
        form.elements.namedItem('buildingDepth').value=(sides[1]||sides[0]||0).toFixed(2);
        form.elements.namedItem('name').value=name+' · teline';
        const attributeHeight=Number(attrs.measuredHeight||attrs.measured_height||attrs.height||0),verticalExtent=TelineDomain.cityJsonVerticalExtent(selectedScaffoldBuilding.object,selectedScaffoldBuilding.payload?.data),geometryHeight=Number(verticalExtent?.heightM)||0,height=attributeHeight||geometryHeight;
        if(height>0){form.elements.namedItem('buildingHeight').value=height.toFixed(2);form.elements.namedItem('buildingHeightStatus').value='source';form.elements.namedItem('buildingHeightSource').value=attributeHeight?'Helsingin 3D-kaupunkimallin CityJSON-korkeusominaisuus; määritelmä tarkistettava':`CityJSON-geometrian Z-laajuus ${verticalExtent.minZ.toFixed(2)}–${verticalExtent.maxZ.toFixed(2)} m · ${height.toFixed(2)} m; korkeusjärjestelmä tarkistettava`;}
      }
      window._telinehallintaBuildingCard={address:name,parcel:attrs.kiinteistotunnus||'',properties:attrs,source:'Helsingin 3D-kaupunkimalli'};
      const card=$('#scaffoldInfoBuildingCard');
      if(card)renderScaffoldBuildingCard(card,{title:name,properties:attrs,facts:Object.entries(attrs).slice(0,8),source:'Helsingin 3D-kaupunkimalli · CityJSON',crs:picked.crs||'EPSG:3879',retrievedAt:selectedScaffoldBuilding.payload.retrievedAt});
      const status=$('#scaffoldSelectedBuilding');
      if(status)status.textContent=`${name} · valittu Helsingin 3D-kaupunkimallista · ${picked.crs||'EPSG:3879'} · ${metrics?.longestSide?`pisin julkisivu ${metrics.longestSide.lengthM.toFixed(2)} m`:'geometriasta ei saatu mitattavaa julkisivua'} · tarkista korkeus ja piirustukset.`;
      $('#scaffoldModelStatus')?.replaceChildren(document.createTextNode('3D-kaupunkimallin rakennusvalinta vastaanotettu. Lähdegeometria korvaa massamallin, julkisivun mitat johdetaan valitun CityJSON-geometrian sivuista.'));
      syncScaffoldTerrainAnalysis();if(metrics?.longestSide)$('#scaffoldLayoutForm')?.dispatchEvent(new Event('input',{bubbles:true}));
      toast('3D-kaupunkimallin rakennus liitetty telinepiirustukseen.');
      return;
    }
    const frame = $('#osintModuleFrame');
    if (!frame || event.source !== frame.contentWindow) return;
    let expectedOrigin;
    try { expectedOrigin = new URL(frame.src, window.location.href).origin; } catch { return; }
    if (event.origin !== expectedOrigin) return;
    const message = event.data;
    if (!message || message.type !== 'telinehallinta.osint.addLead.v1' || !message.payload || typeof message.payload !== 'object') return;
    const payload = message.payload;
    const source = String(payload.source || 'osint').toLowerCase().slice(0,80);
    const isTender = ['hilma','ted','vayla'].includes(source);
    let buyerName = String(payload.buyerName || '').trim().slice(0,200);
    if (isTender && !buyerName) buyerName = String(window.prompt('Hankinnan ostaja (ei toimittaja). Jos ostaja ei ole tiedossa, jätä tyhjäksi tarkistusta varten.') || '').trim().slice(0,200);
    let companyName = String(payload.companyName || '').trim().slice(0,200);
    if (!isTender && !companyName && !['ryhti_building','ryhti_permit','ryhti_plan','museo'].includes(source)) companyName = String(window.prompt('Minkä yrityksen alle tämä Julkisen lähteen tulos liitetään? Jätä tyhjäksi, jos yritys ei ole tiedossa.') || '').trim().slice(0,200);
    const safePayload = {
      source,
      sourceId: String(payload.sourceId || payload.id || '').trim().slice(0,180),
      title: String(payload.title || '').trim().slice(0,300),
      companyName,
      buyerName,
      businessId: String(payload.businessId || '').trim().slice(0,30),
      sourceUrl: String(payload.sourceUrl || payload.url || '').trim().slice(0,2000),
      procurementType: String(payload.procurementType || '').trim().slice(0,120),
      procurementDeadline: String(payload.procurementDeadline || '').trim().slice(0,40),
      procurementPublishedAt: String(payload.procurementPublishedAt || '').trim().slice(0,40),
      cpvCodes: String(payload.cpvCodes || '').trim().slice(0,240),
      procurementEstimatedValue: payload.procurementEstimatedValue,
      procurementCurrency: String(payload.procurementCurrency || '').trim().slice(0,8),
    };
    const estimate = String(payload.procurementValue || '').match(/([\d\s.,]+)\s*([A-Z]{3})?/);
    if (isTender) {
      safePayload.procurementType = String(payload.procurementType || '').trim().slice(0,120);
      safePayload.procurementDeadline = String(payload.procurementDeadline || '').trim().slice(0,40);
      safePayload.procurementPublishedAt = String(payload.procurementPublishedAt || '').trim().slice(0,40);
      safePayload.cpvCodes = String(payload.cpvCodes || payload.cpv || '').replace(/[^\d, ]/g,'').trim().slice(0,240);
      safePayload.procurementCurrency = estimate?.[2] || '';
      safePayload.procurementEstimatedValue = estimate ? Number(estimate[1].replace(/\s/g,'').replace(/\.(?=.*\.)/g,'').replace(',','.')) : null;
    }
    if (!safePayload.title) { toast('OSINT-tuloksesta puuttuu otsikko.'); return; }
    crmRequest('/api/crm/import/osint', { method: 'POST', body: JSON.stringify(safePayload) })
      .then(async (result) => {
        toast(result.duplicate ? 'Sama lähdeilmoitus löytyi jo myyntiputkesta.' : result.possibleDuplicates?.length ? 'Mahdollinen yritysduplikaatti lisättiin tarkistettavaksi.' : 'Julkisen lähteen tulos lisättiin TelineHallinnan myyntiputkeen.');
        if (crmLoaded) await refreshCrm();
      })
      .catch((error) => toast(error.message || 'Julkisen lähteen tulosta ei voitu lisätä myyntiputkeen.'));
  });
  document.addEventListener('keydown',(event)=>{
    const tab=event.target.closest?.('[data-action="dashboard-tab"]');
    if(tab&&['Enter',' '].includes(event.key)){event.preventDefault();doAction('dashboard-tab',tab);}
  });
  document.addEventListener('submit', handleFormSubmit);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  document.addEventListener('dragstart',(event)=>{
    const tile=event.target.closest?.('.dev-layout-tile');
    if(tile&&event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',tile.dataset.layoutId);tile.classList.add('dragging');}
  });
  document.addEventListener('dragend',(event)=>event.target.closest?.('.dev-layout-tile')?.classList.remove('dragging'));
  document.addEventListener('dragover',(event)=>{if(event.target.closest?.('#devLayoutGrid'))event.preventDefault();});
  document.addEventListener('drop',(event)=>{
    const grid=event.target.closest?.('#devLayoutGrid');if(!grid)return;
    event.preventDefault();
    const fromId=event.dataTransfer?.getData('text/plain');const toId=event.target.closest('.dev-layout-tile')?.dataset.layoutId;
    const from=state.devLayout.findIndex((tile)=>tile.id===fromId);const to=state.devLayout.findIndex((tile)=>tile.id===toId);
    if(from<0||to<0||from===to)return;
    const [tile]=state.devLayout.splice(from,1);state.devLayout.splice(to,0,tile);persist();render();
  });
  $('#menuToggle').addEventListener('click', () => {
    const open = !$('#sidebar').classList.contains('open');
    $('#sidebar').classList.toggle('open', open);
    $('#sidebarScrim').classList.toggle('show', open);
    $('#sidebar').setAttribute('aria-hidden', String(!open));
    $('#menuToggle').setAttribute('aria-expanded', String(open));
    $('#mobileMore').setAttribute('aria-expanded', String(open));
  });
  $('#closeNav').addEventListener('click', closeMobileNav);
  $('#mobileMore').addEventListener('click', () => $('#menuToggle').click());
  $('#sidebarScrim').addEventListener('click', closeMobileNav);
  $('#modal').addEventListener('click', (event) => { if (event.target === $('#modal')) $('#modal').close(); });
  window.addEventListener('popstate', () => { currentPage = readPage(); render(); });

  function syncWorkspaceRatchetCursor() {
    const cursor = $('#workspaceRatchetCursor');
    if (!cursor) return;
    const darkTheme = state.preferences.theme === 'dark';
    const enabled = state.preferences.cursorStyle !== 'system';
    const requestedSize = Number(state.preferences.cursorSize);
    const size = [44, 56, 72].includes(requestedSize) ? requestedSize : 56;
    const source = darkTheme ? 'assets/ui-packs/ratchet-silver.png' : 'assets/ui-packs/ratchet-light.png';
    if (!cursor.getAttribute('src')?.endsWith(source)) cursor.setAttribute('src', source);
    cursor.style.width = `${size}px`;
    const hotspotX = size * (darkTheme ? 0.135 : 0.195);
    const hotspotY = size * (darkTheme ? 0.224 : 0.19);
    cursor.style.setProperty('--cursor-hotspot-x', `${hotspotX}px`);
    cursor.style.setProperty('--cursor-hotspot-y', `${hotspotY}px`);
    cursor.style.transformOrigin = `${hotspotX}px ${hotspotY}px`;
    document.body.classList.toggle('workspace-ratchet-cursor-active', enabled);
    cursor.classList.toggle('is-hidden', !enabled);
  }

  function initWorkspaceRatchetCursor() {
    const cursor = $('#workspaceRatchetCursor');
    const modal = $('#modal');
    if (!cursor) return;
    syncWorkspaceRatchetCursor();
    const hide = () => { cursor.classList.add('is-hidden'); cursor.classList.remove('clicked'); };
    const move = (event) => {
      if (event.pointerType === 'touch' || state.preferences.cursorStyle === 'system') { hide(); return; }
      const hotspotX = Number.parseFloat(cursor.style.getPropertyValue('--cursor-hotspot-x')) || 9;
      const hotspotY = Number.parseFloat(cursor.style.getPropertyValue('--cursor-hotspot-y')) || 9;
      cursor.style.transform = `translate3d(${event.clientX - hotspotX}px, ${event.clientY - hotspotY}px, 0)`;
      cursor.classList.remove('is-hidden');
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', (event) => {
      move(event);
      if (event.pointerType === 'touch' || state.preferences.cursorStyle === 'system') return;
      cursor.classList.remove('clicked'); void cursor.offsetWidth; cursor.classList.add('clicked');
    }, true);
    document.addEventListener('pointerup', () => cursor.classList.remove('clicked'));
    document.addEventListener('pointercancel', hide);
    document.addEventListener('mouseout', (event) => { if (!event.relatedTarget) hide(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
    window.addEventListener('blur', hide);
    window.addEventListener('focus', hide);
    const bindFrameCursor = () => {
      for (const frame of $$('iframe:not([data-ratchet-cursor])')) {
        frame.dataset.ratchetCursor = 'true';
        frame.addEventListener('pointerenter', hide);
        frame.addEventListener('mouseenter', hide);
      }
    };
    bindFrameCursor();
    new MutationObserver(bindFrameCursor).observe(document.body, { childList: true, subtree: true });
    const moveIntoTopLayer = () => {
      if (modal?.open && cursor.parentElement !== modal) modal.appendChild(cursor);
      else if (!modal?.open && cursor.parentElement !== document.body) document.body.appendChild(cursor);
    };
    if (modal) {
      new MutationObserver(moveIntoTopLayer).observe(modal, { attributes: true, attributeFilter: ['open'] });
      modal.addEventListener('close', moveIntoTopLayer);
    }
  }

  initWorkspaceRatchetCursor();
  bindWeatherWidgetControls();
  window.addEventListener('resize', applyWeatherWidgetPosition);
  render();
  updateWeatherComponents();
  void fetchLiveWeather();
  window.setInterval(fetchLiveWeather, 15 * 60 * 1000);
  window.setInterval(updateWeatherComponents, 1000);
  window.setInterval(() => {
    if (!state.activeShift) return;
    const clock = $('#clockFace');
    if (clock) clock.textContent = formatHours(todayHours());
  }, 60000);
})();
