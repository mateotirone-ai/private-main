/**
 * Toast + actionbar helpers — ui-design-system.md §5.
 * Short, high-contrast, narrator voice only.
 */
import type { Player } from "@minecraft/server";
import { matrix } from "../content/matrix";
import {
  activeActionbarContext,
  cashChipText,
  layerOneDangerState,
  type ActionbarContext,
} from "./hudMath";
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

interface StoredActionbarContext extends ActionbarContext {
  kind: ToastKind;
}

const actionbarContexts = new Map<
  string,
  Map<string, StoredActionbarContext>
>();
let carriedCashProvider: (player: Player) => number = () => 0;
let hudTickProvider: () => number = () => 0;

export function configureHudProviders(
  cashProvider: (player: Player) => number,
  tickProvider: () => number
): void {
  carriedCashProvider = cashProvider;
  hudTickProvider = tickProvider;
}

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

export function setActionbarContext(
  player: Player,
  key: string,
  message: string,
  kind: ToastKind = "info",
  expiresTick?: number
): void {
  let contexts = actionbarContexts.get(player.id);
  if (!contexts) {
    contexts = new Map();
    actionbarContexts.set(player.id, contexts);
  }
  contexts.set(key, {
    key,
    message,
    kind,
    priority: matrix.ui.hud.priorities[key] ?? matrix.ui.hud.priorities.default ?? 0,
    expiresTick,
  });
  refreshActionbar(player, hudTickProvider());
}

export function refreshActionbar(player: Player, tick: number): void {
  const contexts = actionbarContexts.get(player.id);
  if (contexts) {
    for (const [key, context] of contexts) {
      if (context.expiresTick !== undefined && context.expiresTick <= tick) {
        contexts.delete(key);
      }
    }
  }
  const selected = activeActionbarContext(
    [...(contexts?.values() ?? [])],
    tick
  ) as StoredActionbarContext | undefined;
  const chip = cashChipText(
    carriedCashProvider(player),
    undefined,
    layerOneDangerState()
  );
  const context = selected
    ? ` ${Ink.reset}· ${KIND_INK[selected.kind]}${selected.message}`
    : "";
  player.onScreenDisplay.setActionBar(
    `${Ink.gold}${chip}${context}${Ink.reset}`
  );
}

/** Backward-compatible default context. New call sites should use a named key. */
export function actionbar(
  player: Player,
  message: string,
  kind: ToastKind = "info"
): void {
  setActionbarContext(player, "default", message, kind);
}

export function clearActionbar(player: Player, key?: string): void {
  if (key) actionbarContexts.get(player.id)?.delete(key);
  else actionbarContexts.delete(player.id);
  refreshActionbar(player, hudTickProvider());
}
