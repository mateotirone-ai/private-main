import { type Player, world } from "@minecraft/server";
import { managePanel } from "../ui/patterns";
import { feedback } from "../ui/feedback";
import {
  allStructures,
  groupedStructureCatalog,
  structureById,
  type StructureMirror,
} from "../content/structures";
import {
  placeBusinessStructure,
  placeStructureById,
} from "./structurePlacement";
import { resolvePlacementTransform } from "./structurePlacementMath";
import { type BusinessesState } from "./businesses";
import { type ExtractionState } from "./extraction";

export const BUILDERS_CATALOG_ITEM = "ew:builders_catalog";

interface PendingPlacement {
  structureId: string;
  registerBusiness: boolean;
  mirror: StructureMirror;
  extraRotationSteps: 0 | 1 | 2 | 3;
}

interface LastPlacement {
  dimensionId: string;
  anchor: { x: number; y: number; z: number };
  structureId: string;
  rotationSteps: 0 | 1 | 2 | 3;
  mirror: StructureMirror;
}

const pendingByPlayer = new Map<string, PendingPlacement>();
const lastByPlayer = new Map<string, LastPlacement>();

function structureOptions(): string[] {
  const grouped = groupedStructureCatalog();
  const ready = (entry: { id: string }) => {
    const available = Boolean(world.structureManager.get(entry.id));
    if (!available) {
      console.warn(`[ew] catalog structure ${entry.id} is unavailable; skipping`);
    }
    return available;
  };
  return [
    ...grouped.trades.filter(ready).map((entry) => `[Trade] ${entry.id}`),
    ...grouped.civic.filter(ready).map((entry) => `[Civic] ${entry.id}`),
    ...grouped.homes.filter(ready).map((entry) => `[Home] ${entry.id}`),
    ...grouped.imports.filter(ready).map((entry) => `[Import] ${entry.id}`),
  ];
}

function optionToId(option: string): string {
  const idx = option.indexOf("] ");
  return idx >= 0 ? option.slice(idx + 2) : option;
}

function tapAnchorFromBlock(blockLocation: { x: number; y: number; z: number }) {
  return {
    x: Math.floor(blockLocation.x),
    y: Math.floor(blockLocation.y + 1),
    z: Math.floor(blockLocation.z),
  };
}

export async function openBuilderCatalog(player: Player): Promise<void> {
  const options = structureOptions();
  if (!options.length) {
    feedback(player, "Builder catalog is empty.", "caution");
    return;
  }
  const panel = await managePanel(player, {
    title: "Builder's Catalog",
    fields: [
      {
        type: "dropdown",
        label: "Structure",
        options,
        defaultIndex: 0,
      },
      {
        type: "toggle",
        label: "Register business (trade L1 only)",
        defaultValue: true,
      },
      {
        type: "dropdown",
        label: "Mirror",
        options: ["none", "x", "z", "xz"],
        defaultIndex: 0,
      },
      {
        type: "dropdown",
        label: "Rotate +90 steps",
        options: ["0", "1", "2", "3"],
        defaultIndex: 0,
      },
    ],
    saveLabel: "Arm placement",
  });
  if (!panel) return;
  const structureId = optionToId(String(options[Number(panel.values[0]) ?? 0] ?? ""));
  const registerBusiness = Boolean(panel.values[1]);
  const mirror = (["none", "x", "z", "xz"][Number(panel.values[2]) ?? 0] ??
    "none") as StructureMirror;
  const extraRotationSteps = (Number(panel.values[3]) ?? 0) as 0 | 1 | 2 | 3;
  pendingByPlayer.set(player.id, {
    structureId,
    registerBusiness,
    mirror,
    extraRotationSteps,
  });
  feedback(
    player,
    `Catalog armed: ${structureId}. Tap a block to place.`,
    "info"
  );
}

export function tryPlaceFromCatalogTap(
  player: Player,
  blockLocation: { x: number; y: number; z: number },
  businesses: BusinessesState,
  extraction: ExtractionState
): boolean {
  const pending = pendingByPlayer.get(player.id);
  if (!pending) return false;
  const entry = structureById(pending.structureId);
  if (!entry) {
    feedback(player, `Unknown structure ${pending.structureId}.`, "error");
    pendingByPlayer.delete(player.id);
    return true;
  }
  const anchor = tapAnchorFromBlock(blockLocation);
  const transform = resolvePlacementTransform(
    entry.front ?? "south",
    player.getRotation().y,
    pending.mirror
  );
  const rotationSteps = ((transform.rotationSteps + pending.extraRotationSteps) %
    4) as 0 | 1 | 2 | 3;

  if (pending.registerBusiness && entry.trade && entry.level === 1) {
    placeBusinessStructure(
      player,
      businesses,
      extraction,
      entry.trade,
      1,
      pending.mirror,
      anchor,
      pending.extraRotationSteps
    );
  } else {
    placeStructureById(
      player.dimension,
      entry.id,
      anchor,
      rotationSteps,
      pending.mirror
    );
    feedback(player, `Placed ${entry.id}.`, "gain");
  }

  lastByPlayer.set(player.id, {
    dimensionId: player.dimension.id,
    anchor,
    structureId: entry.id,
    rotationSteps,
    mirror: pending.mirror,
  });
  pendingByPlayer.delete(player.id);
  feedback(player, "Placement done. Use /scriptevent ew:dev undo to clear last pad.", "info");
  return true;
}

export function undoLastCatalogPlacement(player: Player): boolean {
  const last = lastByPlayer.get(player.id);
  if (!last) return false;
  const entry = structureById(last.structureId);
  if (!entry?.padSize) {
    feedback(player, "No pad size for undo; clear manually.", "caution");
    return false;
  }
  const dim = player.dimension;
  const width = Math.max(1, entry.padSize.x);
  const depth = Math.max(1, entry.padSize.z);
  const x2 = last.anchor.x + width - 1;
  const z2 = last.anchor.z + depth - 1;
  dim.runCommand(`fill ${last.anchor.x} ${last.anchor.y - 8} ${last.anchor.z} ${x2} ${last.anchor.y + 64} ${z2} air`);
  feedback(player, `Cleared ${entry.id} pad volume.`, "caution");
  lastByPlayer.delete(player.id);
  return true;
}

export function clearCatalogPlayerState(playerId: string): void {
  pendingByPlayer.delete(playerId);
  lastByPlayer.delete(playerId);
}

export function hasCatalogStructureEntries(): boolean {
  return allStructures().length > 0;
}
