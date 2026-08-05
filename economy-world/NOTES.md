# Economy World — NOTES

## Binding rules (forms & NPC hosts)

1. **`safeShow` is mandatory.** Every form open goes through `src/ui/safeShow.ts`. Direct `form.show(player)` is banned — Bedrock cancels with `UserBusy` while the player is mid-interact or in chat; `safeShow` retries every 5 ticks for up to ~100 ticks (~5s). All pattern builders (`menuHub`, `confirmTxn`, `catalog`, `managePanel`, `progressPanel`) already route through it; future screens must too.
2. **Villagers/traders cannot host shops.** Entities with vanilla interact UIs win the interaction; our form never appears (silent, no error). Shop/NPC hosts must be the Bedrock **NPC entity** or custom entities. Villager *look* comes later via skinning — not via `minecraft:villager` hosts.
3. **Closing/canceling forms is silent.** No narrator and no toast on X/Back/Cancel, `UserClosed`, or `safeShow` timeout. Narrator lines are reserved for transactions, denials, and milestones.
4. **Payouts round once on the total.** Never floor or round each unit. Freelancer, dealer, service, and piece-rate math all calculate the complete amount first.
5. **Player sales settle as physical cash.** Dealer, commons, and freelancer sales enter the ledger, immediately use `cashOut`, then pack into an existing wallet or spawn notes. Bank balances do not rise. Piece-rate wages are the sole current direct-to-bank exception.
6. **NPC interactions speak.** Confirmations and denials inside an NPC-opened flow use a name-tagged chat line from that NPC. Toasts are reserved for item/system events. P2 receipts remain forms.

## Phase E (current)

Built against `docs/layer1-technical-spec.md` §4.7–4.9 and the master design. Ownership is now live on top of the Phase D work rails.

### Phase C live-test fixes included
- **Toasts:** subtitle-only rendering avoids Bedrock's intrinsically oversized title font. White copy plus a small status-color marker is capped at `42` characters with `2/100/10` tick timing. Overflow shortens only at word boundaries.
- **Silent UI close:** removed `Voice.cancelled` from `menuHub`, `confirmTxn`, and `managePanel` cancellation paths.
- **Wallet partial extraction:** `Unpack amount` slider → P2 confirmation listing exact note denominations. Pack-all and unpack-all remain quick actions.
- **Wallet asset:** verified `packs/economy_rp/textures/items/wallet.png` is a 16×16 RGB PNG and is wired as `ew_wallet`.
- **Generated bundle:** `packs/economy_bp/scripts/main.js` is ignored and removed from git tracking; `npm run build` recreates it.
- **Rounding:** freelancer/commons and dealer payout totals now round once at the end.
- **Dev production:** `/scriptevent ew:dev produce` forces one CPU production tick.
- **Interaction debug:** temporary `playerInteractWithEntity` console log removed.

### Phase D systems
- **Extraction:** authored employee/public test pits stamp and persist exact node positions. Only those positions produce output; arbitrary matching blocks are inert. Nodes regenerate through per-trade spent-rock costumes back to their ready block. Fishing uses interactable `ew:fishing_spot` nodes.
- **Processing:** physical station hosts tagged `ew:station_<trade>`; panel separates business raw/refined stock from personal inventory, shows live seconds/progress, and queues slider-selected batches sequentially. Recipes: sawmill, smeltery, bakery.
- **Service:** record-driven CPU customer needs hosted by `ew:service_<trade>` entities; serving consumes stock, applies active-service margin, and transfers system customer funds into the business through `Ledger`.
- **Employment:** `ew:npc_jobs` job board, clock-in/out P2 flows, per-trade/tier piece rates, live `+N · total N` actionbar accrual, and output-total settlement directly to bank at clock-out. Extraction, processing, and service output all accrue.
- **Company tools:** clock-in issues a named/lore-marked, inventory-locked, keep-on-death tool. Tier quality controls tool material plus Unbreaking level. Company tools only work for their owner on that business's registered nodes; clock-out/death reclaims them. Personal tools remain unrestricted.
- **Owner presence:** CPU 10%, offline owner 50%, active owner 100%, with fractional production carried between ticks.
- **Work content:** `data/work.json` contains block/recipe/good mappings; all numeric tuning remains in `data/matrix.json`.

### Phase D live-test rulings
- **Piece rate replaces time wages:** payout is `round(rate × total shift output)` once. Positive output is guaranteed at least 1 merid; zero output pays zero. The hourly sweep and elapsed-time fields were removed.
- **Exact node stamping:** zone creation stamps the matrix-authored 3×3 test pit and records every node ID/location. Existing world blocks are never adopted.
- **Property protection:** employee nodes cancel break/interact attempts from players not clocked into that business and show `This is [business] property — clock in first.` Public nodes remain open.
- **Stage costumes:** each extraction trade maps depleted/recovering blocks in `data/work.json`; all are cracked stone/deepslate and cobblestone-family blocks. Obsidian and valuable-looking stage blocks are banned.
- **State migration:** pre-ruling extraction zones are discarded on load and must be stamped again, preventing legacy region-adopted nodes from surviving.
- **Physical sale rail:** storefront freelancer, commons, and dealer payouts are `transfer/mint → cashOut → wallet/notes`; conservation stays auditable. The Financial-era direct-bank sale unlock is intentionally not built.
- **Teaching denials:** wrong-goods messages identify the destination business; e.g. `I sell lumber — raw logs go to the Lumber Camp.`
- **NPC feedback:** `withNpcSpeaker` keeps nested forms in the initiating NPC's speech context; system/item flows continue using toasts.
- **Service host discovery:** the need spawner is registered unconditionally during boot, scans loaded player dimensions every cadence for `ew:service_<trade>` tags, and persists exact host IDs. Dev/event service routes also register synthetic hosts.
- **Service test hook:** `/scriptevent ew:dev need <trade>` discovers loaded tagged hosts and immediately attaches one need, allowing bakery/service testing without waiting.

### Phase E ownership systems
- **Business model migration:** business state now persists tier `1|2|3`, owner account, configurable price override, accrued revenue balance, revenue history cache, employee stubs, construction/upgrade state, and successor lineage.
- **Appraisal + buyout:** owner panel computes valuation from tier base + inventory + recent revenue + upgrade spend and runs an immediate sealed-bid auction (player vs bank vs CPU). Losing bids do not charge; player wins settle via `sink(..., "sink:buyout")`.
- **CPU successor:** when a player wins a buyout, a CPU successor business is seeded for the same trade while the purchased business becomes player-owned under a distinct business id.
- **Owner management panel (P4 rails):** owner can collect earnings, set bounded market-price multiplier, add/remove employee stubs, and start tier upgrades funded by business account (`sink:construction`).
- **Upgrade scheduler:** upgrades queue with tier-target durations, complete asynchronously, and apply new tier output multipliers once construction ends.
- **Presence scaling:** offline owner output now rises with employee stub count up to a configured cap below active owner output; CPU remains fixed at 10%.
- **Business-ID routing:** entity tags can now target explicit businesses with `ew:biz_<businessId>`, allowing successor/player storefront separation without hardcoding `cpu_<trade>` assumptions.

### Phase D entry points
- `/scriptevent ew:dev jobs`
- `/scriptevent ew:dev zone <extraction_trade>` at the zone center
- `/scriptevent ew:dev publiczone <extraction_trade>` for a commons node zone
- `/scriptevent ew:dev station <processing_trade>`
- `/scriptevent ew:dev service <service_trade>`
- `/scriptevent ew:dev need <service_trade>` to force one need
- Tags: `ew:npc_jobs`, `ew:station_<trade>`, `ew:service_<trade>`

### Readability / computed-value conformance sweep
| Screen / surface | Current ruling |
|---|---|
| Bank hub + deposit/withdraw/transfer/statements | One fact per line; computed fee/totals; balances formatted; NPC feedback speaks |
| Dealer sell | Quantity, current effective price, and `You receive: N merids — cash`; no base/config-rate disclosure |
| Dealer prices | Current unit value only; reserves separate; narrator last |
| Storefront hub | Current stock/buy price and computed per-unit cash sell payout; no percentage |
| Storefront freelancer P2 | Exact total cash receipt; bank before/after intentionally unchanged |
| Commons hub + P2 | Cash rule stated; exact total receipt; wrong goods name the destination |
| Employment/job board | Human-readable per-unit earnings; accrued output/total; no hourly fields |
| Processing station | Business raw/refined, personal item count, explicit stock ownership, live seconds, sequential queue |
| Service customer | Need, business, and computed order total on separate lines |
| Wallet | Pack/unpack amounts and denominations; item/system feedback remains toast |
| Toasts | Blank title + fixed-size white subtitle, status marker only carries color, 42-character cap, 5-second hold, no mid-word clipping |
| NPC confirmations/denials | Name-tagged chat speech; no competing toast |

### Phase D tests
- `test/nodes.test.ts` — regen timing, exact stamp positions, employee/public access, spent-rock/obsidian costume guard
- `test/processing.test.ts` — input reservation, due-time output, insufficient input, sequential multi-batch completion
- `test/employment.test.ts` — per-unit rates, positive-output floor, total rounding, ledger transfer/audit
- `test/businesses.test.ts` — owner-presence multipliers and fractional production
- `test/toast.test.ts` — complete-word shortening and oversized-token fallback
- `test/pricing.test.ts` / `test/dealer.test.ts` — binding total-rounding regression coverage
- `test/salesCash.test.ts` — freelancer/dealer cashOut conservation and journal path
- `test/companyTools.test.ts` — marker, tier configuration, node restriction, clock-out/death reclaim policy
- `test/service.test.ts` — exact host attachment and whole-order rounding

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

## ⚑ Placeholders (Phase B–E)

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
| `ui.toast.*` | subtitle `42` chars, timing `2/100/10` ticks | Third live-test pass: title font overflowed; docs give no numeric limits |
| `work.nodeStampOffsets` | 3×3 pit, spacing `2`, depth `-1` (`9` nodes) | Authored test-pit count/layout not specified |
| `work.nodeStages` | depleted `100`, ready `300` ticks | Visible staging is locked; timing is not |
| `work.processingSweepTicks` | `20` | Processing job polling cadence not specified |
| `work.processingTicksPerSecond` | `20` | Platform conversion stored in data so UI never hardcodes seconds |
| `work.processing.sawmill` | `2 log → 4 lumber`, `200` ticks | Ratios/timing not quantified |
| `work.processing.smeltery` | `2 iron ore → 1 iron`, `300` ticks | Ratios/timing not quantified |
| `work.processing.bakery` | `3 wheat → 2 bread`, `160` ticks | Ratios/timing not quantified |
| `work.service.spawnEveryTicks` | `600` | Customer cadence not specified |
| `work.service.requestQtyMin` / `requestQtyMax` | `1` / `4` | Service order-size range not specified |
| `work.service.largeOrderChance` | `0.08` | Large-order incidence is unspecified |
| `work.service.largeOrderQtyMin` / `largeOrderQtyMax` | `6` / `10` | Large-order size band is unspecified |
| `work.service.activeMarginBonus` | `0.2` | Active margin must beat passive; exact bonus absent |
| `work.employment.pieceRateByTradeTier` | quarry `2/3`; ore `4/6`; precious `25/35`; lumber `2/3`; crop `1/2`; sawmill `3/5`; smeltery `6/9`; bakery `3/4`; fishery `2/3`; store `2/3` | Per-trade tier piece rates are not quantified |
| `work.employment.toolQualityByTier` | tier 1 → `1`; tier 2 → `2` | Company-tool quality/Unbreaking scale not quantified |
| `work.employment.offlineEmployeeStep` / `offlineEmployeeCap` | `0.12` / `0.9` | Employee lift and offline cap are behavior-only in docs |
| `ownership.revenueWindowTicks` / `revenueHistoryCap` | `24000` / `128` | Revenue cache window/cap not quantified |
| `ownership.tierOutputMultiplierByTier` | t1 `1`, t2 `1.35`, t3 `1.7` | Phase E tier output bonuses not quantified |
| `ownership.evaluation.*` | see `data/matrix.json` | Valuation component weights/factors are unspecified |
| `ownership.auction.*` | see `data/matrix.json` | Bank/CPU bid spread and luck-boost envelope are unspecified |
| `ownership.management.priceOverride*` | `0.8`–`1.25` | Owner price bounds are policy-level, not numeric |
| `ownership.management.maxEmployeeSlots` | `4` | Employee stub cap not specified |
| `ownership.management.employeeSlotHireCost` | `250` | Stub-slot hire fee not specified |
| `ownership.management.upgradeCostByTradeTier` | see `data/matrix.json` | Phase E trade-tier upgrade costs not numerically specified |
| `ownership.management.upgradeDurationTicksByTier` | t2 `2400`, t3 `3600` | Upgrade durations are behavior-only in docs |
| `ownership.management.successorSpawnOffset` | `(6, 0, 0)` | Successor storefront placement offset is unspecified |

### Dealer soften formula (Phase B, unchanged)
```
mult(soldToday) = 1 - min(1, soldToday / capacity) * (1 - softFloor)
payout = round(Σ base * mult(soldToday + i)) for i in 0..qty-1
```

---

## Phase B archive (kept for history)

Ledger-only bank/dealer, cash denoms 1/10/100/1000, stipend stub, Emerald UI kit P1–P4/P7.
