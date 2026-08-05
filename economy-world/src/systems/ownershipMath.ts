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

export function evaluateBusiness(
  cfg: EvaluationConfig,
  input: EvaluationInput
): number {
  const tierBase = cfg.tierBaseByTier[String(input.tier)] ?? 0;
  const inventoryValue =
    input.storageUnits * input.marketUnitPrice * cfg.inventoryUnitValueFactor;
  const revenueValue = input.recentRevenue * cfg.recentRevenueFactor;
  const upgradeValue = input.upgradeSpend * cfg.upgradeValueFactor;
  const locationFactor = cfg.locationFactorByTrade[input.trade] ?? 1;
  return Math.max(
    1,
    Math.round((tierBase + inventoryValue + revenueValue + upgradeValue) * locationFactor)
  );
}

export interface AuctionConfig {
  bankBidMinPct: number;
  bankBidMaxPct: number;
  cpuBidMinPct: number;
  cpuBidMaxPct: number;
  luckBoostChance: number;
  luckBoostMinPct: number;
  luckBoostMaxPct: number;
}

export interface AuctionBid {
  bidder: "player" | "bank" | "cpu";
  amount: number;
}

export interface AuctionResolution {
  bids: AuctionBid[];
  winner: AuctionBid;
}

function randomBetween(min: number, max: number, rng: () => number): number {
  return min + (max - min) * rng();
}

function maybeLuckBoost(
  amount: number,
  cfg: AuctionConfig,
  rng: () => number
): number {
  if (rng() >= cfg.luckBoostChance) return amount;
  const boost = randomBetween(cfg.luckBoostMinPct, cfg.luckBoostMaxPct, rng);
  return Math.round(amount * (1 + boost));
}

function orderRank(bidder: AuctionBid["bidder"]): number {
  if (bidder === "player") return 3;
  if (bidder === "bank") return 2;
  return 1;
}

export function resolveSealedAuction(
  cfg: AuctionConfig,
  evaluation: number,
  playerMaxBid: number,
  rng: () => number = Math.random
): AuctionResolution {
  if (playerMaxBid < 1) throw new Error("player bid must be positive");
  const bank = maybeLuckBoost(
    Math.round(evaluation * randomBetween(cfg.bankBidMinPct, cfg.bankBidMaxPct, rng)),
    cfg,
    rng
  );
  const cpu = maybeLuckBoost(
    Math.round(evaluation * randomBetween(cfg.cpuBidMinPct, cfg.cpuBidMaxPct, rng)),
    cfg,
    rng
  );
  const bids: AuctionBid[] = [
    { bidder: "player", amount: playerMaxBid },
    { bidder: "bank", amount: bank },
    { bidder: "cpu", amount: cpu },
  ];
  const winner = [...bids].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return orderRank(b.bidder) - orderRank(a.bidder);
  })[0]!;
  return { bids, winner };
}
