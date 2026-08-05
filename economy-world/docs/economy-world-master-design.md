# ECONOMY WORLD — Master Design Document
**Minecraft Bedrock Add-On | Private world for friends (console players via Realm)**
*v7 — August 2026 — CRIME SYSTEM COMPLETE + demand boards, HUD, placement doctrine, spawn inventory*

---

# THE PITCH — Why Play

**You've beaten Minecraft. You've never lived in it.**

This isn't a minigame and it isn't a grind server. It's a second life inside Minecraft — a hand-built world running a real, living economy, where everything you do matters and nothing you build stops growing.

**Start with nothing.** You arrive broke. Chop a tree, sell the wood, pocket your first cash. Take a job at someone's quarry for a steady wage. Save. Then walk into the town auction and buy the business out from the CPU running it — and now the quarry is *yours*.

**Everything is real.** Money lives in a real bank. Prices move on real supply and demand — flood the market with stone and watch the price fall; go quiet for a week and watch scarcity pay whoever shows up. Gold and diamonds only move through licensed dealers. Every trade needs every other trade. Nobody hands you anything.

**Wealth you can see.** There are no invisible numbers here. When your business grows, the *building* grows — new wings, bigger yards, taller floors. Provinces rise from huts to skyscrapers. Walk through town and you can read who's winning by looking at the skyline.

**Claim your corner of the map.** Found a province. Name it. Set your borders and your rules — open and friendly, toll at the gate, or *do not enter, kill on sight*. Hire guards. Tax the businesses on your land. Cross into a rival's territory and the screen tells you exactly how welcome you are.

**Risk is everywhere, and it's honest.** Die and you lose everything you're carrying — plus the medical bills. The mountain pass is faster but bandits own it. The bank vault is safe; your pockets are not. Every haul, every shortcut, every deal is a real decision.

**A world full of people.** Hundreds of NPCs work, shop, gossip, and remember you. Shopkeepers know the market. Guards know your name. The town talks about what you did — because the town is watching the same economy you are.

**No ending. No ceiling.** Work becomes ownership. Ownership becomes empire. Buy the rail line and tax every shipment. Buy the port and control everything entering the world. Play the stock market from your province's own Wall Street. One day, charter your own bank. The world doesn't end — it *develops*, era by era, in whatever direction we push it.

**Still Minecraft.** No menus pretending to be gameplay. You mine with a pickaxe. You haul cargo down real roads. You build, you fight, you trade — the game you know, finally with a world that pushes back.

*Your friends are already staking claims. The map is waiting.*

---

## 1. Vision

A job-based, living economy inside Minecraft. Every player specializes in a trade, all value flows through one shared economy with a real banking system underneath it. No endgame, no ceiling — the world develops algorithmically like a real economy, from huts to skyscrapers, forever.

**Platform reality:** Built on PC Bedrock (Microsoft Store "Minecraft for Windows"), played by friends on console via a Realm (or hosted session). Realms cap: 10 concurrent players; the member list is larger and players rotate. Every system must be fun with 2 players + CPUs online.

---

## 2. Design Laws (govern every decision)

1. **No invisible numbers.** Every stat change manifests physically in the world. Storage grows = the building grows. Era advances = the skyline changes. The town IS the spreadsheet.
2. **It has to still be Minecraft.** Work is Minecraft's own verbs — mining, chopping, farming, traveling, fighting — wrapped in economic structure. Menus exist only at the edges (buying, hiring, trading), never in the middle of work.
3. **Closed economy.** Nothing of value enters the world except through a job. All vanilla value leaks (villager trades, farms, mob drops) are sealed or routed through the economy.
4. **Distance is cost.** Travel time is the economy's most honest price. Geography, routes, and location permanently matter.
5. **Danger is visible.** Risk is map-authored and readable — bandit camps, warning signs, worked-out quarry faces. Players read the world by looking at it.
6. **Fun at 2 players.** Every core system must work on a quiet Tuesday night with two friends and the CPUs.

---

## 3. Core Economy — ALL LOCKED

### Currency & Banking
- **Hybrid currency:** digital bank balances + physical cash withdrawal. Bank = safe; pockets = lossable.
- **Deposits survive death.** Carried cash and goods are lost. Banking behavior emerges from danger.
- Commodity-anchored: gold, diamonds, precious materials only move through dealers/bankers. Dealer buy price anchors all value.
- **Charter banking model (the JP Morgan design):** the system central bank always exists — monetary authority, dealer anchor, incorruptible code. Player-run banking is a late-game capstone: requires financial era, massive net worth, and a huge reserve deposit posted as collateral. The player makes decisions (loans, rates, spreads); the script holds ALL custody. Reserve ratios code-enforced; bad loans trigger automatic collateral seizure to make depositors whole. You can be a bad banker — you cannot be a thief.
- **Starting money:** small one-time settler's stipend at tutorial exit (food + tools + one mistake's worth; nowhere near a buyout). Tiny capped faucet, in-world framed as a resettlement grant.
- **P2P payments:** bank transfers with a tiny flat fee (traceable, safe); physical cash hand-offs free and anonymous (stealable, dies with you). Two-tier payment world — crime system will use this.
- **THE MERID — monetary system (LOCKED):** currency = the merid, named for Meridian (city → coin, like thaler → dollar). **Managed gold standard, fully algorithmic:** every unit of gold/diamond sold to the dealer enters the reserve; currency is issued against it. Core metric: the **reserve ratio** — merids in circulation vs gold in reserves — tracked live, published at the exchange, drifting on a slow percentage scale. Inflation emerges naturally and is what it is; the algorithm manages it with slow levers: mint (dealer) price adjustments within tight bands, fees, and the **import valve** (external-trade purchases drain currency from the world when it runs hot).
- **How money is born (real-life model):** private mines (CPU-run baseline, player-buyable) dig in the authored gold country on the map → sell at the dealer (the assay office / gold window — the ONE money-creation code path) → gold travels to **Fort Knox in Meridian**, a landmark vault physically filling with gold blocks as reserves grow (visual law), unrobbable, upgrading through world eras. Armored NPC gold shipments dealer→vault = flagged for the crime session ("Great Gold Robbery question").
- **Anti-collapse armor:** one mint code path; money creation physically capped by precious-node regen timers; dealer daily capacity (price softens with volume — hoard-dumping self-limits); nightly conservation audit (total currency ≡ faucets − sinks, any mismatch flags the exact transaction); anomaly tripwires on physically-impossible inflows.
- **Loans:** central bank lends against collateral only (business, house, posted goods), capped at % of collateral value; missed payments = automatic foreclosure via the auction system. No unsecured credit. Deposit interest ≈ zero at launch (revisit in Financial era).

### Jobs & Trades
- Set list of trades tied to vanilla activities. Jobs are money faucets; pay rates are monetary policy.
- Balance: specialization + interdependence + dynamic pricing self-balancing. Better operators out-earn.
- **Price algorithm: parked major session.**
- **Trade roster + dependency map: next major session.**

### CPU Businesses
- Every trade always exists; unmanned = CPU-run storefront at ~10% production.
- **CPU keeps running as a slow competitor after a player buys out a trade.** Self-healing market, permanent price floor.
- Stock caps + restock rates per trade. CPU is buyer/seller of last resort and stock-market market-maker.

### Business Ownership & Sales
- Enter a trade by buying out the CPU business. Ownership transfer = registry flip; reverts to CPU if abandoned.
- Live automatic appraisal: base + tiers + inventory at market + revenue multiplier + location.
- **Sales = auction model:** listing runs a real-time window (~48h). Bank and CPU always bid (computed from appraisal ± variance; CPU bids under). Players can outbid. Rare bounded "motivated buyer" luck boosts (cap ~+25–40%, low odds — MUST be bounded or it becomes a printable exploit). Seller may decline all bids.
- Net worth (cash + businesses + assets) is the scoreboard. No cap.

### Freelancing & the Commons
- Raw materials always usable personally. Sellable ONLY to the relevant business at **40–50% of market price**. Ladder: freelance < employed < owner.
- **Public commons (LOCKED):** every town ships with designated public gather zones — community woodlot, public quarry pit, forage patch — same regenerating-node tech, open to all, no clock-in. Deliberately humbler than business work zones (fewer nodes, slower regen): the freelancer floor. Business work zones are staff-only.

### Employees
- **System-fixed wages per job tier.**
- CPU employees: wage cost vs production boost, diminishing returns. Player employees: clock in, tracked output, auto-payroll.
- Employees raise AFK output above 50% but never to 100% — owner presence uniquely runs capacity (goat doctrine). Exact ceiling: tuning.

### Offline / AFK
- CPU ≈ 10% · AFK owner ≈ 50% · active owner = 100%.

### Storage
- **Hybrid:** building visually shows capacity (visual law), inventory is system-held. Robbery becomes possible later via the crime system as designed content.

---

## 4. Work Engines — ALL FOUR LOCKED

1. **Extraction** — gathering in designated work zones, clocked in, auto-tracked. Regenerating nodes, staged and realistic (stump→sapling→tree; advancing mine faces with glint states; vanilla crop stages; fish density = stock). Regeneration is a visible process, never an event. Must work perfectly for all industries.
2. **Processing** — raw→refined at physical stations; load/wait/haul rhythm; refined > raw; upgrades add stations, shorten timers.
3. **Service** — CPU customers with needs; active service beats passive margins; traffic/order size scales with tier + location; demand generated from real world-state; customer archetypes ride the dialogue engine. Must scale.
4. **Movement** — contracts at trade halls; journey is the work; risk-priced routes (bandits + high-value mobs on fast shortcuts, map-authored + visible); danger premium in contract pay; guards/couriers same engine.

---

## 5. Progression — LOCKED

### Player: XP as Skill Licenses
- XP reworked into progression unlocks — doing things unlocks bigger capabilities. No speed-rushing. Enchanting = business; enchantments gated by XP threshold AND money.

### Buildings: Tiers & Eras
- Pre-built tier structures, staged construction on timers (longer = bigger). Upgrade menus show price + requirements (production milestones, era, etc.). Reserved expansion zones with explanatory toast. Max-footprint plots designed from day one.

### The Era Ladder — LOCKED
**Settlement → Village → Township → Industrial → Modern → Financial.**
Settlement: stakes, huts, dirt roads. Village: proper buildings, palisades, trade hall. Township: stone walls, rail arrives, **sovereignty unlocks** (real law, tariffs). Industrial: automation tiers, highways, **exchange opens** (system funds). Modern: skylines, **commodity trading + remote terminals available**. Financial: skyscrapers, **IPOs + chartered banks** — the open-ended endgame. NPC crowd density scales with era.

### World: Algorithmic Progression via PROVINCE XP
- **Province XP system (separate from player XP):** every economic act inside borders feeds it — production, taxes, upgrades, contracts, employment. Composite algorithm made legible as one progress bar ("Industrial Era: 74,200/100,000").
- **Eras advance per-province.** Visible inequality: skyscraper metropolis next to hut village. The most motivating sight in the game.
- Procedural events from real data: shortages, booms, supply ships, embargoes, rival CPU shops.

---

## 6. Provinces & Politics — LOCKED

### MERIDIAN — the Capital (LOCKED)
Everyone's spawn city, post-tutorial. A complete, permanent NPC-run province: businesses NOT purchasable (the eternal CPU layer), hostility locked Open, unclaimable, unconquerable — even by the future military update. Home of the central bank, the commodity dealer, Fort Knox, the first exchange floor, and the tutorial exit. **World XP** (aggregate of all activity) advances Meridian's era automatically — NPC crews visibly renovate it from village to metropolis; it is the world's odometer. Tuning principle: **floor, not ceiling** — Meridian's prices/fees slightly worse than player provinces can offer, so gravity pushes maturing players outward. Currency (the merid) is named for it.

**The Federation (LOCKED):** every province charter is ISSUED BY MERIDIAN — provinces are chartered subdivisions, permanently linked: **federal tribute** (small cut of province tax revenue flows to Meridian = pure currency sink) + optional federal resource quotas/contracts. Membership = the system itself (mint access, central bank, loans, receivership, exchange, stipends). **Enforcement = economic severance, not armies:** sedition gets you unplugged — dealer window closed, accounts frozen, tariffs everywhere, same warm NPC smile reading the sanctions script. Meridian lore voice: the sociopathic utopia — "we will help you to the ends of the earth; don't fuck with us." Unconquerable, but defiable.

**Independence & Sovereign Currency (FUTURE UPDATE — the big one):** a GUIDED, published checklist (progress-panel pattern, visible to everyone including Meridian's gossiping NPCs): own every critical trade, poached-citizen population threshold, embargo-proof treasury, own stocked vault, Financial era. Declare → survive the severance gauntlet (real-time embargo + pressure) → emerge sovereign: no tribute, no safety net, and eventually your OWN currency — a second instance of the monetary engine (own vault, own gold window, own coin), floating exchange rates vs the merid, forex instruments, hyperinflation as a fail state, dual-currency borderlands. Ships alongside the military update. Most who try should get crushed; the one who makes it is legend.

### Province Expansion Loop (LOCKED)
Founding gives you border posts + the **Town Hall** (auto-staged; the province brain: leader menus, treasury, XP bar, zoning). Then: **1) Zone** districts (residential / business lots / civic reserves) from the town hall — via **DISTRICT TEMPLATES (LOCKED)**: stamp pre-designed blocks ("Residential Block — six plots on a street", "Market Row", "Civic Square") placed like structures with ghost-preview fit validation; plots auto-subdivided, streets auto-laid. Two-corner marker rectangles for custom shapes. The **Town Hall Founding Checklist** (progress panel): ✅ bounds walked (founding itself) ☐ first residential district ☐ business lot ☐ laws set (optional — sensible defaults pre-set) ☐ commons placed (**FREE — Meridian development grant**, federal aid on brand) ☐ road link funded ☐ first business chartered ☐ first resident (automatic). Completing it reveals the Village-era list — era requirements as one continuous guided track. Complexity check passed: every line = one walk + one menu ≤3 taps; day one ≈ 15 minutes.
**DEMAND BOARDS (LOCKED — Cities Skylines RCI with receipts):** algorithmic Residential/Commercial/Industrial meters, each with EXPLAINED causes from ledger data ("3 businesses hiring, 0 vacant homes → RESIDENTIAL HIGH"). Physical board on the Town Hall wall (visible to visitors = legitimate espionage); viewable remotely on the personal device in Modern era. Demand + no vacant zoned land → "Expand borders" → stake extension sections, walls re-route in current era kit: provinces visibly grow because they're succeeding. Density subtypes (high-density residential, office) arrive as later-era template unlocks. **2) Populate — NPC RESIDENTS (LOCKED, Cities-Skylines model):** zoned residential fills itself. NPC move-in rate driven by **attractiveness** (jobs available, services, tax rate, era, safety — the leader's levers). Each arrival claims a vacant plot and rolls a **randomized house from the Construction Co. catalog, filtered by plot size** — organically varied streets; a player-owned local Construction Co. earns every NPC build. NPC residents ARE the unified population system: the service engine's customers, the businesses' hireable workforce, and the era-scaled street crowds — one census feeding all three. Immigration payments = a **regulated monetary faucet** (algorithm governs the rate as policy; conservation audit tracks it like the mint). Players buy plots too (leaders can reserve prime lots for humans); plot sales = treasury revenue. **3) Establish businesses via BUSINESS CHARTERS:** any player buys a charter for a trade + an approved lot, pays establishment cost, tier-1 building stages up, founder owns it outright (no CPU step — pre-built CPU businesses exist only in authored starter towns; new provinces grow industry from scratch). **4) Connect & provision:** treasury funds the road link + a public commons. **5) Snowball:** citizens + businesses → Province XP → civic slots (trade hall first) → services → more citizens. Founder's arc: surveyor → landlord → founder → governor.

### Housing & Real Estate (LOCKED)
The **Real Estate Office** (Meridian civic building; any province can add one) sells LAND: browse pre-designed plot grids (catalog), buy the plot → your build permissions, respawn anchor, citizenship. **Construction Co. sells BUILDINGS:** catalog homes (starter cottage → townhouse, staged-built, era/biome styled, tier-upgradeable) or player-commissioned customs. In player provinces, leaders zone residential districts and **plot sales pay the province treasury** — residents are revenue.
- **Footprint rule (LOCKED):** a house/commission/wing must fit the plot — non-fitting catalog entries show locked with the required size. One validation, inherited everywhere structures meet land.
- **Plot merging & the land market (LOCKED):** adjacent unsold lot → buy + merge at the RE Office. Adjacent OWNED lot → **Make an Offer** (escrowed; owner can decline, counter, or gouge — nail-house holdouts are legitimate strategy). No forced sales. Plots resellable anytime (listing or direct offer, seller sets price, appraisal shown); plots are loan collateral. Build vertically if the neighbor won't sell.

- **Founding — Walk the Bounds (LOCKED):** buy the province charter → receive hammer + surveyor's stakes → physically walk the land placing a limited number of stakes (hammer removes last stake to fix mistakes); particle lines connect them live. Claim only exists when the loop closes (first stake to last). Validation: no self-crossing borders, no overlap with provinces/reserved zones; coastline wraps naturally (enclosed water OK). On close: sky-camera reveal over the claimed land, area priced, confirm. **Pricing:** charter includes a base area allowance; every block past it billed per-area. Expansion later = stake new sections, pay again.
- **Walls (LOCKED):** generated on claim as primitive stakes/posts, upgrade automatically with each era (stakes → palisade → stone → grand walls with gates). Built from a modular kit of hand-built vanilla-block segments (straight / corner / gate pieces, per era × biome palette) stamped along the border polygon, following terrain. Gates appear where roads cross; guards man them. Non-owners cannot break wall blocks (registry-enforced, no custom block tech).
- Entry banner: "Now entering [X] Province" + **personalized status** ("You are welcome here" / "You are NOT welcome here"), color-coded.
- **Hostility dial + per-player allow/enemy lists.** Open → Trade-only → Toll → Closed → Hostile. NPC guards enforce. Every notch has an economic price.
- **Law scope staged by era:** starts as property lines (permissions + tax rate + dial); **sovereignty era unlocks real law** — own tax structures, licensing, tariffs. Politics is a progression unlock.
- **Tax base:** automatic % of business revenue inside borders, leader-set within system bounds (~0–15%). Personal income (wages, freelance) untaxed. Treasury funds guards, walls, roads, civic upgrades → attracts business. Governance loop.
- **Citizenship = residency:** you are a citizen of the province where your house is. One at a time; move house to switch (small cooldown). Provinces compete for residents (services + exchange tier vs cheap land + low taxes).
- **Succession:** one leader + appointed deputies with limited powers (allowlists, roads, civic upgrades from treasury; NOT tax rates/sale/transfer). 30 real days inactive → leadership offered to deputies → else CPU receivership (frozen policies) until any citizen buys the charter at auction. Nothing ever bricks.
- Civic buildings: limited slots (counts: tuning), biome-themed via palette swap, era-tiered. Trade hall, station, docks, library, hospital, exchange, bounty board...
- NPC virtualization: records spawn as entities near players. ~20–40 active per area.

### External Trade — LOCKED
- **Ships/trains carry EVERYTHING** — foreign goods compete with domestic industry. Tariffs matter (once sovereignty unlocks — protectionism gets discovered, like history).
- **Gateways (ports / external rail terminals) are special businesses bought at auction.** CPU-run at launch; whale purchases later. Enclosing province taxes/tariffs them in sovereignty era. Owner runs the door; province governs the land. Contestability deferred to crime/conflict design.
- Outside world = algorithm's puppet: pressure valve + event generator. Money flow tuned so imports never print currency.

---

## 7. Infrastructure — LOCKED

- **Roads: all public, all free.** Pre-planned corridors; default dirt path exists day one. Tiers: dirt → paved (+speed) → highway (++speed) via speed-boost road blocks. Funded by province treasury (or player sponsorship w/ plaque). Staged construction. Taxes made visible.
- **Rail: private profit infrastructure.** Pre-planned unbuilt corridors bought (franchise) then built out (structure placement, staged, segment phases). **Tolls: % of cargo value, system-capped.** Buildout = demand shock for iron/wood.
- Transport ladder: walk < road < rail < boat. Free-but-slow roads vs tolled-but-fast rail.

---

## 8. Financial System — LOCKED

- One central order book/price feed; province exchange buildings are local terminals. Server-authoritative. Exchange tier sets position limits, instruments, fees.
- Day trading: tick every 30–60s = fundamentals from world data + bounded volatility.
- **Access:** physical presence at the exchange required until late-game. **Stacked remote unlock:** province exchange tier makes terminals available; players buy personal terminals. Double sink.
- **Contents staged by era, cleanest → dirtiest:**
  1. **System-backed funds** (sector/index instruments computed from world data) — analyzable, un-swingable.
  2. **Commodity contracts** with guardrails (position limits by terminal/exchange tier) — cornering possible but visible and expensive.
  3. **Player-business IPOs** — last, only after the crime system exists. Insider trading is a CRIME, policed with bounties/enforcement. Manipulation isn't prevented; it's policed.

---

## 9. NPCs — LOCKED

- **Body:** Bedrock built-in NPC entity — dialogue + preset reply buttons that branch or trigger scripts. Villager or custom skins. Employees and pedestrians are villagers.
- **Brain:** state-aware dialogue engine — templates × live world data × personality filters × per-NPC memory. Every new system automatically becomes gossip. No LLM (Realms has no network access; self-hosted = someday-door).
- Casts: shopkeepers, clerks, guards, customers (haggler/regular/big-spender), bandits, tutorial narrator.

---

## 10. World Systems

- **Death — LOCKED:** everything carried is lost + medical bills (**flat fee + small % of wealth**). Respawn at your house. Bank deposits safe. Future update: 50%-keep insurance product.
- **PvP — LOCKED zoned model:** inside provinces, the leader's law decides (safe haven / duel-legal / lawless). Wilderness and inter-province routes are PvP-ON by default — human danger shares the same geography as NPC bandits. Murder inside a lawful province = a crime (bounty fodder), not an impossibility.
- **Wilderness — LOCKED protected scenery:** unclaimed terrain unbreakable except surface renewables (leaves, grass, planted crops). Extraction happens in work zones; building happens in provinces, purchased plots, and scattered homestead zones. The hand-built map survives forever.
- **Hunger — LOCKED: kept.** Vanilla hunger is the food economy's metronome (permanent daily demand for farms/bakery/grocer). Food-quality buffs to be added in the consumption session.
- **Permanence & Aging (LOCKED):** built means built forever — buildings are world history. Demolition only by owner's election (staged, costed); abandoned structures stand. **Aging system:** unvisited areas slide through decay states (pristine → weathered → cracked/mossy → vine-swallowed ruin) via block-state skins from the placement engine, lazily applied on approach. Presence is maintenance. Ruins of failed ventures become the world's archaeology; renovation restores bought ruins.
- **Housing:** exists (respawn anchor) — purchasable, upgradeable, location matters. Detail in consumption session.
- **Onboarding — LOCKED:** tutorial space, shown EVERYTHING, comedic orientation tone, narrator reads live stats deadpan.
- **Bounty system:** full system (place bounties, board building, tracking) — anchor of the crime session.
- **CRIME & PUNISHMENT (COMPLETE — LOCKED):**
  - **Two-tier law:** Meridian federal law (system crimes: market manipulation, exploit abuse, harming federation machinery) applies everywhere; provincial law (murder/assault per PvP zoning, trespass past Closed/Hostile borders, post-sovereignty bans like substances). A crime exists only if mechanically detectable.
  - **Detection:** ledger crimes ALWAYS caught. Physical crimes need a WITNESS (NPC/guard/player in sight range) — no witness, no record: perfect crimes possible. Witnesses matter; escorts are testimony; busy roads are safe because they're busy.
  - **Launch crimes:** murder (lawful zones), theft, trespass, smuggling — code grows era by era.
  - **Wanted status:** witnessed serious crime → record + auto-posted provincial warrant (province-funded standing bounty, stackable). Warrants provincial by default + opt-in honoring → outlaw havens can exist (sanctuary provinces taxing fugitives: crime creates geography).
  - **The reckoning (NEVER make the player wait — fines only, no time punishment ever):** arrest → ceremonial teleport to courthouse → ledger settles: restitution to victims + fine to province + record marked. Can't pay → debt attaches: cash → goods → forced property auction (bank foreclosure machinery). Escalation: multiplied fines → exile (permanent border ban) → federal suspension (mint/bank access frozen until debts clear). Young provinces use Meridian's federal courthouse until they build their own.
  - **Bounty board, two lanes:** system WARRANTS (arrest, deliver to courthouse) + player CONTRACTS (escrowed death contracts paying only where killing is already legal). Bounty hunting = licensed trade reading both lanes.
  - **Robbery:** physical break-in on system-held storage — breaker kit, tense audible breach, grab from the terminal. Limits: carry cap (inventory is the getaway bag), haul cap (~15–20% of stock max), witness rules apply. Counter-industry: security tiers (locks = longer breach, alarms = owner device ping + guards, night watchmen) — protection as purchasable sink.
  - **THE GREAT GOLD ROBBERY (IN):** armored NPC shipments (dealer → Fort Knox) on unpublished schedules, heavy escort. Heisting one = federal crime, instant maximum heat (massive bounty, suspension, guards hostile forever). Monetarily safe: stolen gold never reached reserves — nothing prints; fencing it trips anomaly wires unless sold slow (or hoarded as independence-vault seed stock). Rare, brutal, legendary.
  - **Market crimes:** wash trading/exploits flagged instantly; insider trading + cornering enforceable when Stage 2/3 instruments arrive — courthouse reckoning, profit-scaled fines, trading suspensions.
- **Consumption: PARKED** — abundant + USEFUL. Candidates: housing tiers, food buffs, transport ownership, gear, insurance, leisure.

### Vanilla Surgery
| System | Ruling |
|---|---|
| Enchanting | Economy-routed: enchanter business + XP licenses + money (LOCKED) |
| Villagers | Trading stripped; villagers as NPC cast/set dressing (LOCKED) |
| Nether | Sealed; future update, portal-as-gateway concept noted (LOCKED) |
| The End | Sealed; elytra never returns (LOCKED) |
| Mob drops | Worthless if farmable; high-value mobs map-authored on routes only, or drops off entirely (LOCKED direction) |
| XP | Reworked into skill licenses (LOCKED) |

---

## 11. Technical Architecture

- **Stack:** TypeScript @minecraft/server + JSON packs, built in Cursor. Local flat-world testing → Realm.
- **Map pipeline:** WorldPainter → Java export → Chunker → master Bedrock world. Terrain first, never round-trip. Towns hand-built to block level (biggest time cost). Plots at MAX footprint day one. Map must include: the authored **gold country** (precious mining region, deep mountains), **public commons zones in every town**, and Meridian designed to renovate through all six world eras.
- **Shared placement engine:** one code path for business tiers, civic buildings, wings, rail, roads. Structure library built once; biome palette-swapping.
- **Placement doctrine (LOCKED):** every structure claims its FINAL-tier plot at placement — pad flattens to max footprint, tier-1 building starts wherever growth reads best (designed per building). Foundation pass molds terrain: graded slopes, terraces, biome-matched blending — never a cliff-cut; too-jagged sites REFUSED (red ghost: "ground's too rough") → flat land near resources becomes premium real estate. District templates inherit pad-and-blend at district scale.
- **Spawn inventory:** world ships with Meridian complete (all Settlement-tier civics, Fort Knox, districts, seeded NPCs, locked exchange shell), starter towns (pre-built CPU trades on final-size pads, commons, dirt roads), gold country, marked rail corridors, CPU gateways, bandit zones, homestead zones. Player-built always: provinces (free auto-staged town hall), zoning, chartered businesses, homes, walls-by-era, road/rail buildouts, courthouses.
- **Tier & Cost Matrix:** every buildable thing gets a row (tier, price, build time, footprint, requirements) in ONE editable data file, drafted in the Layer 1 spec, all numbers flagged for playtest tuning.
- **Plot registry:** anchor/facing/footprint/tier/owner per building — powers upgrades, protection toasts, appraisals.
- **Transactions:** server-side, atomic. One central ledger; one market engine.
- **Third-party add-ons:** stacking works (packs coexist in one world); integration is loose-coupled only — our scripts observe their entities (toll zones, cargo, ridership) but never depend on their code. Free community packs preferred over encrypted Marketplace packs for integration. Our rail works with vanilla minecarts standalone; a vetted train add-on can slot in as the vehicle layer at Layer 3. Compatibility + Realm test per pack; treat every dependency as a maintenance commitment.
- **Backup discipline (LOCKED, non-negotiable):** Realm auto-backups ON + weekly manual world download to PC + cloud copy before every shipped update.
- **Realms constraints:** no script network access; experimental toggles OK for console joiners; add-on travels with the world.

---

## 11.4 The HUD (LOCKED)
**Permanent:** vanilla survival core; XP bar repurposed as skill-license meter; wallet chip (CASH only — bank balance NEVER on HUD: knowing it takes a bank visit or late-era device); danger skull glyph whenever standing in PvP-enabled ground (safety-critical, always true). **Contextual actionbar (one line, one context):** clocked-in job + live session earnings / contract destination+pay+timer / stakes remaining / build timer on-site. **Event layer:** border banners, narrator-voice toasts, effect theater. **Era arc — the HUD modernizes with civilization:** Settlement–Township sparse (world is the interface); Industrial adds QoL; Modern brings the personal device (openable overlay: bank, portfolio, demand, bounty feed + business notification pings); Financial = full connected dashboard incl. reserve-ratio widget. A screenshot of any HUD reveals era, job, cash, and danger — the screen obeys the visual law.

## 11.5 Companion Documents
- **UI Design System** (ui-design-system.md) — governs every screen, every update. Seven patterns, Emerald Edition tokens, glyph set, console rules, ship checklist.
- **Player Handbook** (economy-world-handbook.pdf) — the Emerald Edition guide; doubles as tutorial script and recruitment drop.
- **Architecture Bible** (build-phase, to be authored) — one page per building type: 3–5 real-world reference photos, the archetype's signature elements, and Minecraft translation notes per era × biome. Every service building modeled on a real business; no block placed before the references are on the table.

## 12. Release Layers

1. **Playable economy:** currency, bank, starter trades, CPU storefronts, buyouts. One starter town.
2. **Capital:** upgrades, storage, employees, valuations, auctions/flipping.
3. **Geography:** more towns, roads, rail, merchants, regional prices.
4. **Politics:** provinces, borders, hostility, civic buildings, external trade.
5. **Finance:** stock market (staged contents), era maturity, terminals.

**Rule: Layer 1 live before Layer 3 built.** Rollout = the era system.

**Future-update shelf:** Nether, The End, clearable bandit camps, death insurance, gateway contestability, **full military system (province warfare — declared wars, war goals, peace terms; walls/guards/war-economy already in place)**, LLM NPCs (someday-door).

---

## 12.5 Design Details Ledger (the small locked stuff)
- Auction luck boosts bounded (~+25–40% cap, low odds) — unbounded = printable exploit.
- Dealer daily capacity: mint buy price softens with volume; hoard-dumping self-limits and telegraphs.
- Catalog listings always show price + footprint + build time; non-fitting/locked entries show with lock glyph and requirement, never a failing Confirm.
- Construction timers scale with build size (cottage: minutes; mansion: days) — big spending is visible time.
- Border banners: color-coded, personalized ("You are welcome here" / "You are NOT welcome here").
- Walls: modular vanilla-block segment kits (straight/corner/gate) per era × biome, stamped along the border polygon, terrain-following; gates at road crossings, manned by guards; non-owners can't break wall blocks (registry-enforced).
- Founding: hammer can remove the last stake; self-crossing borders rejected with toast; enclosed water OK; stake-count budget + base area allowance + per-block overage at the sky-reveal confirm.
- Drunk: nausea/slowness/liquid-courage stack, slurred NPC toasts, hangover debuff (mining fatigue + weakness) next morning. High: custom consumables, fog/camera/particle states, real tradeoffs (perception up, coordination down).
- Contraband: provinces ban substances under sovereignty → smuggling as a movement trade (border checks, hidden cargo, prohibition markup).
- NPC gossip = market data: tavern talk, sanctions script in the same warm voice, independence-prep commentary ("curious how much gold your province keeps at home these days").
- Armored NPC gold shipments (dealer → Fort Knox) — the "Great Gold Robbery question," decided in the crime session.
- Work-zone regen is a visible process, never an event: stump→sapling→tree; mine faces advance with glint states; vanilla crop stages; fishery stock as fish density.
- Reserve board at the exchange: circulation, reserves, ratio trend — public, the world's most important number.
- Exchange spread on Stage-1 funds is both the liquidity solution and a money sink.
- Freelance sales route only to the matching business; commons deliberately humbler than work zones.
- Employee AFK boost never reaches 100% — owner presence uniquely runs capacity (goat doctrine).
- Meridian tuning: floor-not-ceiling — slightly worse prices/fees than player provinces can offer, pushing growth outward.
- Tutorial narrator = Meridian's voice (HR-department-of-a-utopia tone), reads live world stats deadpan.

## 13. Remaining Items

**Tuning numbers (playtest, not design):** stipend amount, transfer fee, loan LTV % + rates, tax bound (0–15%?), employee AFK ceiling %, luck-boost odds/cap, civic slot counts, freelancer rate within 40–50%, CPU restock rates, Province XP thresholds per era, toll caps, wage tables, stake count budget, base area allowance + per-block overage price, homestead zone density.

**Spec-level details (decided during Layer 1 spec):** clock-in/out mechanics, boat ownership model, cooldown on citizenship moves.

**Parked deep sessions:**
1. **Crime & punishment** — bounties, robbery, insider enforcement, murder statutes, gateway contestability, contraband, the armored gold shipments question. (Roster: SIGNED — 26 trades incl. Construction Co.)
3. **Consumption** — why make money (food buffs, housing tiers, gear, leisure, vice detail). Price algorithm: DONE (v1 accepted above).
4. **Financial era deep design** — fund composition, commodity contracts, IPO rules.
5. **Layer 1 technical spec** — roster is closed; write next.
