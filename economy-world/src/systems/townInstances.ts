/**
 * Persisted town seed instances — idempotent reseeding at an anchor.
 */
import { loadBlob, saveBlob } from "../core/state";
import type { StructureMirror } from "../content/structures";
import type { SeedMode } from "./townSeedMath";

export interface TownInstance {
  id: string;
  layoutId: string;
  dimensionId: string;
  anchor: { x: number; y: number; z: number };
  rotationSteps: 0 | 1 | 2 | 3;
  mirror: StructureMirror;
  mode: SeedMode;
  parcelIds: string[];
  filledSlots: Array<{ index: number; structureId: string | null }>;
  surveyFloor?: {
    origin: { x: number; y: number; z: number };
    width: number;
    depth: number;
  };
}

export interface TownInstancesState {
  schema: 1;
  byId: Record<string, TownInstance>;
}

const KEY = "ew:town_instances";

export function emptyTownInstances(): TownInstancesState {
  return { schema: 1, byId: {} };
}

export function loadTownInstances(): TownInstancesState {
  const state = loadBlob<TownInstancesState>(KEY);
  if (!state || state.schema !== 1) return emptyTownInstances();
  state.byId ??= {};
  return state;
}

export function saveTownInstances(state: TownInstancesState): void {
  saveBlob(KEY, state);
}

export function findTownAtAnchor(
  state: TownInstancesState,
  id: string
): TownInstance | undefined {
  return state.byId[id];
}

export function upsertTownInstance(
  state: TownInstancesState,
  instance: TownInstance
): void {
  state.byId[instance.id] = instance;
}
