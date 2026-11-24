# Helsinki Map Embed Builder

## Telinekonttori-työtila

`http://127.0.0.1:3400/` avaa paikallisen Telinekonttori-työtilan. Se kokoaa
yhteen työmaakartan, mobiilinäkymän, tehtävät, kalenterin, työajanseurannan,
profiilin, sertifikaatit, CAD-suunnittelun projektiaineistot, säävaroitukset, asetukset ja tämän projektin
Helsinki GIS -työkalut. Tehtävä-, työaika-, sertifikaatti- ja profiilitoiminnot
toimivat paikallisilla esimerkkitiedoilla ja tallentavat muutokset selaimen
`localStorage`-tallennukseen.

### Suomen kartta-aineistot

**GeoBIM & kartat → Suomen kartta-aineistot** (`/?page=mapdata`) kokoaa
30.10.2026 tarkistetun Suomen aineistohakemiston Telinekonttorin sisään.
Hakemistoa voi hakea tuottajan, aiheen ja aineistotyypin mukaan. **Lisää kartalle**
avaa valitun aineiston olemassa olevaan työmaakarttaan (`/?page=gis`).
Kartalle sopivat WMS-karttakuvat käyttävät palvelun ilmoittamaa Web Mercator
-koordinaatistoa. Muut tasot ohjataan lähdepalveluun tai QGISiin.

Kunta- ja maakuntarajat saa kartalle paikallisesta aineistokopiosta.
QGIS-paketti, GeoPackage ja palveluyhteydet latautuvat sovelluksen omasta
aineistokansiosta. Suuret koko maan maasto-, kuva- ja laserkeilausaineistot
ovat linkkejä julkaisijoiden latauspalveluihin. Valitut karttatasot ja
peittävyys tallentuvat selaimeen; työmaan karttamerkkien tallennus säilyy
entisessä palvelimen tietokannassa. Helsingin CodeRain ja 3D-näkymät ovat
edelleen alueellisia Helsinki-työkaluja.

Tuonti, rajapinnat, lähdetiedot ja tarkistukset on kuvattu tiedostossa
[docs/suomen-kartta-aineistot.md](docs/suomen-kartta-aineistot.md).

Uudet logot ja käyttöliittymägrafiikat tallennetaan kansiorakenteeseen
`public-static/assets/`; alikansiot ja tiedostonimiohjeet ovat
[assets-ohjeessa](public-static/assets/README.md).

**Suunnittelu & CAD** kokoaa telineiden 2D-piirustusten ja Inventor-tyyppisen
3D-mallinnuksen käyttötapaukset sekä työmaakohtaiset materiaaliluettelo-,
asennusohje- ja CAD-tiedostoviitteet. Viitteet tallentuvat selaimeen; itse
DWG/DXF/Inventor/PDF-aineistoa ei ladata tai muokata sovelluksessa. Näkymässä
on lisäksi [CAD-piirustuksen työmaakatselmusoppaaseen](https://scaffolddesignhub.com/scaffold-cad-drawings/)
perustuva tarkistuslista; se ei korvaa rakennesuunnittelua tai paikallisia määräyksiä.

Työtilan **Avoin lähdehaku** -sivu tuo DataBridge-lähdehaun
navigaatioineen tähän samaan näkymään. Näkymä käynnistää HILMAn ajantasaisen
rakennusurakkahaun automaattisesti ja sisältää painikkeen live-haun uusimiseen.
`./start-local.sh` käynnistää karttatyötilan porttiin `3400` ja
crawlerin porttiin `3017`; OSINT-sivun voi avata myös erillisenä koko näkymänä.
HILMA-haku käyttää `Settings → API keys` -näkymässä tähän koneeseen tallennettua
salattua avainta palvelinpuolella. Hakunäkymässä on ilmoitusryhmä, laajuus,
hankintalaji, ostaja/Y-tunnus, CPV, julkaisuajankohta, NUTS-suorituspaikka,
lähdejärjestelmä, puitejärjestely- ja DPS-rajaukset sekä JA/TAI-sanahaku.
Hakutuloksiin näytetään saatavilla olevat ilmoituksen yleiset metatiedot;
kilpailutustunnisteen osa- ja sopimuskohtainen muoto tarkistetaan Hilman
alkuperäisestä ilmoituksesta, koska sitä ei ole HILMAn hakuindeksin
metatietovastauksessa.

Hilman ohjesivujen linkkihakemisto ja tallennetut paikalliset lähdeasiakirjat ovat
[Hilman käyttöohjeet](docs/HILMA-Kayttoohjeet.md),
[Hankintojen hakeminen (15.9.2026)](docs/HILMA-Hankintojenhakeminen150926.md),
[Ilmoitustyypit (25.6.2026)](docs/HILMA-Ilmoitustyypit250626.md) ja
[Kilpailutustunniste (2.6.2026)](docs/HILMA-Kilpailutustunniste020626.md) sekä
[Hankintamenettelyn tekeminen (30.1.2026)](docs/HILMA-HankintamenettelynTekeminen300126.md).

### Myyntiputki

CRM:n yritykset, mahdollisuudet, aktiviteetit, Helsinki-sijainnit, RATU-rakennuskohteet,
piirustusviitteet ja ScaffoldingOS-vientijono tallentuvat paikalliseen
SQLite-tietokantaan (`.local-data/telinehallinta.sqlite`). CRM:n ensimmäinen
avaus siirtää vanhat `customers`- ja `designResources`-tiedot tästä selaimesta
idempotentisti tietokantaan; selainkopio säilyy tarkistusta varten.

Myyntivaiheet ovat **Uusi → Kelpuutus → Yhteydenotto → Tarjousvalmistelu →
Tarjous lähetetty → Voitettu / Hävitty**. Kelpuutus → Yhteydenotto -siirtymä
lisää viennin paikalliseen jonoon. ScaffoldingOSin kirjoittavaa API-sopimusta
ei ole vahvistettu, joten automaattista ulkoista vientiä ei vielä tehdä;
jonotetut rivit näkyvät käyttöliittymässä ja putken voi viedä CSV:nä.

OSINT-tuloksen **Lisää myyntiputkeen** -painike lähettää versionoidun
`postMessage`-tapahtuman TelineHallinnan CRM:lle. Hankintailmoitus tallentuu
mahdollisuutena, ja ostaja liitetään yritykseksi silloin, kun se on tunnistettu.
Yrityksen karttapiste vaatii käyttäjän valitseman Helsinki-osoitehaun osuman
(EPSG:3879). Rakennus ja piirustusviitteet tallentuvat RATU-tunnuksella;
CRM säilyttää URL-viitteen eikä kopioi itse tiedostoa.

Tämä on käyttöliittymän paikallinen toteutus. Base44-palvelun kirjautumista,
pilvitietokantaa, yritysrekisteriä tai sen käyttäjädataa ei ole yhdistetty eikä
kopioitu. Kartta ja kaupunkimallit haetaan erikseen Helsingin kaupungin
karttapalvelusta.

A small, **fully static** web toolkit for building **embeddable maps from the City
of Helsinki map service** ([kartta.hel.fi](https://kartta.hel.fi)) — plus a live
**layers gallery** and an interactive **3D LiDAR point-cloud viewer**.

The City of Helsinki map service is powered by *Louhi / SpatialWeb* (Sitowise).
It has no documented embed API, but its `/embed/` page reads **all** of its
parameters **client-side from the URL** (`layers`, `easting`, `northing`,
`resolution`, `o`, `cs`, `wheres`, `geom`, …). That means we can build arbitrary
layer stacks entirely in the browser — **no backend, no API key, no server-side
session needed.**

> Map data © City of Helsinki. This tool is an independent helper and is **not**
> affiliated with or endorsed by the City of Helsinki.

---

## The three tools

| Page | What it does |
|------|--------------|
| **`index.html`** — *Embed builder* | Pick a location, a base map and any number of overlay layers, toggle the UI widgets, and copy a ready-to-paste `<iframe>` snippet. |
| **`buildings.html`** — *3D buildings + semantic data* | Opens the Helsinki 3D city model behind an isometric Matrix Code Rain loading indicator. It also queries a bounded area from Helsinki's CityJSON WFS through the local server proxy and previews/downloads the returned building data. |
| **`matrix-coderain.html`** — *Matrix Code Rain map loader* | Loads an official Helsinki WMS map image and reveals it through an animated code rain. Choose a map layer, location and scale, or open the image URL directly. |
| **`gallery.html`** — *Layers gallery* | Browse all **1,087 layers** as **live mini-maps** (lazy-loaded), filter by the 20 official categories or search, collect layers in a tray, and send them straight to the builder. |
| **`pointcloud.html`** — *3D LiDAR viewer* | Open a downloaded Helsinki `.las` / `.laz` tile from the file picker, drag-and-drop, or a copied map download link; the built-in 1,000,000-point RGB sample remains available. |
| **Telinekonttori → Avoin lähdehaku** | Embedded DataBridge search across live HILMA, TED, YTJ, Ryhti, Väylävirasto and Museovirasto sources plus Google, DuckDuckGo, Bing and Brave query links. |

Everything is plain HTML + CSS + JS and can be hosted on any static host. The
`public-static/vendor/` directory contains the local proj4 and Three.js runtime
files, so the builder and viewer do not fetch JavaScript libraries from a CDN.
The map itself still loads from kartta.hel.fi and needs an internet connection.

---

## Features

### Embed builder
- 📍 **Location** — quick-pick from 30 Helsinki places, or type WGS84 lat/lon
  (kartta.hel.fi reprojects to the local grid **EPSG:3879** automatically via
  `cs=EPSG:4326`).
- 🗺️ **34 base maps** — guide, street, base, property, aerial/ortho imagery, 3D.
- 🧩 **1,053 overlay layers** — districts, postal areas, plans, buildings,
  streets & parks, lighting, HSL transit, environment, statistics, and more.
- 🎚️ **Multi-layer switcher** — stack any number of layers, reorder them and set
  per-layer opacity.
- 🎛️ **UI components** — mini map, "now on map", toolbar, main menu, link to the
  full service, mouse-wheel zoom; 2D/3D mode; Finnish/English/Swedish.
- 👁️ **Live preview** + one-click copy of the `<iframe>` snippet.
- 🏙️ **3D buildings preset** — opens the official Helsinki 3D city model in the preview and generated iframe, with building selection and the service's semantic details.

### Helsinki 3D buildings
- 🏢 Ready-to-open central Helsinki view with selectable 3D buildings.
- 🌧️ Animated code rain draws a schematic isometric city while the official 3D viewer loads; it respects reduced-motion settings and offers a manual dismiss if loading takes a long time.
- 🧾 Selecting a building exposes GMLID, RATU, VTJ-PRT, building class, use, type and floor count.
- 🗂️ The city model's semantic CityGML data includes identifiers and building properties such as construction year and floor count. See the [official Helsinki 3D description](https://www.hel.fi/fi/paatoksenteko-ja-hallinto/tietoa-helsingista/kartat-ja-paikkatieto/helsinki-3d).
- 🧭 Query a bounded radius around an ETRS-GK25 coordinate through `/api/helsinki/cityjson/buildings`; the page previews CityJSON objects and their attributes and can download the complete returned JSON. The same-origin Express bridge avoids browser CORS restrictions, fixes the upstream WFS/type/format, and caps radius, record count, response size and request time.
- 🔗 The WFS schema identifies its JSON output as CityJSON 1.0.3. Results are labeled using the format detected in the actual response, so a different server response is not mislabeled.

### Local API key vault
- 🔑 **Settings → API keys** adds, updates, reveals and removes local integration keys such as the HILMA subscription key.
- 🔒 Keys are encrypted by the local Node server with AES-256-GCM and stored under the Git-ignored `.local-secrets/` directory with owner-only file permissions. List responses are masked; the full value is returned only after choosing **Show**.
- 🖥️ Key management is restricted to loopback connections, and the server binds to `127.0.0.1` by default. This local vault is not intended for public hosting or multi-user deployments.

### Telinekartta & piirustus
- 🏢 The building picker is integrated into the existing **Telinekartta & piirustus** workspace view. Search by Helsinki street address or click a building on its interactive map.
- 🧾 The selection displays a building card with the municipal property identifier, registry attributes, footprint and direct drawing-search links to Sinetti, Finna, Helsinki and web search.
- 📐 Send the selected footprint into the existing scaffold facade and 3D massing workflow. The CityJSON search remains available as an advanced option in the same view.
- 📐 Enter a facade length, scaffold height, bay module, lift spacing and drawing scale to generate a proportional 2D facade and a 3D massing sketch.
- 🧾 Search a bundled, source-linked 2,373-row component extract from the supplied manufacturer workbook. Imported values are marked for verification; manufacturer systems are never treated as interchangeable.
- 🏷️ Choose a manufacturer's component library by clicking its brand card. Confirmed logo links are displayed where the workbook provides them; the card links back to the recorded brand source.
- 💶 Create an indicative area-based quote draft and export a geometry-derived BOM CSV. These quantities are not a manufacturer assembly BOM and are not structural calculations.
- 💾 Save the project, customer/company name, source footprint, geometry, BOM, prices and revisions in the local SQLite project store.
- 📎 Attach drawings and 3D files to a project revision. File bytes stay under `.local-data/scaffold-files/`, with private file permissions and a stored SHA-256 checksum. Supported formats include PDF, DWG/DXF, SVG, OBJ/MTL, GLB/GLTF, IFC, STL, STEP and common image formats (100 MB per file).
- 🧩 Save a project's parameters, system and pricing as a reusable scaffold template. Applying a template copies its values into the current draft.
- 🤝 Request a local nearest-project comparison for BOM and quote suggestions. The response includes no customer names or project identifiers, requires at least three comparable saved projects and is a reviewable estimate, not an automatically issued quote or a trained cloud AI model.

The building card reads the Helsinki open WFS address, building-footprint and
registry layers. Its map is part of the scaffold workspace view and uses an
interactive map canvas, so address selection and map clicks both update the
same card. Drawing links open their source services; they do not imply that a
permit drawing was found or downloaded. Footprint dimensions are derived from
the mapped outline, and building height is an estimate until checked against
drawings or at the site. The preview, quantities and quote are planning aids;
the structural check remains a separate designer-reviewed workflow.

### Matrix Code Rain map image
- 🌧️ Loads a real PNG from the City of Helsinki open WMS service on page load; the Matrix-style code rain reveals it when the image arrives.
- 🗺️ Switch between the guide map, base map and 2026 orthoimage; select from the Helsinki place gazetteer and four map scales.
- ↗️ Open the exact WMS image request separately. The view includes the required City of Helsinki attribution.

### Layers gallery
- 🖼️ **Live thumbnails** of every base map and overlay, rendered by the real
  kartta.hel.fi embed and **lazily loaded** (IntersectionObserver + a bounded
  concurrency pool) so it stays fast.
- 🗂️ **Category tabs** (Background maps, Regional divisions, Planning & traffic,
  Streets & parks, Environment & nature, …) with layer counts.
- 🔎 **Global search** across all 1,087 layers.
- ⭐ **Featured collections** — one-click jumps to Laser scanning, Elevation
  models, Hillshade and the 3D point cloud.
- 🧺 **Selection tray** — tick layers, then **Open in builder** deep-links them
  (`index.html?layers=id1,id2,…`).

### 3D LiDAR point-cloud viewer
- 🧊 **1,000,000 RGB sample points** decimated from a 16.18 M-point `.laz` tile.
- 📂 Open a downloaded `.las` / `.laz` tile, drop one into the viewer, or paste
  a direct Helsinki map-service `Lataa` URL; files above 300 MB are rejected.
- 🎨 **Three colour modes** — True colour when the file has RGB, elevation
  (turbo gradient) and the LAS return-intensity field.
- 🖱️ **Orbit / pan / zoom**, auto-rotate, ground grid, adjustable point size.
- 🗺️ **Mini-map** showing the loaded tile's location and footprint on kartta.hel.fi.

---

## The embed URL (what the app builds)

```
https://kartta.hel.fi/embed/?layers=<id1>,<id2>,…&easting=…&northing=…&resolution=…
```

| Param | Meaning |
|-------|---------|
| `layers` (or `l`) | Comma-separated layer ids; `layer:sublayer*sublayer` for sub-layers. Invalid ids are skipped. |
| `cs` | Coordinate system of `easting`/`northing` (e.g. `EPSG:4326` → server reprojects). |
| `easting` / `e`, `northing` / `n` | Map centre. |
| `resolution` / `r` | Metres per pixel (zoom). |
| `o` | Comma-separated per-layer opacity, aligned with `layers`. |
| `wheres` / `w` | Per-layer SQL-like attribute filters. |
| `geom` | URL-encoded WKT geometries. |
| `minimap`, `maplink`, `maptools`, `leftmenu`, `legend`, `wheelzoom` | UI widget toggles. |
| `allow3d` | `1` = 3D available, `2` = 3D on start, `3` = 3D only. |
| `text`, `dim`, `names`, `setlanguage` | Comment text, dimming, names, language (`fi`/`en`/`sv`). |

### Example

```html
<iframe width="640" height="480" style="border:0"
  src="https://kartta.hel.fi/embed/?layers=opaskartta,kaupunginosat,HSL_Pysakit&easting=25496825&northing=6673044&resolution=4&minimap=1&leftmenu=1&legend=1&setlanguage=fi"
  title="Helsinki Map Service"></iframe>
```

---

## Layer catalogue

`public-static/catalog.json` is extracted once from
`https://kartta.hel.fi/api-sw/settings` and contains:

- `baseMaps` — the 34 background layers (`subType: 2`).
- `tree` — the nested menu (20 top-level categories, English names added).
- `flat` — every layer as `{ id, title, subType, path, cat }`.

`subType` meanings: **2** = base map, **0** = vector overlay, **3** = plan layer.

---

## Point-cloud pipeline

The 103 MB `rgb_674495a.laz` (LAS 1.2, point format 3 with RGB, 16,183,055
points, EPSG:3879, 500 × 500 m tile) is decimated with `make-pointcloud.py`:

1. Read the `.laz` in 2 M-point chunks.
2. **Voxel-dedupe** at 0.4 m (removes clumping) → ~4.0 M points.
3. Random-sample to **1,000,000** points.
4. Quantise to **9 bytes/point** → `pointcloud.bin` (9 MB):
   `[Uint16 x,y,z]×N` (local cm) then `[Uint8 r,g,b]×N` (16-bit LiDAR RGB scaled
   to 8-bit + a mild gamma).
5. Write `pointcloud-meta.json` (origin, scale, bounds, CRS, tile).

```bash
python3 make-pointcloud.py     # requires: laspy, lazrs, numpy
```

The viewer also reads downloaded LAS/LAZ files in the browser. Helsinki map
download URLs from `ptp.hel.fi/DataHandlers/Lidar_…/Default.ashx` can be pasted
into the viewer, or the downloaded file can be opened locally. Large files are
sampled to at most 1.5 million displayed points. The bundled
`@loaders.gl/las` decoder currently accepts LAS versions 1.0–1.3; rebuild its
browser bundle and WebAssembly decoder with `npm run build:lidar` after changing
dependencies.

---

## Run locally

```bash
./start-local.sh
```

The script installs the locked npm dependencies if needed, starts the local
Express server, and opens the workspace in the browser when `xdg-open` is
available. Stop it with `Ctrl+C`. The default address is
`http://127.0.0.1:3400/`; set `OPEN_BROWSER=0` to skip opening a browser.

Staattisessa julkaisussa paikallinen työtila löytyy polusta
`/workspace.html`; Express-palvelin ohjaa juuripolun suoraan siihen. Alkuperäinen
karttarakentaja säilyy osoitteessa `/index.html`.

## Deploy

The `public-static/` folder is a complete static site — drop it on any host
(S3, Netlify, GitHub Pages, …). No build step, no server.

---

## Node server (optional for static deployments)

`server.js` serves `public-static/` (including the LiDAR viewer, decoder and
WASM file) and falls back to `public/` for legacy pages. It also proxies the
map-service APIs used by the builder and the Helsinki CityJSON WFS used by
`buildings.html`. The CityJSON viewer needs this server; it cannot call the WFS
from a `file://` page or a static-only hosting target. Run it when developing
locally:

```bash
./start-local.sh
```

The app then opens at `http://127.0.0.1:3400/`. Node.js 18 or newer is required.

The Telinekonttori **Suunnittelu & CAD** view includes a local scaffold
calculation record workflow. `POST /api/scaffold/calculations` returns an
immutable calculation snapshot; the browser keeps snapshots in its local
workspace. Engine and generic-library version identifiers are included.
Engine v0.1.0 only compares sourced, user-supplied `Ed` and `Rd` values for
five review stages. It does not derive actions, wind loads, load combinations,
member or foundation resistance, or global stability. Do not use its ratios as
a scaffold design or approval. Incomplete records cannot be review-marked;
complete records still require an independent check by a qualified Finnish
scaffold or temporary-works designer. Reviewer name/date is a local note, not
an electronic signature. The current version has no verified manufacturer
component catalog, drawing parser, cloud storage, or signing.

---

## Project layout

```
helsinki-map-embed/
├─ public-static/            ← the deployable static site
│  ├─ index.html  app.js  style.css        (embed builder)
│  ├─ workspace.html workspace.js workspace.css (Telinekonttori local workspace)
│  ├─ buildings.html                       (preconfigured 3D building view)
│  ├─ matrix-coderain.html matrix-coderain.js (WMS image + Matrix-style reveal)
│  ├─ gallery.html gallery.js              (layers gallery)
│  ├─ pointcloud.html pointcloud.js        (3D LiDAR viewer)
│  ├─ catalog.json  gazetteer.json         (layer catalogue + places)
│  ├─ pointcloud.bin  pointcloud-meta.json (decimated point cloud)
│  └─ vendor/                  (local proj4 and Three.js runtime files)
├─ server.js                 ← legacy Express proxy
├─ start-local.sh            ← local setup, server launch and browser open
├─ make-pointcloud.py        ← .laz → web point cloud
├─ generate-codes.js  make-gazetteer.js    ← data helpers
├─ test/                     ← Node.js regression tests
└─ README.md
```

---

*Made with 🥷 by SuperNinja. Map data © City of Helsinki.*

## CRM company directory and research sources

The CRM company directory adds category-based company cards to the local SQLite
address book. Categories are manufacturers, services, auxiliary suppliers,
subcontractors, consulting, design, and other. The existing 13-entry scaffold
manufacturer catalog is imported idempotently; Talhu is added as a source-checked
branded scaffold system provider. Its public contact page supplies the business
ID, generic sales contact, and listed Vantaa, Pirkkala, and Turku locations.
The underlying factory origin of the Talhu-branded Hana Uniround system is not
asserted. “Moson” is a review-needed placeholder until the intended company and
scaffold system are identified.

Cards can hold multiple business contacts and addresses, latest accounts year,
revenue, workforce, market share, and a manually reasoned future score. Source
URLs are captured per information group. A relative category rank uses the
weights tradition 20%, revenue 25%, workforce 20%, market share 20%, and
future points 15%. Each numeric input is normalized within its company category
from 0–100 before weighting. A rank appears only when at least two entries in
that category have all five values and their required source URLs; incomplete
cards remain unranked. Empty values remain unknown rather than being estimated.
The CRM research-source guide is in
`public-static/data/crm-research-sources.js`; it distinguishes public registries,
procurement and infrastructure signals, qualification sources, and workplace
safety guidance. Valtti and Luotettava Kumppani require appropriate account
access; employee identifiers and worker lists must not be copied into company
cards.

PRH's digital XBRL dataset is not a complete substitute for all filed accounts.
Record the actual accounts period and source link when available; check Virre
for official filings that are not in the open digital dataset. The existing
manufacturer component count describes the local catalog rows and does not
measure company size, revenue, or market share.
