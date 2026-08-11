import type { Dimension } from "@minecraft/server";
import { districtModuleById } from "../content/districtModules";
import { matrix } from "../content/matrix";
import type { StructureEntry, StructureOffset } from "../content/structures";
import { townLayoutById } from "../content/townLayouts";
import { moduleLocalToWorld } from "./expansionMath";
import {
  roadStubToNearest,
  structureGateWorld,
  type RoadSegment,
} from "./roadConnectionMath";
import type { PlacementTransform } from "./structurePlacementMath";
import { localToWorld } from "./townSeedMath";
import { loadTownInstances } from "./townInstances";

const AIR_OR_PLANTS = new Set([
  "minecraft:air",
  "minecraft:cave_air",
  "minecraft:void_air",
  "minecraft:short_grass",
  "minecraft:tall_grass",
  "minecraft:fern",
  "minecraft:large_fern",
  "minecraft:snow_layer",
  "minecraft:poppy",
  "minecraft:dandelion",
  "minecraft:azure_bluet",
  "minecraft:oxeye_daisy",
  "minecraft:cornflower",
]);

export interface RoadConnectionResult {
  connected: boolean;
  reason?: "missing_gate" | "no_existing_road";
  distance?: number;
  cellsPaved: number;
}

function baseTownRoadSegments(dimensionId: string): RoadSegment[] {
  const segments: RoadSegment[] = [];
  const instances = loadTownInstances();
  for (const town of Object.values(instances.byId)) {
    if (town.dimensionId !== dimensionId || town.mode === "survey") continue;
    const layout = townLayoutById(town.layoutId);
    if (!layout) continue;
    const transform: PlacementTransform = {
      rotationSteps: town.rotationSteps,
      mirror: town.mirror,
    };
    for (const line of [layout.streets.main, ...layout.streets.lanes]) {
      for (let i = 0; i < line.points.length - 1; i += 1) {
        const a = localToWorld(line.points[i]!, town.anchor, transform);
        const b = localToWorld(line.points[i + 1]!, town.anchor, transform);
        segments.push({
          a: { x: a.x, z: a.z },
          b: { x: b.x, z: b.z },
        });
      }
    }

    for (const expansion of town.expansions) {
      if (expansion.roadCellsPaved < expansion.roadCellsTotal) continue;
      const module = districtModuleById(expansion.moduleId);
      if (!module) continue;
      for (const line of module.streets.lanes) {
        for (let i = 0; i < line.points.length - 1; i += 1) {
          const a = moduleLocalToWorld(
            line.points[i]!,
            module,
            expansion.jointWorld,
            expansion.joinRotationSteps
          );
          const b = moduleLocalToWorld(
            line.points[i + 1]!,
            module,
            expansion.jointWorld,
            expansion.joinRotationSteps
          );
          segments.push({
            a: { x: a.x, z: a.z },
            b: { x: b.x, z: b.z },
          });
        }
      }
    }
  }
  return segments;
}

function surfaceY(
  dimension: Dimension,
  x: number,
  z: number,
  aroundY: number
): number | undefined {
  for (
    let y = Math.min(320, aroundY + 16);
    y >= Math.max(-64, aroundY - 24);
    y -= 1
  ) {
    const block = dimension.getBlock({ x, y, z });
    if (!block) return undefined;
    if (AIR_OR_PLANTS.has(block.typeId)) continue;
    return y;
  }
  return undefined;
}

function stubMaterial(): string {
  const settlement = matrix.town.streetMaterialSetByEra.settlement ?? {};
  return (settlement.stub as string) ?? "minecraft:gravel";
}

export function connectStructureToNearestRoad(
  dimension: Dimension,
  entry: StructureEntry,
  anchor: StructureOffset,
  transform: PlacementTransform
): RoadConnectionResult {
  if (!entry.gateOffset) {
    return { connected: false, reason: "missing_gate", cellsPaved: 0 };
  }
  const gate = structureGateWorld(
    anchor,
    entry.anchorOffset ?? { x: 0, y: 0, z: 0 },
    entry.gateOffset,
    transform
  );
  const stub = roadStubToNearest(
    gate,
    baseTownRoadSegments(dimension.id),
    matrix.town.stubWidth,
    matrix.town.catalogRoadConnectMaxDistance
  );
  if (!stub) {
    return { connected: false, reason: "no_existing_road", cellsPaved: 0 };
  }

  const material = stubMaterial();
  let cellsPaved = 0;
  for (const cell of stub.cells) {
    const y = surfaceY(dimension, cell.x, cell.z, gate.y);
    if (y === undefined) continue;
    dimension.getBlock({ x: cell.x, y, z: cell.z })?.setType(material);
    cellsPaved += 1;
  }
  return {
    connected: cellsPaved > 0,
    distance: stub.distance,
    cellsPaved,
  };
}
