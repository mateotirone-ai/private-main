/**
 * Pure extraction-pit volume math — transforms, membership, regen eligibility.
 */
import type {
  StructureMirror,
  StructureOffset,
  StructureZoneVolume,
  ZoneBox,
} from "../content/structures";
import type { PlacementTransform } from "./structurePlacementMath";
import { transformOffset } from "./structurePlacementMath";

export type { StructureZoneVolume, ZoneBox };

export interface WorldAabb {
  min: StructureOffset;
  max: StructureOffset;
}

export type RegenPhase = "idle" | "eligible" | "ready";

export interface RegenWindow {
  eligibleSinceTick: number | null;
}

function rotate90CounterClockwise(offset: StructureOffset): StructureOffset {
  return { x: offset.z, y: offset.y, z: -offset.x };
}

function applyMirror(offset: StructureOffset, mirror: StructureMirror): StructureOffset {
  if (mirror === "x") return { x: -offset.x, y: offset.y, z: offset.z };
  if (mirror === "z") return { x: offset.x, y: offset.y, z: -offset.z };
  if (mirror === "xz") return { x: -offset.x, y: offset.y, z: -offset.z };
  return { ...offset };
}

/** Undo placement transform so world-relative offsets become structure-local. */
export function inverseTransformOffset(
  offset: StructureOffset,
  transform: PlacementTransform
): StructureOffset {
  let out = { ...offset };
  for (let i = 0; i < transform.rotationSteps; i += 1) {
    out = rotate90CounterClockwise(out);
  }
  return applyMirror(out, transform.mirror);
}

export function pointInLocalBox(
  point: StructureOffset,
  box: ZoneBox
): boolean {
  return (
    point.x >= box.min.x &&
    point.x <= box.max.x &&
    point.y >= box.min.y &&
    point.y <= box.max.y &&
    point.z >= box.min.z &&
    point.z <= box.max.z
  );
}

export function pointInLocalVolume(
  point: StructureOffset,
  volume: StructureZoneVolume | undefined
): boolean {
  if (!volume) return false;
  return volume.boxes.some((box) => pointInLocalBox(point, box));
}

export function worldAabbForLocalBox(
  origin: StructureOffset,
  box: ZoneBox,
  transform: PlacementTransform
): WorldAabb {
  const corners: StructureOffset[] = [];
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const local = transformOffset({ x, y, z }, transform);
        corners.push({
          x: origin.x + local.x,
          y: origin.y + local.y,
          z: origin.z + local.z,
        });
      }
    }
  }
  return {
    min: {
      x: Math.min(...corners.map((c) => c.x)),
      y: Math.min(...corners.map((c) => c.y)),
      z: Math.min(...corners.map((c) => c.z)),
    },
    max: {
      x: Math.max(...corners.map((c) => c.x)),
      y: Math.max(...corners.map((c) => c.y)),
      z: Math.max(...corners.map((c) => c.z)),
    },
  };
}

export function pointInWorldAabb(
  point: StructureOffset,
  bounds: WorldAabb
): boolean {
  return (
    point.x >= bounds.min.x &&
    point.x <= bounds.max.x &&
    point.y >= bounds.min.y &&
    point.y <= bounds.max.y &&
    point.z >= bounds.min.z &&
    point.z <= bounds.max.z
  );
}

export function worldPointToLocal(
  worldPoint: StructureOffset,
  origin: StructureOffset,
  transform: PlacementTransform
): StructureOffset {
  return inverseTransformOffset(
    {
      x: worldPoint.x - origin.x,
      y: worldPoint.y - origin.y,
      z: worldPoint.z - origin.z,
    },
    transform
  );
}

export function floorPoint(point: StructureOffset): StructureOffset {
  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y),
    z: Math.floor(point.z),
  };
}

export function authoredBlockMatches(
  authoredTypeId: string | undefined,
  brokenTypeId: string
): boolean {
  if (!authoredTypeId) return false;
  if (
    authoredTypeId === "minecraft:air" ||
    authoredTypeId === "minecraft:structure_void"
  ) {
    return false;
  }
  return authoredTypeId === brokenTypeId;
}

export function regenEligible(input: {
  clockedInCount: number;
  playersOnPad: number;
}): boolean {
  return input.clockedInCount === 0 && input.playersOnPad === 0;
}

export function nextRegenWindow(
  previous: RegenWindow,
  eligible: boolean,
  nowTick: number
): RegenWindow {
  if (!eligible) return { eligibleSinceTick: null };
  if (previous.eligibleSinceTick == null) {
    return { eligibleSinceTick: nowTick };
  }
  return previous;
}

export function regenReady(
  window: RegenWindow,
  nowTick: number,
  delayTicks: number
): boolean {
  if (window.eligibleSinceTick == null) return false;
  return nowTick - window.eligibleSinceTick >= Math.max(0, delayTicks);
}

export function regenPhase(
  window: RegenWindow,
  nowTick: number,
  delayTicks: number
): RegenPhase {
  if (window.eligibleSinceTick == null) return "idle";
  if (regenReady(window, nowTick, delayTicks)) return "ready";
  return "eligible";
}

export function regenRemainingTicks(
  window: RegenWindow,
  nowTick: number,
  delayTicks: number
): number | null {
  if (window.eligibleSinceTick == null) return null;
  return Math.max(0, delayTicks - (nowTick - window.eligibleSinceTick));
}
