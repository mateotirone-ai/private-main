import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { allTradeIds } from "../src/content/trades";
import { storefrontFlavor } from "../src/content/flavorLines";
import { matrix } from "../src/content/matrix";

function filesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else out.push(path);
  }
  return out;
}

function pngSize(path: string): { width: number; height: number } {
  const png = readFileSync(path);
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

describe("pack and flavor data integrity", () => {
  it("covers every trade with buy/sell flavor pools", () => {
    for (const trade of allTradeIds()) {
      const pool = storefrontFlavor[trade];
      expect(pool?.buy.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(pool?.sell.length ?? 0).toBeGreaterThanOrEqual(3);
    }
  });

  it("resolves every BP item icon through the atlas, texture list, and PNG", () => {
    const rpRoot = resolve(process.cwd(), "packs/economy_rp");
    const bpItems = resolve(process.cwd(), "packs/economy_bp/items");
    const itemTexture = JSON.parse(
      readFileSync(resolve(rpRoot, "textures/item_texture.json"), "utf8")
    );
    const listed = new Set<string>(
      JSON.parse(readFileSync(resolve(rpRoot, "textures_list.json"), "utf8"))
    );
    for (const itemFile of filesUnder(bpItems).filter((path) => path.endsWith(".json"))) {
      const item = JSON.parse(readFileSync(itemFile, "utf8"));
      const icon = item["minecraft:item"]?.components?.["minecraft:icon"];
      expect(typeof icon).toBe("string");
      const texturePath = itemTexture.texture_data[icon]?.textures;
      expect(typeof texturePath).toBe("string");
      expect(listed.has(texturePath)).toBe(true);
      const png = resolve(rpRoot, `${texturePath}.png`);
      expect(existsSync(png)).toBe(true);
      expect(pngSize(png)).toEqual({ width: 16, height: 16 });
    }
  });

  it("ships every terrain atlas texture and declares en_US", () => {
    const root = resolve(process.cwd(), "packs/economy_rp");
    const terrainTexture = JSON.parse(
      readFileSync(resolve(root, "textures/terrain_texture.json"), "utf8")
    );
    const listed = new Set<string>(
      JSON.parse(readFileSync(resolve(root, "textures_list.json"), "utf8"))
    );
    for (const entry of Object.values(terrainTexture.texture_data) as Array<{
      textures: string;
    }>) {
      expect(listed.has(entry.textures)).toBe(true);
      expect(existsSync(resolve(root, `${entry.textures}.png`))).toBe(true);
    }
    expect(
      JSON.parse(readFileSync(resolve(root, "texts/languages.json"), "utf8"))
    ).toContain("en_US");
    const hud = JSON.parse(
      readFileSync(resolve(root, "ui/hud_screen.json"), "utf8")
    ).ew_wallet_chip;
    const chip = matrix.ui.hud.walletChip;
    expect(hud.offset).toEqual([chip.offsetX, chip.offsetY]);
    expect(hud.size).toEqual([chip.width, chip.height]);
  });

  it("keeps removed custom node ids and filenames out of all package inputs", () => {
    const roots = [
      resolve(process.cwd(), "packs/economy_bp"),
      resolve(process.cwd(), "packs/economy_rp"),
      resolve(process.cwd(), "data"),
      resolve(process.cwd(), "src"),
    ];
    const banned = [
      "ew_node_depleted",
      "ew_node_recovering",
      "ew:node_depleted",
      "ew:node_recovering",
    ];
    for (const path of roots.flatMap(filesUnder)) {
      const lower = path.toLowerCase();
      expect(lower).not.toMatch(/node_(depleted|recovering)/);
      if (!/\.(json|lang|js|ts)$/.test(lower)) continue;
      const content = readFileSync(path, "utf8");
      for (const token of banned) expect(content.includes(token)).toBe(false);
    }
  });
});
