/**
 * Volume extraction pits (quarry pattern): site context, membership, credits.
 * Runtime StructureManager restore lives in structurePlacement; regen in extraction.
 */
import type {
  StructureEntry,
  StructureOffset,
  StructureZoneVolume,
} from "../content/structures";
import { structureForTradeLevel } from "../content/structures";
import type { Business } from "./businesses";
import {
  authoredBlockMatches,
  floorPoint,
  pointInLocalVolume,
  worldPointToLocal,
  type WorldAabb,
  worldAabbForLocalBox,
  pointInWorldAabb,
} from "./extractionZoneMath";
import type { PlacementTransform } from "./structurePlacementMath";
import { transformOffset } from "./structurePlacementMath";

export interface PitSiteContext {
  business: Business;
  entry: StructureEntry;
  origin: StructureOffset;
  transform: PlacementTransform;
  workPit?: StructureZoneVolume;
  protectedStairs?: StructureZoneVolume;
  padBounds?: WorldAabb;
}

export function structureOriginForSite(
  anchor: StructureOffset,
  entry: StructureEntry,
  transform: PlacementTransform
): StructureOffset {
  const correction = transformOffset(entry.anchorOffset ?? { x: 0, y: 0, z: 0 }, transform);
  return {
    x: anchor.x + correction.x,
    y: anchor.y + correction.y,
    z: anchor.z + correction.z,
  };
}

export function padBoundsForEntry(
  origin: StructureOffset,
  entry: StructureEntry,
  transform: PlacementTransform
): WorldAabb | undefined {
  if (!entry.padSize) return undefined;
  const local = {
    min: { x: 0, y: -8, z: 0 },
    max: {
      x: entry.padSize.x - 1,
      y: 64,
      z: entry.padSize.z - 1,
    },
  };
  return worldAabbForLocalBox(origin, local, transform);
}

export function pitSiteContext(
  business: Business,
  level = business.tier
): PitSiteContext | undefined {
  if (!business.site) return undefined;
  const entry = structureForTradeLevel(business.trade, level);
  if (!entry) return undefined;
  const transform: PlacementTransform = {
    rotationSteps: business.site.rotationSteps,
    mirror: business.site.mirror,
  };
  const origin = structureOriginForSite(business.site.anchor, entry, transform);
  return {
    business,
    entry,
    origin,
    transform,
    workPit: entry.zones.work_pit,
    protectedStairs: entry.zones.protected_stairs,
    padBounds: padBoundsForEntry(origin, entry, transform),
  };
}

export function localOffsetAtWorld(
  ctx: PitSiteContext,
  worldPoint: StructureOffset
): StructureOffset {
  return floorPoint(
    worldPointToLocal(floorPoint(worldPoint), ctx.origin, ctx.transform)
  );
}

export function isInProtectedStairs(
  ctx: PitSiteContext,
  worldPoint: StructureOffset
): boolean {
  return pointInLocalVolume(
    localOffsetAtWorld(ctx, worldPoint),
    ctx.protectedStairs
  );
}

export function isInWorkPit(
  ctx: PitSiteContext,
  worldPoint: StructureOffset
): boolean {
  return pointInLocalVolume(localOffsetAtWorld(ctx, worldPoint), ctx.workPit);
}

export function isOnPad(
  ctx: PitSiteContext,
  worldPoint: StructureOffset
): boolean {
  if (!ctx.padBounds) return false;
  return pointInWorldAabb(floorPoint(worldPoint), ctx.padBounds);
}

export type PitBreakDecision =
  | { kind: "outside" }
  | { kind: "stairs" }
  | { kind: "pad_denied" }
  | { kind: "pit_closed" }
  | { kind: "pit_storage_full" }
  | { kind: "pit_credit"; units: number }
  | { kind: "pit_no_credit" };

export function decidePitBreak(input: {
  onPad: boolean;
  inStairs: boolean;
  inPit: boolean;
  clockedIntoThis: boolean;
  siteClosed: boolean;
  storageFull: boolean;
  authoredMatches: boolean;
}): PitBreakDecision {
  if (input.inStairs) return { kind: "stairs" };
  if (!input.onPad) return { kind: "outside" };
  if (!input.clockedIntoThis) return { kind: "pad_denied" };
  if (!input.inPit) return { kind: "outside" };
  if (input.siteClosed) return { kind: "pit_closed" };
  if (!input.authoredMatches) return { kind: "pit_no_credit" };
  if (input.storageFull) return { kind: "pit_storage_full" };
  return { kind: "pit_credit", units: 1 };
}

export function shouldCreditAuthoredBreak(
  authoredTypeId: string | undefined,
  brokenTypeId: string
): boolean {
  return authoredBlockMatches(authoredTypeId, brokenTypeId);
}

export function zonesForTradeLevel(
  trade: string,
  level: number
): Record<string, StructureZoneVolume | undefined> | undefined {
  return structureForTradeLevel(trade, level)?.zones;
}
