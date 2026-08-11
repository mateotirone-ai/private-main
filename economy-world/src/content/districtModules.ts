/**
 * Loader for data/district-modules.json — Phase 5 expansion fragments.
 */
import raw from "../../data/district-modules.json";
import type {
  LayoutDir,
  LayoutGrowthPoint,
  LayoutPolyline,
  LayoutSlot,
  LayoutSlotRole,
} from "./townLayouts";

export type DistrictKind = "residential" | "industrial" | "market" | "commons";

export interface DistrictConnection {
  at: { x: number; z: number };
  dir: LayoutDir;
}

export interface DistrictModule {
  id: string;
  name: string;
  kind: DistrictKind;
  area: { x: number; z: number };
  slopeToleranceY: number;
  connection: DistrictConnection;
  streets: { lanes: LayoutPolyline[] };
  growthPoints: LayoutGrowthPoint[];
  slots: LayoutSlot[];
}

interface RawFile {
  modules?: unknown[];
}

function asPair(value: unknown): { x: number; z: number } | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const [x, z] = value;
  if (typeof x !== "number" || typeof z !== "number") return undefined;
  return { x, z };
}

function asRect(value: unknown):
  | { x1: number; z1: number; x2: number; z2: number }
  | undefined {
  if (!Array.isArray(value) || value.length !== 4) return undefined;
  if (!value.every((n) => typeof n === "number")) return undefined;
  const [a, b, c, d] = value as number[];
  return {
    x1: Math.min(a, c),
    z1: Math.min(b, d),
    x2: Math.max(a, c),
    z2: Math.max(b, d),
  };
}

function asDir(value: unknown): LayoutDir | undefined {
  if (
    value === "north" ||
    value === "east" ||
    value === "south" ||
    value === "west"
  ) {
    return value;
  }
  return undefined;
}

function asPolyline(value: unknown): LayoutPolyline | undefined {
  if (!value || typeof value !== "object") return undefined;
  const rawLine = value as { width?: unknown; points?: unknown };
  if (typeof rawLine.width !== "number" || !Array.isArray(rawLine.points)) {
    return undefined;
  }
  const points: Array<{ x: number; z: number }> = [];
  for (const point of rawLine.points) {
    const parsed = asPair(point);
    if (parsed) points.push(parsed);
  }
  if (points.length < 2) return undefined;
  return { width: rawLine.width, points };
}

function normalizeModule(rawModule: unknown): DistrictModule | undefined {
  if (!rawModule || typeof rawModule !== "object") return undefined;
  const entry = rawModule as Record<string, unknown>;
  if (typeof entry.id !== "string" || !entry.id.trim()) return undefined;
  const area = asPair(entry.area);
  if (!area) return undefined;
  const connectionRaw = entry.connection as
    | { at?: unknown; dir?: unknown }
    | undefined;
  const connectionAt = asPair(connectionRaw?.at);
  const connectionDir = asDir(connectionRaw?.dir);
  if (!connectionAt || !connectionDir) return undefined;
  const streetsRaw = entry.streets as { lanes?: unknown } | undefined;
  const lanes = Array.isArray(streetsRaw?.lanes)
    ? streetsRaw!.lanes
        .map((lane) => asPolyline(lane))
        .filter((lane): lane is LayoutPolyline => Boolean(lane))
    : [];
  const growthPoints: LayoutGrowthPoint[] = [];
  for (const point of (entry.growthPoints as unknown[]) ?? []) {
    if (!point || typeof point !== "object") continue;
    const gp = point as { at?: unknown; dir?: unknown; note?: unknown };
    const at = asPair(gp.at);
    const dir = asDir(gp.dir);
    if (!at || !dir) continue;
    growthPoints.push({
      at,
      dir,
      note: typeof gp.note === "string" ? gp.note : undefined,
    });
  }
  const slots: LayoutSlot[] = [];
  for (const rawSlot of (entry.slots as unknown[]) ?? []) {
    if (!rawSlot || typeof rawSlot !== "object") continue;
    const slot = rawSlot as Record<string, unknown>;
    if (typeof slot.role !== "string") continue;
    const pad = asRect(slot.pad);
    const at = asPair(slot.at);
    let rot: LayoutSlot["rot"];
    if (
      slot.rot === 0 ||
      slot.rot === 90 ||
      slot.rot === 180 ||
      slot.rot === 270
    ) {
      rot = slot.rot;
    }
    slots.push({
      role: slot.role as LayoutSlotRole,
      hint: typeof slot.hint === "string" ? slot.hint : undefined,
      pad,
      at,
      rot,
    });
  }
  const kind =
    entry.kind === "residential" ||
    entry.kind === "industrial" ||
    entry.kind === "market" ||
    entry.kind === "commons"
      ? entry.kind
      : "residential";
  return {
    id: entry.id,
    name: typeof entry.name === "string" ? entry.name : entry.id,
    kind,
    area,
    slopeToleranceY:
      typeof entry.slopeToleranceY === "number" ? entry.slopeToleranceY : 5,
    connection: { at: connectionAt, dir: connectionDir },
    streets: { lanes },
    growthPoints,
    slots,
  };
}

const MODULES = ((raw as RawFile).modules ?? [])
  .map((entry) => normalizeModule(entry))
  .filter((entry): entry is DistrictModule => Boolean(entry));

export function allDistrictModules(): DistrictModule[] {
  return MODULES;
}

export function districtModuleById(id: string): DistrictModule | undefined {
  return MODULES.find((module) => module.id === id);
}
