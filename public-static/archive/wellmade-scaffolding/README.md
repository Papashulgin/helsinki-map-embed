# Wellmade scaffolding catalogue archive

This folder preserves the user-supplied Wellmade system-scaffolding catalogue, its provenance, a Finnish technical reading note, checksums, and editable illustrative scaffolding-part models for all ten catalogue ledger lengths plus the current 3.07 m ledger variant, all seven catalogue standard lengths, all ten catalogued diagonal variants, five Cuplock/Kwikstage stair variants and an adjustable jack.

## Files

- `Wellmade-Scaffolding-Catalogue.pdf` — 28 landscape PDF pages, mostly two printed pages per spread; printed page numbers run 1–53. Its SHA-256 exactly matches the copy linked from the manufacturer's current catalogue page on 2026-10-28.
- `metadata.json` — catalogue identity, file metadata, provenance, and model assumptions.
- `analysis-fi.md` — Finnish summary of the catalogue and relevant Ringlock component dimensions, with limitations and apparent table inconsistencies.
- `models/ledger-lengths.html` — list of all ledger exports, source catalogue masses and model files.
- `models/standard-lengths.html` — all seven upright lengths, catalogue masses and exports.
- `models/diagonal-lengths.html` — ten WRB diagonal sizes with source lengths/masses and calculated 2 m-rise chords.
- `models/stair-rises.html` — five catalogue stair variants, source masses, modeled rise/going and tread-count assumptions.
- `models/Wellmade-Ringlock-All-Standards.blend` / `.glb` — every catalogue upright length in one scene.
- `models/Wellmade-Ringlock-All-Diagonals.blend` / `.glb` — all ten diagonal bay variants in one scene.
- `models/Wellmade-All-Scaffold-Stair-Variants.blend` / `.glb` — Cuplock and Kwikstage stair variants in one scene.
- `models/Wellmade-Ringlock-All-Ledgers.blend` / `.glb` — all ten catalogue ledger lengths plus the current 3.07 m variant in one scene.
- `models/Wellmade-Ringlock-3-components.blend` — scene with the 3.07 m ledger, 2.00 m standard and 760 mm jack.
- `models/Wellmade-Ringlock-3-components.glb` — combined model for 3D viewers; `models/Wellmade-Ringlock-Ledger-WRL307-3070mm.stl`, `Wellmade-Ringlock-Standard-WRS200-2000mm.stl` and `Wellmade-Adjustable-Jack-760mm-38x4.stl` are individual millimetre-coordinate exports.
- `models/Wellmade-components-preview.png` and the individual `Wellmade-*-preview.png` images — rendered model reviews.
- `drawings/` — selected user-supplied drawings and reference images; the identical duplicate head drawing is recorded but stored once.
- `parts-dimension-notes-fi.md` — exact catalog/drawing values, chosen model datums and unresolved details.
- `make_scaffold_parts.py`, `make_all_ledgers.py`, `make_all_standards.py`, `make_all_diagonals.py` and `make_stairs.py` — reproducible Blender model-generation sources.
- `models/legacy-ledger-only/` — earlier ledger-only draft exports, retained for provenance; the current three-part models are linked above.
- `SHA256SUMS` — integrity hashes for the archived files.

Stair flights use the catalogued overall spans and 12 assumed equal rises; Cuplock width and all tread/stringer details are illustrative, and handrails are omitted. The ten catalogued diagonal brace lengths do not match the chord lengths calculated from their bay widths and 2 000 mm rise; models use the bay/rise endpoints and preserve the catalogue brace lengths separately. End fittings are visual placeholders. The seven catalogued upright lengths use rosettes at 500 mm pitch, with the first ring centre 250 mm above the lower end; splice spigots are omitted because fit dimensions are absent. The ten historical ledger lengths are treated as nominal catalogue dimensions because the PDF does not define their endpoints; only the current 3.07 m page specifies a centre-to-centre datum. The product catalogue is reference material, not a scaffold design or load approval. The supplied ledger-head drawing now constrains the head envelope and several bore/section dimensions; unshown cast fillets, weld geometry and wedge details remain reconstructed approximations. The upright omits its splice spigot because the uploaded drawing set does not dimension its fit. The jack's 660 mm annotation has an ambiguous datum and is not presented as confirmed adjustment travel.

## Sources

- Exact source PDF: https://www.wm-scaffold.com/wp-content/uploads/2021/01/2-Wellmade-Scaffold-Catalogue-different-scaffolding-sytsems.pdf
- Manufacturer catalogue landing page: https://www.wm-scaffold.com/scaffold-catalogue/
- Manufacturer home: https://www.wm-scaffold.com/
- Part-source URLs and supplied drawing provenance: `drawings/README-fi.md` and `parts-dimension-notes-fi.md`.
