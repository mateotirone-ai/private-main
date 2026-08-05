/**
 * Commodity Dealer — layer1 §4.4.
 * Sell gold/diamonds → Ledger.mint(mint:dealer) + reserve + daily-capacity softening.
 * Screens conform to ui-amendment-1.md A1.1–A1.4.
 */
import type { Player } from "@minecraft/server";
import { mint, balance, type LedgerState } from "../core/ledger";
import { dealerCapacity, dealerSoftFloor, type PreciousGood } from "../content/matrix";
import { basePrice, PRECIOUS_ITEMS } from "../content/prices";
import { currentTick } from "../core/scheduler";
import { Glyph, bareAmount, merids } from "../ui/theme";
import { Voice } from "../ui/voice";
import { toast } from "../ui/toast";
import { menuHub, confirmTxn, progressPanel } from "../ui/patterns";
import { quoteSale, unitMultiplier } from "./dealerMath";
import { countItem, takeItems } from "./cash";
import { addReserve, loadReserve, saveReserve } from "./reserve";
import { loadDealerState, saveDealerState, rollDealerDay } from "./dealerState";
import { playerAccount } from "./bank";

const GOOD_LABEL: Record<PreciousGood, string> = {
  gold: "gold ingots",
  diamond: "diamonds",
};

export async function openDealer(player: Player, ledger: LedgerState): Promise<void> {
  await menuHub(player, {
    title: "Commodity Dealer",
    glyph: Glyph.coin,
    facts: ["Assay window open"],
    narrator: Voice.dealerWelcome,
    buttons: [
      { label: "Sell gold", glyph: Glyph.up, onSelect: () => sellFlow(player, ledger, "gold") },
      { label: "Sell diamonds", glyph: Glyph.up, onSelect: () => sellFlow(player, ledger, "diamond") },
      { label: "Prices today", glyph: Glyph.clock, onSelect: () => pricesBoard(player) },
    ],
  });
}

async function sellFlow(player: Player, ledger: LedgerState, good: PreciousGood): Promise<void> {
  const typeId = PRECIOUS_ITEMS[good];
  const qty = countItem(player, typeId);
  if (qty <= 0) {
    toast(player, Voice.dealerEmpty(good), "caution");
    return;
  }
  const dState = loadDealerState();
  rollDealerDay(dState, currentTick());
  const quote = quoteSale(
    qty,
    basePrice(good),
    dState.soldToday[good],
    dealerCapacity(good),
    dealerSoftFloor()
  );
  const acct = playerAccount(player);
  const before = balance(ledger, acct);
  const unitLabel = GOOD_LABEL[good];
  const facts = [
    `Selling: ${qty} ${unitLabel}`,
    quote.softened
      ? `Price: ${bareAmount(quote.avgUnitPrice)} each (softened from ${bareAmount(quote.base)} — high volume today)`
      : `Price: ${bareAmount(quote.base)} each`,
  ];
  const ok = await confirmTxn(player, {
    title: `Sell ${good}`,
    glyph: Glyph.coin,
    facts,
    lines: [{ label: "Payout", amount: quote.payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + quote.payout,
    narrator: quote.softened ? Voice.dealerSoft : Voice.dealerSellNarrator,
  });
  if (!ok) return;

  const taken = takeItems(player, typeId, qty);
  if (taken !== qty) {
    toast(player, Voice.error, "error");
    return;
  }
  rollDealerDay(dState, currentTick());
  const finalQuote = quoteSale(
    taken,
    basePrice(good),
    dState.soldToday[good],
    dealerCapacity(good),
    dealerSoftFloor()
  );
  mint(ledger, acct, finalQuote.payout, currentTick(), "mint:dealer");
  dState.soldToday[good] += taken;
  saveDealerState(dState);
  const reserve = loadReserve();
  addReserve(reserve, good, taken);
  saveReserve(reserve);
  toast(player, Voice.dealerSold(good, taken, merids(finalQuote.payout)), "gain");
}

async function pricesBoard(player: Player): Promise<void> {
  const dState = loadDealerState();
  rollDealerDay(dState, currentTick());
  const reserve = loadReserve();
  const rows = (["gold", "diamond"] as PreciousGood[]).map((good) => {
    const cap = dealerCapacity(good);
    const sold = dState.soldToday[good];
    const mult = unitMultiplier(sold, cap, dealerSoftFloor());
    const unit = Math.floor(basePrice(good) * mult);
    return {
      label: `${good}`,
      filled: sold,
      total: cap,
      note: `Unit: ${bareAmount(unit)} (base ${bareAmount(basePrice(good))})`,
      ok: mult >= 0.99,
    };
  });
  await progressPanel(player, {
    title: "Prices today",
    glyph: Glyph.coin,
    facts: [
      `Reserve gold: ${reserve.goldUnits}`,
      `Reserve diamond: ${reserve.diamondUnits}`,
    ],
    narrator: Voice.pricesBoard,
    rows,
  });
}
