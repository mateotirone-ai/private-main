/**
 * Extraction: legacy 3×3 node stamps + volume-pit mining (quarry pattern).
 * Volume pits credit piece-rate + business storage for authored blocks only.
 */
import {
  system,
  world,
  type Dimension,
  type ItemStack,
  type Player,
  type Vector3,
} from "@minecraft/server";
import { loadBlob, saveBlob } from "../core/state";
import { every, currentTick } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { extractionDef } from "../content/work";
import { tradeDef } from "../content/trades";
import { setActionbarContext } from "../ui/toast";
import { speakAs } from "../ui/feedback";
import {
  businessStorageCap,
  saveBusinesses,
  type BusinessesState,
} from "./businesses";
import {
  employmentSession,
  recordEmployeeOutput,
  saveEmployment,
  type EmploymentState,
} from "./employment";
import {
  advanceNode,
  nodePositionKey,
  registeredNodeAccess,
  stampedNodeLocations,
  type NodeStage,
  type ResourceNode,
} from "./nodeMath";
import { adjustStock, savePrices, type PricesState } from "./pricing";
import { giveItem } from "./cash";
import { companyToolMarker } from "./companyTools";
import { companyToolCanUse } from "./companyToolPolicy";
import { noteOnboardingOutput } from "./onboarding";
import {
  decidePitBreak,
  isInProtectedStairs,
  isInWorkPit,
  isOnPad,
  pitSiteContext,
  shouldCreditAuthoredBreak,
} from "./extractionPit";
import {
  nextRegenWindow,
  regenEligible,
  regenPhase,
  regenReady,
  regenRemainingTicks,
  type RegenWindow,
} from "./extractionZoneMath";
import {
  authoredBlockTypeAt,
  restoreBusinessZoneVolume,
} from "./structurePlacement";

export interface WorkZone {
  id: string;
  businessId: string;
  trade: string;
  dimensionId: string;
  center: Vector3;
  public: boolean;
  nodeIds: string[];
}

export interface WorldResourceNode extends ResourceNode {
  zoneId: string;
  dimensionId: string;
  location: Vector3;
  pendingHarvest?: boolean;
}

export interface ExtractionState {
  schema: 3;
  zones: Record<string, WorkZone>;
  nodes: Record<string, WorldResourceNode>;
  regen: Record<string, RegenWindow>;
}

const KEY = "ew:extraction";

export function emptyExtraction(): ExtractionState {
  return { schema: 3, zones: {}, nodes: {}, regen: {} };
}

export function loadExtraction(): ExtractionState {
  const state = loadBlob<ExtractionState>(KEY);
  if (!state || (state.schema !== 2 && state.schema !== 3)) {
    return emptyExtraction();
  }
  state.schema = 3;
  state.regen ??= {};
  for (const node of Object.values(state.nodes)) {
    node.pendingHarvest ??= false;
  }
  return state;
}

export function saveExtraction(state: ExtractionState): void {
  saveBlob(KEY, state);
}

export function registerWorkZone(
  state: ExtractionState,
  businessId: string,
  trade: string,
  dimension: Dimension,
  center: Vector3,
  publicZone = false
): WorkZone {
  const dimensionId = dimension.id;
  const id = [
    businessId,
    dimensionId,
    Math.floor(center.x),
    Math.floor(center.y),
    Math.floor(center.z),
    publicZone ? "public" : "employee",
  ].join(":");
  const previous = state.zones[id];
  for (const previousNodeId of previous?.nodeIds ?? []) {
    delete state.nodes[previousNodeId];
  }
  const zone: WorkZone = {
    id,
    businessId,
    trade,
    dimensionId,
    center: {
      x: Math.floor(center.x),
      y: Math.floor(center.y),
      z: Math.floor(center.z),
    },
    public: publicZone,
    nodeIds: [],
  };
  const def = extractionDef(trade);
  if (!def) throw new Error(`missing extraction definition for ${trade}`);
  for (const location of stampedNodeLocations(
    zone.center,
    matrix.work.nodeStampOffsets
  )) {
    const nodeId = nodePositionKey(dimensionId, location);
    state.nodes[nodeId] = {
      id: nodeId,
      zoneId: zone.id,
      trade,
      readyBlock: def.readyBlock,
      stage: "ready",
      harvestedTick: 0,
      pendingHarvest: false,
      dimensionId,
      location,
    };
    zone.nodeIds.push(nodeId);
    dimension.getBlock(location)?.setType(def.readyBlock);
  }
  state.zones[id] = zone;
  saveExtraction(state);
  return zone;
}

function setStageBlock(
  dimension: Dimension,
  location: Vector3,
  trade: string,
  stage: NodeStage
): void {
  const block = dimension.getBlock(location);
  if (!block) return;
  const def = extractionDef(trade);
  if (!def) throw new Error(`missing extraction definition for ${trade}`);
  block.setType(stage === "ready" ? def.readyBlock : def.stageBlocks[stage]);
}

export function clockedInPlayerIds(
  employment: EmploymentState,
  businessId: string
): string[] {
  return Object.entries(employment.sessions)
    .filter(([, session]) => session.businessId === businessId)
    .map(([playerId]) => playerId);
}

export function playersOnBusinessPad(
  businessId: string,
  businesses: BusinessesState
): Player[] {
  const business = businesses.byId[businessId];
  if (!business?.site) return [];
  const ctx = pitSiteContext(business);
  if (!ctx?.padBounds) return [];
  return world.getAllPlayers().filter((player) => {
    if (player.dimension.id !== business.site!.dimensionId) return false;
    return isOnPad(ctx, player.location);
  });
}

export function forceRestorePit(
  extraction: ExtractionState,
  businesses: BusinessesState,
  businessId: string
): number {
  const business = businesses.byId[businessId];
  if (!business) return 0;
  const restored = restoreBusinessZoneVolume(business, "work_pit");
  extraction.regen[businessId] = { eligibleSinceTick: null };
  saveExtraction(extraction);
  return restored;
}

export function pitInfoForPlayer(
  player: Player,
  extraction: ExtractionState,
  businesses: BusinessesState,
  employment: EmploymentState
): string[] {
  const lines: string[] = [];
  for (const business of Object.values(businesses.byId)) {
    if (!business.site) continue;
    const ctx = pitSiteContext(business);
    if (!ctx) continue;
    if (player.dimension.id !== business.site.dimensionId) continue;
    if (!isOnPad(ctx, player.location) && !isInWorkPit(ctx, player.location)) {
      continue;
    }
    const clocked = clockedInPlayerIds(employment, business.id);
    const window = extraction.regen[business.id] ?? { eligibleSinceTick: null };
    const delay = matrix.work.pitRegenDelayTicks;
    const eligible = regenEligible({
      clockedInCount: clocked.length,
      playersOnPad: playersOnBusinessPad(business.id, businesses).length,
    });
    const phase = regenPhase(window, currentTick(), delay);
    const remaining = regenRemainingTicks(window, currentTick(), delay);
    lines.push(
      `business=${business.id} trade=${business.trade} L${business.tier}`
    );
    lines.push(
      `pad=${ctx.padBounds ? `${ctx.padBounds.min.x},${ctx.padBounds.min.y},${ctx.padBounds.min.z}..${ctx.padBounds.max.x},${ctx.padBounds.max.y},${ctx.padBounds.max.z}` : "n/a"}`
    );
    if (ctx.workPit?.boxes[0]) {
      const box = ctx.workPit.boxes[0];
      lines.push(
        `work_pit_local=${box.min.x},${box.min.y},${box.min.z}..${box.max.x},${box.max.y},${box.max.z}`
      );
    }
    lines.push(
      `in_pit=${isInWorkPit(ctx, player.location)} stairs=${isInProtectedStairs(ctx, player.location)}`
    );
    lines.push(
      `clocked_in=${clocked.length ? clocked.join(",") : "(none)"}`
    );
    lines.push(
      `regen=${phase} eligible_now=${eligible} remaining_ticks=${remaining ?? "n/a"}`
    );
  }
  if (!lines.length) lines.push("not standing in a volume-pit pad");
  return lines;
}

function findVolumePitBusiness(
  businesses: BusinessesState,
  dimensionId: string,
  location: Vector3
) {
  for (const business of Object.values(businesses.byId)) {
    if (!business.site || business.site.dimensionId !== dimensionId) continue;
    const ctx = pitSiteContext(business);
    if (!ctx?.workPit?.boxes.length) continue;
    if (isOnPad(ctx, location) || isInWorkPit(ctx, location)) {
      return { business, ctx };
    }
  }
  return undefined;
}

function attemptVolumePitBreak(
  player: Player,
  dimension: Dimension,
  location: Vector3,
  blockTypeId: string,
  cancel: () => void,
  businesses: BusinessesState,
  prices: PricesState,
  employment: EmploymentState,
  extraction: ExtractionState
): boolean {
  const hit = findVolumePitBusiness(businesses, dimension.id, location);
  if (!hit) return false;
  const { business, ctx } = hit;
  const session = employmentSession(employment, player.id);
  const clockedIntoThis = session?.businessId === business.id;
  const authoredType = authoredBlockTypeAt(business, location);
  const decision = decidePitBreak({
    onPad: isOnPad(ctx, location),
    inStairs: isInProtectedStairs(ctx, location),
    inPit: isInWorkPit(ctx, location),
    clockedIntoThis,
    siteClosed: Boolean(business.construction),
    storageFull: business.storage >= businessStorageCap(business),
    authoredMatches: shouldCreditAuthoredBreak(authoredType, blockTypeId),
  });

  if (decision.kind === "outside") return false;

  if (decision.kind === "stairs") {
    cancel();
    return true;
  }

  if (decision.kind === "pad_denied") {
    cancel();
    system.run(() =>
      speakAs(
        player,
        tradeDef(business.trade).name,
        `This is ${tradeDef(business.trade).name} property — clock in first.`
      )
    );
    return true;
  }

  if (decision.kind === "pit_closed") {
    cancel();
    system.run(() =>
      speakAs(
        player,
        tradeDef(business.trade).name,
        "The site is closed for renovation."
      )
    );
    return true;
  }

  if (decision.kind === "pit_storage_full") {
    cancel();
    system.run(() =>
      speakAs(
        player,
        tradeDef(business.trade).name,
        "Business storage is full. Come back after stock moves."
      )
    );
    return true;
  }

  if (decision.kind === "pit_no_credit") {
    // Placed/non-authored blocks: vanilla break, no wages/storage credit.
    return true;
  }

  // Authored pit break: suppress vanilla drops, remove block, credit once.
  cancel();
  const units = decision.units;
  const def = tradeDef(business.trade);
  system.run(() => {
    dimension.getBlock(location)?.setType("minecraft:air");
    business.storage += units;
    business.producedTotal += units;
    const progress = recordEmployeeOutput(employment, player.id, units);
    adjustStock(prices, def.good, units);
    extraction.regen[business.id] = { eligibleSinceTick: null };
    saveBusinesses(businesses);
    saveEmployment(employment);
    savePrices(prices);
    saveExtraction(extraction);
    if (progress) {
      noteOnboardingOutput(player);
      setActionbarContext(
        player,
        "employment",
        `${def.name} · +${progress.increment} · total ${progress.total}`,
        "info"
      );
    }
  });
  return true;
}

function tickPitRegen(
  extraction: ExtractionState,
  businesses: BusinessesState,
  employment: EmploymentState
): void {
  const now = currentTick();
  const delay = matrix.work.pitRegenDelayTicks;
  let changed = false;
  for (const business of Object.values(businesses.byId)) {
    if (!business.site) continue;
    const ctx = pitSiteContext(business);
    if (!ctx?.workPit?.boxes.length) continue;
    const eligible = regenEligible({
      clockedInCount: clockedInPlayerIds(employment, business.id).length,
      playersOnPad: playersOnBusinessPad(business.id, businesses).length,
    });
    const previous = extraction.regen[business.id] ?? {
      eligibleSinceTick: null,
    };
    const next = nextRegenWindow(previous, eligible, now);
    if (
      next.eligibleSinceTick !== previous.eligibleSinceTick
    ) {
      extraction.regen[business.id] = next;
      changed = true;
    } else {
      extraction.regen[business.id] = next;
    }
    if (regenReady(next, now, delay)) {
      restoreBusinessZoneVolume(business, "work_pit");
      extraction.regen[business.id] = { eligibleSinceTick: null };
      changed = true;
    }
  }
  if (changed) saveExtraction(extraction);
}

export function startExtractionSystem(
  extraction: ExtractionState,
  businesses: BusinessesState,
  prices: PricesState,
  employment: EmploymentState
): void {
  const blockRestrictedCompanyTool = (
    player: Player,
    item: ItemStack | undefined,
    dimension: Dimension,
    location: Vector3,
    cancel: () => void
  ): boolean => {
    const marker = companyToolMarker(item);
    if (!marker) return false;
    const node = extraction.nodes[nodePositionKey(dimension.id, location)];
    const nodeBusinessId = node
      ? extraction.zones[node.zoneId]?.businessId
      : undefined;
    const pit = findVolumePitBusiness(businesses, dimension.id, location);
    const pitBusinessId = pit?.business.id;
    const businessId = nodeBusinessId ?? pitBusinessId;
    if (companyToolCanUse(marker, businessId, player.id)) return false;
    cancel();
    system.run(() =>
      speakAs(
        player,
        tradeDef(marker.trade).name,
        "That company tool only works on this business's registered nodes."
      )
    );
    return true;
  };

  const attemptHarvest = (
    player: Player,
    dimension: Dimension,
    location: Vector3,
    blockTypeId: string,
    cancel: () => void
  ): void => {
    if (
      attemptVolumePitBreak(
        player,
        dimension,
        location,
        blockTypeId,
        cancel,
        businesses,
        prices,
        employment,
        extraction
      )
    ) {
      return;
    }

    const id = nodePositionKey(dimension.id, location);
    const node = extraction.nodes[id];
    if (!node) return;
    const zone = extraction.zones[node.zoneId];
    if (!zone) return;
    const business = businesses.byId[zone.businessId];
    if (!business) return;
    if (business.construction && !zone.public) {
      cancel();
      system.run(() =>
        speakAs(
          player,
          tradeDef(node.trade).name,
          "The site is closed for renovation."
        )
      );
      return;
    }
    const session = employmentSession(employment, player.id);
    const access = registeredNodeAccess(
      true,
      zone.public,
      zone.businessId,
      session?.businessId
    );

    if (access === "protected") {
      cancel();
      system.run(() =>
        speakAs(
          player,
          tradeDef(node.trade).name,
          `This is ${tradeDef(node.trade).name} property — clock in first.`
        )
      );
      return;
    }
    if (access === "inert") return;
    cancel();
    if (
      node.stage !== "ready" ||
      blockTypeId !== node.readyBlock ||
      node.pendingHarvest
    ) {
      return;
    }
    node.pendingHarvest = true;

    const def = tradeDef(node.trade);
    const employed = !zone.public && session?.businessId === business.id;
    if (employed && business.storage >= businessStorageCap(business)) {
      node.pendingHarvest = false;
      system.run(() =>
        speakAs(player, def.name, "Business storage is full. Come back after stock moves.")
      );
      return;
    }

    system.run(() => {
      if (node.stage !== "ready") {
        node.pendingHarvest = false;
        return;
      }
      let progress: ReturnType<typeof recordEmployeeOutput> = undefined;
      if (employed && session) {
        business.storage += 1;
        business.producedTotal += 1;
        progress = recordEmployeeOutput(employment, player.id, 1);
        adjustStock(prices, def.good, 1);
      } else {
        giveItem(player, def.item, 1);
      }

      node.stage = "depleted";
      node.harvestedTick = currentTick();
      node.pendingHarvest = false;
      setStageBlock(dimension, node.location, node.trade, node.stage);
      saveExtraction(extraction);
      saveBusinesses(businesses);
      saveEmployment(employment);
      savePrices(prices);
      if (employed && session && progress) {
        noteOnboardingOutput(player);
        setActionbarContext(
          player,
          "employment",
          `${def.name} · +${progress.increment} · total ${progress.total}`,
          "info"
        );
      }
    });
  };

  world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    if (
      blockRestrictedCompanyTool(
        ev.player,
        ev.itemStack,
        ev.block.dimension,
        ev.block.location,
        () => {
          ev.cancel = true;
        }
      )
    ) {
      return;
    }
    attemptHarvest(
      ev.player,
      ev.block.dimension,
      ev.block.location,
      ev.block.typeId,
      () => {
        ev.cancel = true;
      }
    );
  });

  world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    if (!ev.isFirstEvent) return;
    if (
      blockRestrictedCompanyTool(
        ev.player,
        ev.itemStack,
        ev.block.dimension,
        ev.block.location,
        () => {
          ev.cancel = true;
        }
      )
    ) {
      return;
    }
    // Volume pits only respond to break; legacy nodes still accept interact harvest.
    const pit = findVolumePitBusiness(
      businesses,
      ev.block.dimension.id,
      ev.block.location
    );
    if (pit) return;
    attemptHarvest(
      ev.player,
      ev.block.dimension,
      ev.block.location,
      ev.block.typeId,
      () => {
        ev.cancel = true;
      }
    );
  });

  every("extraction:regen", matrix.work.nodeStages.depletedTicks, (tick) => {
    let changed = false;
    for (const node of Object.values(extraction.nodes)) {
      if (!advanceNode(node, tick, matrix.work.nodeStages)) continue;
      const dimension = world.getDimension(node.dimensionId);
      setStageBlock(dimension, node.location, node.trade, node.stage);
      changed = true;
    }
    if (changed) saveExtraction(extraction);
  });

  every(
    "extraction:pit_regen",
    matrix.work.pitRegenSweepTicks,
    () => {
      tickPitRegen(extraction, businesses, employment);
    }
  );
}

export function registerPlayerZone(
  state: ExtractionState,
  player: Player,
  businessId: string,
  trade: string,
  publicZone = false
): WorkZone {
  return registerWorkZone(
    state,
    businessId,
    trade,
    player.dimension,
    player.location,
    publicZone
  );
}
