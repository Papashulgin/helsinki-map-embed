# Telinekonttori: palveluympäristö ja käyttöönottorajat

## Nykyinen ympäristö

Tämä checkout toimii paikallisena kehitys- ja yksittäisen käyttäjän työtilana. `server.js` kuuntelee oletuksena vain `127.0.0.1:3400`; `start-local.sh` käynnistää saman paikallisen Node-palvelun. Paikalliset SQLite-tietokannat ovat `.local-data/telinehallinta.sqlite` (CRM) ja `.local-data/scaffold-projects.sqlite` (telineprojektit ja karttamerkit). Palvelinpalvelimen muuttaminen julkisesti kuuntelevaksi ei tee sovelluksesta tiimikäyttöön sopivaa.

Paikalliset API-reitit torjuvat muun kuin loopback-yhteyden. Tämä ei ole kirjautuminen: palvelussa ei ole käyttäjätiliä, istuntoa, yritysrajaa, palvelinpuolen roolivaltuutusta eikä projektikohtaista käyttöoikeutta. Tarkastusmerkintään syötetty nimi ei varmista henkilöllisyyttä tai pätevyyttä. Älä julkaise palvelinta Internetiin äläkä käytä tätä kopiota operatiivisten telinepäätösten ainoana lähteenä.

## Tiimikäytön tavoiteroolit

Nämä roolit ovat palvelun vaatimusmäärittely, eivät vielä sovelluksessa valvottuja oikeuksia.

| Rooli | Tavoiteltu oikeus |
| --- | --- |
| Omistaja / järjestelmän ylläpitäjä | Käyttäjät, roolit, asetukset, varmistukset ja julkaisutila |
| Tarjouslaskija / suunnittelija | Projektin lähtötietojen ja kustannusrivien muokkaus, mallin ja luonnosten vienti |
| Tekninen tarkastaja | Lähteiden, geometrian ja BOMin tarkistus sekä tarkastuspäätöksen kirjaus; ei oman työnsä yksin tekemä hyväksyntä |
| Työmaan vastuuhenkilö | Vain hyväksyttyjen revisioiden katselu ja työmaaviestintä |
| Auditoija / tilaaja | Lukuoikeus projektiin, lähteisiin, revisiohistoriaan ja vientitiedostoihin |

Ennen tiimikäyttöä tunnistus pitää kytkeä esimerkiksi yrityksen OIDC/SSO-palveluun. Jokainen API-reitti tarvitsee palvelinpuolen roolitarkistuksen sekä projektikohtaisen käyttöoikeuden. Tarkastuspäätös tulee sitoa tunnistettuun henkilöön, aikaleimaan ja tarkastettuun revisioon. Tietokannan rivit eivät yksinään toteuta näitä oikeuksia.

## Varmuuskopiointi

Varmista, että paikallinen palvelu on käynnissä tai tietokannat ovat muuten saatavilla. Luo SQLite-konsistentti varmuuskopio:

```sh
node scripts/backup-local-data.js
```

Komento luo aikaleimatun kansion `.local-backups/`-hakemistoon. Vaihtoehtoisesti anna kohdehakemisto:

```sh
node scripts/backup-local-data.js /suojattu/polku/telinehallinta-backup-2026-10-27
```

Varmistus sisältää CRM- ja telineprojektien SQLite-tietokannat sekä `manifest.json`-tiedoston, SHA-256-tarkistussummat ja SQLite-eheystarkistuksen. Käyttäjän paikalliset API-avaimet ja niiden salausavain eivät sisälly varmistukseen. Säilytä mahdollinen salaisuusvarasto erillisessä salatussa varmistuspaikassa; älä kopioi `.local-secrets/`-hakemistoa suojaamattomaan pilvikansioon.

## Palautus

Pysäytä ensin `start-local.sh` / `server.js` ja varmista, ettei prosessi käytä tietokantoja. Palautus vaatii tarkoituksella `--confirm`-valinnan:

```sh
node scripts/restore-local-data.js /suojattu/polku/telinehallinta-backup-2026-10-27 --confirm
```

Ennen vaihtoa palautusskripti tarkistaa manifestin, SHA-256-summat ja SQLite-eheyden. Jos nykyiset tietokannat löytyvät, se ottaa niistä automaattisesti `pre-restore-*`-varmistuksen `.local-backups/`-hakemistoon. Palauta aina ensin erilliseen testikansioon ja varmista projektit, revisiot, karttamerkit sekä CRM-rivit ennen työtilan avaamista.

## Lokitus, päivitykset ja palautusprosessi

Nykyinen toteutus kirjaa palvelinvirheet prosessin konsoliin. Siinä ei ole keskitettyä lokipalvelua, lokien säilytysaikaa, käyttäjän tunnistavaa audit-lokia, hälytyksiä, tietokannan automaattista poisvientiä tai palautusharjoitusten aikataulua. Telineprojektin revisiohistoria ja paikallinen tarkastuskirjaus ovat sisältötason jäljitettävyyttä, eivät käyttäjän toimien suojaamaton audit trail.

Paikallisen version päivitys:

1. Tarkista lähdekoodin revisio ja Node.js-vaatimus (18+).
2. Ota `node scripts/backup-local-data.js` -varmistus ennen muutoksia.
3. Pysäytä palvelu, päivitä lähdekoodi ja asenna lukitun riippuvuusluettelon mukaisesti `npm ci`.
4. Aja `npm test` ja tarkista kehityspalvelu selaimessa ennen varsinaisen työtilan avaamista.
5. Jos tarkistukset epäonnistuvat, palauta viimeisin varmistus yllä kuvatulla palautuskomennolla.

Tiimipalvelun käyttöönotto vaatii lisäksi ylläpidetyn palvelimen, TLS:n, tunnistuksen ja roolit, salaisuuksien hallinnan, valvotun varmuuskopiointiaikataulun, palautusharjoituksen, auditoinnin, hälytykset, päivitys- ja rollback-menettelyn sekä sovitun tietojen säilytysajan. Näitä ei saa merkitä valmiiksi pelkän paikallisen kehityspalvelimen perusteella.

## Käyttöturvallisuus ja hyväksyntäraja

Telineen piirros, pinta-ala, osamäärä ja hinta ovat erillisiä tuloksia. HAKI Universal -perusresepti ei ratkaise ankkurointia, alustan kantavuutta, diagonaalijäykistystä, päätyjen reunasuojausta, kuormia, tuulta tai vakavuutta. Palveluun kirjattu tarkastus tai PDF/SVG-vienti ei ole rakenteellinen mitoitus eikä asennuslupa. Käytä vain pätevän suunnittelijan hyväksymää revisiota työmaapäätöksiin.
