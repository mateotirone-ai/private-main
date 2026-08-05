/**
 * Typed accessors for data/matrix.json. Numbers live in data/, never in call sites.
 */
import raw from "../../data/matrix.json";

export type PreciousGood = "gold" | "diamond";

export interface Matrix {
  stipend: number;
  medical: { flat: number; pctOfWealth: number };
  freelanceRate: number;
  wagePerHourByTier: Record<string, number>;
  bank: { transferFee: number };
  cash: { denominations: number[] };
  dealer: {
    dailyCapacity: Record<PreciousGood, number>;
    softFloor: number;
  };
}

export const matrix = raw as unknown as Matrix;

export function transferFee(): number {
  return matrix.bank.transferFee;
}

export function cashDenominations(): number[] {
  return matrix.cash.denominations;
}

export function dealerCapacity(good: PreciousGood): number {
  return matrix.dealer.dailyCapacity[good];
}

export function dealerSoftFloor(): number {
  return matrix.dealer.softFloor;
}

export function stipendAmount(): number {
  return matrix.stipend;
}
