/**
 * Town Hall expansion — growth points, district modules, construction.
 */
import {
  world,
  type Dimension,
  type Player,
} from "@minecraft/server";
import { matrix } from "../content/matrix";
import {
  allDistrictModules,
  districtModuleById,
  type DistrictModule,
} from "../content/districtModules";
import {
  balance,
  sink,
  type LedgerState,
} from "../core/ledger";
import { currentTick, every } from "../core/scheduler";
import { insufficientFundsMessage } from "../ui/funds";
import { confirmTxn, menuHub } from "../ui/patterns";
import { speakAs } from "../ui/feedback";
import { formatAmount } from "../ui/theme";
import {
  activeGrowthPoints,
  computeExpansionPrice,
  expansionDurationTicks,
  expansionShortfall,
  moduleJoinRotation,
  moduleLocalToWorld,
  moduleGrowthPointsAfterJoin,
  recommendedModuleId,
  retireGrowthPoint,
  roadCellsDue,
  type ExpansionRecord,
  type GrowthPointRecord,
} from "./expansionMath";
import {
  findTownForPlayer,
  loadTownInstances,
  saveTownInstances,
  townTreasuryAccount,
  type TownInstance,
} from "./townInstances";
// ensureTownTreasury lives on townInstances for seed-time funding
import {
  loadParcels,
  registerParcel,
  saveParcels,
  parcelsForTown,
} from "./parcels";
import { rasterizePolyline } from "./streetMath";
import { evaluateTerrainSamples, terrainSamplePoints } from "./townTerrainMath";
import { hedgeBoundaryCells, meadowFlowerAt } from "./townSeedMath";
import { paintSurveyFloor } from "./surveyFloor";

const AIR = new Set([
  "minecraft:air",
  "minecraft:cave_air",
  "minecraft:void_air",
]);

function settlementMats() {
  const set = matrix.town.streetMaterialSetByEra.settlement ?? {};
  return {
    cores: (set.core as string[]) ?? ["minecraft:dirt_path", "minecraft:coarse_dirt"],
    edge: (set.edge as string) ?? "minecraft:cobblestone",
    stub: (set.stub as string) ?? "minecraft:gravel",
  };
}

function surfaceY(
  dimension: Dimension,
  x: number,
  z: number,
  aroundY: number
): number | undefined {
  for (let y = Math.min(320, aroundY + 24); y >= Math.max(-64, aroundY - 40); y -= 1) {
    const block = dimension.getBlock({ x, y, z });
    if (!block) return undefined;
    if (AIR.has(block.typeId)) continue;
    return y;
  }
  return undefined;
}

function setTop(
  dimension: Dimension,
  x: number,
  z: number,
  aroundY: number,
  typeId: string
): void {
  const y = surfaceY(dimension, x, z, aroundY);
  if (y === undefined) return;
  dimension.getBlock({ x, y, z })?.setType(typeId);
}

export function surveyModuleTerrain(
  dimension: Dimension,
  module: DistrictModule,
  growth: GrowthPointRecord,
  joinRotation: 0 | 1 | 2 | 3
): { ok: true } | { ok: false; message: string } {
  const samples: Array<number | undefined> = [];
  for (const p of terrainSamplePoints(module.area.x, module.area.z, 2)) {
    // Sample in module-local space relative to connection, then world.
    const local = {
      x: module.connection.at.x - module.area.x / 2 + p.x,
      z: module.connection.at.z - module.area.z / 2 + p.z,
    };
    const worldPos = moduleLocalToWorld(
      local,
      module,
      growth.worldAt,
      joinRotation
    );
    samples.push(surfaceY(dimension, worldPos.x, worldPos.z, growth.worldAt.y));
  }
  const result = evaluateTerrainSamples(samples, module.slopeToleranceY);
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true };
}

function orderedRoadCells(
  module: DistrictModule,
  growth: GrowthPointRecord,
  joinRotation: 0 | 1 | 2 | 3
): Array<{ x: number; z: number }> {
  const cells: Array<{ x: number; z: number }> = [];
  const seen = new Set<string>();
  for (const lane of module.streets.lanes) {
    const localCells = rasterizePolyline(lane.points, lane.width);
    for (const cell of localCells) {
      const worldPos = moduleLocalToWorld(
        cell,
        module,
        growth.worldAt,
        joinRotation
      );
      const key = `${worldPos.x},${worldPos.z}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({ x: worldPos.x, z: worldPos.z });
    }
  }
  return cells;
}

function paveRoadCells(
  dimension: Dimension,
  cells: Array<{ x: number; z: number }>,
  from: number,
  to: number,
  aroundY: number
): void {
  const mats = settlementMats();
  for (let i = from; i < to; i += 1) {
    const cell = cells[i];
    if (!cell) continue;
    const typeId =
      i % 7 === 0 ? mats.edge : mats.cores[i % mats.cores.length]!;
    setTop(dimension, cell.x, cell.z, aroundY, typeId);
  }
}

function registerModuleParcels(
  town: TownInstance,
  module: DistrictModule,
  expansion: ExpansionRecord,
  growth: GrowthPointRecord
): string[] {
  const parcels = loadParcels();
  const discount = town.wallsExist
    ? 1
    : matrix.town.expansion.outsideWallsDiscount;
  const ids: string[] = [];
  let index = 0;
  for (const slot of module.slots) {
    if (!slot.pad) continue;
    const c1 = moduleLocalToWorld(
      { x: slot.pad.x1, z: slot.pad.z1 },
      module,
      growth.worldAt,
      expansion.joinRotationSteps
    );
    const c2 = moduleLocalToWorld(
      { x: slot.pad.x2, z: slot.pad.z2 },
      module,
      growth.worldAt,
      expansion.joinRotationSteps
    );
    const bounds = {
      x1: Math.min(c1.x, c2.x),
      z1: Math.min(c1.z, c2.z),
      x2: Math.max(c1.x, c2.x),
      z2: Math.max(c1.z, c2.z),
    };
    const record = registerParcel(parcels, {
      townId: town.id,
      index: 1000 + town.expansions.length * 100 + index,
      idSuffix: `${expansion.id}:${index}`,
      bounds,
      frontageKind: "lane",
      plazaDistance: 80,
      waterfront: false,
      status: slot.role === "commons" ? "commons" : "available",
      outsideWallsFactor: discount,
    });
    ids.push(record.id);
    // Meadow + hedges for empty parcels
    const dimension = world.getDimension(town.dimensionId);
    const flora = matrix.town.floraByBiome.default!;
    if (slot.role === "parcel_empty" || slot.role === "commons" || slot.role === "house") {
      for (let x = bounds.x1; x <= bounds.x2; x += 1) {
        for (let z = bounds.z1; z <= bounds.z2; z += 1) {
          setTop(dimension, x, z, growth.worldAt.y, "minecraft:grass_block");
          if (
            slot.role !== "house" &&
            meadowFlowerAt(x, z, matrix.town.meadowFlowerDensity)
          ) {
            const y = surfaceY(dimension, x, z, growth.worldAt.y);
            const flower =
              flora.flowers[Math.abs(x * 13 + z) % flora.flowers.length]!;
            if (y !== undefined) {
              dimension.getBlock({ x, y: y + 1, z })?.setType(flower);
            }
          }
        }
      }
      for (const hedge of hedgeBoundaryCells(slot.pad)) {
        const w = moduleLocalToWorld(
          hedge,
          module,
          growth.worldAt,
          expansion.joinRotationSteps
        );
        const y = surfaceY(dimension, w.x, w.z, growth.worldAt.y);
        if (y !== undefined) {
          dimension
            .getBlock({ x: w.x, y: y + 1, z: w.z })
            ?.setType(flora.hedge);
        }
      }
    }
    index += 1;
  }
  saveParcels(parcels);
  town.parcelIds = [...new Set([...town.parcelIds, ...ids])];
  return ids;
}

export function beginTownExpansion(
  town: TownInstance,
  growthPointId: string,
  moduleId: string,
  ledger: LedgerState,
  nowTick: number
): { ok: true; expansion: ExpansionRecord } | { ok: false; message: string } {
  const growth = town.growthPoints.find((gp) => gp.id === growthPointId);
  if (!growth || growth.retired) {
    return { ok: false, message: "That growth point is no longer available." };
  }
  const module = districtModuleById(moduleId);
  if (!module) return { ok: false, message: `Unknown module ${moduleId}.` };

  const dimension = world.getDimension(town.dimensionId);
  const joinRotation = moduleJoinRotation(module, growth.dir);
  const survey = surveyModuleTerrain(dimension, module, growth, joinRotation);
  if (!survey.ok) return { ok: false, message: survey.message };

  const price = computeExpansionPrice({
    module,
    basePerBlock2: matrix.town.parcel.basePerBlock2,
    outsideWallsDiscount: town.wallsExist
      ? 1
      : matrix.town.expansion.outsideWallsDiscount,
  });
  const treasury = townTreasuryAccount(town.id);
  const available = balance(ledger, treasury);
  const shortfall = expansionShortfall(price.price, available);
  if (shortfall > 0) {
    return {
      ok: false,
      message: insufficientFundsMessage(
        "Town treasury",
        price.price,
        available
      ),
    };
  }
  sink(ledger, treasury, price.price, nowTick, "sink:construction");

  const roadCells = orderedRoadCells(module, growth, joinRotation);
  const duration = expansionDurationTicks(
    module.area.x * module.area.z,
    matrix.town.expansion.ticksPerModuleBlock,
    matrix.town.expansion.minDurationTicks,
    matrix.town.expansion.maxDurationTicks
  );
  const expansion: ExpansionRecord = {
    id: `exp:${nowTick}:${moduleId}`,
    moduleId,
    growthPointId,
    startedTick: nowTick,
    completeTick: nowTick + duration,
    cost: price.price,
    roadCellsTotal: roadCells.length,
    roadCellsPaved: 0,
    parcelsRegistered: false,
    jointWorld: { ...growth.worldAt },
    joinRotationSteps: joinRotation,
  };
  town.growthPoints = retireGrowthPoint(town.growthPoints, growthPointId);
  town.expansions.push(expansion);
  return { ok: true, expansion };
}

function tickExpansions(): void {
  const instances = loadTownInstances();
  const now = currentTick();
  let changed = false;
  for (const town of Object.values(instances.byId)) {
    for (const expansion of town.expansions) {
      if (expansion.parcelsRegistered) continue;
      const module = districtModuleById(expansion.moduleId);
      if (!module) continue;
      const liveGrowth = town.growthPoints.find(
        (gp) => gp.id === expansion.growthPointId
      );
      const growthRec: GrowthPointRecord = {
        id: expansion.growthPointId,
        localAt: liveGrowth?.localAt ?? { x: 0, z: 0 },
        worldAt: expansion.jointWorld,
        dir: liveGrowth?.dir ?? "east",
        label: liveGrowth?.label ?? "",
        source: liveGrowth?.source ?? "layout",
        retired: true,
      };
      const cells = orderedRoadCells(
        module,
        growthRec,
        expansion.joinRotationSteps
      );
      const due = roadCellsDue(
        cells.length,
        expansion.startedTick,
        expansion.completeTick,
        now
      );
      if (due > expansion.roadCellsPaved) {
        const dimension = world.getDimension(town.dimensionId);
        paveRoadCells(
          dimension,
          cells,
          expansion.roadCellsPaved,
          due,
          expansion.jointWorld.y
        );
        expansion.roadCellsPaved = due;
        changed = true;
      }
      if (now >= expansion.completeTick && !expansion.parcelsRegistered) {
        // Finish any remaining road
        const dimension = world.getDimension(town.dimensionId);
        if (expansion.roadCellsPaved < cells.length) {
          paveRoadCells(
            dimension,
            cells,
            expansion.roadCellsPaved,
            cells.length,
            expansion.jointWorld.y
          );
          expansion.roadCellsPaved = cells.length;
        }
        registerModuleParcels(town, module, expansion, growthRec);
        const fresh = moduleGrowthPointsAfterJoin(
          module,
          expansion.id,
          expansion.jointWorld,
          expansion.joinRotationSteps
        );
        town.growthPoints = [...town.growthPoints, ...fresh];
        expansion.parcelsRegistered = true;
        if (town.surveyFloor) {
          paintSurveyFloor(town.id, loadParcels(), {
            townId: town.id,
            origin: town.surveyFloor.origin,
            width: Math.max(
              town.surveyFloor.width,
              Math.ceil(Math.sqrt(parcelsForTown(loadParcels(), town.id).length)) *
                2
            ),
            depth: Math.max(
              town.surveyFloor.depth,
              Math.ceil(Math.sqrt(parcelsForTown(loadParcels(), town.id).length)) *
                2
            ),
            dimensionId: town.dimensionId,
          });
          town.surveyFloor.width = Math.max(town.surveyFloor.width, 16);
          town.surveyFloor.depth = Math.max(
            town.surveyFloor.depth,
            Math.ceil(parcelsForTown(loadParcels(), town.id).length / 4) + 4
          );
        }
        changed = true;
      }
    }
  }
  if (changed) saveTownInstances(instances);
}

export function startTownExpansionJob(): void {
  every(
    "town:expansion",
    matrix.town.expansion.sweepTicks,
    () => {
      tickExpansions();
    }
  );
}

export function houseParcelStats(townId: string): {
  houseParcelCount: number;
  vacantHouseParcelCount: number;
} {
  const parcels = parcelsForTown(loadParcels(), townId);
  // Approximate house lots as small/medium available or owned residential-sized
  const houses = parcels.filter(
    (p) =>
      p.sizeClass === "small" ||
      p.sizeClass === "medium" ||
      (p.name.toLowerCase().includes("lot") && p.sizeClass !== "estate")
  );
  const vacant = houses.filter((p) => p.status === "available");
  return {
    houseParcelCount: Math.max(houses.length, parcels.length),
    vacantHouseParcelCount: vacant.length,
  };
}

export async function openTownExpansionPanel(
  player: Player,
  ledger: LedgerState,
  townRef?: string
): Promise<void> {
  const instances = loadTownInstances();
  const town = findTownForPlayer(instances, townRef);
  if (!town) {
    speakAs(player, "Town Hall", "No seeded town found — run seedtown first.");
    return;
  }
  if (town.leaderPlayerId && town.leaderPlayerId !== player.id) {
    speakAs(player, "Town Hall", "Only the town's leader can expand the walls.");
    return;
  }

  const active = activeGrowthPoints(town.growthPoints);
  if (!active.length) {
    speakAs(player, "Town Hall", "No open growth points remain.");
    return;
  }

  await menuHub(player, {
    title: "Expand the town",
    facts: [
      `${town.layoutId}`,
      `Treasury ${formatAmount(balance(ledger, townTreasuryAccount(town.id)))}`,
      `Open growth points ${active.length}`,
    ],
    narrator: "Choose where the next district joins the street.",
    buttons: active.map((gp) => ({
      label: gp.label,
      onSelect: () => pickModuleForGrowth(player, ledger, town.id, gp.id),
    })),
  });
}

async function pickModuleForGrowth(
  player: Player,
  ledger: LedgerState,
  townId: string,
  growthPointId: string
): Promise<void> {
  const instances = loadTownInstances();
  const town = instances.byId[townId];
  if (!town) return;
  const growth = town.growthPoints.find((gp) => gp.id === growthPointId);
  if (!growth || growth.retired) return;

  const dimension = world.getDimension(town.dimensionId);
  const stats = houseParcelStats(town.id);
  const fitting: DistrictModule[] = [];
  for (const module of allDistrictModules()) {
    const join = moduleJoinRotation(module, growth.dir);
    const survey = surveyModuleTerrain(dimension, module, growth, join);
    if (survey.ok) fitting.push(module);
  }
  if (!fitting.length) {
    speakAs(
      player,
      "Town Hall",
      "No district module fits the terrain at that growth point."
    );
    return;
  }
  const starred = recommendedModuleId({
    ...stats,
    candidates: fitting.map((m) => m.id),
  });

  await menuHub(player, {
    title: growth.label,
    facts: [`${fitting.length} module${fitting.length === 1 ? "" : "s"} fit here`],
    narrator: "Starred option follows vacant-housing demand.",
    buttons: fitting.map((module) => {
      const price = computeExpansionPrice({
        module,
        basePerBlock2: matrix.town.parcel.basePerBlock2,
        outsideWallsDiscount: town.wallsExist
          ? 1
          : matrix.town.expansion.outsideWallsDiscount,
      });
      const star = module.id === starred ? "★ " : "";
      return {
        label: `${star}${module.name} — ${formatAmount(price.price)}`,
        onSelect: async () => {
          const treasury = townTreasuryAccount(town.id);
          const available = balance(ledger, treasury);
          const confirmed = await confirmTxn(player, {
            title: `Build ${module.name}`,
            facts: price.lines,
            lines: [
              { label: "Treasury debit", amount: price.price, sense: "loss" },
            ],
            balanceBefore: available,
            balanceAfter: available - price.price,
            narrator: "Road paves first, then new parcels register.",
            confirmLabel: "Expand",
          });
          if (!confirmed) return;
          const latest = loadTownInstances();
          const live = latest.byId[townId];
          if (!live) return;
          const result = beginTownExpansion(
            live,
            growthPointId,
            module.id,
            ledger,
            currentTick()
          );
          if (!result.ok) {
            speakAs(player, "Town Hall", result.message);
            return;
          }
          saveTownInstances(latest);
          speakAs(
            player,
            "Town Hall",
            `${module.name} is underway — the road will reach the spur first.`
          );
        },
      };
    }),
  });
}
