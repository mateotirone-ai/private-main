import type { Cardinal, StructureMirror, StructureOffset } from "../content/structures";

const CARDINALS: readonly Cardinal[] = ["north", "east", "south", "west"];

export interface PlacementTransform {
  rotationSteps: 0 | 1 | 2 | 3;
  mirror: StructureMirror;
}

export function oppositeFacing(facing: Cardinal): Cardinal {
  const idx = CARDINALS.indexOf(facing);
  return CARDINALS[(idx + 2) % CARDINALS.length]!;
}

export function facingFromYaw(yaw: number): Cardinal {
  const normalized = ((Math.round(yaw / 90) % 4) + 4) % 4;
  return CARDINALS[normalized]!;
}

export function rotationFromFrontFace(
  source: Cardinal,
  target: Cardinal
): 0 | 1 | 2 | 3 {
  const sourceIdx = CARDINALS.indexOf(source);
  const targetIdx = CARDINALS.indexOf(target);
  return ((targetIdx - sourceIdx + 4) % 4) as 0 | 1 | 2 | 3;
}

function applyMirror(offset: StructureOffset, mirror: StructureMirror): StructureOffset {
  if (mirror === "x") return { x: -offset.x, y: offset.y, z: offset.z };
  if (mirror === "z") return { x: offset.x, y: offset.y, z: -offset.z };
  if (mirror === "xz") return { x: -offset.x, y: offset.y, z: -offset.z };
  return { ...offset };
}

function rotate90Clockwise(offset: StructureOffset): StructureOffset {
  return { x: -offset.z, y: offset.y, z: offset.x };
}

function applyRotation(
  offset: StructureOffset,
  rotationSteps: 0 | 1 | 2 | 3
): StructureOffset {
  let out = { ...offset };
  for (let i = 0; i < rotationSteps; i += 1) out = rotate90Clockwise(out);
  return out;
}

function facingVector(facing: Cardinal): StructureOffset {
  if (facing === "north") return { x: 0, y: 0, z: -1 };
  if (facing === "east") return { x: 1, y: 0, z: 0 };
  if (facing === "south") return { x: 0, y: 0, z: 1 };
  return { x: -1, y: 0, z: 0 };
}

function vectorFacing(offset: StructureOffset): Cardinal {
  if (offset.z < 0) return "north";
  if (offset.x > 0) return "east";
  if (offset.z > 0) return "south";
  return "west";
}

export function transformOffset(
  offset: StructureOffset,
  transform: PlacementTransform
): StructureOffset {
  return applyRotation(applyMirror(offset, transform.mirror), transform.rotationSteps);
}

export function transformFacing(
  facing: Cardinal,
  transform: PlacementTransform
): Cardinal {
  return vectorFacing(transformOffset(facingVector(facing), transform));
}

export function resolveTargetFrontTransform(
  structureFront: Cardinal,
  targetFront: Cardinal,
  mirror: StructureMirror = "none"
): PlacementTransform {
  const mirroredFront = transformFacing(structureFront, {
    rotationSteps: 0,
    mirror,
  });
  return {
    rotationSteps: rotationFromFrontFace(mirroredFront, targetFront),
    mirror,
  };
}

export function resolvePlacementTransform(
  structureFront: Cardinal,
  playerYaw: number,
  mirror: StructureMirror = "none"
): PlacementTransform {
  const playerFacing = facingFromYaw(playerYaw);
  const targetFront = oppositeFacing(playerFacing);
  return resolveTargetFrontTransform(structureFront, targetFront, mirror);
}
