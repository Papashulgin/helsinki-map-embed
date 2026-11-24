# 3D-osien mittaperusteet

## Juoksu: WRL307

**Lähteestä ilmoitetut mitat:** nykyinen Wellmade Ringlock O-ledger -sivu määrittelee pituuden pystyjen keskilinjojen väliseksi mitaksi ja luettelee 3,07 m:n juoksun. Putken ulkohalkaisija on 48,3 mm ja tavallinen seinämäpaksuus 3,0 mm. Näin mallin akseliväli on 3 070 mm, putken sisähalkaisija ideaalisen tasaseinämäisen rungon laskennassa on 42,3 mm.

**Juoksupää:** käyttäjän toimittamasta mittapiirroksesta on luettavissa muun muassa 70,5 mm, 55,7 mm, 56 mm, Ø21,8 mm, Ø33+0,2 mm, kiilan 6,5 mm ja 11 mm leikkausmitat sekä noin 45 mm korkeus. Mallin pääkappaleen envelope on 55,7 × 70,5 × 56 mm; poraus ja rengasbossi käyttävät Ø21,8/Ø33,2 mm -arvoja. Kuvan projektiot eivät yksin määritä kaikkia muotoja, säteitä, hitsauskohtaa tai mittadatumin suuntaa. Mallin pää on siksi piirustuksen mitallinen envelope ja muodon rekonstruktio, ei valukappaleen valmistus-CAD.

Sama päätopologia skaalautuu kaikille arkiston juoksupituuksille. Mallissa putkirunko päättyy päiden envelopeen. Pituus 3 070 mm viittaa päiden liitosdatumeihin/pystylinjoihin valmistajan tuotetiedon mukaisesti; pään kuvassa ei ole mittaa, joka poistaisi liitosdatumin tulkinnan.

## Pysty: WRS200

**Lähteestä ilmoitetut mitat:** standardin nimellispituus 2 000 mm, putki Ø48,3 × 3,2 mm. Kaikki katalogin pystyvariantit 500–4 000 mm mallinnetaan 500 mm:n toistolla; ruusukekeskipisteet ovat z=250 mm + 500n mm (n=0…L/500−1). WRS200:ssa keskipisteet ovat 250, 750, 1 250 ja 1 750 mm. Valmistajan ruusuketiedoissa halkaisija on 122–124 mm, paksuus 8–10 mm ja keskusaukko sovitettu Ø48 mm putkelle. Mallissa valittiin keskiväliarvot Ø123 × 9 mm.

Ruusukkeen kahdeksan reikää on kuvattu mallissa samansuuruisina säteittäisinä aukkoina. Todelliset aukkomuodot vaihtelevat ruusukemallin mukaan; käyttäjän selainkuvassa on kuusi erilaista ruusuketta. Pystyn päässä ei ole mallinnettua spigottia: toimitetut kuvat eivät anna sen sovitehalkaisijaa, ulostuloa tai sijaintidatumeita yksiselitteisesti. Tämä on pystyputken rungon ja ruusukejaon malli.

## Säätöjalka: OD38 × 4, L=760

**Käyttäjän toimittamasta piirroksesta:** kokonaispituus 760 mm, 660 mm:n viitemitta, putkimerkintä Ø38 × 4 mm sekä pohjalevy 150 × 150 × 6 mm. 660 mm:n mittaviivan mittapäätä ei voi lukea varmasti. Mallissa mutterikeskikohta sijoitettiin z=660 mm:iin; sitä ei tulkita 660 mm:n todistetuksi säätöliikkeeksi.

**Täydennys valmistajan tämänhetkisestä tuotesivusta:** Ø38 × 4 mm:n 4 TPI -vaihtoehdossa kierteen nousu on 6,35 mm. Sivulla esiintyy myös 760 mm kokonaismittaisia Quickstage R/O -jalkoja, joiden suurin säätö on 610 mm. Se ei todista, että käyttäjän piirros on sama tuoteversio. Mallin kierteen nousu 6,35 mm on valittu tämän valmistajan vaihtoehdon mukaan; jalka- ja mutteripään muoto sekä kahvojen mitat ovat havainnollistavia.

## Tiedostojen yksiköt

Blender-koosteen scene-unit on millimetri (Blenderin `scale_length=0.001` metriyksiköillä). STL-tiedostojen koordinaatit ovat raakoja millimetriarvoja. GLB:ssä on kaikki kolme osaa erillisissä paikkaryhmissä. Yksittäiset STL:t on siirretty omaan origoon. Mallit on tarkoitettu geometrian ja mittojen hahmottamiseen; ne eivät vahvista osien keskinäistä yhteensopivuutta, valmistettavuutta, kuormituskestävyyttä tai telineen turvallisuutta.


## Pituusvariantit

Vanhan luettelon kymmenen juoksupituutta mallinnetaan saman juoksupäägeometrian kanssa millimetrimittoina: 650, 880, 920, 1 070, 1 150, 1 570, 1 830, 2 130, 2 440 ja 3 050 mm. Lisäksi 3 070 mm WRL307 on oma varianttinsa. Vain 3 070 mm:n nykyinen tuotesivu määrittää mittadatuminsa pystylinjojen keskilinjojen väliksi. Vanhan PDF:n muut pituudet ovat katalogin nimellismittoja, joiden päätepisteiden määritelmää ei ole annettu. Katso tiedostoluettelo `models/ledger-lengths.html`.


## Kaikki pystyvariantit

Katalogin pituudet 500, 1 000, 1 500, 2 000, 2 500, 3 000 ja 4 000 mm on mallinnettu erillisinä STL-tiedostoina sekä yhteisenä Blender-/GLB-koosteena. Ruusukkeet ovat 500 mm:n jaolla, ensimmäinen 250 mm alapäästä. Luettelon massat ja lataukset ovat `models/standard-lengths.html`-sivulla. Pystyputken päät on jätetty suoriksi päiksi, sillä toimitetuissa piirustuksissa ei ole spigot-liitoksen sovitehalkaisijaa, pituutta tai kiinnitysmittaa.


## Diagonaalit WRB065–WRB305

Kymmenen katalogikoodin diagonaalit on mallinnettu kentän pystytasoon siten, että päätepisteiden ero on katalogin Bay Length ja 2 000 mm nousu. Putki on Ø48,3 × 2,5 mm. Geometrinen keskilinjan pituus lasketaan kaavalla `sqrt(bay_mm² + 2000²)`. PDF:n Brace Length on näitä arvoja 32,6–87,3 mm lyhyempi. Koska luettelo ei mittaa päätyliittimien datumia eikä toimittanut diagonaalin mittapiirrosta, malli ei väitä selvittävänsä tätä eroa: päätypalat ovat vain visuaaliset paikkamerkit. Katalogin brace length, bay length ja massa on talletettu `metadata.json`-tiedostoon ja esitetty `models/diagonal-lengths.html`-sivulla.


## Porraslennot ja askelnousu

PDF:n Cuplock WCSW1–WCSW3 -porraslennot ilmoittavat kokonaisetenemän 2 140, 2 440 ja 2 500 mm sekä 2 000 mm nousun. Kwikstage WSKSC600/900 ilmoittaa 2 500 × 2 000 × 600/900 mm. Lähde ei määritä askelmäärää, askelmaprofiilia, sivupalkin profiilia tai Cuplock-lennon leveyttä. Havainnollistavissa 3D-tiedostoissa on siksi 12 askelmaa (nousu 166,7 mm) ja Cuplock-leveytenä oletettu 600 mm; Kwikstage-leveydet ovat luettelon 600 ja 900 mm. Kaiderakenne ja liitosyksityiskohdat puuttuvat. Lähdemitat, katalogimassat, vaakajaot ja STL-lataukset ovat `models/stair-rises.html`-sivulla.
