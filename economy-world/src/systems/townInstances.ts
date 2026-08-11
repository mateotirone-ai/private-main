/**
 * Persisted town seed instances — idempotent reseeding + expansions.
 */
import { loadBlob, saveBlob } from "../core/state";
import { balance, mint, type LedgerState } from "../core/ledger";
import type { StructureMirror } from "../content/structures";
import {
  townTreasuryAccount,
  type ExpansionRecord,
  type GrowthPointRecord,
} from "./expansionMath";
import type { SeedMode } from "./townSeedMath";

export { townTreasuryAccount };

export interface TownInstance {
  id: string;
  layoutId: string;
  dimensionId: string;
  anchor: { x: number; y: number; z: number };
  rotationSteps: 0 | 1 | 2 | 3;
  mirror: StructureMirror;
  mode: SeedMode;
  leaderPlayerId: string | null;
  parcelIds: string[];
  filledSlots: Array<{ index: number; structureId: string | null }>;
  growthPoints: GrowthPointRecord[];
  expansions: ExpansionRecord[];
  wallsExist: boolean;
  surveyFloor?: {
    origin: { x: number; y: number; z: number };
    width: number;
    depth: number;
  };
}

export interface TownInstancesState {
  schema: 2;
  byId: Record<string, TownInstance>;
}

const KEY = "ew:town_instances";

export function emptyTownInstances(): TownInstancesState {
  return { schema: 2, byId: {} };
}

function ensureDefaults(instance: TownInstance): void {
  instance.leaderPlayerId ??= null;
  instance.growthPoints ??= [];
  instance.expansions ??= [];
  instance.wallsExist ??= false;
  instance.parcelIds ??= [];
  instance.filledSlots ??= [];
}

export function loadTownInstances(): TownInstancesState {
  const state = loadBlob<TownInstancesState>(KEY);
  if (!state) return emptyTownInstances();
  state.schema = 2;
  state.byId ??= {};
  for (const instance of Object.values(state.byId)) ensureDefaults(instance);
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
  ensureDefaults(instance);
  state.byId[instance.id] = instance;
}

export function findTownForPlayer(
  state: TownInstancesState,
  preferId?: string
): TownInstance | undefined {
  if (preferId) {
    const direct =
      state.byId[preferId] ??
      Object.values(state.byId).find(
        (t) => t.id === preferId || t.layoutId === preferId
      );
    if (direct) return direct;
  }
  return Object.values(state.byId).find((t) => t.mode !== "survey");
}

export function ensureTownTreasury(
  ledger: LedgerState,
  townId: string,
  amount: number,
  tick: number
): void {
  const acct = townTreasuryAccount(townId);
  const bal = balance(ledger, acct);
  if (bal >= amount) return;
  mint(ledger, acct, amount - bal, tick, "mint:system");
}
