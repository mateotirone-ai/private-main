import { describe, expect, it } from "vitest";
import { matrix } from "../src/content/matrix";
import { workConfig } from "../src/content/work";
import {
  companyToolCanUse,
  decodeCompanyToolMarker,
  encodeCompanyToolMarker,
  shouldReclaimCompanyTool,
  type CompanyToolMarker,
} from "../src/systems/companyToolPolicy";

describe("company tool lifecycle", () => {
  const marker: CompanyToolMarker = {
    ownerId: "player",
    businessId: "cpu_stone_quarry",
    trade: "stone_quarry",
    tier: 1,
    quality: 1,
  };

  it("round-trips its ownership marker", () => {
    expect(decodeCompanyToolMarker(encodeCompanyToolMarker(marker))).toEqual(
      marker
    );
  });

  it("defines tier-scaled quality and a loaner for every job", () => {
    expect(matrix.work.employment.toolQualityByTier["2"]).toBeGreaterThan(
      matrix.work.employment.toolQualityByTier["1"]!
    );
    for (const trade of Object.keys(
      matrix.work.employment.pieceRateByTradeTier
    )) {
      expect(workConfig.jobTools[trade]?.["1"]).toBeTruthy();
      expect(workConfig.jobTools[trade]?.["2"]).toBeTruthy();
    }
  });

  it("works only for its owner on matching registered business nodes", () => {
    expect(
      companyToolCanUse(marker, "cpu_stone_quarry", "player")
    ).toBe(true);
    expect(companyToolCanUse(marker, undefined, "player")).toBe(false);
    expect(companyToolCanUse(marker, "cpu_ore_mine", "player")).toBe(false);
    expect(
      companyToolCanUse(marker, "cpu_stone_quarry", "other-player")
    ).toBe(false);
    expect(companyToolCanUse(undefined, undefined, "player")).toBe(true);
  });

  it("reclaims on both clock-out and death without touching personal tools", () => {
    expect(shouldReclaimCompanyTool(marker, "player", "clockOut")).toBe(true);
    expect(shouldReclaimCompanyTool(marker, "player", "death")).toBe(true);
    expect(shouldReclaimCompanyTool(marker, "other", "death")).toBe(false);
    expect(shouldReclaimCompanyTool(undefined, "player", "death")).toBe(false);
  });
});
