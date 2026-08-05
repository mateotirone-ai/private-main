# Phase B — NOTES

Built against `docs/ui-design-system.md`, `docs/layer1-technical-spec.md` §4.3–4.4, and `docs/economy-world-master-design.md`. Stopped at Phase B (no Phase C).

## What shipped

### UI kit (`src/ui/`)
- `theme.ts` — Emerald Edition hex tokens + § ink + glyph PUA constants + `money()` / `progressBar()` / `PAGE_SIZE=8`
- `voice.ts` — narrator-voice string table (Meridian HR tone)
- `toast.ts` — toast + actionbar helpers
- `patterns.ts` — P1 `menuHub`, P2 `confirmTxn` (balance-after), P3 `catalog`, P4 `managePanel`, P7 `progressPanel` (P5/P6 deferred; not needed for L1 bank/dealer)

### Bank (`src/systems/bank.ts` + `bankMath.ts` + `cash.ts`)
- Hub → Deposit / Withdraw / Transfer / Statements (no loans)
- Deposit: physical `ew:cash_*` → `Ledger.cashIn`
- Withdraw: `Ledger.cashOut` then spawn cash — **only** spawn site for cash items
- Transfer: flat fee from `data/matrix.json` → `Ledger.sink(..., "sink:fee")` then `Ledger.transfer`
- Statements: P7 over recent journal lines for the player account
- Cash items: `ew:cash_1/10/100/1000` (BP items + RP stub textures)

### Commodity Dealer (`src/systems/dealer.ts` + `dealerMath.ts` + `dealerState.ts` + `reserve.ts`)
- Hub → Sell gold / Sell diamonds / Prices today
- Sale: remove vanilla gold_ingot/diamond → `Ledger.mint(..., "mint:dealer")` → reserve += units → daily soldToday++
- Daily-capacity linear softening (see ⚑ below)
- Prices board (P7) shows softened unit price + sold/capacity bars + reserve counts

### Stipend stub
- `/scriptevent ew:dev stipend` — one-time `mint:stipend` from `matrix.stipend`, tracked in `ew:players`

### Entry points
- Tag NPCs `ew:npc_bank` / `ew:npc_dealer` (interact opens hub)
- `/scriptevent ew:npc bank|dealer` and `/scriptevent ew:dev bank|dealer|stipend|grant|audit`

### Tests
- `test/bank.test.ts` — fee planning, affordance, ledger sink+transfer, cash breakdown
- `test/dealer.test.ts` — capacity mult, softFloor clamp, progressive multi-unit quote, mint audit
- Existing `test/ledger.test.ts` unchanged

## ⚑ Placeholders added

Numbers not found as locked values in the docs were added to `data/matrix.json` with ⚑ comments — never hardcoded in TS beyond reading data/.

| Key | Value | Why ⚑ |
|---|---|---|
| `bank.transferFee` | `5` | Master doc §13 lists transfer fee as playtest tuning (“tiny flat fee”); no numeric lock. |
| `dealer.dailyCapacity.gold` | `64` | Master doc locks “price softens with volume” but gives no capacity number. |
| `dealer.dailyCapacity.diamond` | `16` | Same — diamond scarcer window guessed as ¼ of gold. |
| `dealer.softFloor` | `0.5` | Soften floor (never below 50% of base) not specified; linear curve chosen for Phase B. |

### Formula chosen (not in docs — documented here, params ⚑)
```
mult(soldToday) = 1 - min(1, soldToday / capacity) * (1 - softFloor)
payout = Σ floor(base * mult(soldToday + i)) for i in 0..qty-1
```

### Not ⚑ (found in docs / prior data)
- Cash denoms `1/10/100/1000` — layer1 §3
- Gold base `100`, diamond base `400` — existing `data/prices.json`
- Stipend `250` — existing matrix / layer1 §6 table

## Glyph font
PUA codepoints (`U+E000`…) are reserved in `theme.ts`. RP `font/` atlas not authored yet — glyphs will render as missing-char until the Emerald glyph sheet ships. § color codes still theme the forms.
