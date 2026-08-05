# Economy World — NOTES

## Phase C (current)

Built against `docs/layer1-technical-spec.md` §4.5–4.6 / Phase C, `docs/ui-design-system.md`, and binding `docs/ui-amendment-1.md`. Stopped at Phase C (no Phase D).

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
| **Toasts** (deposit/withdraw/transfer/dealer/stipend/cancel/error) | `money()` → `N merids` with thousands separators; no coin/Ⓐ glyph |
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
- `test/businesses.test.ts` — 10 CPU seeds, producePerTick, storageCap, player-owned skip
- Prior ledger/bank/dealer tests still green

### Wallet — open questions (not invented)
- Max wallet capacity?
- Does wallet drop on death with its balance (vs bank-safe)?
- Auto-grant wallet at stipend/tutorial exit, or craft/buy only?
- Multi-wallet: merge rules if two wallets exist?
- Should unpack offer amount slider (currently unpack-all only in UI)?

---

## ⚑ Placeholders (Phase B + C)

| Key | Value | Why ⚑ |
|---|---|---|
| `bank.transferFee` | `5` | Master §13 tuning |
| `dealer.dailyCapacity.gold` | `64` | Soften volume not quantified |
| `dealer.dailyCapacity.diamond` | `16` | Same |
| `dealer.softFloor` | `0.5` | Soften floor not specified |
| `trades.*.producePerTick` / `storageCap` | see `data/trades.json` | Master §13 “CPU restock rates” |
| `cpuProduceEveryMinutes` | `10` | Aligned to price tick; not locked |
| `fishery` trade + buyout `2200` / t2 | matrix + trades.json | Layer1 says 10 trades; Phase A matrix had 9 |
| `prices.goods.fish` | base `4`, etc. | Needed for fishery |

### Dealer soften formula (Phase B, unchanged)
```
mult(soldToday) = 1 - min(1, soldToday / capacity) * (1 - softFloor)
payout = Σ floor(base * mult(soldToday + i)) for i in 0..qty-1
```

---

## Phase B archive (kept for history)

Ledger-only bank/dealer, cash denoms 1/10/100/1000, stipend stub, Emerald UI kit P1–P4/P7.
