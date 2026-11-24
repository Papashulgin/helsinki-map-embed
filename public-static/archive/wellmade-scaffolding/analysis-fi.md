# Wellmade-luettelon analyysi

## Asiakirja

Luettelo esittelee Wellmade-järjestelmätelineitä ja teräsosia. Tiedosto on 28 vaakasuuntaista PDF-sivua; sivuilla on tavallisesti kaksi painettua sivua vierekkäin, joten painettu sivunumerointi ulottuu 1–53. PDF:n metatiedot ilmoittavat luontipäiväksi 14.11.2014 ja muokkauspäiväksi 22.5.2018. Toimittajan PDF-linkistä haetun tiedoston SHA-256 vastaa käyttäjän tiedoston tarkistussummaa.

Sisällysluettelossa luetellaan Ringlock, Cuplock, Kwikstage, Quicklock, Tubelock, useita kehätelinetyyppejä, Multi-Crab, putket ja liittimet, terästuet, lavat ja muottitarvikkeet. Luettelon kattavuus on siis laajempi kuin vain ringlock.

## Ringlock-osat ja luettelomitat

Painetuilla sivuilla 2–5 esitetään seuraavat mitat:

- **Pysty (Standard):** kuumasinkitty putki Ø48,3 × 3,2 mm, spigot-liitos. Kaikki seitsemän pituusvaihtoehtoa (0,50; 1,00; 1,50; 2,00; 2,50; 3,00 ja 4,00 m) on mallinnettu erillisinä 3D-pystyinä. Taulukossa vastaavat massat 3,19; 5,66; 8,07; 10,45; 12,87; 15,29 ja 20,11 kg.
- **Vaakajuoksu (Ledger):** kuumasinkitty putki Ø48,3 × 3,0 mm. Pituudet 0,65; 0,88; 0,92; 1,07; 1,15; 1,57; 1,83; 2,13; 2,44 ja 3,05 m. Taulukon massat ovat vastaavasti 3,14; 3,93; 4,09; 4,68; 4,95; 6,47; 7,40; 8,49; 9,61 ja 11,83 kg.
- **Diagonaali:** putki Ø48,3 × 2,5 mm. Luettelo sanoo nousun olevan kaikissa standardeissa 2 m ja antaa kenttäpituuden, vinotuen nimellispituuden sekä massan. Kaikki kymmenen variaatiota (WRB065–WRB305) on nyt mallinnettu 3D:nä; kenttä-, tukipituus- ja massatiedot löytyvät `models/diagonal-lengths.html`-sivulta.
- **Välipoikittaisjuoksu (Intermediate Transom):** putki Ø48,3 × 3,0 mm; pituudet 1,15; 1,57; 2,13 ja 3,05 m.
- **Pohjakaulus:** 0,24 m ja 1,53 kg. Luettelo esittää kuusi ruusukeversiota (WRR1–WRR6), yhden juoksupään (WRLH1) sekä diagonaalipään (WRBH1), mutta ei niiden mittapiirroksia.
- **Portaat:** Cuplock Stairway WCSW1–3, nousu 2,00 m ja etenemä 2,14 / 2,44 / 2,50 m; settiin kuuluvat katalogin mukaan askelmat ja kaksi sivupalkkia. Kwikstage Staircases WSKSC600 ja WSKSC900 ilmoitetaan mitoilla 2 500 × 2 000 × 600 / 900 mm. Katalogi ei kerro askelmien määrää tai nousukorkeutta. Näistä viidestä variantista tehty 3D-malli käyttää havainnollistavaa 12 askelmaa, jolloin nousu on 166,7 mm; Cuplock-porrasleveydeksi on oletettu 600 mm, sillä sitä ei ole mitoitettu.
- **Steel Plank:** luettelossa mainittu C-profiilinen teräslava on 241 mm leveä, 67,5 mm korkea ja 1,8 mm paksu; pituusvaihtoehdot 1,15; 1,57; 2,13 ja 3,05 m.

Nämä ovat valmistajan luettelotaulukon tuote- ja nimellismittoja. Se ei kerro yksiselitteisesti, ovatko juoksun pituudet päiden keskilinjojen välejä, putkirungon pituuksia vai kokonaismittoja. Tarkkoja ulkomittoja tai ruusukkeen 3D-geometriaa ei voi päätellä taulukosta.

## Taulukoiden tarkistus

Diagonaalin taulukon pituuksia ei pidä suoraan käsitellä ideaalisen suorakulmaisen kentän päätepisteiden etäisyytenä. Kaikille kymmenelle variantille on tehty havainnollistava 3D-malli kenttäleveydellä ja 2 000 mm nousulla; mallit ja valmistajan ilmoittamat tukipituudet ovat eri tietoja. Esimerkiksi 2,44 m kenttä ja 2,00 m nousu antaisivat Pythagoraan kaavalla noin 3,154 m, kun luettelo ilmoittaa diagonaalille 3,07 m. Tämä voi johtua mittaperusteesta tai liitosgeometriasta; luettelo ei määrittele päätepisteitä. Käytä tuotekoodia valinnassa, älä korvaa sitä tällä yksinkertaisella geometriapituudella.

Taulukossa on myös vähintään yksi massa-/yksikkömuunnoksen poikkeama: pystyosan WRS400 arvoksi ilmoitetaan 20,11 kg ja 42,24 lb. Nämä eivät muunnu toisikseen (20,11 kg ≈ 44,33 lb). Painoarvo kannattaa varmistaa valmistajalta ennen määrälaskennan tai hankinnan lukitsemista.

## Telineen 3D-malliin soveltaminen

Pystyputken rungon parametrit voidaan mallintaa onttona lieriönä. Ringlock-juoksun perusrunko on samoin Ø48,3 × 3,0 mm putki; kaikki kymmenen luettelopituutta (0,65–3,05 m) on mallinnettu samalla parametrisoidulla juoksupäägeometrialla; lisäksi mukana on nykyisen tuotesivun 3,07 m keskilinjavariantti. Mallissa liitosdatumeiden väli on 2 440 tai 3 050 mm; yksinkertaistettujen päiden kanssa ulkopuolinen pituus on 2 446 tai 3 056 mm ja mallin suurin päävaippa 62 × 125 mm. Nämä päämitat kuvaavat vain tätä havainnollistavaa mallia. Juoksupäät, kaulus ja kiilapala on mallinnettu yksinkertaistettuina muotoina, koska luettelo ei anna niille tarkkoja mittoja.

Jos mallia käytetään vain tilavarauksen, visualisoinnin tai alustavan osamäärän perustana, perusrunko on hyödyllinen. Valmistukseen, asennusyhteensopivuuteen tai rakenteen kantavuuteen tarvitaan valmistajan CAD-/mittapiirros, todelliset osatiedot ja erillinen kohdekohtainen suunnittelu.

## Käyttäjän lisäpiirustukset ja nykyiset tuotetiedot

Käyttäjän toimittama juoksupään piirustus täsmentää valupään envelopea ja useita leikkaus-/aukkomittoja (mm. 70,5 mm, 55,7 mm, 56 mm, Ø21,8 mm, Ø33+0,2 mm ja 6,5 × 11 mm kiilaosa). Erillinen B–B-kuva sisältää lisäksi mm. 39,5±0,2, 27±0,1, 45,0, 51,5 ja 56 mm mittoja. Piirustusten kuvaprojektiot eivät kuitenkaan määritä jokaista valun sädettä, hitsauskohtaa tai kaikkia datumeita. Mallin päägeometria käyttää näitä näkyviä ulkomittoja mutta rekonstruoi välissä olevia valupintoja.

Nykyinen Wellmade O-ledger -sivu määrittelee 3,07 m:n pituuden pystyjen keskilinjojen väliseksi mitaksi. Liitteen vanhempi katalogi esittää 3,05 m:n nimellispituuden eri taulukossa; se on säilytetty historiallisena varianttina. Päivitetty mallijuoksu on 3,07 m:n WRL307, joten sitä voi käyttää käyttäjän aiempaan 3,07 m:n kenttähavaintoon viittaavana geometriana.

Pystymallien tiedot tulevat katalogin Ø48,3 × 3,2 mm putkesta, kaikista seitsemästä katalogipituudesta sekä 500 mm:n ruusukejaosta. Nykyinen ruusukesivu ilmoittaa ulkohalkaisijaksi 122–124 mm ja paksuudeksi 8–10 mm; mallissa valittiin Ø123 × 9 mm. Kuvan ruusukkeen kahdeksan aukon muodot eivät ole tuotekohtaisesti mitoitettuja, ja pystyspigotin sovite- ja ulostulomitat puuttuvat toimitetuista piirustuksista.

Säätöjalan käyttäjäpiirros ilmoittaa 760 mm, 660 mm:n viitemitan, Ø38 × 4 mm putken ja 150 × 150 × 6 mm pohjalevyn. 660 mm -mittaviivan täsmällinen päätepiste ei erotu. Mallissa mutteri asetetaan 660 mm:n viitekohtaan, eikä tätä väitetä 660 mm:n säätövaraksi. Valmistajan nykyinen verkkosivu kertoo eräälle Quickstage R/O -mallille 760 mm kokonaispituuden ja 610 mm maksimi­säädön; kyse voi olla eri variantista. 4 TPI / 6,35 mm kierteen nousu on toinen nykyisellä tuotesivulla ilmoitettu vaihtoehto ja sitä käytetään havainnollistavassa mallissa.


## Kaikkien juoksupituuksien 3D-viennit

`models/ledger-lengths.html` kokoaa erilliset STL-tiedostot, esikatselun ja Blender/GLB-koosteet. Kymmenen luettelopituutta ovat 650, 880, 920, 1 070, 1 150, 1 570, 1 830, 2 130, 2 440 ja 3 050 mm. Nykyinen WRL307 3 070 mm on erillinen lisävariantti. Vanhan taulukon massat ovat taulukossa alla; 3 070 mm:n massaa ei annettu tässä aineistossa. Juoksun nimellispituuden päätepisteitä ei vanhassa luettelossa määritellä, joten vanhat pituudet on viety mallinnuksen nimellismittoina, ei vahvistettuina keskilinjamittoina.


Kaikkien pystyjen STL-, Blender- ja GLB-tiedostot sekä katalogimassat löytyvät sivulta `models/standard-lengths.html`. 4 m pystyyn tulee samalla jaolla kahdeksan ruusuketta.


PDF:n diagonaalitaulukon kaikkien mallien erilliset STL:t ja koosteet ovat sivulla `models/diagonal-lengths.html`. Mallien geometrinen putken keskilinja on kenttäleveyden ja 2 000 mm nousun hypotenuusa. PDF:n Brace Length on tästä lyhyempi 32,6–87,3 mm; päätyliittimien mittadatumia ei anneta, joten erotuksen syytä ei voi ratkaista tästä aineistosta.


Porrasmallien viiden variantin detalji-, lähdemassa- ja oletustaulukko on `models/stair-rises.html`-sivulla. Kwikstage-katalogi listaa erillisen Staircase Handrails -osan (WSKSCH, 10,77 kg), mutta ei sen mittapiirrosta; kaidetta ei siksi ole mallinnettu tähän porraslentokoosteeseen.
