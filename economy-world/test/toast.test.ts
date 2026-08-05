import { describe, expect, it } from "vitest";
import { matrix } from "../src/content/matrix";
import { compactToastLine, formatToastText } from "../src/ui/toast";

describe("toast legibility", () => {
  it("shortens only at word boundaries", () => {
    const source = "Meridian remains professionally unimpressed by this transaction";
    const result = compactToastLine(source, 28);
    expect(result.length).toBeLessThanOrEqual(28);
    expect(result).toBe("Meridian remains…");
  });

  it("never clips an oversized first token", () => {
    expect(compactToastLine("Supercalifragilisticexpialidocious", 12)).toBe("Update");
    expect(formatToastText("SupercalifragilisticexpialidociousAndStillGoing")).toEqual({
      title: "Update",
    });
  });

  it("leaves already-short lines unchanged", () => {
    expect(compactToastLine("Payment received.", 28)).toBe("Payment received.");
  });

  it("fits one fixed-size subtitle line instead of using oversized title copy", () => {
    const formatted = formatToastText(
      "This deliberately long system message must stay inside the toast box"
    );
    expect(formatted.title.length).toBeLessThanOrEqual(
      matrix.ui.toast.maxChars
    );
    expect(formatted.subtitle).toBeUndefined();
  });
});
