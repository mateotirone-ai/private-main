/**
 * Pure town-seed helpers: transforms, slot fill resolution, greening masks.
 */
import type { Cardinal, StructureMirror } from "../content/structures";
import {
  structureById,
  structureForTradeLevel,
} from "../content/structures";
import {
  defaultTownLayoutId,
  type LayoutSlot,
  type TownLayout,
} from "../content/townLayouts";
import type { PlacementTransform } from "./structurePlacementMath";
import {
  resolveTargetFrontTransform,
  transformFacing,
  transformOffset,
} from "./structurePlacementMath";
import type { XZ } from "./streetMath";

export type SeedMode = "survey" | "skeleton" | "full";

export function parseSeedtownArgs(argument?: string): {
  mode: SeedMode;
  layoutId?: string;
} {
  if (!argument?.trim()) {
    return { mode: "full", layoutId: defaultTownLayoutId() };
  }
  const parts = argument.trim().split(/\s+/);
  const first = parts[0]!;
  if (first === "survey" || first === "skeleton" || first === "full") {
    return { mode: first, layoutId: parts[1] ?? defaultTownLayoutId() };
  }
  return { mode: "full", layoutId: first };
}

export function townInstanceId(
  layoutId: string,
  dimensionId: string,
  anchor: { x: number; y: number; z: number }
): string {
  return `${layoutId}@${dimensionId}:${anchor.x},${anchor.y},${anchor.z}`;
}

export function localToWorld(
  local: { x: number; y?: number; z: number },
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): { x: number; y: number; z: number } {
  const offset = transformOffset(
    { x: local.x, y: local.y ?? 0, z: local.z },
    transform
  );
  return {
    x: origin.x + offset.x,
    y: origin.y + offset.y,
    z: origin.z + offset.z,
  };
}

export function transformPad(
  pad: { x1: number; z1: number; x2: number; z2: number },
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): { x1: number; z1: number; x2: number; z2: number } {
  const corners = [
    localToWorld({ x: pad.x1, z: pad.z1 }, origin, transform),
    localToWorld({ x: pad.x1, z: pad.z2 }, origin, transform),
    localToWorld({ x: pad.x2, z: pad.z1 }, origin, transform),
    localToWorld({ x: pad.x2, z: pad.z2 }, origin, transform),
  ];
  return {
    x1: Math.min(...corners.map((c) => c.x)),
    z1: Math.min(...corners.map((c) => c.z)),
    x2: Math.max(...corners.map((c) => c.x)),
    z2: Math.max(...corners.map((c) => c.z)),
  };
}

export function slotRotationSteps(rot?: 0 | 90 | 180 | 270): 0 | 1 | 2 | 3 {
  if (rot === 90) return 1;
  if (rot === 180) return 2;
  if (rot === 270) return 3;
  return 0;
}

/**
 * Slot rotation declares which way the building front faces in layout-local
 * space: 0=north, 90=east, 180=south, 270=west.
 */
export function slotTargetFront(rot?: 0 | 90 | 180 | 270): Cardinal {
  return transformFacing("north", {
    rotationSteps: slotRotationSteps(rot),
    mirror: "none",
  });
}

/**
 * Aim a structure's declared front at the slot's road-facing direction, then
 * apply the town's rotation/mirror. This keeps mixed source orientations from
 * placing entrances away from their roads.
 */
export function structureTransformForSlot(
  structureFront: Cardinal,
  rot: 0 | 90 | 180 | 270 | undefined,
  layoutTransform: PlacementTransform
): PlacementTransform {
  const worldTargetFront = transformFacing(slotTargetFront(rot), layoutTransform);
  return resolveTargetFrontTransform(
    structureFront,
    worldTargetFront,
    layoutTransform.mirror
  );
}

/** Map layout slot → registry structure id, or undefined if missing (slot stays empty). */
export function resolveSlotStructureId(slot: LayoutSlot): string | undefined {
  const hint = (slot.hint ?? "").toLowerCase();
  if (slot.role === "house") {
    return structureById("ew:home_5")?.id;
  }
  if (slot.role === "work_site" || slot.role === "work_zone") {
    if (hint.includes("farm") || hint.includes("crop")) {
      return structureForTradeLevel("crop_farm", 1)?.id;
    }
    if (
      hint.includes("quarry") ||
      hint.includes("large-pad") ||
      hint.includes("mine")
    ) {
      return structureForTradeLevel("stone_quarry", 1)?.id;
    }
    if (hint.includes("lumber")) {
      return structureForTradeLevel("lumber_camp", 1)?.id;
    }
    return structureForTradeLevel("stone_quarry", 1)?.id;
  }
  if (slot.role === "storefront" || slot.role === "station") {
    const tradeHint = hint.split(/[\s+/]+/)[0]?.replace(/[^a-z_]/g, "");
    if (tradeHint) {
      return structureForTradeLevel(tradeHint, 1)?.id;
    }
  }
  if (slot.role === "civic") {
    if (hint.includes("real_estate") || hint.includes("real-estate")) {
      return structureById("ew:real_estate_L1")?.id
        ?? structureForTradeLevel("real_estate", 1)?.id;
    }
    // town_hall / bank / church / dealer — no captures yet → empty
    return undefined;
  }
  return undefined;
}

export function slotShouldFillInMode(
  mode: SeedMode,
  slot: LayoutSlot
): "marker" | "structure" | "empty" | "parcel_only" {
  if (mode === "survey") return "marker";
  if (slot.role === "parcel_empty" || slot.role === "commons") {
    return "parcel_only";
  }
  if (mode === "skeleton") {
    if (slot.role === "civic" && (slot.hint ?? "").includes("town_hall")) {
      return resolveSlotStructureId(slot) ? "structure" : "empty";
    }
    if (slot.role === "commons") return "parcel_only";
    return "empty";
  }
  // full
  if (resolveSlotStructureId(slot)) return "structure";
  return "empty";
}

export function clearingMaskCells(
  layout: TownLayout,
  margin: number
): XZ[] {
  const cells = new Map<string, XZ>();
  const addRect = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    feather: number
  ) => {
    for (let x = x1 - feather; x <= x2 + feather; x += 1) {
      for (let z = z1 - feather; z <= z2 + feather; z += 1) {
        const dx = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
        const dz = z < z1 ? z1 - z : z > z2 ? z - z2 : 0;
        const dist = Math.sqrt(dx * dx + dz * dz);
        // Irregular feather: keep edge cells with noise threshold
        if (dist > feather) continue;
        if (dist > 0 && hash2(x, z) % 100 < dist * (100 / Math.max(1, feather))) {
          continue;
        }
        cells.set(`${x},${z}`, { x, z });
      }
    }
  };
  for (const slot of layout.slots) {
    if (!slot.pad) continue;
    addRect(slot.pad.x1, slot.pad.z1, slot.pad.x2, slot.pad.z2, margin);
  }
  const streets = [layout.streets.main, ...layout.streets.lanes];
  for (const line of streets) {
    for (const p of line.points) {
      addRect(p.x - 2, p.z - 2, p.x + 2, p.z + 2, margin);
    }
  }
  const plaza = layout.streets.plaza;
  addRect(
    plaza.center.x - plaza.radii.x,
    plaza.center.z - plaza.radii.z,
    plaza.center.x + plaza.radii.x,
    plaza.center.z + plaza.radii.z,
    margin
  );
  return [...cells.values()];
}

function hash2(x: number, z: number): number {
  let n = (x * 374761393 + z * 668265263) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return Math.abs(n | 0);
}

export function meadowFlowerAt(x: number, z: number, density: number): boolean {
  return hash2(x, z) % 1000 < density * 1000;
}

export function hedgeBoundaryCells(pad: {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}): XZ[] {
  const cells: XZ[] = [];
  for (let x = pad.x1; x <= pad.x2; x += 1) {
    cells.push({ x, z: pad.z1 }, { x, z: pad.z2 });
  }
  for (let z = pad.z1 + 1; z <= pad.z2 - 1; z += 1) {
    cells.push({ x: pad.x1, z }, { x: pad.x2, z });
  }
  return cells;
}

export function surveyFloorMapping(
  parcelCount: number,
  floorWidth: number,
  floorDepth: number
): Array<{ parcelIndex: number; x: number; z: number }> {
  if (parcelCount <= 0 || floorWidth <= 0 || floorDepth <= 0) return [];
  const cols = Math.max(1, Math.ceil(Math.sqrt(parcelCount)));
  const rows = Math.max(1, Math.ceil(parcelCount / cols));
  const cellW = Math.max(1, Math.floor(floorWidth / cols));
  const cellD = Math.max(1, Math.floor(floorDepth / rows));
  const tiles: Array<{ parcelIndex: number; x: number; z: number }> = [];
  for (let i = 0; i < parcelCount; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = col * cellW;
    const z0 = row * cellD;
    for (let x = x0; x < x0 + cellW && x < floorWidth; x += 1) {
      for (let z = z0; z < z0 + cellD && z < floorDepth; z += 1) {
        tiles.push({ parcelIndex: i, x, z });
      }
    }
  }
  return tiles;
}

export function defaultLayoutTransform(
  mirror: StructureMirror = "none"
): PlacementTransform {
  return { rotationSteps: 0, mirror };
}
