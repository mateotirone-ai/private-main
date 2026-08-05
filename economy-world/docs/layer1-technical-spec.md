# ECONOMY WORLD — Layer 1 Technical Spec
*v1 — the build document. Cursor executes this, ticket by ticket. Design authority: Master Doc v7 + UI Design System.*

---

## 1. Layer 1 Scope

**Ships:** the playable economy in one starter town on a temporary flat/test world (real terrain arrives when the map's ready — code and map develop in parallel).

**In:** the merid + ledger + bank (deposit/withdraw/transfer/statements; NO loans yet), physical cash items, commodity dealer (mint) + reserve tracking, pricing engine v1, the 10 launch trades (CPU-run + buyout), extraction + processing + service work engines (movement waits for Layer 3's multiple towns), employment (clock-in, wages, payroll), freelancing + commons, business tiers T1→T2 only (proves the upgrade pipeline; deeper tiers are content), stipend, death + medical bills + bank-safety split, hunger economy (food has value), NPC framework (dealer/banker/foremen/shopkeeps + dialogue v1), HUD permanent layer + actionbar, toasts, the seven UI patterns (P1–P4, P7 needed for L1), plot registry + placement engine + structure loading, conservation audit.

**Explicitly out (resist the urge):** provinces, roads/rail, auctions beyond bank/CPU buyout offers, loans, exchange, employees-as-NPCs hiring UI (solo + freelancers is enough to prove the loop), robbery, aging, demand boards, NPC residents. Every one has a designed home in Layers 2–5.

**Definition of done:** two players + CPUs can each take a different trade, earn, bank, buy out a business, upgrade it to T2, and out-compete the CPU — on a Realm, from a console, for a fun hour.

---

## 2. Technical Foundation

- **Packs:** one Behavior Pack (`economy_bp`) + one Resource Pack (`economy_rp`), versioned together, `min_engine_version` = current stable.
- **Scripting:** `@minecraft/server` (+ `@minecraft/server-ui`), TypeScript, bundled via esbuild to a single `main.js`. Repo layout:
```
economy/
  packs/economy_bp/{manifest.json, entities/, items/, structures/, scripts/main.js}
  packs/economy_rp/{manifest.json, textures/, ui/, font/ (glyphs), sounds/}
  src/            # TS source
    core/         # ledger, registry, tick scheduler, audit
    systems/      # bank, dealer, pricing, trades, work, employment, death
    content/      # trade configs, tier tables, dialogue templates, price data
    ui/           # the seven pattern builders + theme constants
  tools/          # structure export scripts, data validators
  data/           # THE TIER & COST MATRIX + price tables (json, hot-editable)
```
- **Experimental toggles:** enable Beta APIs on the dev world; verify each API used is stable-channel before Realm deploy (stable-only is the ship bar).
- **Dev loop:** local world with `/reload`, one command (`ew:dev`) opening a debug menu (grant merids, force tick, teleport to zones, dump state).

## 3. Data Architecture

**All state in world dynamic properties, namespaced, JSON-serialized, versioned (`schema: 1`) with a migration shim from day one.**

- `ew:ledger` — the money. `{ accounts: {playerId: balance}, businessAccounts: {bizId: balance}, totalMinted, totalSunk, faucetLog[], sinkLog[] }`. EVERY mutation goes through `Ledger.transfer()/mint()/sink()` — the only three functions that touch balances. Mint is called from exactly one site (dealer purchase + stipend + system payouts, each tagged).
- `ew:players` — per player: skill XP by track, citizenship placeholder, record placeholder, stipendClaimed, home anchor.
- `ew:businesses` — per business: trade, tier, owner (CPU|playerId), storage `{good: qty}`, storageCap, revenue history ring buffer, appraisal cache, workZoneId, restock config.
- `ew:plots` — the registry: id, anchor, rotation, maxFootprint, currentStructure, type, owner, reservedZones.
- `ew:prices` — per town (L1: one town): per good `{base, current, target, stock, band:[floor,ceil], driftRate}`.
- `ew:reserve` — `{goldUnits, diamondUnits, circulation}` (circulation ≡ ledger totals; audit asserts it).
- **Physical cash:** custom items `ew:cash_1/10/100/1000`; bank converts; cash is real inventory (lossable). Anti-counterfeit: cash items carry no crafting recipe; only `Bank.withdraw()` spawns them; audit counts world cash on interval vs ledger's `cashOutstanding`.

**Tick scheduler** (`core/scheduler.ts`) — one `system.runInterval` master loop dispatching: price tick (10 min), CPU restock (per-business config), payroll (on clock-out + hourly sweep), construction timers, regen nodes (per-node timers batched), audit (game-day), autosave journal.

## 4. System Specs (build in this order)

**4.1 Ledger + audit** — the three functions, the logs, the nightly identity check (`totalMinted − totalSunk ≡ Σbalances + cashOutstanding`), mismatch → console alarm + journal dump. *Everything else depends on this; it ships first and gets tests.*

**4.2 Plot registry + placement engine** — registry CRUD; structure load (`structure` command via script, ticking area walk); build-protection events (cancel + toast on reserved zones); staged construction timer (queue of segment loads). Foundation pass (terrain molding) is DEFERRED to the real map phase — flat test world doesn't need it; the interface (`Site.validate()`, `Site.prepare()`) is stubbed now so it slots in later.

**4.3 UI kit** — theme constants (Emerald tokens), glyph font wiring, the pattern builders: `menuHub()`, `confirmTxn()` (always shows balance-after), `catalog()`, `managePanel()`, `progressPanel()`. Toast + actionbar helpers with the narrator-voice string table. Every later system uses ONLY these.

**4.4 Bank + dealer** — Bank NPC (P1 hub → deposit/withdraw/transfer/statement); Dealer NPC (sell precious → `Ledger.mint()`, reserve increments, daily-capacity price softening; prices board via P7). Stipend: one-time claim at tutorial exit stub.

**4.5 Pricing engine** — the tick: `current += current * driftRate * pressure` where `pressure = clamp((target − stock)/target, −1, 1)`, clamped to band. Config-driven from `data/prices.json`. Dealer tier: tighter band, slower drift, price = mint policy hook (constant in L1).

**4.6 Trades + CPU businesses** — `data/trades.json` configs (the 10); CPU production tick (storage += rate to cap); storefront NPC per business (P3 buy / P2 freelancer sell at cfg rate); business account settles through Ledger.

**4.7 Work engines** — *Extraction:* work zones (region + node list), regen nodes as custom blocks with stage states (visual process — even on the test world), clock-in via foreman NPC (P2), tracked break events inside zone → business storage + wage accrual, actionbar earnings ticker. *Processing:* station blocks (load via P2/direct interact, timer, output), input consumed from business storage, refined goods priced above raw in data. *Service:* CPU customer spawner (interval + demand-weighted good requests), serve via dialogue (P2 variant), active-service margin bonus per config.

**4.8 Employment + freelancing** — job board (P5-lite: the town's businesses with openings = all CPU businesses), clock-in/out, fixed wage tables from Matrix, payroll from business account (CPU accounts float — they're system-backed in L1). Commons zones = work-zone tech, no clock-in, sell-to-business flow only.

**4.9 Ownership** — buyout flow at foreman (P2 with appraisal shown), owner management panel (P4: view storage/revenue; set store prices within band), CPU-competitor persists at its rate, T1→T2 upgrade (requirements: production milestone + merids; staged build swaps structure), AFK tier: owner-online check per business tick (100% / 50% / CPU 10%).

**4.10 Death + survival economy** — death event: drop-all stays vanilla, medical bill = flat + % of (cash+bank) sunk via Ledger, respawn anchor = home stub (spawn point in L1), toast with itemized bill in narrator voice. Food: bakery/farm goods restore hunger; vanilla free-food faucets neutered per vanilla-surgery rulings (config list of disabled loot/drops).

**4.11 NPC framework** — NPC entity wrapper (spawn from registry, dialogue attach), dialogue v1: template table + state slots (`{good}`, `{price}`, `{playerName}`, `{ownerName}`) + personality filter tag; gossip lines read the price table. Full memory/gossip depth is L2+ content — the ENGINE ships now.

**4.12 HUD** — wallet chip (JSON-UI element bound to a scoreboard mirror of cash count), actionbar contexts, skill-XP bar mapping, danger skull DEFERRED (no PvP zones until provinces — flag rendered but always-off in L1).

## 5. Structure Library (L1 build list)

Per building: T1 + T2, one biome palette (starter town's), on final-size pads: 10 trade buildings ×2 tiers, bank, dealer, commons props, tutorial hall shell, 3 catalog homes ×1 tier. ≈ 30 structures. Export via structure blocks from the dev-build world; `tools/export.md` documents the naming convention (`ew_<building>_<tier>_<palette>`).

## 6. Tier & Cost Matrix (skeleton — ALL NUMBERS PLACEHOLDER `⚑`)

| Thing | T1→T2 price | Build time | Req | Notes |
|---|---|---|---|---|
| Each of 10 trades | ⚑ 5,000 | ⚑ 30 min | ⚑ prod. milestone | per-trade rows in data/matrix.json |
| Buyout price base | ⚑ 2,500–15,000 by trade | — | — | appraisal formula weights ⚑ |
| Wage/hr by tier | ⚑ 60 | — | — | freelance = 45% ⚑ |
| Stipend | ⚑ 250 | — | once | |
| Medical | ⚑ 100 + 2% | — | — | |
| Homes (3) | ⚑ 800/2,000/4,500 | ⚑ 5–30 min | plot fits | |

The real file is `data/matrix.json`; this table just fixes the SHAPE. Tuning happens live on the Realm.

## 7. Build Order (the tickets)

**Phase A — skeleton (foundation):** repo + bundler + packs boot on dev world → Ledger + audit + tests → scheduler → plot registry + structure load + protection.
**Phase B — money moves:** UI kit → bank NPC flows → cash items → dealer + reserve + stipend.
**Phase C — the economy breathes:** pricing tick → trades/CPU businesses + storefronts → commons.
**Phase D — work is real:** extraction engine + regen nodes → processing stations → service customers → employment/payroll.
**Phase E — ownership:** buyouts → owner panel → T2 upgrades → AFK tiers.
**Phase F — a world, not a sandbox:** death/bills → food economy + vanilla surgery configs → NPC dialogue v1 → HUD polish.
**Phase G — ship:** starter-town assembly on test terrain → 2-player Realm test (CONSOLE controller pass on every screen) → tuning sweep on matrix.json → friends invited.

Each phase = a Cursor working session or two. A phase is done when its checklist demo runs on the Realm from an Xbox.

## 8. Test Plan

- Unit-ish: Ledger invariants (property test the audit identity), pricing clamps, appraisal math — plain-TS tests run in Node against extracted pure modules.
- Integration: scripted dev-world scenarios via `ew:dev` (mint → buy → work → upgrade → die → audit passes).
- The Console Gate: no phase ships without the Xbox pass (UI law).
- Economy soak: 48h Realm idle with CPU-only — prices stay in bands, audit stays green, no property bloat (dynamic property size logged).

## 9. Standing Rules During Build

Design questions that surface mid-build get answered AGAINST the master doc, logged in its Details Ledger — never improvised silently. All numbers live in `data/`, never in code. Weekly world backup from day one of the dev world. The spec updates when reality wins an argument.
