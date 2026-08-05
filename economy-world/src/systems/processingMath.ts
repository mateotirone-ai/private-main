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
  durationTicks: number;
  inputQty: number;
  outputQty: number;
  batchesTotal: number;
  batchesCompleted: number;
  employeeId?: string;
  complete: boolean;
}

export function canStartProcessing(
  inputStock: number,
  recipe: ProcessingRecipe,
  batches = 1
): boolean {
  return (
    Number.isInteger(batches) &&
    batches > 0 &&
    inputStock >= recipe.inputQty * batches
  );
}

/** Consume inputs once and construct a timed conversion job. */
export function startProcessing(
  id: string,
  trade: string,
  nowTick: number,
  inputStock: number,
  recipe: ProcessingRecipe,
  employeeId?: string,
  batches = 1
): { job: ProcessingJob; inputStockAfter: number } {
  const totalInput = recipe.inputQty * batches;
  if (!canStartProcessing(inputStock, recipe, batches)) {
    throw new Error(`insufficient processing input: ${inputStock} < ${totalInput}`);
  }
  return {
    job: {
      id,
      trade,
      startedTick: nowTick,
      dueTick: nowTick + recipe.durationTicks,
      durationTicks: recipe.durationTicks,
      inputQty: recipe.inputQty,
      outputQty: recipe.outputQty,
      batchesTotal: batches,
      batchesCompleted: 0,
      employeeId,
      complete: false,
    },
    inputStockAfter: inputStock - totalInput,
  };
}

/** Complete once at/after dueTick; returns output units released. */
export function completeProcessing(job: ProcessingJob, nowTick: number): number {
  if (job.complete || nowTick < job.dueTick) return 0;
  job.batchesCompleted += 1;
  if (job.batchesCompleted >= job.batchesTotal) job.complete = true;
  else job.dueTick += job.durationTicks;
  return job.outputQty;
}
