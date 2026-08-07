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
  tier: 1 | 2 | 3;
  owner: "cpu" | string;
  ownerName: string | null;
  storage: number;
  producedTotal: number;
  productionRemainder?: number;
  ownerAccount: string | null;
  priceOverridePct: number | null;
  revenueBalance: number;
  revenueHistory: Array<{ tick: number; amount: number }>;
  employeeSlots: string[];
  successorOf: string | null;
  site:
    | {
        dimensionId: string;
        anchor: { x: number; y: number; z: number };
        rotationSteps: 0 | 1 | 2 | 3;
        mirror: "none" | "x" | "z" | "xz";
      }
    | null;
  construction:
    | {
        targetTier: 1 | 2 | 3;
        startedTick: number;
        completeTick: number;
        cost: number;
        placedLayers: number;
        siteClosed: boolean;
        dressingPlaced: boolean;
      }
    | null;
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
  return byId;
}

export function businessDisplayName(
  business: Pick<BizSnap, "trade" | "owner" | "ownerName">
): string {
  const name = tradeDef(business.trade).name;
  return business.owner === "cpu"
    ? `${name} — owned by Meridian`
    : `${name} — owned by ${business.ownerName ?? "a player"}`;
}

export function businessIsOpen(
  business: Pick<BizSnap, "construction">
): boolean {
  return business.construction === null;
}

/** Pure CPU production step. Returns units added. */
export function produceOnce(
  biz: BizSnap,
  def: TradeDef = tradeDef(biz.trade),
  multiplier = 1,
  storageCap = def.storageCap
): number {
  const room = Math.max(0, storageCap - biz.storage);
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
  bizMultiplier: (biz: BizSnap) => number = () => 1,
  multipliers: PresenceMultipliers = {
    cpuMultiplier: 1,
    offlineOwnerMultiplier: 1,
    activeOwnerMultiplier: 1,
    offlineEmployeeStep: 0,
    offlineEmployeeCap: 1,
  },
  storageMultiplier: (biz: BizSnap) => number = () => 1
): ProductionResult[] {
  const out: ProductionResult[] = [];
  for (const biz of Object.values(byId)) {
    const def = tradeDef(biz.trade);
    const multiplier =
      ownerPresenceMultiplier(
        biz.owner,
        activeOwnerIds,
        multipliers,
        Math.max(0, biz.employeeSlots.length)
      ) * bizMultiplier(biz);
    const storageCap = Math.max(
      1,
      Math.floor(def.storageCap * storageMultiplier(biz))
    );
    const added = produceOnce(biz, def, multiplier, storageCap);
    if (added > 0) out.push({ trade: biz.trade, good: def.good, added });
  }
  return out;
}
