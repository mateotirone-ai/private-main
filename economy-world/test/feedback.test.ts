import { describe, expect, it } from "vitest";
import { npcSpeechLine } from "../src/ui/feedback";

describe("NPC feedback", () => {
  it("renders confirmations and denials as name-tagged chat", () => {
    expect(
      npcSpeechLine(
        "Sawmill Foreman",
        "I sell lumber — raw logs go to the Lumber Camp."
      )
    ).toBe(
      "§6[Sawmill Foreman]§r I sell lumber — raw logs go to the Lumber Camp."
    );
  });
});
