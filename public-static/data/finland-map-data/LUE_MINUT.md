# Suomen avoimet kartta-aineistot

Koottu ja tarkistettu 30.10.2026. Koko Suomen aineistolähteet, lisäksi valikoima kuntakohtaisia lähteitä pääkaupunkiseudulta.

## Aloita tästä

1. Pura koko ZIP samaan kansioon.
2. Avaa `suomi_kartta-aineistot.qgz` QGISissä. Paikalliset tiedostot löytyvät suhteellisilla poluilla samasta kansiosta.
3. Aluksi näkyvät maakunnat. Kytke haluamasi paikallinen tai verkosta tuleva karttataso päälle tasoluettelosta.
4. Avaa `suomi_aineistoluettelo.html` selaimessa. Se toimii ilman verkkoyhteyttä; lähteiden avaaminen ja WMS-karttakuvat tarvitsevat verkkoyhteyden.

## Mitä paketissa on

- **8 paikallista karttatasoa**, yhteensä 3,465 kohdetietuetta.
- **212 tarkistettua WMS-palvelun tasoluetteloa**, joista avoimen palvelupolun yhteystiedostossa 211. Aineistokohtaiset luvat ovat silti voimassa.
- **5,380 karttatasoviittausta**: mukana vuosiversioita, yhdistelmäkarttoja ja samoja aineistoja eri palveluosoitteissa. Tämä ei ole yksilöllisten aineistojen määrä.
- **185 TerraLab-luettelo-osumaa** 23 aineistoryhmästä. Näistä 124 on luettelon mukaan TerraLabin toimittamia; muut ovat ulkoisia lähteitä. Näitä ei ole ladattu paikallisesti.
- Latauslähteet suurille valtakunnallisille aineistoille, palveluyhteydet ja koneellisesti luettava JSON-hakemisto.

Tämä on laaja, lähteistetty kokoelma. Se ei ole kaikkien Suomen kartta-aineistojen täydellinen arkisto. Kaikkien kuntien omia palveluita, maksullisia aineistoja tai käyttöluvan vaativia aineistoja ei ole koottu. TerraLab-haussa on enintään 20 palvelun toimittamaa osumaa per aineistoryhmä sekä ulkoisia lähteitä; hakutulos ei ole koko kansallinen aineistoluettelo.

## Paikallinen GeoPackage

Lähde: Tilastokeskuksen WFS, haettu 30.10.2026. Lisenssi: **CC BY 4.0**, lähdemerkintä **Tilastokeskus 2026**. Kaikki karttatasot **ETRS-TM35FIN / EPSG:3067**.

| Taso | Kohteita |
|---|---:|
| `kunnat_2026` | 308 |
| `maakunnat_2026` | 19 |
| `seutukunnat_2026` | 69 |
| `suuralueet_2026` | 5 |
| `hyvinvointialueet_2026` | 23 |
| `elinvoimakeskukset_2026` | 10 |
| `vaalipiirit_2026` | 13 |
| `paavo_postinumeroalueet_2026` | 3018 |

Aluejaot ovat yleistettyjä **1:1 000 000 tilastollisia alueita**, eivät kiinteistörajoja. Hyvinvointialueiden tilastojako sisältää palvelun 23 tilastoyksikköä; se ei tarkoita 23 hallinnollista hyvinvointialuetta. Paavo on vuoden 2026 julkaisu, jonka muuttujat kuvaavat aiempia viitevuosia. Suojattu arvo **-1** on säilytetty; sitä ei pidä tulkita negatiiviseksi väestöksi tai tuloksi.

GeoPackagessa on lisäksi kolme geometriatonta hakemistotaulua: `karttatasohakemisto`, `rajapintahakemisto` ja `terralab_luettelo_osumat`. Niiden rivejä ei lasketa karttakohteiden määrään.

## Verkkoaineistojen käyttäminen

Projektissa on valikoima rakennus-, kiinteistö-, kaava-, maanpeite-, vesi-, luonto-, metsä- ja maaperäkarttoja. WMS-tasot ovat aluksi pois päältä. Kiinteistörajat ja rakennukset näkyvät vasta riittävästi tarkennettaessa; kaikki tasot eivät kata koko maata.

WMS on karttakuva. Se ei sisällä projektissa paikallista, muokattavaa kohdegeometriaa. Sellainen haetaan aineiston tiedostolatauksesta, WFS:stä tai muusta latausrajapinnasta.

Lisää muut palvelut QGISissä: **Tasot → Lisää taso → Lisää WMS/WMTS-taso → Lataa yhteydet** ja valitse `suomi_wms_yhteydet.xml`. Valitse sitten haluamasi palvelu, yhdistä ja lisää taso. WFS:lle vastaava tiedosto on `suomi_wfs_yhteydet.xml`. WFS-yhteydet on poimittu julkaisijoiden ohjeista, mutta niiden jokaisen latausominaisuuksia ei ole testattu. Oletusraja 10 000 kohdetta on yhteyden suojaava hakuraja, ei aineiston kokonaismäärä; suuret aineistot on rajattava tai ladattava tiedostojakelusta.

## Ajantasaisuus ja käyttöehdot

- Palvelun onnistunut GetCapabilities-tarkistus vahvistaa sen ilmoittaman tasoluettelon. Se ei varmista jokaisen tason karttakuvaa, sisältöä, mittakaavaa tai paikallista kattavuutta.
- **Digiroad:** kerätyt Väyläpilven tasometatiedot ilmoittavat päivitysten päättyneen **18.9.2026**. Tasot on merkitty vanhaksi julkaisuksi. Fintrafficin nykyiset tieverkon ja PETI-pysäkkipalvelut on linkitetty erikseen.
- **GTK:** rajapintojen tasoissa voi olla avoin tai rajoitettu jatkokäyttöoikeus. Tarkista valitun tason ehdot.
- **Traficom:** rajoitetun käyttöluvan polut ovat hakemistossa erikseen merkittyinä eikä niitä ole WMS-yhteystiedostossa. S-57-palvelulla on omat ehtonsa.
- **MML:** osa tiedostopalveluista ja ortokuva-/korkeusmallirajapinnoista vaatii oman API-avaimen. Julkiset INSPIRE-katselupalvelut toimivat ilman avainta. Pakettiin ei ole tallennettu tunnuksia.
- **Ilmatieteen laitos:** WMS-käyttöä koskevat erityisehdot; sääaineistoille on annettu virallinen latausohje eikä yleiskäyttöistä WMS-tasoa.
- **TerraLab-luettelon globaalit osumat:** aluehaku voi palauttaa tuotteita, joiden todellinen havainto- tai pikselipeitto ei ulotu Suomeen. Selvästi sopimattomat öljypalmu-, mangrove-, GEDI- ja CHIRPS-tuotteet on merkitty. Muidenkin tuotteiden paikallinen kattavuus on vahvistettava ennen latausta.
- **Ryhti:** kuntien siirtyminen ja tietojen kattavuus vaihtelevat. Palvelun olemassaolo ei tarkoita, että jokaisen kunnan kaikki kaava- ja rakennustiedot ovat jo mukana.

Lähteiden käyttöehdot eivät muutu tällä kokoamisella. Paikallinen Tilastokeskuksen aineisto säilyttää CC BY 4.0 -lisenssinsä. OpenStreetMap- ja Overture-aineistoilla on omat ODbL- ja komponenttikohtaiset ehdot. Tässä paketissa niitä ei ole ladattu vektorikopioiksi.

## Tarkistettujen karttatasoviittausten jakauma

| Palveluntuottaja | Viittauksia |
|---|---:|
| Syke | 2502 |
| Helsinki | 486 |
| Tilastokeskus kaikki teemat | 420 |
| HSY | 410 |
| Tilastokeskus aluejaot | 360 |
| Syke satelliittihavainnot | 340 |
| GTK | 312 |
| Vantaa | 127 |
| Espoo | 108 |
| Metsäkeskus | 75 |
| Traficom | 66 |
| Digiroad / Fintraffic | 52 |
| Tilastokeskus Paavo | 39 |
| Ruokavirasto | 32 |
| Kauniainen | 29 |
| Maanmittauslaitos | 22 |

## Koko maan lataukset ja muut lähteet

- **[Maastotietokanta, kaikki maastoteemat](https://www.maanmittauslaitos.fi/geopackage) — Maanmittauslaitos.** Koko Suomen mtkmaasto.gpkg; yli 120 kohdeluokkaa. MML:n kokotaulukko: noin 23 Gt ZIP, 52 Gt purettuna. Ei ladattu tähän pakettiin.
- **[Maastotietokanta, korkeussuhteet](https://www.maanmittauslaitos.fi/geopackage) — Maanmittauslaitos.** Koko Suomen mtkkorkeus.gpkg; 7 kohdeluokkaa. MML:n kokotaulukko: noin 12 Gt ZIP, 24 Gt purettuna. Ei ladattu tähän pakettiin.
- **[Karttapaikan aineistolataus](https://asiointi.maanmittauslaitos.fi/karttapaikka/) — Maanmittauslaitos.** Maastotietokanta, hallintoalueet, korkeusmallit, ortokuvat ja avoimet laserkeilausaineistot tuotekohtaisesti.
- **[Korkeusmallit ja ortokuvat, WCS](https://www.maanmittauslaitos.fi/ortokuvien-ja-korkeusmallien-kyselypalvelu) — Maanmittauslaitos.** Rajatut GeoTIFF-haut, korkeusmalli 2 m ja karkeammat tasot; rajapinta vaatii käyttäjän API-avaimen. Ei avainta paketissa.
- **[Laserkeilaus ja ilmakuvaus](https://www.maanmittauslaitos.fi/laserkeilaus-ja-ilmakuvaus) — Maanmittauslaitos.** Ajantasaiset kuvaus- ja keilausohjelmat sekä saatavuusindeksit. Avoin harvennettu laserkeilaus 0,5 p/m²; tiheämmillä tuotteilla omat käyttöehdot.
- **[OpenStreetMap, Suomi GeoPackage ZIP](https://download.geofabrik.de/europe/finland-latest-free.gpkg.zip) — Geofabrik / OpenStreetMap.** Suora koko maan lataus, lähdesivulla noin 1,5 Gt. Geofabrikin valikoitu kohdeluokitus; ei kaikkia OSM-tageja. ODbL 1.0; © OpenStreetMap contributors. Ei ladattu paikallisesti.
- **[OpenStreetMap, Suomi OSM PBF](https://download.geofabrik.de/europe/finland-latest.osm.pbf) — Geofabrik / OpenStreetMap.** Laajempi OSM-raaka-aineisto, lähdesivulla noin 738 Mt. Muunnos tarvitaan tavalliseen vektorityöskentelyyn. ODbL 1.0; © OpenStreetMap contributors. Ei ladattu paikallisesti.
- **[OpenStreetMap Suomen julkaisusivu](https://download.geofabrik.de/europe/finland.html) — Geofabrik.** Ajantasainen tiedostokoko ja aineiston aikaleima; latest-linkit päivittyvät.
- **[Digiroad / Digitraffic Road Network](https://www.fintraffic.fi/fi/digitaalisetpalvelut-4) — Fintraffic.** Koko maan tieverkon tiedostojulkaisut ja käyttöohjeet. Vanhan Väyläpilven rajapinnan päivitykset päättyneet 18.9.2026 tasometatietojen mukaan.
- **[Tie-, rata- ja meriliikenteen havainnot](https://www.digitraffic.fi/) — Fintraffic / Digitraffic.** Liikenteen havainto- ja tilannetietoja sekä API-dokumentaatio; ei pysyvä koko maan karttataso.
- **[Pysäkki- ja esteettömyystietokanta PETI](https://www.fintraffic.fi/fi/digitaalisetpalvelut/fintrafficin-datapalvelut/liikkumisen-tietopalvelut/peti) — Fintraffic.** Uusi pysäkkitiedon lähde. Älä oleta vanhan Digiroad-pysäkkitason olevan ajantasainen.
- **[Syken tiedostolataukset](https://www.syke.fi/fi/ymparistotieto/ladattavat-paikkatietoaineistot) — Syke.** Valtakunnalliset ympäristö-, luonto-, vesistö- ja yhdyskuntarakenteen aineistopaketit.
- **[GTK:n paikkatietorajapinnat](https://www.gtk.fi/palvelut/aineistot-ja-verkkopalvelut/rajapintapalvelut/) — GTK.** Maaperä, kallioperä, geofysiikka, pohjatutkimukset ja kiviainesvarat. Aineistokohtaiset käyttöehdot.
- **[Metsä- ja luontotiedon rajapinnat](https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto/aineistot-paikkatieto-ohjelmille/rajapinnat) — Metsäkeskus.** Metsävarakuviot, elinympäristöt, metsänkäyttöilmoitukset, latvusmallit, virtaus- ja kosteusmallit.
- **[MVMI-metsävarakartat](https://kartta.luke.fi/) — Luonnonvarakeskus.** MVMI 2023: GeoTIFF-kartat, puuston ikä, pituus, tilavuus ja biomassateemat; Paituli-lataukset. CC BY 4.0.
- **[Peltolohkot ja maatalousmaa](https://www.ruokavirasto.fi/tietoa-meista/julkaistut-tietoaineistot/paikkatietoaineistot/) — Ruokavirasto.** Suorat GeoPackage-lataukset eri vuosilta, WMS, WFS ja Atom; CC BY 4.0.
- **[Sää- ja ilmastoaineistot](https://www.ilmatieteenlaitos.fi/avoin-data) — Ilmatieteen laitos.** Havainnot, ennusteet ja ilmastoaineistot; tuotteiden omat haut. WMS-käytöllä erilliset rajoitukset, joten sitä ei lisätty projektin yleiskartaksi.
- **[Lajihavainnot ja lajitiedot](https://info.laji.fi/etusivu/oppaat/opas-rajapintojen-kayttajalle/) — Suomen Lajitietokeskus.** Avoimet REST- ja OGC API -rajapinnat. Aineistokohtaiset käyttöehdot; herkkiä havaintoja voidaan karkeistaa tai rajoittaa.
- **[Kulttuuriympäristön tiedot](https://museovirasto.fi/palvelut-ja-ohjeet/asiakirjajulkisuuskuvaus) — Museovirasto.** Kulttuuriympäristön palveluikkuna ja avoimen paikkatiedon lähteet; palveluluettelo, ei paikallinen lataus.
- **[Pääkaupunkiseudun avoimet aineistot ja 3D](https://hri.fi/fi/ohjeet/datan-hyodyntajalle/paikkatiedon-hyodyntaminen/) — Helsinki Region Infoshare.** Helsinki, Espoo, Vantaa, Kauniainen ja HSY: kantakartat, kaavat, ilmakuvat sekä kaupunkikohtaiset 3D-aineistot.
- **[Koko Suomen metatietohaku](https://www.maanmittauslaitos.fi/asioi-verkossa/paikkatietohakemisto) — Maanmittauslaitos.** Muiden kuntien ja toimijoiden aineistojen haku. Tämä kokoelma ei korvaa kaikkien julkaisijoiden metatietoluetteloita.
- **[LC.LandCoverSurfaces.LPIS.gpkg · 2025](https://download.inspire.ruokavirasto-awsa.com/data/2025/LC.LandCoverSurfaces.LPIS.gpkg) — Ruokavirasto.** Suora vuoden 2025 koko maan GeoPackage-lataus julkaisijan sivulta. CC BY 4.0; ei ladattu paikallisesti.
- **[LC.LandCoverSurfaces.LPISLandscapeFeature.gpkg · 2025](https://download.inspire.ruokavirasto-awsa.com/data/2025/LC.LandCoverSurfaces.LPISLandscapeFeature.gpkg) — Ruokavirasto.** Suora vuoden 2025 koko maan GeoPackage-lataus julkaisijan sivulta. CC BY 4.0; ei ladattu paikallisesti.
- **[LandUse.ExistingLandUse.GSAAAgriculturalParcel.gpkg · 2025](https://download.inspire.ruokavirasto-awsa.com/data/2025/LandUse.ExistingLandUse.GSAAAgriculturalParcel.gpkg) — Ruokavirasto.** Suora vuoden 2025 koko maan GeoPackage-lataus julkaisijan sivulta. CC BY 4.0; ei ladattu paikallisesti.
- **[LandUse.ExistingLandUse.AgriculturalArea.gpkg · 2025](https://download.inspire.ruokavirasto-awsa.com/data/2025/LandUse.ExistingLandUse.AgriculturalArea.gpkg) — Ruokavirasto.** Suora vuoden 2025 koko maan GeoPackage-lataus julkaisijan sivulta. CC BY 4.0; ei ladattu paikallisesti.

## Palveluhakemiston lähdesivut

- [Digiroad / Fintraffic](https://www.fintraffic.fi/fi/digitaalisetpalvelut-16)
- [Espoo](https://www.espoo.fi/fi/paikkatiedon-avoin-data)
- [GTK](https://www.gtk.fi/palvelut/aineistot-ja-verkkopalvelut/rajapintapalvelut/)
- [HSY](https://hri.fi/fi/ohjeet/datan-hyodyntajalle/paikkatiedon-hyodyntaminen/)
- [Helsinki](https://www.hel.fi/fi/paatoksenteko-ja-hallinto/tietoa-helsingista/kartat-ja-paikkatieto/paikkatiedot-tehokayttoon/avoimet-paikkatiedot)
- [Kauniainen](https://hri.fi/fi/ohjeet/datan-hyodyntajalle/paikkatiedon-hyodyntaminen/)
- [Maanmittauslaitos](https://www.maanmittauslaitos.fi/kartat-ja-paikkatieto/aineistot-ja-rajapinnat/karttojen-rajapintapalvelut/inspire-katselupalvelut)
- [Metsäkeskus](https://www.metsakeskus.fi/fi/avoin-metsa-ja-luontotieto/aineistot-paikkatieto-ohjelmille/rajapinnat)
- [Ruokavirasto](https://www.ruokavirasto.fi/tietoa-meista/julkaistut-tietoaineistot/paikkatietoaineistot/)
- [Syke](https://www.syke.fi/fi/ymparistotieto/avoimet-rajapinnat/paikkatietorajapinnat)
- [Syke satelliittihavainnot](https://www.syke.fi/fi/ymparistotieto/avoimet-rajapinnat/satelliittihavaintojen-rajapinnat)
- [Tilastokeskus Paavo](https://stat.fi/fi/palvelut/tilastodatapalvelut/paikkatietoaineistot/postinumeroalueittainen-paikkatieto-paavo)
- [Tilastokeskus aluejaot](https://stat.fi/fi/palvelut/tilastodatapalvelut/paikkatietoaineistot/tilastointialueet/kuntapohjaiset-tilastointialueet)
- [Tilastokeskus kaikki teemat](https://stat.fi/en/services/statistical-data-services/open-data-and-interfaces/interface-use-of-geographic-data)
- [Traficom](https://www.traficom.fi/fi/liikennejarjestelma/paikkatietoaineistot/rajapinnat)
- [Vantaa](https://hri.fi/fi/ohjeet/datan-hyodyntajalle/paikkatiedon-hyodyntaminen/)

## Tarkistukset

Paikalliset WFS-lataukset tarkistettiin vertaamalla saatuja kohdemääriä palvelun `numberMatched`-lukuihin. Tallennetut tasot avattiin GDAL/OGR:llä ja QGISin kirjastoilla. QGIS-projektista tuotettiin oletusnäkymän karttakuva. Verkkoaineistojen tasoluettelot ja projektin valittujen WMS-tasojen yhteydet tarkistettiin. Erillinen `tarkistukset.json` sisältää lopullisten tiedostojen tarkistustulokset. QGISin käyttöliittymän kaikkia toimintoja tai jokaista verkkotasoa ei ole testattu.

Avoin kartta-aineisto on käyttötarkoitukseensa suhteutettava lähtötieto; se ei korvaa maanmittausta tai oikeudellisten rajojen varmistamista.

Lopputarkistus: **38/38 QGIS-projektin tasoa avautui** (8 paikallista ja 30 WMS-tasoa). Paikallisten geometrioiden tarkistus: **0 tyhjää, 0 virheellistä geometriaa**. Selainhaun kokeilu `pohjavesi` palautti 10 tulosta.
