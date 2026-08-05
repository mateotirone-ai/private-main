export interface EvaluationConfig {
  tierBaseByTier: Record<string, number>;
  inventoryUnitValueFactor: number;
  recentRevenueFactor: number;
  upgradeValueFactor: number;
  locationFactorByTrade: Record<string, number>;
}

export interface EvaluationInput {
  trade: string;
  tier: 1 | 2 | 3;
  storageUnits: number;
  marketUnitPrice: number;
  recentRevenue: number;
  upgradeSpend: number;
}

export interface EvaluationBreakdown {
  tierBase: number;
  inventoryValue: number;
  revenueValue: number;
  upgradeValue: number;
  locationFactor: number;
  total: number;
}

export function evaluationBreakdown(
  cfg: EvaluationConfig,
  input: EvaluationInput
): EvaluationBreakdown {
  const tierBase = cfg.tierBaseByTier[String(input.tier)] ?? 0;
  const inventoryValue =
    input.storageUnits * input.marketUnitPrice * cfg.inventoryUnitValueFactor;
  const revenueValue = input.recentRevenue * cfg.recentRevenueFactor;
  const upgradeValue = input.upgradeSpend * cfg.upgradeValueFactor;
  const locationFactor = cfg.locationFactorByTrade[input.trade] ?? 1;
  const total = Math.max(
    1,
    Math.round((tierBase + inventoryValue + revenueValue + upgradeValue) * locationFactor)
  );
  return {
    tierBase: Math.round(tierBase),
    inventoryValue: Math.round(inventoryValue),
    revenueValue: Math.round(revenueValue),
    upgradeValue: Math.round(upgradeValue),
    locationFactor,
    total,
  };
}

export function evaluateBusiness(
  cfg: EvaluationConfig,
  input: EvaluationInput
): number {
  return evaluationBreakdown(cfg, input).total;
}

export interface AuctionConfig {
  bankBidMinPct: number;
  bankBidMaxPct: number;
  cpuBidMinPct: number;
  cpuBidMaxPct: number;
  luckBoostChance: number;
  luckBoostMinPct: number;
  luckBoostMaxPct: number;
  maxRounds: number;
  minRaisePct: number;
}

export interface AuctionBid {
  bidder: "player" | "bank" | "cpu";
  amount: number;
}

export interface OpenAuctionState {
  evaluation: number;
  maxRounds: number;
  round: number;
  standing: AuctionBid;
  bids: AuctionBid[];
  cpuMax: number;
  bankLateMax: number;
  complete: boolean;
}

function randomBetween(min: number, max: number, rng: () => number): number {
  return min + (max - min) * rng();
}

function evaluationBid(
  evaluation: number,
  minPct: number,
  maxPct: number,
  rng: () => number
): number {
  return Math.max(
    1,
    Math.round(evaluation * randomBetween(minPct, maxPct, rng))
  );
}

export function minimumRaiseAmount(
  state: Pick<OpenAuctionState, "evaluation" | "standing">,
  cfg: Pick<AuctionConfig, "minRaisePct">
): number {
  const increment = Math.max(1, Math.round(state.evaluation * cfg.minRaisePct));
  return state.standing.amount + increment;
}

export function startOpenAuction(
  cfg: AuctionConfig,
  evaluation: number,
  rng: () => number = Math.random
): OpenAuctionState {
  if (!Number.isInteger(cfg.maxRounds) || cfg.maxRounds < 1) {
    throw new Error("open auction needs at least one round");
  }
  const opening = evaluationBid(
    evaluation,
    cfg.bankBidMinPct,
    cfg.bankBidMaxPct,
    rng
  );
  const cpuMax = evaluationBid(
    evaluation,
    cfg.cpuBidMinPct,
    cfg.cpuBidMaxPct,
    rng
  );
  const luckBoost =
    rng() < cfg.luckBoostChance
      ? randomBetween(cfg.luckBoostMinPct, cfg.luckBoostMaxPct, rng)
      : 0;
  const bankLateMax =
    luckBoost > 0
      ? Math.max(
          opening,
          Math.round(evaluation * cfg.bankBidMaxPct * (1 + luckBoost))
        )
      : opening;
  const standing: AuctionBid = { bidder: "bank", amount: opening };
  return {
    evaluation,
    maxRounds: cfg.maxRounds,
    round: 0,
    standing,
    bids: [standing],
    cpuMax,
    bankLateMax,
    complete: false,
  };
}

export function placePlayerRaise(
  state: OpenAuctionState,
  cfg: AuctionConfig,
  amount: number
): OpenAuctionState {
  if (state.complete) throw new Error("auction is complete");
  if (state.round >= state.maxRounds) throw new Error("auction round cap reached");
  const minimum = minimumRaiseAmount(state, cfg);
  if (!Number.isInteger(amount) || amount < minimum) {
    throw new Error(`player bid must be at least ${minimum}`);
  }
  const bid: AuctionBid = { bidder: "player", amount };
  return {
    ...state,
    round: state.round + 1,
    standing: bid,
    bids: [...state.bids, bid],
  };
}

export function counterOpenAuction(
  state: OpenAuctionState,
  cfg: AuctionConfig
): OpenAuctionState {
  if (state.complete || state.standing.bidder !== "player") return state;
  const minimum = minimumRaiseAmount(state, cfg);
  const lateRound = state.round >= Math.ceil(state.maxRounds / 2);
  const candidates: Array<{ bidder: "bank" | "cpu"; cap: number }> = [
    { bidder: "cpu", cap: state.cpuMax },
  ];
  if (lateRound && state.bankLateMax > state.bids[0]!.amount) {
    candidates.push({ bidder: "bank", cap: state.bankLateMax });
  }
  const counter = candidates
    .filter((candidate) => candidate.cap >= minimum)
    .sort((a, b) => b.cap - a.cap)[0];
  if (!counter) return { ...state, complete: true };
  const bid: AuctionBid = { bidder: counter.bidder, amount: minimum };
  return {
    ...state,
    standing: bid,
    bids: [...state.bids, bid],
    complete: state.round >= state.maxRounds,
  };
}
