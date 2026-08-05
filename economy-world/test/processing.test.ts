import { describe, expect, it } from "vitest";
import { processingNumbers } from "../src/content/work";
import {
  canStartProcessing,
  completeProcessing,
  startProcessing,
} from "../src/systems/processingMath";

describe("processing conversion", () => {
  const recipe = processingNumbers("sawmill");

  it("consumes configured raw input once", () => {
    expect(canStartProcessing(2, recipe)).toBe(true);
    expect(canStartProcessing(1, recipe)).toBe(false);
    const started = startProcessing("station", "sawmill", 50, 10, recipe);
    expect(started.inputStockAfter).toBe(10 - recipe.inputQty);
    expect(started.job.dueTick).toBe(50 + recipe.durationTicks);
  });

  it("releases configured refined output only when due", () => {
    const { job } = startProcessing("station", "sawmill", 50, 10, recipe);
    expect(completeProcessing(job, job.dueTick - 1)).toBe(0);
    expect(completeProcessing(job, job.dueTick)).toBe(recipe.outputQty);
    expect(completeProcessing(job, job.dueTick + 1)).toBe(0);
  });

  it("rejects a conversion without enough input", () => {
    expect(() =>
      startProcessing("station", "sawmill", 0, recipe.inputQty - 1, recipe)
    ).toThrow(/insufficient processing input/);
  });

  it("reserves selected batches and completes them sequentially", () => {
    const started = startProcessing(
      "station",
      "sawmill",
      50,
      recipe.inputQty * 3,
      recipe,
      "worker",
      3
    );
    expect(started.inputStockAfter).toBe(0);
    expect(started.job.batchesTotal).toBe(3);

    expect(completeProcessing(started.job, started.job.dueTick)).toBe(
      recipe.outputQty
    );
    expect(started.job.complete).toBe(false);
    expect(started.job.batchesCompleted).toBe(1);
    expect(completeProcessing(started.job, started.job.dueTick)).toBe(
      recipe.outputQty
    );
    expect(started.job.batchesCompleted).toBe(2);
    expect(completeProcessing(started.job, started.job.dueTick)).toBe(
      recipe.outputQty
    );
    expect(started.job.complete).toBe(true);
  });
});
