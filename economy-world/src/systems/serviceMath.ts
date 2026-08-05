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
