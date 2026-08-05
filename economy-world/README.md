# ECONOMY WORLD — Phase B

The living-economy Bedrock add-on. Design authority: `docs/economy-world-master-design.md` (v7),
`docs/ui-design-system.md`, `docs/layer1-technical-spec.md`.

**Phase B:** UI kit + Bank NPC flows + physical cash + Commodity Dealer (mint + reserve + daily-capacity softening) + stipend stub.

See `NOTES.md` for the build summary and every ⚑ placeholder.

## What works right now
- Phase A: ledger, scheduler, state, audit, `ew:dev grant|audit`
- UI kit: Emerald tokens, P1/P2/P3/P4/P7, toast/actionbar, narrator voice table
- Bank: deposit / withdraw / transfer (flat fee) / statements
- Cash items `ew:cash_1/10/100/1000` — spawned only by Bank withdraw
- Dealer: sell gold & diamonds → `mint:dealer`, reserve++, capacity softening; prices board
- Stipend: `/scriptevent ew:dev stipend` (once)

## Setup (once)
1. Install Node 20+ and Minecraft (Bedrock).
2. `npm install`
3. `npm test` — ledger + bank fee + dealer capacity must be green
4. `npm run build` → bundles to `packs/economy_bp/scripts/main.js`
5. `npm run deploy` → copies packs into `com.mojang` development folders
6. Flat creative world → **Beta APIs** → add *Economy World BP* (RP auto-attaches)
7. Sanity:
   - `/scriptevent ew:dev grant` then `/scriptevent ew:dev bank`
   - Tag an NPC `ew:npc_dealer`, give yourself diamonds, interact, sell

## Dev loop
- `npm run watch` · `npm run deploy` · `/reload`
- `npm test` before every deploy

## Phase map
A ✅ skeleton → B ✅ bank+dealer → C pricing+trades → D work engines → E ownership →
F death/NPCs/HUD → G ship to the Realm.

## Rules
- Money moves ONLY through `Ledger`. New faucets/sinks get a tag and a test.
- All numbers live in `data/`, never in code.
- Weekly world backups. Console pass before any UI ships.
