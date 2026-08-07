/**
 * Public commons — sell-to-matching-business at freelance rate (layer1 Phase C / master Commons).
 * Zone regen / gather nodes are Phase D; this is the sell floor.
 */
import type { Player } from "@minecraft/server";
import { balance, type LedgerState } from "../core/ledger";
import { matrix } from "../content/matrix";
import { allTradeIds, commonsZones, tradeDef } from "../content/trades";
import { currentTick } from "../core/scheduler";
import { bareAmount, merids } from "../ui/theme";
import { Voice } from "../ui/voice";
import { feedback } from "../ui/feedback";
import { menuHub, confirmTxn } from "../ui/patterns";
import { countItem, giveItem, takeItems } from "./cash";
import {
  type BusinessesState,
  businessStorageCap,
  bizAccount,
  ensureBizFloat,
  saveBusinesses,
} from "./businesses";
import { currentUnitPrice, adjustStock, savePrices, type PricesState } from "./pricing";
import { freelancePayout } from "./pricingMath";
import { playerAccount } from "./bank";
import { paySaleCashFromAccount } from "./saleCash";

function displayGood(good: string): string {
  if (good === "log") return "logs";
  return good.replaceAll("_", " ");
}

function wrongCommonsDoor(player: Player, expectedGood: string): string {
  const heldTrade = allTradeIds().find(
    (trade) => countItem(player, tradeDef(trade).item) > 0
  );
  if (!heldTrade) {
    return `This desk buys ${displayGood(expectedGood)} — other goods go to their matching business.`;
  }
  const destination = tradeDef(heldTrade);
  return `This desk buys ${displayGood(expectedGood)} — ${displayGood(destination.good)} goes to the ${destination.name}.`;
}

export async function openCommons(
  player: Player,
  ledger: LedgerState,
  bizState: BusinessesState,
  prices: PricesState
): Promise<void> {
  const zones = commonsZones();
  await menuHub(player, {
    title: "Public Commons",
    facts: [`Zones: ${zones.length}`, "All sales pay physical cash"],
    narrator: Voice.commonsWelcome,
    buttons: zones.map((z) => ({
      label: `Sell ${displayGood(z.good)} — ${z.name}`,
      onSelect: () => sellAtZone(player, ledger, bizState, prices, z.trade, z.good, z.name),
    })),
  });
}

async function sellAtZone(
  player: Player,
  ledger: LedgerState,
  bizState: BusinessesState,
  prices: PricesState,
  tradeId: string,
  good: string,
  zoneName: string
): Promise<void> {
  const def = tradeDef(tradeId);
  const bizId = `cpu_${tradeId}`;
  const biz = bizState.byId[bizId];
  if (!biz) {
    feedback(player, Voice.error, "error");
    return;
  }
  const qty = countItem(player, def.item);
  if (qty <= 0) {
    feedback(player, wrongCommonsDoor(player, good), "caution");
    return;
  }
  const unitMarket = currentUnitPrice(prices, good);
  const current = prices.goods[good]?.current ?? unitMarket;
  const payout = freelancePayout(current, qty, matrix.freelanceRate);
  const acct = playerAccount(player);
  const before = balance(ledger, acct);
  const ok = await confirmTxn(player, {
    title: zoneName,
    facts: [
      `Selling: ${qty} ${displayGood(good)}`,
      `Market: ${bareAmount(unitMarket)} each`,
      `You receive: ${merids(payout)} — cash`,
      `Buyer: ${def.name}`,
    ],
    lines: [{ label: "Cash payout", amount: payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before,
    narrator: Voice.commonsWelcome,
  });
  if (!ok) return;
  let taken = 0;
  let paid = false;
  try {
    taken = takeItems(player, def.item, qty);
    if (taken !== qty) {
      if (taken > 0) giveItem(player, def.item, taken);
      feedback(player, Voice.error, "error");
      return;
    }
    ensureBizFloat(ledger, bizId, payout);
    const available = balance(ledger, bizAccount(bizId));
    if (available < payout) {
      if (taken > 0) giveItem(player, def.item, taken);
      feedback(player, "Buyer account is temporarily short on funds.", "error");
      return;
    }
    paySaleCashFromAccount(
      ledger,
      player,
      bizAccount(bizId),
      payout,
      currentTick(),
      "commons:sell"
    );
    paid = true;
    const room = Math.max(0, businessStorageCap(biz) - biz.storage);
    const stored = Math.min(taken, room);
    biz.storage += stored;
    adjustStock(prices, good, stored);
    saveBusinesses(bizState);
    savePrices(prices);
    feedback(player, Voice.commonsSellOk(`${taken} ${displayGood(good)}`, merids(payout)), "gain");
  } catch (e) {
    if (taken > 0 && !paid) giveItem(player, def.item, taken);
    console.error(`[ew] commons sell failed: ${e}`);
    feedback(player, Voice.error, "error");
  }
}
