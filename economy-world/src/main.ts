/**
 * ECONOMY WORLD — Phase D boot.
 * A: ledger · B: bank/dealer · C: prices/trades · D: work/employment
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
  runCpuProduction,
  type BusinessesState,
} from "./systems/businesses";
import { openStorefront } from "./systems/storefront";
import { openCommons } from "./systems/commons";
import { openWallet } from "./systems/wallet";
import { ensureWallet } from "./systems/cash";
import { tradeDef } from "./content/trades";
import {
  loadEmployment,
  openJobBoard,
  startPayrollJob,
  type EmploymentState,
} from "./systems/employment";
import {
  loadExtraction,
  registerPlayerZone,
  startExtractionSystem,
  type ExtractionState,
} from "./systems/extraction";
import {
  loadProcessing,
  openProcessingStation,
  startProcessingJob,
  type ProcessingState,
} from "./systems/processing";
import {
  loadService,
  openServiceCustomer,
  startServiceJob,
  type ServiceState,
} from "./systems/service";

const LEDGER_KEY = "ew:ledger";
let ledger: LedgerState;
let pricesState: PricesState;
let bizState: BusinessesState;
let employmentState: EmploymentState;
let extractionState: ExtractionState;
let processingState: ProcessingState;
let serviceState: ServiceState;

function asPlayer(e: { typeId: string } | undefined): Player | undefined {
  if (!e || e.typeId !== "minecraft:player") return undefined;
  return e as Player;
}

function boot(): void {
  ledger = loadBlob<LedgerState>(LEDGER_KEY) ?? emptyLedger();
  pricesState = loadPrices();
  bizState = loadBusinesses();
  employmentState = loadEmployment();
  extractionState = loadExtraction();
  processingState = loadProcessing();
  serviceState = loadService();
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
    },
    () => {
      const ids = new Set<string>();
      for (const player of world.getAllPlayers()) {
        ids.add(player.id);
        ids.add(`p:${player.id}`);
      }
      return ids;
    }
  );
  startPayrollJob(employmentState, ledger);
  startExtractionSystem(
    extractionState,
    bizState,
    pricesState,
    employmentState
  );
  startProcessingJob(processingState, bizState, pricesState);
  startServiceJob(serviceState);

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
      if (ev.message === "jobs" && player) {
        void openJobBoard(player, ledger, bizState, employmentState);
      }
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
      if (ev.message === "produce") {
        runCpuProduction(bizState, pricesState);
        saveBusinesses(bizState);
        savePrices(pricesState);
        world.sendMessage("§a[dev] forced one CPU production tick");
      }
      if (ev.message.startsWith("zone ") && player) {
        const trade = ev.message.slice(5).trim();
        const businessId = `cpu_${trade}`;
        if (!bizState.byId[businessId]) {
          world.sendMessage(`§c[dev] unknown work-zone trade: ${trade}`);
          return;
        }
        registerPlayerZone(extractionState, player, businessId);
        world.sendMessage(`§a[dev] work zone registered for ${trade}`);
      }
      if (ev.message.startsWith("publiczone ") && player) {
        const trade = ev.message.slice(11).trim();
        const businessId = `cpu_${trade}`;
        if (!bizState.byId[businessId]) {
          world.sendMessage(`§c[dev] unknown public-zone trade: ${trade}`);
          return;
        }
        registerPlayerZone(extractionState, player, businessId, true);
        world.sendMessage(`§a[dev] public work zone registered for ${trade}`);
      }
      if (ev.message.startsWith("station ") && player) {
        const trade = ev.message.slice(8).trim();
        void openProcessingStation(
          player,
          ledger,
          processingState,
          bizState,
          pricesState,
          trade,
          `dev:${player.id}:${trade}`
        );
      }
      if (ev.message.startsWith("service ") && player) {
        const trade = ev.message.slice(8).trim();
        void openServiceCustomer(
          player,
          ledger,
          serviceState,
          bizState,
          pricesState,
          employmentState,
          trade
        );
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
      if (ev.message === "jobs") {
        void openJobBoard(player, ledger, bizState, employmentState);
      }
      if (ev.message.startsWith("shop ")) {
        const trade = ev.message.slice(5).trim();
        const id = `cpu_${trade}`;
        if (bizState.byId[id]) void openStorefront(player, ledger, bizState, pricesState, id);
      }
      if (ev.message.startsWith("station ")) {
        const trade = ev.message.slice(8).trim();
        void openProcessingStation(
          player,
          ledger,
          processingState,
          bizState,
          pricesState,
          trade,
          `event:${player.id}:${trade}`
        );
      }
      if (ev.message.startsWith("service ")) {
        const trade = ev.message.slice(8).trim();
        void openServiceCustomer(
          player,
          ledger,
          serviceState,
          bizState,
          pricesState,
          employmentState,
          trade
        );
      }
    }
  });

  world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const tags = ev.target.getTags();
    if (tags.includes("ew:npc_bank")) {
      ev.cancel = true;
      const player = ev.player;
      system.run(() => void openBank(player, ledger));
    } else if (tags.includes("ew:npc_dealer")) {
      ev.cancel = true;
      const player = ev.player;
      system.run(() => void openDealer(player, ledger));
    } else if (tags.includes("ew:npc_commons")) {
      ev.cancel = true;
      const player = ev.player;
      system.run(() => void openCommons(player, ledger, bizState, pricesState));
    } else if (tags.includes("ew:npc_jobs")) {
      ev.cancel = true;
      const player = ev.player;
      system.run(
        () => void openJobBoard(player, ledger, bizState, employmentState)
      );
    } else {
      const stationTag = tags.find((t) => t.startsWith("ew:station_"));
      if (stationTag) {
        ev.cancel = true;
        const trade = stationTag.slice("ew:station_".length);
        const player = ev.player;
        const stationId = ev.target.id;
        system.run(
          () =>
            void openProcessingStation(
              player,
              ledger,
              processingState,
              bizState,
              pricesState,
              trade,
              stationId
            )
        );
        return;
      }
      const serviceTag = tags.find((t) => t.startsWith("ew:service_"));
      if (serviceTag) {
        ev.cancel = true;
        const trade = serviceTag.slice("ew:service_".length);
        const player = ev.player;
        system.run(
          () =>
            void openServiceCustomer(
              player,
              ledger,
              serviceState,
              bizState,
              pricesState,
              employmentState,
              trade
            )
        );
        return;
      }
      const shopTag = tags.find((t) => t.startsWith("ew:shop_"));
      if (shopTag) {
        ev.cancel = true;
        const trade = shopTag.slice("ew:shop_".length);
        const id = `cpu_${trade}`;
        if (bizState.byId[id]) {
          const player = ev.player;
          system.run(() => void openStorefront(player, ledger, bizState, pricesState, id));
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
  console.log(`[ew] Economy World Phase D booted. CPU shops: ${tradeNames}`);
}

system.run(boot);
