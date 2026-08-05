/**
 * Fort Knox reserve tracking — layer1 §3 ew:reserve.
 * Circulation is derived from the ledger at audit time; we store commodity units.
 */
import { saveBlob, loadBlob } from "../core/state";
import type { PreciousGood } from "../content/matrix";

export interface ReserveState {
  schema: 1;
  goldUnits: number;
  diamondUnits: number;
}

const KEY = "ew:reserve";

export function emptyReserve(): ReserveState {
  return { schema: 1, goldUnits: 0, diamondUnits: 0 };
}

export function loadReserve(): ReserveState {
  return loadBlob<ReserveState>(KEY) ?? emptyReserve();
}

export function saveReserve(r: ReserveState): void {
  saveBlob(KEY, r);
}

export function addReserve(r: ReserveState, good: PreciousGood, qty: number): void {
  if (!Number.isInteger(qty) || qty <= 0) throw new Error(`invalid reserve qty: ${qty}`);
  if (good === "gold") r.goldUnits += qty;
  else r.diamondUnits += qty;
}
