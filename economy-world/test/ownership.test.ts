import { describe, expect, it } from "vitest";
import { matrix } from "../src/content/matrix";
import {
  evaluateBusiness,
  resolveSealedAuction,
} from "../src/systems/ownershipMath";
import { ownerPresenceMultiplier } from "../src/systems/employmentMath";

describe("phase E ownership math", () => {
  it("evaluates a business from tier, stock, revenue, and location", () => {
    const value = evaluateBusiness(matrix.ownership.evaluation, {
      trade: "bakery",
      tier: 2,
      storageUnits: 40,
      marketUnitPrice: 12,
      recentRevenue: 600,
      upgradeSpend: 3000,
    });
    expect(value).toBeGreaterThan(1);
  });

  it("resolves sealed auctions deterministically with tie priority", () => {
    const fixed = () => 0.5;
    const result = resolveSealedAuction(
      matrix.ownership.auction,
      1000,
      1000,
      fixed
    );
    expect(result.winner.amount).toBeGreaterThan(0);
    expect(["player", "bank", "cpu"]).toContain(result.winner.bidder);
  });

  it("caps offline owner presence from employee stubs", () => {
    const p = ownerPresenceMultiplier(
      "owner",
      new Set(),
      matrix.work.employment,
      99
    );
    expect(p).toBeLessThanOrEqual(matrix.work.employment.offlineEmployeeCap);
  });
});
