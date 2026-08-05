import { describe, expect, it } from "vitest";
import { matrix } from "../src/content/matrix";
import {
  counterOpenAuction,
  evaluateBusiness,
  minimumRaiseAmount,
  placePlayerRaise,
  startOpenAuction,
} from "../src/systems/ownershipMath";
import { ownerPresenceMultiplier } from "../src/systems/employmentMath";
import { audit, emptyLedger, mint, transfer } from "../src/core/ledger";
import { insufficientFundsMessage } from "../src/ui/funds";
import {
  claimBusinessLock,
  claimOwnershipFirst,
  releaseBusinessLock,
} from "../src/systems/ownershipPolicy";

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

  it("runs visible ascending rounds until counters stop", () => {
    const rolls = [0, 1, 1];
    const state = startOpenAuction(
      matrix.ownership.auction,
      1000,
      () => rolls.shift() ?? 1
    );
    expect(state.standing).toEqual({ bidder: "bank", amount: 900 });
    const firstRaise = minimumRaiseAmount(state, matrix.ownership.auction);
    const countered = counterOpenAuction(
      placePlayerRaise(
        state,
        matrix.ownership.auction,
        firstRaise
      ),
      matrix.ownership.auction
    );
    expect(countered.standing).toEqual({ bidder: "cpu", amount: 1000 });
    expect(countered.bids.map((bid) => bid.bidder)).toEqual([
      "bank",
      "player",
      "cpu",
    ]);
    const finalRaise = minimumRaiseAmount(
      countered,
      matrix.ownership.auction
    );
    const won = counterOpenAuction(
      placePlayerRaise(
        countered,
        matrix.ownership.auction,
        finalRaise
      ),
      matrix.ownership.auction
    );
    expect(won.complete).toBe(true);
    expect(won.standing.bidder).toBe("player");
  });

  it("ends at the configured round cap with the standing bidder", () => {
    const cfg = {
      ...matrix.ownership.auction,
      maxRounds: 2,
      cpuBidMinPct: 2,
      cpuBidMaxPct: 2,
    };
    let state = startOpenAuction(cfg, 1000, () => 0);
    for (let round = 0; round < cfg.maxRounds; round++) {
      state = counterOpenAuction(
        placePlayerRaise(state, cfg, minimumRaiseAmount(state, cfg)),
        cfg
      );
    }
    expect(state.complete).toBe(true);
    expect(state.round).toBe(2);
    expect(state.standing.bidder).toBe("cpu");
  });

  it("allows the rare bank boost to jump back in during a late round", () => {
    const rolls = [0, 1, 0, 1];
    let state = startOpenAuction(
      matrix.ownership.auction,
      1000,
      () => rolls.shift() ?? 1
    );
    state = counterOpenAuction(
      placePlayerRaise(
        state,
        matrix.ownership.auction,
        minimumRaiseAmount(state, matrix.ownership.auction)
      ),
      matrix.ownership.auction
    );
    state = counterOpenAuction(
      placePlayerRaise(
        state,
        matrix.ownership.auction,
        minimumRaiseAmount(state, matrix.ownership.auction)
      ),
      matrix.ownership.auction
    );
    expect(state.standing.bidder).toBe("bank");
  });

  it("conserves money when an owner funds the business", () => {
    const ledger = emptyLedger();
    mint(ledger, "p:owner", 1000, 1, "mint:system");
    transfer(
      ledger,
      "p:owner",
      "b:stone",
      600,
      2,
      "owner:capital"
    );
    expect(ledger.balances["p:owner"]).toBe(400);
    expect(ledger.balances["b:stone"]).toBe(600);
    expect(audit(ledger).ok).toBe(true);
  });

  it("formats graceful insufficient-funds declines", () => {
    expect(insufficientFundsMessage("Stone Quarry", 5000, 0)).toBe(
      "Stone Quarry can't cover this — 5,000 needed, 0 available."
    );
  });

  it("claims each world-first announcement only once", () => {
    const firsts = {
      firstOwnershipClaimed: false,
      firstTierThreeClaimed: false,
    };
    expect(claimOwnershipFirst(firsts, "firstOwnershipClaimed")).toBe(true);
    expect(claimOwnershipFirst(firsts, "firstOwnershipClaimed")).toBe(false);
    expect(claimOwnershipFirst(firsts, "firstTierThreeClaimed")).toBe(true);
  });

  it("locks one business buyout to one player at a time", () => {
    const locks = new Map<string, string>();
    expect(claimBusinessLock(locks, "cpu_bakery", "p1")).toBe(true);
    expect(claimBusinessLock(locks, "cpu_bakery", "p2")).toBe(false);
    releaseBusinessLock(locks, "cpu_bakery", "p1");
    expect(claimBusinessLock(locks, "cpu_bakery", "p2")).toBe(true);
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
