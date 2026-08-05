# ECONOMY WORLD — Phase E

The living-economy Bedrock add-on. Design authority in `docs/`.

**Phase E:** ownership/buyout auctions, CPU successors, owner management panels, upgrades, and presence-aware production on top of Phase D work engines. See `NOTES.md`.

## Setup
1. Node 20+ · Minecraft Bedrock
2. `npm install` · `npm test` · `npm run build` · `npm run deploy`
3. Flat world → Beta APIs → add Economy World BP

## Releases
- Installable builds are the `.mcaddon` assets on GitHub Releases; repository source ZIPs are not game-ready.
- Every phase tag (`v*`) runs tests, compiles `scripts/main.js`, packages both packs, and publishes a `.mcaddon`.

## Dev hooks
- `/scriptevent ew:dev bank|dealer|commons|wallet|jobs|givewallet|stipend|grant|audit|shops|produce`
- `/scriptevent ew:dev shop stone_quarry` (any trade id)
- `/scriptevent ew:dev zone stone_quarry` stamps an employee test pit
- `/scriptevent ew:dev publiczone stone_quarry` stamps a public test pit
- `/scriptevent ew:dev station sawmill` · `/scriptevent ew:dev service general_store`
- `/scriptevent ew:dev need bakery` forces a service need on a loaded bakery host
- `/scriptevent ew:dev owner bakery` opens buyout/management for a trade (or pass a business id)
- Tags: `ew:npc_jobs`, `ew:station_<trade>`, `ew:service_<trade>` plus Phase C tags

## Phase map
A ✅ → B ✅ → C ✅ → D ✅ → E ✅ → F death/NPCs/HUD → G ship

## Rules
- Money moves ONLY through `Ledger`
- Player sales pay physical cash through `cashOut`; wages deposit to bank
- Forms open ONLY through `safeShow`
- All numbers in `data/`
- Weekly world backups · console pass before UI ships
