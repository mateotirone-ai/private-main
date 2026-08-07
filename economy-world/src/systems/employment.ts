/**
 * Employment: job board, clock-in/out, output tracking, fixed-tier piece rates.
 * Every piece-rate payment is a Ledger transfer from the business account.
 */
import type { Player } from "@minecraft/server";
import { balance, transfer, LedgerError, type LedgerState } from "../core/ledger";
import { loadBlob, saveBlob } from "../core/state";
import { currentTick } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { tradeDef } from "../content/trades";
import { clearActionbar, setActionbarContext } from "../ui/toast";
import { feedback } from "../ui/feedback";
import { insufficientFundsMessage } from "../ui/funds";
import { confirmTxn, menuHub } from "../ui/patterns";
import { bareAmount, merids } from "../ui/theme";
import {
  bizAccount, 
  ensureBizFloat,
  type BusinessesState,
} from "./businesses";
import { playerAccount } from "./bank";
import { pieceRatePayout } from "./employmentMath";
import { issueCompanyTool, reclaimCompanyTools } from "./companyTools";
import { businessDisplayName, businessIsOpen } from "./businessMath";
import {
  noteOnboardingClockIn,
  noteOnboardingJobBoard,
  noteOnboardingPaycheck,
} from "./onboarding";

export interface EmploymentSession {
  playerId: string;
  businessId: string;
  trade: string;
  tier: number;
  ratePerUnit: number;
  clockInTick: number;
  output: number;
}

export interface EmploymentState {
  schema: 2;
  sessions: Record<string, EmploymentSession>;
}

export interface ClockOutResult {
  paid: number;
  due: number;
  settled: boolean;
}

const KEY = "ew:employment";

export function emptyEmployment(): EmploymentState {
  return { schema: 2, sessions: {} };
}

export function loadEmployment(): EmploymentState {
  const state = loadBlob<EmploymentState>(KEY) ?? emptyEmployment();
  state.schema = 2;
  for (const session of Object.values(state.sessions)) {
    session.trade ??= session.businessId.replace(/^cpu_/, "");
    session.ratePerUnit ??= pieceRateFor(session.trade, session.tier);
  }
  return state;
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
): { increment: number; total: number } | undefined {
  const session = state.sessions[playerId];
  if (!session) return undefined;
  const before = pieceRatePayout(session.ratePerUnit, session.output);
  session.output += units;
  const total = pieceRatePayout(session.ratePerUnit, session.output);
  return { increment: total - before, total };
}

export function pieceRateFor(trade: string, tier: number): number {
  const rate = matrix.work.employment.pieceRateByTradeTier[trade]?.[String(tier)];
  if (rate === undefined) {
    throw new Error(`missing piece rate for ${trade} tier ${tier}`);
  }
  return rate;
}

function payOutput(
  playerId: string,
  session: EmploymentSession,
  nowTick: number,
  ledger: LedgerState
): number {
  const payout = pieceRatePayout(session.ratePerUnit, session.output);
  if (payout <= 0) return 0;
  ensureBizFloat(ledger, session.businessId, payout);
  try {
    transfer(
      ledger,
      bizAccount(session.businessId),
      `p:${playerId}`,
      payout,
      nowTick,
      "employment:wage"
    );
    return payout;
  } catch (error) {
    if (error instanceof LedgerError) return -1;
    throw error;
  }
}

export function clockOut(
  state: EmploymentState,
  playerId: string,
  nowTick: number,
  ledger: LedgerState
): ClockOutResult {
  const session = state.sessions[playerId];
  if (!session) return { paid: 0, due: 0, settled: true };
  const due = pieceRatePayout(session.ratePerUnit, session.output);
  const payout = payOutput(playerId, session, nowTick, ledger);
  if (payout < 0) {
    saveEmployment(state);
    return { paid: 0, due, settled: false };
  }
  delete state.sessions[playerId];
  saveEmployment(state);
  return { paid: payout, due, settled: true };
}

/** Close every open shift at a business — used when renovation starts. */
export function forceClockOutBusiness(
  state: EmploymentState,
  businessId: string,
  nowTick: number,
  ledger: LedgerState
): Array<{ playerId: string; result: ClockOutResult }> {
  const playerIds = Object.values(state.sessions)
    .filter((session) => session.businessId === businessId)
    .map((session) => session.playerId);
  return playerIds.map((playerId) => ({
    playerId,
    result: clockOut(state, playerId, nowTick, ledger),
  }));
}

export async function openJobBoard(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  employment: EmploymentState
): Promise<void> {
  noteOnboardingJobBoard(player);
  const active = employment.sessions[player.id];
  if (active) {
    const business = businesses.byId[active.businessId];
    const name = business
      ? businessDisplayName(business)
      : tradeDef(active.trade).name;
    const pending = pieceRatePayout(active.ratePerUnit, active.output);
    await menuHub(player, {
      title: "Employment",
      facts: [
        `Clocked in: ${name}`,
        `Output: ${active.output}`,
        `Accrued pay: ${bareAmount(pending)}`,
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
              lines: [{ label: "Piece-rate pay", amount: pending, sense: "gain" }],
              balanceBefore: before,
              balanceAfter: before + pending,
              narrator: "Output verified. Payroll is less sentimental.",
            });
            if (!ok) return;
            const result = clockOut(employment, player.id, currentTick(), ledger);
            if (result.settled) {
              reclaimCompanyTools(player, "clockOut");
              clearActionbar(player, "employment");
            }
            if (result.paid > 0) {
              noteOnboardingPaycheck(player);
              feedback(player, `Piece-rate paid: ${merids(result.paid)}`, "gain");
            } else if (pending > 0 && business) {
              feedback(
                player,
                insufficientFundsMessage(
                  tradeDef(business.trade).name,
                  result.due,
                  balance(ledger, bizAccount(business.id))
                ),
                "error"
              );
            }
          },
        },
      ],
    });
    return;
  }

  const openBusinesses = Object.values(businesses.byId).filter(businessIsOpen);
  await menuHub(player, {
    title: "Job board",
    facts: [`Openings: ${openBusinesses.length}`],
    narrator: "A steady piece rate is ownership's less dramatic cousin.",
    buttons: openBusinesses.map((business) => ({
      label: `${businessDisplayName(business)} · ${bareAmount(pieceRateFor(business.trade, business.tier))}/unit`,
      onSelect: async () => {
        if (!businessIsOpen(business)) {
          feedback(
            player,
            `${tradeDef(business.trade).name} is closed for renovation.`,
            "caution"
          );
          return;
        }
        const before = balance(ledger, playerAccount(player));
        const ok = await confirmTxn(player, {
          title: "Clock in",
          facts: [
            `Business: ${businessDisplayName(business)}`,
            `Piece rate: ${merids(pieceRateFor(business.trade, business.tier))} per unit`,
          ],
          lines: [],
          balanceBefore: before,
          balanceAfter: before,
          narrator: "Tools are not included. Accountability is.",
        });
        if (!ok) return;
        if (
          !issueCompanyTool(
            player,
            business.id,
            business.trade,
            business.tier
          )
        ) {
          feedback(
            player,
            "Make one inventory slot available for the company tool.",
            "caution"
          );
          return;
        }
        const tick = currentTick();
        employment.sessions[player.id] = {
          playerId: player.id,
          businessId: business.id,
          trade: business.trade,
          tier: business.tier,
          ratePerUnit: pieceRateFor(business.trade, business.tier),
          clockInTick: tick,
          output: 0,
        };
        saveEmployment(employment);
        noteOnboardingClockIn(player);
        setActionbarContext(
          player,
          "employment",
          `${tradeDef(business.trade).name} · earned 0`,
          "info"
        );
      },
    })),
  });
}

export async function openBusinessOffice(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  employment: EmploymentState,
  businessId: string
): Promise<void> {
  const business = businesses.byId[businessId];
  if (!business) {
    feedback(player, "This office is not linked to a business.", "error");
    return;
  }
  const active = employment.sessions[player.id];
  if (active) {
    if (active.businessId !== business.id) {
      const other = businesses.byId[active.businessId];
      feedback(
        player,
        `You are clocked in at ${other ? businessDisplayName(other) : active.businessId}.`,
        "caution"
      );
      return;
    }
    const pending = pieceRatePayout(active.ratePerUnit, active.output);
    await menuHub(player, {
      title: `${tradeDef(business.trade).name} office`,
      facts: [
        `Clocked in: ${businessDisplayName(business)}`,
        `Output: ${active.output}`,
        `Accrued pay: ${bareAmount(pending)}`,
      ],
      narrator: "Your shift ledger is current.",
      buttons: [
        {
          label: "Clock out",
          onSelect: async () => {
            const before = balance(ledger, playerAccount(player));
            const ok = await confirmTxn(player, {
              title: "Clock out",
              facts: [
                `Business: ${businessDisplayName(business)}`,
                `Output: ${active.output}`,
              ],
              lines: [{ label: "Piece-rate pay", amount: pending, sense: "gain" }],
              balanceBefore: before,
              balanceAfter: before + pending,
              narrator: "Shift closed, payroll pending.",
            });
            if (!ok) return;
            const result = clockOut(employment, player.id, currentTick(), ledger);
            if (result.settled) {
              reclaimCompanyTools(player, "clockOut");
              clearActionbar(player, "employment");
            }
            if (result.paid > 0) {
              noteOnboardingPaycheck(player);
              feedback(player, `Piece-rate paid: ${merids(result.paid)}`, "gain");
            } else if (pending > 0) {
              feedback(
                player,
                insufficientFundsMessage(
                  tradeDef(business.trade).name,
                  result.due,
                  balance(ledger, bizAccount(business.id))
                ),
                "error"
              );
            }
          },
        },
      ],
    });
    return;
  }

  if (!businessIsOpen(business)) {
    feedback(
      player,
      `${tradeDef(business.trade).name} is closed for renovation.`,
      "caution"
    );
    return;
  }

  const rate = pieceRateFor(business.trade, business.tier);
  await menuHub(player, {
    title: `${tradeDef(business.trade).name} office`,
    facts: [
      `Opening: ${businessDisplayName(business)}`,
      `Piece rate: ${merids(rate)} per unit`,
    ],
    narrator: "Clock in here to work this business.",
    buttons: [
      {
        label: "Clock in",
        onSelect: async () => {
          if (!businessIsOpen(business)) {
            feedback(
              player,
              `${tradeDef(business.trade).name} is closed for renovation.`,
              "caution"
            );
            return;
          }
          const before = balance(ledger, playerAccount(player));
          const ok = await confirmTxn(player, {
            title: "Clock in",
            facts: [
              `Business: ${businessDisplayName(business)}`,
              `Piece rate: ${merids(rate)} per unit`,
            ],
            lines: [],
            balanceBefore: before,
            balanceAfter: before,
            narrator: "Clocking in issues your company tool.",
          });
          if (!ok) return;
          if (!issueCompanyTool(player, business.id, business.trade, business.tier)) {
            feedback(
              player,
              "Make one inventory slot available for the company tool.",
              "caution"
            );
            return;
          }
          const tick = currentTick();
          employment.sessions[player.id] = {
            playerId: player.id,
            businessId: business.id,
            trade: business.trade,
            tier: business.tier,
            ratePerUnit: rate,
            clockInTick: tick,
            output: 0,
          };
          saveEmployment(employment);
          noteOnboardingClockIn(player);
          setActionbarContext(
            player,
            "employment",
            `${tradeDef(business.trade).name} · earned 0`,
            "info"
          );
        },
      },
    ],
  });
}
