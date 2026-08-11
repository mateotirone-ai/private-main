import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as nbt from "prismarine-nbt";
import { allStructures } from "../src/content/structures";

describe("structure assets", () => {
  it("has a .mcstructure file for each ready registry id", () => {
    for (const entry of allStructures()) {
      if (!entry.gateOffset) continue;
      const stem = entry.id.includes(":") ? entry.id.split(":")[1]! : entry.id;
      const path = resolve(
        process.cwd(),
        "packs/economy_bp/structures/ew",
        `${stem}.mcstructure`
      );
      expect(existsSync(path)).toBe(true);
    }
  });

  it("builds home_6 roof stairs upward toward the ridge", async () => {
    const path = resolve(
      process.cwd(),
      "packs/economy_bp/structures/ew/home_6.mcstructure"
    );
    const parsed = await nbt.parse(readFileSync(path));
    const structure = nbt.simplify(parsed.parsed);
    const [sizeX, sizeY, sizeZ] = structure.size as number[];
    const indices = structure.structure.block_indices[0] as number[];
    const palette = structure.structure.palette.default.block_palette as Array<{
      name: string;
      states: Record<string, boolean | number | string>;
    }>;
    const blockAt = (x: number, y: number, z: number) => {
      const index = z + y * sizeZ + x * sizeY * sizeZ;
      return palette[indices[index]!]!;
    };

    expect(blockAt(2, 6, 8)).toMatchObject({
      name: "minecraft:mud_brick_stairs",
      states: { weirdo_direction: 0, upside_down_bit: 0 },
    });
    expect(blockAt(12, 6, 8)).toMatchObject({
      name: "minecraft:mud_brick_stairs",
      states: { weirdo_direction: 1, upside_down_bit: 0 },
    });
    expect(blockAt(6, 10, 8).name).toBe("minecraft:mud_brick_stairs");
    expect(blockAt(8, 10, 8).name).toBe("minecraft:mud_brick_stairs");
    expect(blockAt(2, 10, 8).name).toBe("minecraft:air");
    expect(blockAt(12, 10, 8).name).toBe("minecraft:air");
  });
});
