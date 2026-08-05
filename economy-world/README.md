# ECONOMY WORLD — Phase C

The living-economy Bedrock add-on. Design authority in `docs/`.

**Phase C:** pricing tick + 10 CPU trades/storefronts + public commons + wallet carry. See `NOTES.md`.

## Setup
1. Node 20+ · Minecraft Bedrock
2. `npm install` · `npm test` · `npm run build` · `npm run deploy`
3. Flat world → Beta APIs → add Economy World BP

## Dev hooks
- `/scriptevent ew:dev bank|dealer|commons|wallet|givewallet|stipend|grant|audit|shops`
- `/scriptevent ew:dev shop stone_quarry` (any trade id)
- Tags: `ew:npc_bank`, `ew:npc_dealer`, `ew:npc_commons`, `ew:shop_<trade>`

## Phase map
A ✅ → B ✅ → C ✅ → D work engines → E ownership → F death/NPCs/HUD → G ship

## Rules
- Money moves ONLY through `Ledger`
- All numbers in `data/`
- Weekly world backups · console pass before UI ships
