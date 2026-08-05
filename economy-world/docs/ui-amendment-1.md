# UI Design System — Amendment 1 (Phase B in-game review)

Status: BINDING. Supplements ui-design-system.md. Where they conflict, this amendment wins.
Scope: applies to every existing screen (retrofit) and all future screens.

## A1.1 — One fact per line
Transaction and info bodies are stacked plain statements, one fact per line.
Never inline math expressions like `80 × ~69 (base 100)`.

Bad:
```
Volume is noted. Today's price has… adjusted.
80 × ~Ⓐ69 (base Ⓐ100)
Payout: Ⓐ5594
```

Good:
```
Selling: 80 gold ingots
Price: 69 each (softened from 100 — high volume today)
Payout: 5,594 merids

Balance now: 5,694
Balance after: 11,288

"Volume is noted. Today's price has… adjusted."
```

## A1.2 — Narrator speaks last
Flavor/narrator lines never occupy the top of a body. Data first; narrator is the
final line, separated by a blank line, wrapped in quotes.

## A1.3 — Thousands separators
Every merid amount ≥ 1,000 renders with comma separators. No exceptions, anywhere
(bodies, buttons, toasts, actionbar, boards).

## A1.4 — The merid symbol is NOT a controller glyph
The emerald Ⓐ currently used as the currency mark is the Xbox A-button glyph and
reads as an input prompt on console. Effective immediately:
- Currency renders as plain text: `5,594 merids` in sentences, or bare numbers
  where context is unambiguous (Balance lines, payout lines).
- A custom merid glyph (coin symbol injected via RP glyph texture) arrives in the
  future art pass. Do not improvise a substitute symbol.

## A1.5 — Icon placeholders
Current controller-button glyphs on menu buttons are ACCEPTED as temporary
placeholders. Rules:
- Do not add them to any NEW screen elements.
- They will all be replaced in a dedicated custom-icon art pass (real form icon
  textures: merid coin, bank crest, dealer scales, etc.).
- PRE-LAUNCH BLOCKER: placeholders must be gone before any console player joins
  the Realm — on Xbox they read as live button prompts.

## A1.6 — Screen-by-screen retrofit checklist
Every existing Phase B screen (Bank hub, Deposit, Withdraw, Transfer, Statements,
Dealer hub, Sell gold, Sell diamonds, Prices board, all toasts) must be re-checked
against A1.1–A1.4 in one conformance pass and each fix noted in NOTES.md.
