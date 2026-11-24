# MMS local archive

This local archive contains user-supplied manufacturer catalogues and model ZIP files. Source files are copied unchanged; ZIP bundles are not unpacked or evaluated by the application.

## Vendors
- `tobler-ag/catalogs/`: supplied MATO product catalogues.
- `at-pac/catalogs/`: reserved for AT-PAC product catalogues; no catalogue PDF was supplied with this batch. The vendor logo is in `public-static/assets/logos/manufacturers/at-pac.webp`.
- `scafom-rux/catalogs/`: supplied SUPER-65 erection and usage manual.

## Model categories
- `3d-models/EVENT/`
- `3d-models/FACADE/`
- `3d-models/INDUSTRY/`
- `3d-models/NAVAL/`
- `3d-models/AVIATION/`

Categories are assigned from filenames and user-provided context only. They are a filing aid, not confirmation of model content, system compatibility, permission to use, or engineering suitability. AVIATION is empty because no aviation-named model bundle was supplied.

The two supplied cathedral PERI ZIP files had identical SHA-256 hashes; one copy is retained to avoid duplicating 94 MB. The source filenames are recorded in the generated archive manifest.
- `wellmade/catalogs/`: Kwikstage, Quickstage and Indonesia Speed Shore catalogues/manuals from Wellmade's public manufacturer catalogue. These variants are filed separately and are not assumed compatible.
