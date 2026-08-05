import { describe, expect, it } from "vitest";
import { matrix } from "../src/content/matrix";
import {
  CASH_HUD_PREFIX,
  compactToastLine,
  configureHudTickProvider,
  formatToastText,
  toast,
  updateCashChip,
} from "../src/ui/toast";

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

  it("feeds cash through a hidden title without interrupting active toasts", () => {
    let tick = 10;
    const titles: string[] = [];
    const player = {
      id: "hud-test",
      onScreenDisplay: {
        setTitle: (title: string) => titles.push(title),
      },
    };
    configureHudTickProvider(() => tick);
    expect(updateCashChip(player as never, 125)).toBe(true);
    expect(titles.at(-1)).toBe(`${CASH_HUD_PREFIX}Cash 125`);
    toast(player as never, "Receipt visible", "gain");
    expect(updateCashChip(player as never, 200)).toBe(false);
    tick +=
      matrix.ui.toast.fadeInTicks +
      matrix.ui.toast.stayTicks +
      matrix.ui.toast.fadeOutTicks;
    expect(updateCashChip(player as never, 200)).toBe(true);
    expect(titles.at(-1)).toBe(`${CASH_HUD_PREFIX}Cash 200`);
  });
});
