import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CASH_ITEM_IDS = [
  "ew:cash_1",
  "ew:cash_10",
  "ew:cash_100",
  "ew:cash_1000",
] as const;

describe("custom item reload persistence guard", () => {
  it("declares both data and script modules in the BP manifest", () => {
    const manifest = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "packs/economy_bp/manifest.json"),
        "utf8"
      )
    );
    const types = new Set<string>(
      manifest.modules.map((module: { type: string }) => module.type)
    );
    expect(types.has("data")).toBe(true);
    expect(types.has("script")).toBe(true);
  });

  it("ships wallet and cash item registrations with atlas keys", () => {
    const atlas = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "packs/economy_rp/textures/item_texture.json"),
        "utf8"
      )
    );
    const wallet = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "packs/economy_bp/items/wallet.json"),
        "utf8"
      )
    );
    expect(wallet["minecraft:item"].description.identifier).toBe("ew:wallet");
    expect(wallet["minecraft:item"].components["minecraft:icon"]).toBe(
      "ew_wallet"
    );
    expect(atlas.texture_data.ew_wallet).toBeTruthy();

    for (const id of CASH_ITEM_IDS) {
      const file = resolve(
        process.cwd(),
        "packs/economy_bp/items",
        id.replace("ew:", "") + ".json"
      );
      const cash = JSON.parse(readFileSync(file, "utf8"));
      expect(cash["minecraft:item"].description.identifier).toBe(id);
      expect(cash["minecraft:item"].components["minecraft:icon"]).toBe(
        id.replace("ew:", "ew_")
      );
      expect(
        atlas.texture_data[cash["minecraft:item"].components["minecraft:icon"]]
      ).toBeTruthy();
    }
  });
});
