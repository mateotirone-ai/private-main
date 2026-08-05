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
import { actionbar, clearActionbar } from "../ui/toast";
import { feedback } from "../ui/feedback";
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
    if (error instanceof LedgerError) return 0;
    throw error;
  }
}

export function clockOut(
  state: EmploymentState,
  playerId: string,
  nowTick: number,
  ledger: LedgerState
): number {
  const session = state.sessions[playerId];
  if (!session) return 0;
  const payout = payOutput(playerId, session, nowTick, ledger);
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
            const paid = clockOut(employment, player.id, currentTick(), ledger);
            reclaimCompanyTools(player, "clockOut");
            clearActionbar(player);
            if (paid > 0) {
              feedback(player, `Piece-rate paid: ${merids(paid)}`, "gain");
            }
          },
        },
      ],
    });
    return;
  }

  await menuHub(player, {
    title: "Job board",
    facts: [`Openings: ${Object.values(businesses.byId).length}`],
    narrator: "A steady piece rate is ownership's less dramatic cousin.",
    buttons: Object.values(businesses.byId).map((business) => ({
      label: `${tradeDef(business.trade).name} — ${bareAmount(pieceRateFor(business.trade, business.tier))}/unit`,
      onSelect: async () => {
        const before = balance(ledger, playerAccount(player));
        const ok = await confirmTxn(player, {
          title: "Clock in",
          facts: [
            `Business: ${tradeDef(business.trade).name}`,
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
        actionbar(player, `${tradeDef(business.trade).name} · earned 0`, "info");
      },
    })),
  });
}
