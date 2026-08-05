/**
 * ECONOMY WORLD — Phase B boot.
 * Ledger + scheduler (A) + UI kit + Bank + Dealer + cash + stipend stub (B).
 */
import { world, system } from "@minecraft/server";
import { emptyLedger, audit, mint, type LedgerState } from "./core/ledger";
import { saveBlob, loadBlob } from "./core/state";
import { every, startScheduler, currentTick } from "./core/scheduler";
import { openBank } from "./systems/bank";
import { openDealer } from "./systems/dealer";
import { claimStipend } from "./systems/stipend";
import { loadDealerState, saveDealerState, rollDealerDay } from "./systems/dealerState";

const LEDGER_KEY = "ew:ledger";
let ledger: LedgerState;

function boot(): void {
  ledger = loadBlob<LedgerState>(LEDGER_KEY) ?? emptyLedger();
  startScheduler();

  every("ledger:save", 20 * 30, () => saveBlob(LEDGER_KEY, ledger));
  every("ledger:audit", 24000, () => {
    const r = audit(ledger);
    if (!r.ok) {
      console.error(`[ew] AUDIT FAILED drift=${r.drift} expected=${r.expected} actual=${r.actual}`);
      world.sendMessage("§c[Meridian Central Bank] Ledger anomaly detected. This is being looked into.");
    } else {
      console.log(`[ew] audit ok: supply=${r.expected}`);
    }
  });
  // Roll dealer daily volume with the game day.
  every("dealer:dayroll", 24000, (tick) => {
    const s = loadDealerState();
    rollDealerDay(s, tick);
    saveDealerState(s);
  });

  console.log("[ew] Economy World Phase B booted.");
}

system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id === "ew:dev") {
    const player = ev.sourceEntity;
    if (ev.message === "grant" && player && player.typeId === "minecraft:player") {
      mint(ledger, `p:${player.id}`, 100, currentTick(), "mint:system");
      world.sendMessage(`§a[dev] granted 100 merids to ${player.nameTag}`);
    }
    if (ev.message === "audit") {
      const r = audit(ledger);
      world.sendMessage(`§e[dev] audit ok=${r.ok} supply=${r.expected} drift=${r.drift}`);
    }
    if (ev.message === "stipend" && player && player.typeId === "minecraft:player") {
      claimStipend(player as import("@minecraft/server").Player, ledger);
    }
    if (ev.message === "bank" && player && player.typeId === "minecraft:player") {
      void openBank(player as import("@minecraft/server").Player, ledger);
    }
    if (ev.message === "dealer" && player && player.typeId === "minecraft:player") {
      void openDealer(player as import("@minecraft/server").Player, ledger);
    }
    return;
  }

  // NPC hooks: /scriptevent ew:npc bank|dealer  (entity interact wiring arrives with §4.11)
  if (ev.id === "ew:npc") {
    const player = ev.sourceEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    const p = player as import("@minecraft/server").Player;
    if (ev.message === "bank") void openBank(p, ledger);
    if (ev.message === "dealer") void openDealer(p, ledger);
  }
});

// Interact with tagged entities: ew:npc_bank / ew:npc_dealer
world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  const tags = ev.target.getTags();
  if (tags.includes("ew:npc_bank")) {
    void openBank(ev.player, ledger);
  } else if (tags.includes("ew:npc_dealer")) {
    void openDealer(ev.player, ledger);
  }
});

boot();
