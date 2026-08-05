/**
 * Typed accessors for data/prices.json. Dealer mint prices read base here.
 */
import raw from "../../data/prices.json";
import type { PreciousGood } from "./matrix";

export interface GoodPrice {
  base: number;
  band: [number, number];
  driftRate: number;
  target: number;
}

export interface PricesConfig {
  tickMinutes: number;
  goods: Record<string, GoodPrice>;
}

export const prices = raw as unknown as PricesConfig;

export function basePrice(good: PreciousGood): number {
  const g = prices.goods[good];
  if (!g) throw new Error(`missing price for ${good} in data/prices.json`);
  return g.base;
}

/** Vanilla item ids the dealer accepts for each precious good. */
export const PRECIOUS_ITEMS: Record<PreciousGood, string> = {
  gold: "minecraft:gold_ingot",
  diamond: "minecraft:diamond",
};
