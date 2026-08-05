import { describe, it, expect, vi } from "vitest";
import {
  isUserBusy,
  userBusyRetryDelay,
  safeShowLoop,
  SAFE_SHOW_RETRY_TICKS,
  SAFE_SHOW_MAX_WAIT_TICKS,
  USER_BUSY,
} from "../src/ui/safeShowPolicy";

describe("safeShow UserBusy retry policy", () => {
  it("detects UserBusy cancels only", () => {
    expect(isUserBusy(true, USER_BUSY)).toBe(true);
    expect(isUserBusy(true, "UserClosed")).toBe(false);
    expect(isUserBusy(false, USER_BUSY)).toBe(false);
    expect(isUserBusy(true, undefined)).toBe(false);
  });

  it("retries until max wait, then stops", () => {
    expect(userBusyRetryDelay(0)).toBe(SAFE_SHOW_RETRY_TICKS);
    expect(userBusyRetryDelay(SAFE_SHOW_MAX_WAIT_TICKS - 1)).toBe(SAFE_SHOW_RETRY_TICKS);
    expect(userBusyRetryDelay(SAFE_SHOW_MAX_WAIT_TICKS)).toBeNull();
  });

  it("retries on UserBusy then returns the successful show", async () => {
    const sleep = vi.fn(async () => {});
    let calls = 0;
    const showOnce = vi.fn(async () => {
      calls += 1;
      if (calls < 3) return { canceled: true, cancelationReason: USER_BUSY };
      return { canceled: false, selection: 0 };
    });

    const res = await safeShowLoop(showOnce, sleep, { retryTicks: 2, maxWaitTicks: 10 });
    expect(res).toEqual({ canceled: false, selection: 0 });
    expect(showOnce).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2);
  });

  it("does not retry UserClosed", async () => {
    const sleep = vi.fn(async () => {});
    const showOnce = vi.fn(async () => ({
      canceled: true,
      cancelationReason: "UserClosed",
    }));
    const res = await safeShowLoop(showOnce, sleep);
    expect(res.cancelationReason).toBe("UserClosed");
    expect(showOnce).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("gives up after max wait", async () => {
    const sleep = vi.fn(async () => {});
    const onGiveUp = vi.fn();
    const showOnce = vi.fn(async () => ({
      canceled: true,
      cancelationReason: USER_BUSY,
    }));
    const res = await safeShowLoop(showOnce, sleep, {
      retryTicks: 5,
      maxWaitTicks: 10,
      onGiveUp,
    });
    expect(res.canceled).toBe(true);
    expect(onGiveUp).toHaveBeenCalledOnce();
    // waited 0 → sleep 5 (waited=5) → sleep 5 (waited=10) → stop
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(showOnce).toHaveBeenCalledTimes(3);
  });
});
