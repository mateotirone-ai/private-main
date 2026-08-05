/**
 * Toast + actionbar helpers — ui-design-system.md §5.
 * Short, high-contrast, narrator voice only.
 */
import type { Player } from "@minecraft/server";
import { matrix } from "../content/matrix";
import {
  activeActionbarContext,
  type ActionbarContext,
} from "./hudMath";
import { cashChipText, layerOneDangerState } from "./hudMath";
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
const cashTitleBlockedUntil = new Map<string, number>();
export const CASH_HUD_PREFIX = "ewcash:";
let hudTickProvider: () => number = () => 0;

export function configureHudTickProvider(tickProvider: () => number): void {
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
  cashTitleBlockedUntil.set(
    player.id,
    hudTickProvider() +
      cfg.fadeInTicks +
      cfg.stayTicks +
      cfg.fadeOutTicks
  );
  player.onScreenDisplay.setTitle(`${Ink.reset} `, {
    subtitle: `${marker} ${Ink.paper}${lines.title}${Ink.reset}`,
    fadeInDuration: cfg.fadeInTicks,
    stayDuration: cfg.stayTicks,
    fadeOutDuration: cfg.fadeOutTicks,
  });
}

/** Hidden title update consumed by the persistent JSON-UI wallet chip. */
export function updateCashChip(player: Player, carriedCash: number): boolean {
  const tick = hudTickProvider();
  if ((cashTitleBlockedUntil.get(player.id) ?? 0) > tick) return false;
  const text = cashChipText(
    carriedCash,
    undefined,
    layerOneDangerState()
  );
  player.onScreenDisplay.setTitle(`${CASH_HUD_PREFIX}${text}`, {
    fadeInDuration: 0,
    stayDuration: 0,
    fadeOutDuration: 0,
  });
  return true;
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
  player.onScreenDisplay.setActionBar(
    selected
      ? `${KIND_INK[selected.kind]}${selected.message}${Ink.reset}`
      : ""
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

export function clearPlayerUiState(playerId: string): void {
  actionbarContexts.delete(playerId);
  cashTitleBlockedUntil.delete(playerId);
}
