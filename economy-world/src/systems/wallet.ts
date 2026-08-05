/**
 * Wallet carry UI — pack/unpack merid notes (Phase C cash QoL).
 * No new icon glyphs (A1.5).
 */
import type { Player } from "@minecraft/server";
import { bareAmount, merids } from "../ui/theme";
import { Voice } from "../ui/voice";
import { toast } from "../ui/toast";
import { menuHub } from "../ui/patterns";
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
    ],
  });
}
