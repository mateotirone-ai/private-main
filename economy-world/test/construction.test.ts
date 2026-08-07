import { describe, expect, it } from "vitest";
import { audit, emptyLedger, mint, sink, transfer } from "../src/core/ledger";
import { matrix } from "../src/content/matrix";
import {
  claimSettlementTierFirst,
  constructionLayersDue,
  tierCapacity,
  upgradeShortfall,
} from "../src/systems/constructionMath";
import {
  businessIsOpen,
  seedCpuBusinesses,
} from "../src/systems/businessMath";

describe("tier construction", () => {
  it("schedules target layers proportionally from bottom to top", () => {
    const window = { startedTick: 100, completeTick: 500 };
    expect(constructionLayersDue(window, 99, 20)).toBe(0);
    expect(constructionLayersDue(window, 200, 20)).toBe(5);
    expect(constructionLayersDue(window, 300, 20)).toBe(10);
    expect(constructionLayersDue(window, 500, 20)).toBe(20);
    expect(constructionLayersDue(window, 900, 20)).toBe(20);
  });

  it("closes a business while exactly one construction record exists", () => {
    const business = seedCpuBusinesses().cpu_stone_quarry;
    expect(businessIsOpen(business!)).toBe(true);
    business!.construction = {
      targetTier: 2,
      startedTick: 100,
      completeTick: 500,
      cost: 5000,
      placedLayers: 0,
      siteClosed: true,
      dressingPlaced: true,
    };
    expect(businessIsOpen(business!)).toBe(false);
  });

  it("applies level storage and employee-slot multipliers", () => {
    expect(
      tierCapacity(
        100,
        matrix.ownership.tierStorageMultiplierByTier["2"]!
      )
    ).toBe(150);
    expect(
      tierCapacity(
        matrix.ownership.management.maxEmployeeSlots,
        matrix.ownership.tierEmployeeSlotMultiplierByTier["3"]!
      )
    ).toBe(8);
  });

  it("claims first L2 and L3 independently per settlement", () => {
    const milestones: Record<string, { L2: boolean; L3: boolean }> = {};
    expect(claimSettlementTierFirst(milestones, "overworld", 2)).toBe(true);
    expect(claimSettlementTierFirst(milestones, "overworld", 2)).toBe(false);
    expect(claimSettlementTierFirst(milestones, "overworld", 3)).toBe(true);
    expect(claimSettlementTierFirst(milestones, "nether", 2)).toBe(true);
  });

  it("keeps audit drift zero through owner injection and construction payment", () => {
    const ledger = emptyLedger();
    mint(ledger, "p:owner", 7000, 1, "mint:system");
    transfer(ledger, "p:owner", "b:quarry", 5000, 2, "owner:capital");
    expect(upgradeShortfall(5000, 5000)).toBe(0);
    sink(ledger, "b:quarry", 5000, 3, "sink:construction");
    expect(audit(ledger)).toMatchObject({ ok: true, drift: 0 });
  });

  it("names the shortfall on an insufficient construction debit", () => {
    expect(upgradeShortfall(5000, 1200)).toBe(3800);
  });
});
