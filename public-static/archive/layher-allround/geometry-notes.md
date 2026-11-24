# Layher Allround - modular geometry notes

Sources: Finnish assembly/use manual 04.2018, especially printed pages 15-16 and 52-55; English Allround Catalogue 2021, especially printed pages 16-20. Page numbers below refer to printed page labels where applicable.

## Verified system facts

- The 48.3 mm standards have rosettes at 0.50 m vertical spacing. The catalogue describes up to eight connections at a rosette: four smaller openings establish right-angle connections; four larger openings allow other angles. These are connection choices at a node, not a rule that every bay forms an octagon or that all eight directions are automatically used.
- A useful local coordinate model is a node grid `(i, j, k)`: `x_i` and `y_j` are cumulative selected ledger/bay dimensions, while `z_k = z0 + 0.50*k m` for rosette levels. Store each ledger's endpoints, chosen rosette opening/angle, component type and nominal length. The scaffold origin and axes must be tied to the project survey/CRS separately.
- The 2021 catalogue lists common system bay dimensions such as 0.73, 1.09, 1.40, 1.57, 2.07, 2.57 and 3.07 m. It also lists metric O-ledger variants at 0.50, 1.00, 1.50, 2.00, 2.50 and 3.00 m. The list is not an integer sequence of multiples of 0.39 m; components and compatible bay arrangements determine allowed dimensions.
- Deck/platform widths listed in the catalogue include 0.19, 0.32 and 0.61 m. The catalogue's deck-layout table distinguishes bay width from deck width and gives compatible counts/arrangements. Platform width is therefore not the same dimension as scaffold bay length.
- 0.39 m occurs as a specific O-ledger dimension, and in certain lift-off preventer/bracket components. It is not a universal platform width or the basis of a general 1-to-8 bay progression. The Finnish manual separately lists U-ledger nominal lengths such as 0.45, 0.50, 0.73, 1.09, 1.40 m and reinforced LW variants from 1.57 m upward.

## Interpreting the proposed “1–8” sequence

A user-defined model may number repeated units `n = 1...8`, but each increment must be explicitly defined (for example, one selected bay width or one selected deck module). Do not infer that Layher's approved bay lengths are `n × 0.39 m`, nor that eight rosette connection options imply eight scaffold bays. For a particular U-ledger and deck combination, use the catalogue's compatible configuration table and the relevant approval/design documentation.

## Engineering boundary

These nominal dimensions support geometry and inventory organization. They do not calculate load capacity, wind, tie patterns, foundation bearing, stability or diagonal-bracing requirements. The Finnish manual states that stability must be verified and a scaffold-specific assembly/use/dismantling plan prepared. Keep design review and approval separate from geometric modeling.

## Transverse scaffold width and facade clearance

Source review updated 2026-11-03. The archived documents establish useful system dimensions, but they do not establish a universal project-specific distance between a building facade and the working deck.

- The Layher Allround 2021 catalogue's U-ledger deck-layout table lists nominal bay widths including 0.73 m and 1.09 m. The archived Finnish 04/2018 manual's printed page 18 shows example deck packings: for 0.73 m, either 2 × 0.32 m decks or 1 × 0.61 m deck; for 1.09 m, either 3 × 0.32 m or 1 × 0.61 m plus 1 × 0.32 m. These are catalogue layout options, not a complete installed envelope or a verified clear walking width; the selected ledger/deck system, gaps, consoles and edge components still matter.
- The Layher Keder Roof XL manual, edition 01.2014, specifies support-scaffold axis dimensions of 0.73 m or 1.09 m and roof bay widths up to 2.57 m. These are Keder support-system dimensions, not a rule for the distance from a facade to an Allround working deck.
- The Layher Allround Finnish assembly/use manual, edition 04/2018, says the maximum wall distance must be observed to prevent falls. It gives 0.30 m as an example of a maximum distance at which inside side protection may be needed, and explicitly says protection can be needed at a smaller gap in some conditions. This is a conditional manual example, not a universal clearance target.
- Finland's current Government Decree 205/2009, especially sections 51–54, requires a safe, designed scaffold and use of system instructions/design plans; it does not set a single universal numeric facade gap. The former 0.25 m inside-guardrail sentence is in STM Decision 156/1998, which Finlex marks repealed from 1 June 2009. Do not present that repealed threshold as current law.

For a section at a particular balcony, opening, canopy or roof edge, record the surveyed facade-to-inner-deck gap and the selected deck/ledger arrangement at that exact location. Keep the nominal scaffold axis width, usable deck width and facade clearance as three separate measurements. Until those project inputs exist, an exported drawing must remain a schematic and must not claim to be a dimensioned section. The 0.30 m manual example can be shown as a review prompt only, never as automatic legal compliance.

### Sources

- Layher Allround Finnish assembly/use manual, 04/2018: printed pages 10, 18 and 22. Archived PDF: `Layher-Allround-Asennus-ja-kayttoohje-fi-2018-04.pdf`; public copy: https://telinekataja.fi/media/filer_public/8c/81/8c818fab-5d3d-438e-948b-9a489d05ea4e/allround.pdf
- Layher Allround Catalogue, 2021/2022: printed pages 17–18. Archived PDF: `Layher-Allround-Catalogue-en-2021.pdf`; public copy: https://telinekataja.fi/media/filer_public/b0/50/b050d79c-e4a0-4f69-868c-72d8031b08da/en_allround_catalogue_2021.pdf
- Layher Keder Roof XL Instructions for Assembly and Use, edition 01.2014: printed pages 6 and 24. Archived PDF: `../layher-keder-xl/Keder-Roof-XL-Manual-PDF.pdf`; Layher-hosted regional copy: https://www.layher.nl/-/media/LAYHER/Documentatie/05-Dak-en-Wandsysteem/English/ENG_montagehandleiding_Kederdach_2014.pdf
- Current Finnish Government Decree 205/2009: https://data.finlex.fi/fi/lainsaadanto/2009/205
- Repealed STM Decision 156/1998: https://finlex.fi/fi/lainsaadanto/1998/156

## Parametric scaffold geometry formula

Use a rectangular grid of standards indexed by `(i,j)`, with `m` bays along x and `r` bays along y. Let `l_i` be the selected x-bay centerline length, `b_j` the selected y-bay centerline width, and `h_k` the selected vertical lift between work levels.

### Node coordinates

For rosette level `k` and plan node `(i,j)`:

```text
X_0 = 0                         X_i = sum(l_a, a=1..i)
Y_0 = 0                         Y_j = sum(b_c, c=1..j)
Z_0 = chosen base datum          Z_k = Z_0 + sum(h_t, t=1..k)
P(i,j,k) = (X_i, Y_j, Z_k)
```

If every rosette-level step is used, `h_k = 0.50 m`. A work lift may span several rosette intervals: `h_lift = q * 0.50 m`, where integer `q >= 1`. Keep `rosette_pitch = 0.50 m` separate from `lift_height`.

### Dimension conversions

```text
L_centerline = sum(l_i, i=1..m)
B_centerline = sum(b_j, j=1..r)
```

For boundary standards of tube diameter `d = 0.0483 m`, with outside dimension measured face-to-face across only the end standards:

```text
L_out = L_centerline + d
B_out = B_centerline + d
L_clear_between_inner_faces = L_centerline - d
B_clear_between_inner_faces = B_centerline - d
```

These conversions describe standard-tube faces only. Add any projections beyond those faces separately to get the full outside envelope. Deck/work-area dimensions must come from the actual deck arrangement and placement, not from these post-face conversions.

### Component-count geometry for a complete rectangular grid

For `m` by `r` plan bays and `K` lift intervals, with horizontal ledger courses at all levels `k=0...K`, the idealized grid contains:

```text
standard_positions = (m+1) * (r+1)
x_ledgers_per_level = m * (r+1)
y_ledgers_per_level = r * (m+1)
ledger_courses = K+1
all_horizontal_ledger_spans = ledger_courses * (x_ledgers_per_level + y_ledgers_per_level)
```

This is a geometric span count, not a parts schedule: omit or change members only according to the selected approved configuration. It does not calculate standards' stock-piece lengths, ties, bracing, edge protection or structural capacity.

### Work deck area and diagonal geometry

If bay `i` has a continuous usable deck width `w_i` and usable deck length `a_i`, then:

```text
A_work = sum(a_i * w_i)
```

For a single face diagonal connecting opposite corners of a bay and one lift:

```text
diagonal_length = sqrt(l_i^2 + h_k^2)
```

For a plan diagonal across a rectangular bay:

```text
plan_diagonal_length = sqrt(l_i^2 + b_j^2)
```

These are endpoint-to-endpoint geometric lengths; the actual catalogue component, connection geometry and required bracing layout must be selected separately.

### One-dimensional facade example

For `m` façade bays of equal centerline length `l`, two standard rows, `K` lift intervals, and ledger courses at all levels `k=0...K`:

```text
L_centerline = m*l
standard_positions = 2*(m+1)
longitudinal_ledger_spans = 2*m*(K+1)
```

A user-defined sequence `n = 1..8` can set `L_centerline(n) = n*l`, but `l` must be a selected compatible system bay dimension. The catalogue does not define a universal `0.39 m` bay increment.

## Observed deck packing note (user-provided, 2026-10-28)

The user reports fitting 8 decks in a 2.50 m ledger/support span and 10 decks in a 3.07 m span, with 0.19 m wide decks inserted in some arrangements. Treat these as user-provided observed layouts; exact width sequences, clearances and axis/reference faces were not specified.

The 2021 catalogue's printed page 18 gives a separate U-ledger deck configuration table: at 2.50 m bay width, Variant A lists 5 x 0.32 m plus 1 x 0.61 m decks, and Variant B lists 4 x 0.19 m plus 5 x 0.32 m decks; at 3.07 m it lists 9 x 0.32 m decks. These table variants do not equal the reported 8/10 counts, so preserve the two data sources separately. To calculate working width or area for the user's observed layouts, record each actual deck width and gap, then use the sum of widths rather than deck count alone.
