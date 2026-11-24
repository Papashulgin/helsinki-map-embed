# Suomen kartta-aineistot TelineHallinnassa

Integroitu 30.10.2026. Lähdepaketti: tässä työssä koottu Suomen QGIS-aineistopaketti.

## Käyttö

- `/?page=gis`: olemassa oleva työmaakartta ja sen vieressä aineistovalitsin.
- `/?page=mapdata`: koko hakemisto TelineHallinnan omana näkymänä.
- Hakusanat, tuottaja, aineistotyyppi ja **Vain tähän karttaan lisättävät** rajaavat hakua.
- **Lisää kartalle** lisää WMS-karttakuvan tai paikallisen kunta-/maakunta-aineiston kartalle.
- Valittuja tasoja voi poistaa, tyhjentää ja säätää niiden peittävyyttä. Enintään kuusi tasoa kerrallaan.
- **Koko Suomi** ja **Helsinki** siirtävät työmaakartan näkymää.
- QGIS ZIP, GeoPackage, QGIS-projekti, yhteystiedostot ja lähdeohjeet latautuvat paikallisesta sovelluksesta.

## Aineisto ja rajaukset

Tuonti sisältää 5 380 WMS-karttatasoviittausta, kahdeksan paikallista aineistokuvausta,
25 latauslähdettä ja 179 täydentävää luettelo-osumaa. Alkuperäisen TerraLab-haun
185 osumasta kuusi selvästi Suomeen sopimatonta tuotetta jätettiin sovelluksen hausta pois.
Viittaukset sisältävät vuosiversioita ja saman aineiston julkaisuja eri palveluissa.

WMS-tasoa voi lisätä selaimen karttaan vain, jos se ilmoittaa tukevansa EPSG:3857-
tai EPSG:900913-koordinaatistoa eikä lähteen polku ole rajoitetun käyttöluvan palvelu.
Myös perityt WMS-koordinaatistot huomioidaan alkuperäisistä GetCapabilities-vastauksista.
Karttakuva ei sisällä muokattavaa kohdegeometriaa, rakennusmittoja tai automaattista
telinesuunnittelun lähtötietoa. Kattavuus, mittakaava ja käyttöehdot näkyvät lähdekortissa.

Paikallinen GeoPackage sisältää Tilastokeskuksen yleistetyt vuoden 2026 tilastolliset
aluejaot ja Paavo-julkaisun (yhteensä 3 465 kohdetietuetta), EPSG:3067.
Selaimen kunta- ja maakuntakopiot on muunnettu EPSG:4326-koordinaatteihin.
Paikallisten lähteiden lisenssi: Tilastokeskus 2026, CC BY 4.0. Muilla lähteillä ovat
omat käyttöehtonsa. Digiroad-julkaisut on merkitty vanhoiksi niiden tasometatietojen
18.9.2026 päivityskatkon vuoksi. Suuret valtakunnalliset tiedostot ovat latauslinkkejä.

## Tiedostot ja päivitys

- `public-static/data/finland-map-data/manifest.json`: sovelluksen normalisoitu hakemisto.
- Saman kansion GeoPackage, QGIS-tiedostot, ZIP ja lähdeohjeet: sovelluksen lataukset.
- `layers/kunnat_2026.geojson` ja `layers/maakunnat_2026.geojson`: paikalliset karttatasot.
- `public-static/map-data.js`: hakemisto, valinnat ja Leaflet-karttatasot.
- `lib/map-data-catalog.js`: sivutettu vain luku -haku ja kiinteä latausluettelo.

Tuonti uudesta tarkistetusta paketista, järjestelmän GDAL Python -kirjastoilla:

```sh
/usr/bin/python3 scripts/import-finland-map-data.py /polku/suomi-kartta-aineistot --capabilities /polku/tarkistettuihin-wms-xml-tiedostoihin
```

Tuonti ei kutsu TerraLabia tai lataa koko maan lähdeaineistoja itsenäisesti.
Koordinaatistoja perivä Web Mercator -tuki voidaan tuonnissa vahvistaa XML-vastauksilla;
ilman niitä käytetään lähdepaketin suoraan ilmoittamia koordinaatistoja.
Node-palvelin ei tarvitse GDALia ajonaikaiseen käyttöön. Palvelin käynnistetään
uudelleen hakemiston vaihtamisen jälkeen, koska hakemisto luetaan muistiin ensimmäisessä haussa.

## HTTP-rajapinnat

- `GET /api/map-data/metadata`: koonti, suodattimet ja lataukset.
- `GET /api/map-data/catalog?q=&provider=&kind=&mapOnly=1&offset=0&limit=20`: enintään 50 tulosta sivulla.
- `GET /api/map-data/selection?ids=...`: enintään kuusi hakemiston kartalle sopivaa tasoa.
- `GET /api/map-data/downloads/:id`: ennalta määrätty lataustiedosto; ei käyttäjän antamaa tiedostopolkua.

Palvelin ei välitä mielivaltaisia ulkoisia URL-osoitteita eikä lue käyttäjän syöttämiä
tiedostopolkuja. Ulkoiset WMS-kuvat ladataan valitusta julkaistusta palvelusta suoraan
selaimessa. Ei automaattista päivitysajoa, API-avaimia tai uusia ulkoisia kirjoituksia.
