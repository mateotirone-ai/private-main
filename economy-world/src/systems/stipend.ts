/**
 * One-time settler's stipend at tutorial exit — layer1 §4.4 stub.
 * Amount from data/matrix.json. Mint tag: mint:stipend.
 */
import type { Player } from "@minecraft/server";
import { cashOut, mint, type LedgerState } from "../core/ledger";
import { stipendAmount } from "../content/matrix";
import { currentTick } from "../core/scheduler";
import { money } from "../ui/theme";
import { Voice } from "../ui/voice";
import { toast } from "../ui/toast";
import { loadPlayers, savePlayers, playerRec } from "./players";
import { playerAccount } from "./bank";
import { ensureWallet, spawnCash } from "./cash";

export function claimStipend(player: Player, ledger: LedgerState): void {
  const players = loadPlayers();
  const rec = playerRec(players, player.id);
  if (rec.stipendClaimed) {
    toast(player, Voice.stipendAlready, "caution");
    return;
  }
  const amt = stipendAmount();
  const tick = currentTick();
  ensureWallet(player);
  mint(ledger, playerAccount(player), amt, tick, "mint:stipend");
  cashOut(ledger, playerAccount(player), amt, tick);
  spawnCash(player, amt);
  rec.stipendClaimed = true;
  rec.walletGranted = true;
  savePlayers(players);
  toast(player, Voice.stipendOk(money(amt)), "gain");
}
