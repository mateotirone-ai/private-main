import { describe, expect, it } from "vitest";
import {
  allStructures,
  structureForTradeLevel,
  successorOffsetForTrade,
} from "../src/content/structures";

describe("structure registry", () => {
  it("declares quarry structures with ids, pads, and anchors", () => {
    expect(allStructures().length).toBeGreaterThan(0);
    expect(structureForTradeLevel("stone_quarry", 1)?.id).toBe("ew:stone_quarry_L1");
    expect(structureForTradeLevel("stone_quarry", 2)?.id).toBe("ew:stone_quarry_L2");
    expect(structureForTradeLevel("stone_quarry", 3)?.id).toBe("ew:stone_quarry_L3");
    expect(structureForTradeLevel("stone_quarry", 1)?.padSize).toEqual({ x: 34, z: 28 });
    expect(structureForTradeLevel("stone_quarry", 1)?.npcAnchors.storefront).toEqual({
      offset: { x: 17, y: 1, z: 24 },
      role: "storefront",
      tags: [],
    });
    expect(structureForTradeLevel("stone_quarry", 1)?.zones.work_pit?.boxes[0]).toEqual({
      min: { x: 8, y: -4, z: 10 },
      max: { x: 24, y: 0, z: 24 },
    });
    expect(structureForTradeLevel("stone_quarry", 1)?.zones.protected_stairs?.boxes[0]).toEqual({
      min: { x: 8, y: -4, z: 10 },
      max: { x: 10, y: 0, z: 24 },
    });
  });

  it("reads successor spacing from per-trade config", () => {
    expect(successorOffsetForTrade("stone_quarry")).toEqual({ x: 40, y: 0, z: 0 });
  });
});
