import { describe, it, expect } from "vitest";
import { produceOnce, seedCpuBusinesses, runCpuProduction } from "../src/systems/businessMath";
import { tradeDef, allTradeIds, cpuProduceEveryMinutes } from "../src/content/trades";
import { ownerPresenceMultiplier } from "../src/systems/employmentMath";
import { matrix } from "../src/content/matrix";

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
      ...seedCpuBusinesses()["cpu_stone_quarry"]!,
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
      ...seedCpuBusinesses()["cpu_bakery"]!,
      storage: def.storageCap - 1,
      producedTotal: 0,
    };
    expect(produceOnce(biz)).toBe(1);
    expect(biz.storage).toBe(def.storageCap);
    expect(produceOnce(biz)).toBe(0);
  });

  it("runCpuProduction applies owner presence and reports stock deltas", () => {
    const byId = seedCpuBusinesses();
    byId["cpu_bakery"]!.owner = "p:someone";
    const bakeryBefore = byId["cpu_bakery"]!.storage;
    const results = runCpuProduction(
      byId,
      new Set<string>(),
      () => 1,
      matrix.work.employment
    );
    expect(byId["cpu_bakery"]!.storage).toBe(
      bakeryBefore + Math.floor(tradeDef("bakery").producePerTick * 0.5)
    );
    expect(results.some((r) => r.trade === "bakery")).toBe(true);
  });

  it("uses locked owner-presence output multipliers", () => {
    const cfg = matrix.work.employment;
    expect(ownerPresenceMultiplier("cpu", new Set(), cfg)).toBe(0.1);
    expect(ownerPresenceMultiplier("p:owner", new Set(), cfg)).toBe(0.5);
    expect(ownerPresenceMultiplier("p:owner", new Set(["p:owner"]), cfg)).toBe(1);
    expect(ownerPresenceMultiplier("p:owner", new Set(), cfg, 99)).toBeLessThanOrEqual(
      cfg.offlineEmployeeCap
    );
  });
});
