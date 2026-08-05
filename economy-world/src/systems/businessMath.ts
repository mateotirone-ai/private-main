/**
 * Pure CPU production math — no Minecraft imports.
 */
import { tradeDef, allTradeIds, type TradeDef } from "../content/trades";
import {
  ownerPresenceMultiplier,
  type PresenceMultipliers,
} from "./employmentMath";

export interface BizSnap {
  id: string;
  trade: string;
  tier: 1;
  owner: "cpu" | string;
  storage: number;
  producedTotal: number;
  productionRemainder?: number;
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
      productionRemainder: 0,
    };
  }
  return byId;
}

/** Pure CPU production step. Returns units added. */
export function produceOnce(
  biz: BizSnap,
  def: TradeDef = tradeDef(biz.trade),
  multiplier = 1
): number {
  const room = Math.max(0, def.storageCap - biz.storage);
  const exact = def.producePerTick * multiplier + (biz.productionRemainder ?? 0);
  const whole = Math.floor(exact);
  const add = Math.min(whole, room);
  biz.productionRemainder = room > add ? exact - whole : 0;
  biz.storage += add;
  biz.producedTotal += add;
  return add;
}

export interface ProductionResult {
  trade: string;
  good: string;
  added: number;
}

/** Advance businesses under the master-design owner-presence rules. */
export function runCpuProduction(
  byId: Record<string, BizSnap>,
  activeOwnerIds: ReadonlySet<string> = new Set(),
  multipliers: PresenceMultipliers = {
    cpuMultiplier: 1,
    offlineOwnerMultiplier: 1,
    activeOwnerMultiplier: 1,
  }
): ProductionResult[] {
  const out: ProductionResult[] = [];
  for (const biz of Object.values(byId)) {
    const def = tradeDef(biz.trade);
    const multiplier = ownerPresenceMultiplier(biz.owner, activeOwnerIds, multipliers);
    const added = produceOnce(biz, def, multiplier);
    if (added > 0) out.push({ trade: biz.trade, good: def.good, added });
  }
  return out;
}
