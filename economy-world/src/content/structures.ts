import raw from "../../data/structures.json";

export type Cardinal = "north" | "east" | "south" | "west";
export type StructureMirror = "none" | "x" | "z" | "xz";

export interface StructureOffset {
  x: number;
  y: number;
  z: number;
}

export interface StructureNpcAnchor {
  offset: StructureOffset;
  role: string;
  tags: string[];
}

export interface ZoneBox {
  min: StructureOffset;
  max: StructureOffset;
}

export interface StructureZoneVolume {
  boxes: ZoneBox[];
}

interface RawStructureEntry {
  id: string;
  trade?: string;
  level?: number;
  padSize?: unknown;
  anchor?: string;
  anchorOffset?: unknown;
  front?: string;
  gateOffset?: unknown;
  npcAnchors?: Record<string, unknown>;
  zones?: Record<string, unknown>;
}

interface RawStructuresFile {
  structures?: RawStructureEntry[];
  successorOffsetByTrade?: Record<string, unknown>;
}

export interface StructureEntry {
  id: string;
  trade?: string;
  level?: number;
  padSize?: { x: number; z: number };
  anchor: string;
  anchorOffset?: StructureOffset;
  front?: Cardinal;
  gateOffset?: StructureOffset;
  npcAnchors: Record<string, StructureNpcAnchor | undefined>;
  zones: Record<string, StructureZoneVolume | undefined>;
}

const file = raw as unknown as RawStructuresFile;
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[ew] ${message}`);
}

function toOffset(value: unknown): StructureOffset | undefined {
  if (!Array.isArray(value) || value.length !== 3) return undefined;
  const [x, y, z] = value;
  if (![x, y, z].every((n) => typeof n === "number" && Number.isFinite(n))) return undefined;
  return { x, y, z };
}

function toCardinal(value: unknown): Cardinal | undefined {
  if (value === "north" || value === "east" || value === "south" || value === "west") {
    return value;
  }
  return undefined;
}

function normalizeZoneBox(raw: unknown): ZoneBox | undefined {
  if (!Array.isArray(raw) || raw.length !== 6) return undefined;
  if (!raw.every((n) => typeof n === "number" && Number.isFinite(n))) {
    return undefined;
  }
  const [x1, y1, z1, x2, y2, z2] = raw as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return {
    min: {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      z: Math.min(z1, z2),
    },
    max: {
      x: Math.max(x1, x2),
      y: Math.max(y1, y2),
      z: Math.max(z1, z2),
    },
  };
}

export function parseZoneVolume(raw: unknown): StructureZoneVolume | undefined {
  if (raw === "TODO" || raw == null) return undefined;
  if (Array.isArray(raw) && raw.length === 6) {
    const box = normalizeZoneBox(raw);
    return box ? { boxes: [box] } : undefined;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const boxesRaw = (raw as { boxes?: unknown }).boxes;
  if (!Array.isArray(boxesRaw)) return undefined;
  const boxes: ZoneBox[] = [];
  for (const entry of boxesRaw) {
    const box = normalizeZoneBox(entry);
    if (box) boxes.push(box);
  }
  return boxes.length ? { boxes } : undefined;
}

function toNpcAnchor(
  name: string,
  value: unknown
): StructureNpcAnchor | undefined {
  const direct = toOffset(value);
  if (direct) return { offset: direct, role: name, tags: [] };
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const rawAnchor = value as {
    offset?: unknown;
    role?: unknown;
    tags?: unknown;
  };
  const offset = toOffset(rawAnchor.offset);
  if (!offset) return undefined;
  return {
    offset,
    role:
      typeof rawAnchor.role === "string" && rawAnchor.role.trim()
        ? rawAnchor.role
        : name,
    tags: Array.isArray(rawAnchor.tags)
      ? rawAnchor.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

function normalizeEntry(rawEntry: RawStructureEntry): StructureEntry | undefined {
  if (!rawEntry.id?.trim()) {
    warnOnce("structure:missing-id", "structure registry entry missing id; skipping");
    return undefined;
  }
  const padTuple = Array.isArray(rawEntry.padSize) ? rawEntry.padSize : undefined;
  const padSize =
    padTuple &&
    padTuple.length === 2 &&
    typeof padTuple[0] === "number" &&
    typeof padTuple[1] === "number"
      ? { x: padTuple[0], z: padTuple[1] }
      : undefined;
  if (!padSize) {
    warnOnce(`structure:${rawEntry.id}:pad`, `structure ${rawEntry.id} has invalid padSize`);
  }
  const anchorOffset = toOffset(rawEntry.anchorOffset);
  if (!anchorOffset) {
    warnOnce(
      `structure:${rawEntry.id}:anchorOffset`,
      `structure ${rawEntry.id} anchorOffset unresolved; using origin`
    );
  }
  const gateOffset = toOffset(rawEntry.gateOffset);
  if (!gateOffset) {
    warnOnce(
      `structure:${rawEntry.id}:gateOffset`,
      `structure ${rawEntry.id} gateOffset unresolved; stub-path logic will skip`
    );
  }
  const npcAnchors: Record<string, StructureNpcAnchor | undefined> = {};
  for (const [name, offset] of Object.entries(rawEntry.npcAnchors ?? {})) {
    const parsed = toNpcAnchor(name, offset);
    if (!parsed) {
      warnOnce(
        `structure:${rawEntry.id}:npc:${name}`,
        `structure ${rawEntry.id} npc anchor ${name} unresolved; skipping spawn`
      );
    }
    npcAnchors[name] = parsed;
  }
  const zones: Record<string, StructureZoneVolume | undefined> = {};
  for (const [name, rawZone] of Object.entries(rawEntry.zones ?? {})) {
    if (rawZone === "TODO") {
      warnOnce(
        `structure:${rawEntry.id}:zone:${name}`,
        `structure ${rawEntry.id} zone ${name} unresolved; skipping`
      );
      zones[name] = undefined;
      continue;
    }
    const parsed = parseZoneVolume(rawZone);
    if (!parsed) {
      warnOnce(
        `structure:${rawEntry.id}:zone:${name}`,
        `structure ${rawEntry.id} zone ${name} malformed; skipping`
      );
    }
    zones[name] = parsed;
  }
  return {
    id: rawEntry.id,
    trade: rawEntry.trade,
    level: rawEntry.level,
    padSize,
    anchor: rawEntry.anchor ?? "front-left-pad-corner",
    anchorOffset,
    front: toCardinal(rawEntry.front),
    gateOffset,
    npcAnchors,
    zones,
  };
}

const STRUCTURES = (file.structures ?? [])
  .map((entry) => normalizeEntry(entry))
  .filter((entry): entry is StructureEntry => Boolean(entry));

function offsetFromUnknown(value: unknown): StructureOffset | undefined {
  return toOffset(value);
}

export function allStructures(): StructureEntry[] {
  return STRUCTURES;
}

export function structureById(id: string): StructureEntry | undefined {
  return STRUCTURES.find((entry) => entry.id === id);
}

export function structureForTradeLevel(
  trade: string,
  level: number
): StructureEntry | undefined {
  return STRUCTURES.find(
    (entry) => entry.trade === trade && entry.level === level
  );
}

export function successorOffsetForTrade(trade: string): StructureOffset {
  const byTrade = offsetFromUnknown(file.successorOffsetByTrade?.[trade]);
  if (byTrade) return byTrade;
  const fallback = offsetFromUnknown(file.successorOffsetByTrade?.default);
  if (fallback) return fallback;
  warnOnce("structure:successor-default", "missing successor default offset; using 40,0,0");
  return { x: 40, y: 0, z: 0 };
}

export function groupedStructureCatalog(): Record<
  "trades" | "civic" | "homes" | "imports",
  StructureEntry[]
> {
  const groups = {
    trades: [] as StructureEntry[],
    civic: [] as StructureEntry[],
    homes: [] as StructureEntry[],
    imports: [] as StructureEntry[],
  };
  for (const entry of STRUCTURES) {
    if (entry.trade) groups.trades.push(entry);
    else if (entry.id.includes("home_")) groups.homes.push(entry);
    else if (entry.id.includes("real_estate") || entry.id.includes("church")) {
      groups.civic.push(entry);
    } else {
      groups.imports.push(entry);
    }
  }
  return groups;
}
