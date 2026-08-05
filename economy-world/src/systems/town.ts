import {
  world,
  type Dimension,
  type Entity,
  type Player,
  type Vector3,
} from "@minecraft/server";
import { tradeDef } from "../content/trades";
import {
  defaultTownId,
  townManifest,
  type TownManifest,
  type TownOffset,
} from "../content/towns";
import { registerWorkZone, type ExtractionState } from "./extraction";
import {
  registerServiceHost,
  type ServiceState,
} from "./service";
import { type BusinessesState } from "./businesses";

const AIR_TYPES = new Set([
  "minecraft:air",
  "minecraft:cave_air",
  "minecraft:void_air",
  "minecraft:water",
  "minecraft:flowing_water",
  "minecraft:lava",
  "minecraft:flowing_lava",
]);

export interface SeedTownResult {
  townId: string;
  hostCount: number;
  zoneCount: number;
}

function add(base: Vector3, offset: TownOffset): Vector3 {
  return {
    x: Math.floor(base.x + offset.x),
    y: Math.floor(base.y + offset.y),
    z: Math.floor(base.z + offset.z),
  };
}

function sanitizeTagId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

export function surfaceLocation(
  dimension: Dimension,
  base: Vector3,
  scanUp: number,
  scanDown: number
): Vector3 {
  const floor = Math.floor(base.y - Math.max(0, scanDown));
  const ceiling = Math.floor(base.y + Math.max(0, scanUp));
  for (let y = ceiling; y >= floor; y -= 1) {
    const ground = dimension.getBlock({ x: Math.floor(base.x), y, z: Math.floor(base.z) });
    const above = dimension.getBlock({
      x: Math.floor(base.x),
      y: y + 1,
      z: Math.floor(base.z),
    });
    if (!ground || !above) continue;
    if (AIR_TYPES.has(ground.typeId)) continue;
    if (!AIR_TYPES.has(above.typeId)) continue;
    return { x: Math.floor(base.x), y: y + 1, z: Math.floor(base.z) };
  }
  return { x: Math.floor(base.x), y: Math.floor(base.y), z: Math.floor(base.z) };
}

function placeAtSurface(
  dimension: Dimension,
  anchor: Vector3,
  offset: TownOffset,
  town: TownManifest
): Vector3 {
  return surfaceLocation(
    dimension,
    add(anchor, offset),
    town.placement.surfaceScanUp,
    town.placement.surfaceScanDown
  );
}

function ensureTags(entity: Entity, tags: readonly string[]): void {
  const current = new Set(entity.getTags());
  for (const tag of tags) {
    if (!current.has(tag)) entity.addTag(tag);
  }
}

function upsertNpc(
  dimension: Dimension,
  uniqueTag: string,
  typeId: string,
  location: Vector3
): Entity {
  const existing = dimension.getEntities({ tags: [uniqueTag] })[0];
  if (existing) {
    existing.teleport(location, { dimension });
    return existing;
  }
  const spawned = dimension.spawnEntity(typeId, location);
  spawned.addTag(uniqueTag);
  return spawned;
}

function resolveAnchor(player: Player, town: TownManifest): { dimension: Dimension; anchor: Vector3 } {
  if (town.anchor.mode === "fixed") {
    const dimension = world.getDimension(town.dimensionId);
    return {
      dimension,
      anchor: {
        x: Math.floor(town.anchor.x),
        y: Math.floor(town.anchor.y),
        z: Math.floor(town.anchor.z),
      },
    };
  }
  return {
    dimension: player.dimension,
    anchor: {
      x: Math.floor(player.location.x),
      y: Math.floor(player.location.y),
      z: Math.floor(player.location.z),
    },
  };
}

export function seedTown(
  player: Player,
  extraction: ExtractionState,
  service: ServiceState,
  businesses: BusinessesState,
  townId = defaultTownId()
): SeedTownResult {
  const town = townManifest(townId);
  if (!town) throw new Error(`unknown town manifest: ${townId}`);
  const { dimension, anchor } = resolveAnchor(player, town);
  let hostCount = 0;
  let zoneCount = 0;
  const marker = town.defaults.markerTag;
  const npcType = town.defaults.npcTypeId;
  const personalityTag = town.defaults.personalityTag;

  for (const civic of town.civics) {
    const slot = sanitizeTagId(`${town.id}_civic_${civic.id}`);
    const uniqueTag = `${marker}_${slot}`;
    const location = placeAtSurface(dimension, anchor, civic.offset, town);
    const entity = upsertNpc(dimension, uniqueTag, npcType, location);
    entity.nameTag = civic.nameTag;
    ensureTags(entity, [
      marker,
      civic.roleTag,
      civic.personalityTag ?? personalityTag,
    ]);
    hostCount += 1;
  }

  for (const storefront of town.storefronts) {
    const slot = sanitizeTagId(`${town.id}_shop_${storefront.trade}`);
    const uniqueTag = `${marker}_${slot}`;
    const location = placeAtSurface(dimension, anchor, storefront.offset, town);
    const entity = upsertNpc(dimension, uniqueTag, npcType, location);
    const trade = tradeDef(storefront.trade);
    entity.nameTag = trade.name;
    ensureTags(entity, [
      marker,
      personalityTag,
      `ew:shop_${storefront.trade}`,
      `ew:biz_cpu_${storefront.trade}`,
      `ew:owner_${storefront.trade}`,
    ]);
    hostCount += 1;
  }

  for (const station of town.stations) {
    const slot = sanitizeTagId(`${town.id}_station_${station.trade}`);
    const uniqueTag = `${marker}_${slot}`;
    const location = placeAtSurface(dimension, anchor, station.offset, town);
    const entity = upsertNpc(dimension, uniqueTag, npcType, location);
    entity.nameTag = `${tradeDef(station.trade).name} Station`;
    ensureTags(entity, [marker, personalityTag, `ew:station_${station.trade}`]);
    hostCount += 1;
  }

  for (const serviceHost of town.serviceHosts) {
    const slot = sanitizeTagId(`${town.id}_service_${serviceHost.trade}`);
    const uniqueTag = `${marker}_${slot}`;
    const location = placeAtSurface(dimension, anchor, serviceHost.offset, town);
    const entity = upsertNpc(dimension, uniqueTag, npcType, location);
    const speaker = `${tradeDef(serviceHost.trade).name} Service`;
    entity.nameTag = speaker;
    ensureTags(entity, [marker, personalityTag, `ew:service_${serviceHost.trade}`]);
    registerServiceHost(
      service,
      entity.id,
      serviceHost.trade,
      dimension.id,
      entity.location,
      speaker,
      businesses.byId[`cpu_${serviceHost.trade}`]?.id
    );
    hostCount += 1;
  }

  for (const zone of town.workZones) {
    const businessId = `cpu_${zone.trade}`;
    if (!businesses.byId[businessId]) {
      throw new Error(`cannot stamp zone; missing business ${businessId}`);
    }
    const center = placeAtSurface(dimension, anchor, zone.offset, town);
    registerWorkZone(
      extraction,
      businessId,
      zone.trade,
      dimension,
      center,
      zone.public
    );
    zoneCount += 1;
  }

  return { townId: town.id, hostCount, zoneCount };
}
