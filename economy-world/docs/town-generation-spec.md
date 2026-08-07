# Economy World — Town Generation & Building System Specification

**Status: authoritative.** This document consolidates every design ruling on
structures, placement, upgrades, NPCs, extraction zones, streets, parcels, and
town seeding. Where this conflicts with older notes, this document wins.
Implement in the phases listed at the end. Every new number is a ⚑ tunable.
All established project laws remain binding: ledger-only money movement,
safeShow-only forms, NPC-spoken feedback over toasts, no raw IDs on player
screens, 2-step-max purchase flows, graceful insufficient-funds declines,
tests for every money path, updated NOTES.md with every ship.

---

## 1. Canonical structures and the capture pipeline

Buildings are hand-built by the designer in a capture world, captured with
vanilla structure blocks, and exported as `.mcstructure` files committed to:

```
packs/economy_bp/structures/ew/<name>_L<level>.mcstructure
```

**Naming convention (authoritative):** `<name>_L<level>` — `stone_quarry_L1`,
`stone_quarry_L2`, `stone_quarry_L3`, `real_estate_L1`, `church_L1`.
**A name WITHOUT an `L` suffix has no upgrade path:** houses are numbered
variants, not levels — `home_1`, `home_2`, `home_12`. Save captures under the
`ew:` namespace where possible (`ew:stone_quarry_L1`); the registry stores
each structure's exact identifier as captured, so bare/`mystructure:` names
from existing exports are acceptable and mapped in data. In this document
"tier" and "level" are synonyms; data uses `L<n>`.

The `.mcstructure` file is the single canonical form of every building.
First real set: the three stone quarry levels.

Verify structures resolve via `/structure load ew:<name>` AND via script
`StructureManager`, and that `npm run deploy` copies the structures folder.

### 1b. Build-time schematic ingestion (the converter lives in the repo)

Scripts cannot read arbitrary files at runtime (no filesystem access on
Bedrock/Realms), so imports happen at BUILD time:

- New repo folder `assets/schematics/` — dropping a Java `.schem` there makes
  it part of the catalog on the next `npm run build`.
- A build step ports the schem2mc converter (reference implementation
  provided in Python: Sponge v2/v3 parse, varint decode, full block-state
  mapping — stairs facing/half → weirdo_direction/upside_down_bit, slab
  halves/doubles, trapdoors, doors, pillar_axis, wall torches, hanging
  lanterns — plus Java→Bedrock id renames) and emits a native
  **`.mcstructure`** (little-endian NBT: size, block palette with states,
  indices) into `packs/economy_bp/structures/ew/` named from the file stem
  (`bakery_L1.schem` → `ew:bakery_L1`).
- Conversion report printed per file: skipped block entities (chest
  contents, sign text), default-faced containers, unmapped ids. Unmapped
  ids substitute visibly and loudly — never fail silently.
- Converted structures are ordinary registry entries — placement, rotation,
  upgrades, and NPC anchors work identically to captured ones.

## 2. The structure registry

New data file `data/structures.json` (documented in `docs/structures.md`).
One entry per structure:

- `id` — e.g. `ew:stone_quarry_L1` (the exact identifier as captured)
- `trade` + `level` (buildings without levels omit it — e.g. `home_7`)
- `padSize` — the reserved final-tier plot (stone quarry: 34×28 ⚑). The pad is
  identical across a trade's tiers; tiers are different structures stamped on
  the same pad.
- `anchor` — convention: structure origin corresponds to the pad's front-left
  corner. Per-entry `anchorOffset` correction (x,y,z) so capture boxes that
  weren't boxed identically can be aligned in data instead of re-captured.
- `front` — which face of the structure is the front (the gate side). Used for
  orientation and street frontage.
- `gateOffset` — position of the entrance/gate relative to origin. Used to draw
  the stub path to the street.
- `npcAnchors` — named spawn offsets, each with role + tags (section 5).
- `zones` — named regions relative to origin (work-zone volumes, and for the
  Real Estate Office: the Survey Floor region — origin + dimensions of the open
  interior floor rectangle).

## 3. Placement engine

- Dev command: `/scriptevent ew:dev place <trade>` — stamps that trade's T1
  structure at the player's position, **rotated so its front faces the
  player**, registers the business record, and stores `anchor + rotation +
  mirror` on the record permanently.
- **The Builder's Catalog (map-building placement menu):** a dev/creative
  tool item. Using it opens a safeShow form listing every structure in the
  registry by human name (grouped: trades / civic / homes / imports). Pick a
  building → placement mode: the next block you use the tool on is the
  target — the structure places there, front toward the player, and a
  confirm line offers rotation (rotate 90° / mirror / undo). `ew:dev undo`
  reverses the last catalog placement (clears its volume; terrain beneath is
  not restored — intended for prepared ground). Placements via the catalog
  can optionally register a business record (toggle on the form) or place
  structure-only for pure map dressing. Two interactions total: pick, then
  tap — consistent with the 2-step rule.
- Rotation: support 0/90/180/270 + mirror via StructureManager. **Every offset
  in the registry (NPC anchors, gate, zones, Survey Floor) must be transformed
  by the same rotation/mirror at placement.** Test all four rotations with
  NPCs landing correctly.
- Terrain: flat test world for now. (Grading/refusal rules from the placement
  doctrine come later with map integration.)
- **CPU successor spacing:** the successor currently spawns at +6,0,0, which
  now lands inside a 34×28 pad. Make the successor offset per-trade
  configurable (⚑) and default it beyond the pad edge.
- **Legacy deprecation — no more boxes.** The old placement paths (Phase D–G
  zone/pit/station stamps and seedtown's line placement) are SUPERSEDED:
  every flow that creates a business must route through the structure
  registry and place the real captured structure on its real pad. If a trade
  has no capture yet, the slot stays EMPTY — never fall back to a generated
  box, node square, or placeholder structure. Remove or dev-gate the legacy
  stamp commands so nothing can generate the old 9×9-style boxes.

## 4. Tier upgrades — full pipeline with visible construction

Owner orders the upgrade from the management panel (existing). Then:

1. **Payment:** cost debits the BUSINESS account. If short → graceful decline
   naming the shortfall (never a crash). Owners fund via the existing
   "Deposit funds to business" action.
2. **Site closes:** storefront clerk announces closure for renovation in its
   own voice; the building's NPCs despawn for the duration; clock-in is
   disabled; storefront unavailable.
3. **Construction dressing:** a scaffolding ring wraps the pad edge; 2–3
   material piles appear near the gate. Density ⚑.
4. **The building rises:** across the construction timer, stamp the TARGET
   tier's structure bottom-up in horizontal y-layer slices (read the structure
   contents via StructureManager; schedule layer bands proportionally across
   the timer). The old building being overwritten as the new one rises is
   correct — see the reset ruling (section 6).
5. **Completion:** place the final structure whole (guarantees a clean end
   state), clear scaffolding and piles, respawn NPCs at the NEW tier's
   anchors, apply the new tier's output/storage/slot multipliers, clerk
   announces reopening, world banner for a settlement's first T2 / first T3.
6. One construction per business at a time; panel shows target tier and time
   remaining throughout. Audit must stay drift=0 through
   place → buy → inject → upgrade.

## 5. Building NPCs and role-aware office routing

Every trade building spawns its cast from registry `npcAnchors` at placement
and after every tier stamp:

- **Storefront clerk** — at the counter. Tags: `ew:shop_<trade>`,
  `ew:biz_<id>`, one random personality tag. Existing storefront behavior.
- **Office clerk** — at the office desk. Interaction routes by role:
  - **Owner** → the owner management panel.
  - **Non-owner, not clocked in** → this business's JOB menu: the opening,
    the piece rate, clock in — right there. (Each building handles its own
    employment; the jobs board remains the world-wide listing only.)
  - **Clocked-in worker** → shift status: accrued earnings, clock out.
- Processing trades additionally spawn their station host; service trades
  their service host — same anchor system, existing tags.
- On upgrade stamping, despawn and respawn all of a business's NPCs at the new
  tier's anchors (the T2 desk is not where T1's was).

## 6. Extraction zones — the quarry pattern

Replaces the 3×3 node stamp for the stone quarry (and becomes the template
for other extraction trades later):

- **The work zone is the pit's exact footprint**, as a registered volume from
  the registry `zones` entry (transformed by placement rotation).
- Clocked-in workers can mine ANY block in the zone volume; each broken block
  credits piece-rate wages (existing ticker). Non-clocked players are denied
  (existing protection, extended to the volume).
- **An unbreakable staircase** is part of the authored pit (protected blocks
  defined as a zone or block-tag set) so access always survives a dug-out pit.
- **No permanent depth progression.** Regeneration restores the pit to the
  authored structure state — the capture is the canonical look it always
  returns to.
- **Regen gating:** regeneration for a business's zone begins only when
  (a) no one is clocked into that business AND (b) no player is inside the
  premises (pad bounds). Until both are true, broken blocks stay broken.
  Rock never regrows on camera; shift output is bounded by exposed rock.
- Implementation: on regen trigger, restore the zone volume from the current
  tier's structure contents (partial stamp of the zone region only).

## 7. Town layouts

Towns are placed from **10–15 hand-authored layouts** (start by shipping the
format + 2 examples; the designer authors the rest):

- New `data/town-layouts.json` + `docs/town-layouts.md`.
- A layout defines: required area, suitable biomes/regions, the street network
  (section 8), the plaza node, slots, and parcels (section 9).
- **Slots are roles, not buildings:** `civic`, `storefront`, `station`,
  `work_zone`, `house`, `commons` — each with offset, facing, footprint
  class. At seeding, the biome/surroundings decide which trade fills each
  storefront/work slot (forest → lumber+sawmill, water-adjacent → fishery,
  stone/hills → quarry+mine, flat grass → farm). A slot with no valid trade
  stays empty — correct, not an error.
- **Variation:** random layout choice among biome-valid candidates, random
  rotation (0/90/180/270), optional mirror, bounded jitter on house parcels.
- **Terrain fit:** survey the anchor area before committing — scan radius 80 ⚑,
  grid-sampled every 2 blocks ⚑, spread across ticks; refuse clearly if chunks
  are unloaded or no layout fits. Grade each slot pad before stamping.
- **Idempotency:** reseeding the same anchor must not duplicate or stack.
- **Capacity:** across the layout set, parcel/slot classes must cover EVERY
  pad size in the catalog (34×28 quarry down to the 6×6 kiosk) so any planned
  building can exist in some town. No single layout contains everything — a
  town holds what fits its biome and size; full coverage comes from expansion
  (section 11b). Parcels are NOT trade-locked: chartering decides what gets
  built, multiple businesses of the same trade in one town are legal
  (competition is designed in), and spare parcels beyond the initial slots are
  part of every layout.

## 8. Streets — hierarchy with organic character

- **Hierarchy:** main street (4 wide) → side lanes (3 wide) → stub paths
  (2 wide) auto-drawn from each building's `gateOffset` to the nearest lane.
- **Polylines, never grids.** Layouts author streets as polyline segments with
  bends. The systems must **preserve authored irregularity**: stubs join at
  the street's local angle; no snapping or axis-alignment of anything.
- Authoring style (for the layout docs): one bent main street that **swells
  into the plaza** rather than meeting a separate square; lanes leaving at
  off-square angles; varied building setbacks (1–3, inconsistent); the odd
  dead-end lane that terminates at a landmark (well, tree). References:
  RDR2's Valentine (one street does 90% of the work, industry anchoring one
  end), English village aerials (bends, tight frontages), medieval plans
  (anchor + radiating logic).
- **Surfaces:** era-tiered material sets ⚑ (Settlement: dirt-path/gravel core
  with cobble edging → upgrades with era per the road doctrine), lantern posts
  every N blocks ⚑, terrain-following height.
- **Density — towns are TIGHT.** A town must read as a living village, never
  scattered buildings in a field. Binding rules:
  - Parcels tile the street edge **contiguously** — adjacent parcels share
    boundary vegetation, no orphan gaps of unowned grass between them. Max
    gap between neighboring building side walls on the core street: ~3 ⚑.
  - Core setbacks 1–3 from the street line; storefronts shoulder to shoulder.
  - **Big pads live at the edges:** work-form trades with large pads (quarry
    34×28, mine, lumber camp, farm) anchor the ENDS of the main street or sit
    just outside the core — like Valentine's stockyards — with the farm's
    fields wrapping outside town. The street core is small-pad territory:
    bakery, store, bank, real estate, church, town hall, homes.
  - Target: a starter town's core fits within roughly 90×70 ⚑ — crossable on
    foot in under a minute.
  - Aliveness dressing belongs in layouts: the well, market stalls near the
    plaza, benches, lantern rhythm; ambient NPC crowd density scales with era
    (existing rule).

## 8b. Vegetation and greening

Towns must sit IN the landscape, green and grown-in — never a bald patch
with buildings:

- **Clearing:** seeding clears trees/vegetation only within streets, pads,
  and parcels plus a small margin, with an IRREGULAR feathered edge — the
  surrounding forest/meadow stays, so the town nestles into terrain rather
  than sitting in a clear-cut rectangle.
- **Authored greenery in layouts:** street trees at intervals along the main
  street (small oaks/birches, never giants), a plaza tree beside the well,
  flower beds around the plaza and church, grass strips between road edging
  and parcel hedges, flowers scattered along hedge lines, moss/leaf-litter
  patches for age.
- **Empty parcels are meadow, not dirt:** grass + wildflowers (noise-density,
  never uniform) + occasionally a lone fruit tree, until purchased — a
  mowed-meadow look that reads "land for sale," not "construction site."
- **Biome-matched flora table ⚑:** dressing uses the region's plants —
  spruce + ferns + podzol accents in the Timberlands, oak + tall flowers in
  the Heartlands, reeds/mangrove tones at Fen edges, sparse dead bushes in
  gold country. Same swap philosophy as building palette variants.
- All vegetation placement uses noise/jitter — nothing planted in rows except
  orchards/gardens deliberately authored as rows.
- (Later, ties to the aging ruling: unvisited areas slowly grow over — vines,
  taller grass — as the world-history layer.)

## 8c. Terrain conformance — towns terrace, never flatten

A town on sloped ground steps DOWN the slope; generation never planes a
site to one level:

- **Streets follow terrain:** the road surface tracks sampled ground height
  along the polyline with gentle grade smoothing — slabs and short stair
  runs where slope demands. Max street grade ⚑.
- **Per-pad local grading only:** each pad flattens to its OWN local level
  (median of its own ground), so a four-level site yields four terraces of
  buildings. Structures stay level inside their pads; the town steps.
- **Dressed seams:** where a pad cuts into a slope, finish the cut as a low
  retaining wall or planted embankment (the auto-mold doctrine at village
  scale). Stub paths between pads at different heights become stair runs.
- **Layout slope tolerance:** every layout declares max height variance ⚑.
  The survey measures the site; a flatland layout REFUSES a ragged site
  rather than bulldozing it. Steep-terrain layouts (mountain saddle town,
  staircase lanes) are authored FOR slopes and selected there.

## 9. Parcels and computed pricing

- Layouts define parcels flanking street segments. Data shape is
  polygon-ready; rectangles acceptable for v1. Each parcel: bounds, street
  frontage reference, area-band size class, status
  (available/owned/pending). **No two parcels alike** — varied dimensions
  within bands; wedge/L parcels legal (building fit test = the house
  rectangle must fit inside the polygon; leftover is yard).
- Seeding generates **vegetation boundaries** (hedges/bushes following the
  polygon edges exactly) and registers every parcel.
- **Pricing is computed, never config:** price = base per block² ⚑ ×
  main-street frontage factor ⚑ × plaza-distance factor ⚑ × waterfront bonus
  ⚑. The price is always shown with its ingredients.

## 10. The Survey Floor (Real Estate Office)

- The RE office structure entry carries a `surveyFloor` zone (open interior
  floor region). Map its tiles to the district's parcels at fitting scale.
- Tiles repaint live by status (color palette ⚑) on every sale/change.
- **Stand on a tile** → actionbar summary: parcel name/number, size class,
  area, computed price, status. **Use-key on the tile** → parcel form: BUY
  (2-step max), view owner, MERGE with an adjacent parcel you also own
  (existing merge ruling). Purchase: bank debit, deed registered to the
  player, tile repaints, RE clerk speaks confirmation. No raw parcel IDs
  on screen — human names/numbers.

## 11. Seeding modes and the founding sequence

- `seedtown survey` — the PLANNING pass: places the town as markers so the
  designer can walk and judge the bones before anything real generates.
  Streets pave in their REAL materials from day one (Settlement road mix:
  dirt/coarse-dirt/path core, gravel patches, cobblestone edging — the
  authored era-tier set ⚑). Every parcel's surface tiles in YELLOW CONCRETE;
  every building slot's foundation footprint overlays in BLUE CONCRETE at
  its anchor+rotation; growth points post in RED CONCRETE. Re-running
  `seedtown skeleton` or `full` at the same anchor replaces the markers with
  the real thing (idempotency rule) — survey → walk → adjust layout →
  promote.
- `seedtown skeleton` — places ONLY: streets (paved), parcels (registered,
  bounded, priced, purchasable immediately), town hall at the plaza, and the
  granted commons. The town is born as surveyed land + civic anchor; it fills
  in over time through parcel purchases, charters, and construction.
- `seedtown full` — skeleton + immediately executes the layout's trade
  charters (working CPU businesses on day one). For the map's starter towns
  and test worlds.
- Province founding (later) uses the skeleton path. **The Founder's Crown:**
  founding a province grants a wearable crown, auto-equipped at the founding
  ceremony (stake-walk → sky-camera confirm → crowned as the walls rise) —
  you are the king of that province. The crown belongs to the leadership
  OFFICE, not the person: it transfers with succession/receivership.
  Cosmetic, no armor value; golden-helmet placeholder until the art pass.

## 11b. Town expansion — growth points and district modules

Towns are born confined and GROW. The mechanism:

- **Growth points:** every layout authors its street dead-ends and edge stubs
  as `expansionAnchors` — position + outgoing direction. These are the roads
  that visibly "end" and invite continuation.
- **District modules:** a second library of small hand-authored layout
  fragments (`data/district-modules.json`, same format as layouts but
  anchored to a street joint): a residential close (lane + 6–10 house
  parcels), a market lane (lane + storefront parcels), an industrial yard
  (lane + 1–2 large work pads), a green/commons block. Modules declare their
  required area and suitable terrain, and are authored with the same organic
  character rules (bends, varied setbacks).
- **The expansion flow:** at the Town Hall the leader picks "Expand the
  town" → chooses a growth point → sees the module candidates that fit the
  terrain there (with the demand board's recommendation starred — RCI demand
  says WHICH kind of district the town needs) → treasury pays a computed
  price (base per block² of the module area ⚑) → construction: the road
  paves outward first, then parcels register with vegetation bounds. The
  module joins at the street's local angle; the old dead-end becomes a
  through-road; the module's own new dead-ends become tomorrow's growth
  points. Terrain survey + refusal apply as in section 7.
- **Survey Floor grows:** the RE office floor mosaic extends/rescales to show
  the new district. Office tier caps how much district it can display
  (existing Survey Floor scaling rule) — an expanding town eventually needs a
  bigger RE office, which is exactly right.
- **Walls:** new districts land OUTSIDE the current walls and stay there
  until the next era upgrade redraws the wall ring to enclose them
  (matches the walls-upgrade-with-era ruling). Outside-the-walls land is
  priced cheaper (⚑ factor) — real cities grew suburbs beyond the gates.
- Expansion is unbounded: any planned building can eventually exist in any
  town by expanding toward the space it needs.

## 12. Tests (minimum)

Structures resolve and place at all four rotations with NPCs/zones landing
correctly; anchor+rotation persist across reloads; upgrade completes the full
pipeline (pay → close → rise → stamp → respawn → announce) aligned on the
same pad; office routing per role; quarry zone mines only when clocked in,
regen restores authored state only after clock-out + empty premises; skeleton
seeding registers streets/parcels/pricing; Survey Floor buy → deed + repaint;
parcel merge; audit drift=0 through every money-touching flow above.

## 13. Implementation phases — ship and STOP at each

- **Phase 1:** registry + placement + orientation + successor spacing +
  building NPCs with role routing (sections 1–3, 5).
- **Phase 2:** tier-upgrade pipeline with algorithmic construction
  (section 4).
- **Phase 3:** quarry extraction rework (section 6).
- **Phase 4:** layouts + streets + parcels + Survey Floor + seeding modes
  (sections 7–11). Ship the formats + two example layouts; the full layout
  set is authored content, not code.
- **Phase 5:** town expansion (section 11b) — growth points, district module
  library + two example modules, the Town Hall expansion flow, Survey Floor
  extension, outside-the-walls pricing.

Each phase: tests green, NOTES.md updated with dev commands and the ⚑ table,
compiled .mcaddon release published and verified.
