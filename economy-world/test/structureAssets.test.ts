import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
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
});
