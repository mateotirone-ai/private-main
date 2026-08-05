import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { allTradeIds } from "../src/content/trades";
import { storefrontFlavor } from "../src/content/flavorLines";

describe("phase D polish data integrity", () => {
  it("covers every trade with buy/sell flavor pools", () => {
    for (const trade of allTradeIds()) {
      const pool = storefrontFlavor[trade];
      expect(pool?.buy.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(pool?.sell.length ?? 0).toBeGreaterThanOrEqual(3);
    }
  });

  it("ships wallet and fishing textures referenced by atlases", () => {
    const root = resolve(process.cwd(), "packs/economy_rp");
    const itemTexture = JSON.parse(
      readFileSync(resolve(root, "textures/item_texture.json"), "utf8")
    );
    const terrainTexture = JSON.parse(
      readFileSync(resolve(root, "textures/terrain_texture.json"), "utf8")
    );
    const walletPath = itemTexture.texture_data.ew_wallet.textures;
    const fishingPath = terrainTexture.texture_data.ew_fishing_spot.textures;
    expect(existsSync(resolve(root, `${walletPath}.png`))).toBe(true);
    expect(existsSync(resolve(root, `${fishingPath}.png`))).toBe(true);
  });

  it("keeps removed custom node texture ids out of RP/BP manifests", () => {
    const blocks = readFileSync(
      resolve(process.cwd(), "packs/economy_rp/blocks.json"),
      "utf8"
    );
    const terrain = readFileSync(
      resolve(process.cwd(), "packs/economy_rp/textures/terrain_texture.json"),
      "utf8"
    );
    const lang = readFileSync(
      resolve(process.cwd(), "packs/economy_rp/texts/en_US.lang"),
      "utf8"
    );
    for (const banned of [
      "ew_node_depleted",
      "ew_node_recovering",
      "ew:node_depleted",
      "ew:node_recovering",
    ]) {
      expect(blocks.includes(banned)).toBe(false);
      expect(terrain.includes(banned)).toBe(false);
      expect(lang.includes(banned)).toBe(false);
    }
  });
});
