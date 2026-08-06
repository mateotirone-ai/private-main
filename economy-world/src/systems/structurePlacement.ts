import { type Player, world } from "@minecraft/server";
import { tradeDef } from "../content/trades";
import { structureTierDef, structureTradeDef, type StructureMirror } from "../content/structures";
import {
  resolvePlacementTransform,
  transformOffset,
} from "./structurePlacementMath";
import { saveBusinesses, type BusinessesState } from "./businesses";
import { feedback } from "../ui/feedback";
import { registerWorkZone, type ExtractionState } from "./extraction";

const ROTATION_TOKENS: Record<0 | 1 | 2 | 3, string> = {
  0: "0_degrees",
  1: "90_degrees",
  2: "180_degrees",
  3: "270_degrees",
};

export interface PlacementSite {
  dimensionId: string;
  anchor: { x: number; y: number; z: number };
  rotationSteps: 0 | 1 | 2 | 3;
  mirror: StructureMirror;
}

export interface PlaceBusinessResult {
  businessId: string;
  trade: string;
  structureId: string;
  anchor: { x: number; y: number; z: number };
  rotationSteps: 0 | 1 | 2 | 3;
}

function floorLocation(location: { x: number; y: number; z: number }): {
  x: number;
  y: number;
  z: number;
} {
  return {
    x: Math.floor(location.x),
    y: Math.floor(location.y),
    z: Math.floor(location.z),
  };
}

function structureCommand(
  structureId: string,
  anchor: { x: number; y: number; z: number },
  rotationSteps: 0 | 1 | 2 | 3,
  mirror: StructureMirror
): string {
  const rotation = ROTATION_TOKENS[rotationSteps];
  return `structure load ${structureId} ${anchor.x} ${anchor.y} ${anchor.z} ${rotation} ${mirror}`;
}

export function placeBusinessStructure(
  player: Player,
  businesses: BusinessesState,
  extraction: ExtractionState,
  trade: string,
  tier: 1 | 2 | 3 = 1,
  mirror: StructureMirror = "none"
): PlaceBusinessResult {
  const businessId = `cpu_${trade}`;
  const business = businesses.byId[businessId];
  if (!business) throw new Error(`missing business ${businessId}`);
  const tradeStructure = structureTradeDef(trade);
  if (!tradeStructure) throw new Error(`missing structure registry for ${trade}`);
  const tierDef = structureTierDef(trade, tier);
  if (!tierDef) throw new Error(`missing structure tier ${tier} for ${trade}`);

  const transform = resolvePlacementTransform(tradeStructure.frontFace, player.getRotation().y, mirror);
  const anchor = floorLocation(player.location);
  const dimension = player.dimension;
  dimension.runCommand(
    structureCommand(tierDef.id, anchor, transform.rotationSteps, transform.mirror)
  );

  const zoneOffset = transformOffset(tierDef.workZoneOffset, transform);
  registerWorkZone(
    extraction,
    business.id,
    trade,
    dimension,
    {
      x: anchor.x + zoneOffset.x,
      y: anchor.y + zoneOffset.y,
      z: anchor.z + zoneOffset.z,
    },
    false
  );

  const speaker = tradeDef(trade).name;
  const storefrontOffset = transformOffset(tierDef.npcOffsets.storefront, transform);
  const officeOffset = transformOffset(tierDef.npcOffsets.office, transform);
  const storefront = dimension.spawnEntity("minecraft:npc", {
    x: anchor.x + storefrontOffset.x,
    y: anchor.y + storefrontOffset.y,
    z: anchor.z + storefrontOffset.z,
  });
  storefront.nameTag = speaker;
  storefront.addTag(`ew:shop_${trade}`);
  storefront.addTag(`ew:biz_${business.id}`);
  storefront.addTag("ew:personality_practical");
  const office = dimension.spawnEntity("minecraft:npc", {
    x: anchor.x + officeOffset.x,
    y: anchor.y + officeOffset.y,
    z: anchor.z + officeOffset.z,
  });
  office.nameTag = `${speaker} Office`;
  office.addTag(`ew:office_${trade}`);
  office.addTag(`ew:biz_${business.id}`);
  office.addTag("ew:personality_practical");

  business.site = {
    dimensionId: dimension.id,
    anchor,
    rotationSteps: transform.rotationSteps,
    mirror: transform.mirror,
  };
  saveBusinesses(businesses);
  feedback(player, `Placed ${speaker} T${tier}.`, "gain");
  return {
    businessId: business.id,
    trade,
    structureId: tierDef.id,
    anchor,
    rotationSteps: transform.rotationSteps,
  };
}

export function structureIdForBusinessTier(
  trade: string,
  tier: 1 | 2 | 3
): string | undefined {
  return structureTierDef(trade, tier)?.id;
}

export function reloadBusinessStructure(
  business: BusinessesState["byId"][string]
): void {
  if (!business?.site) return;
  const structureId = structureIdForBusinessTier(business.trade, business.tier);
  if (!structureId) return;
  const dim = world.getDimension(business.site.dimensionId);
  dim.runCommand(
    structureCommand(
      structureId,
      business.site.anchor,
      business.site.rotationSteps,
      business.site.mirror
    )
  );
}
