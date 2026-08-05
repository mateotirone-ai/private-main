import { describe, expect, it } from "vitest";
import { dialogueConfig } from "../src/content/dialogue";
import {
  dialogueTemplate,
  personalityFromTags,
  renderDialogueTemplate,
} from "../src/systems/dialogueMath";

describe("NPC dialogue v1", () => {
  const slots = {
    good: "bread",
    price: "5",
    playerName: "Mateo",
    ownerName: "Meridian",
    stock: "12",
    recentEvent: "the bakery upgraded",
  };

  it("renders all live state slots", () => {
    const rendered = renderDialogueTemplate(
      "{playerName}: {good} {price} {ownerName} {stock} {recentEvent}",
      slots
    );
    expect(rendered).toBe(
      "Mateo: bread 5 Meridian 12 the bakery upgraded"
    );
  });

  it("filters personalities by entity tag with a safe fallback", () => {
    expect(
      personalityFromTags(["ew:personality_wry"], dialogueConfig)
    ).toBe("wry");
    expect(
      personalityFromTags(["ew:personality_unknown"], dialogueConfig)
    ).toBe(dialogueConfig.fallbackPersonality);
  });

  it("selects role templates and substitutes recent world state", () => {
    const template = dialogueTemplate(
      dialogueConfig,
      "shop",
      "neighborly",
      () => 0
    );
    const line = renderDialogueTemplate(template, {
      ...slots,
      recentEvent: "Mateo bought the bakery",
    });
    expect(line).toContain("bread");
    expect(template).toContain("{good}");
  });
});
