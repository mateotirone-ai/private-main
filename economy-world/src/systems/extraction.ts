/**
 * Extraction work zones + visibly staged resource regeneration.
 * Work-zone blocks are intercepted before vanilla drops, credited to business
 * storage, then replaced depleted → recovering → ready.
 */
import {
  system,
  world,
  type Dimension,
  type Player,
  type Vector3,
} from "@minecraft/server";
import { loadBlob, saveBlob } from "../core/state";
import { every, currentTick } from "../core/scheduler";
import { matrix } from "../content/matrix";
import {
  extractionDef,
  extractionTradeForBlock,
  workConfig,
} from "../content/work";
import { tradeDef } from "../content/trades";
import { actionbar, toast } from "../ui/toast";
import { bareAmount } from "../ui/theme";
import { saveBusinesses, type BusinessesState } from "./businesses";
import {
  employmentSession,
  recordEmployeeOutput,
  saveEmployment,
  type EmploymentState,
} from "./employment";
import { wagePayout } from "./employmentMath";
import {
  advanceNode,
  type NodeStage,
  type ResourceNode,
} from "./nodeMath";
import { adjustStock, savePrices, type PricesState } from "./pricing";
import { giveItem } from "./cash";

export interface WorkZone {
  id: string;
  businessId: string;
  dimensionId: string;
  center: Vector3;
  radius: number;
  public: boolean;
}

export interface WorldResourceNode extends ResourceNode {
  dimensionId: string;
  location: Vector3;
}

export interface ExtractionState {
  schema: 1;
  zones: Record<string, WorkZone>;
  nodes: Record<string, WorldResourceNode>;
}

const KEY = "ew:extraction";

export function emptyExtraction(): ExtractionState {
  return { schema: 1, zones: {}, nodes: {} };
}

export function loadExtraction(): ExtractionState {
  return loadBlob<ExtractionState>(KEY) ?? emptyExtraction();
}

export function saveExtraction(state: ExtractionState): void {
  saveBlob(KEY, state);
}

export function registerWorkZone(
  state: ExtractionState,
  businessId: string,
  dimensionId: string,
  center: Vector3,
  publicZone = false
): WorkZone {
  const id = [
    businessId,
    dimensionId,
    Math.floor(center.x),
    Math.floor(center.y),
    Math.floor(center.z),
    publicZone ? "public" : "employee",
  ].join(":");
  const zone: WorkZone = {
    id,
    businessId,
    dimensionId,
    center: { x: center.x, y: center.y, z: center.z },
    radius: matrix.work.zoneRadius,
    public: publicZone,
  };
  state.zones[id] = zone;
  saveExtraction(state);
  return zone;
}

export function isInsideZone(
  zone: WorkZone,
  dimensionId: string,
  location: Vector3
): boolean {
  if (zone.dimensionId !== dimensionId) return false;
  const dx = location.x - zone.center.x;
  const dy = location.y - zone.center.y;
  const dz = location.z - zone.center.z;
  return dx * dx + dy * dy + dz * dz <= zone.radius * zone.radius;
}

function nodeId(dimensionId: string, location: Vector3): string {
  return `${dimensionId}:${location.x}:${location.y}:${location.z}`;
}

function setStageBlock(
  dimension: Dimension,
  location: Vector3,
  stage: NodeStage,
  readyBlock: string
): void {
  const block = dimension.getBlock(location);
  if (!block) return;
  if (stage === "ready") block.setType(readyBlock);
  else block.setType(workConfig.stageBlocks[stage]);
}

function pendingWage(session: NonNullable<ReturnType<typeof employmentSession>>): number {
  const wage = matrix.wagePerHourByTier[String(session.tier)] ?? 0;
  return wagePayout(
    wage,
    currentTick() - session.paidThroughTick,
    matrix.work.employment.ticksPerHour
  );
}

export function startExtractionSystem(
  extraction: ExtractionState,
  businesses: BusinessesState,
  prices: PricesState,
  employment: EmploymentState
): void {
  const attemptHarvest = (
    player: Player,
    dimension: Dimension,
    location: Vector3,
    blockTypeId: string,
    cancel: () => void
  ): void => {
    const trade = extractionTradeForBlock(blockTypeId);
    if (!trade) return;
    const session = employmentSession(employment, player.id);
    const employedBusiness = session
      ? businesses.byId[session.businessId]
      : undefined;
    const zone = Object.values(extraction.zones).find((candidate) => {
      const zoneBusiness = businesses.byId[candidate.businessId];
      if (!zoneBusiness || zoneBusiness.trade !== trade) return false;
      if (!isInsideZone(candidate, dimension.id, location)) {
        return false;
      }
      return candidate.public || candidate.businessId === employedBusiness?.id;
    });
    if (!zone) return;
    const business = businesses.byId[zone.businessId];
    if (!business) return;
    const employed = !zone.public && session?.businessId === business.id;

    cancel();
    const def = tradeDef(trade);
    const extractionCfg = extractionDef(trade);
    if (!extractionCfg) return;
    if (employed && business.storage >= def.storageCap) {
      system.run(() => toast(player, "Business storage is full.", "caution"));
      return;
    }

    const dimensionId = dimension.id;
    const capturedLocation = { ...location };
    system.run(() => {
      if (employed && session) {
        business.storage += 1;
        business.producedTotal += 1;
        recordEmployeeOutput(employment, player.id, 1);
        adjustStock(prices, def.good, 1);
      } else {
        giveItem(player, def.item, 1);
      }

      const id = nodeId(dimensionId, capturedLocation);
      extraction.nodes[id] = {
        id,
        trade,
        readyBlock: extractionCfg.readyBlock,
        stage: "depleted",
        harvestedTick: currentTick(),
        dimensionId,
        location: capturedLocation,
      };
      setStageBlock(
        dimension,
        capturedLocation,
        "depleted",
        extractionCfg.readyBlock
      );
      saveExtraction(extraction);
      saveBusinesses(businesses);
      saveEmployment(employment);
      savePrices(prices);
      if (employed && session) {
        actionbar(
          player,
          `${def.name} · output ${session.output} · earned ${bareAmount(pendingWage(session))}`,
          "info"
        );
      }
    });
  };

  world.beforeEvents.playerBreakBlock.subscribe((ev) => {
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
      setStageBlock(dimension, node.location, node.stage, node.readyBlock);
      changed = true;
    }
    if (changed) saveExtraction(extraction);
  });
}

export function registerPlayerZone(
  state: ExtractionState,
  player: Player,
  businessId: string,
  publicZone = false
): WorkZone {
  return registerWorkZone(
    state,
    businessId,
    player.dimension.id,
    player.location,
    publicZone
  );
}
