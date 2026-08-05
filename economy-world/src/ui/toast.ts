/**
 * Toast + actionbar helpers — ui-design-system.md §5.
 * Short, high-contrast, narrator voice only.
 */
import type { Player } from "@minecraft/server";
import { Ink } from "./theme";

export type ToastKind = "gain" | "loss" | "caution" | "info" | "error";

const KIND_INK: Record<ToastKind, string> = {
  gain: Ink.gain,
  loss: Ink.loss,
  caution: Ink.caution,
  info: Ink.signalBlue,
  error: Ink.signalRed,
};

/** Top-of-screen one-liner (title + subtitle). */
export function toast(player: Player, message: string, kind: ToastKind = "info"): void {
  const color = KIND_INK[kind];
  player.onScreenDisplay.setTitle(`${color}${message}${Ink.reset}`, {
    fadeInDuration: 5,
    stayDuration: 40,
    fadeOutDuration: 10,
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
