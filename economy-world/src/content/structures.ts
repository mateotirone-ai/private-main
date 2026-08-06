import raw from "../../data/structures.json";
import { allTradeIds } from "./trades";

export type Cardinal = "north" | "east" | "south" | "west";
export type StructureMirror = "none" | "x" | "z" | "xz";

export interface StructureOffset {
  x: number;
  y: number;
  z: number;
}

export interface StructureTierDef {
  id: string;
  anchorOffset: StructureOffset;
  gateOffset: StructureOffset;
  npcOffsets: {
    storefront: StructureOffset;
    office: StructureOffset;
  };
  workZoneOffset: StructureOffset;
}

export interface TradeStructureDef {
  frontFace: Cardinal;
  pad: { x: number; z: number };
  successorOffset: StructureOffset;
  tiers: Partial<Record<"1" | "2" | "3", StructureTierDef>>;
}

export interface StructuresFile {
  trades: Record<string, TradeStructureDef>;
}

const VALID_TRADE_IDS = new Set(allTradeIds());
const file = raw as unknown as StructuresFile;

function isCardinal(value: string): value is Cardinal {
  return (
    value === "north" || value === "east" || value === "south" || value === "west"
  );
}

function assertOffset(offset: StructureOffset, label: string): void {
  if (![offset.x, offset.y, offset.z].every(Number.isFinite)) {
    throw new Error(`${label} offset must be finite`);
  }
}

function validateTradeDef(trade: string, def: TradeStructureDef): void {
  if (!VALID_TRADE_IDS.has(trade)) {
    throw new Error(`unknown structure trade: ${trade}`);
  }
  if (!isCardinal(def.frontFace)) {
    throw new Error(`invalid frontFace for ${trade}`);
  }
  if (!Number.isFinite(def.pad.x) || !Number.isFinite(def.pad.z)) {
    throw new Error(`invalid pad for ${trade}`);
  }
  assertOffset(def.successorOffset, `${trade} successor`);
  for (const tierKey of ["1", "2", "3"] as const) {
    const tier = def.tiers[tierKey];
    if (!tier) continue;
    if (!tier.id.trim()) throw new Error(`${trade} tier ${tierKey} missing id`);
    assertOffset(tier.anchorOffset, `${trade} tier ${tierKey} anchor`);
    assertOffset(tier.gateOffset, `${trade} tier ${tierKey} gate`);
    assertOffset(tier.npcOffsets.storefront, `${trade} tier ${tierKey} storefront`);
    assertOffset(tier.npcOffsets.office, `${trade} tier ${tierKey} office`);
    assertOffset(tier.workZoneOffset, `${trade} tier ${tierKey} work-zone`);
  }
}

for (const [trade, def] of Object.entries(file.trades)) {
  validateTradeDef(trade, def);
}

export function structureTradeDef(trade: string): TradeStructureDef | undefined {
  return file.trades[trade];
}

export function structureTierDef(
  trade: string,
  tier: 1 | 2 | 3
): StructureTierDef | undefined {
  const byTrade = structureTradeDef(trade);
  if (!byTrade) return undefined;
  return byTrade.tiers[String(tier) as "1" | "2" | "3"];
}
