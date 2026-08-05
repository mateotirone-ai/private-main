/**
 * One master loop; systems register jobs with an interval in game ticks.
 * 20 ticks = 1 second. Price tick = 10 min = 12000 ticks (from data, later).
 */
import { system } from "@minecraft/server";

type Job = { name: string; every: number; fn: (tick: number) => void; last: number };
const jobs: Job[] = [];
let tickCount = 0;

export function every(name: string, everyTicks: number, fn: (tick: number) => void): void {
  jobs.push({ name, every: everyTicks, fn, last: 0 });
}

export function startScheduler(): void {
  system.runInterval(() => {
    tickCount += 1;
    for (const j of jobs) {
      if (tickCount - j.last >= j.every) {
        j.last = tickCount;
        try {
          j.fn(tickCount);
        } catch (e) {
          console.error(`[ew] job ${j.name} failed: ${e}`);
        }
      }
    }
  }, 1);
}

export function currentTick(): number {
  return tickCount;
}
