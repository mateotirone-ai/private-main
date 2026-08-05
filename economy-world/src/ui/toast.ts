/**
 * Toast + actionbar helpers — ui-design-system.md §5.
 * Short, high-contrast, narrator voice only.
 */
import type { Player } from "@minecraft/server";
import { matrix } from "../content/matrix";
import { Ink } from "./theme";

export type ToastKind = "gain" | "loss" | "caution" | "info" | "error";

const KIND_INK: Record<ToastKind, string> = {
  gain: Ink.gain,
  loss: Ink.loss,
  caution: Ink.caution,
  info: Ink.signalBlue,
  error: Ink.signalRed,
};

const KIND_MARK: Record<ToastKind, string> = {
  gain: "+",
  loss: "−",
  caution: "!",
  info: "•",
  error: "!",
};

export function compactToastLine(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const words = clean.split(" ");
  let result = "";
  for (const word of words) {
    const next = result ? `${result} ${word}` : word;
    if (`${next}…`.length > max) break;
    result = next;
  }
  // Never clip a word. If the first token itself is too long, use a short,
  // complete fallback rather than slicing the token.
  return result ? `${result}…` : "Update";
}

export function formatToastText(message: string): { title: string; subtitle?: string } {
  const cfg = matrix.ui.toast;
  const clean = message.replace(/\s+/g, " ").trim();
  return { title: compactToastLine(clean, cfg.maxChars) };
}

/**
 * Subtitle-only toast. Bedrock title text is intrinsically oversized; keeping
 * the title blank prevents scaling past the toast box.
 */
export function toast(player: Player, message: string, kind: ToastKind = "info"): void {
  const color = KIND_INK[kind];
  const cfg = matrix.ui.toast;
  const lines = formatToastText(message);
  const marker = `${color}${KIND_MARK[kind]}${Ink.reset}`;
  player.onScreenDisplay.setTitle(`${Ink.reset} `, {
    subtitle: `${marker} ${Ink.paper}${lines.title}${Ink.reset}`,
    fadeInDuration: cfg.fadeInTicks,
    stayDuration: cfg.stayTicks,
    fadeOutDuration: cfg.fadeOutTicks,
  });
}

/** Persistent contextual actionbar line. */
export function actionbar(player: Player, message: string, kind: ToastKind = "info"): void {
  const color = KIND_INK[kind];
  player.onScreenDisplay.setActionBar(`${color}${message}${Ink.reset}`);
}

export function clearActionbar(player: Player): void {
  player.onScreenDisplay.setActionBar("");
}
