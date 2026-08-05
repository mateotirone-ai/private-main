import { describe, expect, it } from "vitest";
import {
  createCustomerRequest,
  rollRequestQty,
  serviceOrderTotal,
} from "../src/systems/serviceMath";

describe("service customer needs", () => {
  it("attaches bakery needs to the exact tagged host", () => {
    const request = createCustomerRequest(
      {
        id: "entity:bakery-host",
        trade: "bakery",
        businessId: "cpu_bakery",
        dimensionId: "minecraft:overworld",
        location: { x: 1, y: 64, z: 2 },
        speaker: "Bakery",
      },
      "bread",
      2,
      600
    );
    expect(request).toEqual({
      hostId: "entity:bakery-host",
      trade: "bakery",
      businessId: "cpu_bakery",
      good: "bread",
      qty: 2,
      createdTick: 600,
    });
  });

  it("rounds the complete customer order once", () => {
    expect(serviceOrderTotal(7, 2, 0.2)).toBe(Math.round(7 * 2 * 1.2));
  });

  it("rolls normal and large orders from configured ranges", () => {
    expect(
      rollRequestQty(
        {
          minQty: 1,
          maxQty: 4,
          largeOrderChance: 0,
          largeMinQty: 6,
          largeMaxQty: 10,
        },
        () => 0.99
      )
    ).toBe(4);
    expect(
      rollRequestQty(
        {
          minQty: 1,
          maxQty: 4,
          largeOrderChance: 1,
          largeMinQty: 6,
          largeMaxQty: 10,
        },
        () => 0
      )
    ).toBe(6);
  });
});
