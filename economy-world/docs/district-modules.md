# District modules

Hand-authored expansion fragments for town growth (town-generation-spec §11b).
Same coordinate language as `data/town-layouts.json`: local X east / Z south,
polylines with bends, slots with pads, no grids.

## Shape

| Field | Meaning |
|---|---|
| `id` / `name` / `kind` | Stable id, display name, `residential` \| `industrial` \| … |
| `area` | `[width, depth]` footprint used for terrain survey + treasury price |
| `slopeToleranceY` | Max height variance before refuse (Phase 4 survey) |
| `connection.at` / `connection.dir` | Street joint in module-local space; snaps to a town growth point. `dir` is the module edge that faces back toward the existing town |
| `streets.lanes` | Polyline lanes (usually one 3-wide spur) |
| `growthPoints` | New dead-ends that become the next expansion anchors after this module lands |
| `slots` | Same roles as layouts (`house`, `work_site`, `parcel_empty`, `commons`, …) |

## Join rule

1. Translate so `connection.at` is the origin.
2. Rotate so `connection.dir` aligns with the growth point's outgoing `dir`.
3. Place at the growth point's world position (town rotation/mirror already applied to that point).
4. The old dead-end becomes a through-road as the module lane continues outward.

## Shipped examples

- **`residential_close`** — curved 3-wide lane, six house pads + one spare parcel + a small green/commons.
- **`industrial_yard`** — short lane to one 34×28 quarry-class work pad + two spare parcels.

## Authoring notes

- Keep bends and varied setbacks; never axis-align for neatness.
- Large work pads belong at the spur end, not on the core street.
- Every module must leave at least one new growth point so expansion can continue.
