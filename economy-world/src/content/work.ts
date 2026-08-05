import raw from "../../data/work.json";
import { matrix } from "./matrix";

export interface ExtractionDef {
  readyBlock: string;
  stageBlocks: { depleted: string; recovering: string };
}

export interface ProcessingDef {
  inputGood: string;
  outputGood: string;
}

export interface WorkConfig {
  extraction: Record<string, ExtractionDef>;
  processing: Record<string, ProcessingDef>;
  jobTools: Record<string, Record<string, string>>;
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

export function jobToolItem(trade: string, tier: number): string {
  const item = workConfig.jobTools[trade]?.[String(tier)];
  if (!item) throw new Error(`missing company tool for ${trade} tier ${tier}`);
  return item;
}
