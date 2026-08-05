/**
 * Bank NPC — layer1 §4.4 / UI inventory: hub → Deposit · Withdraw · Transfer · Statements.
 * Money moves ONLY through ledger.ts. Fees from data/matrix.json.
 * Screens conform to ui-amendment-1.md A1.1–A1.4.
 */
import type { Player } from "@minecraft/server";
import { world } from "@minecraft/server";
import {
  balance,
  cashIn,
  cashOut,
  sink,
  transfer,
  type LedgerState,
  LedgerError,
} from "../core/ledger";
import { transferFee } from "../content/matrix";
import { currentTick } from "../core/scheduler";
import { Glyph, bareAmount, merids } from "../ui/theme";
import { Voice } from "../ui/voice";
import { feedback } from "../ui/feedback";
import { menuHub, confirmTxn, managePanel, progressPanel } from "../ui/patterns";
import { canAffordTransfer, planTransfer } from "./bankMath";
import { countCarriedCash, takeAllCarriedCash, spawnCash } from "./cash";
import { statementLine } from "./statementMath";
import { insufficientFundsMessage } from "../ui/funds";

export function playerAccount(player: Player): `p:${string}` {
  return `p:${player.id}`;
}

export async function openBank(player: Player, ledger: LedgerState): Promise<void> {
  const acct = playerAccount(player);
  const bal = balance(ledger, acct);
  await menuHub(player, {
    title: "Central Bank",
    glyph: Glyph.bank,
    facts: [`Balance: ${bareAmount(bal)}`],
    narrator: Voice.bankWelcome,
    buttons: [
      { label: "Deposit cash", glyph: Glyph.down, onSelect: () => depositFlow(player, ledger) },
      { label: "Withdraw cash", glyph: Glyph.up, onSelect: () => withdrawFlow(player, ledger) },
      { label: "Transfer", glyph: Glyph.contract, onSelect: () => transferFlow(player, ledger) },
      { label: "Statements", glyph: Glyph.clock, onSelect: () => statementsFlow(player, ledger) },
    ],
  });
}

async function depositFlow(player: Player, ledger: LedgerState): Promise<void> {
  const acct = playerAccount(player);
  const { total } = countCarriedCash(player);
  if (total <= 0) {
    feedback(player, Voice.depositEmpty, "caution");
    return;
  }
  const before = balance(ledger, acct);
  const ok = await confirmTxn(player, {
    title: "Deposit",
    glyph: Glyph.bank,
    facts: [`Depositing: ${merids(total)}`],
    lines: [{ label: "Deposit", amount: total, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + total,
    narrator: Voice.depositNarrator,
  });
  if (!ok) return;
  try {
    const taken = takeAllCarriedCash(player);
    if (taken <= 0) {
      feedback(player, Voice.depositEmpty, "caution");
      return;
    }
    cashIn(ledger, acct, taken, currentTick());
    feedback(player, Voice.depositOk(merids(taken)), "gain");
  } catch (e) {
    console.error(`[ew] deposit failed: ${e}`);
    feedback(player, Voice.error, "error");
  }
}

async function withdrawFlow(player: Player, ledger: LedgerState): Promise<void> {
  const acct = playerAccount(player);
  const before = balance(ledger, acct);
  if (before <= 0) {
    feedback(player, Voice.withdrawFail, "error");
    return;
  }
  const panel = await managePanel(player, {
    title: "Withdraw",
    glyph: Glyph.bank,
    fields: [
      {
        type: "slider",
        label: `Amount (max ${bareAmount(before)})`,
        min: 1,
        max: before,
        step: 1,
        defaultValue: Math.min(before, 100),
      },
    ],
  });
  if (!panel) return;
  const amount = Math.floor(Number(panel.values[0]));
  if (!Number.isFinite(amount) || amount <= 0 || amount > before) {
    feedback(player, Voice.withdrawFail, "error");
    return;
  }
  const ok = await confirmTxn(player, {
    title: "Withdraw",
    glyph: Glyph.bank,
    facts: [`Withdrawing: ${merids(amount)}`],
    lines: [{ label: "Withdraw", amount, sense: "loss" }],
    balanceBefore: before,
    balanceAfter: before - amount,
    narrator: Voice.withdrawNarrator,
  });
  if (!ok) return;
  try {
    cashOut(ledger, acct, amount, currentTick());
    spawnCash(player, amount);
    feedback(player, Voice.withdrawOk(merids(amount)), "caution");
  } catch (e) {
    if (e instanceof LedgerError) feedback(player, Voice.withdrawFail, "error");
    else {
      console.error(`[ew] withdraw failed: ${e}`);
      feedback(player, Voice.error, "error");
    }
  }
}

async function transferFlow(player: Player, ledger: LedgerState): Promise<void> {
  const acct = playerAccount(player);
  const before = balance(ledger, acct);
  const fee = transferFee();
  const others = world.getAllPlayers().filter((p) => p.id !== player.id);
  if (others.length === 0) {
    feedback(player, Voice.transferNoPlayers, "caution");
    return;
  }
  if (before <= fee) {
    feedback(player, Voice.transferFailFunds, "error");
    return;
  }
  const maxSend = before - fee;
  const panel = await managePanel(player, {
    title: "Transfer",
    glyph: Glyph.contract,
    fields: [
      {
        type: "dropdown",
        label: "Recipient",
        options: others.map((p) => p.name),
        defaultIndex: 0,
      },
      {
        type: "slider",
        label: `Amount (fee ${bareAmount(fee)} extra)`,
        min: 1,
        max: maxSend,
        step: 1,
        defaultValue: Math.min(maxSend, 50),
      },
    ],
  });
  if (!panel) return;
  const targetIdx = Number(panel.values[0]);
  const amount = Math.floor(Number(panel.values[1]));
  const target = others[targetIdx];
  if (!target) {
    feedback(player, Voice.transferFailTarget, "error");
    return;
  }
  if (!canAffordTransfer(before, amount, fee)) {
    feedback(player, Voice.transferFailFunds, "error");
    return;
  }
  const plan = planTransfer(amount, fee);
  const ok = await confirmTxn(player, {
    title: "Transfer",
    glyph: Glyph.contract,
    facts: [
      `Recipient: ${target.name}`,
      `Send: ${merids(plan.amount)}`,
      `Fee: ${merids(plan.fee)}`,
    ],
    lines: [
      { label: "Send", amount: plan.amount, sense: "loss" },
      { label: "Fee", amount: plan.fee, sense: "loss" },
    ],
    balanceBefore: before,
    balanceAfter: before - plan.totalDebit,
    narrator: Voice.transferNarrator,
  });
  if (!ok) return;
  try {
    const tick = currentTick();
    const available = balance(ledger, acct);
    if (available < plan.totalDebit) {
      feedback(
        player,
        insufficientFundsMessage(
          "Your bank account",
          plan.totalDebit,
          available
        ),
        "error"
      );
      return;
    }
    if (plan.fee > 0) sink(ledger, acct, plan.fee, tick, "sink:fee");
    transfer(ledger, acct, playerAccount(target), plan.amount, tick, "bank:transfer");
    feedback(player, Voice.transferOk(merids(plan.amount), target.name), "gain");
    feedback(target, Voice.transferOk(merids(plan.amount), player.name), "gain");
  } catch (e) {
    if (e instanceof LedgerError) feedback(player, Voice.transferFailFunds, "error");
    else {
      console.error(`[ew] transfer failed: ${e}`);
      feedback(player, Voice.error, "error");
    }
  }
}

async function statementsFlow(player: Player, ledger: LedgerState): Promise<void> {
  const acct = playerAccount(player);
  const mine = ledger.journal.filter((e) => e.from === acct || e.to === acct).slice(-12);
  if (mine.length === 0) {
    await progressPanel(player, {
      title: "Statements",
      glyph: Glyph.bank,
      facts: [`Balance: ${bareAmount(balance(ledger, acct))}`],
      narrator: Voice.statementEmpty,
      rows: [{ label: "No entries", ok: false }],
    });
    return;
  }
  await progressPanel(player, {
    title: "Statements",
    glyph: Glyph.bank,
    facts: [`Balance: ${bareAmount(balance(ledger, acct))}`],
    narrator: Voice.statementNarrator,
    rows: mine.map((e) => ({
      label: statementLine(e, acct).label,
      ok: statementLine(e, acct).positive,
    })),
  });
}
