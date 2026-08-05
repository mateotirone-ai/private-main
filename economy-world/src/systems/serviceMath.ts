/** Binding rounding rule: calculate the whole order total, round once. */
export function serviceOrderTotal(
  currentUnitPrice: number,
  qty: number,
  activeMarginBonus: number
): number {
  if (currentUnitPrice <= 0 || !Number.isInteger(qty) || qty <= 0) {
    throw new Error("invalid service order");
  }
  return Math.max(1, Math.round(currentUnitPrice * qty * (1 + activeMarginBonus)));
}

export interface CustomerRequest {
  hostId: string;
  trade: string;
  businessId: string;
  good: string;
  qty: number;
  createdTick: number;
}

export interface ServiceHost {
  id: string;
  trade: string;
  businessId?: string;
  dimensionId: string;
  location: { x: number; y: number; z: number };
  speaker: string;
}

export interface ServiceClaim {
  playerId: string;
  claimedTick: number;
}

export interface NeedRollConfig {
  minQty: number;
  maxQty: number;
  largeOrderChance: number;
  largeMinQty: number;
  largeMaxQty: number;
}

export function rollRequestQty(
  cfg: NeedRollConfig,
  rng: () => number = Math.random
): number {
  if (
    cfg.minQty <= 0 ||
    cfg.maxQty < cfg.minQty ||
    cfg.largeMinQty < cfg.maxQty ||
    cfg.largeMaxQty < cfg.largeMinQty
  ) {
    throw new Error("invalid service need roll config");
  }
  if (cfg.largeOrderChance < 0 || cfg.largeOrderChance > 1) {
    throw new Error("invalid large-order chance");
  }
  const large = rng() < cfg.largeOrderChance;
  const min = large ? cfg.largeMinQty : cfg.minQty;
  const max = large ? cfg.largeMaxQty : cfg.maxQty;
  const spread = max - min + 1;
  return min + Math.floor(rng() * spread);
}

export function createCustomerRequest(
  host: ServiceHost,
  good: string,
  qty: number,
  createdTick: number
): CustomerRequest {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error("invalid customer need quantity");
  }
  return {
    hostId: host.id,
    trade: host.trade,
    businessId: host.businessId ?? `cpu_${host.trade}`,
    good,
    qty,
    createdTick,
  };
}

export function claimCustomerNeed(
  claims: Record<string, ServiceClaim>,
  requests: Record<string, CustomerRequest>,
  hostId: string,
  playerId: string,
  tick: number
): boolean {
  if (!requests[hostId]) return false;
  const existing = claims[hostId];
  if (existing && existing.playerId !== playerId) return false;
  claims[hostId] = { playerId, claimedTick: tick };
  return true;
}

export function releaseCustomerNeedClaim(
  claims: Record<string, ServiceClaim>,
  hostId: string,
  playerId: string
): void {
  if (claims[hostId]?.playerId === playerId) delete claims[hostId];
}

export function canFulfillClaimedNeed(
  claims: Record<string, ServiceClaim>,
  requests: Record<string, CustomerRequest>,
  hostId: string,
  playerId: string
): CustomerRequest | undefined {
  const claim = claims[hostId];
  if (!claim || claim.playerId !== playerId) return undefined;
  return requests[hostId];
}
