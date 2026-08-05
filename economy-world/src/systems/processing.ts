/**
 * Physical processing stations: consume raw business stock, wait, produce refined.
 * Station hosts are tagged `ew:station_<processing trade>`.
 */
import type { Player } from "@minecraft/server";
import { loadBlob, saveBlob } from "../core/state";
import { currentTick, every } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { processingDef, processingNumbers } from "../content/work";
import { tradeDef } from "../content/trades";
import { confirmTxn, progressPanel } from "../ui/patterns";
import { toast } from "../ui/toast";
import { balance } from "../core/ledger";
import type { LedgerState } from "../core/ledger";
import { playerAccount } from "./bank";
import { saveBusinesses, type BusinessesState } from "./businesses";
import {
  completeProcessing,
  startProcessing,
  type ProcessingJob,
} from "./processingMath";
import { adjustStock, savePrices, type PricesState } from "./pricing";

export interface ProcessingState {
  schema: 1;
  jobs: Record<string, ProcessingJob>;
}

const KEY = "ew:processing";

export function emptyProcessing(): ProcessingState {
  return { schema: 1, jobs: {} };
}

export function loadProcessing(): ProcessingState {
  return loadBlob<ProcessingState>(KEY) ?? emptyProcessing();
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
  trade: string,
  stationId: string
): Promise<void> {
  const content = processingDef(trade);
  if (!content) {
    toast(player, "This station has no configured recipe.", "error");
    return;
  }
  const numbers = processingNumbers(trade);
  const inputBusiness = businesses.byId[`cpu_${numbers.inputTrade}`];
  const outputBusiness = businesses.byId[`cpu_${trade}`];
  if (!inputBusiness || !outputBusiness) {
    toast(player, "Processing businesses are unavailable.", "error");
    return;
  }

  const active = state.jobs[stationId];
  if (active && !active.complete) {
    await progressPanel(player, {
      title: `${tradeDef(trade).name} station`,
      facts: [
        `Input: ${numbers.inputQty} ${content.inputGood}`,
        `Output: ${numbers.outputQty} ${content.outputGood}`,
        `Ticks remaining: ${Math.max(0, active.dueTick - currentTick())}`,
      ],
      narrator: "Refinement is mostly waiting with paperwork.",
      rows: [
        {
          label: "Processing",
          filled: currentTick() - active.startedTick,
          total: active.dueTick - active.startedTick,
        },
      ],
    });
    return;
  }

  const accountBalance = balance(ledger, playerAccount(player));
  const ok = await confirmTxn(player, {
    title: `${tradeDef(trade).name} station`,
    facts: [
      `Load: ${numbers.inputQty} ${content.inputGood}`,
      `Output: ${numbers.outputQty} ${content.outputGood}`,
      `Duration: ${numbers.durationTicks} ticks`,
      `Input stock: ${inputBusiness.storage}`,
    ],
    lines: [],
    balanceBefore: accountBalance,
    balanceAfter: accountBalance,
    narrator: "Load it. Wait. Haul something better.",
  });
  if (!ok) return;

  try {
    const started = startProcessing(
      stationId,
      trade,
      currentTick(),
      inputBusiness.storage,
      numbers
    );
    inputBusiness.storage = started.inputStockAfter;
    adjustStock(prices, content.inputGood, -numbers.inputQty);
    state.jobs[stationId] = started.job;
    saveProcessing(state);
    saveBusinesses(businesses);
    savePrices(prices);
    toast(player, "Processing started.", "info");
  } catch {
    toast(player, "Not enough raw stock.", "caution");
  }
}

export function startProcessingJob(
  state: ProcessingState,
  businesses: BusinessesState,
  prices: PricesState
): void {
  every("processing:complete", matrix.work.processingSweepTicks, (tick) => {
    let changed = false;
    for (const job of Object.values(state.jobs)) {
      const output = completeProcessing(job, tick);
      if (output <= 0) continue;
      const business = businesses.byId[`cpu_${job.trade}`];
      const content = processingDef(job.trade);
      if (!business || !content) continue;
      const cap = tradeDef(job.trade).storageCap;
      const stored = Math.min(output, Math.max(0, cap - business.storage));
      business.storage += stored;
      business.producedTotal += stored;
      adjustStock(prices, content.outputGood, stored);
      changed = true;
    }
    if (!changed) return;
    saveProcessing(state);
    saveBusinesses(businesses);
    savePrices(prices);
  });
}
