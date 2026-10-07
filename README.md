# Helsinki Map Embed Builder

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
| **`gallery.html`** — *Layers gallery* | Browse all **1,087 layers** as **live mini-maps** (lazy-loaded), filter by the 20 official categories or search, collect layers in a tray, and send them straight to the builder. |
| **`pointcloud.html`** — *3D LiDAR viewer* | Fly through a real **1,000,000-point RGB laser scan** of central Helsinki (decimated from a 103 MB `.laz`), with true-colour / elevation / intensity modes. |

Everything is plain HTML + CSS + JS and can be hosted on any static host.

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
- 🧊 **1,000,000 RGB points** decimated from a 16.18 M-point `.laz` tile.
- 🎨 **Three colour modes** — True colour (with a saturation control), Elevation
  (turbo gradient) and Intensity (luminance).
- 🖱️ **Orbit / pan / zoom**, auto-rotate, ground grid, adjustable point size.
- 🗺️ **Mini-map** showing the 500 × 500 m tile footprint on kartta.hel.fi.

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

---

## Run locally

```bash
cd helsinki-map-embed/public-static
python3 -m http.server 3400
# open http://localhost:3400/
```

## Deploy

The `public-static/` folder is a complete static site — drop it on any host
(S3, Netlify, GitHub Pages, …). No build step, no server.

---

## Legacy backend (optional)

`server.js` is an older Node/Express proxy that opened a kartta.hel.fi session,
solved the CSRF token and stored map states via `api-sw/shorten` to produce short
`?link=<code>` URLs. It is **no longer required** (the static app builds full
`layers=…` URLs directly), but it is kept for reference.

```bash
cd helsinki-map-embed && npm install && node server.js
```

---

## Project layout

```
helsinki-map-embed/
├─ public-static/            ← the deployable static site
│  ├─ index.html  app.js  style.css        (embed builder)
│  ├─ gallery.html gallery.js              (layers gallery)
│  ├─ pointcloud.html pointcloud.js        (3D LiDAR viewer)
│  ├─ catalog.json  gazetteer.json         (layer catalogue + places)
│  └─ pointcloud.bin  pointcloud-meta.json (decimated point cloud)
├─ server.js                 ← legacy Express proxy
├─ make-pointcloud.py        ← .laz → web point cloud
├─ generate-codes.js  make-gazetteer.js    ← data helpers
└─ README.md
```

---

*Made with 🥷 by SuperNinja. Map data © City of Helsinki.*
