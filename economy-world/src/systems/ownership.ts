import type { Player } from "@minecraft/server";
import { currentTick, every } from "../core/scheduler";
import { sink, transfer, balance, type LedgerState, LedgerError } from "../core/ledger";
import { matrix } from "../content/matrix";
import { tradeDef } from "../content/trades";
import { goodConfig } from "../content/prices";
import { confirmTxn, managePanel, menuHub } from "../ui/patterns";
import { bareAmount, merids } from "../ui/theme";
import { feedback } from "../ui/feedback";
import { setActionbarContext } from "../ui/toast";
import { playerAccount } from "./bank";
import {
  bizAccount,
  recentRevenueTotal,
  recordBusinessRevenue,
  saveBusinesses,
  storefrontBusinessForTrade,
  type Business,
  type BusinessesState,
} from "./businesses";
import {
  evaluateBusiness,
  resolveSealedAuction,
  type AuctionResolution,
} from "./ownershipMath";
import { loadBlob, saveBlob } from "../core/state";
import { noteDialogueEvent } from "./dialogue";

interface OwnershipState {
  schema: 1;
  firstOwnershipClaimed: boolean;
}

const KEY = "ew:ownership";
export interface SuccessorSpawnPayload {
  predecessorId: string;
  successorId: string;
  trade: string;
  offset: { x: number; y: number; z: number };
}
let successorSpawnHook: ((payload: SuccessorSpawnPayload) => void) | undefined;

export function setSuccessorSpawnHook(
  hook: ((payload: SuccessorSpawnPayload) => void) | undefined
): void {
  successorSpawnHook = hook;
}

function loadOwnershipState(): OwnershipState {
  return loadBlob<OwnershipState>(KEY) ?? { schema: 1, firstOwnershipClaimed: false };
}

function saveOwnershipState(state: OwnershipState): void {
  saveBlob(KEY, state);
}

export function businessEvaluation(
  businesses: BusinessesState,
  business: Business
): number {
  const unit = goodConfig(tradeDef(business.trade).good).base;
  const revenue = recentRevenueTotal(businesses, business.id, currentTick());
  const upgradeSpend = business.construction?.cost ?? 0;
  return evaluateBusiness(matrix.ownership.evaluation, {
    trade: business.trade,
    tier: business.tier,
    storageUnits: business.storage,
    marketUnitPrice: unit,
    recentRevenue: revenue,
    upgradeSpend,
  });
}

function nextSuccessorId(businesses: BusinessesState, trade: string): string {
  let i = 1;
  while (businesses.byId[`cpu_${trade}_succ_${i}`]) i += 1;
  return `cpu_${trade}_succ_${i}`;
}

function nextPlayerBusinessId(
  businesses: BusinessesState,
  trade: string,
  playerId: string
): string {
  let i = 1;
  while (businesses.byId[`player_${trade}_${playerId}_${i}`]) i += 1;
  return `player_${trade}_${playerId}_${i}`;
}

function completeBuyout(
  player: Player,
  businesses: BusinessesState,
  sourceBusiness: Business
): void {
  const oldId = sourceBusiness.id;
  const playerBusinessId = nextPlayerBusinessId(businesses, sourceBusiness.trade, player.id);
  const successorId = nextSuccessorId(businesses, sourceBusiness.trade);
  const seed = Math.floor(tradeDef(sourceBusiness.trade).storageCap / 2);
  const purchased: Business = {
    ...sourceBusiness,
    id: playerBusinessId,
    owner: player.id,
    ownerAccount: playerAccount(player),
    successorOf: sourceBusiness.successorOf,
  };
  const successor: Business = {
    ...sourceBusiness,
    id: successorId,
    owner: "cpu",
    ownerAccount: null,
    storage: seed,
    producedTotal: 0,
    revenueBalance: 0,
    revenueHistory: [],
    employeeSlots: [],
    successorOf: oldId,
    construction: null,
  };
  delete businesses.byId[oldId];
  businesses.byId[playerBusinessId] = purchased;
  businesses.byId[`cpu_${sourceBusiness.trade}`] = successor;
  successorSpawnHook?.({
    predecessorId: oldId,
    successorId,
    trade: sourceBusiness.trade,
    offset: matrix.ownership.management.successorSpawnOffset,
  });
}

function summarizeAuction(result: AuctionResolution): string[] {
  return result.bids.map(
    (bid) => `${bid.bidder.toUpperCase()}: ${merids(bid.amount)}`
  );
}

async function runBuyoutFlow(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  business: Business
): Promise<void> {
  const evalValue = businessEvaluation(businesses, business);
  const before = balance(ledger, playerAccount(player));
  const panel = await managePanel(player, {
    title: `Buyout auction — ${tradeDef(business.trade).name}`,
    fields: [
      {
        type: "slider",
        label: "Your sealed max bid",
        min: Math.max(1, Math.floor(evalValue * 0.5)),
        max: Math.max(Math.floor(evalValue * 2), 1),
        step: 1,
        defaultValue: evalValue,
      },
    ],
    saveLabel: "Submit bid",
  });
  if (!panel) return;
  const playerBid = Number(panel.values[0]);
  if (before < playerBid) {
    feedback(player, "Insufficient bank balance for that bid.", "error");
    return;
  }
  const ok = await confirmTxn(player, {
    title: "Confirm sealed bid",
    facts: [
      `Evaluation: ${merids(evalValue)}`,
      `Your max bid: ${merids(playerBid)}`,
      "Only the winner pays.",
    ],
    lines: [],
    balanceBefore: before,
    balanceAfter: before,
    narrator: "Bids are sealed. Pride is not.",
  });
  if (!ok) return;

  const result = resolveSealedAuction(matrix.ownership.auction, evalValue, playerBid);
  if (result.winner.bidder !== "player") {
    feedback(player, `Auction lost — ${result.winner.bidder.toUpperCase()} won at ${merids(result.winner.amount)}.`, "caution");
    feedback(player, summarizeAuction(result).join(" | "), "info");
    return;
  }
  try {
    sink(
      ledger,
      playerAccount(player),
      result.winner.amount,
      currentTick(),
      "sink:buyout"
    );
  } catch (error) {
    if (error instanceof LedgerError) {
      feedback(player, "Funds changed before settlement; bid cancelled.", "error");
      return;
    }
    throw error;
  }
  completeBuyout(player, businesses, business);
  noteDialogueEvent({
    kind: "ownership",
    summary: `${player.nameTag} bought ${tradeDef(business.trade).name}`,
    tick: currentTick(),
    trade: business.trade,
  });
  const ownership = loadOwnershipState();
  if (!ownership.firstOwnershipClaimed) {
    ownership.firstOwnershipClaimed = true;
    saveOwnershipState(ownership);
    feedback(
      player,
      `World first: ${player.nameTag} now owns ${tradeDef(business.trade).name}.`,
      "gain"
    );
  }
  feedback(player, `Buyout won at ${merids(result.winner.amount)}. Ownership transferred.`, "gain");
  saveBusinesses(businesses);
}

async function openOwnerManagement(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  business: Business
): Promise<void> {
  const evalValue = businessEvaluation(businesses, business);
  const bizBal = balance(ledger, bizAccount(business.id));
  const construction = business.construction
    ? `T${business.construction.targetTier} finishes in ${Math.max(
        0,
        business.construction.completeTick - currentTick()
      )} ticks`
    : "None";
  await menuHub(player, {
    title: `${tradeDef(business.trade).name} management`,
    facts: [
      `Business ID: ${business.id}`,
      `Tier: T${business.tier}`,
      `Storage: ${business.storage}`,
      `Business balance: ${merids(bizBal)}`,
      `Accrued revenue: ${merids(business.revenueBalance)}`,
      `Evaluation: ${merids(evalValue)}`,
      `Construction: ${construction}`,
      `Employee slots: ${business.employeeSlots.length}/${matrix.ownership.management.maxEmployeeSlots}`,
    ],
    narrator: "Ownership is spreadsheets with weather.",
    buttons: [
      {
        label: "Collect earnings",
        onSelect: () => {
          const owed = Math.max(0, business.revenueBalance);
          if (owed <= 0) {
            feedback(player, "No earnings are ready to collect.", "info");
            return;
          }
          const available = balance(ledger, bizAccount(business.id));
          const payout = Math.min(owed, available);
          if (payout <= 0) {
            feedback(player, "Business account has no liquid funds.", "caution");
            return;
          }
          transfer(
            ledger,
            bizAccount(business.id),
            playerAccount(player),
            payout,
            currentTick(),
            "owner:collect"
          );
          business.revenueBalance -= payout;
          saveBusinesses(businesses);
          feedback(player, `Collected ${merids(payout)}.`, "gain");
        },
      },
      {
        label: "Set price policy",
        onSelect: async () => {
          const range = matrix.ownership.management;
          const panel = await managePanel(player, {
            title: "Price override",
            fields: [
              {
                type: "slider",
                label: "Market multiplier %",
                min: Math.round(range.priceOverrideMinPct * 100),
                max: Math.round(range.priceOverrideMaxPct * 100),
                step: 1,
                defaultValue: Math.round((business.priceOverridePct ?? 1) * 100),
              },
            ],
            saveLabel: "Apply policy",
          });
          if (!panel) return;
          business.priceOverridePct = Number(panel.values[0]) / 100;
          saveBusinesses(businesses);
          feedback(player, `Price policy set to ${bareAmount(Math.round((business.priceOverridePct ?? 1) * 100))}% of market.`, "info");
        },
      },
      {
        label: "Hire/fire stub slot",
        onSelect: () => {
          if (
            business.employeeSlots.length <
            matrix.ownership.management.maxEmployeeSlots
          ) {
            business.employeeSlots.push(`stub_${business.id}_${business.employeeSlots.length + 1}`);
            feedback(player, "Employee slot added.", "gain");
          } else {
            business.employeeSlots.pop();
            feedback(player, "Employee slot removed.", "caution");
          }
          saveBusinesses(businesses);
        },
      },
      {
        label: "Upgrade tier",
        onSelect: async () => {
          if (business.construction) {
            feedback(player, "An upgrade is already under construction.", "caution");
            return;
          }
          if (business.tier >= 3) {
            feedback(player, "Business is already at max tier.", "info");
            return;
          }
          const targetTier = (business.tier + 1) as 2 | 3;
          const cost =
            matrix.ownership.management.upgradeCostByTradeTier[business.trade]?.[
              String(targetTier)
            ];
          const duration =
            matrix.ownership.management.upgradeDurationTicksByTier[String(targetTier)];
          if (!cost || !duration) {
            feedback(player, "Upgrade tuning is missing for this trade.", "error");
            return;
          }
          const ok = await confirmTxn(player, {
            title: `Upgrade to T${targetTier}`,
            facts: [
              `Cost: ${merids(cost)} (business funds)`,
              `Build time: ${duration} ticks`,
            ],
            lines: [{ label: "Construction sink", amount: cost, sense: "loss" }],
            balanceBefore: bizBal,
            balanceAfter: Math.max(0, bizBal - cost),
            narrator: "Construction crews bill before they build.",
          });
          if (!ok) return;
          sink(ledger, bizAccount(business.id), cost, currentTick(), "sink:construction");
          business.construction = {
            targetTier,
            startedTick: currentTick(),
            completeTick: currentTick() + duration,
            cost,
          };
          saveBusinesses(businesses);
          noteDialogueEvent({
            kind: "construction",
            summary: `${tradeDef(business.trade).name} started a T${targetTier} upgrade`,
            tick: currentTick(),
            trade: business.trade,
          });
          setActionbarContext(
            player,
            "construction",
            `${tradeDef(business.trade).name} · T${targetTier} construction`,
            "caution",
            business.construction.completeTick
          );
          feedback(player, `Upgrade started: T${targetTier}.`, "gain");
        },
      },
    ],
  });
}

export async function openOwnershipPanel(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  trade: string,
  explicitBusinessId?: string
): Promise<void> {
  const business =
    (explicitBusinessId && businesses.byId[explicitBusinessId]) ??
    storefrontBusinessForTrade(businesses, trade);
  if (!business) {
    feedback(player, "No business was found for this trade.", "error");
    return;
  }
  if (business.owner === "cpu") {
    await runBuyoutFlow(player, ledger, businesses, business);
    return;
  }
  if (business.owner !== player.id) {
    feedback(player, "Only the owner can use this management panel.", "caution");
    return;
  }
  await openOwnerManagement(player, ledger, businesses, business);
}

export function startOwnershipJobs(businesses: BusinessesState): void {
  every("ownership:upgrades", 20, () => {
    let changed = false;
    for (const business of Object.values(businesses.byId)) {
      if (!business.construction) continue;
      if (currentTick() < business.construction.completeTick) continue;
      const completedTier = business.construction.targetTier;
      business.tier = business.construction.targetTier;
      business.construction = null;
      noteDialogueEvent({
        kind: "construction",
        summary: `${tradeDef(business.trade).name} completed its T${completedTier} upgrade`,
        tick: currentTick(),
        trade: business.trade,
      });
      changed = true;
    }
    if (changed) saveBusinesses(businesses);
  });
}

export function noteBusinessRevenue(
  businesses: BusinessesState,
  businessId: string,
  amount: number
): void {
  recordBusinessRevenue(businesses, businessId, amount, currentTick());
}
