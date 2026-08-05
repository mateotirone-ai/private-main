import { describe, it, expect } from "vitest";
import { clamp, pressure, tickPrice, quoteUnit, freelancePayout } from "../src/systems/pricingMath";
import { goodConfig, isMintTier, prices } from "../src/content/prices";
import { matrix } from "../src/content/matrix";

describe("pricing engine math", () => {
  const stone = goodConfig("stone");

  it("reads band/drift/target from data/prices.json", () => {
    expect(stone.base).toBe(2);
    expect(stone.band[0]).toBeLessThan(stone.band[1]);
    expect(stone.driftRate).toBeGreaterThan(0);
    expect(stone.target).toBeGreaterThan(0);
    expect(prices.tickMinutes).toBe(10);
  });

  it("pressure is +1 when stock is 0 and −1 when stock is 2× target", () => {
    expect(pressure(0, 100)).toBe(1);
    expect(pressure(200, 100)).toBe(-1);
    expect(pressure(100, 100)).toBe(0);
  });

  it("clamp bounds values", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });

  it("scarcity raises price within band", () => {
    const lowStock = { current: stone.base, stock: 0 };
    const next = tickPrice(stone, lowStock);
    expect(next).toBeGreaterThan(stone.base);
    expect(next).toBeLessThanOrEqual(stone.base * stone.band[1]);
  });

  it("glut lowers price within band", () => {
    const glut = { current: stone.base, stock: stone.target * 3 };
    const next = tickPrice(stone, glut);
    expect(next).toBeLessThan(stone.base);
    expect(next).toBeGreaterThanOrEqual(stone.base * stone.band[0]);
  });

  it("never leaves the configured band even after many ticks", () => {
    let rt = { current: stone.base, stock: 0 };
    for (let i = 0; i < 500; i++) {
      rt = { current: tickPrice(stone, rt), stock: 0 };
    }
    expect(rt.current).toBeLessThanOrEqual(stone.base * stone.band[1] + 1e-9);
    rt = { current: stone.base, stock: stone.target * 10 };
    for (let i = 0; i < 500; i++) {
      rt = { current: tickPrice(stone, rt), stock: stone.target * 10 };
    }
    expect(rt.current).toBeGreaterThanOrEqual(stone.base * stone.band[0] - 1e-9);
  });

  it("mint-tier goods are flagged (L1 constant policy)", () => {
    expect(isMintTier("gold")).toBe(true);
    expect(isMintTier("diamond")).toBe(true);
    expect(isMintTier("stone")).toBe(false);
  });

  it("quoteUnit floors to a positive integer", () => {
    expect(quoteUnit(2.9)).toBe(2);
    expect(quoteUnit(0.1)).toBe(1);
  });

  it("freelance payout uses matrix.freelanceRate", () => {
    const rate = matrix.freelanceRate;
    expect(rate).toBe(0.45);
    const payout = freelancePayout(10, 4, rate);
    expect(payout).toBe(Math.round(10 * 4 * rate));
    expect(() => freelancePayout(10, 0, rate)).toThrow(/invalid qty/);
  });

  it("rounds freelancer payout once on the total", () => {
    // Per-unit flooring would pay 3 × floor(2 × .45) = 0 (or 3 with a min).
    // Total rounding preserves the configured 45%: round(2 × 3 × .45) = 3.
    expect(freelancePayout(2, 3, matrix.freelanceRate)).toBe(3);
  });
});
