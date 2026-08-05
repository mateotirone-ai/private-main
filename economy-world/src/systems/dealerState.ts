/** Dealer daily volume — resets each game day. */
import { saveBlob, loadBlob } from "../core/state";
import type { PreciousGood } from "../content/matrix";

export interface DealerState {
  schema: 1;
  /** minecraft day index last reset (tick / 24000) */
  day: number;
  soldToday: Record<PreciousGood, number>;
}

const KEY = "ew:dealer";

export function emptyDealerState(day = 0): DealerState {
  return { schema: 1, day, soldToday: { gold: 0, diamond: 0 } };
}

export function loadDealerState(): DealerState {
  return loadBlob<DealerState>(KEY) ?? emptyDealerState();
}

export function saveDealerState(s: DealerState): void {
  saveBlob(KEY, s);
}

/** Ensure soldToday is for the current game day. */
export function rollDealerDay(s: DealerState, tick: number): void {
  const day = Math.floor(tick / 24000);
  if (day !== s.day) {
    s.day = day;
    s.soldToday = { gold: 0, diamond: 0 };
  }
}
