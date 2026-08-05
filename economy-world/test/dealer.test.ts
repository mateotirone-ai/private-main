import { describe, it, expect } from "vitest";
import { emptyLedger, mint, audit, balance } from "../src/core/ledger";
import { quoteSale, unitMultiplier } from "../src/systems/dealerMath";
import { dealerCapacity, dealerSoftFloor } from "../src/content/matrix";
import { basePrice } from "../src/content/prices";

describe("dealer daily-capacity price softening", () => {
  const softFloor = dealerSoftFloor();
  const goldCap = dealerCapacity("gold");
  const goldBase = basePrice("gold");

  it("reads capacity + softFloor + base from data/", () => {
    expect(goldCap).toBeGreaterThan(0);
    expect(dealerCapacity("diamond")).toBeGreaterThan(0);
    expect(softFloor).toBeGreaterThan(0);
    expect(softFloor).toBeLessThanOrEqual(1);
    expect(goldBase).toBe(100);
    expect(basePrice("diamond")).toBe(400);
  });

  it("full price when nothing sold today", () => {
    expect(unitMultiplier(0, goldCap, softFloor)).toBeCloseTo(1, 10);
    const q = quoteSale(1, goldBase, 0, goldCap, softFloor);
    expect(q.payout).toBe(goldBase);
    expect(q.softened).toBe(false);
  });

  it("softens linearly toward softFloor as volume approaches capacity", () => {
    const mid = Math.floor(goldCap / 2);
    const m = unitMultiplier(mid, goldCap, softFloor);
    const expected = 1 - (mid / goldCap) * (1 - softFloor);
    expect(m).toBeCloseTo(expected, 10);
    expect(m).toBeLessThan(1);
    expect(m).toBeGreaterThan(softFloor);
  });

  it("hits softFloor at and beyond capacity", () => {
    expect(unitMultiplier(goldCap, goldCap, softFloor)).toBeCloseTo(softFloor, 10);
    expect(unitMultiplier(goldCap * 2, goldCap, softFloor)).toBeCloseTo(softFloor, 10);
  });

  it("quotes a multi-unit dump with progressive softening", () => {
    // sell half the daily capacity in one go from a cold start
    const qty = Math.floor(goldCap / 2);
    const q = quoteSale(qty, goldBase, 0, goldCap, softFloor);
    // first unit full price, last unit softened
    expect(q.firstMult).toBeCloseTo(1, 10);
    expect(q.lastMult).toBeLessThan(1);
    expect(q.payout).toBeLessThan(goldBase * qty);
    expect(q.payout).toBeGreaterThan(Math.floor(goldBase * softFloor) * qty);
    expect(q.softened).toBe(true);

    // manual sum must match
    let exactTotal = 0;
    for (let i = 0; i < qty; i++) {
      exactTotal += goldBase * unitMultiplier(i, goldCap, softFloor);
    }
    expect(q.payout).toBe(Math.round(exactTotal));
  });

  it("a second sale after a dump pays less per unit", () => {
    const first = quoteSale(10, goldBase, 0, goldCap, softFloor);
    const second = quoteSale(10, goldBase, 10, goldCap, softFloor);
    expect(second.avgUnitPrice).toBeLessThanOrEqual(first.avgUnitPrice);
    expect(second.payout).toBeLessThan(first.payout);
  });

  it("mint:dealer via the ledger conserves after a quoted sale", () => {
    const s = emptyLedger();
    const q = quoteSale(5, goldBase, 0, goldCap, softFloor);
    mint(s, "p:miner", q.payout, 1, "mint:dealer");
    expect(balance(s, "p:miner")).toBe(q.payout);
    expect(audit(s).ok).toBe(true);
  });

  it("rejects garbage qty/base", () => {
    expect(() => quoteSale(0, goldBase, 0, goldCap, softFloor)).toThrow(/invalid qty/);
    expect(() => quoteSale(1, 0, 0, goldCap, softFloor)).toThrow(/invalid base/);
  });
});
