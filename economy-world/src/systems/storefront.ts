/**
 * Storefront NPC — P3 buy / P2 freelancer sell at cfg rate (layer1 §4.6).
 * No new icon glyphs on Phase C screens (A1.5).
 */
import type { Player } from "@minecraft/server";
import {
  balance,
  transfer,
  type LedgerState,
  LedgerError,
} from "../core/ledger";
import { matrix } from "../content/matrix";
import { tradeDef } from "../content/trades";
import { currentTick } from "../core/scheduler";
import { bareAmount, merids } from "../ui/theme";
import { Voice } from "../ui/voice";
import { toast } from "../ui/toast";
import { menuHub, catalog, confirmTxn } from "../ui/patterns";
import { countItem, takeItems, giveItem } from "./cash";
import {
  type BusinessesState,
  type Business,
  bizAccount,
  ensureBizFloat,
  saveBusinesses,
} from "./businesses";
import { currentUnitPrice, adjustStock, savePrices, type PricesState } from "./pricing";
import { freelancePayout } from "./pricingMath";
import { playerAccount } from "./bank";

export async function openStorefront(
  player: Player,
  ledger: LedgerState,
  bizState: BusinessesState,
  prices: PricesState,
  bizId: string
): Promise<void> {
  const biz = bizState.byId[bizId];
  if (!biz) {
    toast(player, Voice.error, "error");
    return;
  }
  const def = tradeDef(biz.trade);
  const unit = currentUnitPrice(prices, def.good);
  await menuHub(player, {
    title: def.name,
    facts: [
      `Stock: ${biz.storage}`,
      `Price: ${bareAmount(unit)} each`,
      `Freelance rate: ${Math.round(matrix.freelanceRate * 100)}%`,
    ],
    narrator: Voice.shopWelcome,
    buttons: [
      {
        label: "Buy",
        onSelect: () => buyFlow(player, ledger, bizState, prices, biz),
      },
      {
        label: "Sell (freelancer)",
        onSelect: () => sellFlow(player, ledger, bizState, prices, biz),
      },
    ],
  });
}

async function buyFlow(
  player: Player,
  ledger: LedgerState,
  bizState: BusinessesState,
  prices: PricesState,
  biz: Business
): Promise<void> {
  const def = tradeDef(biz.trade);
  if (biz.storage <= 0) {
    toast(player, Voice.shopEmpty, "caution");
    return;
  }
  const unit = currentUnitPrice(prices, def.good);
  const maxBuy = Math.min(biz.storage, 64);
  await catalog(player, {
    title: `Buy — ${def.name}`,
    facts: [`In stock: ${biz.storage}`],
    narrator: Voice.shopWelcome,
    entries: [
      {
        name: `${def.good} ×1`,
        price: unit,
        detailFacts: [`Good: ${def.good}`, `Stock: ${biz.storage}`],
        onBuy: () => confirmBuy(player, ledger, bizState, prices, biz, 1, unit),
      },
      {
        name: `${def.good} ×${Math.min(8, maxBuy)}`,
        price: unit * Math.min(8, maxBuy),
        locked: maxBuy < 8,
        lockReason: Voice.shopEmpty,
        onBuy: () =>
          confirmBuy(player, ledger, bizState, prices, biz, Math.min(8, maxBuy), unit),
      },
      {
        name: `${def.good} ×${maxBuy} (max)`,
        price: unit * maxBuy,
        onBuy: () => confirmBuy(player, ledger, bizState, prices, biz, maxBuy, unit),
      },
    ],
  });
}

async function confirmBuy(
  player: Player,
  ledger: LedgerState,
  bizState: BusinessesState,
  prices: PricesState,
  biz: Business,
  qty: number,
  unit: number
): Promise<void> {
  const def = tradeDef(biz.trade);
  const live = bizState.byId[biz.id]!;
  if (live.storage < qty) {
    toast(player, Voice.shopEmpty, "caution");
    return;
  }
  const total = unit * qty;
  const acct = playerAccount(player);
  const before = balance(ledger, acct);
  if (before < total) {
    toast(player, Voice.transferFailFunds, "error");
    return;
  }
  const ok = await confirmTxn(player, {
    title: "Buy",
    facts: [
      `Buying: ${qty} ${def.good}`,
      `Price: ${bareAmount(unit)} each`,
    ],
    lines: [{ label: "Cost", amount: total, sense: "loss" }],
    balanceBefore: before,
    balanceAfter: before - total,
    narrator: Voice.shopWelcome,
  });
  if (!ok) return;
  try {
    transfer(ledger, acct, bizAccount(biz.id), total, currentTick(), "shop:buy");
    live.storage -= qty;
    adjustStock(prices, def.good, -qty);
    giveItem(player, def.item, qty);
    saveBusinesses(bizState);
    savePrices(prices);
    toast(player, Voice.shopBuyOk(`${qty} ${def.good}`, merids(total)), "gain");
  } catch (e) {
    if (e instanceof LedgerError) toast(player, Voice.transferFailFunds, "error");
    else {
      console.error(`[ew] shop buy failed: ${e}`);
      toast(player, Voice.error, "error");
    }
  }
}

async function sellFlow(
  player: Player,
  ledger: LedgerState,
  bizState: BusinessesState,
  prices: PricesState,
  biz: Business
): Promise<void> {
  const def = tradeDef(biz.trade);
  const qty = countItem(player, def.item);
  if (qty <= 0) {
    toast(player, Voice.shopNoGoods, "caution");
    return;
  }
  const unitMarket = currentUnitPrice(prices, def.good);
  const payout = freelancePayout(
    prices.goods[def.good]?.current ?? unitMarket,
    qty,
    matrix.freelanceRate
  );
  // for mint-tier goods sold at storefront (precious_mine), use base*rate via current pinned to base
  const acct = playerAccount(player);
  const before = balance(ledger, acct);
  const ok = await confirmTxn(player, {
    title: "Sell (freelancer)",
    facts: [
      `Selling: ${qty} ${def.good}`,
      `Market: ${bareAmount(unitMarket)} each`,
      `Freelance rate: ${Math.round(matrix.freelanceRate * 100)}%`,
    ],
    lines: [{ label: "Payout", amount: payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + payout,
    narrator: Voice.shopWelcome,
  });
  if (!ok) return;
  const taken = takeItems(player, def.item, qty);
  if (taken !== qty) {
    toast(player, Voice.error, "error");
    return;
  }
  try {
    const live = bizState.byId[biz.id]!;
    ensureBizFloat(ledger, biz.id, payout);
    transfer(ledger, bizAccount(biz.id), acct, payout, currentTick(), "shop:freelance");
    const room = Math.max(0, def.storageCap - live.storage);
    const stored = Math.min(taken, room);
    live.storage += stored;
    adjustStock(prices, def.good, stored);
    saveBusinesses(bizState);
    savePrices(prices);
    toast(player, Voice.shopSellOk(`${taken} ${def.good}`, merids(payout)), "gain");
  } catch (e) {
    console.error(`[ew] shop sell failed: ${e}`);
    toast(player, Voice.error, "error");
  }
}
