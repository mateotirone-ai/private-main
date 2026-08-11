---
name: minecraft-building
description: Build, import, register, validate, and test Minecraft Bedrock structures and towns in Economy World. Use when asked to create or modify a building, schematic, mcstructure, town layout, structure registry entry, placement anchor, NPC anchor, work zone, or building tier.
---

# Minecraft building for Economy World

Work with this repository's Bedrock structure pipeline. Do not introduce a
Java/Paper/Mineflayer server unless the user explicitly requests a separate Java
Edition workflow.

The add-on is under `economy-world/`. Run all `npm` commands there.

## Read before editing

Read only the documents relevant to the requested change:

- `economy-world/docs/town-generation-spec.md` for capture conventions,
  placement, rotation, streets, and parcels.
- `economy-world/docs/structures.md` for registry fields and schematic import.
- `economy-world/docs/town-manifest.md` for NPCs, stations, services, and work
  zones.
- `economy-world/assets/schematics/README.md` for Java `.schem` ingestion.

Inspect similar entries in `economy-world/data/structures.json` and existing
assets in `economy-world/packs/economy_bp/structures/ew/` before creating a new
one.

## Choose the asset path

Use one of these supported paths:

1. **Native Bedrock capture:** place a structure-block export at
   `economy-world/packs/economy_bp/structures/ew/<name>.mcstructure`.
2. **Sponge schematic import:** place `<name>.schem` in
   `economy-world/assets/schematics/`. `npm run build` converts it to a native
   `.mcstructure`.

Do not commit a renamed or fabricated binary as an `.mcstructure`. If no real
structure asset is available, limit the change to a documented registry/layout
proposal or add a generator only when the user requests one.

The old `.mcfunction` construction files and `tools/schem2mc.py` are not the
primary pipeline.

## Naming and geometry

- Use structure ids such as `ew:<trade>_L1`, `ew:<trade>_L2`, and
  `ew:<trade>_L3` for upgradeable businesses.
- Keep the filename equal to the id without the `ew:` namespace.
- Use `front-left-pad-corner` as the normal capture anchor.
- Coordinates are `[x, y, z]`; X is east/west, Y is vertical, and Z is
  south/north.
- Include clearance in `padSize`; schematic auto-registration calculates the
  non-air X/Z footprint plus a one-block margin.
- Keep tiers aligned to a stable entrance and footprint unless the design
  explicitly requires relocation.
- Check all four rotations when changing anchors, gates, zones, or placement
  math.

## Register a building

`economy-world/data/structures.json` is authoritative. A complete entry normally
contains:

```json
{
  "id": "ew:example_L1",
  "trade": "example",
  "level": 1,
  "padSize": [16, 20],
  "anchor": "front-left-pad-corner",
  "anchorOffset": [0, 0, 0],
  "front": "south",
  "gateOffset": [8, 0, 21],
  "npcAnchors": {
    "storefront": [8, 1, 17],
    "office": [5, 1, 14]
  },
  "zones": {}
}
```

Offsets are relative to the structure anchor. Confirm them against the actual
asset; do not guess and present them as verified.

The schematic importer auto-adds a missing registry row, but leaves
`gateOffset`, `storefront`, and `office` as `"TODO"`. After every schematic
build:

1. Inspect the generated `.mcstructure`.
2. Inspect the `data/structures.json` diff.
3. Replace TODO values only from known geometry or in-game measurement.

Existing registry rows are never updated automatically. Unresolved or malformed
offsets are intentionally skipped with warnings at runtime.

## Town work

- Edit active town manifests in `economy-world/data/towns.json`.
- Treat `economy-world/data/town-layouts.json` as design data until a runtime
  loader exists; do not claim that changing it alters gameplay.
- Preserve deterministic offsets and stable marker tags.
- Keep NPC hosts on accessible floor blocks and outside walls.
- Keep entrances connected to paths and work zones clear of storefront and
  office anchors.

The `seedtown` developer command may be gated during registry migration. Check
`economy-world/src/main.ts` before recommending it as an available test path.

## Build and validate

Install dependencies only when they are missing, then run:

```bash
cd economy-world
npm run build
npm test
npm run verify:pack
```

`npm run build` can generate assets and mutate the structure registry during
schematic ingestion, so inspect the working-tree diff afterward.

Relevant focused tests include:

- `test/structures.test.ts`
- `test/structureAssets.test.ts`
- `test/schematicIngestion.test.ts`
- `test/structurePlacementMath.test.ts`
- `test/towns.test.ts`

Add or update tests when changing conversion, registry validation, or placement
behavior. Do not weaken asset checks to make an incomplete building pass.

## In-game verification

When Bedrock is available, deploy with `npm run deploy`, then verify the native
asset with `/structure load ew:<name>`. Use `/scriptevent ew:dev help` to confirm
the currently enabled developer commands before invoking one.

For trade structures, test placement from multiple player facings and check:

- front and entrance orientation;
- pad clearance and terrain height;
- storefront and office anchor positions;
- work/protected zone boundaries;
- tier replacement or successor spacing;
- repeat placement and undo behavior.

`npm run deploy` targets Windows Bedrock development-pack folders. On Linux or a
cloud agent, build and test, then state clearly that in-game visual verification
was not performed.

## Building quality

Translate the request into a footprint, height, palette, facade rhythm,
entrances, interior circulation, lighting, and surrounding negative space before
authoring geometry. Reuse a small coherent material palette and reserve visual
detail for entrances, rooflines, windows, and trade-specific landmarks.

For a reference-based build, compare proportions and distinctive features
against the reference after each visual pass. Never claim a build matches a
reference based only on registry metadata or successful automated tests.

## Repository rules

- Keep gameplay numbers in `economy-world/data/`.
- Route money through `Ledger`.
- Open forms through `safeShow`.
- Avoid unrelated runtime or economy changes while adding structure assets.

This workflow was informed by the public
[`minecraft-builder-skill`](https://github.com/wzhaoMS/minecraft-builder-skill),
but is adapted for this repository's Bedrock add-on and native structure
pipeline.
