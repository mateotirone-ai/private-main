/**
 * Pricing engine v1 — pure math (layer1 §4.5).
 * current += current * driftRate * pressure
 * pressure = clamp((target − stock) / target, −1, 1)
 * then clamp current to [base * band[0], base * band[1]]
 */

export interface GoodConfig {
  base: number;
  band: [number, number];
  driftRate: number;
  target: number;
}

export interface GoodRuntime {
  current: number;
  stock: number;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function pressure(stock: number, target: number): number {
  if (!(target > 0)) return 0;
  return clamp((target - stock) / target, -1, 1);
}

/** One price tick for a non-mint good. Returns next current. */
export function tickPrice(cfg: GoodConfig, runtime: GoodRuntime): number {
  const p = pressure(runtime.stock, cfg.target);
  let next = runtime.current + runtime.current * cfg.driftRate * p;
  const lo = cfg.base * cfg.band[0];
  const hi = cfg.base * cfg.band[1];
  next = clamp(next, lo, hi);
  // keep money integer-friendly at the display edge; store as float, quote as floor
  return next;
}

/** Integer unit price charged/paid at storefronts. */
export function quoteUnit(current: number): number {
  return Math.max(1, Math.floor(current));
}

/** Freelancer / commons sell payout for qty at market current × rate. */
export function freelancePayout(current: number, qty: number, rate: number): number {
  if (!Number.isInteger(qty) || qty <= 0) throw new Error(`invalid qty: ${qty}`);
  if (!(rate > 0) || rate > 1) throw new Error(`invalid freelance rate: ${rate}`);
  const unit = Math.max(1, Math.floor(current * rate));
  return unit * qty;
}
