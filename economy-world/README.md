# ECONOMY WORLD — Phase F

The living-economy Bedrock add-on. Design authority in `docs/`.

**Phase F:** death/medical settlement, closed-loop food demand, state-aware NPC dialogue, and a cash-only HUD on top of Phase E ownership. See `NOTES.md`.

## Setup
1. Node 20+ · Minecraft Bedrock
2. `npm install` · `npm test` · `npm run build` · `npm run deploy`
3. Flat world → Beta APIs → add Economy World BP

## Releases
- Installable builds are the `.mcaddon` assets on GitHub Releases; repository source ZIPs are not game-ready.
- Every phase tag (`v*`) runs tests, compiles `scripts/main.js`, verifies phase/version/assets before and after upload, and publishes a `.mcaddon`.

## Dev hooks
- `/scriptevent ew:dev help` prints every available command, grouped by phase.
- Tags: `ew:npc_jobs`, `ew:station_<trade>`, `ew:service_<trade>` plus Phase C tags

## Phase map
A ✅ → B ✅ → C ✅ → D ✅ → E ✅ → F ✅ → G ship

## Rules
- Money moves ONLY through `Ledger`
- Player sales pay physical cash through `cashOut`; wages deposit to bank
- Forms open ONLY through `safeShow`
- All numbers in `data/`
- Weekly world backups · console pass before UI ships
