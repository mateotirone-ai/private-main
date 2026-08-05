export interface PieceRateSession {
  playerId: string;
  businessId: string;
  tier: number;
  clockInTick: number;
  output: number;
}

/** Binding rounding rule: rate × total shift output, rounded once. */
export function pieceRatePayout(ratePerUnit: number, output: number): number {
  if (ratePerUnit < 0 || !Number.isInteger(output) || output < 0) {
    throw new Error("invalid piece-rate inputs");
  }
  if (output === 0) return 0;
  return Math.max(1, Math.round(ratePerUnit * output));
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
