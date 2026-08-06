import { world, type Player } from "@minecraft/server";
import { currentTick, every } from "../core/scheduler";
import { sink, transfer, balance, type LedgerState, LedgerError } from "../core/ledger";
import { matrix } from "../content/matrix";
import { tradeDef } from "../content/trades";
import { goodConfig } from "../content/prices";
import { confirmTxn, managePanel, menuHub } from "../ui/patterns";
import { bareAmount, formatAmount, merids } from "../ui/theme";
import { feedback } from "../ui/feedback";
import { setActionbarContext } from "../ui/toast";
import { insufficientFundsMessage } from "../ui/funds";
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
import { businessDisplayName } from "./businessMath";
import {
  counterOpenAuction,
  evaluationBreakdown,
  minimumRaiseAmount,
  placePlayerRaise,
  startOpenAuction,
  type EvaluationBreakdown,
  type OpenAuctionState,
} from "./ownershipMath";
import { loadBlob, saveBlob } from "../core/state";
import { noteDialogueEvent } from "./dialogue";
import {
  claimBusinessLock,
  claimOwnershipFirst,
  releaseBusinessLock,
  type OwnershipFirsts,
} from "./ownershipPolicy";
import { reloadBusinessStructure } from "./structurePlacement";

interface OwnershipState extends OwnershipFirsts {
  schema: 2;
  firstOwnershipClaimed: boolean;
  firstTierThreeClaimed: boolean;
}

const KEY = "ew:ownership";
export interface SuccessorSpawnPayload {
  predecessorId: string;
  successorId: string;
  trade: string;
  offset: { x: number; y: number; z: number };
}
let successorSpawnHook: ((payload: SuccessorSpawnPayload) => void) | undefined;
const activeBuyouts = new Map<string, string>();

export function setSuccessorSpawnHook(
  hook: ((payload: SuccessorSpawnPayload) => void) | undefined
): void {
  successorSpawnHook = hook;
}

function loadOwnershipState(): OwnershipState {
  const saved = loadBlob<Partial<OwnershipState>>(KEY);
  return {
    schema: 2,
    firstOwnershipClaimed: saved?.firstOwnershipClaimed ?? false,
    firstTierThreeClaimed: saved?.firstTierThreeClaimed ?? false,
  };
}

function saveOwnershipState(state: OwnershipState): void {
  saveBlob(KEY, state);
}

export function businessEvaluationDetails(
  businesses: BusinessesState,
  business: Business
): EvaluationBreakdown & { recentRevenue: number } {
  const unit = goodConfig(tradeDef(business.trade).good).base;
  const revenue = recentRevenueTotal(businesses, business.id, currentTick());
  const upgradeSpend = business.construction?.cost ?? 0;
  const breakdown = evaluationBreakdown(matrix.ownership.evaluation, {
    trade: business.trade,
    tier: business.tier,
    storageUnits: business.storage,
    marketUnitPrice: unit,
    recentRevenue: revenue,
    upgradeSpend,
  });
  return { ...breakdown, recentRevenue: revenue };
}

export function businessEvaluation(
  businesses: BusinessesState,
  business: Business
): number {
  return businessEvaluationDetails(businesses, business).total;
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
    ownerName: player.nameTag,
    ownerAccount: playerAccount(player),
    successorOf: sourceBusiness.successorOf,
  };
  const successor: Business = {
    ...sourceBusiness,
    id: successorId,
    owner: "cpu",
    ownerName: null,
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

function bidderName(bidder: "player" | "bank" | "cpu"): string {
  if (bidder === "player") return "You";
  if (bidder === "bank") return "Meridian Bank";
  return "CPU bidder";
}

function evaluationFacts(
  business: Business,
  details: ReturnType<typeof businessEvaluationDetails>
): string[] {
  return [
    `Tier: T${business.tier}`,
    `Storage: ${formatAmount(business.storage)} units`,
    `Inventory value: ${merids(details.inventoryValue)}`,
    `Recent revenue: ${merids(details.recentRevenue)}`,
    `Valuation: ${merids(details.total)}`,
  ];
}

function auctionFacts(state: OpenAuctionState): string[] {
  return [
    `Round: ${state.round}/${state.maxRounds}`,
    `Standing bid: ${merids(state.standing.amount)}`,
    `Standing bidder: ${bidderName(state.standing.bidder)}`,
    ...state.bids.slice(-4).map(
      (bid) => `${bidderName(bid.bidder)} bid ${merids(bid.amount)}`
    ),
  ];
}

function worldFirstBanner(message: string): void {
  world.sendMessage(`§6§lWORLD FIRST§r §e${message}`);
}

function formatDurationTicks(ticks: number): string {
  const seconds = Math.max(0, Math.ceil(ticks / matrix.work.processingTicksPerSecond));
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

async function settleAuctionWin(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  business: Business,
  state: OpenAuctionState
): Promise<void> {
  const liveBusiness = businesses.byId[business.id];
  if (!liveBusiness || liveBusiness.owner !== "cpu") {
    feedback(player, "This business was already purchased.", "caution");
    return;
  }
  const available = balance(ledger, playerAccount(player));
  if (available < state.standing.amount) {
    feedback(
      player,
      insufficientFundsMessage(
        "Your bank account",
        state.standing.amount,
        available
      ),
      "error"
    );
    return;
  }
  try {
    sink(
      ledger,
      playerAccount(player),
      state.standing.amount,
      currentTick(),
      "sink:buyout"
    );
  } catch (error) {
    if (error instanceof LedgerError) {
      feedback(
        player,
        insufficientFundsMessage(
          "Your bank account",
          state.standing.amount,
          balance(ledger, playerAccount(player))
        ),
        "error"
      );
      return;
    }
    throw error;
  }
  const businessName = tradeDef(business.trade).name;
  completeBuyout(player, businesses, liveBusiness);
  noteDialogueEvent({
    kind: "ownership",
    summary: `${player.nameTag} bought ${businessName}`,
    tick: currentTick(),
    trade: business.trade,
  });
  const ownership = loadOwnershipState();
  if (claimOwnershipFirst(ownership, "firstOwnershipClaimed")) {
    saveOwnershipState(ownership);
    worldFirstBanner(`${player.nameTag} owns ${businessName}.`);
  }
  feedback(
    player,
    `Auction won at ${merids(state.standing.amount)}. Ownership transferred.`,
    "gain"
  );
  saveBusinesses(businesses);
}

async function continueOpenAuction(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  business: Business,
  state: OpenAuctionState
): Promise<void> {
  if (state.complete) {
    if (state.standing.bidder === "player") {
      await settleAuctionWin(player, ledger, businesses, business, state);
    } else {
      feedback(
        player,
        `Auction closed — ${bidderName(state.standing.bidder)} won at ${merids(state.standing.amount)}.`,
        "caution"
      );
    }
    return;
  }
  await menuHub(player, {
    title: `Open auction — ${tradeDef(business.trade).name}`,
    facts: auctionFacts(state),
    narrator: "Every standing bid is public.",
    buttons: [
      {
        label: "Raise bid",
        onSelect: async () => {
          const minimum = minimumRaiseAmount(
            state,
            matrix.ownership.auction
          );
          const available = balance(ledger, playerAccount(player));
          if (available < minimum) {
            feedback(
              player,
              insufficientFundsMessage(
                "Your bank account",
                minimum,
                available
              ),
              "error"
            );
            return;
          }
          const panel = await managePanel(player, {
            title: `Round ${state.round + 1} raise`,
            fields: [
              {
                type: "slider",
                label: `Bid (${formatAmount(minimum)} minimum)`,
                min: minimum,
                max: available,
                step: 1,
                defaultValue: minimum,
              },
            ],
            saveLabel: "Place visible bid",
          });
          if (!panel) return;
          const amount = Math.floor(Number(panel.values[0]));
          const confirmed = await confirmTxn(player, {
            title: "Confirm visible bid",
            facts: [
              `Current leader: ${bidderName(state.standing.bidder)}`,
              `Standing bid: ${merids(state.standing.amount)}`,
              `Your raise: ${merids(amount)}`,
            ],
            lines: [{ label: "Bid if you win", amount, sense: "loss" }],
            balanceBefore: available,
            balanceAfter: available - amount,
            narrator: "The room will see this number.",
            confirmLabel: "Place bid",
          });
          if (!confirmed) return;
          const raised = placePlayerRaise(
            state,
            matrix.ownership.auction,
            amount
          );
          const countered = counterOpenAuction(
            raised,
            matrix.ownership.auction
          );
          await continueOpenAuction(
            player,
            ledger,
            businesses,
            business,
            countered
          );
        },
      },
      {
        label: "Walk away",
        onSelect: () => {
          feedback(player, "You left the auction. No funds moved.", "info");
        },
      },
    ],
  });
}

async function runBuyoutFlow(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  business: Business
): Promise<void> {
  if (!claimBusinessLock(activeBuyouts, business.id, player.id)) {
    feedback(player, "Another buyer is already running this auction.", "caution");
    return;
  }
  const details = businessEvaluationDetails(businesses, business);
  const state = startOpenAuction(
    matrix.ownership.auction,
    details.total
  );
  try {
    await menuHub(player, {
      title: `Evaluate — ${tradeDef(business.trade).name}`,
      facts: [
        ...evaluationFacts(business, details),
        `Opening bid: ${merids(state.standing.amount)}`,
        `Opening bidder: ${bidderName(state.standing.bidder)}`,
      ],
      narrator: "Inspect the books before you bid.",
      buttons: [
        {
          label: "Enter open auction",
          onSelect: () =>
            continueOpenAuction(player, ledger, businesses, business, state),
        },
        {
          label: "Walk away",
          onSelect: () => {
            feedback(player, "You declined the auction. No funds moved.", "info");
          },
        },
      ],
    });
  } finally {
    releaseBusinessLock(activeBuyouts, business.id, player.id);
  }
}

async function depositBusinessFunds(
  player: Player,
  ledger: LedgerState,
  business: Business
): Promise<void> {
  const personalAccount = playerAccount(player);
  const personalBalance = balance(ledger, personalAccount);
  if (personalBalance <= 0) {
    feedback(
      player,
      insufficientFundsMessage("Your bank account", 1, personalBalance),
      "error"
    );
    return;
  }
  const panel = await managePanel(player, {
    title: "Deposit funds to business",
    fields: [
      {
        type: "slider",
        label: `Amount (max ${formatAmount(personalBalance)})`,
        min: 1,
        max: personalBalance,
        step: 1,
        defaultValue: personalBalance,
      },
    ],
    saveLabel: "Review deposit",
  });
  if (!panel) return;
  const amount = Math.floor(Number(panel.values[0]));
  const before = balance(ledger, personalAccount);
  const confirmed = await confirmTxn(player, {
    title: `Fund ${tradeDef(business.trade).name}`,
    facts: [
      `From: Personal bank`,
      `To: ${tradeDef(business.trade).name}`,
    ],
    lines: [{ label: "Business deposit", amount, sense: "loss" }],
    balanceBefore: before,
    balanceAfter: Math.max(0, before - amount),
    narrator: "Founder capital becomes business capital.",
  });
  if (!confirmed) return;
  const available = balance(ledger, personalAccount);
  if (available < amount) {
    feedback(
      player,
      insufficientFundsMessage("Your bank account", amount, available),
      "error"
    );
    return;
  }
  try {
    transfer(
      ledger,
      personalAccount,
      bizAccount(business.id),
      amount,
      currentTick(),
      "owner:capital"
    );
    feedback(
      player,
      `Deposited ${merids(amount)} to ${tradeDef(business.trade).name}.`,
      "gain"
    );
  } catch (error) {
    if (error instanceof LedgerError) {
      feedback(
        player,
        insufficientFundsMessage(
          "Your bank account",
          amount,
          balance(ledger, personalAccount)
        ),
        "error"
      );
      return;
    }
    throw error;
  }
}

async function openOwnerManagement(
  player: Player,
  ledger: LedgerState,
  businesses: BusinessesState,
  business: Business
): Promise<void> {
  if (!business.ownerName) {
    business.ownerName = player.nameTag;
    saveBusinesses(businesses);
  }
  const evalValue = businessEvaluation(businesses, business);
  const bizBal = balance(ledger, bizAccount(business.id));
  const construction = business.construction
    ? `T${business.construction.targetTier} finishes in ${formatDurationTicks(
        Math.max(0, business.construction.completeTick - currentTick())
      )}`
    : "None";
  await menuHub(player, {
    title: `${tradeDef(business.trade).name} management`,
    facts: [
      businessDisplayName(business),
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
          try {
            transfer(
              ledger,
              bizAccount(business.id),
              playerAccount(player),
              payout,
              currentTick(),
              "owner:collect"
            );
          } catch (error) {
            if (error instanceof LedgerError) {
              feedback(
                player,
                insufficientFundsMessage(
                  tradeDef(business.trade).name,
                  payout,
                  balance(ledger, bizAccount(business.id))
                ),
                "error"
              );
              return;
            }
            throw error;
          }
          business.revenueBalance -= payout;
          saveBusinesses(businesses);
          feedback(player, `Collected ${merids(payout)}.`, "gain");
        },
      },
      {
        label: "Deposit funds to business",
        onSelect: () => depositBusinessFunds(player, ledger, business),
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
          const available = balance(ledger, bizAccount(business.id));
          if (available < cost) {
            feedback(
              player,
              insufficientFundsMessage(
                tradeDef(business.trade).name,
                cost,
                available
              ),
              "error"
            );
            return;
          }
          const ok = await confirmTxn(player, {
            title: `Upgrade to T${targetTier}`,
            facts: [
              `Cost: ${merids(cost)} (business funds)`,
              `Build time: ${formatDurationTicks(duration)}`,
            ],
            lines: [{ label: "Construction sink", amount: cost, sense: "loss" }],
            balanceBefore: available,
            balanceAfter: available - cost,
            narrator: "Construction crews bill before they build.",
          });
          if (!ok) return;
          const settlementAvailable = balance(
            ledger,
            bizAccount(business.id)
          );
          if (settlementAvailable < cost) {
            feedback(
              player,
              insufficientFundsMessage(
                tradeDef(business.trade).name,
                cost,
                settlementAvailable
              ),
              "error"
            );
            return;
          }
          try {
            sink(
              ledger,
              bizAccount(business.id),
              cost,
              currentTick(),
              "sink:construction"
            );
          } catch (error) {
            if (error instanceof LedgerError) {
              feedback(
                player,
                insufficientFundsMessage(
                  tradeDef(business.trade).name,
                  cost,
                  balance(ledger, bizAccount(business.id))
                ),
                "error"
              );
              return;
            }
            throw error;
          }
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
      reloadBusinessStructure(business);
      noteDialogueEvent({
        kind: "construction",
        summary: `${tradeDef(business.trade).name} completed its T${completedTier} upgrade`,
        tick: currentTick(),
        trade: business.trade,
      });
      if (completedTier === 3) {
        const ownership = loadOwnershipState();
        if (claimOwnershipFirst(ownership, "firstTierThreeClaimed")) {
          saveOwnershipState(ownership);
          worldFirstBanner(
            `${business.ownerName ?? "A player"} raised ${tradeDef(business.trade).name} to Tier 3.`
          );
        }
      }
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
