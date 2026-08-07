import { describe, expect, it } from "vitest";
import { audit, emptyLedger, mint, sink, balance } from "../src/core/ledger";
import { matrix } from "../src/content/matrix";
import {
  allDistrictModules,
  districtModuleById,
} from "../src/content/districtModules";
import { townLayoutById } from "../src/content/townLayouts";
import {
  activeGrowthPoints,
  computeExpansionPrice,
  expansionShortfall,
  growthPointsFromLayoutOrPreserved,
  moduleJoinRotation,
  moduleLocalToWorld,
  moduleGrowthPointsAfterJoin,
  preserveExpansionsOnReseed,
  recommendedModuleId,
  registerLayoutGrowthPoints,
  retireGrowthPoint,
  roadCellsDue,
  rotationAligningDirs,
  throughRoadCells,
} from "../src/systems/expansionMath";
import {
  computeParcelPrice,
} from "../src/systems/parcelMath";
import {
  buyParcel,
  emptyParcels,
  registerParcel,
} from "../src/systems/parcelRegistry";
import { surveyFloorMapping } from "../src/systems/townSeedMath";
import { evaluateTerrainSamples } from "../src/systems/townTerrainMath";
import { townTreasuryAccount } from "../src/systems/expansionMath";

describe("district modules", () => {
  it("ships residential_close and industrial_yard with connection joints", () => {
    expect(allDistrictModules().map((m) => m.id).sort()).toEqual([
      "industrial_yard",
      "residential_close",
    ]);
    const close = districtModuleById("residential_close")!;
    expect(close.streets.lanes[0]!.width).toBe(3);
    expect(close.slots.filter((s) => s.role === "house").length).toBeGreaterThanOrEqual(6);
    expect(close.growthPoints.length).toBeGreaterThanOrEqual(1);
    const yard = districtModuleById("industrial_yard")!;
    const work = yard.slots.find((s) => s.role === "work_site")!;
    expect(work.pad!.x2 - work.pad!.x1 + 1).toBe(34);
    expect(work.pad!.z2 - work.pad!.z1 + 1).toBe(28);
  });
});

describe("growth points", () => {
  it("registers Layout 01 growth points transformed by rotation", () => {
    const layout = townLayoutById("heartlands_crossroads")!;
    const origin = { x: 100, y: 64, z: 200 };
    const none = registerLayoutGrowthPoints(layout, origin, {
      rotationSteps: 0,
      mirror: "none",
    });
    expect(none).toHaveLength(4);
    expect(none[0]!.dir).toBe("west");
    expect(none[0]!.worldAt).toEqual({
      x: 100 + layout.growthPoints[0]!.at.x,
      y: 64,
      z: 200 + layout.growthPoints[0]!.at.z,
    });

    const rot90 = registerLayoutGrowthPoints(layout, origin, {
      rotationSteps: 1,
      mirror: "none",
    });
    expect(rot90[0]!.dir).toBe("north"); // west + 90° CW
  });

  it("retires a consumed point and registers module dead-ends as new growth", () => {
    const module = districtModuleById("residential_close")!;
    const growthWorld = { x: 50, y: 70, z: 50 };
    const join = moduleJoinRotation(module, "east");
    expect(rotationAligningDirs("west", "east")).toBe(2);
    const fresh = moduleGrowthPointsAfterJoin(
      module,
      "exp:1",
      growthWorld,
      join
    );
    expect(fresh.length).toBeGreaterThanOrEqual(1);
    expect(fresh.every((gp) => gp.source === "module")).toBe(true);

    const layoutGps = registerLayoutGrowthPoints(
      townLayoutById("heartlands_crossroads")!,
      { x: 0, y: 64, z: 0 },
      { rotationSteps: 0, mirror: "none" }
    );
    const retired = retireGrowthPoint(layoutGps, layoutGps[0]!.id);
    expect(activeGrowthPoints(retired)).toHaveLength(3);
    const next = [...retired, ...fresh];
    expect(activeGrowthPoints(next).some((gp) => gp.id.startsWith("gp:exp:"))).toBe(
      true
    );
  });

  it("preserves expansions across reseed without duplicating", () => {
    const previous = [
      {
        id: "exp:1",
        moduleId: "residential_close",
        growthPointId: "gp:layout:0",
        startedTick: 1,
        completeTick: 100,
        cost: 1000,
        roadCellsTotal: 10,
        roadCellsPaved: 10,
        parcelsRegistered: true,
        jointWorld: { x: 1, y: 64, z: 1 },
        joinRotationSteps: 0 as const,
      },
    ];
    const kept = preserveExpansionsOnReseed(previous);
    expect(kept).toHaveLength(1);
    expect(kept[0]).toEqual(previous[0]);
    expect(preserveExpansionsOnReseed(kept)).toHaveLength(1);

    const layoutGps = registerLayoutGrowthPoints(
      townLayoutById("heartlands_crossroads")!,
      { x: 0, y: 64, z: 0 },
      { rotationSteps: 0, mirror: "none" }
    );
    const withRetired = retireGrowthPoint(layoutGps, "gp:layout:0");
    const merged = growthPointsFromLayoutOrPreserved(
      layoutGps,
      withRetired,
      kept
    );
    expect(merged.find((gp) => gp.id === "gp:layout:0")?.retired).toBe(true);
  });
});

describe("module join + through-road", () => {
  it("joins at the growth point local street angle with connection as through-road", () => {
    const module = districtModuleById("industrial_yard")!;
    const join = moduleJoinRotation(module, "south");
    const joint = { x: 10, y: 64, z: 20 };
    const first = moduleLocalToWorld(
      module.connection.at,
      module,
      joint,
      join
    );
    expect(first).toEqual(joint);
    const road = throughRoadCells(module, joint, join);
    expect(road[0]).toEqual({ x: joint.x, z: joint.z });
    expect(road.length).toBeGreaterThan(2);
  });
});

describe("expansion treasury + terrain + pricing", () => {
  it("prices expansion with outside-walls discount ingredients", () => {
    const module = districtModuleById("residential_close")!;
    const breakdown = computeExpansionPrice({
      module,
      basePerBlock2: matrix.town.parcel.basePerBlock2,
      outsideWallsDiscount: matrix.town.expansion.outsideWallsDiscount,
    });
    const area = module.area.x * module.area.z;
    expect(breakdown.price).toBe(
      Math.round(area * 5 * matrix.town.expansion.outsideWallsDiscount)
    );
    expect(breakdown.lines.some((l) => l.includes("Outside-walls"))).toBe(true);
  });

  it("names treasury shortfall and keeps audit drift 0 through expand+buy", () => {
    expect(expansionShortfall(1000, 250)).toBe(750);
    const ledger = emptyLedger();
    const townId = "heartlands_crossroads@test:0,64,0";
    const treasury = townTreasuryAccount(townId);
    mint(ledger, treasury, 50000, 1, "mint:system");
    const module = districtModuleById("industrial_yard")!;
    const cost = computeExpansionPrice({
      module,
      basePerBlock2: 5,
      outsideWallsDiscount: 0.7,
    }).price;
    sink(ledger, treasury, cost, 2, "sink:construction");
    expect(balance(ledger, treasury)).toBe(50000 - cost);

    const parcels = emptyParcels();
    const parcel = registerParcel(parcels, {
      townId,
      index: 0,
      idSuffix: "exp:1:0",
      bounds: { x1: 0, z1: 0, x2: 9, z2: 9 },
      frontageKind: "lane",
      plazaDistance: 80,
      waterfront: false,
      outsideWallsFactor: 0.7,
    });
    expect(parcel.priceLines.some((l) => l.includes("Outside walls"))).toBe(true);
    mint(ledger, "p:buyer", parcel.price, 3, "mint:system");
    sink(ledger, "p:buyer", parcel.price, 4, "sink:buyout");
    buyParcel(parcels, parcel.id, "buyer", "Buyer");
    expect(parcels.byId[parcel.id]!.status).toBe("owned");
    expect(audit(ledger)).toMatchObject({ ok: true, drift: 0 });
  });

  it("refuses module terrain when slope variance exceeds tolerance", () => {
    const module = districtModuleById("residential_close")!;
    expect(
      evaluateTerrainSamples([64, 72, 66], module.slopeToleranceY)
    ).toMatchObject({ ok: false, reason: "slope" });
  });

  it("stars residential_close when vacant house share is under 25%", () => {
    expect(
      recommendedModuleId({
        houseParcelCount: 20,
        vacantHouseParcelCount: 4,
        candidates: ["residential_close", "industrial_yard"],
      })
    ).toBe("residential_close");
    expect(
      recommendedModuleId({
        houseParcelCount: 20,
        vacantHouseParcelCount: 10,
        candidates: ["residential_close", "industrial_yard"],
      })
    ).toBe("industrial_yard");
  });

  it("schedules road paving progress before parcel registration tick", () => {
    expect(roadCellsDue(100, 0, 100, 50)).toBe(50);
    expect(roadCellsDue(100, 0, 100, 100)).toBe(100);
  });

  it("prices expanded parcels with outside-walls factor and Survey Floor maps them", () => {
    const priced = computeParcelPrice({
      bounds: { x1: 0, z1: 0, x2: 4, z2: 4 },
      frontageKind: "lane",
      plazaDistance: 80,
      waterfront: false,
      basePerBlock2: 5,
      mainFrontageFactor: 1.5,
      laneFrontageFactor: 1.0,
      plazaNear: 20,
      plazaFar: 60,
      plazaNearFactor: 1.3,
      plazaFarFactor: 1.0,
      waterfrontBonus: 2.0,
      outsideWallsFactor: 0.7,
    });
    expect(priced.factors.outsideWallsFactor).toBe(0.7);
    const tiles = surveyFloorMapping(12, 16, 12);
    expect(new Set(tiles.map((t) => t.parcelIndex)).size).toBe(12);
  });
});
