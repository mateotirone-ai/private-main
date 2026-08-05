import { describe, expect, it } from "vitest";
import {
  createCustomerRequest,
  serviceOrderTotal,
} from "../src/systems/serviceMath";

describe("service customer needs", () => {
  it("attaches bakery needs to the exact tagged host", () => {
    const request = createCustomerRequest(
      { id: "entity:bakery-host", trade: "bakery" },
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
});
