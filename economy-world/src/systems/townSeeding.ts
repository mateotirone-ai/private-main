/**
 * Town seeding modes: survey / skeleton / full (Phase 4).
 */
import {
  type Dimension,
  type Player,
  type Vector3,
} from "@minecraft/server";
import { matrix } from "../content/matrix";
import {
  defaultTownLayoutId,
  townLayoutById,
  type TownLayout,
} from "../content/townLayouts";
import { structureById } from "../content/structures";
import {
  clearTownParcels,
  loadParcels,
  registerParcel,
  saveParcels,
  type ParcelsState,
} from "./parcels";
import {
  findTownAtAnchor,
  loadTownInstances,
  saveTownInstances,
  upsertTownInstance,
  type TownInstance,
} from "./townInstances";
import {
  lanternPostsAlongPolyline,
  nearestPointOnSegments,
  rasterizePlazaEllipse,
  rasterizePolyline,
  segmentsFromPolylines,
  stubPathCells,
  type StreetCell,
} from "./streetMath";
import {
  evaluateTerrainSamples,
  medianHeight,
  retainingEdgeCells,
  terrainSamplePoints,
} from "./townTerrainMath";
import {
  clearingMaskCells,
  defaultLayoutTransform,
  hedgeBoundaryCells,
  localToWorld,
  meadowFlowerAt,
  resolveSlotStructureId,
  slotRotationSteps,
  slotShouldFillInMode,
  townInstanceId,
  parseSeedtownArgs,
  transformPad,
  type SeedMode,
} from "./townSeedMath";
import { placeStructureById } from "./structurePlacement";
import {
  saveBusinesses,
  type BusinessesState,
} from "./businesses";
import type { ExtractionState } from "./extraction";
import type { PlacementTransform } from "./structurePlacementMath";

export { parseSeedtownArgs };

const AIR = new Set([
  "minecraft:air",
  "minecraft:cave_air",
  "minecraft:void_air",
]);

const VEG = new Set([
  "minecraft:short_grass",
  "minecraft:tall_grass",
  "minecraft:fern",
  "minecraft:large_fern",
  "minecraft:dead_bush",
  "minecraft:sweet_berry_bush",
  "minecraft:oak_sapling",
  "minecraft:birch_sapling",
  "minecraft:spruce_sapling",
  "minecraft:poppy",
  "minecraft:dandelion",
  "minecraft:oxeye_daisy",
  "minecraft:cornflower",
  "minecraft:azure_bluet",
  "minecraft:lilac",
  "minecraft:rose_bush",
  "minecraft:peony",
  "minecraft:sunflower",
  "minecraft:oak_leaves",
  "minecraft:birch_leaves",
  "minecraft:spruce_leaves",
  "minecraft:vine",
]);

export interface SeedTownModeResult {
  townId: string;
  layoutId: string;
  mode: SeedMode;
  parcels: number;
  filledSlots: number;
  emptySlots: number;
  warnings: string[];
}

function floorVec(v: Vector3): { x: number; y: number; z: number } {
  return { x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) };
}

function settlementMaterials() {
  const set = matrix.town.streetMaterialSetByEra.settlement ?? {};
  return {
    cores: (set.core as string[]) ?? ["minecraft:dirt_path", "minecraft:coarse_dirt"],
    patch: (set.corePatch as string) ?? "minecraft:gravel",
    patchChance: (set.patchChance as number) ?? 0.12,
    edge: (set.edge as string) ?? "minecraft:cobblestone",
    plaza: (set.plaza as string) ?? "minecraft:stone",
    well: (set.well as string) ?? "minecraft:cobblestone",
    lanternPost: (set.lanternPost as string) ?? "minecraft:oak_fence",
    lantern: (set.lantern as string) ?? "minecraft:lantern",
    stub: (set.stub as string) ?? "minecraft:gravel",
  };
}

function floraFor(layout: TownLayout) {
  const table = matrix.town.floraByBiome;
  for (const biome of layout.biomes) {
    if (table[biome]) return table[biome]!;
  }
  return table.default ?? {
    tree: "minecraft:oak_sapling",
    hedge: "minecraft:oak_leaves",
    flowers: ["minecraft:poppy", "minecraft:dandelion"],
  };
}

function surfaceY(
  dimension: Dimension,
  x: number,
  z: number,
  aroundY: number
): number | undefined {
  const top = Math.min(320, aroundY + 32);
  const bottom = Math.max(-64, aroundY - 48);
  for (let y = top; y >= bottom; y -= 1) {
    const block = dimension.getBlock({ x, y, z });
    if (!block) return undefined;
    if (AIR.has(block.typeId)) continue;
    return y;
  }
  return undefined;
}

function setColumnTop(
  dimension: Dimension,
  x: number,
  z: number,
  aroundY: number,
  typeId: string
): void {
  const y = surfaceY(dimension, x, z, aroundY);
  if (y === undefined) return;
  dimension.getBlock({ x, y, z })?.setType(typeId);
  const above = dimension.getBlock({ x, y: y + 1, z });
  if (above && VEG.has(above.typeId)) above.setType("minecraft:air");
}

function clearVegetationAt(
  dimension: Dimension,
  x: number,
  z: number,
  aroundY: number
): void {
  const y = surfaceY(dimension, x, z, aroundY);
  if (y === undefined) return;
  for (let dy = 1; dy <= 8; dy += 1) {
    const block = dimension.getBlock({ x, y: y + dy, z });
    if (!block) break;
    if (VEG.has(block.typeId) || block.typeId.includes("log")) {
      block.setType("minecraft:air");
    }
  }
}

function pickCoreBlock(x: number, z: number, mats: ReturnType<typeof settlementMaterials>): string {
  const n = Math.abs((x * 31 + z * 17) | 0) % 1000;
  if (n < mats.patchChance * 1000) return mats.patch;
  return mats.cores[n % mats.cores.length]!;
}

function surveyTerrain(
  dimension: Dimension,
  layout: TownLayout,
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): { ok: true } | { ok: false; message: string } {
  const points = terrainSamplePoints(layout.area.x, layout.area.z, 2);
  const samples: Array<number | undefined> = [];
  for (const p of points) {
    const world = localToWorld(p, origin, transform);
    samples.push(surfaceY(dimension, world.x, world.z, origin.y));
  }
  const result = evaluateTerrainSamples(samples, layout.slopeToleranceY);
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true };
}

function clearPreviousFootprint(
  dimension: Dimension,
  layout: TownLayout,
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): void {
  const markers = new Set([
    matrix.town.surveyMarkers.parcel,
    matrix.town.surveyMarkers.slot,
    matrix.town.surveyMarkers.growth,
    ...Object.values(matrix.town.surveyFloor.palette),
  ]);
  for (const cell of clearingMaskCells(layout, matrix.town.clearingMargin)) {
    const world = localToWorld(cell, origin, transform);
    const y = surfaceY(dimension, world.x, world.z, origin.y);
    if (y === undefined) continue;
    const block = dimension.getBlock({ x: world.x, y, z: world.z });
    if (block && markers.has(block.typeId)) {
      block.setType("minecraft:grass_block");
    }
  }
}

function paveStreets(
  dimension: Dimension,
  layout: TownLayout,
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): StreetCell[] {
  const mats = settlementMaterials();
  const cells: StreetCell[] = [];
  cells.push(...rasterizePolyline(layout.streets.main.points, layout.streets.main.width));
  for (const lane of layout.streets.lanes) {
    cells.push(...rasterizePolyline(lane.points, lane.width));
  }
  cells.push(
    ...rasterizePlazaEllipse(layout.streets.plaza.center, layout.streets.plaza.radii)
  );
  const well = layout.streets.well;
  cells.push({ x: well.x, z: well.z, kind: "well", angleRad: 0 });
  for (const post of lanternPostsAlongPolyline(
    layout.streets.main.points,
    matrix.town.lanternInterval
  )) {
    cells.push({ x: post.x, z: post.z, kind: "lantern", angleRad: 0 });
  }

  for (const cell of cells) {
    const world = localToWorld(cell, origin, transform);
    let typeId = mats.cores[0]!;
    if (cell.kind === "edge") typeId = mats.edge;
    else if (cell.kind === "plaza") typeId = mats.plaza;
    else if (cell.kind === "well") typeId = mats.well;
    else if (cell.kind === "stub") typeId = mats.stub;
    else if (cell.kind === "core") typeId = pickCoreBlock(cell.x, cell.z, mats);
    else if (cell.kind === "lantern") {
      setColumnTop(dimension, world.x, world.z, origin.y, mats.lanternPost);
      const y = surfaceY(dimension, world.x, world.z, origin.y);
      if (y !== undefined) {
        dimension.getBlock({ x: world.x, y: y + 1, z: world.z })?.setType(mats.lantern);
      }
      continue;
    }
    setColumnTop(dimension, world.x, world.z, origin.y, typeId);
  }
  return cells;
}

function gradePad(
  dimension: Dimension,
  pad: { x1: number; z1: number; x2: number; z2: number },
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): number {
  const heights: number[] = [];
  for (let x = pad.x1; x <= pad.x2; x += 1) {
    for (let z = pad.z1; z <= pad.z2; z += 1) {
      const world = localToWorld({ x, z }, origin, transform);
      const y = surfaceY(dimension, world.x, world.z, origin.y);
      if (y !== undefined) heights.push(y);
    }
  }
  const median = medianHeight(heights);
  for (let x = pad.x1; x <= pad.x2; x += 1) {
    for (let z = pad.z1; z <= pad.z2; z += 1) {
      const world = localToWorld({ x, z }, origin, transform);
      const y = surfaceY(dimension, world.x, world.z, origin.y);
      if (y === undefined) continue;
      if (y > median) {
        for (let yy = median + 1; yy <= y; yy += 1) {
          dimension.getBlock({ x: world.x, y: yy, z: world.z })?.setType("minecraft:air");
        }
      } else if (y < median) {
        for (let yy = y + 1; yy <= median; yy += 1) {
          dimension
            .getBlock({ x: world.x, y: yy, z: world.z })
            ?.setType("minecraft:dirt");
        }
      }
      dimension
        .getBlock({ x: world.x, y: median, z: world.z })
        ?.setType("minecraft:grass_block");
    }
  }
  const edges = retainingEdgeCells(pad, median, (lx, lz) => {
    const world = localToWorld({ x: lx, z: lz }, origin, transform);
    return surfaceY(dimension, world.x, world.z, origin.y);
  });
  for (const edge of edges) {
    const world = localToWorld(edge, origin, transform);
    dimension
      .getBlock({ x: world.x, y: median, z: world.z })
      ?.setType(matrix.town.retainingWallBlock);
  }
  return median;
}

function applyGreening(
  dimension: Dimension,
  layout: TownLayout,
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): void {
  const flora = floraFor(layout);
  for (const cell of clearingMaskCells(layout, matrix.town.clearingMargin)) {
    const world = localToWorld(cell, origin, transform);
    clearVegetationAt(dimension, world.x, world.z, origin.y);
  }
  for (const slot of layout.slots) {
    if (!slot.pad) continue;
    if (slot.role !== "parcel_empty" && slot.role !== "commons") continue;
    for (let x = slot.pad.x1; x <= slot.pad.x2; x += 1) {
      for (let z = slot.pad.z1; z <= slot.pad.z2; z += 1) {
        const world = localToWorld({ x, z }, origin, transform);
        setColumnTop(dimension, world.x, world.z, origin.y, "minecraft:grass_block");
        if (meadowFlowerAt(x, z, matrix.town.meadowFlowerDensity)) {
          const y = surfaceY(dimension, world.x, world.z, origin.y);
          const flower =
            flora.flowers[Math.abs(x * 13 + z) % flora.flowers.length]!;
          if (y !== undefined) {
            dimension.getBlock({ x: world.x, y: y + 1, z: world.z })?.setType(flower);
          }
        }
      }
    }
    for (const hedge of hedgeBoundaryCells(slot.pad)) {
      const world = localToWorld(hedge, origin, transform);
      const y = surfaceY(dimension, world.x, world.z, origin.y);
      if (y !== undefined) {
        dimension.getBlock({ x: world.x, y: y + 1, z: world.z })?.setType(flora.hedge);
      }
    }
  }
  for (const post of lanternPostsAlongPolyline(
    layout.streets.main.points,
    matrix.town.streetTreeInterval
  )) {
    const world = localToWorld(post, origin, transform);
    const y = surfaceY(dimension, world.x, world.z, origin.y);
    if (y !== undefined) {
      dimension.getBlock({ x: world.x, y: y + 1, z: world.z })?.setType(flora.tree);
    }
  }
}

function registerLayoutParcels(
  parcels: ParcelsState,
  townId: string,
  layout: TownLayout,
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform,
  dimension: Dimension
): string[] {
  clearTownParcels(parcels, townId);
  const mainSegs = segmentsFromPolylines([layout.streets.main]);
  const laneSegs = segmentsFromPolylines(layout.streets.lanes);
  const plaza = layout.streets.plaza.center;
  const ids: string[] = [];
  let index = 0;
  for (const slot of layout.slots) {
    if (!slot.pad) continue;
    const worldPad = transformPad(slot.pad, origin, transform);
    const center = {
      x: (slot.pad.x1 + slot.pad.x2) / 2,
      z: (slot.pad.z1 + slot.pad.z2) / 2,
    };
    const mainHit = nearestPointOnSegments(center, mainSegs);
    const laneHit = nearestPointOnSegments(center, laneSegs);
    const frontageKind =
      mainHit && (!laneHit || mainHit.distance <= laneHit.distance + 0.5)
        ? "main"
        : "lane";
    const plazaDistance = Math.sqrt(
      (center.x - plaza.x) ** 2 + (center.z - plaza.z) ** 2
    );
    let waterfront = false;
    for (let x = worldPad.x1; x <= worldPad.x2 && !waterfront; x += 1) {
      for (let z = worldPad.z1; z <= worldPad.z2; z += 1) {
        const y = surfaceY(dimension, x, z, origin.y);
        if (y === undefined) continue;
        const below = dimension.getBlock({ x, y, z });
        if (below?.typeId.includes("water")) {
          waterfront = true;
          break;
        }
      }
    }
    const record = registerParcel(parcels, {
      townId,
      index,
      bounds: worldPad,
      frontageKind,
      plazaDistance,
      waterfront,
      status: slot.role === "commons" ? "commons" : "available",
    });
    ids.push(record.id);
    index += 1;
  }
  return ids;
}

function drawStubs(
  dimension: Dimension,
  layout: TownLayout,
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): number {
  const mats = settlementMaterials();
  const segs = segmentsFromPolylines([
    layout.streets.main,
    ...layout.streets.lanes,
  ]);
  let count = 0;
  for (const slot of layout.slots) {
    if (!slot.at || !slot.pad) continue;
    const entry = resolveSlotStructureId(slot);
    const structure = entry ? structureById(entry) : undefined;
    const gateLocal = structure?.gateOffset
      ? {
          x: slot.at.x + structure.gateOffset.x,
          z: slot.at.z + structure.gateOffset.z,
        }
      : {
          x: slot.at.x + Math.floor((slot.pad.x2 - slot.pad.x1) / 2),
          z: slot.rot === 180 ? slot.pad.z2 : slot.pad.z1,
        };
    const stub = stubPathCells(gateLocal, segs, matrix.town.stubWidth);
    for (const cell of stub) {
      const world = localToWorld(cell, origin, transform);
      setColumnTop(dimension, world.x, world.z, origin.y, mats.stub);
    }
    if (stub.length) count += 1;
  }
  return count;
}

function paintSurveyMarkers(
  dimension: Dimension,
  layout: TownLayout,
  origin: { x: number; y: number; z: number },
  transform: PlacementTransform
): void {
  const markers = matrix.town.surveyMarkers;
  for (const slot of layout.slots) {
    if (!slot.pad) continue;
    const color =
      slot.role === "parcel_empty" || slot.role === "commons"
        ? markers.parcel
        : markers.slot;
    for (let x = slot.pad.x1; x <= slot.pad.x2; x += 1) {
      for (let z = slot.pad.z1; z <= slot.pad.z2; z += 1) {
        const world = localToWorld({ x, z }, origin, transform);
        setColumnTop(dimension, world.x, world.z, origin.y, color);
      }
    }
  }
  for (const gp of layout.growthPoints) {
    const world = localToWorld(gp.at, origin, transform);
    setColumnTop(dimension, world.x, world.z, origin.y, markers.growth);
  }
}

export function seedTownMode(
  player: Player,
  mode: SeedMode,
  layoutId: string | undefined,
  businesses: BusinessesState,
  _extraction: ExtractionState
): SeedTownModeResult {
  const layout = townLayoutById(layoutId ?? defaultTownLayoutId());
  if (!layout) throw new Error(`unknown layout ${layoutId}`);
  const dimension = player.dimension;
  const anchor = floorVec(player.location);
  const transform = defaultLayoutTransform("none");
  const origin = { ...anchor };
  const townId = townInstanceId(layout.id, dimension.id, anchor);

  const survey = surveyTerrain(dimension, layout, origin, transform);
  if (!survey.ok) throw new Error(survey.message);

  const instances = loadTownInstances();
  const previous = findTownAtAnchor(instances, townId);
  if (previous) {
    clearPreviousFootprint(dimension, layout, origin, transform);
  }

  paveStreets(dimension, layout, origin, transform);

  const warnings: string[] = [];
  let filledSlots = 0;
  let emptySlots = 0;
  const filled: TownInstance["filledSlots"] = [];

  if (mode === "survey") {
    paintSurveyMarkers(dimension, layout, origin, transform);
  } else {
    applyGreening(dimension, layout, origin, transform);
    for (let i = 0; i < layout.slots.length; i += 1) {
      const slot = layout.slots[i]!;
      if (!slot.pad) continue;
      gradePad(dimension, slot.pad, origin, transform);
      const fill = slotShouldFillInMode(mode, slot);
      if (fill === "structure") {
        const structureId = resolveSlotStructureId(slot);
        if (!structureId) {
          emptySlots += 1;
          filled.push({ index: i, structureId: null });
          const key = `slot:${layout.id}:${i}`;
          warnings.push(`slot ${i} (${slot.role}) missing structure; left empty`);
          console.warn(`[ew] ${key} missing structure; left empty`);
          continue;
        }
        if (!slot.at) {
          emptySlots += 1;
          filled.push({ index: i, structureId: null });
          continue;
        }
        const placeAt = localToWorld(slot.at, origin, transform);
        const slotRot = ((transform.rotationSteps +
          slotRotationSteps(slot.rot)) %
          4) as 0 | 1 | 2 | 3;
        try {
          placeStructureById(
            dimension,
            structureId,
            { x: placeAt.x, y: placeAt.y, z: placeAt.z },
            slotRot,
            transform.mirror
          );
          const entry = structureById(structureId);
          if (entry?.trade) {
            const bizId = `cpu_${entry.trade}`;
            const business = businesses.byId[bizId];
            if (business) {
              business.site = {
                dimensionId: dimension.id,
                anchor: {
                  x: placeAt.x,
                  y: placeAt.y,
                  z: placeAt.z,
                },
                rotationSteps: slotRot,
                mirror: transform.mirror,
              };
            }
          }
          filledSlots += 1;
          filled.push({ index: i, structureId });
        } catch (error) {
          emptySlots += 1;
          filled.push({ index: i, structureId: null });
          warnings.push(`slot ${i} place failed: ${error}`);
        }
      } else if (fill === "empty") {
        emptySlots += 1;
        filled.push({ index: i, structureId: null });
        if (mode === "full" || (mode === "skeleton" && slot.role === "civic")) {
          const key = `slot:${layout.id}:${i}:${slot.hint ?? slot.role}`;
          warnings.push(`slot ${i} (${slot.hint ?? slot.role}) empty — no capture`);
          console.warn(`[ew] ${key} empty — no capture`);
        }
      }
    }
    drawStubs(dimension, layout, origin, transform);
  }

  const parcels = loadParcels();
  const parcelIds =
    mode === "survey"
      ? []
      : registerLayoutParcels(
          parcels,
          townId,
          layout,
          origin,
          transform,
          dimension
        );
  if (mode !== "survey") saveParcels(parcels);
  saveBusinesses(businesses);

  upsertTownInstance(instances, {
    id: townId,
    layoutId: layout.id,
    dimensionId: dimension.id,
    anchor,
    rotationSteps: transform.rotationSteps,
    mirror: transform.mirror,
    mode,
    parcelIds,
    filledSlots: filled,
  });
  saveTownInstances(instances);

  return {
    townId,
    layoutId: layout.id,
    mode,
    parcels: parcelIds.length,
    filledSlots,
    emptySlots,
    warnings: [...new Set(warnings)],
  };
}
