import { describe, expect, it } from "vitest";
import { storefrontOwnershipAction } from "../src/systems/storefrontPolicy";

describe("storefront ownership entry", () => {
  it("offers CPU businesses for buyout", () => {
    expect(storefrontOwnershipAction("cpu", "player")).toBe("buyout");
  });

  it("offers management only to the owner", () => {
    expect(storefrontOwnershipAction("player", "player")).toBe("manage");
    expect(storefrontOwnershipAction("other", "player")).toBeUndefined();
  });
});
