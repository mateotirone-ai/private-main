/**
 * Pure dealer daily-capacity price softening.
 * Master doc: "mint buy price softens with volume — hoard-dumping self-limits."
 * Formula (Phase B, params from data/matrix.json):
 *   mult(soldToday) = 1 - min(1, soldToday / capacity) * (1 - softFloor)
 * Each unit in a sale is priced with the multiplier at its position in today's volume.
 * Binding rounding rule: sum the exact total, then round once at the end.
 */

export function unitMultiplier(soldBefore: number, capacity: number, softFloor: number): number {
  if (!(capacity > 0)) return softFloor;
  if (softFloor < 0 || softFloor > 1) throw new Error(`softFloor out of range: ${softFloor}`);
  const t = Math.min(1, Math.max(0, soldBefore) / capacity);
  return 1 - t * (1 - softFloor);
}

export interface SaleQuote {
  qty: number;
  base: number;
  /** integer merids minted for this sale */
  payout: number;
  /** average integer price per unit for display */
  avgUnitPrice: number;
  /** multiplier applied to the first unit */
  firstMult: number;
  /** multiplier applied to the last unit */
  lastMult: number;
  softened: boolean;
}

/** Quote a sale of `qty` units given how many already sold today. */
export function quoteSale(
  qty: number,
  base: number,
  soldToday: number,
  capacity: number,
  softFloor: number
): SaleQuote {
  if (!Number.isInteger(qty) || qty <= 0) throw new Error(`invalid qty: ${qty}`);
  if (!Number.isInteger(base) || base <= 0) throw new Error(`invalid base: ${base}`);
  if (!Number.isInteger(soldToday) || soldToday < 0) throw new Error(`invalid soldToday: ${soldToday}`);

  let exactTotal = 0;
  let firstMult = 0;
  let lastMult = 0;
  for (let i = 0; i < qty; i++) {
    const m = unitMultiplier(soldToday + i, capacity, softFloor);
    if (i === 0) firstMult = m;
    lastMult = m;
    exactTotal += base * m;
  }
  const payout = Math.round(exactTotal);
  if (payout <= 0) throw new Error("sale payout collapsed to zero — capacity/softFloor misconfigured");

  return {
    qty,
    base,
    payout,
    avgUnitPrice: Math.round(exactTotal / qty),
    firstMult,
    lastMult,
    softened: firstMult < 1 - 1e-9 || lastMult < 1 - 1e-9,
  };
}
