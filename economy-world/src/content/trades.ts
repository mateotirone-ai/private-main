import raw from "../../data/trades.json";

export interface TradeT2 {
  price: number;
  buildMins: number;
  requiresProduced: number;
}

export interface TradeDef {
  name: string;
  good: string;
  item: string;
  kind: "extraction" | "processing" | "service";
  storageCap: number;
  producePerTick: number;
  buyout: number;
  t2: TradeT2;
}

export interface CommonsZone {
  id: string;
  name: string;
  good: string;
  trade: string;
}

export interface TradesFile {
  cpuProduceEveryMinutes: number;
  trades: Record<string, TradeDef>;
  commons: { zones: CommonsZone[] };
}

export const tradesFile = raw as unknown as TradesFile;

export function allTradeIds(): string[] {
  return Object.keys(tradesFile.trades);
}

export function tradeDef(id: string): TradeDef {
  const t = tradesFile.trades[id];
  if (!t) throw new Error(`unknown trade: ${id}`);
  return t;
}

export function commonsZones(): CommonsZone[] {
  return tradesFile.commons.zones;
}

export function cpuProduceEveryMinutes(): number {
  return tradesFile.cpuProduceEveryMinutes;
}

export function tradeForGood(good: string): string | undefined {
  for (const [id, t] of Object.entries(tradesFile.trades)) {
    if (t.good === good && t.kind !== "service") return id;
  }
  // fallback: any matching good
  for (const [id, t] of Object.entries(tradesFile.trades)) {
    if (t.good === good) return id;
  }
  return undefined;
}
