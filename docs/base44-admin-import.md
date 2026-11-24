# Base44 ScaffoldAnalysis admin -tuonti

Telinekartta & piirustus -näkymässä on vain luku -tuonti Base44-sovelluksen admin-tiedoille. Annettu `/ScaffoldAnalysis`-sivu ohjaa kirjautumiseen, joten selainosoite ei ole JSON-rajapinta. Luo Base44-sovellukseen oma backend-vientifunktio ja käytä sen HTTPS-osoitetta tuontilomakkeessa.

## Tietoturva ja rajat

- Paikallinen palvelin kutsuu vain `finnish-construction-compliance-sui-5106cde5.base44.app`-alkuperää ja sen `/api/...`-polkuja. Uudelleenohjaukset kirjautumiseen hylätään.
- Tallenna tuontiavain paikalliseen Asetukset → API keys -holviin nimellä `Base44 Scaffold Admin API`. Älä liitä avainta URL:iin tai chattiin.
- Base44-vientifunktion pitää tarkistaa Bearer-avain ja tehdä admin/service-role-luku Base44:n omassa backendissä. Älä paljasta service-role-avainta selaimelle tai siirrä sitä paikalliseen palvelimeen.
- Tuonti on vain luku. Se ei muuta Base44-tietoja. Tuodut vedokset tallentuvat nykyisen selaimen paikalliseen työtilaan; ne eivät synkronoidu laitteiden välillä.
- Palvelin hyväksyy enintään 10 Mt JSON-vastauksen ja odottaa enintään 20 sekuntia. Selainvedos rajataan 3 Mt:uun, jotta paikallisen selaintallennuksen tila ei täyty yhdellä tuonnilla.

Base44:n virallisen SDK-dokumentaation mukaan ulkoinen sovellus voi käyttää SDK:ta ja käyttäjäautentikointia, mutta service-role-käyttö kuuluu Base44:n omaan backend-ympäristöön: [Base44 Client](https://docs.base44.com/developers/references/sdk/getting-started/client).

## Vastaussopimus

Palauta JSON-objekti. Ylimääräisiä lähdekenttiä voi sisällyttää kuhunkin tietueeseen, koska näkymä säilyttää ja näyttää tietueen koko JSON-sisällön.

```json
{
  "schemaVersion": "1",
  "views": [
    { "name": "ScaffoldAnalysis", "title": "Telineanalyysi", "route": "/ScaffoldAnalysis" }
  ],
  "analyses": [],
  "materials": [],
  "components": []
}
```

Kaikki neljä listaa ovat valinnaisia, mutta niiden pitää olla taulukoita. `analyses`-rivin tunnistamiseen näkymä käyttää ensin `projectName`, `name`, `title` tai `id` -kenttää. `views`-kortti näyttää `title`, `name`, `label`, `description`, `route` ja `path` -kentät. Materiaali- ja komponenttirivit esitetään luettavina tietueina.

## Käyttöönotto

1. Luo Base44:ssä backend-funktio, joka hyväksyy vain tämän sovelluksen tuontiavaimen, lukee tarvittavat admin-tietueet service role -oikeudella ja palauttaa yllä olevan JSON-rakenteen.
2. Ota funktion HTTPS `/api/...`-osoite talteen.
3. Lisää API-avain paikallisen TelineHallinnan asetuksiin nimellä `Base44 Scaffold Admin API`.
4. Avaa Telinekartta & piirustus, liitä funktion URL ja valitse **Tuo admin-tiedot**.

Base44:n todellisia entity-nimiä tai kenttiä ei päätellä pelkän kirjautumissivun perusteella. Vientifunktio pitää sovittaa sovelluksen todelliseen tietomalliin Base44:n hallintanäkymässä.
