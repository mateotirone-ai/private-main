/**
 * Pure UserBusy retry policy (no Minecraft imports — unit-testable in Node).
 */

/** Matches FormCancelationReason.UserBusy */
export const USER_BUSY = "UserBusy";

/** Retry every 5 ticks (0.25s). */
export const SAFE_SHOW_RETRY_TICKS = 5;
/** Give up after ~5 seconds. */
export const SAFE_SHOW_MAX_WAIT_TICKS = 100;

export function isUserBusy(canceled: boolean, reason: string | undefined): boolean {
  return canceled && reason === USER_BUSY;
}

/** Returns ticks to wait before next attempt, or null to stop retrying. */
export function userBusyRetryDelay(
  waitedTicks: number,
  retryTicks = SAFE_SHOW_RETRY_TICKS,
  maxWaitTicks = SAFE_SHOW_MAX_WAIT_TICKS
): number | null {
  if (waitedTicks >= maxWaitTicks) return null;
  return retryTicks;
}

/** Injectable show/sleep loop — production wraps this with Bedrock APIs. */
export async function safeShowLoop<T extends { canceled: boolean; cancelationReason?: string }>(
  showOnce: () => Promise<T>,
  sleep: (ticks: number) => Promise<void>,
  opts: { retryTicks?: number; maxWaitTicks?: number; onGiveUp?: () => void } = {}
): Promise<T> {
  const retryTicks = opts.retryTicks ?? SAFE_SHOW_RETRY_TICKS;
  const maxWaitTicks = opts.maxWaitTicks ?? SAFE_SHOW_MAX_WAIT_TICKS;
  let waited = 0;

  while (true) {
    const res = await showOnce();
    if (!isUserBusy(res.canceled, res.cancelationReason)) return res;

    const delay = userBusyRetryDelay(waited, retryTicks, maxWaitTicks);
    if (delay === null) {
      opts.onGiveUp?.();
      return res;
    }
    await sleep(delay);
    waited += delay;
  }
}
