/**
 * Global form show with UserBusy retry.
 *
 * Bedrock silently cancels forms while the player is mid-interact / in chat
 * (cancelationReason === UserBusy). Retry every few ticks for ~5s before giving up.
 *
 * BINDING: every form open in this codebase MUST go through safeShow.
 * Direct form.show() is banned.
 */
import { system, type Player } from "@minecraft/server";
import type { FormResponse } from "@minecraft/server-ui";
import {
  SAFE_SHOW_MAX_WAIT_TICKS,
  SAFE_SHOW_RETRY_TICKS,
  safeShowLoop,
} from "./safeShowPolicy";

export {
  SAFE_SHOW_MAX_WAIT_TICKS,
  SAFE_SHOW_RETRY_TICKS,
  isUserBusy,
  userBusyRetryDelay,
  safeShowLoop,
} from "./safeShowPolicy";

export interface ShowableForm<T extends FormResponse> {
  show(player: Player): Promise<T>;
}

function sleepTicks(ticks: number): Promise<void> {
  return new Promise((resolve) => {
    system.runTimeout(() => resolve(), ticks);
  });
}

/** Production entry — the only allowed way to open a Bedrock form. */
export async function safeShow<T extends FormResponse>(
  player: Player,
  form: ShowableForm<T>
): Promise<T> {
  return safeShowLoop(() => form.show(player), sleepTicks, {
    onGiveUp: () =>
      console.warn(`[ew] safeShow gave up after UserBusy (~${SAFE_SHOW_MAX_WAIT_TICKS} ticks)`),
  });
}
