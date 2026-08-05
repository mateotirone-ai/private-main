import { describe, expect, it } from "vitest";
import {
  audit,
  balance,
  cashOut,
  emptyLedger,
  mint,
  transfer,
} from "../src/core/ledger";

describe("physical-cash sale settlement", () => {
  it("moves a freelancer sale from business funds to cashOutstanding", () => {
    const ledger = emptyLedger();
    mint(ledger, "b:cpu_sawmill", 100, 1, "mint:system");
    transfer(ledger, "b:cpu_sawmill", "p:worker", 58, 2, "shop:freelance");
    cashOut(ledger, "p:worker", 58, 2);

    expect(balance(ledger, "p:worker")).toBe(0);
    expect(balance(ledger, "b:cpu_sawmill")).toBe(42);
    expect(ledger.cashOutstanding).toBe(58);
    expect(audit(ledger).ok).toBe(true);
  });

  it("moves a dealer mint directly onto the physical-cash rail", () => {
    const ledger = emptyLedger();
    mint(ledger, "p:worker", 250, 1, "mint:dealer");
    cashOut(ledger, "p:worker", 250, 1);

    expect(balance(ledger, "p:worker")).toBe(0);
    expect(ledger.cashOutstanding).toBe(250);
    expect(audit(ledger).ok).toBe(true);
    expect(ledger.journal.map((entry) => entry.kind)).toEqual([
      "mint",
      "cashOut",
    ]);
  });
});
