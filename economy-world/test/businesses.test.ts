import { describe, it, expect } from "vitest";
import { produceOnce, seedCpuBusinesses, runCpuProduction } from "../src/systems/businessMath";
import { tradeDef, allTradeIds, cpuProduceEveryMinutes } from "../src/content/trades";

describe("CPU business output rates", () => {
  it("seeds one CPU business per Layer-1 trade", () => {
    const byId = seedCpuBusinesses();
    expect(Object.keys(byId).length).toBe(allTradeIds().length);
    expect(allTradeIds().length).toBe(10);
  });

  it("reads producePerTick + storageCap from data/trades.json", () => {
    const def = tradeDef("stone_quarry");
    expect(def.producePerTick).toBeGreaterThan(0);
    expect(def.storageCap).toBeGreaterThan(def.producePerTick);
    expect(cpuProduceEveryMinutes()).toBe(10);
  });

  it("produceOnce adds producePerTick until cap", () => {
    const def = tradeDef("stone_quarry");
    const biz = {
      id: "cpu_stone_quarry",
      trade: "stone_quarry",
      tier: 1 as const,
      owner: "cpu" as const,
      storage: 0,
      producedTotal: 0,
    };
    const added = produceOnce(biz);
    expect(added).toBe(def.producePerTick);
    expect(biz.storage).toBe(def.producePerTick);
    expect(biz.producedTotal).toBe(def.producePerTick);
  });

  it("produceOnce respects storageCap", () => {
    const def = tradeDef("bakery");
    const biz = {
      id: "cpu_bakery",
      trade: "bakery",
      tier: 1 as const,
      owner: "cpu" as const,
      storage: def.storageCap - 1,
      producedTotal: 0,
    };
    expect(produceOnce(biz)).toBe(1);
    expect(biz.storage).toBe(def.storageCap);
    expect(produceOnce(biz)).toBe(0);
  });

  it("runCpuProduction skips player-owned and reports stock deltas", () => {
    const byId = seedCpuBusinesses();
    const before = byId["cpu_lumber_camp"]!.storage;
    byId["cpu_bakery"]!.owner = "p:someone";
    const bakeryBefore = byId["cpu_bakery"]!.storage;
    const results = runCpuProduction(byId);
    expect(byId["cpu_lumber_camp"]!.storage).toBe(before + tradeDef("lumber_camp").producePerTick);
    expect(byId["cpu_bakery"]!.storage).toBe(bakeryBefore);
    expect(results.some((r) => r.trade === "lumber_camp")).toBe(true);
    expect(results.some((r) => r.trade === "bakery")).toBe(false);
  });
});
