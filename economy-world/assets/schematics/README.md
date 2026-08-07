Drop Java Sponge .schem files here. `npm run build` converts each to a
native .mcstructure in packs/economy_bp/structures/ew/ named from the file
stem (bakery_L1.schem -> ew:bakery_L1), with full block-state mapping per
docs/town-generation-spec.md section 1b. If the converted id is not already
in data/structures.json, the build appends a starter row with a one-block pad
margin and TODO gate/NPC anchors. Existing rows are never changed. Conversion
reports identify every auto-added row.
