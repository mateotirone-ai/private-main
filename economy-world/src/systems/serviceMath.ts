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
    businessId: `cpu_${host.trade}`,
    good,
    qty,
    createdTick,
  };
}
