/**
 * Physical-cash settlement rail for every player-selling flow.
 * Money enters the player's ledger account, immediately cashes out, then the
 * world adapter packs notes into a wallet or inventory.
 */
import type { Player } from "@minecraft/server";
import {
  cashOut,
  mint,
  transfer,
  type AccountId,
  type FaucetTag,
  type LedgerState,
} from "../core/ledger";
import { spawnCash } from "./cash";

function playerAccountId(player: Player): AccountId {
  return `p:${player.id}`;
}

export function paySaleCashFromAccount(
  ledger: LedgerState,
  player: Player,
  from: AccountId,
  amount: number,
  tick: number,
  tag: string
): void {
  const account = playerAccountId(player);
  transfer(ledger, from, account, amount, tick, tag);
  cashOut(ledger, account, amount, tick);
  spawnCash(player, amount);
}

export function paySaleCashFromMint(
  ledger: LedgerState,
  player: Player,
  amount: number,
  tick: number,
  tag: FaucetTag
): void {
  const account = playerAccountId(player);
  mint(ledger, account, amount, tick, tag);
  cashOut(ledger, account, amount, tick);
  spawnCash(player, amount);
}
