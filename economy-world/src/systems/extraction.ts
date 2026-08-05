/**
 * Extraction work zones + visibly staged resource regeneration.
 * Work-zone blocks are intercepted before vanilla drops, credited to business
 * storage, then replaced depleted → recovering → ready.
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
import { saveBusinesses, type BusinessesState } from "./businesses";
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
  schema: 2;
  zones: Record<string, WorkZone>;
  nodes: Record<string, WorldResourceNode>;
}

const KEY = "ew:extraction";

export function emptyExtraction(): ExtractionState {
  return { schema: 2, zones: {}, nodes: {} };
}

export function loadExtraction(): ExtractionState {
  const state = loadBlob<ExtractionState>(KEY);
  // Phase D live-test ruling invalidates pre-stamp zones/nodes.
  if (state?.schema !== 2) return emptyExtraction();
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
    const id = nodePositionKey(dimensionId, location);
    state.nodes[id] = {
      id,
      zoneId: zone.id,
      trade,
      readyBlock: def.readyBlock,
      stage: "ready",
      harvestedTick: 0,
      pendingHarvest: false,
      dimensionId,
      location,
    };
    zone.nodeIds.push(id);
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
    if (companyToolCanUse(marker, nodeBusinessId, player.id)) return false;
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
    const id = nodePositionKey(dimension.id, location);
    const node = extraction.nodes[id];
    if (!node) return;
    const zone = extraction.zones[node.zoneId];
    if (!zone) return;
    const business = businesses.byId[zone.businessId];
    if (!business) return;
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
    if (employed && business.storage >= def.storageCap) {
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
