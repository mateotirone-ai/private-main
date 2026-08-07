/**
 * Pure town-expansion math — growth points, module join, pricing, recommendation.
 */
import type { DistrictModule } from "../content/districtModules";
import type { LayoutDir, LayoutGrowthPoint, TownLayout } from "../content/townLayouts";
import type { PlacementTransform } from "./structurePlacementMath";
import { transformOffset } from "./structurePlacementMath";
import { localToWorld } from "./townSeedMath";
import type { XZ } from "./streetMath";

export interface GrowthPointRecord {
  id: string;
  localAt: XZ;
  worldAt: { x: number; y: number; z: number };
  dir: LayoutDir;
  label: string;
  source: "layout" | "module";
  retired: boolean;
}

export interface ExpansionRecord {
  id: string;
  moduleId: string;
  growthPointId: string;
  startedTick: number;
  completeTick: number;
  cost: number;
  roadCellsTotal: number;
  roadCellsPaved: number;
  parcelsRegistered: boolean;
  jointWorld: { x: number; y: number; z: number };
  joinRotationSteps: 0 | 1 | 2 | 3;
}

const DIRS: readonly LayoutDir[] = ["north", "east", "south", "west"];

export function dirToSteps(dir: LayoutDir): 0 | 1 | 2 | 3 {
  return DIRS.indexOf(dir) as 0 | 1 | 2 | 3;
}

/** Rotation that maps `from` onto `to` (clockwise steps). */
export function rotationAligningDirs(
  from: LayoutDir,
  to: LayoutDir
): 0 | 1 | 2 | 3 {
  return ((dirToSteps(to) - dirToSteps(from) + 4) % 4) as 0 | 1 | 2 | 3;
}

export function rotateDir(dir: LayoutDir, steps: 0 | 1 | 2 | 3): LayoutDir {
  return DIRS[(dirToSteps(dir) + steps) % 4]!;
}

export function growthPointLabel(
  dir: LayoutDir,
  note?: string,
  index = 0
): string {
  const compass = dir[0]!.toUpperCase() + dir.slice(1);
  if (note?.trim()) return `${compass} — ${note}`;
  return `${compass} street end ${index + 1}`;
}

export function registerLayoutGrowthPoints(
  layout: TownLayout,
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): GrowthPointRecord[] {
  return layout.growthPoints.map((gp, index) => {
    const world = localToWorld(gp.at, origin, transform);
    const dir = rotateDir(gp.dir, transform.rotationSteps);
    return {
      id: `gp:layout:${index}`,
      localAt: { ...gp.at },
      worldAt: world,
      dir,
      label: growthPointLabel(dir, gp.note, index),
      source: "layout" as const,
      retired: false,
    };
  });
}

/**
 * Module-local point → world, joining at growth point.
 * 1) Translate so connection.at is origin
 * 2) Rotate so connection.dir aligns with growth point dir
 * 3) Offset to growth point world
 */
export function moduleLocalToWorld(
  local: XZ,
  module: DistrictModule,
  growthWorld: { x: number; y: number; z: number },
  joinRotationSteps: 0 | 1 | 2 | 3
): { x: number; y: number; z: number } {
  const relative = {
    x: local.x - module.connection.at.x,
    y: 0,
    z: local.z - module.connection.at.z,
  };
  const rotated = transformOffset(relative, {
    rotationSteps: joinRotationSteps,
    mirror: "none",
  });
  return {
    x: Math.round(growthWorld.x + rotated.x),
    y: growthWorld.y,
    z: Math.round(growthWorld.z + rotated.z),
  };
}

export function moduleJoinRotation(
  module: DistrictModule,
  growthDir: LayoutDir
): 0 | 1 | 2 | 3 {
  return rotationAligningDirs(module.connection.dir, growthDir);
}

export function moduleGrowthPointsAfterJoin(
  module: DistrictModule,
  expansionId: string,
  growthWorld: { x: number; y: number; z: number },
  joinRotationSteps: 0 | 1 | 2 | 3
): GrowthPointRecord[] {
  return module.growthPoints.map((gp, index) => {
    const world = moduleLocalToWorld(gp.at, module, growthWorld, joinRotationSteps);
    const dir = rotateDir(gp.dir, joinRotationSteps);
    return {
      id: `gp:${expansionId}:${index}`,
      localAt: { ...gp.at },
      worldAt: world,
      dir,
      label: growthPointLabel(dir, gp.note, index),
      source: "module" as const,
      retired: false,
    };
  });
}

export function retireGrowthPoint(
  points: GrowthPointRecord[],
  growthPointId: string
): GrowthPointRecord[] {
  return points.map((gp) =>
    gp.id === growthPointId ? { ...gp, retired: true } : gp
  );
}

export function activeGrowthPoints(
  points: GrowthPointRecord[]
): GrowthPointRecord[] {
  return points.filter((gp) => !gp.retired);
}

export function moduleFootprintArea(module: DistrictModule): number {
  return module.area.x * module.area.z;
}

export interface ExpansionPriceBreakdown {
  moduleArea: number;
  basePerBlock2: number;
  outsideWallsDiscount: number;
  price: number;
  lines: string[];
}

export function computeExpansionPrice(input: {
  module: DistrictModule;
  basePerBlock2: number;
  outsideWallsDiscount: number;
}): ExpansionPriceBreakdown {
  const moduleArea = moduleFootprintArea(input.module);
  const price = Math.round(
    moduleArea * input.basePerBlock2 * input.outsideWallsDiscount
  );
  return {
    moduleArea,
    basePerBlock2: input.basePerBlock2,
    outsideWallsDiscount: input.outsideWallsDiscount,
    price,
    lines: [
      `Module area ${moduleArea} blocks`,
      `Base ${input.basePerBlock2} per block²`,
      `Outside-walls ×${input.outsideWallsDiscount}`,
      `Treasury cost ${price} merids`,
    ],
  };
}

/** Star residential when vacant house parcels < 25%, else industrial. */
export function recommendedModuleId(input: {
  houseParcelCount: number;
  vacantHouseParcelCount: number;
  candidates: string[];
}): string | undefined {
  const { candidates } = input;
  if (!candidates.length) return undefined;
  const vacantRatio =
    input.houseParcelCount <= 0
      ? 1
      : input.vacantHouseParcelCount / input.houseParcelCount;
  const preferResidential = vacantRatio < 0.25;
  if (preferResidential && candidates.includes("residential_close")) {
    return "residential_close";
  }
  if (candidates.includes("industrial_yard")) return "industrial_yard";
  if (candidates.includes("residential_close")) return "residential_close";
  return candidates[0];
}

export function expansionDurationTicks(
  moduleArea: number,
  ticksPerBlock: number,
  minTicks: number,
  maxTicks: number
): number {
  const raw = Math.round(moduleArea * ticksPerBlock);
  return Math.max(minTicks, Math.min(maxTicks, raw));
}

export function roadCellsDue(
  total: number,
  startedTick: number,
  completeTick: number,
  nowTick: number
): number {
  if (total <= 0) return 0;
  if (nowTick >= completeTick) return total;
  if (nowTick <= startedTick) return 0;
  const span = Math.max(1, completeTick - startedTick);
  return Math.min(
    total,
    Math.floor(((nowTick - startedTick) / span) * total)
  );
}

export function throughRoadCells(
  module: DistrictModule,
  growthWorld: { x: number; y: number; z: number },
  joinRotationSteps: 0 | 1 | 2 | 3
): XZ[] {
  const lane = module.streets.lanes[0];
  if (!lane) return [];
  // First segment continues the dead-end into a through connection.
  return lane.points.map((p) => {
    const w = moduleLocalToWorld(p, module, growthWorld, joinRotationSteps);
    return { x: w.x, z: w.z };
  });
}

export function expansionShortfall(needed: number, available: number): number {
  return Math.max(0, needed - available);
}

export function townTreasuryAccount(townId: string): `t:${string}` {
  return `t:${townId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

export function preserveExpansionsOnReseed(
  previous: ExpansionRecord[] | undefined
): ExpansionRecord[] {
  return previous ? previous.map((e) => ({ ...e })) : [];
}

export function growthPointsFromLayoutOrPreserved(
  layoutPoints: GrowthPointRecord[],
  previous: GrowthPointRecord[] | undefined,
  preservedExpansions: ExpansionRecord[]
): GrowthPointRecord[] {
  if (!previous?.length || !preservedExpansions.length) return layoutPoints;
  // Keep retirement + module-born points; refresh layout world coords from reseed.
  const byId = new Map(layoutPoints.map((gp) => [gp.id, gp]));
  const out: GrowthPointRecord[] = layoutPoints.map((gp) => {
    const old = previous.find((p) => p.id === gp.id);
    return old?.retired ? { ...gp, retired: true } : gp;
  });
  for (const gp of previous) {
    if (gp.source === "module" && !byId.has(gp.id)) out.push({ ...gp });
  }
  return out;
}
