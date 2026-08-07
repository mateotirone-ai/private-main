/**
 * Loader for data/town-layouts.json — Phase 4 layout registry.
 */
import raw from "../../data/town-layouts.json";

export type LayoutDir = "north" | "east" | "south" | "west";

export type LayoutSlotRole =
  | "civic"
  | "storefront"
  | "station"
  | "work_site"
  | "work_zone"
  | "house"
  | "commons"
  | "parcel_empty"
  | "kiosk";

export interface LayoutPolyline {
  width: number;
  points: Array<{ x: number; z: number }>;
}

export interface LayoutPlaza {
  center: { x: number; z: number };
  radii: { x: number; z: number };
}

export interface LayoutSlot {
  role: LayoutSlotRole;
  hint?: string;
  pad?: { x1: number; z1: number; x2: number; z2: number };
  at?: { x: number; z: number };
  rot?: 0 | 90 | 180 | 270;
  fields?: {
    x1: number;
    z1: number;
    x2: number;
    z2: number;
    rowSpacing?: number;
  };
}

export interface LayoutGrowthPoint {
  at: { x: number; z: number };
  dir: LayoutDir;
  note?: string;
}

export interface TownLayout {
  id: string;
  name: string;
  biomes: string[];
  area: { x: number; z: number };
  slopeToleranceY: number;
  streets: {
    main: LayoutPolyline;
    lanes: LayoutPolyline[];
    plaza: LayoutPlaza;
    well: { x: number; z: number };
    bridge?: { x1: number; x2: number; z1: number; z2: number };
  };
  growthPoints: LayoutGrowthPoint[];
  slots: LayoutSlot[];
}

interface RawLayoutsFile {
  layouts?: unknown[];
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

function normalizeLayout(rawLayout: unknown): TownLayout | undefined {
  if (!rawLayout || typeof rawLayout !== "object") return undefined;
  const entry = rawLayout as Record<string, unknown>;
  if (typeof entry.id !== "string" || !entry.id.trim()) return undefined;
  const areaPair = asPair(entry.area);
  if (!areaPair) return undefined;
  const streetsRaw = entry.streets as Record<string, unknown> | undefined;
  if (!streetsRaw) return undefined;
  const main = asPolyline(streetsRaw.main);
  if (!main) return undefined;
  const lanes = Array.isArray(streetsRaw.lanes)
    ? streetsRaw.lanes
        .map((lane) => asPolyline(lane))
        .filter((lane): lane is LayoutPolyline => Boolean(lane))
    : [];
  const plazaRaw = streetsRaw.plaza as
    | { center?: unknown; radii?: unknown }
    | undefined;
  const plazaCenter = asPair(plazaRaw?.center);
  const plazaRadii = asPair(plazaRaw?.radii);
  if (!plazaCenter || !plazaRadii) return undefined;
  const well = asPair(streetsRaw.well);
  if (!well) return undefined;
  let bridge: TownLayout["streets"]["bridge"];
  const bridgeRaw = streetsRaw.bridge as
    | { x?: unknown; z?: unknown }
    | undefined;
  if (bridgeRaw && Array.isArray(bridgeRaw.x) && Array.isArray(bridgeRaw.z)) {
    const [x1, x2] = bridgeRaw.x as number[];
    const [z1, z2] = bridgeRaw.z as number[];
    if ([x1, x2, z1, z2].every((n) => typeof n === "number")) {
      bridge = {
        x1: Math.min(x1, x2),
        x2: Math.max(x1, x2),
        z1: Math.min(z1, z2),
        z2: Math.max(z1, z2),
      };
    }
  }
  const growthPoints: LayoutGrowthPoint[] = [];
  for (const point of (entry.growthPoints as unknown[]) ?? []) {
    if (!point || typeof point !== "object") continue;
    const gp = point as { at?: unknown; dir?: unknown; note?: unknown };
    const at = asPair(gp.at);
    if (
      !at ||
      (gp.dir !== "north" &&
        gp.dir !== "east" &&
        gp.dir !== "south" &&
        gp.dir !== "west")
    ) {
      continue;
    }
    growthPoints.push({
      at,
      dir: gp.dir,
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
    let fields: LayoutSlot["fields"];
    const fieldsRaw = slot.fields as
      | { x?: unknown; z?: unknown; rowSpacing?: unknown }
      | undefined;
    if (
      fieldsRaw &&
      Array.isArray(fieldsRaw.x) &&
      Array.isArray(fieldsRaw.z)
    ) {
      const [fx1, fx2] = fieldsRaw.x as number[];
      const [fz1, fz2] = fieldsRaw.z as number[];
      if ([fx1, fx2, fz1, fz2].every((n) => typeof n === "number")) {
        fields = {
          x1: Math.min(fx1, fx2),
          x2: Math.max(fx1, fx2),
          z1: Math.min(fz1, fz2),
          z2: Math.max(fz1, fz2),
          rowSpacing:
            typeof fieldsRaw.rowSpacing === "number"
              ? fieldsRaw.rowSpacing
              : undefined,
        };
      }
    }
    slots.push({
      role: slot.role as LayoutSlotRole,
      hint: typeof slot.hint === "string" ? slot.hint : undefined,
      pad,
      at,
      rot,
      fields,
    });
  }
  return {
    id: entry.id,
    name: typeof entry.name === "string" ? entry.name : entry.id,
    biomes: Array.isArray(entry.biomes)
      ? entry.biomes.filter((b): b is string => typeof b === "string")
      : [],
    area: areaPair,
    slopeToleranceY:
      typeof entry.slopeToleranceY === "number" ? entry.slopeToleranceY : 6,
    streets: {
      main,
      lanes,
      plaza: { center: plazaCenter, radii: plazaRadii },
      well,
      bridge,
    },
    growthPoints,
    slots,
  };
}

const LAYOUTS = ((raw as RawLayoutsFile).layouts ?? [])
  .map((entry) => normalizeLayout(entry))
  .filter((entry): entry is TownLayout => Boolean(entry));

export function allTownLayouts(): TownLayout[] {
  return LAYOUTS;
}

export function townLayoutById(id: string): TownLayout | undefined {
  return LAYOUTS.find((layout) => layout.id === id);
}

export function defaultTownLayoutId(): string {
  return LAYOUTS[0]?.id ?? "heartlands_crossroads";
}
