# Telinekartta- ja suunnittelutyökalu — toteutussuunnitelma

## Tavoite

Rakennus- ja projektitietojen näkymästä valitaan oikea rakennus kartalla. Sen jalanjälki tuodaan mittasuhteisena piirtoalustalle. Käyttäjä sijoittaa siihen järjestelmäkohtaisiin moduuleihin perustuvan telinegeometrian, tarkastelee julkisivupiirustusta ja samaan malliin perustuvaa 3D-näkymää sekä tuottaa materiaaliluettelon ja tarjouslaskelman.

Ensimmäinen julkaisu on paikallinen suunnittelu- ja määrälaskennan päätöstuki. Kartalta tai mallista arvioituja mittoja, katalogipoimintoja tai tarjoushintoja ei esitetä varmennettuina suunnitteluarvoina. Varsinainen telineen rakenteellinen mitoitus ja hyväksyntä kuuluvat pätevälle suunnittelijalle.

## Lähtöaineistojen auditointi

- Toimitettu piirtoalusta on itsenäinen HTML-sivu: A4-vaakasuuntainen Canvas-piirtoalue, skaalavalinta 1:10–1:500, ruudukko- ja piste-/viivasnap, viiva- ja suorakulmiotyökalut, Push/Pull, kumoa ja tyhjennä. Tyhjässä versiossa ei ole valmista rakennusta tai telinettä. Sen XZ-piirto- ja snapping-logiikka kannattaa siirtää moduuliksi ja säilyttää tutut työkalut. Tallennus, projektit, karttakytkentä, CAD-julkisivut, materiaalikirjasto ja vienti lisätään erikseen.
- Valmistajatyökirja sisältää 55 välilehteä, 13 valmistajaa/tuotebrändiä ja 2 416 osarekisteririviä. Yhteisessä osarekisterissä on esimerkiksi valmistaja, järjestelmä/katalogi, versio, tuotenumero, nimike, käyttökohde, mitat, paino, lähde ja tiedon tila. Erillisiä välilehtiä on mm. Layher-, PERI-, ROTAX-, HAKI-, Scafom-rux-, ALFIX-, ULMA- ja muille järjestelmille sekä BOM-esimerkeille ja osalle kuormitustaulukoista.
- Työkirjan omat huomautukset edellyttävät poimintojen tarkistamista alkuperäisistä PDF-lähteistä. Eri valmistajien tai järjestelmävarianttien yhteensopivuutta ei oleteta; katalogin esimerkkikokoonpano ei ole hyväksytty suunnitelma. Rivit on tuotava käyttöön lähdeasiakirja-, sivu-, revisio- ja tarkistustilatietoineen, ei yhtenä yhteensopivana komponenttivarastona.
- Kuvakaappaukset määrittelevät tavoitellun työnkulun: kartalta valitun rakennuksen polygoni ja sivumitat, rakennuskorkeuden lähde/arvio, 3D-massan katselu, telinegeometrian parametrit, materiaalit ja analyysivälilehdet sekä siirtymä tarjouslaskentaan. Kuvien EN 12811 -analyysimerkintä ei siirry tämän työkalun laskentatulokseksi ilman erillistä, pätevää ja riippumattomasti varmennettua mitoitusmoottoria.

## Käyttäjän työnkulku

1. Hae osoitteella tai siirry kartalla kohteeseen ja valitse rakennuksen pohjageometria.
2. Tarkista rakennuksen tunniste, lähde, hakuaika, koordinaattijärjestelmä ja lähteen tarjoamat ominaisuudet. Muokkaa tai piirrä jalanjälki, jos lähdegeometria puuttuu tai on epätarkka.
3. Valitse julkisivusivu. Tarkista sivun pituus, kulmapisteet ja mahdollinen poikkeava muoto. Syötä puuttuva korkeus käsin ja merkitse se käyttäjän arvoksi.
4. Siirry mittasuhteiselle piirtoalustalle. Valitse piirtoasteikko ja modulaarinen telinejärjestelmä. Piirrä kentät ruudukkoon napsauttaen, tai anna pituus/kerrosparametrit ja muokkaa generoituja moduuleja.
5. Tarkastele jokaisen sivun 2D-julkisivua ja koko kohteen 3D-mallia. Kaikki näkymät luetaan samasta projektigeometriasta.
6. Luo valitun järjestelmän BOM määristä. Tarkista lähde- ja revisiotiedot sekä käsin lisätyt puuttuvat osat.
7. Syötä omat ostohinnat/vuokrahinnat, työ-, kuljetus- ja muut tarjouskulut. Tarkastele eriteltyä kustannusarviota ja vie luonnos tarjoukseen.
8. Tallenna projekti, piirustusrevisio, BOM ja tarjousvedos paikallisesti. Päivitä tai muuta revisiota hallitusti.

## Vaiheet

### 0. Domain-malli ja lähteiden tilat

Määritä paikallinen projektirakenne: kohde ja rakennusgeometria, lähdemetadata, korkeus ja sen alkuperä, valitut julkisivusivut, piirtoalustan mittakaava, telinejärjestelmä/revisio, moduulit, komponenttikirjasto, BOM, hinnoittelu ja piirustusversiot.

Jokaisella rakennusarvolla ja komponenttitiedolla on tila: `lähteestä`, `käyttäjän syöttämä`, `arvio`, `tarkistettava` tai `varmennettu lähdedokumentista`. Älä korvaa tyhjiä tai vanhentuneita arvoja oletuksilla.

### 1. Rakennuksen haku kartasta

- Lisää karttavalintaan rakennusten polygonit ja attribuutit. Ensisijainen ehdokas on kartassa jo käytetty Helsingin rakennus-/CityJSON-lähde; valtakunnalliseksi täydentäväksi lähteeksi soveltuu Maanmittauslaitoksen Maastotietokannan OGC API Features -rakennuskokoelma.
- MML:n avoimen kyselyrajapinnan käyttö edellyttää API-avainta. Avain pidetään nykyisen paikallisen avainholvin kautta palvelinpuolella; selaimeen ei rakenneta suoraa avainkutsua.
- Normalisoi lähdegeometria sovelluksen sisäiseen metriyksikköiseen projektikoordinaatistoon. Säilytä lähteen CRS, tunniste, lähde, päiväys ja attribuutit. Älä sekoita rakennuspolygonia tonttirajaan tai ilmakuvaan.
- Korkeus näytetään lähteen ominaisuutena vain, jos se todella löytyy. Muuten käyttäjä syöttää sen ja sovellus näyttää arvon arvioituna/käsin annettuna. Rakennuksen 3D-massa voi olla jalanjälki ja syötetty korkeus; se merkitään visualisoinniksi.

### 2. Mittasuhteinen piirtoalusta

- Integroi ZIPin piirtoalustan piirtologiikka nykyiseen **Suunnittelu & CAD** -työtilaan. Pidä ruudukon mitat metreissä; paperi-/näyttömittakaava on vain näkymän muunnos. Zoomaus ei muuta todellisia koordinaatteja.
- Tuo valittu rakennus jalanjälkenä piirtoalustalle ja lukitse se taustatasoksi. Tarjoa siirto-, kierto- ja mittakaavan tarkistustyökalut, mutta älä salli huomaamatonta mittasuhteen venytystä.
- Snap-asetukset ja viiva-/suorakulmio-/Push-Pull-toiminnot säilytetään. Lisää moduuliaskeleet vain valitun järjestelmän dokumentoiduista mitoista. Tuntematon moduuli voidaan piirtää vapaana geometriana, mutta sitä ei käsitellä katalogikomponenttina.
- Tallenna raakageometria ja metrimitoitus; tulosta A4/A3-PDF oikealla tulostusmittakaavalla ja otsikkotaululla, joka sisältää projektin, koordinaatit, lähteet, päivän ja revision.

### 3. Modulaarinen teline ja 2D-julkisivu

- Valitse rakennuksen sivu tai sivujakso. Telineen runko muodostetaan kenttäleveyksistä, nousukorkeuksista, työtasojen tasoista ja järjestelmän osista.
- Anna käyttäjän piirtää ruudukolla tai luoda alustava kenttäjako. Pyöristäminen sallitaan vain näkyvänä ehdotuksena: näytä todellinen kokonaispituus, päätyväli ja erotus julkisivuun.
- Tuota jokaisesta sivusta mittaviivallinen 2D-julkisivunäkymä. Näytä tasot, pystyt, vaakasiteet, diagonaalit, kulmat, aukot, nousutiet, sidonnat ja manuaaliset huomautukset siinä määrin kuin projektimalli sisältää ne.
- Piirustus on suunnitteluluonnos, kunnes komponenttivalinnat, sidonnat, kuormat, perustaminen ja hyväksyntä on tarkastettu.

### 4. 3D-malli

- Generoi Three.js-malli samasta rakennus- ja telinemallista, jota 2D ja BOM käyttävät. Rakennus, teline, työtasot ja puuttuvat lähdetiedot erotellaan visuaalisesti.
- Salli kierto, zoom, rakennuksen/telineen näkyvyyden vaihto sekä rakennussivun korostus. Pidä geometrian yksiköt metreissä ja tee testit mittakaavan säilymiselle kartalta 2D:hen ja 3D:hen.
- 3D-näkymä tarkistaa sijoittelua ja ristiriitoja; se ei ole rakenteellinen analyysi.

### 5. Versioitu komponenttikirjasto ja BOM

- Tuo työkirjan yleinen osarekisteri, mutta säilytä valmistaja, järjestelmä, variantti, katalogiversio, tuotenumero, nimike, mitat, paino, lähde-URL, PDF-sivu, poiminnan tila ja tarkistaja.
- Rajaa valinta aina yhteen yhteensopivaksi merkittyyn järjestelmään ja sen dokumentoituun varianttiin. Älä ehdota osien ristiinyhteensopivuutta valmistajien välillä.
- BOM lasketaan 2D/3D-mallin moduulien ja komponenttireseptien perusteella. Kun resepti puuttuu, tulos merkitään keskeneräiseksi eikä määrää arvata. Erota suunnittelumäärä, työmaavara ja hinta.
- Paino- ja kapasiteettikentät ovat eri tietotyyppejä. BOM voi laskea lähteistetyn painon; lujuus-/kuormitusarvoa ei käytetä mitoitukseen ennen lähdedokumentin ehtojen ja revisioiden tarkastusta.
- Säilytä alkuperäiset XLSX lähteenä ja tuota sovellukselle normalisoitu, versioitu JSON. Näytä kirjaston päivitys ja muutosten vaikutus vanhoihin projekteihin.

### 6. Tarjouslaskuri

Tarjouslaskuri lukee BOMin mutta ei muuta rakennesuunnittelua. Rivikohtaiset kustannukset muodostetaan käyttäjän tai ajantasaisen toimittajan tarjouksen hinnoista:

- osien osto, vuokra-aika ja lisävuokra
- kuljetus, nouto ja palautus
- pystytys, purku, tarkastus ja muut työtunnit
- alihankinta, työmaakohtaiset lisät ja käyttäjän antama varaus
- kate sekä arvonlisävero omilla nimetyillä parametreillaan

Näytä kustannuslähde, voimassaolo, valuutta, määräyksikkö ja kuka syötti hinnan. Puuttuva hinta näkyy avoimena tarjousrivinä; yleistä markkinahintaa ei oleteta. Tuloste on tarjousluonnos.

### 7. Tarkastus, revisiot ja vienti

- Jokainen muutos rakennusgeometriaan, mittakaavaan, telinegeometriaan, järjestelmään tai BOM-lähteisiin luo uuden version tai mitätöi siihen sidotun tarkastuksen.
- Tallenna paikallisesti muuttumaton projektivedos: lähteiden tunnisteet, malligeometria, piirustusrevisio, järjestelmä- ja katalogiversio, BOM, kustannussyötteet, laskenta-aika ja tarkastajan paikallinen kirjaus.
- Vienti: mittakaavallinen PDF/SVG-julkisivu ja pohjakuva, BOM CSV/XLSX sekä tarjous-PDF. DWG/DXF-vienti ja automaattinen CAD-tiedoston tulkinta myöhemmäksi vaiheeksi.
- Varoitus- ja puutetilat estävät projektin esittämisen valmiina. Digitaalista allekirjoitusta tai viranomais-/suunnittelijahakemusta ei sisällytetä.

## Rajaus, hyväksyntä ja onnistumiskriteerit

- Kartan rakennuskorkeus ja mitat merkitään lähdearvoksi, käyttäjän arvoksi tai arvioksi. Rakennuksen valinta ja projektiin kopiointi säilyttävät lähdeviitteen.
- Skaala säilyy, kun kartalta siirrytään piirtoalustaan, zoomataan, tulostetaan sekä avataan 3D-malli.
- Yhden valitun järjestelmän dokumentoiduilla moduuleilla syntynyt teline vastaa 2D- ja 3D-näkymissä toisiaan; BOM seuraa mallin muutoksia.
- Tuntematon katalogirivi, epäselvä variantti, puuttuva kokoonpanoresepti tai puuttuva hinta ei saa hiljaista oletusarvoa.
- Lähteistetyt määrät ja hinnat voidaan jäljittää komponenttiin ja asiakirjaan. Tarjouslaskelma erottaa hinnan rakenteellisesta mitoituksesta.
- Testit kattavat koordinaattimuunnokset, polygonin mittasuhteen, moduulijaon pyöristyksen, revisiomuutoksen, järjestelmärajan, BOM-määrät, hinnan/ALV:n ja PDF-mittakaavan.
- Ennen tuotantokäyttöä kartoitetaan rajapintojen käyttöehdot, lisenssit, API-avaimet sekä valmistajakatalogien käyttöoikeudet. Rakenteelliseen päätöksentekoon tarvitaan erillinen pätevä suunnittelijan hyväksyntäprosessi ja riippumattomasti varmennetut vertailut.

## Ehdotettu toimitusjärjestys

1. Projektin ja rakennuksen tiedostomuoto, lähdekentät sekä ZIP-piirtoalustan moduuliksi siirto.
2. Kartan rakennushaku, polygonivalinta ja mittayksikkö-/CRS-muunnokset.
3. Piirtoalustan rakennustausta, julkisivusivun valinta sekä modulaarinen 2D-telinegeometria.
4. Samasta tietomallista johdetut 3D-näkymä ja PDF/SVG-julkisivupiirustus.
5. XLSX-kirjaston rajattu import, järjestelmäkohtainen komponenttivalinta ja BOM.
6. Paikallinen tarjouslaskuri, hintasyötteet sekä tarjous-/BOM-vienti.
7. Revisioiden tarkastus, lähde- ja lisenssikatselmus sekä suunnittelijan riippumattomat vertailut ennen rakenteellisten laskentojen mahdollista lisäämistä.

## Toteutuksen tila 2.11.2026

Ensimmäinen paikallinen käyttökokonaisuus on toteutettu nykyiseen TelineHallinnan työtilaan:

- Helsingin rakennusrekisterin karttavalinta, 3D-kaupunkimallin CityJSON-valinta ja käyttäjän piirtämä pohjapolygoni käyttävät samaa rakennuskortin näkymää. Uschakoffin talo, Aleksanterin teatteri ja muut kohteet ovat tämän saman karttatietoon ja siitä luotuun 3D-massaluonnokseen perustuvan kortin valintoja, eivät omia erikoistoteutuksia.
- Mannerheimintie 5 on rakennuskortissa tunnisteilla RATU 391 ja VTJ-PRT 103036835V. Käyttäjän lisäämä Stockmann / ABC City -arkistopiirustus säilyy erillisenä mahdollisena arkistoviitteenä; sen yhteyttä nykyiseen rakennukseen ei ole varmennettu eikä sitä käytetä rakennuksen geometrian lähteenä.
- 3.11.2026: Mannerheimintie 5:n valokuva tunnisti rakennuksen Uudeksi ylioppilastaloksi (ent. Osakuntatalo). Aiempi Stockmann-pohjainen julkisivutulkinta korvattiin. Tämän päivityksen internetlähteet täsmentävät sijoittelun: pitkä siipi kulkee Mannerheimintien suuntaisesti, toinen siipi tontin sisäosaan/Ylioppilasaukiolle ja kupolitorni niiden nivelkohtaan. Kupolitornin pohjapaikka sovitettiin WFS-jalanjäljen pyöristettyyn kulmaan. Ylvan nykykuvat näyttävät pitkän siiven vihreän, dormereilla rytmitetyn kuparikaton; arkkitehtuurikävely kuvaa aukionpuoleisen päädyn frontoniaiheen. Blender-, GLB- ja OBJ-mallit, selainesikatselu, lähdeviitteet ja metadata päivitettiin. Kaupunginmuseo antaa kupulankaulan 4,3 m:n korkeuden, kupolin 4,3 m:n säteen ja lanternin 2/3-suhteen. Rungon korkeus, kattokaltevuudet, dormerien mitoitus ja tornin tarkka keskipiste ovat arvioita; malli ei ole varmennettu as-built-, LOD3-, lupa- tai rakennesuunnittelumalli.
- Kortti näyttää valitun kohteen ominaisuuksia, tunnisteen, lähteen, koordinaatiston ja hakuajan sekä tarjoaa piirustushakuja ja OBJ-massaluonnoksen luonnin tai tuonnin. Kartan pohjapolygonin voi valita tai piirtää piste kerrallaan.
- Rakennuksen ja telineen tiedot kulkevat yhteiseen EPSG:3879-projektigeometriaan. Julkisivun tavoitemitta, HAKI-kenttien määrä, telinekorkeus ja tasot päivittävät 2D-näkymää, 3D-mallia ja HAKI Universal 2024 -määrärivejä. Kenttämäärän pyöristyksen yli- tai alimitta näytetään erikseen; korkeutta tai mittoja ei täytetä hiljaisilla oletuksilla.
- Erillisen BOM-katalogiselauksen oletus on Layher Allround, ja haussa on järjestelmäkohtainen rajaus, joka pitää Layher Event Systems -rivit erillään. Katalogin poimitut osat säilyttävät tarkistustilansa ja lähdetietonsa.
- Projektin paikallinen tallennus, revisiot, tarkastusmerkinnät sekä SVG-, DXF-, OBJ-, FreeCAD-makro- ja BOM-viennit hyödyntävät olemassa olevaa projektivarastoa. Piirustus-PDF ja tarjous-PDF avautuvat selaimen tulostusnäkymään, josta käyttäjä valitsee PDF-tallennuksen.
- Tarjouslaskurin eurohinnat, kulujen lähteet, kate, ALV, voimassaoloaika ja hinnan syöttäjä ovat käyttäjän määritettäviä. Kate tai ALV eivät saa oletusarvoa; CRM:ään ei siirretä keskeneräisen tarjouksen kustannussummaa myyntihintana.

### Ensimmäisen julkaisun rajat

- Parametrisen telineprojektin automaattinen komponenttiresepti ja määräluonnos on edelleen rajattu HAKI Universal 2024 -järjestelmään. Layher Allround on oletuksena erillisessä katalogiselauksessa, mutta katalogista poimittuja rivejä ei vielä käytetä automaattisen Layher-määräreseptin lähteenä. Layher Allroundin ja Event Systemsin osat pidetään eri järjestelmissä; yhteensopivuutta ei päätellä.
- MML:n valtakunnallista rakennuskyselyä ei ole kytketty tähän käyttöliittymään; se vaatii palvelinpuolen API-avaimen. Ensimmäinen toteutus käyttää Helsingin kartta- ja CityJSON-lähteitä sekä käyttäjän piirtämää pohjaa.
- Pohjan luonnissa voi lisätä pisteitä, perua viimeisen pisteen tai piirtää pohjan uudelleen. Tallennetun polygonin yksittäisten kulmapisteiden raahauseditointi ei kuulu tähän vaiheeseen.
- Teline luodaan dokumentoiduilla parametreilla. Yksittäisten telineosien vapaa sijoittelu ja koko valmistajakirjaston järjestelmäkohtaiset kokoonpanoreseptit ovat jatkokehitystä.
- Laskelmat ja piirustukset ovat lähteistettyjä luonnoksia ja määrätukea. Sidonnat, perustaminen, kuormat, vakaus sekä valmistajan ja pätevän rakennesuunnittelijan hyväksynnät jäävät erikseen tarkistettaviksi.
- Koodin ja rajattujen testien tarkistus ei vahvista selaimessa tehtyä visuaalista käyttötestiä, MML-yhteyttä, valmistajakatalogien ajantasaisuutta eikä rakenteellista turvallisuutta.

## Lähteet

- Toimitettu piirtoalusta ja ohje: `piirtoalusta_ilman_rakennus_teline_luontia_uusi.zip`.
- Toimitettu järjestelmä- ja osarekisteri: `Telinejarjestelmat_MASTER_kaikki_valmistajat_muotoiltu.xlsx`.
- Kuvakaappaukset 27.10.2026: karttarakennus, mitat/korkeus, rakennuksen 3D-massa, telineen mitoitusnäkymä ja analyysivälilehdet.
- Maanmittauslaitoksen [Maastotietokannan OGC API Features -tekninen kuvaus](https://www.maanmittauslaitos.fi/maastotietokannan-kyselypalvelu/tekninen-kuvaus) ja [palvelun käyttöönotto ja aineistot](https://www.maanmittauslaitos.fi/maastotietokannan-kyselypalvelu).
- Suomen telinevaatimusten lähtökohta: [Valtioneuvoston asetus 205/2009, 51 ja 53 §](https://www.finlex.fi/fi/lainsaadanto/saadoskokoelma/2009/205).
