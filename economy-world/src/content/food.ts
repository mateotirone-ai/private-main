import raw from "../../data/food.json";

export interface EdibleGood {
  good: string;
  trade: string;
}

export interface FoodConfig {
  edibleGoods: Record<string, EdibleGood>;
  blockedLootTables: string[];
}

export const foodConfig = raw as unknown as FoodConfig;

export function edibleGood(itemTypeId: string): EdibleGood | undefined {
  return foodConfig.edibleGoods[itemTypeId];
}
