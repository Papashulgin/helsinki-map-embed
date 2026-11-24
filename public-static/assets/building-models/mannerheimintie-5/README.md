# Uusi ylioppilastalo, Mannerheimintie 5

Muokattava 3D-luonnos käyttää nykyisen rakennuksen rekisteripohjaa, käyttäjän toimittamaa valokuvaa, Ylvan nykykuvia sekä Helsingin kaupunginmuseon kupolitornin selvitystä. Edellinen Stockmann / ABC City -julkisivutulkinta on korvattu, koska valokuva tunnistaa osoitteen Uudeksi ylioppilastaloksi.

## Avaa tai lataa

- mannerheimintie-5.glb — selain- ja 3D-katselu
- mannerheimintie-5.obj ja .mtl — 3D/CAD-tuonti
- mannerheimintie-5.blend — muokattava Blender-projekti
- mannerheimintie-5-preview.png — esikatselurenderöinti
- viewer.html — pyöritettävä selainkatselu ja lähdeviitteet sijoittelusta, katoista ja tornista
- model-metadata.json — lähteet, tunnisteet, koordinaatisto ja mallin rajat
- source-footprint.json — alkuperäinen rakennusrekisterin polygon ja ominaisuudet
- archive-previews/mansku5-photo.jpeg — käyttäjän toimittama valokuva

## Geometria ja lähteet

- Rakennus: Uusi ylioppilastalo (ent. Osakuntatalo), Mannerheimintie 5.
- Rakennuskortin tunnisteet: RATU 391, VTJ-PRT 103036835V.
- Jalanjälki: Helsingin rakennusrekisterin WFS-kohde Rakennukset_alue_rekisteritiedot.81772, EPSG:3879; alkuperäisessä polygonissa 121 pistettä, mallin yksinkertaistetussa polygonissa 52 pistettä.
- Rekisterin kerrosmäärä: 8. Rungon 24,8 m korkeus on arvio, noin 3,1 m kerrosta kohti.
- Tornikupolin 4,3 m kaulan ja puolipallon mitat sekä lanternin 2/3-suhde tulevat [Helsingin kaupunginmuseon 2020 kupolitorni-selvityksestä](https://www.hel.fi/static/liitteet/museo/Lausunnot%202020/HKM%20Uusi%20ylioppilastalo%20torni.pdf). Kokonaiskorkeus ja kupolitornin tarkka sijoitus footprintille ovat edelleen arvioita.
- [Finnish Architecture](https://www.finnisharchitecture.fi/projects/new-student-house) ja [Helsingin yliopiston arkkitehtuurikävely](https://www.avoin.helsinki.fi/oppimateriaalit/taidehistoria/virtuaali/uusi_yo.shtml) kuvaavat Mannerheimintien suuntaisen katuosan, tontin sisäosan/Ylioppilasaukion puoleisen siiven, niiden liittymässä olevan tornin sekä aukion puoleisen päätyaiheen.
- [Ylvan ilmakuvassa](https://ylva.fi/media/uusi-ylioppilastalo-7-scaled.jpg) näkyy pitkän katuosan kuparinen harjakatto dormereineen ja aukion puolen erillinen päätysiipi. Pitkän katon harja on nyt käännetty seuraamaan WFS-pohjassa näkyvää pitkää vinoa akselia. Siipien alapuolinen täyttö on matala, saumoitettu kattokenttä, ei mittatarkka liittymäratkaisu.
- [Helsingin 3D-kaupunkimallissa](https://www.hel.fi/fi/paatoksenteko-ja-hallinto/tietoa-helsingista/kartat-ja-paikkatieto/helsinki-3d) LoD2-rakennuksiin kuuluu kattomuodot. RATU 391:n ladattu kattogeometria kattoi vain osan rakennuksen jalanjäljestä, joten sitä käytettiin tarkistukseen eikä koko katon korvaavaksi malliksi.
- Kattomassat, siipien liittymät, harjakorkeudet, dormerien paikat ja kattokulmat ovat edelleen valokuvista arvioituja; koko katon mittapiirustusta ei löytynyt.
- Kupolitornin tasokoordinaattipaikka on sovitettu WFS-pohjan pyöristettyyn kulmaan; tornin tarkka keskipiste ja korkeusperusta ovat arvioita. Käyttäjän valokuvassa näkyvä pääty, ikkunarytmi, sisäänkäynti ja veistokset ovat edelleen visuaalisia tulkintoja.
- Vuoden 1885 Yksa-tietue kattaa osoitealueen Mannerheimintie 1–5 / entisen Aleksanterinkatu 25; sitä ei ole tulkittu yksin numeron 5 nykyiseksi julkisivupiirustukseksi.
- Stockmann / ABC City -arkistokuvia ei käytetty rakennuksen tunnistukseen tai mallin geometriaan. Niiden mahdollinen osoite- ja paikkayhteys on tarkistamatta.

## Mallin rajat

Tämä on visuaalinen luonnos, ei varmennettu nykytilan as-built-, LOD3- tai BIM-malli. Malli ei sovellu rakennesuunnitteluun, telinemitoitukseen eikä lupakäyttöön ilman mittauksia ja tarkistettuja lähtöpiirustuksia. Käyttäjän toimittaman valokuvan lisenssiä ei erikseen määritelty; tiedosto on säilytetty tätä paikallista projektia varten.

Generoi Blenderillä: blender -b --python scripts/build-mannerheimintie-5-model.py
