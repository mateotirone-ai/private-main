/**
 * Pure parcel registry mutations — no Minecraft / dynamic-property imports.
 */
import { matrix } from "../content/matrix";
import {
  computeParcelPrice,
  mergeParcelBounds,
  parcelArea,
  parcelDisplayName,
  parcelSizeClass,
  parcelsAdjacent,
  type ParcelBounds,
  type ParcelFrontageKind,
  type ParcelStatus,
  type ParcelSizeClass,
} from "./parcelMath";

export interface ParcelRecord {
  id: string;
  townId: string;
  index: number;
  name: string;
  bounds: ParcelBounds;
  frontageKind: ParcelFrontageKind;
  sizeClass: ParcelSizeClass;
  status: ParcelStatus;
  owner: string | null;
  ownerName: string | null;
  plazaDistance: number;
  waterfront: boolean;
  price: number;
  priceLines: string[];
}

export interface ParcelsState {
  schema: 1;
  byId: Record<string, ParcelRecord>;
  byTown: Record<string, string[]>;
}

export function emptyParcels(): ParcelsState {
  return { schema: 1, byId: {}, byTown: {} };
}

export function clearTownParcels(state: ParcelsState, townId: string): void {
  const ids = state.byTown[townId] ?? [];
  for (const id of ids) delete state.byId[id];
  delete state.byTown[townId];
}

export function registerParcel(
  state: ParcelsState,
  input: {
    townId: string;
    index: number;
    bounds: ParcelBounds;
    frontageKind: ParcelFrontageKind;
    plazaDistance: number;
    waterfront: boolean;
    status?: ParcelStatus;
  }
): ParcelRecord {
  const cfg = matrix.town.parcel;
  const area = parcelArea(input.bounds);
  const sizeClass = parcelSizeClass(area, cfg.sizeBands);
  const breakdown = computeParcelPrice({
    bounds: input.bounds,
    frontageKind: input.frontageKind,
    plazaDistance: input.plazaDistance,
    waterfront: input.waterfront,
    basePerBlock2: cfg.basePerBlock2,
    mainFrontageFactor: cfg.mainFrontageFactor,
    laneFrontageFactor: cfg.laneFrontageFactor,
    plazaNear: cfg.plazaNear,
    plazaFar: cfg.plazaFar,
    plazaNearFactor: cfg.plazaNearFactor,
    plazaFarFactor: cfg.plazaFarFactor,
    waterfrontBonus: cfg.waterfrontBonus,
  });
  const id = `${input.townId}:p${input.index}`;
  const record: ParcelRecord = {
    id,
    townId: input.townId,
    index: input.index,
    name: parcelDisplayName(input.index, sizeClass),
    bounds: input.bounds,
    frontageKind: input.frontageKind,
    sizeClass,
    status: input.status ?? "available",
    owner: null,
    ownerName: null,
    plazaDistance: input.plazaDistance,
    waterfront: input.waterfront,
    price: breakdown.price,
    priceLines: breakdown.lines,
  };
  state.byId[id] = record;
  const list = state.byTown[input.townId] ?? [];
  if (!list.includes(id)) list.push(id);
  state.byTown[input.townId] = list;
  return record;
}

export function parcelsForTown(
  state: ParcelsState,
  townId: string
): ParcelRecord[] {
  return (state.byTown[townId] ?? [])
    .map((id) => state.byId[id])
    .filter((p): p is ParcelRecord => Boolean(p))
    .sort((a, b) => a.index - b.index);
}

export function buyParcel(
  state: ParcelsState,
  parcelId: string,
  ownerId: string,
  ownerName: string
): ParcelRecord | undefined {
  const parcel = state.byId[parcelId];
  if (!parcel || parcel.status !== "available") return undefined;
  parcel.status = "owned";
  parcel.owner = ownerId;
  parcel.ownerName = ownerName;
  return parcel;
}

export function mergeOwnedParcels(
  state: ParcelsState,
  aId: string,
  bId: string,
  ownerId: string
): ParcelRecord | undefined {
  const a = state.byId[aId];
  const b = state.byId[bId];
  if (!a || !b) return undefined;
  if (a.owner !== ownerId || b.owner !== ownerId) return undefined;
  if (a.townId !== b.townId) return undefined;
  if (!parcelsAdjacent(a.bounds, b.bounds)) return undefined;
  const mergedBounds = mergeParcelBounds(a.bounds, b.bounds);
  const cfg = matrix.town.parcel;
  const area = parcelArea(mergedBounds);
  const sizeClass = parcelSizeClass(area, cfg.sizeBands);
  const breakdown = computeParcelPrice({
    bounds: mergedBounds,
    frontageKind:
      a.frontageKind === "main" || b.frontageKind === "main" ? "main" : "lane",
    plazaDistance: Math.min(a.plazaDistance, b.plazaDistance),
    waterfront: a.waterfront || b.waterfront,
    basePerBlock2: cfg.basePerBlock2,
    mainFrontageFactor: cfg.mainFrontageFactor,
    laneFrontageFactor: cfg.laneFrontageFactor,
    plazaNear: cfg.plazaNear,
    plazaFar: cfg.plazaFar,
    plazaNearFactor: cfg.plazaNearFactor,
    plazaFarFactor: cfg.plazaFarFactor,
    waterfrontBonus: cfg.waterfrontBonus,
  });
  delete state.byId[bId];
  state.byTown[a.townId] = (state.byTown[a.townId] ?? []).filter(
    (id) => id !== bId
  );
  a.bounds = mergedBounds;
  a.sizeClass = sizeClass;
  a.name = parcelDisplayName(a.index, sizeClass);
  a.price = breakdown.price;
  a.priceLines = breakdown.lines;
  a.waterfront = a.waterfront || b.waterfront;
  a.plazaDistance = Math.min(a.plazaDistance, b.plazaDistance);
  a.frontageKind =
    a.frontageKind === "main" || b.frontageKind === "main" ? "main" : "lane";
  return a;
}

export function surveyFloorPaletteBlock(status: ParcelStatus): string {
  const palette = matrix.town.surveyFloor.palette;
  return palette[status] ?? palette.available ?? "minecraft:lime_concrete";
}
