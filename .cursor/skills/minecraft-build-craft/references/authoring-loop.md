# Authoring loop (adapted from recipe builders)

Source ideas from mattzh72's recipe/preview loop, mapped onto this repo's
Bedrock capture + schematic pipeline.

## Why a recipe mindset

Professional builds are composed from reusable operations, then refined.
Even when the final file is a structure-block capture, author as if writing a
small program:

```text
create pad → foundation → hollow shell → roof → openings →
landmark → props → lighting → measure anchors
```

## Suggested helpers (design or code)

Use these operations in notes or generators:

- `fillBox(min, max, block)`
- `hollowBox(min, max, block)` — walls only
- `frameRect` — corner posts + top plate
- `eaveRing` — slab/stair border around a roof edge
- `bayWindows(axis, spacing, width, height)`
- `column(x, z, y0, y1, block)`
- `disc` / `cylinder` for tanks, silos, kilns (trade landmarks)
- deterministic `pick(x,y,z, weightedBlocks)` for clutter

Keep every write inside `[0..sizeX)`, `[0..sizeY)`, `[0..sizeZ)`.

## Iteration cycle

1. **Brief** — program, pad, palette, landmark (see main skill).
2. **Block-out** — massing only in 1–2 materials.
3. **Read check** — would a player guess the trade from 20 blocks away?
4. **Facade pass** — rhythm, depth, door emphasis.
5. **Interior pass** — circulation, counter/office, storage.
6. **Dress pass** — props + lighting only after the above read well.
7. **Anchor pass** — measure gate, storefront, office, work zones from the
   finished geometry; update `structures.json`.
8. **Validate** — `npm run build && npm test && npm run verify:pack` in
   `economy-world/` when assets changed.

## Preview options in this repo

Preferred:

- In-game: deploy pack, `/structure load ew:<name>`, walk the pad.
- Catalog/dev place tools if enabled in `ew:dev`.

Acceptable when Bedrock is unavailable:

- Describe the layered pass results honestly.
- Diff the schematic/registry output.
- Do **not** claim visual parity with a reference.

Optional Java preview (only if the user asks): Lodestone/mineflayer workflows
from the upstream skills can be used as a scratchpad, then export `.schem`
into `economy-world/assets/schematics/`. They are not the shipping pipeline.

## Recipe → asset mapping

| Recipe output | Repo landing zone |
|---|---|
| Structure-block export | `packs/economy_bp/structures/ew/<stem>.mcstructure` |
| Sponge schematic | `assets/schematics/<stem>.schem` |
| Design brief only | PR notes / docs — no fake binary |

`<stem>` must match registry id without `ew:` (`bakery_L1`, `stone_quarry_L2`).

## Palette discipline checklist

Before finishing a pass:

- [ ] ≤5 primary materials + ≤2 accents
- [ ] stair/slab/wall/fence cousins match the family
- [ ] roof material distinct from wall field
- [ ] landmark uses accent, not the whole building
- [ ] same palette language survives L1→L3 with enrichment, not replacement chaos

## Bounds and facing checklist

- [ ] Origin = front-left-pad-corner (unless documented otherwise)
- [ ] Front face matches registry `front`
- [ ] Gate on the front edge / pathable
- [ ] NPC hosts on solid floor, outside walls
- [ ] Work zones clear of storefront/office tiles
- [ ] All four rotations considered for offsets
