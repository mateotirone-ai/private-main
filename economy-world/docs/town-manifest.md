# Town manifest format

Phase G adds data-driven town seeding through `/scriptevent ew:dev seedtown [townId]`.

Town manifests live in `data/towns.json`:

- `id`: unique town id used by `seedtown [townId]`
- `dimensionId`: target dimension for fixed anchors
- `anchor`: either `{ "mode": "player" }` or `{ "mode": "fixed", "x": 0, "y": 64, "z": 0 }`
- `placement.surfaceScanUp` / `placement.surfaceScanDown`: terrain scan bounds used to place hosts/zones on real ground
- `defaults`:
  - `npcTypeId`: host entity type (use `minecraft:npc`)
  - `personalityTag`: default dialogue personality tag
  - `markerTag`: per-town marker used to re-find seeded entities
- `civics`: bank/dealer/commons/jobs hosts
- `storefronts`: one host per trade with shop, biz, and owner tags
- `stations`: processing station hosts (`ew:station_<trade>`)
- `serviceHosts`: service hosts (`ew:service_<trade>`)
- `workZones`: extraction pits, each with `public: true|false`

Example shape:

```json
{
  "id": "starter",
  "dimensionId": "minecraft:overworld",
  "anchor": { "mode": "player" },
  "placement": { "surfaceScanUp": 24, "surfaceScanDown": 48 },
  "defaults": {
    "npcTypeId": "minecraft:npc",
    "personalityTag": "ew:personality_practical",
    "markerTag": "ew:town_starter"
  },
  "civics": [{ "id": "bank", "roleTag": "ew:npc_bank", "offset": { "x": 0, "y": 0, "z": 0 }, "nameTag": "Meridian Central Bank" }],
  "storefronts": [{ "trade": "stone_quarry", "offset": { "x": -18, "y": 0, "z": 16 } }],
  "stations": [{ "trade": "sawmill", "offset": { "x": -18, "y": 0, "z": 28 } }],
  "serviceHosts": [{ "trade": "general_store", "offset": { "x": 4, "y": 0, "z": 28 } }],
  "workZones": [{ "trade": "stone_quarry", "public": false, "offset": { "x": -24, "y": 0, "z": -10 } }]
}
```

Notes:

- Seeded hosts are re-used by marker tag and teleported on repeated runs, so `seedtown` is repeatable.
- Work zones are restamped each run for deterministic extraction pits.
- Service hosts are registered immediately so customer needs can spawn without waiting for discovery.
