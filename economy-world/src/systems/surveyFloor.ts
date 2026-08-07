/**
 * Survey Floor — parcel mosaic + buy/merge forms (Phase 4 §10).
 */
import {
  system,
  world,
  type Player,
  type Vector3,
} from "@minecraft/server";
import { matrix } from "../content/matrix";
import { balance, sink, type LedgerState } from "../core/ledger";
import { currentTick } from "../core/scheduler";
import { defaultTownLayoutId } from "../content/townLayouts";
import { playerAccount } from "./bank";
import { insufficientFundsMessage } from "../ui/funds";
import { confirmTxn, menuHub } from "../ui/patterns";
import { setActionbarContext } from "../ui/toast";
import { speakAs } from "../ui/feedback";
import { formatAmount } from "../ui/theme";
import {
  buyParcel,
  loadParcels,
  mergeOwnedParcels,
  parcelsForTown,
  saveParcels,
  surveyFloorPaletteBlock,
  type ParcelRecord,
  type ParcelsState,
} from "./parcels";
import {
  loadTownInstances,
  saveTownInstances,
  type TownInstance,
} from "./townInstances";
import { surveyFloorMapping } from "./townSeedMath";

export interface SurveyFloorStamp {
  townId: string;
  origin: { x: number; y: number; z: number };
  width: number;
  depth: number;
  dimensionId: string;
}

function floorVec(v: Vector3) {
  return { x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) };
}

function tileParcelIndex(
  floor: SurveyFloorStamp,
  localX: number,
  localZ: number,
  parcelCount: number
): number | undefined {
  const mapping = surveyFloorMapping(parcelCount, floor.width, floor.depth);
  const hit = mapping.find((t) => t.x === localX && t.z === localZ);
  return hit?.parcelIndex;
}

export function paintSurveyFloor(
  townId: string,
  parcels: ParcelsState,
  floor: SurveyFloorStamp
): void {
  const list = parcelsForTown(parcels, townId);
  const dimension = world.getDimension(floor.dimensionId);
  const mapping = surveyFloorMapping(list.length, floor.width, floor.depth);
  for (const tile of mapping) {
    const parcel = list[tile.parcelIndex];
    if (!parcel) continue;
    const typeId = surveyFloorPaletteBlock(parcel.status);
    dimension
      .getBlock({
        x: floor.origin.x + tile.x,
        y: floor.origin.y,
        z: floor.origin.z + tile.z,
      })
      ?.setType(typeId);
  }
}

export function stampStandaloneSurveyFloor(
  player: Player,
  townId?: string
): SurveyFloorStamp {
  const instances = loadTownInstances();
  let instance: TownInstance | undefined;
  if (townId) {
    instance = Object.values(instances.byId).find(
      (t) => t.id === townId || t.layoutId === townId
    );
  }
  if (!instance) {
    instance = Object.values(instances.byId).find((t) => t.mode !== "survey");
  }
  if (!instance) {
    throw new Error(
      `no seeded town to map — run seedtown skeleton|full first (layout ${defaultTownLayoutId()})`
    );
  }
  const [width, depth] = matrix.town.surveyFloor.standaloneSize;
  const origin = floorVec(player.location);
  origin.y = Math.max(-64, origin.y - 1);
  const stamp: SurveyFloorStamp = {
    townId: instance.id,
    origin,
    width,
    depth,
    dimensionId: player.dimension.id,
  };
  instance.surveyFloor = { origin, width, depth };
  saveTownInstances(instances);
  const parcels = loadParcels();
  paintSurveyFloor(instance.id, parcels, stamp);
  return stamp;
}

function floorUnderPlayer(
  player: Player
):
  | {
      instance: TownInstance;
      floor: SurveyFloorStamp;
      localX: number;
      localZ: number;
    }
  | undefined {
  const instances = loadTownInstances();
  const loc = floorVec(player.location);
  for (const instance of Object.values(instances.byId)) {
    const sf = instance.surveyFloor;
    if (!sf || instance.dimensionId !== player.dimension.id) continue;
    const localX = loc.x - sf.origin.x;
    const localZ = loc.z - sf.origin.z;
    if (
      localX < 0 ||
      localZ < 0 ||
      localX >= sf.width ||
      localZ >= sf.depth
    ) {
      continue;
    }
    if (Math.abs(loc.y - sf.origin.y) > 2) continue;
    return {
      instance,
      floor: {
        townId: instance.id,
        origin: sf.origin,
        width: sf.width,
        depth: sf.depth,
        dimensionId: instance.dimensionId,
      },
      localX,
      localZ,
    };
  }
  return undefined;
}

function parcelFromFloor(
  parcels: ParcelsState,
  hit: NonNullable<ReturnType<typeof floorUnderPlayer>>
): ParcelRecord | undefined {
  const list = parcelsForTown(parcels, hit.instance.id);
  const index = tileParcelIndex(
    hit.floor,
    hit.localX,
    hit.localZ,
    list.length
  );
  if (index === undefined) return undefined;
  return list[index];
}

export function startSurveyFloorSystem(ledger: LedgerState): void {
  system.runInterval(() => {
    const parcels = loadParcels();
    for (const player of world.getAllPlayers()) {
      const hit = floorUnderPlayer(player);
      if (!hit) continue;
      const parcel = parcelFromFloor(parcels, hit);
      if (!parcel) continue;
      setActionbarContext(
        player,
        "default",
        `${parcel.name} · ${parcel.sizeClass} · ${parcel.price} · ${parcel.status}`,
        "info"
      );
    }
  }, 10);

  world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    if (!ev.isFirstEvent) return;
    const hit = floorUnderPlayer(ev.player);
    if (!hit) return;
    const block = ev.block.location;
    if (
      block.x < hit.floor.origin.x ||
      block.z < hit.floor.origin.z ||
      block.x >= hit.floor.origin.x + hit.floor.width ||
      block.z >= hit.floor.origin.z + hit.floor.depth
    ) {
      return;
    }
    const player = ev.player;
    system.run(() => {
      void openParcelForm(player, ledger, hit.instance.id, hit.floor);
    });
  });
}

async function openParcelForm(
  player: Player,
  ledger: LedgerState,
  townId: string,
  floor: SurveyFloorStamp
): Promise<void> {
  const parcels = loadParcels();
  const hit = floorUnderPlayer(player);
  if (!hit || hit.instance.id !== townId) return;
  const parcel = parcelFromFloor(parcels, hit);
  if (!parcel) return;

  const buttons = [];
  if (parcel.status === "available") {
    buttons.push({
      label: `Buy — ${formatAmount(parcel.price)}`,
      onSelect: async () => {
        const acct = playerAccount(player);
        const available = balance(ledger, acct);
        const confirmed = await confirmTxn(player, {
          title: `Buy ${parcel.name}`,
          facts: parcel.priceLines,
          lines: [{ label: "Deed price", amount: parcel.price, sense: "loss" }],
          balanceBefore: available,
          balanceAfter: available - parcel.price,
          narrator: "Confirm to register the deed.",
          confirmLabel: "Buy parcel",
        });
        if (!confirmed) return;
        if (available < parcel.price) {
          speakAs(
            player,
            "Real Estate",
            insufficientFundsMessage("You", parcel.price, available)
          );
          return;
        }
        try {
          sink(ledger, acct, parcel.price, currentTick(), "sink:buyout");
        } catch {
          speakAs(
            player,
            "Real Estate",
            insufficientFundsMessage("You", parcel.price, available)
          );
          return;
        }
        const state = loadParcels();
        buyParcel(state, parcel.id, player.id, player.name);
        saveParcels(state);
        paintSurveyFloor(townId, state, floor);
        speakAs(
          player,
          "Real Estate",
          `Deed recorded for ${parcel.name} — ${formatAmount(parcel.price)}.`
        );
      },
    });
  } else if (parcel.status === "owned") {
    buttons.push({
      label: `Owner — ${parcel.ownerName ?? "unknown"}`,
      onSelect: async () => {
        speakAs(
          player,
          "Real Estate",
          `${parcel.name} belongs to ${parcel.ownerName ?? "someone"}.`
        );
      },
    });
    if (parcel.owner === player.id) {
      const owned = parcelsForTown(parcels, townId).filter(
        (p) => p.owner === player.id && p.id !== parcel.id
      );
      for (const other of owned.slice(0, 6)) {
        buttons.push({
          label: `Merge with ${other.name}`,
          onSelect: async () => {
            const state = loadParcels();
            const merged = mergeOwnedParcels(
              state,
              parcel.id,
              other.id,
              player.id
            );
            if (!merged) {
              speakAs(player, "Real Estate", "Those lots aren't adjacent.");
              return;
            }
            saveParcels(state);
            paintSurveyFloor(townId, state, floor);
            speakAs(player, "Real Estate", `Merged into ${merged.name}.`);
          },
        });
      }
    }
  }

  await menuHub(player, {
    title: parcel.name,
    facts: [
      `Size ${parcel.sizeClass}`,
      `Status ${parcel.status}`,
      ...parcel.priceLines,
    ],
    narrator: "Survey Floor parcel desk.",
    buttons,
  });
}
