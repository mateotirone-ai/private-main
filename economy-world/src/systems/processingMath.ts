export interface ProcessingRecipe {
  inputQty: number;
  outputQty: number;
  durationTicks: number;
}

export interface ProcessingJob {
  id: string;
  trade: string;
  startedTick: number;
  dueTick: number;
  inputQty: number;
  outputQty: number;
  complete: boolean;
}

export function canStartProcessing(inputStock: number, recipe: ProcessingRecipe): boolean {
  return inputStock >= recipe.inputQty;
}

/** Consume inputs once and construct a timed conversion job. */
export function startProcessing(
  id: string,
  trade: string,
  nowTick: number,
  inputStock: number,
  recipe: ProcessingRecipe
): { job: ProcessingJob; inputStockAfter: number } {
  if (!canStartProcessing(inputStock, recipe)) {
    throw new Error(`insufficient processing input: ${inputStock} < ${recipe.inputQty}`);
  }
  return {
    job: {
      id,
      trade,
      startedTick: nowTick,
      dueTick: nowTick + recipe.durationTicks,
      inputQty: recipe.inputQty,
      outputQty: recipe.outputQty,
      complete: false,
    },
    inputStockAfter: inputStock - recipe.inputQty,
  };
}

/** Complete once at/after dueTick; returns output units released. */
export function completeProcessing(job: ProcessingJob, nowTick: number): number {
  if (job.complete || nowTick < job.dueTick) return 0;
  job.complete = true;
  return job.outputQty;
}
