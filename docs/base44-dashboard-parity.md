# Base44 Dashboard -vastaavuus TelineHallinnassa

Kartoitus perustuu Base44-sovelluksen `/Dashboard`-näkymään ja sen neljään välilehteen. TelineHallinnan nykyiset moduulit ja Helsinki GIS -työkalut säilyvät mukana; Dashboardiin ei lisätä Base44ssa näkyviä uusia päämoduuleja.

## Välilehdet

| Base44 | TelineHallinnan vastaavuus | Tietolähde ja rajaus |
|---|---|---|
| Yleiskatsaus | Dashboard | Työmaat, tehtävät, työajat ja pätevyydet. Helsingin työmaakartta sekä nykyiset tehtävä- ja työaikapolut säilyvät. Laskutusta ei ole paikallisessa tietomallissa. |
| Tiimit | Työmaakohtaiset vastuut | Näyttää työmaan tehtäviin kirjatut vastuuhenkilöt, tehtävät ja paikalliset työaikakirjaukset. Paikallisessa työtilassa ei ole erillistä tiimijäsenrekisteriä. |
| Analytiikka | Työaika- ja tehtäväanalytiikka | Tehtävätilat, työmaiden valmistumisaste, viimeisen viikon tunnit sekä työmaasuodatin. Raportin voi ladata CSV:nä. Kaluston käyttöastetta ja ylityöerittelyä ei näytetä ilman lähdedataa. |
| Riskianalyysi | Sääntöpohjainen riskiyhteenveto | Vanhentuneet tai pian vanhenevat pätevyydet sekä myöhässä olevat avoimet tehtävät. Pisteytys ja viivästyspäivät johdetaan näistä riveistä. Kustannusarvio ja ennustava tekoälyanalyysi eivät ole käytössä. |

## Nykyiset valikkoryhmät

Base44n Dashboardin sivupalkissa näkyvät Yleiskuva, Myynti ja CRM, Työmaat ja suunnittelu, Operointi, Talous, Turvallisuus ja vaatimustenmukaisuus, Hallinta sekä Lisää työkaluja. TelineHallinnan olemassa olevat moduulit kattavat osia näistä: tehtävät, kalenteri, työajanseuranta, sertifikaatit, Telinekartta & piirustus, Sää & Kartat, Hankinnat & OSINT ja Asetukset. Helsingin kartta-, 3D-rakennus- ja LiDAR-työkalut jäävät omiksi paikallisiksi aineistotyökaluikseen.

Base44n valikon reittien nimet ovat tiedossa, mutta muiden sivujen sisältöä ei tässä Dashboard-kartoituksessa avattu. Siksi CRM-, talous-, materiaalihallinta-, toimitusseuranta- ja vaatimustenmukaisuustoimintoja ei merkitä valmiiksi vastaavuuksiksi tämän toteutuksen perusteella.

## Näkyvät rajaukset

- Etusivun luvut lasketaan TelineHallinnan paikallisista tietueista, ei Base44n tietokannasta.
- Työntekijämäärä tarkoittaa pätevyysrekisterissä esiintyvien henkilöiden määrää.
- Tiiminäkymä käyttää tehtäviin tallennettuja vastuita eikä väitä niiden muodostavan virallista tiimirosteria.
- Riskinäkymä näyttää sääntöjen perusteella löytyneet tarkistustarpeet; se ei hyväksy turvallisuutta tai telineiden rakenteellista suunnittelua.
- Base44n valikossa näkyvät AI-avustaja, proaktiiviset ennusteet ja turvallisuuskuvien analyysi jätettiin tämän Dashboard-vastaavuuden ulkopuolelle.
