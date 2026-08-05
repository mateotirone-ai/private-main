/**
 * Public commons — sell-to-matching-business at freelance rate (layer1 Phase C / master Commons).
 * Zone regen / gather nodes are Phase D; this is the sell floor.
 */
import type { Player } from "@minecraft/server";
import { balance, transfer, type LedgerState } from "../core/ledger";
import { matrix } from "../content/matrix";
import { commonsZones, tradeDef } from "../content/trades";
import { currentTick } from "../core/scheduler";
import { bareAmount, merids } from "../ui/theme";
import { Voice } from "../ui/voice";
import { toast } from "../ui/toast";
import { menuHub, confirmTxn } from "../ui/patterns";
import { countItem, takeItems } from "./cash";
import {
  type BusinessesState,
  bizAccount,
  ensureBizFloat,
  saveBusinesses,
} from "./businesses";
import { currentUnitPrice, adjustStock, savePrices, type PricesState } from "./pricing";
import { freelancePayout } from "./pricingMath";
import { playerAccount } from "./bank";

export async function openCommons(
  player: Player,
  ledger: LedgerState,
  bizState: BusinessesState,
  prices: PricesState
): Promise<void> {
  const zones = commonsZones();
  await menuHub(player, {
    title: "Public Commons",
    facts: [`Zones: ${zones.length}`, `Freelance rate: ${Math.round(matrix.freelanceRate * 100)}%`],
    narrator: Voice.commonsWelcome,
    buttons: zones.map((z) => ({
      label: `Sell ${z.good} — ${z.name}`,
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
    toast(player, Voice.error, "error");
    return;
  }
  const qty = countItem(player, def.item);
  if (qty <= 0) {
    toast(player, Voice.shopNoGoods, "caution");
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
      `Selling: ${qty} ${good}`,
      `Market: ${bareAmount(unitMarket)} each`,
      `Freelance rate: ${Math.round(matrix.freelanceRate * 100)}%`,
      `Buyer: ${def.name}`,
    ],
    lines: [{ label: "Payout", amount: payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + payout,
    narrator: Voice.commonsWelcome,
  });
  if (!ok) return;
  const taken = takeItems(player, def.item, qty);
  if (taken !== qty) {
    toast(player, Voice.error, "error");
    return;
  }
  try {
    ensureBizFloat(ledger, bizId, payout);
    transfer(ledger, bizAccount(bizId), acct, payout, currentTick(), "commons:sell");
    const room = Math.max(0, def.storageCap - biz.storage);
    const stored = Math.min(taken, room);
    biz.storage += stored;
    adjustStock(prices, good, stored);
    saveBusinesses(bizState);
    savePrices(prices);
    toast(player, Voice.commonsSellOk(`${taken} ${good}`, merids(payout)), "gain");
  } catch (e) {
    console.error(`[ew] commons sell failed: ${e}`);
    toast(player, Voice.error, "error");
  }
}
