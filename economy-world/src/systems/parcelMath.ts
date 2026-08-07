/**
 * Pure parcel pricing and classification — every factor visible in the buy form.
 */
export type ParcelSizeClass = "small" | "medium" | "large" | "estate";
export type ParcelFrontageKind = "main" | "lane";
export type ParcelStatus = "available" | "owned" | "pending" | "commons";

export interface ParcelBounds {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}

export interface ParcelPriceFactors {
  basePerBlock2: number;
  area: number;
  frontageKind: ParcelFrontageKind;
  frontageFactor: number;
  plazaDistance: number;
  plazaDistanceFactor: number;
  waterfront: boolean;
  waterfrontBonus: number;
}

export interface ParcelPriceBreakdown {
  factors: ParcelPriceFactors;
  price: number;
  lines: string[];
}

export function parcelArea(bounds: ParcelBounds): number {
  return (bounds.x2 - bounds.x1 + 1) * (bounds.z2 - bounds.z1 + 1);
}

export function parcelSizeClass(
  area: number,
  bands: { small: number; medium: number; large: number }
): ParcelSizeClass {
  if (area <= bands.small) return "small";
  if (area <= bands.medium) return "medium";
  if (area <= bands.large) return "large";
  return "estate";
}

/** Linear: 1.3 within near → 1.0 beyond far. */
export function plazaDistanceFactor(
  distance: number,
  near = 20,
  far = 60,
  nearFactor = 1.3,
  farFactor = 1.0
): number {
  if (distance <= near) return nearFactor;
  if (distance >= far) return farFactor;
  const t = (distance - near) / (far - near);
  return nearFactor + (farFactor - nearFactor) * t;
}

export function computeParcelPrice(input: {
  bounds: ParcelBounds;
  frontageKind: ParcelFrontageKind;
  plazaDistance: number;
  waterfront: boolean;
  basePerBlock2: number;
  mainFrontageFactor: number;
  laneFrontageFactor: number;
  plazaNear: number;
  plazaFar: number;
  plazaNearFactor: number;
  plazaFarFactor: number;
  waterfrontBonus: number;
}): ParcelPriceBreakdown {
  const area = parcelArea(input.bounds);
  const frontageFactor =
    input.frontageKind === "main"
      ? input.mainFrontageFactor
      : input.laneFrontageFactor;
  const plazaFactor = plazaDistanceFactor(
    input.plazaDistance,
    input.plazaNear,
    input.plazaFar,
    input.plazaNearFactor,
    input.plazaFarFactor
  );
  const waterBonus = input.waterfront ? input.waterfrontBonus : 1;
  const price = Math.round(
    input.basePerBlock2 * area * frontageFactor * plazaFactor * waterBonus
  );
  const factors: ParcelPriceFactors = {
    basePerBlock2: input.basePerBlock2,
    area,
    frontageKind: input.frontageKind,
    frontageFactor,
    plazaDistance: input.plazaDistance,
    plazaDistanceFactor: plazaFactor,
    waterfront: input.waterfront,
    waterfrontBonus: waterBonus,
  };
  return {
    factors,
    price,
    lines: [
      `Base ${input.basePerBlock2} × ${area} blocks`,
      `Frontage (${input.frontageKind}) ×${frontageFactor}`,
      `Plaza distance ${Math.round(input.plazaDistance)} ×${plazaFactor.toFixed(2)}`,
      `Waterfront ×${waterBonus}`,
      `Total ${price} merids`,
    ],
  };
}

export function parcelsAdjacent(a: ParcelBounds, b: ParcelBounds): boolean {
  const overlapX = a.x1 <= b.x2 + 1 && a.x2 >= b.x1 - 1;
  const overlapZ = a.z1 <= b.z2 + 1 && a.z2 >= b.z1 - 1;
  if (!overlapX || !overlapZ) return false;
  const shareEdgeX =
    a.x2 + 1 === b.x1 || b.x2 + 1 === a.x1
      ? a.z1 <= b.z2 && a.z2 >= b.z1
      : false;
  const shareEdgeZ =
    a.z2 + 1 === b.z1 || b.z2 + 1 === a.z1
      ? a.x1 <= b.x2 && a.x2 >= b.x1
      : false;
  return shareEdgeX || shareEdgeZ;
}

export function mergeParcelBounds(a: ParcelBounds, b: ParcelBounds): ParcelBounds {
  return {
    x1: Math.min(a.x1, b.x1),
    z1: Math.min(a.z1, b.z1),
    x2: Math.max(a.x2, b.x2),
    z2: Math.max(a.z2, b.z2),
  };
}

export function pointInParcelBounds(
  x: number,
  z: number,
  bounds: ParcelBounds
): boolean {
  return x >= bounds.x1 && x <= bounds.x2 && z >= bounds.z1 && z <= bounds.z2;
}

export function parcelDisplayName(index: number, sizeClass: ParcelSizeClass): string {
  return `Lot ${index + 1} (${sizeClass})`;
}
