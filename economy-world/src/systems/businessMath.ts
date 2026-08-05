/**
 * Pure CPU production math — no Minecraft imports.
 */
import { tradeDef, allTradeIds, type TradeDef } from "../content/trades";

export interface BizSnap {
  id: string;
  trade: string;
  tier: 1;
  owner: "cpu" | string;
  storage: number;
  producedTotal: number;
}

export function seedCpuBusinesses(): Record<string, BizSnap> {
  const byId: Record<string, BizSnap> = {};
  for (const trade of allTradeIds()) {
    const id = `cpu_${trade}`;
    const def = tradeDef(trade);
    byId[id] = {
      id,
      trade,
      tier: 1,
      owner: "cpu",
      storage: Math.floor(def.storageCap / 2),
      producedTotal: 0,
    };
  }
  return byId;
}

/** Pure CPU production step. Returns units added. */
export function produceOnce(biz: BizSnap, def: TradeDef = tradeDef(biz.trade)): number {
  const room = Math.max(0, def.storageCap - biz.storage);
  const add = Math.min(def.producePerTick, room);
  biz.storage += add;
  biz.producedTotal += add;
  return add;
}

export interface ProductionResult {
  trade: string;
  good: string;
  added: number;
}

/** Advance all CPU-owned businesses; returns per-biz additions for stock updates. */
export function runCpuProduction(byId: Record<string, BizSnap>): ProductionResult[] {
  const out: ProductionResult[] = [];
  for (const biz of Object.values(byId)) {
    if (biz.owner !== "cpu") continue;
    const def = tradeDef(biz.trade);
    const added = produceOnce(biz, def);
    if (added > 0) out.push({ trade: biz.trade, good: def.good, added });
  }
  return out;
}
