export interface ConstructionWindow {
  startedTick: number;
  completeTick: number;
}

export function constructionLayersDue(
  window: ConstructionWindow,
  nowTick: number,
  totalLayers: number
): number {
  if (totalLayers <= 0) return 0;
  const duration = Math.max(1, window.completeTick - window.startedTick);
  const elapsed = Math.max(0, Math.min(duration, nowTick - window.startedTick));
  return Math.min(totalLayers, Math.floor((elapsed / duration) * totalLayers));
}

export function constructionRemainingTicks(
  completeTick: number,
  nowTick: number
): number {
  return Math.max(0, completeTick - nowTick);
}

export function upgradeShortfall(cost: number, available: number): number {
  return Math.max(0, cost - available);
}

export function tierCapacity(
  base: number,
  multiplier: number
): number {
  return Math.max(1, Math.floor(base * multiplier));
}

export function claimSettlementTierFirst(
  milestones: Record<string, { L2: boolean; L3: boolean }>,
  settlementId: string,
  level: 2 | 3
): boolean {
  const current = (milestones[settlementId] ??= { L2: false, L3: false });
  const key = level === 2 ? "L2" : "L3";
  if (current[key]) return false;
  current[key] = true;
  return true;
}
