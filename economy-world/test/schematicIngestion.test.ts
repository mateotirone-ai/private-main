import { describe, expect, it } from "vitest";
import {
  appendRegistryEntryIfMissing,
  trueFootprintWithMargin,
} from "../tools/ingest-schematics.mjs";

describe("schematic registry ingestion", () => {
  it("derives the non-air footprint with one block of margin on every side", () => {
    const blocks = Array(24).fill(undefined);
    blocks[5] = { name: "minecraft:stone" };
    blocks[22] = { name: "minecraft:stone" };

    expect(trueFootprintWithMargin(blocks, 4, 3)).toEqual([4, 4]);
  });

  it("auto-adds a catalog row with unresolved anchors", () => {
    const registry = { structures: [] as Array<Record<string, unknown>> };

    expect(
      appendRegistryEntryIfMissing(
        registry,
        "ew:mediterranean_villa",
        [22, 18]
      )
    ).toBe(true);
    expect(registry.structures[0]).toEqual({
      id: "ew:mediterranean_villa",
      padSize: [22, 18],
      anchor: "front-left-pad-corner",
      anchorOffset: [0, 0, 0],
      front: "south",
      gateOffset: "TODO",
      npcAnchors: {
        storefront: "TODO",
        office: "TODO",
      },
      zones: {},
    });
  });

  it("never modifies an existing registry row", () => {
    const existing = {
      id: "ew:mediterranean_villa",
      padSize: [99, 77],
      front: "north",
      gateOffset: [1, 2, 3],
    };
    const registry = { structures: [existing] };

    expect(
      appendRegistryEntryIfMissing(
        registry,
        "ew:mediterranean_villa",
        [22, 18]
      )
    ).toBe(false);
    expect(registry.structures).toEqual([existing]);
  });
});
