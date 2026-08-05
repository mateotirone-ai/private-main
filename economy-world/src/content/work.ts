import raw from "../../data/work.json";
import { matrix } from "./matrix";

export interface ExtractionDef {
  harvestBlocks: string[];
  readyBlock: string;
}

export interface ProcessingDef {
  inputGood: string;
  outputGood: string;
}

export interface WorkConfig {
  extraction: Record<string, ExtractionDef>;
  processing: Record<string, ProcessingDef>;
  service: Record<string, { needGood: string }>;
  stageBlocks: { depleted: string; recovering: string };
}

export const workConfig = raw as unknown as WorkConfig;

export function extractionDef(trade: string): ExtractionDef | undefined {
  return workConfig.extraction[trade];
}

export function processingDef(trade: string): ProcessingDef | undefined {
  return workConfig.processing[trade];
}

export function processingNumbers(trade: string) {
  const cfg = matrix.work.processing[trade];
  if (!cfg) throw new Error(`missing processing numbers for ${trade}`);
  return cfg;
}

export function extractionTradeForBlock(blockId: string): string | undefined {
  for (const [trade, cfg] of Object.entries(workConfig.extraction)) {
    if (cfg.harvestBlocks.includes(blockId)) return trade;
  }
  return undefined;
}
