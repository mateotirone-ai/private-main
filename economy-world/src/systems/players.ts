/** Per-player flags — layer1 §3 ew:players (Phase B: stipendClaimed only). */
import { saveBlob, loadBlob } from "../core/state";

export interface PlayerRec {
  stipendClaimed: boolean;
}

export interface PlayersState {
  schema: 1;
  byId: Record<string, PlayerRec>;
}

const KEY = "ew:players";

export function emptyPlayers(): PlayersState {
  return { schema: 1, byId: {} };
}

export function loadPlayers(): PlayersState {
  return loadBlob<PlayersState>(KEY) ?? emptyPlayers();
}

export function savePlayers(s: PlayersState): void {
  saveBlob(KEY, s);
}

export function playerRec(s: PlayersState, playerId: string): PlayerRec {
  if (!s.byId[playerId]) s.byId[playerId] = { stipendClaimed: false };
  return s.byId[playerId]!;
}
