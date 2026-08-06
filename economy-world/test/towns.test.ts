import { describe, expect, it } from "vitest";
import { allTradeIds } from "../src/content/trades";
import { allTowns, defaultTownId, townManifest } from "../src/content/towns";

describe("town manifests", () => {
  it("exposes a default town and required civic hosts", () => {
    const town = townManifest(defaultTownId());
    expect(town).toBeTruthy();
    expect(town?.civics.map((host) => host.roleTag).sort()).toEqual(
      ["ew:npc_bank", "ew:npc_commons", "ew:npc_dealer", "ew:npc_jobs"].sort()
    );
  });

  it("covers all trades with storefronts and extraction/public zones", () => {
    const town = townManifest(defaultTownId());
    if (!town) throw new Error("missing default town");
    const storefrontTrades = new Set(town.storefronts.map((entry) => entry.trade));
    expect([...storefrontTrades].sort()).toEqual(allTradeIds().sort());

    const employeeZones = town.workZones.filter((entry) => !entry.public);
    const publicZones = town.workZones.filter((entry) => entry.public);
    expect(employeeZones.length).toBeGreaterThanOrEqual(6);
    expect(publicZones.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique town ids", () => {
    const ids = allTowns().map((town) => town.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("defines street polylines and frontage metadata for layout slots", () => {
    const town = townManifest(defaultTownId());
    if (!town?.layout) throw new Error("missing default town layout");
    expect(town.layout.streetPolylines.length).toBeGreaterThan(0);
    expect(town.layout.streetPolylines.every((street) => street.points.length >= 2)).toBe(true);
    expect(town.layout.slots.some((slot) => Boolean(slot.trade))).toBe(true);
    expect(
      town.layout.slots.every((slot) =>
        ["north", "east", "south", "west"].includes(slot.frontage)
      )
    ).toBe(true);
  });
});
