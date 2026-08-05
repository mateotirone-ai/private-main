import type { Player } from "@minecraft/server";
import { clearActionbar, setActionbarContext, toast } from "../ui/toast";
import { cashOut, mint, type LedgerState } from "../core/ledger";
import { currentTick } from "../core/scheduler";
import { stipendAmount } from "../content/matrix";
import { money } from "../ui/theme";
import { ensureWallet, spawnCash } from "./cash";
import { playerAccount } from "./bank";
import { loadPlayers, playerRec, savePlayers, type PlayerRec } from "./players";
import {
  onboardingChecklistLine,
  onboardingComplete,
} from "./onboardingMath";

function refreshChecklist(player: Player, rec: PlayerRec): void {
  const message = onboardingChecklistLine(rec);
  if (!message) {
    clearActionbar(player, "onboarding");
    return;
  }
  setActionbarContext(player, "onboarding", message, "info");
}

function saveWithChecklist(player: Player, rec: PlayerRec): void {
  refreshChecklist(player, rec);
}

export function ensureFirstJoinOnboarding(
  player: Player,
  ledger: LedgerState
): void {
  const players = loadPlayers();
  const rec = playerRec(players, player.id);
  let changed = false;
  if (!rec.walletGranted) {
    ensureWallet(player);
    rec.walletGranted = true;
    changed = true;
  }
  if (!rec.stipendClaimed) {
    const amount = stipendAmount();
    const tick = currentTick();
    mint(ledger, playerAccount(player), amount, tick, "mint:stipend");
    cashOut(ledger, playerAccount(player), amount, tick);
    spawnCash(player, amount);
    rec.stipendClaimed = true;
    changed = true;
    toast(player, `Welcome to Meridian. Stipend issued: ${money(amount)}.`, "gain");
  }
  if (!rec.checklistShown) {
    rec.checklistShown = true;
    changed = true;
  }
  saveWithChecklist(player, rec);
  if (changed) savePlayers(players);
}

function markFlag(player: Player, updater: (rec: PlayerRec) => boolean): void {
  const players = loadPlayers();
  const rec = playerRec(players, player.id);
  if (!updater(rec)) return;
  saveWithChecklist(player, rec);
  savePlayers(players);
}

export function noteOnboardingJobBoard(player: Player): void {
  markFlag(player, (rec) => {
    if (rec.jobBoardVisited) return false;
    rec.jobBoardVisited = true;
    return true;
  });
}

export function noteOnboardingClockIn(player: Player): void {
  markFlag(player, (rec) => {
    if (rec.clockedIn) return false;
    rec.clockedIn = true;
    return true;
  });
}

export function noteOnboardingOutput(player: Player): void {
  markFlag(player, (rec) => {
    if (rec.firstOutput) return false;
    rec.firstOutput = true;
    return true;
  });
}

export function noteOnboardingPaycheck(player: Player): void {
  markFlag(player, (rec) => {
    if (rec.firstPaycheckClaimed) return false;
    rec.firstPaycheckClaimed = true;
    if (onboardingComplete(rec)) {
      toast(player, "Checklist complete. First paycheck secured.", "gain");
    }
    return true;
  });
}
