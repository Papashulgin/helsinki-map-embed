# ALFIX-aineistot MMS-arkistossa

ALFIX GmbH:n saksankielisiltä julkisilta lataus- ja verkkokauppasivuilta kerätty paikallinen viiteaineisto.

- `catalogs/*.pdf`: valmistajan julkiset tuote-esitteet ja asennus-/käyttöohjeet.
- `catalogs/alfix-online-prices.csv`: hinnat, tuotenumero, hintatyyppi sekä lähdesivun URL.
- `catalogs/alfix-online-prices.json`: sama hintatieto lähde- ja hakupäivämetatietoineen.
- `catalogs/alfix-price-list.html`: MMS:n suodatettava hintaluettelo.
- `catalogs/documents-manifest.json`: ladattujen PDF-tiedostojen lähdeosoitteet ja SHA-256-tiivisteet.

Hintaluettelo luetaan ALFIXin saksankielisen kaupan sitemapista, ja hinnat poimitaan tuotekohtaisilta sivuilta. Sivusto ilmoittaa hinnat verottomina (`zzgl. MwSt.`). Hinnat ovat vain sivun hakuhetken näkymiä, eivät sitovia tarjouksia. Käyttöohjeiden versio on tarkistettava valmistajalta ennen käyttöä.

Päivitä hintavedos komennolla `python scripts/crawl-alfix-price-catalog.py` ja päivitä valmistaja-aineistot komennolla `python scripts/fetch-alfix-mms-documents.py`.

Arkisto on paikallinen työtila. Lähdedokumenttien edelleenjulkaisuoikeutta ei ole varmistettu.
