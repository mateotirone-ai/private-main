# ECONOMY WORLD — Phase G

The living-economy Bedrock add-on. Design authority in `docs/`.

**Phase G:** ship prep with data-driven starter-town seeding, first-join onboarding, multiplayer race hardening, and tuning/console audit outputs. See `NOTES.md`.

## Setup
1. Node 20+ · Minecraft Bedrock
2. `npm install` · `npm test` · `npm run build` · `npm run deploy`
3. Flat world → Beta APIs → add Economy World BP

## Releases
- Installable builds are the `.mcaddon` assets on GitHub Releases; repository source ZIPs are not game-ready.
- Every phase tag (`v*`) runs tests, compiles `scripts/main.js`, verifies phase/version/assets before and after upload, and publishes a `.mcaddon`.

## Dev hooks
- `/scriptevent ew:dev help` prints every available command, grouped by phase.
- `/scriptevent ew:dev seedtown [townId]` places a full starter town from `data/towns.json`.
- Tags: `ew:npc_jobs`, `ew:station_<trade>`, `ew:service_<trade>` plus Phase C tags

## Phase map
A ✅ → B ✅ → C ✅ → D ✅ → E ✅ → F ✅ → G ✅ ship prep

## Rules
- Money moves ONLY through `Ledger`
- Player sales pay physical cash through `cashOut`; wages deposit to bank
- Forms open ONLY through `safeShow`
- All numbers in `data/`
- Weekly world backups · console pass before UI ships
