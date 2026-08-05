export interface FoodConsumption {
  playerId: string;
  itemTypeId: string;
  good: string;
  trade: string;
  tick: number;
}

export interface FoodLedger {
  consumedByGood: Record<string, number>;
  recent: FoodConsumption[];
}

export interface EdibleLookup {
  good: string;
  trade: string;
}

export function recordFoodConsumption(
  state: FoodLedger,
  playerId: string,
  itemTypeId: string,
  edible: EdibleLookup | undefined,
  tick: number,
  recentCap: number
): FoodConsumption | undefined {
  if (!edible) return undefined;
  const event = {
    playerId,
    itemTypeId,
    good: edible.good,
    trade: edible.trade,
    tick,
  };
  state.consumedByGood[edible.good] =
    (state.consumedByGood[edible.good] ?? 0) + 1;
  state.recent.push(event);
  if (state.recent.length > recentCap) {
    state.recent.splice(0, state.recent.length - recentCap);
  }
  return event;
}
