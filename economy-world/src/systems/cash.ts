/**
 * Physical cash items — ew:cash_1/10/100/1000 + ew:wallet carry.
 * Bank.withdraw and player-sale settlement spawn ledger-backed cash.
 * Wallet packs/unpacks existing notes so inventory stays tidy.
 */
import type { Player, Container } from "@minecraft/server";
import { ItemStack } from "@minecraft/server";
import { cashDenominations } from "../content/matrix";
import { breakIntoCash, carriedCashTotal, sumCash } from "./bankMath";

export const WALLET_ID = "ew:wallet";
const WALLET_BAL_KEY = "ew:bal";

export function cashItemId(denom: number): string {
  return `ew:cash_${denom}`;
}

export function parseCashDenom(typeId: string): number | undefined {
  const m = /^ew:cash_(\d+)$/.exec(typeId);
  if (!m) return undefined;
  return Number(m[1]);
}

function invOf(player: Player): Container | undefined {
  return player.getComponent("inventory")?.container;
}

export function getWalletBalance(item: ItemStack): number {
  const v = item.getDynamicProperty(WALLET_BAL_KEY);
  return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : 0;
}

export function setWalletBalance(item: ItemStack, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) throw new Error(`bad wallet bal ${amount}`);
  item.setDynamicProperty(WALLET_BAL_KEY, amount);
  item.nameTag = amount > 0 ? `Wallet (${amount} merids)` : "Wallet";
}

/** Find first wallet in inventory. */
export function findWallet(player: Player): { item: ItemStack; slot: number } | undefined {
  const inv = invOf(player);
  if (!inv) return undefined;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item?.typeId === WALLET_ID) return { item, slot: i };
  }
  return undefined;
}

/** Loose notes only (not wallet contents). */
export function countLooseCash(player: Player): {
  total: number;
  stacks: { denom: number; count: number; slot: number }[];
} {
  const inv = invOf(player);
  const stacks: { denom: number; count: number; slot: number }[] = [];
  if (!inv) return { total: 0, stacks };
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (!item) continue;
    const denom = parseCashDenom(item.typeId);
    if (denom === undefined) continue;
    stacks.push({ denom, count: item.amount, slot: i });
  }
  return { total: sumCash(stacks), stacks };
}

/** Loose notes + wallet balance (carried merids for deposit). */
export function countCarriedCash(player: Player): { total: number; loose: number; wallet: number } {
  const loose = countLooseCash(player).total;
  const w = findWallet(player);
  const wallet = w ? getWalletBalance(w.item) : 0;
  return { total: carriedCashTotal(loose, wallet), loose, wallet };
}

/** Alias kept for older call sites. */
export function countCashInInventory(player: Player): {
  total: number;
  stacks: { denom: number; count: number; slot: number }[];
} {
  return countLooseCash(player);
}

function takeLooseCash(player: Player): number {
  const { total, stacks } = countLooseCash(player);
  const inv = invOf(player);
  if (!inv) return 0;
  for (const s of stacks) inv.setItem(s.slot, undefined);
  return total;
}

/** Remove all carried cash (loose + empty wallet balance). Returns face value. */
export function takeAllCarriedCash(player: Player): number {
  const loose = takeLooseCash(player);
  const w = findWallet(player);
  let wallet = 0;
  if (w) {
    wallet = getWalletBalance(w.item);
    if (wallet > 0) {
      setWalletBalance(w.item, 0);
      invOf(player)?.setItem(w.slot, w.item);
    }
  }
  return loose + wallet;
}

export function takeAllCash(player: Player): number {
  return takeAllCarriedCash(player);
}

function giveNotes(player: Player, amount: number): void {
  if (amount <= 0) return;
  const parts = breakIntoCash(amount, cashDenominations());
  const inv = invOf(player);
  if (!inv) throw new Error("no inventory");
  for (const p of parts) {
    let left = p.count;
    while (left > 0) {
      const n = Math.min(64, left);
      const stack = new ItemStack(cashItemId(p.denom), n);
      const leftover = inv.addItem(stack);
      if (leftover) player.dimension.spawnItem(leftover, player.location);
      left -= n;
    }
  }
}

/**
 * Spawn cash after Ledger.cashOut.
 * Prefers packing into an existing wallet; otherwise loose notes.
 * Does not create a wallet (open question — see NOTES.md).
 */
export function spawnCash(player: Player, amount: number): void {
  const w = findWallet(player);
  if (w) {
    setWalletBalance(w.item, getWalletBalance(w.item) + amount);
    invOf(player)?.setItem(w.slot, w.item);
    return;
  }
  giveNotes(player, amount);
}

/** Pack all loose notes into the wallet. Returns amount packed. */
export function packLooseIntoWallet(player: Player): number {
  const w = findWallet(player);
  if (!w) return -1;
  const loose = takeLooseCash(player);
  if (loose <= 0) return 0;
  setWalletBalance(w.item, getWalletBalance(w.item) + loose);
  invOf(player)?.setItem(w.slot, w.item);
  return loose;
}

/** Unpack amount (or all) from wallet into loose notes. */
export function unpackFromWallet(player: Player, amount?: number): number {
  const w = findWallet(player);
  if (!w) return -1;
  const bal = getWalletBalance(w.item);
  if (bal <= 0) return 0;
  const take = amount === undefined ? bal : Math.min(bal, Math.max(0, Math.floor(amount)));
  if (take <= 0) return 0;
  setWalletBalance(w.item, bal - take);
  invOf(player)?.setItem(w.slot, w.item);
  giveNotes(player, take);
  return take;
}

/** Ensure player has a wallet item (dev/grant helper). */
export function ensureWallet(player: Player): void {
  if (findWallet(player)) return;
  const inv = invOf(player);
  if (!inv) return;
  const stack = new ItemStack(WALLET_ID, 1);
  setWalletBalance(stack, 0);
  const leftover = inv.addItem(stack);
  if (leftover) player.dimension.spawnItem(leftover, player.location);
}

export function countItem(player: Player, typeId: string): number {
  const inv = invOf(player);
  if (!inv) return 0;
  let n = 0;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item?.typeId === typeId) n += item.amount;
  }
  return n;
}

export function takeItems(player: Player, typeId: string, qty: number): number {
  const inv = invOf(player);
  if (!inv) return 0;
  let left = qty;
  for (let i = 0; i < inv.size && left > 0; i++) {
    const item = inv.getItem(i);
    if (!item || item.typeId !== typeId) continue;
    if (item.amount <= left) {
      left -= item.amount;
      inv.setItem(i, undefined);
    } else {
      item.amount -= left;
      inv.setItem(i, item);
      left = 0;
    }
  }
  return qty - left;
}

export function giveItem(player: Player, typeId: string, qty: number): void {
  const inv = invOf(player);
  if (!inv) throw new Error("no inventory");
  let left = qty;
  while (left > 0) {
    const n = Math.min(64, left);
    const stack = new ItemStack(typeId, n);
    const leftover = inv.addItem(stack);
    if (leftover) player.dimension.spawnItem(leftover, player.location);
    left -= n;
  }
}
