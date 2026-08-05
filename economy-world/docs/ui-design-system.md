# ECONOMY WORLD — UI Design System
*Companion to the Master Design Doc — v1. No screen gets built except from this spec.*

---

## 1. Principles (the UI laws)

1. **Native forms only.** Every menu is built on Bedrock's native form system (button lists, modal forms, confirm dialogs), themed via JSON-UI. Never chest-GUI fakery, never hand-rolled input. The platform renders input — controller on console, touch on mobile, mouse on PC — so controls are correct on every device *by construction*.
2. **The world is the primary UI.** Menus exist only for transactions and management. Ambient information lives in the world: prices on shop signs, borders as banners, wealth as architecture, danger as camps. If information can be shown in-world, it is not shown in a menu.
3. **Three taps max.** Any action reachable from its entry NPC/station in ≤3 selections. If a flow needs more, the flow is wrong.
4. **Couch-legible.** Designed for a console player ten feet from a TV: minimum form body text density, short lines, no walls of text in menus. Every screen passes an on-Xbox readability check before it ships.
5. **One voice.** Every toast, error, and confirmation is written in the same tone (dry, in-world, occasionally funny — the tutorial narrator's voice). No raw error strings, ever.
6. **Same screen, same shape.** Identical layout grammar everywhere: **Title (with glyph) → context line → content → actions.** Confirm is always first in the action list; Cancel/Back is always last. A player who has used one menu has used them all.
7. **Money is always glyphed.** Every price, balance, wage, and fee renders with the coin glyph. Numbers without the glyph are never money.
8. **This spec governs every future update.** Nether, military, clearable camps, anything on the shelf: new features configure the seven patterns, use the same tokens, glyphs, voice, and console rules. If an update genuinely needs a new pattern, the pattern is added to this spec first, then built. The system scales by addition to the spec — never by exception to it.

## 2. Design Tokens

**Palette (mirrors the handbook's Emerald Edition):**
- Emerald `#1E8E4E` — primary panels/headers
- Deep Emerald `#146639` — header bars, emphasis
- Gold `#E8A81C` — money, prices, highlights, confirm accents
- Slate `#2B2B2B` — text, dark plates
- Paper `#F7F3E8` — form body background
- Signal Red `#B23B3B` — danger, hostile, errors
- Signal Blue `#3B6FB2` — info, neutral status

**Status colors (used consistently everywhere):** green = open/positive/gain · yellow = toll/caution/pending · orange = closed/warning · red = hostile/danger/loss.

**Typography:** default Minecraft font (readability + native feel). Emphasis via size/§ color codes, not font swaps. Numbers right-aligned in any list of amounts.

**Glyph icon set (custom font glyphs, usable inline in ALL text):**
coin · bank · deed (business) · province crest · era badge (×6) · each trade's icon (×26) · contract scroll · toll gate · skull (danger) · bounty target · lock (requirement unmet) · check / cross · up-arrow gain / down-arrow loss · clock (timers) · hammer (construction)

## 3. Interaction Patterns (build once, reuse everywhere)

- **P1 Menu Hub** — button list with glyphs. (Every NPC's opening menu.)
- **P2 Transaction Confirm** — context line, itemized cost/payout with coin glyphs, balance-after preview, Confirm/Cancel. (Every purchase, sale, wage, toll, fee.)
- **P3 Catalog Browse** — paged button list, each entry `glyph + name + price`; selection → detail → P2. (Shops, construction catalog, upgrade tiers, auction lots.)
- **P4 Management Panel** — modal form: toggles/sliders/dropdowns + Save. (Province settings, business settings, price setting, allowlists.)
- **P5 Board** — paged list of postings `title + pay + deadline`; selection → detail → Accept. (Contracts, bounties, commissions, job openings.)
- **P6 Ticker Detail** — instrument view: current price, movement glyph, recent history rendering, Buy/Sell via P2. (Exchange.)
- **P7 Progress Panel** — read-only status: progress bars as filled/empty glyph blocks, requirements with lock/check glyphs. (Province XP, upgrade requirements, construction timers, loan status.)

Every screen in the game is one of these seven patterns. New feature = new configuration, not new pattern. A pattern change requires updating this spec first.

## 4. Screen Inventory (complete)

**Banking (Bank NPC):** hub → Deposit (P2) · Withdraw cash (P2) · Transfer (P4→P2) · Loans: status (P7), apply (P3 collateral pick → P2) · Statements (P7).
**Commodity Dealer:** hub → Sell precious (P2) · Prices today (P7).
**Shops/Service (per business):** Buy (P3) · Sell-to-store freelancer flow (P2) · owner: stock & prices (P4), serve-customer prompts (P2 variant).
**Business Management (Foreman NPC/station):** hub → Status (P7) · Upgrade (P3 tiers → P2, staged-timer P7 after) · Storage expansions (P3) · Employees: hire/fire CPU (P3), wage ledger (P7) · Sell business → Auction (P5 listing + live offers).
**Auction house:** active listings (P5) · bid (P2) · my bids (P7).
**Employment:** job board (P5) · clock-in/out confirm (P2) · payday summary toast.
**Province (Leader, at province hall):** hub → Overview/XP (P7) · Hostility dial + lists (P4) · Tax rate (P4) · Treasury & spending: roads, walls status, civic buildings (P3→P2) · Deputies (P4) · Citizens (P7).
**Province (Citizen/Visitor):** Overview (P7) · services directory (P3).
**Founding flow:** charter purchase (P2) → staking HUD (world-side: stake count remaining on actionbar) → close-loop sky confirm (P2 full-screen variant with area/cost).
**Construction Co.:** catalog (P3) · commission board (P5) · escrow status (P7).
**Exchange:** instrument list (P3) → ticker (P6) → trade (P2) · portfolio (P7) · terminal (late-game: same screens, remote).
**Contracts/Movement:** trade-hall board (P5) · active contract HUD (actionbar: destination + timer) · delivery confirm (P2).
**Bounty board:** post (P4→P2) · browse (P5) · claim (P2).
**Hospital:** bill payment (P2) · insurance later (P3).
**Enchanter:** catalog (P3, locks shown via glyph until XP met) → P2.
**Tutorial:** sequence of P1/P7 stations + narrator dialogue.
**Player self (personal menu item):** balance & net worth (P7) · citizenship (P7) · my businesses (P3→management) · my skills/licenses (P7) · active contracts (P7).

## 5. World-Side UI (not menus)

- **Border banners** — title + colored subtitle, personalized welcome status.
- **Toasts** — top-of-screen, one sentence, narrator voice, status-colored. All errors, protections ("Reserved for future expansion…"), payments received, era events.
- **Actionbar** — persistent context: clocked-in status + session earnings · active contract destination/timer · staking count · construction timers when on-site.
- **Signs & displays** — shop signs show live prices (script-updated text), exchange building shows headline index, bounty board shows top bounty.
- **NPC dialogue** — the ambient information channel (gossip = market data).
- **Sound grammar:** one sound each for money-in, money-out, error, success, era-up, border-cross, bounty-posted. Same sound = same meaning everywhere.

## 6. Console Rules (hard requirements)

1. Every screen ships only after a controller test pass on actual Xbox.
2. Form lists ≤8 options per page (D-pad fatigue); paginate beyond.
3. No screen requires typing except naming (province, business); everything else is selection.
4. Body text ≤3 short paragraphs per form; overflow goes to a second page or the handbook.
5. Interactive world-targets (NPCs, stations, upgrade points) are large and separated — no precision-aiming at small blocks from a controller.
6. HUD text (actionbar/toasts) readable at 10 feet: short strings, high-contrast colors only.

## 7. Build & Test Checklist (per screen)

☐ Uses one of the seven patterns unmodified ☐ Title glyph correct ☐ Confirm-first/Cancel-last ☐ All money glyphed ☐ Balance-after shown on any spend ☐ Toast copy in narrator voice ☐ ≤3 taps from entry ☐ 8-option page limit ☐ Xbox controller pass ☐ PC mouse pass ☐ Added to this inventory
