/**
 * Commodity Dealer — layer1 §4.4.
 * Sell gold/diamonds → Ledger.mint(mint:dealer) + reserve increment + daily-capacity softening.
 */
import type { Player } from "@minecraft/server";
import { mint, balance, type LedgerState } from "../core/ledger";
import { dealerCapacity, dealerSoftFloor, type PreciousGood } from "../content/matrix";
import { basePrice, PRECIOUS_ITEMS } from "../content/prices";
import { currentTick } from "../core/scheduler";
import { Glyph, money } from "../ui/theme";
import { Voice } from "../ui/voice";
import { toast } from "../ui/toast";
import { menuHub, confirmTxn, progressPanel } from "../ui/patterns";
import { quoteSale, unitMultiplier } from "./dealerMath";
import { countItem, takeItems } from "./cash";
import { addReserve, loadReserve, saveReserve } from "./reserve";
import { loadDealerState, saveDealerState, rollDealerDay } from "./dealerState";
import { playerAccount } from "./bank";

export async function openDealer(player: Player, ledger: LedgerState): Promise<void> {
  await menuHub(player, {
    title: "Commodity Dealer",
    glyph: Glyph.coin,
    context: Voice.dealerWelcome,
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
  const ok = await confirmTxn(player, {
    title: `Sell ${good}`,
    glyph: Glyph.coin,
    context: quote.softened
      ? `${Voice.dealerSoft}\n${qty} × ~${money(quote.avgUnitPrice)} (base ${money(quote.base)})`
      : `${qty} × ${money(quote.base)}`,
    lines: [{ label: "Payout", amount: quote.payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + quote.payout,
  });
  if (!ok) return;

  const taken = takeItems(player, typeId, qty);
  if (taken !== qty) {
    toast(player, Voice.error, "error");
    return;
  }
  // re-quote if somehow day rolled mid-flow
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
  toast(player, Voice.dealerSold(good, taken, money(finalQuote.payout)), "gain");
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
      label: `${good}: ${money(unit)} / unit (base ${money(basePrice(good))})`,
      filled: sold,
      total: cap,
      note: `sold today ${sold}/${cap} · mult ${mult.toFixed(2)}`,
      ok: mult >= 0.99,
    };
  });
  await progressPanel(player, {
    title: "Prices today",
    glyph: Glyph.coin,
    context: `${Voice.pricesBoard}\nReserve: gold ${reserve.goldUnits} · diamond ${reserve.diamondUnits}`,
    rows,
  });
}
