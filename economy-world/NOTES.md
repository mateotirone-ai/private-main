# Economy World — NOTES

## Binding rules (forms & NPC hosts)

1. **`safeShow` is mandatory.** Every form open goes through `src/ui/safeShow.ts`. Direct `form.show(player)` is banned — Bedrock cancels with `UserBusy` while the player is mid-interact or in chat; `safeShow` retries every 5 ticks for up to ~100 ticks (~5s). All pattern builders (`menuHub`, `confirmTxn`, `catalog`, `managePanel`, `progressPanel`) already route through it; future screens must too.
2. **Villagers/traders cannot host shops.** Entities with vanilla interact UIs win the interaction; our form never appears (silent, no error). Shop/NPC hosts must be the Bedrock **NPC entity** or custom entities. Villager *look* comes later via skinning — not via `minecraft:villager` hosts.
3. **Closing/canceling forms is silent.** No narrator and no toast on X/Back/Cancel, `UserClosed`, or `safeShow` timeout. Narrator lines are reserved for transactions, denials, and milestones.
4. **Payouts round once on the total.** Never floor or round each unit. Freelancer, dealer, service, and piece-rate math all calculate the complete amount first.
5. **Player sales settle as physical cash.** Dealer, commons, and freelancer sales enter the ledger, immediately use `cashOut`, then pack into an existing wallet or spawn notes. Bank balances do not rise. Piece-rate wages are the sole current direct-to-bank exception.
6. **NPC interactions speak.** Confirmations and denials inside an NPC-opened flow use a name-tagged chat line from that NPC. Toasts are reserved for item/system events. P2 receipts remain forms.

## Phase G (current)

Built against `docs/layer1-technical-spec.md` §4.7–§7 and the master design. Survival/dialogue/HUD from Phase F remain live, and Phase G now focuses on end-to-end playability, starter-town bootstrap, onboarding, multiplayer correctness, and ship audit outputs.

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
- **Appraisal + buyout:** the storefront shows tier, storage, inventory value, recent revenue, and valuation before an open ascending auction. Bank/CPU/player standing bids remain visible; only a winning player settles through `sink(..., "sink:buyout")`.
- **CPU successor:** when a player wins a buyout, a CPU successor business is seeded for the same trade while the purchased business becomes player-owned under a distinct business id.
- **Owner management panel (P4 rails):** owner can collect earnings, set bounded market-price multiplier, add/remove employee stubs, and start tier upgrades funded by business account (`sink:construction`).
- **Upgrade scheduler:** upgrades queue with tier-target durations, complete asynchronously, and apply new tier output multipliers once construction ends.
- **Presence scaling:** offline owner output now rises with employee stub count up to a configured cap below active owner output; CPU remains fixed at 10%.
- **Business-ID routing:** entity tags can now target explicit businesses with `ew:biz_<businessId>`, allowing successor/player storefront separation without hardcoding `cpu_<trade>` assumptions.

### Phase F systems
- **Death + medical:** every player death computes `round(flat + pct × (bank + carried cash))` once, sinks up to the available bank balance with `sink:medical`, leaves vanilla inventory/cash drops intact, and shows the itemized receipt after respawn. No Phase-F debt is created.
- **Respawn:** native personal bed/house spawn remains authoritative, with Minecraft world spawn as the built-in fallback. Company tools are reclaimed and employment is settled as before.
- **Food economy:** bakery bread and fishery cod are real vanilla edible items, so hunger creates purchases and stock pressure. Completed consumption is recorded for demand/dialogue. Farmable animal/fish drops and village food chests are replaced by configured empty loot tables; Economy World work nodes/businesses are the authorized supply.
- **Dialogue v1:** `data/dialogue.json` supplies personality-filtered market/service/civic templates. NPC tags `ew:personality_practical`, `ew:personality_wry`, and `ew:personality_neighborly` render live `{good}`, `{price}`, `{playerName}`, `{ownerName}`, `{stock}`, and `{recentEvent}` slots.
- **Recent events:** storefront sales/supply, buyouts, construction, food consumption, and medical bills feed a bounded persisted event ring used by NPC gossip.
- **HUD:** `ew_cash` mirrors wallet + loose physical cash only; bank balance never appears. One priority manager owns the actionbar (`service > employment > construction > default`) and always retains the cash chip. `ew_skill` maps the Layer-1 skill-license score to the XP level. The danger hook is present but always off until PvP zones exist.
- **Storefront buyout:** CPU storefronts show `This business is for sale`, display live evaluation, and start the open ascending auction from the shopkeeper. Owners see management at their storefront. The `owner` dev command remains a shortcut only.
- **Pack cleanup:** deploy now deletes destination development-pack folders before copying, preventing removed Phase D custom node JSON from surviving. Existing development packs must be replaced once; old world blocks from obsolete `ew:node_*` pits require a fresh world or manual cleanup.
- **Release verification:** release CI inspects source packs, nested `.mcpack` files, and the re-downloaded GitHub asset for Phase/version markers, compiled `main.js`, wallet resolution, and banned node references.

### Phase E/F live-test fix batch
- **Custom-item reload persistence:** the BP manifest declares both `data` and `script` modules. Pack verification fails if either disappears, and reclaim logic can remove only configured company-tool item types—never `ew:wallet` or `ew:cash_*`.
- **HUD cash chip:** `hud_screen.json` merges a persistent `ew_wallet_chip` directly into `hud.root_panel`. A hidden, zero-duration `ewcash:` title update preserves cash-only text through the global title binding while job/service text stays on the normal actionbar. The same `loose notes + wallet balance` total feeds both this bridge and the `ew_cash` mirror; no bank value enters either. Toasts temporarily pause hidden updates so receipts remain readable. Tests and release verification assert the complete merge/prefix/preserved-binding chain.
- **Graceful debits:** every player-triggered debit is preflighted and catches `LedgerError`. Business declines use `Stone Quarry can't cover this — 5,000 needed, 0 available.`-style language instead of unhandled promise rejections.
- **Owner capital:** management includes `Deposit funds to business`, transferring personal bank funds to the business account with `owner:capital`. Businesses still pay construction from their own accounts.
- **Open auction:** the bank opens from evaluation, the player raises visibly, CPU/bank counters are visible, the player may walk away each round, and the configured round cap ends bidding. The rare bank luck boost can re-enter only in later rounds.
- **Public labels:** player screens use `[Trade] — owned by [name]`; internal business IDs remain state-only.
- **Plain statements:** journal kinds/tags are translated to player language, e.g. `Medical bill — 1,062 merids` and `Business deposit — 500 merids`.
- **World firsts:** first player-owned business and first Tier-3 business are persisted and broadcast to the whole world. The same banner rail is reserved for the later province milestone.

### Phase G ship prep
- **Data-driven starter town:** `data/towns.json` defines civic hosts, all ten storefronts, processing stations, service hosts, and extraction/public work zones. `/scriptevent ew:dev seedtown [townId]` now places and reuses tagged hosts on real terrain via surface scanning.
- **Town docs:** `docs/town-manifest.md` documents manifest shape, anchor modes, placement scan bounds, host tags, and repeatable seeding behavior.
- **First-join onboarding:** initial spawn now guarantees wallet issuance and stipend delivery on the physical-cash rail (`mint:stipend -> cashOut -> wallet/notes`) plus a per-player checklist actionbar from jobs-board visit to first paycheck.
- **Multiplayer hardening:** one buyer at a time per business auction; service needs are claim-gated per host; storefront and processing both revalidate state after confirmation; extraction nodes reserve harvest before deferred mutation; unpaid payroll sessions stay open instead of being deleted.
- **State durability:** ledger now flushes on a short cadence when new journal entries exist, reducing crash-loss windows between major operations.
- **Controller/couch pass (Phase G scope):**
  - Storefront buy no longer forces a detail interstitial tap before confirm.
  - Service needs render human-readable good names.
  - Construction durations now render as seconds/minutes instead of raw ticks.
  - **Flagged for restructuring:** open ascending auction still exceeds the <=3-tap loop target by design; a condensed one-screen raise flow is required before Realm invite.

### Town-generation spec alignment (Phase 1)
- Imported authoritative `docs/town-generation-spec.md` and seeded `data/structures.json` + `data/town-layouts.json`.
- **Structure registry live:** placement resolves captured ids (`ew:stone_quarry_L1/L2/L3`) with front-face orientation and persisted `anchor + rotation + mirror`.
- **Builder's Catalog tool:** new item `ew:builders_catalog`; use opens a 2-step placement flow (pick in form, then tap target block). Optional business registration is available for trade level-1 entries.
- **Successor spacing:** per-trade `successorOffsetByTrade` now drives successor site placement (default and stone quarry at `40,0,0`), transformed by the source site's rotation/mirror.
- **Role-aware office route:** office NPC tag path now routes owner -> owner panel, non-owner -> business-specific clock-in menu, clocked-in worker -> shift status/clock-out.
- **Legacy stamp deprecation:** `/scriptevent ew:dev zone`, `/publiczone`, and legacy `seedtown` stamping are dev-gated with migration warnings; no old box/pit stamps are generated through those paths.

### Town-generation Phase 2 — tier upgrade construction pipeline
- **Order + payment:** owner management `Upgrade level` debits the business account (`sink:construction`); insufficient funds decline names needed/available/shortfall. Funding remains `Deposit funds to business`.
- **Site closes:** storefront clerk announces renovation in its own voice; all business NPCs despawn; open shifts are force clocked-out; storefront / clock-in / processing / service / extraction for that business are closed while `construction` is set.
- **Dressing:** scaffolding ring around the pad edge + 2–3 material piles near the gate (`ownership.construction.*` ⚑).
- **Rise:** ownership sweep stamps the TARGET level structure bottom-up in horizontal y-layer bands via `StructureManager` (layer schedule proportional to the construction timer). Overwrite during the rise is intentional.
- **Completion:** final whole-structure stamp at the stored `anchor + rotation + mirror`, clear scaffolding/piles, respawn NPCs at the new level's registry anchors, apply L2/L3 output/storage/employee-slot multipliers, clerk announces reopen, settlement-first L2/L3 world banner.
- **Constraints:** one construction per business; owner panel shows target level, time remaining, and placed layers throughout.
- **Tests:** `test/construction.test.ts` covers proportional layer scheduling, closed-site gating, tier capacity multipliers, settlement firsts, and audit drift=0 through inject → construction sink.

### Town-generation Phase 3 — extraction-zone rework (quarry pattern)
- **Zone data:** `structures.json` zones are concrete volumes — `work_pit` / `protected_stairs` with `boxes: [[x1,y1,z1,x2,y2,z2], …]` relative to structure origin at rotation 0 (y may be below grade). Transformed at runtime by the site's stored rotation/mirror (same math as NPC anchors). Seed placeholders for stone_quarry L1–L3; other extraction trades stay data entries later.
- **Mining:** `world.beforeEvents.playerBreakBlock` — stairs always cancel; pad + not clocked-in cancels with NPC denial; work_pit + clocked-in credits piece-rate + business storage only when the broken block matches the current level's authored permutation (`structureManager.get`); placed dirt re-breaks earn nothing; vanilla drops suppressed on credited breaks; outside pad untouched.
- **Regen:** eligible only when zero workers clocked into the business AND zero players on the pad; clock-in or pad entry cancels the pending timer; after `work.pitRegenDelayTicks` (⚑, default 1200 = 60s) restore only the `work_pit` volume via StructureManager temp slices. Level upgrades overwrite the pit (reset ruling) and re-derive zones from the new level registry entry.
- **Dev:** `ew:dev regen <businessRef>` force-restores now; `ew:dev pitinfo` dumps business/zone/clocked-in/regen state for the pad you stand in.
- **Tests:** `test/extractionPit.test.ts` — stairs protect, pad denial, authored credit once, non-authored no credit, regen gating, four rotations, upgrade re-derive, audit drift=0 through wage settlement.

### Town-generation Phase 4 — layouts, streets, parcels, Survey Floor
- **Golden fixture:** `data/town-layouts.json` Layout 01 `heartlands_crossroads` drives all seeding. Missing captures leave slots empty (warn once); `ew:home_5` TODO gate stays skip-and-warn.
- **Modes:** `ew:dev seedtown <survey|skeleton|full> [layoutId]` at the player. Survey = real Settlement streets + yellow parcel / blue slot / red growth markers. Skeleton = streets + registered priced parcels + town-hall/commons slots (empty if no capture). Full = skeleton + registry fills (e.g. `stone_quarry` → work_site, `home_5` → house). Re-seed at the same anchor replaces cleanly.
- **Streets:** polyline raster (core + cobble edging), plaza ellipse, well, lanterns every N ⚑, stub paths (2 wide) from gate/front to nearest street at the street's local angle — no snapping.
- **Terrain:** grid-sample every 2 blocks; refuse unloaded chunks or variance > `slopeToleranceY`. Per-pad median grading + cobble retaining edges. Streets follow ground.
- **Greening:** clear only streets/pads/parcels + feathered margin; empty parcels = meadow (grass + noise flowers from biome flora ⚑); street trees; oak-leaf hedges on parcel polygons.
- **Parcels:** dynamic-property registry; price = basePerBlock² × frontage × plaza-distance × waterfront (all shown on the buy form). Buy (2-step, `sink:buyout`), deed, Survey Floor repaint, merge adjacent owned lots.
- **Survey Floor:** `ew:dev surveyfloor [layoutRef]` stamps a standalone mosaic for testing; stand → actionbar summary; use → buy/owner/merge. Office-hosted floor activates when a `real_estate_L1` capture + `surveyFloor` zone land.
- **Tests:** `test/townGeneration.test.ts` — modes/idempotency keys, empty-on-missing, pricing factors, buy+merge+audit, slope refusal, stub connectivity, Survey Floor mapping.

### Town-generation Phase 5 — town expansion
- **Growth points:** Layout 01 `growthPoints` register on the town record at seed (world-transformed). Consuming a point retires it; the module's own dead-ends register as new growth points.
- **District modules:** `data/district-modules.json` + `docs/district-modules.md` — `residential_close` (curving 3-wide lane, 6 houses + spare + green) and `industrial_yard` (short lane to 34×28 work pad + 2 spares). Modules join at the growth point's local street angle; the old dead-end becomes a through-road.
- **Town Hall flow:** leader-only `Expand the town` (`ew:dev expand [townRef]` until a town-hall capture hosts it) → pick growth point → terrain-fit modules with ★ recommendation (vacant house parcels < 25% → residential, else industrial) → treasury debit `moduleArea × basePerBlock² × outsideWallsDiscount` (⚑ 0.7; graceful shortfall) → road paves outward first on the construction timer, then parcels register with hedges/meadow.
- **Integration:** expanded parcels use the same registry/pricing/buy/merge; Survey Floor rescales on next `surveyfloor`; reseeding the same anchor preserves expansions (no orphan/duplicate).
- **Tests:** `test/townExpansion.test.ts` — growth transform/retire/spawn, join angle + through-road, treasury+audit, terrain refuse, outside-walls parcel pricing, recommendation star, reseed preserve.

## Dev commands

Run `/scriptevent ew:dev help` in-game for this same grouped list.

### Core
- `/scriptevent ew:dev help` — list all commands

### Phase A
- `/scriptevent ew:dev grant` — mint test merids
- `/scriptevent ew:dev audit` — run the ledger conservation audit
- `/scriptevent ew:dev stipend` — claim the test stipend

### Phase B
- `/scriptevent ew:dev bank`
- `/scriptevent ew:dev dealer`
- `/scriptevent ew:dev wallet`
- `/scriptevent ew:dev givewallet`

### Phase C
- `/scriptevent ew:dev commons`
- `/scriptevent ew:dev shop <trade>`
- `/scriptevent ew:dev shops`
- `/scriptevent ew:dev produce`

### Phase D
- `/scriptevent ew:dev jobs`
- `/scriptevent ew:dev zone <extraction_trade>` *(deprecated/dev-gated)*
- `/scriptevent ew:dev publiczone <extraction_trade>` *(deprecated/dev-gated)*
- `/scriptevent ew:dev station <processing_trade>`
- `/scriptevent ew:dev service <service_trade>`
- `/scriptevent ew:dev need <service_trade>`

### Phase E
- `/scriptevent ew:dev owner <trade|businessId>`

### Phase G
- `/scriptevent ew:dev place <trade>` — place trade level-1 structure from the registry, front facing player
- `/scriptevent ew:dev catalog` — open the Builder's Catalog picker
- `/scriptevent ew:dev givecatalog` — grant the Builder's Catalog tool item
- `/scriptevent ew:dev undo` — clear the last Builder's Catalog placement volume
- `/scriptevent ew:dev regen <businessRef>` — force-restore that business's volume `work_pit` now
- `/scriptevent ew:dev pitinfo` — standing in a pad: business, zone bounds, clocked-in list, regen state/timer
- `/scriptevent ew:dev seedtown <survey|skeleton|full> [layoutId]` — seed Heartlands Crossroads (or named layout) at your position
- `/scriptevent ew:dev surveyfloor [layoutRef]` — stamp a standalone Survey Floor mapped to a seeded town
- `/scriptevent ew:dev expand [townRef]` — Town Hall expansion flow (growth point → module → treasury confirm)

NPC/entity tags: `ew:npc_bank`, `ew:npc_dealer`, `ew:npc_commons`, `ew:npc_jobs`, `ew:shop_<trade>`, `ew:biz_<businessId>`, `ew:owner_<trade>`, `ew:station_<trade>`, `ew:service_<trade>`, `ew:personality_<personality>`.

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

### Phase F tests
- `test/devCommands.test.ts` — every registered dev command parses and appears in grouped help
- `test/flavorAssets.test.ts` — item/terrain atlas resolution, 16×16 wallet PNG, language declaration, and full pack/data/source node-ID ban
- `test/storefrontPolicy.test.ts` — CPU buyout vs owner-management routing
- `test/death.test.ts` — medical total rounding, underfunded cap, ledger conservation, and one-shot receipt lifecycle
- `test/food.test.ts` — edible goods, consumption history, and complete loot-override coverage
- `test/dialogue.test.ts` — slot rendering, personality filters, role pools, and recent-state substitution
- `test/hud.test.ts` — cash-only totals, root-panel merge, preserved title-channel binding, one-context priority, expiry, and Layer-1 danger-off policy
- `test/ownership.test.ts` — open-auction rounds/cap/bank jump, owner-capital conservation, and exact graceful-decline copy
- `test/bank.test.ts` — plain-language medical and owner-capital statement entries
- `test/customItemsPersistence.test.ts` — BP data/script modules plus wallet/cash item and atlas registration
- `test/towns.test.ts` — starter-town manifest coverage (civics, ten storefront trades, extraction/public zone coverage)
- `test/onboarding.test.ts` — first-paycheck checklist sequencing and completion gating
- `test/service.test.ts` — per-host need-claim exclusivity for concurrent workers

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
- Auto-grant wallet at stipend/tutorial exit, or craft/buy only?
- Multi-wallet: merge rules if two wallets exist?

---

## ⚑ consolidated tuning table (Phase G sweep)

| Key | Current value | Controls | Runtime status | Recommendation |
|---|---|---|---|---|
| `stipend` | `250` | First-join grant size | Live | Keep small; tune after first-hour retention pass |
| `medical.flat` / `medical.pctOfWealth` | `100` / `0.02` | Death medical bill severity | Live | Keep debt-free but punitive; review after PvE death rates |
| `bank.transferFee` | `5` | Flat transfer sink | Live | Keep tiny; raise only if transfer spam appears |
| `cash.walletDefaultExtract` | `100` | Wallet partial-unpack default | Live | Align with common cash handling in playtests |
| `dealer.dailyCapacity.gold` / `diamond` | `64` / `16` | Dealer softening onset per commodity | Live | Tune with weekly reserve inflow, not single-session feel |
| `dealer.softFloor` | `0.5` | Dealer minimum payout multiplier | Live | Keep >= `0.4` so dealer remains usable under load |
| `cpuProduceEveryMinutes` | `10` | CPU production cadence | Live | Keep synchronized with price tick while tuning supply |
| `trades.*.producePerTick` / `storageCap` | see `data/trades.json` | Per-trade shelf pressure | Live | Primary economy knob; tune before touching wages |
| `prices.goods.*` (incl. fish) | see `data/prices.json` | Market baselines/bands/drift | Live | Tune in one pass after stock/throughput pass |
| `food.recentConsumptionCap` | `32` | Food demand memory depth | Live | Increase only if dialogue feels forgetful |
| `dialogue.recentEventCap` | `32` | NPC world-event memory depth | Live | Keep until event volume justifies larger ring |
| `ui.toast.maxChars` / timing | `42`, `2/100/10` | Toast fit/legibility timing | Live | Tune on couch readability only; never clip mid-word |
| `ui.hud.refreshTicks` | `10` | Cash-chip refresh cadence | Live | Keep unless visual lag is observed |
| `ui.hud.serviceAlertTicks` | `100` | Service alert dwell time | Live | Keep short; reduce if alert contention rises |
| `ui.hud.walletChip` | `(-8,8)`, `210x18` | Cash-chip placement/size | Live | Re-validate at 10ft on console before invite |
| `ui.hud.priorities` | default `10`, construction `40`, employment `60`, onboarding `70`, service `80` | Actionbar context precedence | Live | Preserve ordering; only tune if onboarding is obscured |
| `work.nodeStampOffsets` | 3x3, spacing `2`, depth `-1` | Extraction pit geometry | Live | Replace with authored map footprints per town later |
| `work.nodeStages` | depleted `100`, recovering `300` | Node regen pacing | Live | Tune for anti-AFK feel after 2-player test |
| `work.pitRegenDelayTicks` | `1200` (60s) | Volume-pit regen delay after pad empty + no clocked workers | Live | Keep rock from regrowing on camera; tune after quarry playtest |
| `work.pitRegenSweepTicks` | `20` | Pit regen eligibility poll cadence | Live | Keep engine-aligned unless pad scans hitch |
| `work.employment.pieceRateByTradeTier.stone_quarry` | `2 / 3 / 4` | Per authored pit block wage by tier | Live | Tune with stone price / pit volume after capture lock |
| `structures.stone_quarry_L*.zones.work_pit` / `protected_stairs` | seed boxes `[[8,-4,10,24,0,24]]` / `[[8,-4,10,10,0,24]]` | Pit + unbreakable stair volumes (origin-relative) | Live (TODO-measure) | Re-measure from final captures; leave unresolved as skip-and-warn |
| `work.processingSweepTicks` / `processingTicksPerSecond` | `20` / `20` | Processing completion cadence/time display | Live | Keep engine-aligned unless perf demands batching |
| `work.processing.*` ratios/durations | sawmill `2->4 @200`, smeltery `2->1 @300`, bakery `3->2 @160` | Refining throughput | Live | Tune against price ladder and piece rates together |
| `work.service.spawnEveryTicks` | `600` | Need spawn cadence | Live | Tune by queue starvation/overload metrics |
| `work.service.requestQty*` + large-order params | `1-4`, chance `0.08`, large `6-10` | Service demand size distribution | Live | Keep rare large orders; tune for manageable bursts |
| `work.service.activeMarginBonus` | `0.2` | Active-serve premium | Live | Keep clearly above passive margin |
| `work.employment.pieceRateByTradeTier` | see `data/matrix.json` | Per-unit wages by trade/tier | Live | Tune only after supply/price pass |
| `work.employment.toolQualityByTier` | `1->1`, `2->2` | Company tool quality | Live | Low priority; tune for feel, not economy |
| `work.employment.offlineEmployeeStep` / cap | `0.12` / `0.9` | Offline owner output lift | Live | Keep below active-owner multiplier ceiling |
| `ownership.revenueWindowTicks` / `revenueHistoryCap` | `24000` / `128` | Appraisal revenue memory | Live | Tune after longer-world telemetry |
| `ownership.tierOutputMultiplierByTier` | `1 / 1.35 / 1.7` | Tier production advantage | Live | Rebalance against upgrade costs/ROI |
| `ownership.evaluation.*` | see `data/matrix.json` | Buyout valuation breakdown | Live | Tune after observing bid-close deltas |
| `ownership.auction.*` | see `data/matrix.json` (`maxRounds: 4`, `minRaisePct: 0.05`) | Auction pacing/counter behavior | Live | Condense UI loop before raising round count |
| `ownership.management.priceOverride*` | `0.8-1.25` | Owner pricing bounds | Live | Keep bounded while market stabilizes |
| `ownership.management.maxEmployeeSlots` | `4` | Hiring cap | Live (stub) | Hold until real hiring replaces stub flow |
| `ownership.management.employeeSlotHireCost` | `250` | Slot hire fee | Configured, not charged | Wire to real hire flow or remove |
| `ownership.management.upgradeCostByTradeTier` | see `data/matrix.json` | Tier-up sink costs | Live | Tune with target payback windows |
| `ownership.management.upgradeDurationTicksByTier` | `2400` / `3600` | Tier-up construction time | Live | Tune with session-length goals |
| `ownership.management.successorSpawnOffset` | `(6,0,0)` | Legacy matrix successor offset (registry offsets win) | Superseded by structures registry | Prefer `structures.successorOffsetByTrade` |
| `ownership.tierOutputMultiplierByTier` | `1 / 1.35 / 1.7` | Output multiplier by level after upgrade | Live | Rebalance with upgrade ROI |
| `ownership.tierStorageMultiplierByTier` | `1 / 1.5 / 2` | Storage cap multiplier by level | Live | Keep ahead of output so shelves don't choke |
| `ownership.tierEmployeeSlotMultiplierByTier` | `1 / 1.5 / 2` | Employee slot cap multiplier by level | Live | Tune with real hiring, not stubs |
| `ownership.construction.sweepTicks` | `20` | Construction rise/dressing tick cadence | Live | Keep engine-aligned unless layer stamps hitch |
| `ownership.construction.scaffoldingHeight` / `scaffoldingMargin` | `4` / `1` | Scaffolding ring height and pad margin | Live | Tune for couch-readable construction dressing |
| `ownership.construction.scaffoldingBlock` | `minecraft:scaffolding` | Scaffolding ring block | Live | Swap only if pack art needs a different read |
| `ownership.construction.materialPiles` | 3 piles near gate (cobble/planks/bricks) | Material-pile density/placement ⚑ | Live | Keep 2–3 piles; adjust offsets per capture gate |
| `structures.successorOffsetByTrade.default` / `stone_quarry` | `(40,0,0)` | Registry-driven successor spacing beyond pad edge | Live | Keep > max pad width until parcel-aware successor sites ship |
| `structures.*.padSize` (`stone_quarry`) | `34x28` | Reserved plot footprint per structure trade | Live | Re-measure after final L3 capture lock |
| `structures.*.gateOffset` / `npcAnchors.*` | quarry anchors seeded from first captures | Gate stub joins + storefront/office spawn points | Live | Re-measure from each final capture; leave unresolved entries as skip-and-warn |
| `towns.*.placement` / offsets | see `data/towns.json` | Starter-town host and zone geometry | Live | Tune on real map after first seed pass |
| `town.streetMaterialSetByEra.settlement.*` | dirt_path/coarse_dirt + gravel patches + cobble edge | Settlement road surfaces | Live | Keep readable vs meadow; retune with art pass |
| `town.maxStreetGrade` | `3` | Max street dy before refuse/stair | Live | Match layout `slopeToleranceY` feel |
| `town.lanternInterval` / `streetTreeInterval` | `12` / `16` | Lantern + street-tree spacing along main | Live | Keep village rhythm; avoid rows |
| `town.stubWidth` / `clearingMargin` | `2` / `2` | Stub path width + greening clear margin | Live | Keep stubs narrow; feather margin irregular |
| `town.meadowFlowerDensity` | `0.08` | Empty-parcel flower noise | Live | Raise only if meadows look barren |
| `town.floraByBiome.*` | oak/leaves + Heartlands flower set | Biome flora table for hedges/trees/meadow | Live | Expand with Timberlands/Fen tables later |
| `town.parcel.basePerBlock2` | `5` | Parcel price base per block² | Live | Primary land-value knob |
| `town.parcel.mainFrontageFactor` / `laneFrontageFactor` | `1.5` / `1.0` | Street-frontage multipliers | Live | Keep main clearly premium |
| `town.parcel.plazaNear/Far` + factors | `20→1.3` … `60→1.0` | Plaza proximity curve | Live | Tune after first buyout session |
| `town.parcel.waterfrontBonus` | `2.0` | Touching-water multiplier | Live | Keep dramatic vs inland lots |
| `town.parcel.sizeBands` | `80/200/500` | small/medium/large/estate thresholds | Live | Align with house vs work pads |
| `town.surveyFloor.palette` | lime/blue/yellow/green concrete | Survey Floor status colors | Live | Couch-readable status mapping |
| `town.surveyFloor.standaloneSize` | `16×12` | Dev surveyfloor stamp footprint | Live | Grow with RE office capture |
| `town.surveyMarkers.*` | yellow/blue/red concrete | survey-mode parcel/slot/growth paints | Live | Designer walk readability only |
| `town.retainingWallBlock` | `minecraft:cobblestone` | Pad cut retaining edges | Live | Swap for biome stone later |
| `layouts.heartlands_crossroads.slopeToleranceY` | `6` | Site height variance refuse | Live | Re-author with steep layouts in Phase 5 |
| `town.expansion.outsideWallsDiscount` | `0.7` | Expansion land + treasury price factor until walls exist | Live | Keep suburbs cheaper than walled core |
| `town.expansion.startingTreasury` | `50000` | Seeded town treasury float for expansion pays | Live | Tune after first expansion playtest |
| `town.expansion.ticksPerModuleBlock` / min/max | `0.15` / `200` / `2400` | Expansion construction duration from module area | Live | Keep road-first progress visible |
| `town.expansion.sweepTicks` | `20` | Expansion pave/register cadence | Live | Keep engine-aligned |
| `town.expansion.vacantHouseRecommendThreshold` | `0.25` | ★ residential when vacant house share below this | Live | Replace with demand board later |
| `district-modules.residential_close` / `industrial_yard` | see `data/district-modules.json` | Authored expansion fragments | Live | Author more kinds in content pass |

### Dealer soften formula (Phase B, unchanged)
```
mult(soldToday) = 1 - min(1, soldToday / capacity) * (1 - softFloor)
payout = round(Σ base * mult(soldToday + i)) for i in 0..qty-1
```

---

## Phase B archive (kept for history)

Ledger-only bank/dealer, cash denoms 1/10/100/1000, stipend stub, Emerald UI kit P1–P4/P7.
