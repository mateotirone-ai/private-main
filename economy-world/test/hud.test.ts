import { describe, expect, it } from "vitest";
import {
  activeActionbarContext,
  cashChipText,
  layerOneDangerState,
} from "../src/ui/hudMath";

describe("Phase F HUD policy", () => {
  it("shows physical cash only and never accepts a bank balance", () => {
    expect(cashChipText(125)).toBe("Cash 125");
    expect(cashChipText(-1)).toBe("Cash 0");
  });

  it("selects one highest-priority unexpired context", () => {
    expect(
      activeActionbarContext(
        [
          { key: "employment", message: "earned 4", priority: 60 },
          {
            key: "service",
            message: "customer waiting",
            priority: 80,
            expiresTick: 50,
          },
        ],
        20
      )?.key
    ).toBe("service");
    expect(
      activeActionbarContext(
        [
          { key: "employment", message: "earned 4", priority: 60 },
          {
            key: "service",
            message: "customer waiting",
            priority: 80,
            expiresTick: 50,
          },
        ],
        50
      )?.key
    ).toBe("employment");
  });

  it("keeps the danger glyph input off in Layer 1", () => {
    expect(layerOneDangerState()).toBe(false);
    expect(cashChipText(10, "working", false)).not.toContain("☠");
  });
});
