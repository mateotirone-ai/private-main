import { describe, expect, it } from "vitest";
import { matrix } from "../src/content/matrix";
import { advanceNode, nodeStageAt, type ResourceNode } from "../src/systems/nodeMath";

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
});
