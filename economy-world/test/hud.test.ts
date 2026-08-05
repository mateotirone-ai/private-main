import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { carriedCashTotal } from "../src/systems/bankMath";
import {
  activeActionbarContext,
  cashChipText,
  layerOneDangerState,
} from "../src/ui/hudMath";
import { CASH_HUD_PREFIX } from "../src/ui/toast";

describe("Phase F HUD policy", () => {
  it("shows physical cash only and never accepts a bank balance", () => {
    expect(cashChipText(125)).toBe("Cash 125");
    expect(cashChipText(-1)).toBe("Cash 0");
    expect(carriedCashTotal(25, 100)).toBe(125);
  });

  it("merges a persistent cash-only title bridge into the HUD root", () => {
    const ui = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "packs/economy_rp/ui/hud_screen.json"),
        "utf8"
      )
    );
    const modification = ui.root_panel.modifications.find(
      (entry: { array_name: string }) => entry.array_name === "controls"
    );
    expect(
      modification.value["ew_wallet_chip@hud.ew_wallet_chip"]
    ).toEqual({});
    expect(ui.ew_wallet_chip.$cash_update_prefix).toBe(CASH_HUD_PREFIX);
    const dataBindings =
      ui.ew_wallet_chip.controls[0].cash_data.bindings;
    expect(dataBindings[0]).toMatchObject({
      binding_name: "#hud_title_text_string",
      binding_type: "global",
    });
    expect(dataBindings[1]).toMatchObject({
      binding_name_override: "#preserved_cash_text",
      binding_condition: "visibility_changed",
    });
    expect(ui.ew_wallet_chip.bindings[0]).toMatchObject({
      source_control_name: "cash_data",
      target_property_name: "#text",
    });
    expect(JSON.stringify(ui.ew_wallet_chip)).not.toContain(
      "$actionbar_text"
    );
  });

  it("selects one highest-priority unexpired context", () => {
    expect(
      activeActionbarContext(
        [
          { key: "employment", message: "earned 4", priority: 60 },
          {
            key: "service",
            message: "customer waiting",
            priority: 80,
            expiresTick: 50,
          },
        ],
        20
      )?.key
    ).toBe("service");
    expect(
      activeActionbarContext(
        [
          { key: "employment", message: "earned 4", priority: 60 },
          {
            key: "service",
            message: "customer waiting",
            priority: 80,
            expiresTick: 50,
          },
        ],
        50
      )?.key
    ).toBe("employment");
  });

  it("keeps the danger glyph input off in Layer 1", () => {
    expect(layerOneDangerState()).toBe(false);
    expect(cashChipText(10, "working", false)).not.toContain("☠");
  });
});
