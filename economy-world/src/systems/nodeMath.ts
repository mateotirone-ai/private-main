export type NodeStage = "depleted" | "recovering" | "ready";

export interface ResourceNode {
  id: string;
  trade: string;
  readyBlock: string;
  stage: NodeStage;
  harvestedTick: number;
}

export interface NodeTiming {
  depletedTicks: number;
  recoveringTicks: number;
}

export function nodeStageAt(
  harvestedTick: number,
  nowTick: number,
  timing: NodeTiming
): NodeStage {
  const elapsed = Math.max(0, nowTick - harvestedTick);
  if (elapsed < timing.depletedTicks) return "depleted";
  if (elapsed < timing.recoveringTicks) return "recovering";
  return "ready";
}

/** Advance a node and report whether its visible stage changed. */
export function advanceNode(
  node: ResourceNode,
  nowTick: number,
  timing: NodeTiming
): boolean {
  const next = nodeStageAt(node.harvestedTick, nowTick, timing);
  if (next === node.stage) return false;
  node.stage = next;
  return true;
}
