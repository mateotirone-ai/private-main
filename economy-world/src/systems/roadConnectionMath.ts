import type { StructureOffset } from "../content/structures";
import type { PlacementTransform } from "./structurePlacementMath";
import { transformOffset } from "./structurePlacementMath";
import {
  nearestPointOnSegments,
  rasterizePolyline,
  type StreetCell,
  type XZ,
} from "./streetMath";

export interface RoadSegment {
  a: XZ;
  b: XZ;
}

export function structureGateWorld(
  anchor: StructureOffset,
  anchorOffset: StructureOffset,
  gateOffset: StructureOffset,
  transform: PlacementTransform
): StructureOffset {
  const localGate = {
    x: anchorOffset.x + gateOffset.x,
    y: anchorOffset.y + gateOffset.y,
    z: anchorOffset.z + gateOffset.z,
  };
  const offset = transformOffset(localGate, transform);
  return {
    x: anchor.x + offset.x,
    y: anchor.y + offset.y,
    z: anchor.z + offset.z,
  };
}

export function roadStubToNearest(
  gate: XZ,
  roadSegments: RoadSegment[],
  width: number,
  maxDistance: number
): { cells: StreetCell[]; distance: number } | undefined {
  const nearest = nearestPointOnSegments(gate, roadSegments);
  if (!nearest || nearest.distance > maxDistance) return undefined;
  return {
    cells: rasterizePolyline([gate, nearest.point], width, "stub"),
    distance: nearest.distance,
  };
}
