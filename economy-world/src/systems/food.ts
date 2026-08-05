import { loadBlob, saveBlob } from "../core/state";
import { edibleGood } from "../content/food";
import { matrix } from "../content/matrix";
import {
  recordFoodConsumption,
  type FoodConsumption,
} from "./foodMath";

export interface FoodState {
  schema: 1;
  consumedByGood: Record<string, number>;
  recent: FoodConsumption[];
}

const KEY = "ew:food";
let consumptionHook: ((event: FoodConsumption) => void) | undefined;

export function emptyFood(): FoodState {
  return { schema: 1, consumedByGood: {}, recent: [] };
}

export function loadFood(): FoodState {
  const state = loadBlob<FoodState>(KEY);
  return state?.schema === 1 ? state : emptyFood();
}

export function saveFood(state: FoodState): void {
  saveBlob(KEY, state);
}

export function setFoodConsumptionHook(
  hook: ((event: FoodConsumption) => void) | undefined
): void {
  consumptionHook = hook;
}

export function noteCompletedFoodUse(
  state: FoodState,
  playerId: string,
  itemTypeId: string,
  tick: number
): FoodConsumption | undefined {
  const event = recordFoodConsumption(
    state,
    playerId,
    itemTypeId,
    edibleGood(itemTypeId),
    tick,
    matrix.food.recentConsumptionCap
  );
  if (!event) return undefined;
  saveFood(state);
  consumptionHook?.(event);
  return event;
}
