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

export interface NodeVector {
  x: number;
  y: number;
  z: number;
}

export type RegisteredNodeAccess = "inert" | "protected" | "allowed";

export function nodePositionKey(
  dimensionId: string,
  location: NodeVector
): string {
  return `${dimensionId}:${location.x}:${location.y}:${location.z}`;
}

export function stampedNodeLocations(
  center: NodeVector,
  offsets: readonly NodeVector[]
): NodeVector[] {
  const base = {
    x: Math.floor(center.x),
    y: Math.floor(center.y),
    z: Math.floor(center.z),
  };
  return offsets.map((offset) => ({
    x: base.x + offset.x,
    y: base.y + offset.y,
    z: base.z + offset.z,
  }));
}

export function registeredNodeAccess(
  registered: boolean,
  publicZone: boolean,
  zoneBusinessId: string,
  sessionBusinessId?: string
): RegisteredNodeAccess {
  if (!registered) return "inert";
  if (publicZone || sessionBusinessId === zoneBusinessId) return "allowed";
  return "protected";
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
