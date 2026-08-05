/**
 * Typed accessors for data/prices.json.
 */
import raw from "../../data/prices.json";
import type { PreciousGood } from "./matrix";
import type { GoodConfig } from "../systems/pricingMath";

export interface PricesConfig {
  tickMinutes: number;
  mintTier: string[];
  goods: Record<string, GoodConfig>;
}

export const prices = raw as unknown as PricesConfig;

export function basePrice(good: PreciousGood | string): number {
  const g = prices.goods[good];
  if (!g) throw new Error(`missing price for ${good} in data/prices.json`);
  return g.base;
}

export function goodConfig(good: string): GoodConfig {
  const g = prices.goods[good];
  if (!g) throw new Error(`missing price for ${good} in data/prices.json`);
  return g;
}

export function isMintTier(good: string): boolean {
  return prices.mintTier.includes(good);
}

export function priceTickMinutes(): number {
  return prices.tickMinutes;
}

/** Vanilla item ids the dealer accepts for each precious good. */
export const PRECIOUS_ITEMS: Record<PreciousGood, string> = {
  gold: "minecraft:gold_ingot",
  diamond: "minecraft:diamond",
};
