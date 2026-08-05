import { describe, expect, it } from "vitest";
import {
  audit,
  balance,
  emptyLedger,
  mint,
  transfer,
} from "../src/core/ledger";
import { matrix } from "../src/content/matrix";
import { wagePayout } from "../src/systems/employmentMath";

describe("employment wage payouts", () => {
  const cfg = matrix.work.employment;
  const tierOneWage = matrix.wagePerHourByTier["1"]!;

  it("pays the fixed tier wage for one configured hour", () => {
    expect(wagePayout(tierOneWage, cfg.ticksPerHour, cfg.ticksPerHour)).toBe(
      tierOneWage
    );
  });

  it("computes the whole elapsed wage and rounds once", () => {
    const elapsed = Math.floor(cfg.ticksPerHour / 3);
    expect(wagePayout(tierOneWage, elapsed, cfg.ticksPerHour)).toBe(
      Math.round((tierOneWage * elapsed) / cfg.ticksPerHour)
    );
  });

  it("settles wages through a ledger transfer and preserves audit", () => {
    const ledger = emptyLedger();
    const payout = wagePayout(
      tierOneWage,
      cfg.ticksPerHour,
      cfg.ticksPerHour
    );
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
