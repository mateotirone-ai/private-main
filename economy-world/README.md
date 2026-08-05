# ECONOMY WORLD — Phase D

The living-economy Bedrock add-on. Design authority in `docs/`.

**Phase D:** extraction zones + staged nodes, processing stations, service customers, employment/payroll. See `NOTES.md`.

## Setup
1. Node 20+ · Minecraft Bedrock
2. `npm install` · `npm test` · `npm run build` · `npm run deploy`
3. Flat world → Beta APIs → add Economy World BP

## Dev hooks
- `/scriptevent ew:dev bank|dealer|commons|wallet|jobs|givewallet|stipend|grant|audit|shops|produce`
- `/scriptevent ew:dev shop stone_quarry` (any trade id)
- `/scriptevent ew:dev zone stone_quarry` registers a work zone at the player
- `/scriptevent ew:dev publiczone stone_quarry` registers a commons node zone
- `/scriptevent ew:dev station sawmill` · `/scriptevent ew:dev service general_store`
- Tags: `ew:npc_jobs`, `ew:station_<trade>`, `ew:service_<trade>` plus Phase C tags

## Phase map
A ✅ → B ✅ → C ✅ → D ✅ → E ownership → F death/NPCs/HUD → G ship

## Rules
- Money moves ONLY through `Ledger`
- Forms open ONLY through `safeShow`
- All numbers in `data/`
- Weekly world backups · console pass before UI ships
