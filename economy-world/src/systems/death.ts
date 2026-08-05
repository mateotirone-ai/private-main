import type { Player } from "@minecraft/server";
import { balance, sink, type LedgerState } from "../core/ledger";
import { loadBlob, saveBlob } from "../core/state";
import { matrix } from "../content/matrix";
import { formatAmount } from "../ui/theme";
import { toast } from "../ui/toast";
import { playerAccount } from "./bank";
import { countCarriedCash } from "./cash";
import {
  medicalBill,
  setPendingReceipt,
  takePendingReceipt,
  type PendingMedicalReceipt,
} from "./deathMath";

export interface DeathState {
  schema: 1;
  pending: Record<string, PendingMedicalReceipt>;
}

const KEY = "ew:death";

export function emptyDeath(): DeathState {
  return { schema: 1, pending: {} };
}

export function loadDeath(): DeathState {
  const state = loadBlob<DeathState>(KEY);
  return state?.schema === 1 ? state : emptyDeath();
}

export function saveDeath(state: DeathState): void {
  saveBlob(KEY, state);
}

export function settlePlayerDeath(
  state: DeathState,
  player: Player,
  ledger: LedgerState,
  tick: number
): PendingMedicalReceipt {
  const account = playerAccount(player);
  const bank = balance(ledger, account);
  const carriedCash = countCarriedCash(player).total;
  const bill = medicalBill(
    matrix.medical.flat,
    matrix.medical.pctOfWealth,
    bank,
    carriedCash
  );
  if (bill.charged > 0) {
    sink(ledger, account, bill.charged, tick, "sink:medical");
  }
  const receipt = { ...bill, tick };
  setPendingReceipt(state, player.id, receipt);
  saveDeath(state);
  return receipt;
}

export function showPendingMedicalReceipt(
  state: DeathState,
  player: Player
): PendingMedicalReceipt | undefined {
  const receipt = takePendingReceipt(state, player.id);
  if (!receipt) return undefined;
  saveDeath(state);
  const paid =
    receipt.charged === receipt.due
      ? ""
      : `; paid ${formatAmount(receipt.charged)}`;
  toast(
    player,
    `Medical: ${formatAmount(receipt.flatCharge)} + ${formatAmount(receipt.wealthCharge)} = ${formatAmount(receipt.due)}${paid}`,
    "loss"
  );
  return receipt;
}
