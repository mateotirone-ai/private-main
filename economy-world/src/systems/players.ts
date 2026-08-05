/** Per-player flags — layer1 §3 ew:players (Phase G onboarding milestones). */
import { saveBlob, loadBlob } from "../core/state";

export interface PlayerRec {
  stipendClaimed: boolean;
  walletGranted: boolean;
  checklistShown: boolean;
  jobBoardVisited: boolean;
  clockedIn: boolean;
  firstOutput: boolean;
  firstPaycheckClaimed: boolean;
}

export interface PlayersState {
  schema: 2;
  byId: Record<string, PlayerRec>;
}

const KEY = "ew:players";

export function emptyPlayers(): PlayersState {
  return { schema: 2, byId: {} };
}

export function loadPlayers(): PlayersState {
  const state = loadBlob<PlayersState>(KEY) ?? emptyPlayers();
  state.schema = 2;
  for (const id of Object.keys(state.byId)) {
    state.byId[id] = normalizeRec(state.byId[id]);
  }
  return state;
}

export function savePlayers(s: PlayersState): void {
  saveBlob(KEY, s);
}

export function playerRec(s: PlayersState, playerId: string): PlayerRec {
  if (!s.byId[playerId]) s.byId[playerId] = emptyPlayerRec();
  s.byId[playerId] = normalizeRec(s.byId[playerId]);
  return s.byId[playerId];
}

export function emptyPlayerRec(): PlayerRec {
  return {
    stipendClaimed: false,
    walletGranted: false,
    checklistShown: false,
    jobBoardVisited: false,
    clockedIn: false,
    firstOutput: false,
    firstPaycheckClaimed: false,
  };
}

function normalizeRec(rec: Partial<PlayerRec> | undefined): PlayerRec {
  return {
    stipendClaimed: rec?.stipendClaimed ?? false,
    walletGranted: rec?.walletGranted ?? false,
    checklistShown: rec?.checklistShown ?? false,
    jobBoardVisited: rec?.jobBoardVisited ?? false,
    clockedIn: rec?.clockedIn ?? false,
    firstOutput: rec?.firstOutput ?? false,
    firstPaycheckClaimed: rec?.firstPaycheckClaimed ?? false,
  };
}
