import { describe, expect, it } from "vitest";
import { matrix } from "../src/content/matrix";
import { workConfig } from "../src/content/work";
import {
  advanceNode,
  nodePositionKey,
  nodeStageAt,
  registeredNodeAccess,
  stampedNodeLocations,
  type ResourceNode,
} from "../src/systems/nodeMath";

describe("resource node regeneration", () => {
  const timing = matrix.work.nodeStages;

  it("moves depleted → recovering → ready at configured ticks", () => {
    expect(nodeStageAt(100, 100, timing)).toBe("depleted");
    expect(nodeStageAt(100, 100 + timing.depletedTicks - 1, timing)).toBe("depleted");
    expect(nodeStageAt(100, 100 + timing.depletedTicks, timing)).toBe("recovering");
    expect(nodeStageAt(100, 100 + timing.recoveringTicks - 1, timing)).toBe("recovering");
    expect(nodeStageAt(100, 100 + timing.recoveringTicks, timing)).toBe("ready");
  });

  it("reports only visible stage changes", () => {
    const node: ResourceNode = {
      id: "node",
      trade: "stone_quarry",
      readyBlock: "minecraft:stone",
      stage: "depleted",
      harvestedTick: 0,
    };
    expect(advanceNode(node, timing.depletedTicks - 1, timing)).toBe(false);
    expect(advanceNode(node, timing.depletedTicks, timing)).toBe(true);
    expect(node.stage).toBe("recovering");
    expect(advanceNode(node, timing.recoveringTicks, timing)).toBe(true);
    expect(node.stage).toBe("ready");
    expect(advanceNode(node, timing.recoveringTicks + 1, timing)).toBe(false);
  });

  it("stamps only the authored test-pit positions", () => {
    const locations = stampedNodeLocations(
      { x: 10.8, y: 64, z: -3.2 },
      matrix.work.nodeStampOffsets
    );
    expect(locations).toHaveLength(matrix.work.nodeStampOffsets.length);
    const keys = new Set(
      locations.map((location) => nodePositionKey("overworld", location))
    );
    expect(keys.has(nodePositionKey("overworld", locations[0]!))).toBe(true);
    expect(
      keys.has(nodePositionKey("overworld", { x: 11, y: 63, z: -3 }))
    ).toBe(false);
  });

  it("treats unregistered blocks as inert and protects employee nodes", () => {
    expect(registeredNodeAccess(false, false, "business", undefined)).toBe(
      "inert"
    );
    expect(registeredNodeAccess(true, false, "business", undefined)).toBe(
      "protected"
    );
    expect(
      registeredNodeAccess(true, false, "business", "other-business")
    ).toBe("protected");
    expect(registeredNodeAccess(true, false, "business", "business")).toBe(
      "allowed"
    );
    expect(registeredNodeAccess(true, true, "business", undefined)).toBe(
      "allowed"
    );
  });

  it("uses per-trade spent-rock stage costumes and never obsidian", () => {
    for (const definition of Object.values(workConfig.extraction)) {
      expect(definition.stageBlocks.depleted).toMatch(/cracked/);
      expect(definition.stageBlocks.recovering).toMatch(/cobble/);
      expect(Object.values(definition.stageBlocks)).not.toContain(
        "minecraft:obsidian"
      );
    }
  });
});
