/**
 * Employment: job board, clock-in/out, output tracking, fixed-tier payroll.
 * Every wage payment is a Ledger transfer from the business account.
 */
import type { Player } from "@minecraft/server";
import { balance, transfer, type LedgerState } from "../core/ledger";
import { loadBlob, saveBlob } from "../core/state";
import { currentTick, every } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { tradeDef } from "../content/trades";
import { actionbar, clearActionbar, toast } from "../ui/toast";
import { confirmTxn, menuHub } from "../ui/patterns";
import { bareAmount, merids } from "../ui/theme";
import {
  bizAccount,
  ensureBizFloat,
  listCpuBusinesses,
  type BusinessesState,
} from "./businesses";
import { playerAccount } from "./bank";
import { wagePayout } from "./employmentMath";

export interface EmploymentSession {
  playerId: string;
  businessId: string;
  tier: number;
  clockInTick: number;
  paidThroughTick: number;
  output: number;
}

export interface EmploymentState {
  schema: 1;
  sessions: Record<string, EmploymentSession>;
}

const KEY = "ew:employment";

export function emptyEmployment(): EmploymentState {
  return { schema: 1, sessions: {} };
}

export function loadEmployment(): EmploymentState {
  return loadBlob<EmploymentState>(KEY) ?? emptyEmployment();
}

export function saveEmployment(state: EmploymentState): void {
  saveBlob(KEY, state);
}

export function employmentSession(
  state: EmploymentState,
  playerId: string
): EmploymentSession | undefined {
  return state.sessions[playerId];
}

export function recordEmployeeOutput(
  state: EmploymentState,
  playerId: string,
  units: number
): void {
  const session = state.sessions[playerId];
  if (session) session.output += units;
}

function tierWage(tier: number): number {
  const wage = matrix.wagePerHourByTier[String(tier)];
  if (wage === undefined) throw new Error(`missing wage for tier ${tier}`);
  return wage;
}

function payElapsed(
  playerId: string,
  session: EmploymentSession,
  nowTick: number,
  ledger: LedgerState
): number {
  const elapsed = Math.max(0, nowTick - session.paidThroughTick);
  const payout = wagePayout(
    tierWage(session.tier),
    elapsed,
    matrix.work.employment.ticksPerHour
  );
  session.paidThroughTick = nowTick;
  if (payout <= 0) return 0;
  ensureBizFloat(ledger, session.businessId, payout);
  transfer(
    ledger,
    bizAccount(session.businessId),
    `p:${playerId}`,
    payout,
    nowTick,
    "employment:wage"
  );
  return payout;
}

export function clockOut(
  state: EmploymentState,
  playerId: string,
  nowTick: number,
  ledger: LedgerState
): number {
  const session = state.sessions[playerId];
  if (!session) return 0;
  const payout = payElapsed(playerId, session, nowTick, ledger);
  delete state.sessions[playerId];
  saveEmployment(state);
  return payout;
}

export async function openJobBoard(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  employment: EmploymentState
): Promise<void> {
  const active = employment.sessions[player.id];
  if (active) {
    const business = businesses.byId[active.businessId];
    const name = business ? tradeDef(business.trade).name : active.businessId;
    const now = currentTick();
    const pending = wagePayout(
      tierWage(active.tier),
      now - active.paidThroughTick,
      matrix.work.employment.ticksPerHour
    );
    await menuHub(player, {
      title: "Employment",
      facts: [
        `Clocked in: ${name}`,
        `Output: ${active.output}`,
        `Pending wage: ${bareAmount(pending)}`,
      ],
      narrator: "The time clock remembers.",
      buttons: [
        {
          label: "Clock out",
          onSelect: async () => {
            const before = balance(ledger, playerAccount(player));
            const ok = await confirmTxn(player, {
              title: "Clock out",
              facts: [`Business: ${name}`, `Output: ${active.output}`],
              lines: [{ label: "Pending wage", amount: pending, sense: "gain" }],
              balanceBefore: before,
              balanceAfter: before + pending,
              narrator: "Hours verified. Payroll is less sentimental.",
            });
            if (!ok) return;
            const paid = clockOut(employment, player.id, currentTick(), ledger);
            clearActionbar(player);
            if (paid > 0) toast(player, `Wage paid: ${merids(paid)}`, "gain");
          },
        },
      ],
    });
    return;
  }

  await menuHub(player, {
    title: "Job board",
    facts: [`Openings: ${listCpuBusinesses(businesses).length}`],
    narrator: "A steady wage is ownership's less dramatic cousin.",
    buttons: listCpuBusinesses(businesses).map((business) => ({
      label: `${tradeDef(business.trade).name} — ${bareAmount(tierWage(business.tier))}/hr`,
      onSelect: async () => {
        const before = balance(ledger, playerAccount(player));
        const ok = await confirmTxn(player, {
          title: "Clock in",
          facts: [
            `Business: ${tradeDef(business.trade).name}`,
            `Wage: ${merids(tierWage(business.tier))} per hour`,
          ],
          lines: [],
          balanceBefore: before,
          balanceAfter: before,
          narrator: "Tools are not included. Accountability is.",
        });
        if (!ok) return;
        const tick = currentTick();
        employment.sessions[player.id] = {
          playerId: player.id,
          businessId: business.id,
          tier: business.tier,
          clockInTick: tick,
          paidThroughTick: tick,
          output: 0,
        };
        saveEmployment(employment);
        actionbar(player, `${tradeDef(business.trade).name} · earned 0`, "info");
      },
    })),
  });
}

/** Hourly sweep; online/offline sessions settle through the same ledger path. */
export function startPayrollJob(
  state: EmploymentState,
  ledger: LedgerState
): void {
  every(
    "employment:payroll",
    matrix.work.employment.ticksPerHour,
    (tick) => {
      for (const session of Object.values(state.sessions)) {
        payElapsed(session.playerId, session, tick, ledger);
      }
      saveEmployment(state);
    }
  );
}
