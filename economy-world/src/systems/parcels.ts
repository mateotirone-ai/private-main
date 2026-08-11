/**
 * Land parcel registry persistence — dynamic-property backed.
 */
import { loadBlob, saveBlob } from "../core/state";
import {
  emptyParcels,
  type ParcelsState,
} from "./parcelRegistry";

export * from "./parcelRegistry";

const KEY = "ew:parcels";

export function loadParcels(): ParcelsState {
  const state = loadBlob<ParcelsState>(KEY);
  if (!state || state.schema !== 1) return emptyParcels();
  state.byId ??= {};
  state.byTown ??= {};
  return state;
}

export function saveParcels(state: ParcelsState): void {
  saveBlob(KEY, state);
}
