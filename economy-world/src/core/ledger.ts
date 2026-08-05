/**
 * THE LEDGER — the only code in the entire game allowed to touch money.
 *
 * Spec §4.1 / Master Doc: one mint, one code path. Every balance mutation
 * goes through transfer(), mint(), or sink(). The audit identity —
 *   totalMinted − totalSunk ≡ Σ balances + cashOutstanding
 * — must hold after every operation, forever. If it ever doesn't, we have
 * a dupe or a bug, and the journal tells us exactly which transaction.
 *
 * Pure module: no Minecraft imports. The world adapter (core/state.ts)
 * persists LedgerState to dynamic properties; tests run it in Node.
 */

export type AccountId = string; // "p:<playerId>" | "b:<businessId>" | "sys:<name>"

export type FaucetTag = "mint:dealer" | "mint:stipend" | "mint:system" | "mint:immigration";
export type SinkTag =
  | "sink:fee"
  | "sink:medical"
  | "sink:buyout"      // purchases from the system (charters, upgrades, plots from Meridian)
  | "sink:construction"
  | "sink:import"      // the inflation valve
  | "sink:tribute"
  | "sink:system";

export interface JournalEntry {
  seq: number;
  tick: number;
  kind: "transfer" | "mint" | "sink" | "cashOut" | "cashIn";
  from?: AccountId;
  to?: AccountId;
  amount: number;
  tag?: FaucetTag | SinkTag | string;
}

export interface LedgerState {
  schema: 1;
  seq: number;
  balances: Record<AccountId, number>;
  totalMinted: number;
  totalSunk: number;
  /** merids currently existing as physical cash items in the world */
  cashOutstanding: number;
  /** ring buffer of recent entries (full history is server logs) */
  journal: JournalEntry[];
}

export const JOURNAL_CAP = 512;

export class LedgerError extends Error {}

export function emptyLedger(): LedgerState {
  return {
    schema: 1,
    seq: 0,
    balances: {},
    totalMinted: 0,
    totalSunk: 0,
    cashOutstanding: 0,
    journal: [],
  };
}

function assertAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new LedgerError(`invalid amount: ${amount} (merids are positive integers)`);
  }
}

function credit(s: LedgerState, acct: AccountId, amount: number): void {
  s.balances[acct] = (s.balances[acct] ?? 0) + amount;
}

function debit(s: LedgerState, acct: AccountId, amount: number): void {
  const bal = s.balances[acct] ?? 0;
  if (bal < amount) throw new LedgerError(`insufficient funds: ${acct} has ${bal}, needs ${amount}`);
  s.balances[acct] = bal - amount;
}

function journal(s: LedgerState, e: Omit<JournalEntry, "seq">): void {
  s.seq += 1;
  s.journal.push({ seq: s.seq, ...e });
  if (s.journal.length > JOURNAL_CAP) s.journal.shift();
}

/** Move existing money between accounts. Zero-sum, always. */
export function transfer(
  s: LedgerState,
  from: AccountId,
  to: AccountId,
  amount: number,
  tick: number,
  tag?: string
): void {
  assertAmount(amount);
  if (from === to) throw new LedgerError("transfer to self");
  debit(s, from, amount);
  credit(s, to, amount);
  journal(s, { tick, kind: "transfer", from, to, amount, tag });
}

/** Create money. THE only door. Every call site carries a FaucetTag. */
export function mint(s: LedgerState, to: AccountId, amount: number, tick: number, tag: FaucetTag): void {
  assertAmount(amount);
  credit(s, to, amount);
  s.totalMinted += amount;
  journal(s, { tick, kind: "mint", to, amount, tag });
}

/** Destroy money. Fees, bills, purchases-from-the-system, the import valve. */
export function sink(s: LedgerState, from: AccountId, amount: number, tick: number, tag: SinkTag): void {
  assertAmount(amount);
  debit(s, from, amount);
  s.totalSunk += amount;
  journal(s, { tick, kind: "sink", from, amount, tag });
}

/** Bank teller: balance -> physical cash items. Conservation moves to cashOutstanding. */
export function cashOut(s: LedgerState, acct: AccountId, amount: number, tick: number): void {
  assertAmount(amount);
  debit(s, acct, amount);
  s.cashOutstanding += amount;
  journal(s, { tick, kind: "cashOut", from: acct, amount });
}

/** Bank teller: physical cash items -> balance. */
export function cashIn(s: LedgerState, acct: AccountId, amount: number, tick: number): void {
  assertAmount(amount);
  if (s.cashOutstanding < amount) {
    throw new LedgerError(`cashIn exceeds cashOutstanding (${amount} > ${s.cashOutstanding}) — counterfeit?`);
  }
  s.cashOutstanding -= amount;
  credit(s, acct, amount);
  journal(s, { tick, kind: "cashIn", to: acct, amount });
}

/** Cash died with its carrier or otherwise left the world: it is sunk. */
export function cashDestroyed(s: LedgerState, amount: number, tick: number, tag: SinkTag = "sink:system"): void {
  assertAmount(amount);
  if (s.cashOutstanding < amount) throw new LedgerError("destroying more cash than exists");
  s.cashOutstanding -= amount;
  s.totalSunk += amount;
  journal(s, { tick, kind: "sink", amount, tag });
}

export interface AuditReport {
  ok: boolean;
  expected: number; // totalMinted - totalSunk
  actual: number; // sum(balances) + cashOutstanding
  drift: number;
}

/** The nightly identity check. drift !== 0 means a bug or a dupe — alarm. */
export function audit(s: LedgerState): AuditReport {
  let sum = 0;
  for (const k in s.balances) sum += s.balances[k] ?? 0;
  const actual = sum + s.cashOutstanding;
  const expected = s.totalMinted - s.totalSunk;
  return { ok: actual === expected, expected, actual, drift: actual - expected };
}

export function balance(s: LedgerState, acct: AccountId): number {
  return s.balances[acct] ?? 0;
}
