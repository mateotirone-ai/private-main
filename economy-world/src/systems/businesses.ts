/**
 * CPU businesses — layer1 §4.6 world adapter.
 */
import { saveBlob, loadBlob } from "../core/state";
import { allTradeIds, tradeDef, cpuProduceEveryMinutes } from "../content/trades";
import { mint, balance, type LedgerState, type AccountId } from "../core/ledger";
import { every, currentTick } from "../core/scheduler";
import { adjustStock, type PricesState } from "./pricing";
import { matrix } from "../content/matrix";
import {
  seedCpuBusinesses,
  produceOnce,
  runCpuProduction as runCpuProductionPure,
  type BizSnap,
} from "./businessMath";

export type Business = BizSnap;
export { produceOnce };

export interface BusinessesState {
  schema: 1;
  byId: Record<string, Business>;
}

const KEY = "ew:businesses";

export function bizAccount(bizId: string): AccountId {
  return `b:${bizId}`;
}

export function emptyBusinesses(): BusinessesState {
  return { schema: 1, byId: seedCpuBusinesses() };
}

export function loadBusinesses(): BusinessesState {
  const s = loadBlob<BusinessesState>(KEY);
  if (!s) return emptyBusinesses();
  for (const trade of allTradeIds()) {
    const id = `cpu_${trade}`;
    if (!s.byId[id]) {
      const def = tradeDef(trade);
      s.byId[id] = {
        id,
        trade,
        tier: 1,
        owner: "cpu",
        storage: Math.floor(def.storageCap / 2),
        producedTotal: 0,
        productionRemainder: 0,
      };
    }
  }
  return s;
}

export function saveBusinesses(s: BusinessesState): void {
  saveBlob(KEY, s);
}

export function runCpuProduction(
  s: BusinessesState,
  prices: PricesState,
  activeOwnerIds: ReadonlySet<string> = new Set()
): void {
  const results = runCpuProductionPure(
    s.byId,
    activeOwnerIds,
    matrix.work.employment
  );
  for (const r of results) adjustStock(prices, r.good, r.added);
}

/** Ensure a CPU business can pay `amount` — mint:system float if needed. */
export function ensureBizFloat(ledger: LedgerState, bizId: string, amount: number): void {
  const acct = bizAccount(bizId);
  const bal = balance(ledger, acct);
  if (bal >= amount) return;
  mint(ledger, acct, amount - bal, currentTick(), "mint:system");
}

export function startBusinessJobs(
  getBiz: () => BusinessesState,
  setBiz: (s: BusinessesState) => void,
  getPrices: () => PricesState,
  setPrices: (s: PricesState) => void,
  getActiveOwnerIds: () => ReadonlySet<string>
): void {
  const everyTicks = Math.max(1, Math.floor(cpuProduceEveryMinutes() * 60 * 20));
  every("biz:cpu_produce", everyTicks, () => {
    const biz = getBiz();
    const prices = getPrices();
    runCpuProduction(biz, prices, getActiveOwnerIds());
    setBiz(biz);
    setPrices(prices);
    saveBusinesses(biz);
  });
}

export function listCpuBusinesses(s: BusinessesState): Business[] {
  return Object.values(s.byId).filter((b) => b.owner === "cpu");
}
