import { describe, expect, it } from "vitest";
import { structureTierDef, structureTradeDef } from "../src/content/structures";

describe("structure registry", () => {
  it("declares front face and tiers for stone quarry", () => {
    const trade = structureTradeDef("stone_quarry");
    expect(trade).toBeTruthy();
    expect(trade?.frontFace).toBe("south");
    expect(trade?.pad).toEqual({ x: 34, z: 28 });
    expect(structureTierDef("stone_quarry", 1)?.id).toBe("ew:stone_quarry_t1");
    expect(structureTierDef("stone_quarry", 2)?.id).toBe("ew:stone_quarry_t2");
    expect(structureTierDef("stone_quarry", 3)?.id).toBe("ew:stone_quarry_t3");
  });
});
