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
  schema: 3;
  byId: Record<string, Business>;
}

const KEY = "ew:businesses";

export function bizAccount(bizId: string): AccountId {
  return `b:${bizId}`;
}

export function emptyBusinesses(): BusinessesState {
  return { schema: 3, byId: seedCpuBusinesses() };
}

function ensureBusinessDefaults(business: Business): void {
  business.tier = business.tier ?? 1;
  business.owner = business.owner ?? "cpu";
  business.ownerName ??= null;
  business.productionRemainder ??= 0;
  business.ownerAccount ??= null;
  business.priceOverridePct ??= null;
  business.revenueBalance ??= 0;
  business.revenueHistory ??= [];
  business.employeeSlots ??= [];
  business.successorOf ??= null;
  business.site ??= null;
  business.construction ??= null;
}

export function loadBusinesses(): BusinessesState {
  const s = loadBlob<BusinessesState>(KEY);
  if (!s) return emptyBusinesses();
  s.schema = 3;
  for (const business of Object.values(s.byId)) ensureBusinessDefaults(business);
  for (const trade of allTradeIds()) {
    const id = `cpu_${trade}`;
    if (!s.byId[id]) {
      const def = tradeDef(trade);
      s.byId[id] = {
        id,
        trade,
        tier: 1,
        owner: "cpu",
        ownerName: null,
        storage: Math.floor(def.storageCap / 2),
        producedTotal: 0,
        productionRemainder: 0,
        ownerAccount: null,
        priceOverridePct: null,
        revenueBalance: 0,
        revenueHistory: [],
        employeeSlots: [],
        successorOf: null,
        site: null,
        construction: null,
      };
    }
    ensureBusinessDefaults(s.byId[id]!);
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
  const tierMultiplier = (biz: Business): number => {
    const cfg = matrix.ownership?.tierOutputMultiplierByTier?.[String(biz.tier)];
    return cfg ?? 1;
  };
  const results = runCpuProductionPure(
    s.byId,
    activeOwnerIds,
    tierMultiplier,
    matrix.work.employment
  );
  for (const r of results) adjustStock(prices, r.good, r.added);
}

/** Ensure a CPU business can pay `amount` — mint:system float if needed. */
export function ensureBizFloat(ledger: LedgerState, bizId: string, amount: number): void {
  if (!bizId.startsWith("cpu_")) return;
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

export function listBusinessesForTrade(
  s: BusinessesState,
  trade: string
): Business[] {
  return Object.values(s.byId).filter((b) => b.trade === trade);
}

export function storefrontBusinessForTrade(
  s: BusinessesState,
  trade: string
): Business | undefined {
  const candidates = listBusinessesForTrade(s, trade);
  return (
    candidates.find((biz) => biz.owner !== "cpu") ??
    candidates.find((biz) => biz.id === `cpu_${trade}`) ??
    candidates[0]
  );
}

export function recordBusinessRevenue(
  s: BusinessesState,
  businessId: string,
  amount: number,
  tick: number
): void {
  if (amount <= 0) return;
  const business = s.byId[businessId];
  if (!business) return;
  ensureBusinessDefaults(business);
  business.revenueBalance += amount;
  business.revenueHistory.push({ tick, amount });
  const keep = matrix.ownership.revenueHistoryCap;
  if (business.revenueHistory.length > keep) {
    business.revenueHistory.splice(0, business.revenueHistory.length - keep);
  }
}

export function recentRevenueTotal(
  s: BusinessesState,
  businessId: string,
  nowTick: number
): number {
  const business = s.byId[businessId];
  if (!business) return 0;
  const window = matrix.ownership.revenueWindowTicks;
  const floorTick = nowTick - window;
  return business.revenueHistory
    .filter((entry) => entry.tick >= floorTick)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function effectiveBusinessUnitPrice(
  business: Business,
  marketUnitPrice: number
): number {
  const pct = business.priceOverridePct ?? 1;
  return Math.max(1, Math.round(marketUnitPrice * pct));
}
