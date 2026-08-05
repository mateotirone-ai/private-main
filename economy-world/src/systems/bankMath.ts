/**
 * Pure bank fee + cash denomination math. No Minecraft imports.
 * Fee amount comes from data/matrix.json via the caller.
 */

export interface TransferPlan {
  /** merids the recipient receives */
  amount: number;
  /** flat fee sunk via Ledger.sink(..., "sink:fee") */
  fee: number;
  /** total debit from sender = amount + fee */
  totalDebit: number;
}

/** Build a transfer plan. Fee is a tiny flat fee (master doc); never invented here. */
export function planTransfer(amount: number, fee: number): TransferPlan {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`invalid transfer amount: ${amount}`);
  }
  if (!Number.isInteger(fee) || fee < 0) {
    throw new Error(`invalid transfer fee: ${fee}`);
  }
  return { amount, fee, totalDebit: amount + fee };
}

/** Can the sender cover amount + fee? */
export function canAffordTransfer(balance: number, amount: number, fee: number): boolean {
  return balance >= planTransfer(amount, fee).totalDebit;
}

/**
 * Greedy breakdown into cash denominations (largest first).
 * Denominations from data/matrix.json (layer1 §3: 1000/100/10/1).
 */
export function breakIntoCash(
  amount: number,
  denominations: number[]
): { denom: number; count: number }[] {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`invalid cash amount: ${amount}`);
  }
  let left = amount;
  const out: { denom: number; count: number }[] = [];
  const sorted = [...denominations].sort((a, b) => b - a);
  for (const d of sorted) {
    if (d <= 0 || !Number.isInteger(d)) throw new Error(`bad denomination: ${d}`);
    const count = Math.floor(left / d);
    if (count > 0) {
      out.push({ denom: d, count });
      left -= count * d;
    }
  }
  if (left !== 0) throw new Error(`cannot make exact change for ${amount} with ${denominations}`);
  return out;
}

/** Sum face value of a cash stack list. */
export function sumCash(stacks: { denom: number; count: number }[]): number {
  let n = 0;
  for (const s of stacks) n += s.denom * s.count;
  return n;
}

export function carriedCashTotal(
  looseNotes: number,
  walletBalance: number
): number {
  if (
    !Number.isInteger(looseNotes) ||
    looseNotes < 0 ||
    !Number.isInteger(walletBalance) ||
    walletBalance < 0
  ) {
    throw new Error("invalid carried cash");
  }
  return looseNotes + walletBalance;
}
