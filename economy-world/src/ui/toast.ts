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
  const sentenceEnd = clean.search(/[.!?](?:\s|$)/);
  const splitAt =
    sentenceEnd >= 0 && sentenceEnd + 1 <= cfg.maxTitleChars
      ? sentenceEnd + 1
      : clean.lastIndexOf(" ", cfg.maxTitleChars);
  if (splitAt <= 0) {
    return { title: compactToastLine(clean, cfg.maxTitleChars) };
  }
  const title = compactToastLine(clean.slice(0, splitAt), cfg.maxTitleChars);
  const rest = clean.slice(splitAt).trim();
  return {
    title,
    subtitle: rest ? compactToastLine(rest, cfg.maxSubtitleChars) : undefined,
  };
}

/** High-contrast, couch-legible title + optional short subtitle. */
export function toast(player: Player, message: string, kind: ToastKind = "info"): void {
  const color = KIND_INK[kind];
  const cfg = matrix.ui.toast;
  const lines = formatToastText(message);
  player.onScreenDisplay.setTitle(`${Ink.bold}${color}${lines.title}${Ink.reset}`, {
    subtitle: lines.subtitle ? `${Ink.paper}${lines.subtitle}${Ink.reset}` : undefined,
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
