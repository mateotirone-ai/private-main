/**
 * One-time settler's stipend at tutorial exit — layer1 §4.4 stub.
 * Amount from data/matrix.json. Mint tag: mint:stipend.
 */
import type { Player } from "@minecraft/server";
import { mint, type LedgerState } from "../core/ledger";
import { stipendAmount } from "../content/matrix";
import { currentTick } from "../core/scheduler";
import { money } from "../ui/theme";
import { Voice } from "../ui/voice";
import { toast } from "../ui/toast";
import { loadPlayers, savePlayers, playerRec } from "./players";
import { playerAccount } from "./bank";

export function claimStipend(player: Player, ledger: LedgerState): void {
  const players = loadPlayers();
  const rec = playerRec(players, player.id);
  if (rec.stipendClaimed) {
    toast(player, Voice.stipendAlready, "caution");
    return;
  }
  const amt = stipendAmount();
  mint(ledger, playerAccount(player), amt, currentTick(), "mint:stipend");
  rec.stipendClaimed = true;
  savePlayers(players);
  toast(player, Voice.stipendOk(money(amt)), "gain");
}
