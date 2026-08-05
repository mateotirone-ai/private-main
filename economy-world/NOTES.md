# Economy World — NOTES

## Binding rules (forms & NPC hosts)

1. **`safeShow` is mandatory.** Every form open goes through `src/ui/safeShow.ts`. Direct `form.show(player)` is banned — Bedrock cancels with `UserBusy` while the player is mid-interact or in chat; `safeShow` retries every 5 ticks for up to ~100 ticks (~5s). All pattern builders (`menuHub`, `confirmTxn`, `catalog`, `managePanel`, `progressPanel`) already route through it; future screens must too.
2. **Villagers/traders cannot host shops.** Entities with vanilla interact UIs win the interaction; our form never appears (silent, no error). Shop/NPC hosts must be the Bedrock **NPC entity** or custom entities. Villager *look* comes later via skinning — not via `minecraft:villager` hosts.
3. **Closing/canceling forms is silent.** No narrator and no toast on X/Back/Cancel, `UserClosed`, or `safeShow` timeout. Narrator lines are reserved for transactions, denials, and milestones.
4. **Payouts round once on the total.** Never floor or round each unit. Freelancer, dealer, service, and wage math all calculate the complete amount first.

## Phase D (current)

Built against `docs/layer1-technical-spec.md` §4.7–4.8 and the master design. Stopped at Phase D (no Phase E).

### Phase C live-test fixes included
- **Toasts:** bold status-colored title, white subtitle, short couch-legible lines, longer stay time. Overflow is shortened only at complete-word boundaries; an oversized single token becomes `Update` rather than being clipped.
- **Silent UI close:** removed `Voice.cancelled` from `menuHub`, `confirmTxn`, and `managePanel` cancellation paths.
- **Wallet partial extraction:** `Unpack amount` slider → P2 confirmation listing exact note denominations. Pack-all and unpack-all remain quick actions.
- **Wallet asset:** verified `packs/economy_rp/textures/items/wallet.png` is a 16×16 RGB PNG and is wired as `ew_wallet`.
- **Generated bundle:** `packs/economy_bp/scripts/main.js` is ignored and removed from git tracking; `npm run build` recreates it.
- **Rounding:** freelancer/commons and dealer payout totals now round once at the end.
- **Dev production:** `/scriptevent ew:dev produce` forces one CPU production tick.
- **Interaction debug:** temporary `playerInteractWithEntity` console log removed.

### Phase D systems
- **Extraction:** registered spherical employee and public commons work zones, clocked-in business-storage credit or public item yield, staged `ew:node_depleted` → `ew:node_recovering` → original ready block regeneration, actionbar output/wage feedback. Fishing uses interactable `ew:fishing_spot` nodes.
- **Processing:** physical station hosts tagged `ew:station_<trade>`; raw stock is consumed once, timed jobs complete into refined business stock. Recipes: sawmill, smeltery, bakery.
- **Service:** record-driven CPU customer needs hosted by `ew:service_<trade>` entities; serving consumes stock, applies active-service margin, and transfers system customer funds into the business through `Ledger`.
- **Employment:** `ew:npc_jobs` job board, clock-in/out P2 flows, output tracking, fixed tier wages, hourly sweep plus clock-out settlement. Every payment is `Ledger.transfer`.
- **Owner presence:** CPU 10%, offline owner 50%, active owner 100%, with fractional production carried between ticks.
- **Work content:** `data/work.json` contains block/recipe/good mappings; all numeric tuning remains in `data/matrix.json`.

### Phase D entry points
- `/scriptevent ew:dev jobs`
- `/scriptevent ew:dev zone <extraction_trade>` at the zone center
- `/scriptevent ew:dev publiczone <extraction_trade>` for a commons node zone
- `/scriptevent ew:dev station <processing_trade>`
- `/scriptevent ew:dev service <service_trade>`
- Tags: `ew:npc_jobs`, `ew:station_<trade>`, `ew:service_<trade>`

### Phase D tests
- `test/nodes.test.ts` — depleted/recovering/ready timing and visible transitions
- `test/processing.test.ts` — one-time input consumption, due-time output, insufficient input
- `test/employment.test.ts` — fixed wage, total rounding, ledger transfer/audit
- `test/businesses.test.ts` — owner-presence multipliers and fractional production
- `test/toast.test.ts` — complete-word shortening and oversized-token fallback
- `test/pricing.test.ts` / `test/dealer.test.ts` — binding total-rounding regression coverage

## Phase C archive

### Hotfixes
- `tools/deploy.mjs` — prefers Xbox-app path `AppData/Roaming/Minecraft Bedrock/Users/Shared/games/com.mojang`, falls back to UWP Store path.
- `src/main.ts` — `system.run(boot)`; all `world.afterEvents` + `system.afterEvents` subscriptions moved inside `boot()` (no module-top-level world use).

### UI amendment A1.1–A1.4 retrofit (every Phase B screen)

| Screen / surface | Fixes |
|---|---|
| **Bank hub** | Facts first (`Balance: N`); narrator quoted last; bare amounts |
| **Deposit (P2)** | One-fact lines; `merids` on payout; bare balance lines; narrator last |
| **Withdraw (P2)** | Same A1.1–A1.4 pattern |
| **Transfer (P2)** | Recipient / send / fee as separate facts; no inline fee math in one line |
| **Statements (P7)** | Balance fact first; narrator last; comma amounts in entries |
| **Dealer hub** | Data fact + narrator last |
| **Sell gold (P2)** | `Selling:` / `Price:` / `Payout:` stacked; no `80 × ~69 (base 100)` |
| **Sell diamonds (P2)** | Same as sell gold |
| **Prices today (P7)** | Reserve facts first; unit notes; narrator last |
| **Toasts** (deposit/withdraw/transfer/dealer/stipend/error) | `money()` → `N merids` with thousands separators; no coin/Ⓐ glyph |
| **Theme `money()`** | A1.3 commas + A1.4 plain text (amendment overrides UI law §7 glyph rule) |

Pattern builders updated: `menuHub`/`confirmTxn`/`catalog`/`progressPanel` take `facts` + `narrator` and use `bodyWithNarrator`.

### Phase C systems
- **Pricing engine** (`pricingMath.ts` + `pricing.ts`) — §4.5 tick; mint-tier gold/diamond pinned to base
- **CPU trades** (`data/trades.json` + `businesses.ts`) — 10 trades, produce-to-cap tick, system-backed accounts
- **Storefronts** (`storefront.ts`) — P3 buy / P2 freelancer sell; tag `ew:shop_<trade>` or `/scriptevent ew:dev shop <trade>`
- **Commons** (`commons.ts`) — woodlot / quarry pit / forage sell-to-matching-business; tag `ew:npc_commons`
- **Wallet** (`ew:wallet`) — packs/unpacks notes; withdraw prefers wallet; deposit drains wallet + loose notes

### Tests
- `test/pricing.test.ts` — pressure, band clamps, mint-tier flags, freelance payout
- `test/businesses.test.ts` — 10 CPU seeds, producePerTick, storageCap
- Prior ledger/bank/dealer tests still green

### Wallet — open questions (not invented)
- Max wallet capacity?
- Does wallet drop on death with its balance (vs bank-safe)?
- Auto-grant wallet at stipend/tutorial exit, or craft/buy only?
- Multi-wallet: merge rules if two wallets exist?

---

## ⚑ Placeholders (Phase B–D)

| Key | Value | Why ⚑ |
|---|---|---|
| `bank.transferFee` | `5` | Master §13 tuning |
| `dealer.dailyCapacity.gold` | `64` | Soften volume not quantified |
| `dealer.dailyCapacity.diamond` | `16` | Same |
| `dealer.softFloor` | `0.5` | Soften floor not specified |
| `cash.walletDefaultExtract` | `100` | Partial-extraction slider default not specified |
| `trades.*.producePerTick` / `storageCap` | see `data/trades.json` | Master §13 “CPU restock rates” |
| `cpuProduceEveryMinutes` | `10` | Aligned to price tick; not locked |
| `fishery` trade + buyout `2200` / t2 | matrix + trades.json | Layer1 says 10 trades; Phase A matrix had 9 |
| `prices.goods.fish` | base `4`, etc. | Needed for fishery |
| `ui.toast.*` | title `28`, subtitle `52`, timing `3/60/8` ticks | UI docs require legibility but give no numeric limits |
| `work.zoneRadius` | `24` blocks | Work-zone shape/size not quantified |
| `work.nodeStages` | depleted `100`, ready `300` ticks | Visible staging is locked; timing is not |
| `work.processingSweepTicks` | `20` | Processing job polling cadence not specified |
| `work.processing.sawmill` | `2 log → 4 lumber`, `200` ticks | Ratios/timing not quantified |
| `work.processing.smeltery` | `2 iron ore → 1 iron`, `300` ticks | Ratios/timing not quantified |
| `work.processing.bakery` | `3 wheat → 2 bread`, `160` ticks | Ratios/timing not quantified |
| `work.service.spawnEveryTicks` | `600` | Customer cadence not specified |
| `work.service.requestQty` | `2` | Order size not specified |
| `work.service.activeMarginBonus` | `0.2` | Active margin must beat passive; exact bonus absent |
| `work.employment.ticksPerHour` | `72000` | Real-time payroll hour conversion not locked |

### Dealer soften formula (Phase B, unchanged)
```
mult(soldToday) = 1 - min(1, soldToday / capacity) * (1 - softFloor)
payout = round(Σ base * mult(soldToday + i)) for i in 0..qty-1
```

---

## Phase B archive (kept for history)

Ledger-only bank/dealer, cash denoms 1/10/100/1000, stipend stub, Emerald UI kit P1–P4/P7.
