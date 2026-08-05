/**
 * Wallet carry UI — pack/unpack merid notes (Phase C cash QoL).
 * No new icon glyphs (A1.5).
 */
import type { Player } from "@minecraft/server";
import { bareAmount, merids } from "../ui/theme";
import { Voice } from "../ui/voice";
import { toast } from "../ui/toast";
import { confirmTxn, managePanel, menuHub } from "../ui/patterns";
import { cashDenominations, matrix } from "../content/matrix";
import { breakIntoCash } from "./bankMath";
import {
  countLooseCash,
  findWallet,
  getWalletBalance,
  packLooseIntoWallet,
  unpackFromWallet,
  ensureWallet,
} from "./cash";

export async function openWallet(player: Player): Promise<void> {
  let w = findWallet(player);
  if (!w) {
    ensureWallet(player);
    w = findWallet(player);
  }
  const bal = w ? getWalletBalance(w.item) : 0;
  const loose = countLooseCash(player).total;
  await menuHub(player, {
    title: "Wallet",
    facts: [`Wallet: ${bareAmount(bal)}`, `Loose notes: ${bareAmount(loose)}`],
    narrator: "Cash notes stack here so your pockets stay civil.",
    buttons: [
      {
        label: "Pack loose notes",
        onSelect: () => {
          const n = packLooseIntoWallet(player);
          if (n < 0) toast(player, Voice.walletMissing, "caution");
          else if (n === 0) toast(player, Voice.walletNoNotes, "caution");
          else toast(player, Voice.walletPacked(merids(n)), "gain");
        },
      },
      {
        label: "Unpack all",
        onSelect: () => {
          const n = unpackFromWallet(player);
          if (n < 0) toast(player, Voice.walletMissing, "caution");
          else if (n === 0) toast(player, Voice.walletEmpty, "caution");
          else toast(player, Voice.walletUnpacked(merids(n)), "caution");
        },
      },
      {
        label: "Unpack amount",
        onSelect: () => unpackAmountFlow(player),
      },
    ],
  });
}

async function unpackAmountFlow(player: Player): Promise<void> {
  const wallet = findWallet(player);
  if (!wallet) {
    toast(player, Voice.walletMissing, "caution");
    return;
  }
  const before = getWalletBalance(wallet.item);
  if (before <= 0) {
    toast(player, Voice.walletEmpty, "caution");
    return;
  }
  const amountForm = await managePanel(player, {
    title: "Unpack wallet",
    fields: [
      {
        type: "slider",
        label: `Amount (max ${bareAmount(before)})`,
        min: 1,
        max: before,
        step: 1,
        defaultValue: Math.min(before, matrix.cash.walletDefaultExtract),
      },
    ],
  });
  if (!amountForm) return;
  const amount = Math.floor(Number(amountForm.values[0]));
  if (!Number.isInteger(amount) || amount <= 0 || amount > before) return;

  const breakdown = breakIntoCash(amount, cashDenominations());
  const denominationFacts = breakdown.map(
    ({ denom, count }) => `${bareAmount(denom)} note${count === 1 ? "" : "s"}: ${count}`
  );
  const confirmed = await confirmTxn(player, {
    title: "Unpack wallet",
    facts: [`Extracting: ${merids(amount)}`, ...denominationFacts],
    lines: [{ label: "Notes out", amount, sense: "neutral" }],
    balanceBefore: before,
    balanceAfter: before - amount,
    narrator: "Exact change, as requested.",
  });
  if (!confirmed) return;
  const unpacked = unpackFromWallet(player, amount);
  if (unpacked > 0) toast(player, Voice.walletUnpacked(merids(unpacked)), "caution");
}
