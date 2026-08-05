import { describe, expect, it } from "vitest";
import { audit, emptyLedger, mint, sink } from "../src/core/ledger";
import {
  medicalBill,
  setPendingReceipt,
  takePendingReceipt,
} from "../src/systems/deathMath";

describe("death and medical bills", () => {
  it("rounds the complete flat-plus-wealth bill once", () => {
    const bill = medicalBill(100, 0.02, 503, 48);
    expect(bill.wealth).toBe(551);
    expect(bill.due).toBe(Math.round(100 + 0.02 * 551));
    expect(bill.flatCharge + bill.wealthCharge).toBe(bill.due);
  });

  it("caps settlement at available bank funds without creating debt", () => {
    const bill = medicalBill(100, 0.02, 40, 500);
    expect(bill.charged).toBe(40);
    expect(bill.unpaid).toBe(bill.due - 40);
  });

  it("sinks the collectible amount without breaking conservation", () => {
    const ledger = emptyLedger();
    mint(ledger, "p:dead", 250, 1, "mint:system");
    const bill = medicalBill(100, 0.02, 250, 50);
    sink(ledger, "p:dead", bill.charged, 2, "sink:medical");
    expect(audit(ledger).ok).toBe(true);
    expect(ledger.journal.at(-1)?.tag).toBe("sink:medical");
  });

  it("persists one receipt until the next respawn", () => {
    const state = { pending: {} };
    const receipt = { ...medicalBill(100, 0.02, 250, 50), tick: 10 };
    setPendingReceipt(state, "player", receipt);
    expect(takePendingReceipt(state, "player")).toEqual(receipt);
    expect(takePendingReceipt(state, "player")).toBeUndefined();
  });
});
