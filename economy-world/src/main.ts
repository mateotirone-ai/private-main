/**
 * ECONOMY WORLD — Phase G boot.
 * A: ledger · B: bank/dealer · C: prices/trades · D: work/employment · E: ownership · F: survival/dialogue/HUD · G: ship prep
 *
 * Early-execution rule (Bedrock 1.26+): no world touches at module top-level.
 * All boot + world event subscriptions run inside system.run(...).
 */
import { ItemStack, world, system } from "@minecraft/server";
import type { Player } from "@minecraft/server";
import { emptyLedger, audit, mint, type LedgerState } from "./core/ledger";
import { saveBlob, loadBlob } from "./core/state";
import { every, startScheduler, currentTick } from "./core/scheduler";
import { openBank } from "./systems/bank";
import { openDealer } from "./systems/dealer";
import { claimStipend } from "./systems/stipend";
import {
  loadDealerState,
  saveDealerState,
  rollDealerDay,
  type DealerState,
} from "./systems/dealerState";
import {
  loadPrices,
  savePrices,
  startPricingJob,
  currentUnitPrice,
  type PricesState,
} from "./systems/pricing";
import {
  loadBusinesses,
  saveBusinesses,
  startBusinessJobs,
  listCpuBusinesses,
  storefrontBusinessForTrade,
  runCpuProduction,
  type BusinessesState,
} from "./systems/businesses";
import { openStorefront } from "./systems/storefront";
import { openCommons } from "./systems/commons";
import { openWallet } from "./systems/wallet";
import { ensureWallet } from "./systems/cash";
import { tradeDef } from "./content/trades";
import { clearSpeakerContext, speakAs, withNpcSpeaker } from "./ui/feedback";
import {
  clockOut,
  forceClockOutBusiness,
  loadEmployment,
  openBusinessOffice,
  openJobBoard,
  type EmploymentState,
} from "./systems/employment";
import { reclaimCompanyTools } from "./systems/companyTools";
import { clearActionbar, clearPlayerUiState } from "./ui/toast";
import {
  forceRestorePit,
  loadExtraction,
  pitInfoForPlayer,
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
  forceSpawnCustomerNeed,
  loadService,
  openServiceCustomer,
  registerServiceHost,
  startServiceJob,
  type ServiceState,
} from "./systems/service";
import {
  placeBusinessStructure,
  reloadBusinessStructure,
} from "./systems/structurePlacement";
import {
  BUILDERS_CATALOG_ITEM,
  clearCatalogPlayerState,
  openBuilderCatalog,
  tryPlaceFromCatalogTap,
  undoLastCatalogPlacement,
} from "./systems/builderCatalog";
import {
  openOwnershipPanel,
  setConstructionCloseHook,
  setSuccessorSpawnHook,
  startOwnershipJobs,
} from "./systems/ownership";
import { devHelpLines, parseDevCommand } from "./dev/commands";
import {
  loadDeath,
  settlePlayerDeath,
  showPendingMedicalReceipt,
  type DeathState,
} from "./systems/death";
import {
  loadFood,
  noteCompletedFoodUse,
  setFoodConsumptionHook,
  type FoodState,
} from "./systems/food";
import {
  bindDialogueState,
  loadDialogue,
  noteDialogueEvent,
  npcDialogueLine,
  type DialogueState,
} from "./systems/dialogue";
import { formatAmount } from "./ui/theme";
import { startHudJob } from "./systems/hud";
import {
  ensureFirstJoinOnboarding,
  noteOnboardingPaycheck,
} from "./systems/onboarding";

const LEDGER_KEY = "ew:ledger";
let ledger: LedgerState;
let pricesState: PricesState;
let bizState: BusinessesState;
let employmentState: EmploymentState;
let extractionState: ExtractionState;
let processingState: ProcessingState;
let serviceState: ServiceState;
let deathState: DeathState;
let foodState: FoodState;
let dialogueState: DialogueState;
let dealerState: DealerState;
let lastSavedLedgerSeq = 0;

function asPlayer(e: { typeId: string } | undefined): Player | undefined {
  if (!e || e.typeId !== "minecraft:player") return undefined;
  return e as Player;
}

function speakNpcPrelude(
  player: Player,
  speaker: string,
  tags: readonly string[],
  role: string,
  trade?: string
): void {
  const business = trade
    ? storefrontBusinessForTrade(bizState, trade)
    : undefined;
  const definition = trade ? tradeDef(trade) : undefined;
  const ownerPlayer =
    business?.owner && business.owner !== "cpu"
      ? world
          .getAllPlayers()
          .find((candidate) => candidate.id === business.owner)
      : undefined;
  const line = npcDialogueLine(
    dialogueState,
    role,
    tags,
    {
      good: definition?.good.replaceAll("_", " ") ?? "merids",
      price: definition
        ? formatAmount(currentUnitPrice(pricesState, definition.good))
        : "posted",
      playerName: player.nameTag,
      ownerName:
        business?.owner === "cpu"
          ? "Meridian"
          : ownerPlayer?.nameTag ?? "the owner",
      stock: business ? formatAmount(business.storage) : "available",
    },
    trade
  );
  speakAs(player, speaker, line);
}

function boot(): void {
  ledger = loadBlob<LedgerState>(LEDGER_KEY) ?? emptyLedger();
  lastSavedLedgerSeq = ledger.seq;
  pricesState = loadPrices();
  dealerState = loadDealerState();
  bizState = loadBusinesses();
  employmentState = loadEmployment();
  extractionState = loadExtraction();
  processingState = loadProcessing();
  serviceState = loadService();
  deathState = loadDeath();
  foodState = loadFood();
  dialogueState = loadDialogue();
  bindDialogueState(dialogueState);
  setFoodConsumptionHook((event) => {
    noteDialogueEvent({
      kind: "food",
      summary: `${event.good.replaceAll("_", " ")} was eaten`,
      tick: event.tick,
      trade: event.trade,
    });
  });
  savePrices(pricesState);
  saveBusinesses(bizState);

  startScheduler();

  every("ledger:save", 20 * 30, () => {
    saveBlob(LEDGER_KEY, ledger);
    lastSavedLedgerSeq = ledger.seq;
    savePrices(pricesState);
    saveBusinesses(bizState);
  });
  every("ledger:flush", 20, () => {
    if (ledger.seq === lastSavedLedgerSeq) return;
    saveBlob(LEDGER_KEY, ledger);
    lastSavedLedgerSeq = ledger.seq;
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
    rollDealerDay(dealerState, tick);
    saveDealerState(dealerState);
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
  startExtractionSystem(
    extractionState,
    bizState,
    pricesState,
    employmentState
  );
  startProcessingJob(
    processingState,
    bizState,
    pricesState,
    employmentState
  );
  startServiceJob(serviceState, bizState, employmentState);
  startHudJob();
  setSuccessorSpawnHook((payload) => {
    const successor = bizState.byId[payload.successorId];
    if (successor?.site) {
      reloadBusinessStructure(successor);
    }
    console.log(
      `[ew] successor ready ${payload.successorId} from ${payload.predecessorId} (${payload.trade}) offset ${payload.offset.x},${payload.offset.y},${payload.offset.z}`
    );
  });
  setConstructionCloseHook((businessId) => {
    const closed = forceClockOutBusiness(
      employmentState,
      businessId,
      currentTick(),
      ledger
    );
    for (const entry of closed) {
      const player = world
        .getAllPlayers()
        .find((candidate) => candidate.id === entry.playerId);
      if (!player) continue;
      if (entry.result.settled) {
        reclaimCompanyTools(player, "clockOut");
        clearActionbar(player, "employment");
      }
      if (entry.result.paid > 0) {
        noteOnboardingPaycheck(player);
      }
    }
  });
  startOwnershipJobs(bizState);

  system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id === "ew:dev") {
      const player = asPlayer(ev.sourceEntity);
      const command = parseDevCommand(ev.message);
      if (!command) {
        const line = `§c[dev] unknown command: ${ev.message}. Use /scriptevent ew:dev help`;
        if (player) player.sendMessage(line);
        else world.sendMessage(line);
        return;
      }
      switch (command.id) {
        case "help":
          for (const line of devHelpLines()) {
            if (player) player.sendMessage(line);
            else world.sendMessage(line);
          }
          break;
        case "grant":
          if (player) {
            mint(ledger, `p:${player.id}`, 100, currentTick(), "mint:system");
            world.sendMessage(`§a[dev] granted 100 merids to ${player.nameTag}`);
          }
          break;
        case "audit": {
          const r = audit(ledger);
          world.sendMessage(`§e[dev] audit ok=${r.ok} supply=${r.expected} drift=${r.drift}`);
          break;
        }
        case "stipend":
          if (player) claimStipend(player, ledger);
          break;
        case "bank":
          if (player) void openBank(player, ledger);
          break;
        case "dealer":
          if (player) void openDealer(player, ledger, dealerState);
          break;
        case "commons":
          if (player) void openCommons(player, ledger, bizState, pricesState);
          break;
        case "wallet":
          if (player) void openWallet(player);
          break;
        case "jobs":
          if (player) void openJobBoard(player, ledger, bizState, employmentState);
          break;
        case "givewallet":
          if (player) {
            ensureWallet(player);
            world.sendMessage("§a[dev] wallet granted");
          }
          break;
        case "shop": {
          if (!player) break;
          const trade = command.argument!;
          const business = storefrontBusinessForTrade(bizState, trade);
          if (!business) {
            world.sendMessage(`§c[dev] unknown shop trade: ${trade}`);
            break;
          }
          void openStorefront(player, ledger, bizState, pricesState, business.id);
          break;
        }
        case "shops": {
          const list = listCpuBusinesses(bizState).map((b) => b.trade).join(", ");
          world.sendMessage(`§e[dev] shops: ${list}`);
          break;
        }
        case "produce":
          runCpuProduction(bizState, pricesState);
          saveBusinesses(bizState);
          savePrices(pricesState);
          world.sendMessage("§a[dev] forced one CPU production tick");
          break;
        case "zone":
        case "publiczone": {
          world.sendMessage(
            "§e[dev] zone/publiczone stamp commands are deprecated. Use /scriptevent ew:dev place <trade>."
          );
          break;
        }
        case "station": {
          if (!player) break;
          const trade = command.argument!;
          void openProcessingStation(
            player,
            ledger,
            processingState,
            bizState,
            pricesState,
            employmentState,
            trade,
            `dev:${player.id}:${trade}`
          );
          break;
        }
        case "service":
          if (player) {
            void openServiceCustomer(
              player,
              ledger,
              serviceState,
              bizState,
              pricesState,
              employmentState,
              command.argument!
            );
          }
          break;
        case "owner": {
          if (!player) break;
          const target = command.argument!;
          const business = bizState.byId[target];
          if (business) {
            void openOwnershipPanel(
              player,
              ledger,
              bizState,
              business.trade,
              business.id
            );
          } else {
            void openOwnershipPanel(player, ledger, bizState, target);
          }
          break;
        }
        case "need": {
          const trade = command.argument!;
          const businessId = `cpu_${trade}`;
          if (!bizState.byId[businessId]) {
            world.sendMessage(`§c[dev] unknown service trade: ${trade}`);
            break;
          }
          forceSpawnCustomerNeed(serviceState, trade, currentTick(), player);
          world.sendMessage(`§a[dev] forced one customer need for ${trade}`);
          break;
        }
        case "seedtown": {
          world.sendMessage(
            "§e[dev] seedtown legacy host-line stamping is gated for structure-registry migration."
          );
          break;
        }
        case "place": {
          if (!player) break;
          try {
            const result = placeBusinessStructure(
              player,
              bizState,
              extractionState,
              command.argument!
            );
            world.sendMessage(
              `§a[dev] placed ${result.trade} at ${result.anchor.x},${result.anchor.y},${result.anchor.z} rot=${result.rotationSteps}`
            );
          } catch (error) {
            world.sendMessage(`§c[dev] place failed: ${error}`);
          }
          break;
        }
        case "catalog": {
          if (!player) break;
          void openBuilderCatalog(player);
          break;
        }
        case "givecatalog": {
          if (!player) break;
          const inv = player.getComponent("inventory")?.container;
          if (!inv || inv.emptySlotsCount <= 0) {
            world.sendMessage("§c[dev] free one inventory slot first");
            break;
          }
          inv.addItem(new ItemStack(BUILDERS_CATALOG_ITEM, 1));
          world.sendMessage("§a[dev] Builder's Catalog granted");
          break;
        }
        case "undo": {
          if (!player) break;
          if (!undoLastCatalogPlacement(player)) {
            world.sendMessage("§e[dev] no catalog placement to undo");
          }
          break;
        }
        case "regen": {
          const ref = command.argument!;
          const business =
            bizState.byId[ref] ?? bizState.byId[`cpu_${ref}`];
          if (!business) {
            world.sendMessage(`§c[dev] unknown businessRef: ${ref}`);
            break;
          }
          const restored = forceRestorePit(
            extractionState,
            bizState,
            business.id
          );
          world.sendMessage(
            restored
              ? `§a[dev] restored work_pit for ${business.id} (${restored} box${restored === 1 ? "" : "es"})`
              : `§e[dev] no work_pit volume to restore for ${business.id}`
          );
          break;
        }
        case "pitinfo": {
          if (!player) break;
          for (const line of pitInfoForPlayer(
            player,
            extractionState,
            bizState,
            employmentState
          )) {
            world.sendMessage(`§e[dev] ${line}`);
          }
          break;
        }
      }
      return;
    }

    if (ev.id === "ew:npc") {
      const player = asPlayer(ev.sourceEntity);
      if (!player) return;
      if (ev.message === "bank") void openBank(player, ledger);
      if (ev.message === "dealer") void openDealer(player, ledger, dealerState);
      if (ev.message === "commons") void openCommons(player, ledger, bizState, pricesState);
      if (ev.message === "wallet") void openWallet(player);
      if (ev.message === "jobs") {
        void openJobBoard(player, ledger, bizState, employmentState);
      }
      if (ev.message.startsWith("shop ")) {
        const trade = ev.message.slice(5).trim();
        const business = storefrontBusinessForTrade(bizState, trade);
        if (business) {
          void openStorefront(player, ledger, bizState, pricesState, business.id);
        }
      }
      if (ev.message.startsWith("station ")) {
        const trade = ev.message.slice(8).trim();
        void openProcessingStation(
          player,
          ledger,
          processingState,
          bizState,
          pricesState,
          employmentState,
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
      if (ev.message.startsWith("owner ")) {
        const target = ev.message.slice(6).trim();
        const business = bizState.byId[target];
        if (business) {
          void openOwnershipPanel(player, ledger, bizState, business.trade, business.id);
        } else {
          void openOwnershipPanel(player, ledger, bizState, target);
        }
      }
    }
  });

  world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const tags = ev.target.getTags();
    if (tags.includes("ew:npc_bank")) {
      ev.cancel = true;
      const player = ev.player;
      const speaker = ev.target.nameTag || "Meridian Central Bank";
      speakNpcPrelude(player, speaker, tags, "bank");
      system.run(
        () => void withNpcSpeaker(player, speaker, () => openBank(player, ledger))
      );
    } else if (tags.includes("ew:npc_dealer")) {
      ev.cancel = true;
      const player = ev.player;
      const speaker = ev.target.nameTag || "Commodity Dealer";
      speakNpcPrelude(player, speaker, tags, "dealer", "precious_mine");
      system.run(
        () =>
          void withNpcSpeaker(player, speaker, () =>
            openDealer(player, ledger, dealerState)
          )
      );
    } else if (tags.includes("ew:npc_commons")) {
      ev.cancel = true;
      const player = ev.player;
      const speaker = ev.target.nameTag || "Commons Steward";
      speakNpcPrelude(player, speaker, tags, "commons");
      system.run(
        () =>
          void withNpcSpeaker(player, speaker, () =>
            openCommons(player, ledger, bizState, pricesState)
          )
      );
    } else if (tags.includes("ew:npc_jobs")) {
      ev.cancel = true;
      const player = ev.player;
      const speaker = ev.target.nameTag || "Employment Clerk";
      speakNpcPrelude(player, speaker, tags, "jobs");
      system.run(
        () =>
          void withNpcSpeaker(player, speaker, () =>
            openJobBoard(player, ledger, bizState, employmentState)
          )
      );
    } else {
      const taggedBusinessId = tags
        .find((tag) => tag.startsWith("ew:biz_"))
        ?.slice("ew:biz_".length);
      const taggedBusiness = taggedBusinessId
        ? bizState.byId[taggedBusinessId]
        : undefined;
      if (taggedBusiness?.construction) {
        ev.cancel = true;
        const player = ev.player;
        const speaker =
          ev.target.nameTag || `${tradeDef(taggedBusiness.trade).name} Clerk`;
        system.run(() =>
          speakAs(
            player,
            speaker,
            `${tradeDef(taggedBusiness.trade).name} is closed for renovation.`
          )
        );
        return;
      }
      const stationTag = tags.find((t) => t.startsWith("ew:station_"));
      if (stationTag) {
        ev.cancel = true;
        const trade = stationTag.slice("ew:station_".length);
        const player = ev.player;
        const stationId = ev.target.id;
        const speaker = ev.target.nameTag || tradeDef(trade).name;
        speakNpcPrelude(player, speaker, tags, "station", trade);
        system.run(
          () =>
            void withNpcSpeaker(player, speaker, () =>
              openProcessingStation(
                player,
                ledger,
                processingState,
                bizState,
                pricesState,
                employmentState,
                trade,
                stationId
              )
            )
        );
        return;
      }
      const serviceTag = tags.find((t) => t.startsWith("ew:service_"));
      if (serviceTag) {
        ev.cancel = true;
        const trade = serviceTag.slice("ew:service_".length);
        const player = ev.player;
        const hostId = ev.target.id;
        const speaker = ev.target.nameTag || tradeDef(trade).name;
        const hostDimension = ev.target.dimension.id;
        const hostLocation = ev.target.location;
        speakNpcPrelude(player, speaker, tags, "service", trade);
        system.run(
          () =>
            void withNpcSpeaker(player, speaker, () =>
              {
                registerServiceHost(
                  serviceState,
                  hostId,
                  trade,
                  hostDimension,
                  hostLocation,
                  speaker,
                  storefrontBusinessForTrade(bizState, trade)?.id
                );
                return openServiceCustomer(
                  player,
                  ledger,
                  serviceState,
                  bizState,
                  pricesState,
                  employmentState,
                  trade,
                  hostId
                );
              }
            )
        );
        return;
      }
      const shopTag = tags.find((t) => t.startsWith("ew:shop_"));
      const officeTag = tags.find((t) => t.startsWith("ew:office_"));
      const bizTag = tags.find((t) => t.startsWith("ew:biz_"));
      const ownerTag = tags.find((t) => t.startsWith("ew:owner_"));
      if (officeTag && bizTag) {
        ev.cancel = true;
        const businessId = bizTag.slice("ew:biz_".length);
        const business = bizState.byId[businessId];
        if (!business) return;
        const player = ev.player;
        const speaker = ev.target.nameTag || `${tradeDef(business.trade).name} Office`;
        speakNpcPrelude(player, speaker, tags, "jobs", business.trade);
        system.run(
          () =>
            void withNpcSpeaker(player, speaker, () => {
              if (business.owner === player.id) {
                return openOwnershipPanel(
                  player,
                  ledger,
                  bizState,
                  business.trade,
                  business.id
                );
              }
              return openBusinessOffice(
                player,
                ledger,
                bizState,
                employmentState,
                business.id
              );
            })
        );
        return;
      }
      if (ownerTag) {
        ev.cancel = true;
        const trade = ownerTag.slice("ew:owner_".length);
        const player = ev.player;
        const speaker = ev.target.nameTag || `${tradeDef(trade).name} Foreman`;
        speakNpcPrelude(player, speaker, tags, "owner", trade);
        system.run(
          () =>
            void withNpcSpeaker(player, speaker, () =>
              openOwnershipPanel(player, ledger, bizState, trade)
            )
        );
        return;
      }
      if (bizTag) {
        ev.cancel = true;
        const businessId = bizTag.slice("ew:biz_".length);
        const business = bizState.byId[businessId];
        if (!business) return;
        const player = ev.player;
        const speaker = ev.target.nameTag || tradeDef(business.trade).name;
        speakNpcPrelude(player, speaker, tags, "shop", business.trade);
        system.run(
          () =>
            void withNpcSpeaker(player, speaker, () =>
              openStorefront(player, ledger, bizState, pricesState, businessId)
            )
        );
        return;
      }
      if (shopTag) {
        ev.cancel = true;
        const trade = shopTag.slice("ew:shop_".length);
        const business = storefrontBusinessForTrade(bizState, trade);
        if (business) {
          const player = ev.player;
          const speaker = ev.target.nameTag || tradeDef(trade).name;
          speakNpcPrelude(player, speaker, tags, "shop", trade);
          system.run(
            () =>
              void withNpcSpeaker(player, speaker, () =>
                openStorefront(player, ledger, bizState, pricesState, business.id)
              )
          );
        } else {
          console.warn(`[ew] shop tag ${shopTag} has no business (known: ${Object.keys(bizState.byId).join(",")})`);
        }
      }
    }
  });

  // Use-item on wallet opens pack/unpack hub
  world.afterEvents.itemUse.subscribe((ev) => {
    if (ev.itemStack.typeId === "ew:wallet") void openWallet(ev.source);
    if (ev.itemStack.typeId === BUILDERS_CATALOG_ITEM) {
      void openBuilderCatalog(ev.source);
    }
  });
  world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    if (
      !ev.isFirstEvent ||
      ev.itemStack?.typeId !== BUILDERS_CATALOG_ITEM
    ) {
      return;
    }
    ev.cancel = true;
    const blockLocation = ev.block.location;
    system.run(() => {
      tryPlaceFromCatalogTap(
        ev.player,
        blockLocation,
        bizState,
        extractionState
      );
    });
  });
  world.afterEvents.itemCompleteUse.subscribe((ev) => {
    noteCompletedFoodUse(
      foodState,
      ev.source.id,
      ev.itemStack.typeId,
      currentTick()
    );
  });

  world.afterEvents.entityDie.subscribe((ev) => {
    const player = asPlayer(ev.deadEntity);
    if (!player) return;
    const receipt = settlePlayerDeath(
      deathState,
      player,
      ledger,
      currentTick()
    );
    noteDialogueEvent({
      kind: "medical",
      summary: `${player.nameTag} received a ${formatAmount(receipt.due)} merid medical bill`,
      tick: receipt.tick,
    });
    saveBlob(LEDGER_KEY, ledger);
    system.run(() => {
      if (employmentState.sessions[player.id]) {
        const result = clockOut(employmentState, player.id, currentTick(), ledger);
        if (result.paid > 0) noteOnboardingPaycheck(player);
      }
      reclaimCompanyTools(player, "death");
      clearActionbar(player);
    });
  });
  world.afterEvents.playerSpawn.subscribe((ev) => {
    if (ev.initialSpawn) {
      ensureFirstJoinOnboarding(ev.player, ledger);
      saveBlob(LEDGER_KEY, ledger);
      return;
    }
    if (employmentState.sessions[ev.player.id]) {
      const result = clockOut(employmentState, ev.player.id, currentTick(), ledger);
      if (result.paid > 0) noteOnboardingPaycheck(ev.player);
    }
    reclaimCompanyTools(ev.player, "death");
    clearActionbar(ev.player);
    showPendingMedicalReceipt(deathState, ev.player);
  });
  world.afterEvents.playerLeave.subscribe((ev) => {
    clearPlayerUiState(ev.playerId);
    clearSpeakerContext(ev.playerId);
    clearCatalogPlayerState(ev.playerId);
  });

  const tradeNames = listCpuBusinesses(bizState)
    .map((b) => tradeDef(b.trade).name)
    .join(", ");
  console.log(`[ew] Economy World Phase G booted. CPU shops: ${tradeNames}`);
}

system.run(boot);
