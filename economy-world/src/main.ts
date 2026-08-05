/**
 * ECONOMY WORLD — Phase C boot.
 * A: ledger/scheduler · B: UI/bank/dealer · C: pricing/trades/commons/wallet
 *
 * Early-execution rule (Bedrock 1.26+): no world touches at module top-level.
 * All boot + world event subscriptions run inside system.run(...).
 */
import { world, system } from "@minecraft/server";
import type { Player } from "@minecraft/server";
import { emptyLedger, audit, mint, type LedgerState } from "./core/ledger";
import { saveBlob, loadBlob } from "./core/state";
import { every, startScheduler, currentTick } from "./core/scheduler";
import { openBank } from "./systems/bank";
import { openDealer } from "./systems/dealer";
import { claimStipend } from "./systems/stipend";
import { loadDealerState, saveDealerState, rollDealerDay } from "./systems/dealerState";
import {
  loadPrices,
  savePrices,
  startPricingJob,
  type PricesState,
} from "./systems/pricing";
import {
  loadBusinesses,
  saveBusinesses,
  startBusinessJobs,
  listCpuBusinesses,
  type BusinessesState,
} from "./systems/businesses";
import { openStorefront } from "./systems/storefront";
import { openCommons } from "./systems/commons";
import { openWallet } from "./systems/wallet";
import { ensureWallet } from "./systems/cash";
import { tradeDef } from "./content/trades";

const LEDGER_KEY = "ew:ledger";
let ledger: LedgerState;
let pricesState: PricesState;
let bizState: BusinessesState;

function asPlayer(e: { typeId: string } | undefined): Player | undefined {
  if (!e || e.typeId !== "minecraft:player") return undefined;
  return e as Player;
}

function boot(): void {
  ledger = loadBlob<LedgerState>(LEDGER_KEY) ?? emptyLedger();
  pricesState = loadPrices();
  bizState = loadBusinesses();
  savePrices(pricesState);
  saveBusinesses(bizState);

  startScheduler();

  every("ledger:save", 20 * 30, () => {
    saveBlob(LEDGER_KEY, ledger);
    savePrices(pricesState);
    saveBusinesses(bizState);
  });
  every("ledger:audit", 24000, () => {
    const r = audit(ledger);
    if (!r.ok) {
      console.error(`[ew] AUDIT FAILED drift=${r.drift} expected=${r.expected} actual=${r.actual}`);
      world.sendMessage("§c[Meridian Central Bank] Ledger anomaly detected. This is being looked into.");
    } else {
      console.log(`[ew] audit ok: supply=${r.expected}`);
    }
  });
  every("dealer:dayroll", 24000, (tick) => {
    const s = loadDealerState();
    rollDealerDay(s, tick);
    saveDealerState(s);
  });

  startPricingJob(
    () => pricesState,
    (s) => {
      pricesState = s;
    }
  );
  startBusinessJobs(
    () => bizState,
    (s) => {
      bizState = s;
    },
    () => pricesState,
    (s) => {
      pricesState = s;
    }
  );

  system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id === "ew:dev") {
      const player = asPlayer(ev.sourceEntity);
      if (ev.message === "grant" && player) {
        mint(ledger, `p:${player.id}`, 100, currentTick(), "mint:system");
        world.sendMessage(`§a[dev] granted 100 merids to ${player.nameTag}`);
      }
      if (ev.message === "audit") {
        const r = audit(ledger);
        world.sendMessage(`§e[dev] audit ok=${r.ok} supply=${r.expected} drift=${r.drift}`);
      }
      if (ev.message === "stipend" && player) claimStipend(player, ledger);
      if (ev.message === "bank" && player) void openBank(player, ledger);
      if (ev.message === "dealer" && player) void openDealer(player, ledger);
      if (ev.message === "commons" && player) void openCommons(player, ledger, bizState, pricesState);
      if (ev.message === "wallet" && player) void openWallet(player);
      if (ev.message === "givewallet" && player) {
        ensureWallet(player);
        world.sendMessage("§a[dev] wallet granted");
      }
      if (ev.message.startsWith("shop ") && player) {
        const trade = ev.message.slice(5).trim();
        const id = `cpu_${trade}`;
        if (!bizState.byId[id]) {
          world.sendMessage(`§c[dev] unknown shop trade: ${trade}`);
          return;
        }
        void openStorefront(player, ledger, bizState, pricesState, id);
      }
      if (ev.message === "shops" && player) {
        const list = listCpuBusinesses(bizState)
          .map((b) => b.trade)
          .join(", ");
        world.sendMessage(`§e[dev] shops: ${list}`);
      }
      return;
    }

    if (ev.id === "ew:npc") {
      const player = asPlayer(ev.sourceEntity);
      if (!player) return;
      if (ev.message === "bank") void openBank(player, ledger);
      if (ev.message === "dealer") void openDealer(player, ledger);
      if (ev.message === "commons") void openCommons(player, ledger, bizState, pricesState);
      if (ev.message === "wallet") void openWallet(player);
      if (ev.message.startsWith("shop ")) {
        const trade = ev.message.slice(5).trim();
        const id = `cpu_${trade}`;
        if (bizState.byId[id]) void openStorefront(player, ledger, bizState, pricesState, id);
      }
    }
  });

  world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
    const tags = ev.target.getTags();
    if (tags.includes("ew:npc_bank")) {
      void openBank(ev.player, ledger);
    } else if (tags.includes("ew:npc_dealer")) {
      void openDealer(ev.player, ledger);
    } else if (tags.includes("ew:npc_commons")) {
      void openCommons(ev.player, ledger, bizState, pricesState);
    } else {
      const shopTag = tags.find((t) => t.startsWith("ew:shop_"));
      if (shopTag) {
        const trade = shopTag.slice("ew:shop_".length);
        const id = `cpu_${trade}`;
        if (bizState.byId[id]) {
          void openStorefront(ev.player, ledger, bizState, pricesState, id);
        } else {
          console.warn(`[ew] shop tag ${shopTag} has no business (known: ${Object.keys(bizState.byId).join(",")})`);
        }
      }
    }
  });

  // Use-item on wallet opens pack/unpack hub
  world.afterEvents.itemUse.subscribe((ev) => {
    if (ev.itemStack.typeId === "ew:wallet") void openWallet(ev.source);
  });

  const tradeNames = listCpuBusinesses(bizState)
    .map((b) => tradeDef(b.trade).name)
    .join(", ");
  console.log(`[ew] Economy World Phase C booted. CPU shops: ${tradeNames}`);
}

system.run(boot);
