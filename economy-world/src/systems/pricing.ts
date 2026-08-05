/**
 * Pricing engine world adapter — layer1 §4.5 / ew:prices.
 * Mint-tier goods stay at base (L1 constant policy hook).
 */
import { saveBlob, loadBlob } from "../core/state";
import { prices, goodConfig, isMintTier, priceTickMinutes } from "../content/prices";
import { tickPrice, quoteUnit, type GoodRuntime } from "./pricingMath";
import { every } from "../core/scheduler";

export interface PricesState {
  schema: 1;
  goods: Record<string, GoodRuntime>;
}

const KEY = "ew:prices";

export function emptyPrices(): PricesState {
  const goods: Record<string, GoodRuntime> = {};
  for (const [id, cfg] of Object.entries(prices.goods)) {
    goods[id] = { current: cfg.base, stock: cfg.target };
  }
  return { schema: 1, goods };
}

export function loadPrices(): PricesState {
  const s = loadBlob<PricesState>(KEY);
  if (!s) return emptyPrices();
  // ensure new goods appear after data updates
  for (const [id, cfg] of Object.entries(prices.goods)) {
    if (!s.goods[id]) s.goods[id] = { current: cfg.base, stock: cfg.target };
  }
  return s;
}

export function savePrices(s: PricesState): void {
  saveBlob(KEY, s);
}

export function currentUnitPrice(s: PricesState, good: string): number {
  if (isMintTier(good)) return quoteUnit(goodConfig(good).base);
  const rt = s.goods[good];
  if (!rt) return quoteUnit(goodConfig(good).base);
  return quoteUnit(rt.current);
}

export function adjustStock(s: PricesState, good: string, delta: number): void {
  const rt = s.goods[good] ?? { current: goodConfig(good).base, stock: goodConfig(good).target };
  rt.stock = Math.max(0, rt.stock + delta);
  s.goods[good] = rt;
}

/** Run one pricing tick across all non-mint goods. */
export function runPriceTick(s: PricesState): void {
  for (const [id, cfg] of Object.entries(prices.goods)) {
    if (isMintTier(id)) {
      // L1: mint policy constant — keep current pinned to base
      const rt = s.goods[id] ?? { current: cfg.base, stock: cfg.target };
      rt.current = cfg.base;
      s.goods[id] = rt;
      continue;
    }
    const rt = s.goods[id] ?? { current: cfg.base, stock: cfg.target };
    rt.current = tickPrice(cfg, rt);
    s.goods[id] = rt;
  }
}

export function startPricingJob(get: () => PricesState, set: (s: PricesState) => void): void {
  const everyTicks = Math.max(1, Math.floor(priceTickMinutes() * 60 * 20));
  every("prices:tick", everyTicks, () => {
    const s = get();
    runPriceTick(s);
    set(s);
    savePrices(s);
  });
}
