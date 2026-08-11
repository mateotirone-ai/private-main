/**
 * Typed accessors for data/matrix.json. Numbers live in data/, never in call sites.
 */
import raw from "../../data/matrix.json";

export type PreciousGood = "gold" | "diamond";

export interface Matrix {
  stipend: number;
  medical: { flat: number; pctOfWealth: number };
  food: { recentConsumptionCap: number };
  dialogue: { recentEventCap: number };
  freelanceRate: number;
  bank: { transferFee: number };
  cash: { denominations: number[]; walletDefaultExtract: number };
  ui: {
    toast: {
      maxChars: number;
      fadeInTicks: number;
      stayTicks: number;
      fadeOutTicks: number;
    };
    hud: {
      refreshTicks: number;
      serviceAlertTicks: number;
      walletChip: {
        offsetX: number;
        offsetY: number;
        width: number;
        height: number;
      };
      priorities: Record<string, number>;
    };
  };
  town: {
    streetMaterialSetByEra: Record<string, Record<string, unknown>>;
    maxStreetGrade: number;
    lanternInterval: number;
    stubWidth: number;
    catalogRoadConnectMaxDistance: number;
    clearingMargin: number;
    streetTreeInterval: number;
    meadowFlowerDensity: number;
    floraByBiome: Record<
      string,
      { tree: string; hedge: string; flowers: string[] }
    >;
    parcel: {
      basePerBlock2: number;
      mainFrontageFactor: number;
      laneFrontageFactor: number;
      plazaNear: number;
      plazaFar: number;
      plazaNearFactor: number;
      plazaFarFactor: number;
      waterfrontBonus: number;
      sizeBands: { small: number; medium: number; large: number };
    };
    surveyFloor: {
      palette: Record<string, string>;
      standaloneSize: [number, number];
    };
    surveyMarkers: {
      parcel: string;
      slot: string;
      growth: string;
    };
    retainingWallBlock: string;
    expansion: {
      outsideWallsDiscount: number;
      startingTreasury: number;
      ticksPerModuleBlock: number;
      minDurationTicks: number;
      maxDurationTicks: number;
      sweepTicks: number;
      vacantHouseRecommendThreshold: number;
    };
  };
  work: {
    nodeStampOffsets: Array<{ x: number; y: number; z: number }>;
    nodeStages: { depletedTicks: number; recoveringTicks: number };
    pitRegenDelayTicks: number;
    pitRegenSweepTicks: number;
    processingSweepTicks: number;
    processingTicksPerSecond: number;
    processing: Record<
      string,
      { inputTrade: string; inputQty: number; outputQty: number; durationTicks: number }
    >;
    service: {
      spawnEveryTicks: number;
      requestQtyMin: number;
      requestQtyMax: number;
      largeOrderChance: number;
      largeOrderQtyMin: number;
      largeOrderQtyMax: number;
      activeMarginBonus: number;
    };
    employment: {
      cpuMultiplier: number;
      offlineOwnerMultiplier: number;
      activeOwnerMultiplier: number;
      offlineEmployeeStep: number;
      offlineEmployeeCap: number;
      toolQualityByTier: Record<string, number>;
      pieceRateByTradeTier: Record<string, Record<string, number>>;
    };
  };
  ownership: {
    revenueWindowTicks: number;
    revenueHistoryCap: number;
    tierOutputMultiplierByTier: Record<string, number>;
    tierStorageMultiplierByTier: Record<string, number>;
    tierEmployeeSlotMultiplierByTier: Record<string, number>;
    construction: {
      sweepTicks: number;
      scaffoldingHeight: number;
      scaffoldingMargin: number;
      scaffoldingBlock: string;
      materialPiles: Array<{
        offset: [number, number, number];
        size: [number, number, number];
        block: string;
      }>;
    };
    evaluation: {
      tierBaseByTier: Record<string, number>;
      inventoryUnitValueFactor: number;
      recentRevenueFactor: number;
      upgradeValueFactor: number;
      locationFactorByTrade: Record<string, number>;
    };
    auction: {
      bankBidMinPct: number;
      bankBidMaxPct: number;
      cpuBidMinPct: number;
      cpuBidMaxPct: number;
      luckBoostChance: number;
      luckBoostMinPct: number;
      luckBoostMaxPct: number;
      maxRounds: number;
      minRaisePct: number;
    };
    management: {
      priceOverrideMinPct: number;
      priceOverrideMaxPct: number;
      maxEmployeeSlots: number;
      employeeSlotHireCost: number;
      upgradeCostByTradeTier: Record<string, Record<string, number>>;
      upgradeDurationTicksByTier: Record<string, number>;
      successorSpawnOffset: { x: number; y: number; z: number };
    };
  };
  dealer: {
    dailyCapacity: Record<PreciousGood, number>;
    softFloor: number;
  };
}

export const matrix = raw as unknown as Matrix;

export function transferFee(): number {
  return matrix.bank.transferFee;
}

export function cashDenominations(): number[] {
  return matrix.cash.denominations;
}

export function dealerCapacity(good: PreciousGood): number {
  return matrix.dealer.dailyCapacity[good];
}

export function dealerSoftFloor(): number {
  return matrix.dealer.softFloor;
}

export function stipendAmount(): number {
  return matrix.stipend;
}
