import { describe, expect, it } from "vitest";
import {
  resolvePlacementTransform,
  resolveTargetFrontTransform,
  transformFacing,
  transformOffset,
} from "../src/systems/structurePlacementMath";

const NPC = { storefront: { x: 17, y: 1, z: 24 }, office: { x: 14, y: 1, z: 20 } };

describe("structure placement transforms", () => {
  it("rotates offsets so front faces the player at all cardinal yaws", () => {
    const byYaw = [
      {
        yaw: 0,
        storefront: { x: 17, y: 1, z: 24 },
        office: { x: 14, y: 1, z: 20 },
      },
      {
        yaw: 90,
        storefront: { x: -24, y: 1, z: 17 },
        office: { x: -20, y: 1, z: 14 },
      },
      {
        yaw: 180,
        storefront: { x: -17, y: 1, z: -24 },
        office: { x: -14, y: 1, z: -20 },
      },
      {
        yaw: 270,
        storefront: { x: 24, y: 1, z: -17 },
        office: { x: 20, y: 1, z: -14 },
      },
    ] as const;

    for (const sample of byYaw) {
      const transform = resolvePlacementTransform("south", sample.yaw);
      expect(transformOffset(NPC.storefront, transform)).toEqual(sample.storefront);
      expect(transformOffset(NPC.office, transform)).toEqual(sample.office);
    }
  });

  it("applies mirror before rotation", () => {
    const transform = resolvePlacementTransform("south", 0, "x");
    expect(transformOffset({ x: 4, y: 0, z: 9 }, transform)).toEqual({
      x: -4,
      y: 0,
      z: 9,
    });
  });

  it("keeps the declared front aimed at the target through mirrors", () => {
    for (const mirror of ["none", "x", "z", "xz"] as const) {
      for (const target of ["north", "east", "south", "west"] as const) {
        const transform = resolveTargetFrontTransform("north", target, mirror);
        expect(transformFacing("north", transform)).toBe(target);
      }
    }
  });
});
