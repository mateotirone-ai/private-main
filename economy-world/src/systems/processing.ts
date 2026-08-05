/**
 * Physical processing stations: consume raw business stock, wait, produce refined.
 * Station hosts are tagged `ew:station_<processing trade>`.
 */
import { world, type Player } from "@minecraft/server";
import { loadBlob, saveBlob } from "../core/state";
import { currentTick, every } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { processingDef, processingNumbers } from "../content/work";
import { tradeDef } from "../content/trades";
import {
  confirmTxn,
  managePanel,
  menuHub,
  progressPanel,
} from "../ui/patterns";
import { setActionbarContext } from "../ui/toast";
import { feedback } from "../ui/feedback";
import { balance } from "../core/ledger";
import type { LedgerState } from "../core/ledger";
import { playerAccount } from "./bank";
import {
  saveBusinesses,
  storefrontBusinessForTrade,
  type BusinessesState,
} from "./businesses";
import {
  completeProcessing,
  startProcessing,
  type ProcessingJob,
} from "./processingMath";
import { adjustStock, savePrices, type PricesState } from "./pricing";
import {
  employmentSession,
  recordEmployeeOutput,
  saveEmployment,
  type EmploymentState,
} from "./employment";
import { countItem } from "./cash";
import { noteOnboardingOutput } from "./onboarding";

export interface ProcessingState {
  schema: 2;
  jobs: Record<string, ProcessingJob>;
}

const KEY = "ew:processing";

function displayGood(good: string, qty: number): string {
  if (good === "log") return qty === 1 ? "log" : "logs";
  return good.replaceAll("_", " ");
}

function announceQueueComplete(
  stationId: string,
  trade: string,
  outputQty: number
): void {
  const station = world.getEntity(stationId);
  const speaker = station?.nameTag || tradeDef(trade).name;
  const line = `[${speaker}] Last batch is out — ${outputQty} ${displayGood(tradeDef(trade).good, outputQty)} on the shelves.`;
  if (!station) {
    world.sendMessage(`§e${line}`);
    return;
  }
  const listeners = station.dimension.getPlayers({
    location: station.location,
    maxDistance: 24,
  });
  if (!listeners.length) return;
  for (const player of listeners) player.sendMessage(`§e${line}`);
}

export function emptyProcessing(): ProcessingState {
  return { schema: 2, jobs: {} };
}

export function loadProcessing(): ProcessingState {
  const state = loadBlob<ProcessingState>(KEY) ?? emptyProcessing();
  state.schema = 2;
  for (const job of Object.values(state.jobs)) {
    job.durationTicks ??= job.dueTick - job.startedTick;
    job.batchesTotal ??= 1;
    job.batchesCompleted ??= job.complete ? 1 : 0;
    job.outputShelvedTotal ??= 0;
  }
  return state;
}

export function saveProcessing(state: ProcessingState): void {
  saveBlob(KEY, state);
}

export async function openProcessingStation(
  player: Player,
  ledger: LedgerState,
  state: ProcessingState,
  businesses: BusinessesState,
  prices: PricesState,
  employment: EmploymentState,
  trade: string,
  stationId: string
): Promise<void> {
  const content = processingDef(trade);
  if (!content) {
    feedback(player, "This station has no configured recipe.", "error");
    return;
  }
  const numbers = processingNumbers(trade);
  const inputBusiness = storefrontBusinessForTrade(businesses, numbers.inputTrade);
  const outputBusiness = storefrontBusinessForTrade(businesses, trade);
  if (!inputBusiness || !outputBusiness) {
    feedback(player, "Processing businesses are unavailable.", "error");
    return;
  }
  const personalRaw = countItem(
    player,
    tradeDef(numbers.inputTrade).item
  );

  const active = state.jobs[stationId];
  if (active && !active.complete) {
    const remainingTicks = Math.max(0, active.dueTick - currentTick());
    const remainingSeconds = Math.ceil(
      remainingTicks / matrix.work.processingTicksPerSecond
    );
    const currentBatch = Math.min(active.batchesCompleted + 1, active.batchesTotal);
    await progressPanel(player, {
      title: `${tradeDef(trade).name} station`,
      facts: [
        `Business raw stock: ${inputBusiness.storage} ${displayGood(content.inputGood, inputBusiness.storage)}`,
        `Business refined stock: ${outputBusiness.storage} ${displayGood(content.outputGood, outputBusiness.storage)}`,
        `Personal inventory: ${personalRaw} ${displayGood(content.inputGood, personalRaw)}`,
        `Running: ${numbers.inputQty} ${displayGood(content.inputGood, numbers.inputQty)} → ${numbers.outputQty} ${displayGood(content.outputGood, numbers.outputQty)}, ${remainingSeconds}s`,
        `Queue: ${currentBatch} of ${active.batchesTotal}`,
        "Processing uses business stock, never personal inventory",
      ],
      narrator: "Refinement is mostly waiting with paperwork.",
      rows: [
        {
          label: "Processing",
          filled: Math.max(0, active.durationTicks - remainingTicks),
          total: active.durationTicks,
        },
      ],
    });
    return;
  }

  const maxBatches = Math.floor(inputBusiness.storage / numbers.inputQty);
  await menuHub(player, {
    title: `${tradeDef(trade).name} station`,
    facts: [
      `Business raw stock: ${inputBusiness.storage} ${displayGood(content.inputGood, inputBusiness.storage)}`,
      `Business refined stock: ${outputBusiness.storage} ${displayGood(content.outputGood, outputBusiness.storage)}`,
      `Personal inventory: ${personalRaw} ${displayGood(content.inputGood, personalRaw)}`,
      "Processing uses business stock, never personal inventory",
      "Station: idle",
    ],
    narrator: "Load it. Wait. Haul something better.",
    buttons: [
      {
        label: `Queue batches — max ${maxBatches}`,
        onSelect: async () => {
          if (maxBatches <= 0) {
            feedback(player, "Not enough business raw stock.", "caution");
            return;
          }
          const selection = await managePanel(player, {
            title: "Queue processing",
            fields: [
              {
                type: "slider",
                label: `Batches (max ${maxBatches})`,
                min: 1,
                max: maxBatches,
                step: 1,
                defaultValue: 1,
              },
            ],
            saveLabel: "Review batch",
          });
          if (!selection) return;
          const batches = Number(selection.values[0]);
          const accountBalance = balance(ledger, playerAccount(player));
          const ok = await confirmTxn(player, {
            title: "Queue processing",
            facts: [
              `Batches: ${batches}`,
              `Business input: ${numbers.inputQty * batches} ${displayGood(content.inputGood, numbers.inputQty * batches)}`,
              `Business output: ${numbers.outputQty * batches} ${displayGood(content.outputGood, numbers.outputQty * batches)}`,
              "Personal inventory is not used",
            ],
            lines: [],
            balanceBefore: accountBalance,
            balanceAfter: accountBalance,
            narrator: "Queued in order. The machinery dislikes improvisation.",
          });
          if (!ok) return;

          try {
            const busy = state.jobs[stationId];
            if (busy && !busy.complete) {
              feedback(player, "This station is already running a queue.", "caution");
              return;
            }
            const latestInputBusiness =
              storefrontBusinessForTrade(businesses, numbers.inputTrade);
            if (!latestInputBusiness) {
              feedback(player, "Processing businesses are unavailable.", "error");
              return;
            }
            const latestMaxBatches = Math.floor(
              latestInputBusiness.storage / numbers.inputQty
            );
            if (latestMaxBatches < batches) {
              feedback(player, "Not enough business raw stock.", "caution");
              return;
            }
            const session = employmentSession(employment, player.id);
            const started = startProcessing(
              stationId,
              trade,
              currentTick(),
              latestInputBusiness.storage,
              numbers,
              session?.businessId === outputBusiness.id
                ? player.id
                : undefined,
              batches
            );
            latestInputBusiness.storage = started.inputStockAfter;
            adjustStock(
              prices,
              content.inputGood,
              -(numbers.inputQty * batches)
            );
            state.jobs[stationId] = started.job;
            saveProcessing(state);
            saveBusinesses(businesses);
            savePrices(prices);
            feedback(
              player,
              `${batches} ${batches === 1 ? "batch" : "batches"} queued.`,
              "info"
            );
          } catch {
            feedback(player, "Not enough business raw stock.", "caution");
          }
        },
      },
    ],
  });
}

export function startProcessingJob(
  state: ProcessingState,
  businesses: BusinessesState,
  prices: PricesState,
  employment: EmploymentState
): void {
  every("processing:complete", matrix.work.processingSweepTicks, (tick) => {
    let changed = false;
    for (const job of Object.values(state.jobs)) {
      const wasComplete = job.complete;
      const output = completeProcessing(job, tick);
      if (output <= 0) continue;
      const business = storefrontBusinessForTrade(businesses, job.trade);
      const content = processingDef(job.trade);
      if (!business || !content) continue;
      const cap = tradeDef(job.trade).storageCap;
      const stored = Math.min(output, Math.max(0, cap - business.storage));
      job.outputShelvedTotal += stored;
      business.storage += stored;
      business.producedTotal += stored;
      adjustStock(prices, content.outputGood, stored);
      if (job.employeeId && stored > 0) {
        const progress = recordEmployeeOutput(
          employment,
          job.employeeId,
          stored
        );
        const player = world
          .getAllPlayers()
          .find((candidate) => candidate.id === job.employeeId);
        if (player && progress) {
          noteOnboardingOutput(player);
          setActionbarContext(
            player,
            "employment",
            `${tradeDef(job.trade).name} · +${progress.increment} · total ${progress.total}`,
            "info"
          );
        }
      }
      if (!wasComplete && job.complete) {
        announceQueueComplete(job.id, job.trade, job.outputShelvedTotal);
      }
      changed = true;
    }
    if (!changed) return;
    saveProcessing(state);
    saveBusinesses(businesses);
    savePrices(prices);
    saveEmployment(employment);
  });
}
