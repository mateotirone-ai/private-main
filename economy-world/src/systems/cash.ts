/**
 * Physical cash items — ew:cash_1/10/100/1000.
 * ONLY Bank.withdraw spawns these (layer1 §3). No crafting recipes.
 */
import type { Player } from "@minecraft/server";
import { ItemStack } from "@minecraft/server";
import { cashDenominations } from "../content/matrix";
import { breakIntoCash, sumCash } from "./bankMath";

export function cashItemId(denom: number): string {
  return `ew:cash_${denom}`;
}

export function parseCashDenom(typeId: string): number | undefined {
  const m = /^ew:cash_(\d+)$/.exec(typeId);
  if (!m) return undefined;
  return Number(m[1]);
}

/** Count face-value merids carried as cash items. */
export function countCashInInventory(player: Player): { total: number; stacks: { denom: number; count: number; slot: number }[] } {
  const inv = player.getComponent("inventory")?.container;
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

/** Remove all ew:cash_* from inventory. Returns face value removed. */
export function takeAllCash(player: Player): number {
  const { total, stacks } = countCashInInventory(player);
  const inv = player.getComponent("inventory")?.container;
  if (!inv) return 0;
  for (const s of stacks) {
    inv.setItem(s.slot, undefined);
  }
  return total;
}

/**
 * Spawn cash items for an amount. Only called from Bank.withdraw after Ledger.cashOut.
 */
export function spawnCash(player: Player, amount: number): void {
  const parts = breakIntoCash(amount, cashDenominations());
  const inv = player.getComponent("inventory")?.container;
  if (!inv) throw new Error("no inventory");
  for (const p of parts) {
    let left = p.count;
    while (left > 0) {
      const n = Math.min(64, left);
      const stack = new ItemStack(cashItemId(p.denom), n);
      const leftover = inv.addItem(stack);
      if (leftover) {
        // inventory full — drop at feet
        const dim = player.dimension;
        dim.spawnItem(leftover, player.location);
      }
      left -= n;
    }
  }
}

/** Count units of a vanilla item type in inventory. */
export function countItem(player: Player, typeId: string): number {
  const inv = player.getComponent("inventory")?.container;
  if (!inv) return 0;
  let n = 0;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item?.typeId === typeId) n += item.amount;
  }
  return n;
}

/** Remove up to `qty` of typeId from inventory. Returns actually removed. */
export function takeItems(player: Player, typeId: string, qty: number): number {
  const inv = player.getComponent("inventory")?.container;
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
