import { describe, expect, it } from "vitest";
import { audit, emptyLedger, mint, transfer } from "../src/core/ledger";
import { matrix } from "../src/content/matrix";
import { structureForTradeLevel } from "../src/content/structures";
import {
  decidePitBreak,
  localOffsetAtWorld,
  padBoundsForEntry,
  pitSiteContext,
  shouldCreditAuthoredBreak,
  structureOriginForSite,
  zonesForTradeLevel,
} from "../src/systems/extractionPit";
import type { StructureZoneVolume } from "../src/content/structures";
import {
  nextRegenWindow,
  pointInLocalVolume,
  regenEligible,
  regenReady,
  worldAabbForLocalBox,
  worldPointToLocal,
} from "../src/systems/extractionZoneMath";
import { pieceRatePayout } from "../src/systems/employmentMath";
import type { Business } from "../src/systems/businesses";
import { seedCpuBusinesses } from "../src/systems/businessMath";

function quarryBusiness(tier: 1 | 2 | 3 = 1): Business {
  const business = seedCpuBusinesses().cpu_stone_quarry!;
  business.tier = tier;
  business.site = {
    dimensionId: "minecraft:overworld",
    anchor: { x: 100, y: 64, z: 200 },
    rotationSteps: 0,
    mirror: "none",
  };
  return business;
}

describe("extraction zone volumes", () => {
  it("loads concrete work_pit and protected_stairs boxes for quarry levels", () => {
    for (const level of [1, 2, 3]) {
      const zones = zonesForTradeLevel("stone_quarry", level);
      expect(zones?.work_pit?.boxes[0]).toEqual({
        min: { x: 8, y: -4, z: 10 },
        max: { x: 24, y: 0, z: 24 },
      });
      expect(zones?.protected_stairs?.boxes[0]).toEqual({
        min: { x: 8, y: -4, z: 10 },
        max: { x: 10, y: 0, z: 24 },
      });
    }
  });

  it("transforms zone membership correctly at all four rotations", () => {
    const volume: StructureZoneVolume = {
      boxes: [{ min: { x: 8, y: -4, z: 10 }, max: { x: 24, y: 0, z: 24 } }],
    };
    const origin = { x: 0, y: 0, z: 0 };
    const sampleLocal = { x: 16, y: -2, z: 17 };
    for (const rotationSteps of [0, 1, 2, 3] as const) {
      const transform = { rotationSteps, mirror: "none" as const };
      const world = worldAabbForLocalBox(
        origin,
        { min: sampleLocal, max: sampleLocal },
        transform
      );
      const local = worldPointToLocal(world.min, origin, transform);
      expect(
        pointInLocalVolume(
          {
            x: Math.round(local.x),
            y: Math.round(local.y),
            z: Math.round(local.z),
          },
          volume
        )
      ).toBe(true);
      expect(
        pointInLocalVolume({ x: 0, y: 0, z: 0 }, volume)
      ).toBe(false);
    }
  });

  it("re-derives zone volumes from the upgraded level registry entry", () => {
    const l1 = structureForTradeLevel("stone_quarry", 1)!;
    const l2 = structureForTradeLevel("stone_quarry", 2)!;
    const business = quarryBusiness(1);
    expect(pitSiteContext(business)?.entry.id).toBe(l1.id);
    business.tier = 2;
    expect(pitSiteContext(business)?.entry.id).toBe(l2.id);
    expect(pitSiteContext(business)?.workPit).toEqual(l2.zones.work_pit);
  });
});

describe("pit break rules", () => {
  it("never allows protected stairs to break", () => {
    expect(
      decidePitBreak({
        onPad: true,
        inStairs: true,
        inPit: true,
        clockedIntoThis: true,
        siteClosed: false,
        storageFull: false,
        authoredMatches: true,
      }).kind
    ).toBe("stairs");
  });

  it("denies breaks on the pad when not clocked in", () => {
    expect(
      decidePitBreak({
        onPad: true,
        inStairs: false,
        inPit: true,
        clockedIntoThis: false,
        siteClosed: false,
        storageFull: false,
        authoredMatches: true,
      }).kind
    ).toBe("pad_denied");
  });

  it("credits clocked authored breaks once", () => {
    expect(
      decidePitBreak({
        onPad: true,
        inStairs: false,
        inPit: true,
        clockedIntoThis: true,
        siteClosed: false,
        storageFull: false,
        authoredMatches: true,
      })
    ).toEqual({ kind: "pit_credit", units: 1 });
  });

  it("credits nothing for placed-then-broken non-authored blocks", () => {
    expect(shouldCreditAuthoredBreak("minecraft:stone", "minecraft:dirt")).toBe(
      false
    );
    expect(
      decidePitBreak({
        onPad: true,
        inStairs: false,
        inPit: true,
        clockedIntoThis: true,
        siteClosed: false,
        storageFull: false,
        authoredMatches: false,
      }).kind
    ).toBe("pit_no_credit");
  });
});

describe("pit regen gating", () => {
  it("refuses eligibility while a worker is clocked in", () => {
    expect(
      regenEligible({ clockedInCount: 1, playersOnPad: 0 })
    ).toBe(false);
  });

  it("refuses eligibility while any player stands on the pad", () => {
    expect(
      regenEligible({ clockedInCount: 0, playersOnPad: 1 })
    ).toBe(false);
  });

  it("becomes ready only after the delay while empty", () => {
    expect(regenEligible({ clockedInCount: 0, playersOnPad: 0 })).toBe(true);
    const started = nextRegenWindow(
      { eligibleSinceTick: null },
      true,
      100
    );
    expect(started.eligibleSinceTick).toBe(100);
    expect(regenReady(started, 100 + matrix.work.pitRegenDelayTicks - 1, matrix.work.pitRegenDelayTicks)).toBe(
      false
    );
    expect(
      regenReady(started, 100 + matrix.work.pitRegenDelayTicks, matrix.work.pitRegenDelayTicks)
    ).toBe(true);
    const cancelled = nextRegenWindow(started, false, 500);
    expect(cancelled.eligibleSinceTick).toBeNull();
  });

  it("treats pad/zone restore volume as the authored work_pit boxes", () => {
    const business = quarryBusiness(1);
    const ctx = pitSiteContext(business)!;
    expect(ctx.workPit?.boxes).toHaveLength(1);
    const origin = structureOriginForSite(
      business.site!.anchor,
      ctx.entry,
      ctx.transform
    );
    const pad = padBoundsForEntry(origin, ctx.entry, ctx.transform);
    expect(pad).toBeDefined();
    const local = localOffsetAtWorld(ctx, {
      x: origin.x + 16,
      y: origin.y - 2,
      z: origin.z + 17,
    });
    expect(pointInLocalVolume(local, ctx.workPit)).toBe(true);
  });
});

describe("shift audit through volume credits", () => {
  it("keeps ledger drift at 0 through a full piece-rate shift cycle", () => {
    const ledger = emptyLedger();
    const rate = matrix.work.employment.pieceRateByTradeTier.stone_quarry!["1"]!;
    const units = 5;
    const due = pieceRatePayout(rate, units);
    mint(ledger, "b:cpu_stone_quarry", due, 1, "mint:system");
    transfer(
      ledger,
      "b:cpu_stone_quarry",
      "p:worker",
      due,
      2,
      "employment:wage"
    );
    expect(due).toBeGreaterThan(0);
    expect(audit(ledger)).toMatchObject({ ok: true, drift: 0 });
  });
});
