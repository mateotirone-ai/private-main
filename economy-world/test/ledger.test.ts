import { describe, it, expect } from "vitest";
import {
  emptyLedger, mint, sink, transfer, cashOut, cashIn, cashDestroyed,
  audit, balance, LedgerError,
} from "../src/core/ledger";

describe("the ledger", () => {
  it("mints through the one door and audits clean", () => {
    const s = emptyLedger();
    mint(s, "p:mateo", 500, 1, "mint:dealer");
    expect(balance(s, "p:mateo")).toBe(500);
    expect(audit(s).ok).toBe(true);
  });

  it("transfers are zero-sum", () => {
    const s = emptyLedger();
    mint(s, "p:a", 1000, 1, "mint:dealer");
    transfer(s, "p:a", "b:quarry", 400, 2, "buyout-downpayment");
    expect(balance(s, "p:a")).toBe(600);
    expect(balance(s, "b:quarry")).toBe(400);
    expect(audit(s).ok).toBe(true);
  });

  it("rejects overdrafts", () => {
    const s = emptyLedger();
    mint(s, "p:a", 100, 1, "mint:stipend");
    expect(() => transfer(s, "p:a", "p:b", 200, 2)).toThrow(LedgerError);
    expect(audit(s).ok).toBe(true);
  });

  it("rejects garbage amounts", () => {
    const s = emptyLedger();
    for (const bad of [0, -5, 1.5, NaN, Infinity]) {
      expect(() => mint(s, "p:a", bad as number, 1, "mint:system")).toThrow(LedgerError);
    }
  });

  it("sinks destroy money and the identity holds", () => {
    const s = emptyLedger();
    mint(s, "p:a", 1000, 1, "mint:dealer");
    sink(s, "p:a", 300, 2, "sink:medical");
    expect(balance(s, "p:a")).toBe(700);
    const r = audit(s);
    expect(r.ok).toBe(true);
    expect(r.expected).toBe(700);
  });

  it("cash out/in conserves supply across physical form", () => {
    const s = emptyLedger();
    mint(s, "p:a", 1000, 1, "mint:dealer");
    cashOut(s, "p:a", 250, 2);
    expect(balance(s, "p:a")).toBe(750);
    expect(s.cashOutstanding).toBe(250);
    expect(audit(s).ok).toBe(true);
    cashIn(s, "p:b", 250, 3); // someone else deposits the cash they were handed
    expect(balance(s, "p:b")).toBe(250);
    expect(s.cashOutstanding).toBe(0);
    expect(audit(s).ok).toBe(true);
  });

  it("counterfeit cash cannot be deposited", () => {
    const s = emptyLedger();
    expect(() => cashIn(s, "p:cheater", 100, 1)).toThrow(/counterfeit/);
  });

  it("cash destroyed (death in the wild) is a sink", () => {
    const s = emptyLedger();
    mint(s, "p:a", 500, 1, "mint:dealer");
    cashOut(s, "p:a", 200, 2);
    cashDestroyed(s, 200, 3, "sink:system");
    const r = audit(s);
    expect(r.ok).toBe(true);
    expect(r.expected).toBe(300);
  });

  it("survives a 10k-op fuzz with the identity intact", () => {
    const s = emptyLedger();
    const accts = ["p:a", "p:b", "p:c", "b:q", "b:s"];
    let seed = 42;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    mint(s, "p:a", 1_000_000, 0, "mint:system");
    for (let i = 1; i <= 10_000; i++) {
      const a = accts[Math.floor(rnd() * accts.length)]!;
      const b = accts[Math.floor(rnd() * accts.length)]!;
      const amt = 1 + Math.floor(rnd() * 500);
      try {
        const roll = rnd();
        if (roll < 0.5) transfer(s, a, b, amt, i);
        else if (roll < 0.7) mint(s, a, amt, i, "mint:dealer");
        else if (roll < 0.9) sink(s, a, amt, i, "sink:fee");
        else { cashOut(s, a, amt, i); cashIn(s, b, amt, i); }
      } catch (e) {
        if (!(e instanceof LedgerError)) throw e;
      }
    }
    expect(audit(s).ok).toBe(true);
  });
});
