import { describe, expect, it } from "vitest";
import {
  audit,
  balance,
  emptyLedger,
  mint,
  transfer,
} from "../src/core/ledger";
import { matrix } from "../src/content/matrix";
import { pieceRatePayout } from "../src/systems/employmentMath";

describe("employment piece-rate payouts", () => {
  const quarryTierOne =
    matrix.work.employment.pieceRateByTradeTier.stone_quarry!["1"]!;

  it("pays configured merids per output unit", () => {
    expect(quarryTierOne).toBe(2);
    expect(pieceRatePayout(quarryTierOne, 7)).toBe(14);
  });

  it("defines positive tier rates for every job", () => {
    for (const tiers of Object.values(
      matrix.work.employment.pieceRateByTradeTier
    )) {
      expect(tiers["1"]).toBeGreaterThan(0);
      expect(tiers["2"]).toBeGreaterThan(0);
    }
  });

  it("rounds once on total shift output", () => {
    expect(pieceRatePayout(1.5, 3)).toBe(Math.round(1.5 * 3));
  });

  it("never pays zero when shift output is positive", () => {
    expect(pieceRatePayout(0.1, 1)).toBe(1);
    expect(pieceRatePayout(0.1, 0)).toBe(0);
  });

  it("settles wages through a ledger transfer and preserves audit", () => {
    const ledger = emptyLedger();
    const payout = pieceRatePayout(quarryTierOne, 5);
    mint(ledger, "b:cpu_stone_quarry", payout, 1, "mint:system");
    transfer(
      ledger,
      "b:cpu_stone_quarry",
      "p:worker",
      payout,
      2,
      "employment:wage"
    );
    expect(balance(ledger, "p:worker")).toBe(payout);
    expect(audit(ledger).ok).toBe(true);
  });
});
