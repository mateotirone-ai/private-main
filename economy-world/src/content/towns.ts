import raw from "../../data/towns.json";
import { allTradeIds, tradeDef } from "./trades";

export interface TownOffset {
  x: number;
  y: number;
  z: number;
}

export type TownAnchor =
  | { mode: "player" }
  | { mode: "fixed"; x: number; y: number; z: number };

export interface TownPlacement {
  surfaceScanUp: number;
  surfaceScanDown: number;
}

export interface TownDefaults {
  npcTypeId: string;
  personalityTag: string;
  markerTag: string;
}

export interface TownCivicHost {
  id: string;
  nameTag: string;
  roleTag: "ew:npc_bank" | "ew:npc_dealer" | "ew:npc_commons" | "ew:npc_jobs";
  offset: TownOffset;
  personalityTag?: string;
}

export interface TownStorefrontHost {
  trade: string;
  offset: TownOffset;
}

export interface TownStationHost {
  trade: string;
  offset: TownOffset;
}

export interface TownServiceHost {
  trade: string;
  offset: TownOffset;
}

export interface TownWorkZone {
  trade: string;
  public: boolean;
  offset: TownOffset;
}

export interface TownManifest {
  id: string;
  name: string;
  dimensionId: string;
  anchor: TownAnchor;
  placement: TownPlacement;
  defaults: TownDefaults;
  civics: TownCivicHost[];
  storefronts: TownStorefrontHost[];
  stations: TownStationHost[];
  serviceHosts: TownServiceHost[];
  workZones: TownWorkZone[];
}

export interface TownsFile {
  towns: TownManifest[];
}

const townsFile = raw as unknown as TownsFile;
const VALID_TRADES = new Set(allTradeIds());

function assertTrade(trade: string): void {
  if (!VALID_TRADES.has(trade)) throw new Error(`unknown town trade: ${trade}`);
}

function assertOffset(offset: TownOffset): void {
  if (![offset.x, offset.y, offset.z].every(Number.isFinite)) {
    throw new Error("town offset must be finite");
  }
}

function validateTown(town: TownManifest): void {
  if (!town.id.trim()) throw new Error("town id cannot be empty");
  if (!town.name.trim()) throw new Error(`town ${town.id} must have a name`);
  if (!town.dimensionId.trim()) {
    throw new Error(`town ${town.id} must have a dimensionId`);
  }
  if (town.placement.surfaceScanUp < 0 || town.placement.surfaceScanDown < 0) {
    throw new Error(`town ${town.id} has invalid surface scan bounds`);
  }
  if (!town.defaults.markerTag.trim()) {
    throw new Error(`town ${town.id} must define defaults.markerTag`);
  }
  for (const civic of town.civics) assertOffset(civic.offset);
  for (const host of town.storefronts) {
    assertTrade(host.trade);
    assertOffset(host.offset);
  }
  for (const host of town.stations) {
    assertTrade(host.trade);
    if (tradeDef(host.trade).kind !== "processing") {
      throw new Error(`station host ${host.trade} must be a processing trade`);
    }
    assertOffset(host.offset);
  }
  for (const host of town.serviceHosts) {
    assertTrade(host.trade);
    assertOffset(host.offset);
  }
  for (const zone of town.workZones) {
    assertTrade(zone.trade);
    if (tradeDef(zone.trade).kind !== "extraction") {
      throw new Error(`work zone ${zone.trade} must be an extraction trade`);
    }
    assertOffset(zone.offset);
  }
}

for (const town of townsFile.towns) validateTown(town);

export function allTowns(): TownManifest[] {
  return townsFile.towns;
}

export function townManifest(id: string): TownManifest | undefined {
  return townsFile.towns.find((town) => town.id === id);
}

export function defaultTownId(): string {
  return townsFile.towns[0]?.id ?? "starter";
}
