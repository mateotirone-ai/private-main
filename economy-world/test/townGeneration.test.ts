import { describe, expect, it } from "vitest";
import { audit, emptyLedger, mint, sink } from "../src/core/ledger";
import { matrix } from "../src/content/matrix";
import {
  allTownLayouts,
  defaultTownLayoutId,
  townLayoutById,
} from "../src/content/townLayouts";
import {
  buyParcel,
  emptyParcels,
  mergeOwnedParcels,
  registerParcel,
} from "../src/systems/parcelRegistry";
import {
  computeParcelPrice,
  parcelsAdjacent,
} from "../src/systems/parcelMath";
import {
  nearestPointOnSegments,
  rasterizePolyline,
  segmentsFromPolylines,
  stubPathCells,
  streetGradeKind,
} from "../src/systems/streetMath";
import {
  evaluateTerrainSamples,
  terrainSamplePoints,
} from "../src/systems/townTerrainMath";
import {
  parseSeedtownArgs,
  resolveSlotStructureId,
  slotShouldFillInMode,
  surveyFloorMapping,
  townInstanceId,
} from "../src/systems/townSeedMath";

describe("town layouts (Heartlands Crossroads golden fixture)", () => {
  it("loads Layout 01 with streets, slots, growth points, and slope tolerance", () => {
    expect(defaultTownLayoutId()).toBe("heartlands_crossroads");
    const layout = townLayoutById("heartlands_crossroads");
    expect(layout).toBeDefined();
    expect(layout!.area).toEqual({ x: 150, z: 112 });
    expect(layout!.slopeToleranceY).toBe(6);
    expect(layout!.streets.main.points.length).toBeGreaterThanOrEqual(3);
    expect(layout!.streets.lanes.length).toBe(2);
    expect(layout!.growthPoints.length).toBe(4);
    expect(layout!.slots.some((s) => s.role === "work_site")).toBe(true);
    expect(layout!.slots.some((s) => s.role === "parcel_empty")).toBe(true);
    expect(allTownLayouts().length).toBeGreaterThanOrEqual(1);
  });
});

describe("seeding modes (pure)", () => {
  it("parses survey|skeleton|full with optional layoutId", () => {
    expect(parseSeedtownArgs("survey")).toEqual({
      mode: "survey",
      layoutId: "heartlands_crossroads",
    });
    expect(parseSeedtownArgs("skeleton heartlands_crossroads")).toEqual({
      mode: "skeleton",
      layoutId: "heartlands_crossroads",
    });
    expect(parseSeedtownArgs("full")).toEqual({
      mode: "full",
      layoutId: "heartlands_crossroads",
    });
  });

  it("is idempotent at one anchor key across modes", () => {
    const anchor = { x: 10, y: 64, z: -20 };
    const a = townInstanceId(
      "heartlands_crossroads",
      "minecraft:overworld",
      anchor
    );
    const b = townInstanceId(
      "heartlands_crossroads",
      "minecraft:overworld",
      anchor
    );
    expect(a).toBe(b);
    expect(a).toContain("10,64,-20");
  });

  it("keeps slots empty when captures are missing", () => {
    const townHall = {
      role: "civic" as const,
      hint: "town_hall (required)",
      pad: { x1: 0, z1: 0, x2: 5, z2: 5 },
      at: { x: 0, z: 0 },
      rot: 180 as const,
    };
    expect(resolveSlotStructureId(townHall)).toBeUndefined();
    expect(slotShouldFillInMode("skeleton", townHall)).toBe("empty");
    expect(slotShouldFillInMode("full", townHall)).toBe("empty");

    const quarry = {
      role: "work_site" as const,
      hint: "large-pad trade (west anchor)",
      pad: { x1: 0, z1: 0, x2: 10, z2: 10 },
      at: { x: 0, z: 0 },
      rot: 180 as const,
    };
    expect(resolveSlotStructureId(quarry)).toBe("ew:stone_quarry_L1");
    expect(slotShouldFillInMode("full", quarry)).toBe("structure");
    expect(slotShouldFillInMode("skeleton", quarry)).toBe("empty");
  });
});

describe("streets + stubs", () => {
  it("rasterizes crooked polylines without axis snapping", () => {
    const cells = rasterizePolyline(
      [
        { x: 0, z: 0 },
        { x: 10, z: 3 },
        { x: 20, z: 1 },
      ],
      4
    );
    expect(cells.length).toBeGreaterThan(20);
    expect(cells.some((c) => c.kind === "edge")).toBe(true);
  });

  it("connects a stub from every placed slot gate to the nearest street", () => {
    const layout = townLayoutById("heartlands_crossroads")!;
    const segs = segmentsFromPolylines([
      layout.streets.main,
      ...layout.streets.lanes,
    ]);
    const placeable = layout.slots.filter((s) => s.at && s.pad);
    expect(placeable.length).toBeGreaterThan(5);
    for (const slot of placeable) {
      const gate = {
        x: slot.at!.x + Math.floor((slot.pad!.x2 - slot.pad!.x1) / 2),
        z: slot.rot === 180 ? slot.pad!.z2 : slot.pad!.z1,
      };
      const stub = stubPathCells(gate, segs, 2);
      expect(stub.length).toBeGreaterThan(0);
      const nearest = nearestPointOnSegments(gate, segs)!;
      expect(nearest.distance).toBeLessThan(40);
    }
  });

  it("classifies street grade steps under max grade", () => {
    expect(streetGradeKind(0.25, 3)).toBe("block");
    expect(streetGradeKind(0.75, 3)).toBe("slab");
    expect(streetGradeKind(1.5, 3)).toBe("stair");
    expect(streetGradeKind(4, 3)).toBe("refuse");
  });
});

describe("terrain survey", () => {
  it("refuses unloaded samples and excessive slope variance", () => {
    expect(evaluateTerrainSamples([64, undefined, 65], 6).ok).toBe(false);
    expect(evaluateTerrainSamples([64, 70, 66], 5)).toMatchObject({
      ok: false,
      reason: "slope",
    });
    expect(evaluateTerrainSamples([64, 66, 65], 6)).toMatchObject({
      ok: true,
      variance: 2,
    });
  });

  it("grid-samples every 2 blocks across the layout area", () => {
    const layout = townLayoutById("heartlands_crossroads")!;
    const points = terrainSamplePoints(layout.area.x, layout.area.z, 2);
    expect(points[0]).toEqual({ x: 0, z: 0 });
    expect(points.some((p) => p.x === 2 && p.z === 2)).toBe(true);
    expect(points.length).toBe(
      Math.ceil(layout.area.x / 2) * Math.ceil(layout.area.z / 2)
    );
  });
});

describe("parcels + pricing + survey floor", () => {
  it("matches the pricing formula per factor", () => {
    const cfg = matrix.town.parcel;
    const breakdown = computeParcelPrice({
      bounds: { x1: 0, z1: 0, x2: 9, z2: 9 },
      frontageKind: "main",
      plazaDistance: 10,
      waterfront: true,
      basePerBlock2: cfg.basePerBlock2,
      mainFrontageFactor: cfg.mainFrontageFactor,
      laneFrontageFactor: cfg.laneFrontageFactor,
      plazaNear: cfg.plazaNear,
      plazaFar: cfg.plazaFar,
      plazaNearFactor: cfg.plazaNearFactor,
      plazaFarFactor: cfg.plazaFarFactor,
      waterfrontBonus: cfg.waterfrontBonus,
    });
    expect(breakdown.price).toBe(1950);
    expect(breakdown.lines.length).toBe(5);
    expect(breakdown.factors.frontageFactor).toBe(1.5);
    expect(breakdown.factors.plazaDistanceFactor).toBe(1.3);
    expect(breakdown.factors.waterfrontBonus).toBe(2.0);
  });

  it("registers parcels, buys with deed+ledger clean, and merges adjacent owned lots", () => {
    const state = emptyParcels();
    const townId = "heartlands_crossroads@test:0,64,0";
    const a = registerParcel(state, {
      townId,
      index: 0,
      bounds: { x1: 0, z1: 0, x2: 4, z2: 4 },
      frontageKind: "main",
      plazaDistance: 25,
      waterfront: false,
    });
    const b = registerParcel(state, {
      townId,
      index: 1,
      bounds: { x1: 5, z1: 0, x2: 9, z2: 4 },
      frontageKind: "lane",
      plazaDistance: 30,
      waterfront: false,
    });
    expect(parcelsAdjacent(a.bounds, b.bounds)).toBe(true);

    const ledger = emptyLedger();
    mint(ledger, "p:buyer", a.price + b.price, 1, "mint:system");
    sink(ledger, "p:buyer", a.price, 2, "sink:buyout");
    buyParcel(state, a.id, "buyer", "Buyer");
    expect(state.byId[a.id]!.status).toBe("owned");
    expect(state.byId[a.id]!.owner).toBe("buyer");

    sink(ledger, "p:buyer", b.price, 3, "sink:buyout");
    buyParcel(state, b.id, "buyer", "Buyer");
    const merged = mergeOwnedParcels(state, a.id, b.id, "buyer");
    expect(merged).toBeDefined();
    expect(merged!.bounds).toEqual({ x1: 0, z1: 0, x2: 9, z2: 4 });
    expect(state.byId[b.id]).toBeUndefined();
    expect(audit(ledger)).toMatchObject({ ok: true, drift: 0 });
  });

  it("maps survey-floor tiles to parcels at fitting scale", () => {
    const tiles = surveyFloorMapping(6, 12, 8);
    expect(tiles.length).toBeGreaterThan(0);
    const indices = new Set(tiles.map((t) => t.parcelIndex));
    expect(indices.size).toBe(6);
  });
});

describe("seed → parcel buy → business audit path", () => {
  it("keeps drift=0 through mint → parcel sink → business wage sink", () => {
    const ledger = emptyLedger();
    mint(ledger, "p:founder", 10000, 1, "mint:system");
    sink(ledger, "p:founder", 1950, 2, "sink:buyout");
    mint(ledger, "b:cpu_stone_quarry", 20, 3, "mint:system");
    sink(ledger, "b:cpu_stone_quarry", 10, 4, "sink:system");
    expect(audit(ledger)).toMatchObject({ ok: true, drift: 0 });
  });
});
