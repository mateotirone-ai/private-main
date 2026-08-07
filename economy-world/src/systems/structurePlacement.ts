import {
  BlockPermutation,
  StructureMirrorAxis,
  StructureRotation,
  type Dimension,
  type Entity,
  type Player,
  type Structure,
  world,
} from "@minecraft/server";
import { matrix } from "../content/matrix";
import { tradeDef } from "../content/trades";
import {
  structureForTradeLevel,
  structureById,
  type StructureMirror,
  successorOffsetForTrade,
  type StructureEntry,
} from "../content/structures";
import {
  resolvePlacementTransform,
  transformOffset,
} from "./structurePlacementMath";
import { saveBusinesses, type BusinessesState } from "./businesses";
import { feedback } from "../ui/feedback";
import { registerWorkZone, type ExtractionState } from "./extraction";
import type { Business } from "./businesses";

const PERSONALITY_TAGS = [
  "ew:personality_practical",
  "ew:personality_wry",
  "ew:personality_neighborly",
] as const;
let temporaryStructureSequence = 0;

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

function structureRotation(
  rotationSteps: 0 | 1 | 2 | 3
): StructureRotation {
  if (rotationSteps === 1) return StructureRotation.Rotate90;
  if (rotationSteps === 2) return StructureRotation.Rotate180;
  if (rotationSteps === 3) return StructureRotation.Rotate270;
  return StructureRotation.None;
}

function structureMirror(mirror: StructureMirror): StructureMirrorAxis {
  if (mirror === "x") return StructureMirrorAxis.X;
  if (mirror === "z") return StructureMirrorAxis.Z;
  if (mirror === "xz") return StructureMirrorAxis.XZ;
  return StructureMirrorAxis.None;
}

function placeStructure(
  dimension: Dimension,
  structure: string | Structure,
  anchor: { x: number; y: number; z: number },
  rotationSteps: 0 | 1 | 2 | 3,
  mirror: StructureMirror
): void {
  world.structureManager.place(structure, dimension, anchor, {
    includeBlocks: true,
    includeEntities: false,
    rotation: structureRotation(rotationSteps),
    mirror: structureMirror(mirror),
  });
}

function add(
  anchor: { x: number; y: number; z: number },
  offset: { x: number; y: number; z: number }
) {
  return {
    x: anchor.x + offset.x,
    y: anchor.y + offset.y,
    z: anchor.z + offset.z,
  };
}

function effectiveStructureOrigin(
  anchor: { x: number; y: number; z: number },
  entry: StructureEntry,
  rotationSteps: 0 | 1 | 2 | 3,
  mirror: StructureMirror
): { x: number; y: number; z: number } {
  const correction = transformOffset(
    entry.anchorOffset ?? { x: 0, y: 0, z: 0 },
    { rotationSteps, mirror }
  );
  return add(anchor, correction);
}

function randomPersonalityTag(): string {
  return PERSONALITY_TAGS[
    Math.floor(Math.random() * PERSONALITY_TAGS.length)
  ]!;
}

function roleTags(role: string, trade: string): string[] {
  if (role === "storefront" || role === "storefront_clerk") {
    return [`ew:shop_${trade}`];
  }
  if (role === "office" || role === "office_clerk") {
    return [`ew:office_${trade}`];
  }
  if (role === "station" || role === "station_host") {
    return [`ew:station_${trade}`];
  }
  if (role === "service" || role === "service_host") {
    return [`ew:service_${trade}`];
  }
  return [];
}

function roleName(role: string, trade: string): string {
  const name = tradeDef(trade).name;
  if (role === "office" || role === "office_clerk") return `${name} Office`;
  if (role === "station" || role === "station_host") return `${name} Station`;
  if (role === "service" || role === "service_host") return `${name} Service`;
  return name;
}

function spawnBuildingNpcs(
  dimension: Dimension,
  entry: StructureEntry,
  businessId: string,
  trade: string,
  anchor: { x: number; y: number; z: number },
  rotationSteps: 0 | 1 | 2 | 3,
  mirror: StructureMirror
): Entity[] {
  const spawned: Entity[] = [];
  const transform = { rotationSteps, mirror };
  const origin = effectiveStructureOrigin(
    anchor,
    entry,
    rotationSteps,
    mirror
  );
  for (const [name, npcAnchor] of Object.entries(entry.npcAnchors)) {
    if (!npcAnchor) {
      console.warn(`[ew] ${entry.id} ${name} NPC anchor unresolved; skipping`);
      continue;
    }
    const entity = dimension.spawnEntity(
      "minecraft:npc",
      add(origin, transformOffset(npcAnchor.offset, transform))
    );
    entity.nameTag = roleName(npcAnchor.role, trade);
    entity.addTag(`ew:biz_${businessId}`);
    for (const tag of roleTags(npcAnchor.role, trade)) entity.addTag(tag);
    for (const tag of npcAnchor.tags) entity.addTag(tag);
    if (!entity.getTags().some((tag) => tag.startsWith("ew:personality_"))) {
      entity.addTag(randomPersonalityTag());
    }
    spawned.push(entity);
  }
  return spawned;
}

function transformedBounds(
  anchor: { x: number; y: number; z: number },
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  rotationSteps: 0 | 1 | 2 | 3,
  mirror: StructureMirror
) {
  const transform = { rotationSteps, mirror };
  const corners = [
    transformOffset({ x: from.x, y: from.y, z: from.z }, transform),
    transformOffset({ x: from.x, y: from.y, z: to.z }, transform),
    transformOffset({ x: to.x, y: to.y, z: from.z }, transform),
    transformOffset({ x: to.x, y: to.y, z: to.z }, transform),
  ].map((offset) => add(anchor, offset));
  return {
    min: {
      x: Math.min(...corners.map((point) => point.x)),
      y: Math.min(...corners.map((point) => point.y)),
      z: Math.min(...corners.map((point) => point.z)),
    },
    max: {
      x: Math.max(...corners.map((point) => point.x)),
      y: Math.max(...corners.map((point) => point.y)),
      z: Math.max(...corners.map((point) => point.z)),
    },
  };
}

function businessPadBounds(business: Business, entry: StructureEntry) {
  if (!business.site || !entry.padSize) return undefined;
  return transformedBounds(
    business.site.anchor,
    { x: 0, y: -8, z: 0 },
    {
      x: entry.padSize.x - 1,
      y: 64,
      z: entry.padSize.z - 1,
    },
    business.site.rotationSteps,
    business.site.mirror
  );
}

function isWithin(
  location: { x: number; y: number; z: number },
  bounds: ReturnType<typeof transformedBounds>
): boolean {
  return (
    location.x >= bounds.min.x &&
    location.x <= bounds.max.x &&
    location.y >= bounds.min.y &&
    location.y <= bounds.max.y &&
    location.z >= bounds.min.z &&
    location.z <= bounds.max.z
  );
}

function isTradeNpc(entity: Entity, trade: string): boolean {
  const tags = entity.getTags();
  return tags.some(
    (tag) =>
      tag === `ew:shop_${trade}` ||
      tag === `ew:office_${trade}` ||
      tag === `ew:station_${trade}` ||
      tag === `ew:service_${trade}`
  );
}

export function businessNpcEntities(
  business: Business,
  level = business.tier
): Entity[] {
  if (!business.site) return [];
  const dimension = world.getDimension(business.site.dimensionId);
  const tagged = dimension.getEntities({
    type: "minecraft:npc",
    tags: [`ew:biz_${business.id}`],
  });
  const entry = structureForTradeLevel(business.trade, level);
  const bounds = entry ? businessPadBounds(business, entry) : undefined;
  const fallback = bounds
    ? dimension
        .getEntities({ type: "minecraft:npc" })
        .filter(
          (entity) =>
            isTradeNpc(entity, business.trade) &&
            isWithin(entity.location, bounds)
        )
    : [];
  return [...new Map([...tagged, ...fallback].map((entity) => [entity.id, entity])).values()];
}

export function businessStorefrontClerkName(business: Business): string {
  const clerk = businessNpcEntities(business).find((entity) =>
    entity.getTags().includes(`ew:shop_${business.trade}`)
  );
  return clerk?.nameTag || `${tradeDef(business.trade).name} Clerk`;
}

export function despawnBusinessNpcs(business: Business): number {
  const entities = businessNpcEntities(business);
  for (const entity of entities) entity.remove();
  return entities.length;
}

export function respawnBusinessNpcs(
  business: Business,
  level = business.tier
): Entity[] {
  if (!business.site) return [];
  const entry = structureForTradeLevel(business.trade, level);
  if (!entry) {
    console.warn(
      `[ew] missing ${business.trade} L${level} registry entry; NPC respawn skipped`
    );
    return [];
  }
  despawnBusinessNpcs(business);
  return spawnBuildingNpcs(
    world.getDimension(business.site.dimensionId),
    entry,
    business.id,
    business.trade,
    business.site.anchor,
    business.site.rotationSteps,
    business.site.mirror
  );
}

function fillBounds(
  dimension: Dimension,
  bounds: ReturnType<typeof transformedBounds>,
  block: string
): void {
  dimension.runCommand(
    `fill ${bounds.min.x} ${bounds.min.y} ${bounds.min.z} ${bounds.max.x} ${bounds.max.y} ${bounds.max.z} ${block}`
  );
}

function dressingBounds(business: Business, entry: StructureEntry) {
  if (!business.site || !entry.padSize) return [];
  const cfg = matrix.ownership.construction;
  const margin = cfg.scaffoldingMargin;
  const top = cfg.scaffoldingHeight - 1;
  const site = business.site;
  const ring = [
    [
      { x: -margin, y: 0, z: -margin },
      { x: entry.padSize.x - 1 + margin, y: top, z: -margin },
    ],
    [
      { x: -margin, y: 0, z: entry.padSize.z - 1 + margin },
      {
        x: entry.padSize.x - 1 + margin,
        y: top,
        z: entry.padSize.z - 1 + margin,
      },
    ],
    [
      { x: -margin, y: 0, z: 0 },
      { x: -margin, y: top, z: entry.padSize.z - 1 },
    ],
    [
      { x: entry.padSize.x - 1 + margin, y: 0, z: 0 },
      {
        x: entry.padSize.x - 1 + margin,
        y: top,
        z: entry.padSize.z - 1,
      },
    ],
  ] as const;
  const bounds = ring.map(([from, to]) =>
    transformedBounds(
      site.anchor,
      from,
      to,
      site.rotationSteps,
      site.mirror
    )
  );
  if (!entry.gateOffset) return bounds;
  const origin = effectiveStructureOrigin(
    site.anchor,
    entry,
    site.rotationSteps,
    site.mirror
  );
  for (const pile of cfg.materialPiles) {
    const [ox, oy, oz] = pile.offset;
    const [sx, sy, sz] = pile.size;
    bounds.push(
      transformedBounds(
        origin,
        {
          x: entry.gateOffset.x + ox,
          y: entry.gateOffset.y + oy,
          z: entry.gateOffset.z + oz,
        },
        {
          x: entry.gateOffset.x + ox + sx - 1,
          y: entry.gateOffset.y + oy + sy - 1,
          z: entry.gateOffset.z + oz + sz - 1,
        },
        site.rotationSteps,
        site.mirror
      )
    );
  }
  return bounds;
}

export function placeConstructionDressing(business: Business): void {
  if (!business.site || !business.construction) return;
  const entry = structureForTradeLevel(
    business.trade,
    business.construction.targetTier
  );
  if (!entry?.padSize) {
    console.warn(`[ew] construction dressing skipped for ${business.id}; pad unresolved`);
    return;
  }
  const dimension = world.getDimension(business.site.dimensionId);
  const bounds = dressingBounds(business, entry);
  const ringCount = 4;
  for (let index = 0; index < bounds.length; index += 1) {
    const block =
      index < ringCount
        ? matrix.ownership.construction.scaffoldingBlock
        : matrix.ownership.construction.materialPiles[index - ringCount]!.block;
    fillBounds(dimension, bounds[index]!, block);
  }
}

export function clearConstructionDressing(business: Business): void {
  if (!business.site || !business.construction) return;
  const entry = structureForTradeLevel(
    business.trade,
    business.construction.targetTier
  );
  if (!entry) return;
  const dimension = world.getDimension(business.site.dimensionId);
  for (const bounds of dressingBounds(business, entry)) {
    fillBounds(dimension, bounds, "minecraft:air");
  }
}

function targetStructure(
  business: Business,
  level: number
): { entry: StructureEntry; structure: Structure } | undefined {
  const entry = structureForTradeLevel(business.trade, level);
  if (!entry) return undefined;
  const structure = world.structureManager.get(entry.id);
  if (!structure) return undefined;
  return { entry, structure };
}

export function structureLayerCount(
  business: Business,
  level: number
): number | undefined {
  return targetStructure(business, level)?.structure.size.y;
}

export function placeBusinessStructureLayerBand(
  business: Business,
  level: number,
  fromLayer: number,
  toLayerExclusive: number
): number {
  if (!business.site) return 0;
  const target = targetStructure(business, level);
  if (!target) {
    throw new Error(`structure unavailable for ${business.trade} L${level}`);
  }
  const source = target.structure;
  const from = Math.max(0, Math.min(source.size.y, Math.floor(fromLayer)));
  const to = Math.max(from, Math.min(source.size.y, Math.floor(toLayerExclusive)));
  if (to <= from) return 0;
  const tempId = `ew:construction_${business.id.replace(
    /[^a-zA-Z0-9_]/g,
    "_"
  )}_${level}_${temporaryStructureSequence++}`;
  const slice = world.structureManager.createEmpty(tempId, {
    x: source.size.x,
    y: to - from,
    z: source.size.z,
  });
  const air = BlockPermutation.resolve("minecraft:air");
  try {
    for (let y = from; y < to; y += 1) {
      for (let z = 0; z < source.size.z; z += 1) {
        for (let x = 0; x < source.size.x; x += 1) {
          const location = { x, y, z };
          const sourcePermutation = source.getBlockPermutation(location);
          const permutation = sourcePermutation ?? air;
          slice.setBlockPermutation(
            { x, y: y - from, z },
            permutation,
            sourcePermutation ? source.getIsWaterlogged(location) : false
          );
        }
      }
    }
    const origin = effectiveStructureOrigin(
      business.site.anchor,
      target.entry,
      business.site.rotationSteps,
      business.site.mirror
    );
    placeStructure(
      world.getDimension(business.site.dimensionId),
      slice,
      { ...origin, y: origin.y + from },
      business.site.rotationSteps,
      business.site.mirror
    );
  } finally {
    world.structureManager.delete(slice);
  }
  return to - from;
}

export function placeFinalBusinessStructure(
  business: Business,
  level: number
): void {
  if (!business.site) throw new Error(`business ${business.id} has no site`);
  const target = targetStructure(business, level);
  if (!target) {
    throw new Error(`structure unavailable for ${business.trade} L${level}`);
  }
  const origin = effectiveStructureOrigin(
    business.site.anchor,
    target.entry,
    business.site.rotationSteps,
    business.site.mirror
  );
  placeStructure(
    world.getDimension(business.site.dimensionId),
    target.structure,
    origin,
    business.site.rotationSteps,
    business.site.mirror
  );
}

export function placeBusinessStructure(
  player: Player,
  businesses: BusinessesState,
  extraction: ExtractionState,
  trade: string,
  tier: 1 | 2 | 3 = 1,
  mirror: StructureMirror = "none",
  at?: { x: number; y: number; z: number },
  extraRotationSteps: 0 | 1 | 2 | 3 = 0
): PlaceBusinessResult {
  const businessId = `cpu_${trade}`;
  const business = businesses.byId[businessId];
  if (!business) throw new Error(`missing business ${businessId}`);
  const entry = structureForTradeLevel(trade, tier);
  if (!entry) throw new Error(`missing structure level ${tier} for ${trade}`);
  const front = entry.front ?? "south";

  const transform = resolvePlacementTransform(front, player.getRotation().y, mirror);
  const rotationSteps = ((transform.rotationSteps + extraRotationSteps) %
    4) as 0 | 1 | 2 | 3;
  const anchor = floorLocation(at ?? player.location);
  const dimension = player.dimension;
  const origin = effectiveStructureOrigin(
    anchor,
    entry,
    rotationSteps,
    transform.mirror
  );
  business.site = {
    dimensionId: dimension.id,
    anchor,
    rotationSteps,
    mirror: transform.mirror,
  };
  despawnBusinessNpcs(business);
  placeStructure(dimension, entry.id, origin, rotationSteps, transform.mirror);

  const pitZone = entry.zones.work_pit;
  if (
    Array.isArray(pitZone) &&
    pitZone.length === 6 &&
    pitZone.every((n) => typeof n === "number")
  ) {
    const [x1, y1, z1, x2, y2, z2] = pitZone as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const center = add(
      origin,
      transformOffset(
        {
          x: Math.floor((x1 + x2) / 2),
          y: Math.floor((y1 + y2) / 2),
          z: Math.floor((z1 + z2) / 2),
        },
        { rotationSteps, mirror: transform.mirror }
      )
    );
    registerWorkZone(extraction, business.id, trade, dimension, center, false);
  } else {
    console.warn(`[ew] ${entry.id} work_pit zone unresolved; extraction zone not registered`);
  }

  spawnBuildingNpcs(
    dimension,
    entry,
    business.id,
    trade,
    anchor,
    rotationSteps,
    transform.mirror
  );

  saveBusinesses(businesses);
  feedback(player, `Placed ${tradeDef(trade).name} L${tier}.`, "gain");
  return {
    businessId: business.id,
    trade,
    structureId: entry.id,
    anchor,
    rotationSteps,
  };
}

export function structureIdForBusinessTier(
  trade: string,
  tier: 1 | 2 | 3
): string | undefined {
  return structureForTradeLevel(trade, tier)?.id;
}

export function reloadBusinessStructure(
  business: BusinessesState["byId"][string]
): void {
  if (!business?.site) return;
  placeFinalBusinessStructure(business, business.tier);
}

export function placeStructureById(
  dimension: Dimension,
  structureId: string,
  anchor: { x: number; y: number; z: number },
  rotationSteps: 0 | 1 | 2 | 3,
  mirror: StructureMirror
): void {
  const entry = structureById(structureId);
  const origin = entry
    ? effectiveStructureOrigin(anchor, entry, rotationSteps, mirror)
    : anchor;
  placeStructure(dimension, structureId, origin, rotationSteps, mirror);
}

export function placeRegistryStructure(
  player: Player,
  structureId: string,
  mirror: StructureMirror = "none"
): { structureId: string; anchor: { x: number; y: number; z: number }; rotationSteps: 0 | 1 | 2 | 3 } {
  const entry = structureById(structureId);
  if (!entry) throw new Error(`unknown structure id ${structureId}`);
  const anchor = floorLocation(player.location);
  const transform = resolvePlacementTransform(
    entry.front ?? "south",
    player.getRotation().y,
    mirror
  );
  const origin = effectiveStructureOrigin(
    anchor,
    entry,
    transform.rotationSteps,
    transform.mirror
  );
  placeStructure(
    player.dimension,
    entry.id,
    origin,
    transform.rotationSteps,
    transform.mirror
  );
  return { structureId: entry.id, anchor, rotationSteps: transform.rotationSteps };
}

export function successorSiteFor(
  business: BusinessesState["byId"][string]
): PlacementSite | null {
  if (!business.site) return null;
  const offset = transformOffset(
    successorOffsetForTrade(business.trade),
    {
      rotationSteps: business.site.rotationSteps,
      mirror: business.site.mirror,
    }
  );
  return {
    ...business.site,
    anchor: {
      x: business.site.anchor.x + offset.x,
      y: business.site.anchor.y + offset.y,
      z: business.site.anchor.z + offset.z,
    },
  };
}
