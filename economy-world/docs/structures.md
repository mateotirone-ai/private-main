# Structures Registry

`data/structures.json` is the authoritative structure registry used by Phase 1 placement.

## Entry shape

Each object in `structures[]` supports:

- `id`: exact structure identifier to load (for example `ew:stone_quarry_L1`).
- `trade`: optional trade id for business-linked structures.
- `level`: optional structure level (`1`, `2`, `3`) for upgradeable trades.
- `padSize`: `[width, depth]` reserved footprint.
- `anchor`: capture convention marker (`front-left-pad-corner`).
- `anchorOffset`: `[x, y, z]` correction applied to anchor if the capture box origin drifted.
- `front`: one of `north|east|south|west`, used to face buildings toward the placer.
- `gateOffset`: `[x, y, z]` entrance offset for future street stubs.
- `npcAnchors`: named `[x, y, z]` offsets such as `storefront` and `office`.
- `zones`: named zone payloads (for example `work_pit`).

## Schematic auto-registration

`npm run build` converts every `assets/schematics/**/*.schem`. If
`data/structures.json` has no row for the resulting `ew:<file-stem>` id, the
build appends one with:

- `padSize`: the non-air X/Z footprint plus a one-block margin on every side,
- `front`: `south`,
- `anchorOffset`: `[0, 0, 0]`,
- `gateOffset`, `storefront`, and `office`: `TODO`.

The build never edits an existing registry row. Its per-file report states
whether the row was `auto-added` or already `existing`.

## Successor spacing

`successorOffsetByTrade` drives buyout successor placement offsets:

- Trade-specific key first (`stone_quarry`, etc).
- Fallback key: `default`.

## TODO behavior

If any offset field is `TODO` or malformed, runtime **skips and warns**:

- placement continues where possible,
- unresolved anchors do not crash gameplay,
- warnings are written to the content log for data-fix follow-up.
