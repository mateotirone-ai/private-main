import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { edibleGood, foodConfig } from "../src/content/food";
import {
  recordFoodConsumption,
  type FoodLedger,
} from "../src/systems/foodMath";

describe("Phase F food economy", () => {
  it("maps launch foods to real economic goods", () => {
    expect(edibleGood("minecraft:bread")).toEqual({
      good: "bread",
      trade: "bakery",
    });
    expect(edibleGood("minecraft:cod")).toEqual({
      good: "fish",
      trade: "fishery",
    });
    expect(edibleGood("minecraft:stone")).toBeUndefined();
  });

  it("records completed edible use and caps recent history", () => {
    const state: FoodLedger = { consumedByGood: {}, recent: [] };
    expect(
      recordFoodConsumption(
        state,
        "player",
        "minecraft:bread",
        edibleGood("minecraft:bread"),
        10,
        1
      )
    ).toMatchObject({ good: "bread", playerId: "player" });
    recordFoodConsumption(
      state,
      "player",
      "minecraft:cod",
      edibleGood("minecraft:cod"),
      11,
      1
    );
    expect(state.consumedByGood).toEqual({ bread: 1, fish: 1 });
    expect(state.recent).toHaveLength(1);
    expect(state.recent[0]?.good).toBe("fish");
  });

  it("ships an empty override for every configured free-food faucet", () => {
    for (const path of foodConfig.blockedLootTables) {
      const file = resolve(process.cwd(), "packs/economy_bp", path);
      expect(existsSync(file), path).toBe(true);
      expect(JSON.parse(readFileSync(file, "utf8")).pools).toEqual([]);
    }
  });
});
