export interface WageSession {
  playerId: string;
  businessId: string;
  tier: number;
  clockInTick: number;
  output: number;
}

/** Binding rounding rule: compute the total wage, then round once. */
export function wagePayout(
  wagePerHour: number,
  elapsedTicks: number,
  ticksPerHour: number
): number {
  if (wagePerHour < 0 || elapsedTicks < 0 || ticksPerHour <= 0) {
    throw new Error("invalid wage inputs");
  }
  return Math.max(0, Math.round((wagePerHour * elapsedTicks) / ticksPerHour));
}

export interface PresenceMultipliers {
  cpuMultiplier: number;
  offlineOwnerMultiplier: number;
  activeOwnerMultiplier: number;
}

/** Master design: CPU ~10%, offline/AFK owner ~50%, active owner 100%. */
export function ownerPresenceMultiplier(
  owner: "cpu" | string,
  activeOwnerIds: ReadonlySet<string>,
  cfg: PresenceMultipliers
): number {
  if (owner === "cpu") return cfg.cpuMultiplier;
  return activeOwnerIds.has(owner) ? cfg.activeOwnerMultiplier : cfg.offlineOwnerMultiplier;
}
