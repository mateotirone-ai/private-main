import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import * as nbt from "prismarine-nbt";

const SCHEM_DIR = resolve(process.cwd(), "assets/schematics");
const OUT_DIR = resolve(process.cwd(), "packs/economy_bp/structures/ew");
const REGISTRY_PATH = resolve(process.cwd(), "data/structures.json");
const BEDROCK_BLOCK_VERSION = 17959425;
const SUBSTITUTE_BLOCK = "minecraft:magenta_glazed_terracotta";
const PAD_MARGIN = 1;

const RENAME = new Map([
  ["cobblestone_stairs", "stone_stairs"],
  ["stone_stairs", "normal_stone_stairs"],
  ["stone_slab", "normal_stone_slab"],
  ["dirt_path", "grass_path"],
  ["smooth_quartz", "quartz_block"],
  ["wall_torch", "torch"],
  ["soul_wall_torch", "soul_torch"],
  ["redstone_wall_torch", "redstone_torch"],
  ["sugar_cane", "reeds"],
  ["melon", "melon_block"],
  ["cobweb", "web"],
  ["snow", "snow_layer"],
  ["dead_bush", "deadbush"],
  ["spawner", "mob_spawner"],
  ["slime_block", "slime"],
  ["magma_block", "magma"],
  ["jack_o_lantern", "lit_pumpkin"],
  ["note_block", "noteblock"],
]);

const SKIP = new Set([
  "air",
  "cave_air",
  "void_air",
  "structure_void",
  "barrier",
  "light",
  "moving_piston",
  "piston_head",
]);

function parseStates(raw) {
  if (!raw.includes("[")) return { base: raw, states: {} };
  const idx = raw.indexOf("[");
  const base = raw.slice(0, idx);
  const body = raw.slice(idx + 1, -1);
  const states = {};
  for (const entry of body.split(",")) {
    const [k, v] = entry.split("=");
    if (!k || v === undefined) continue;
    states[k.trim()] = v.trim();
  }
  return { base, states };
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value) {
  return value === "true";
}

function toBedrockBlock(rawState, report) {
  const raw = String(rawState).replace("minecraft:", "");
  const parsed = parseStates(raw);
  let base = RENAME.get(parsed.base) ?? parsed.base;
  if (SKIP.has(base)) return undefined;
  if (base.endsWith("_sign") || base.endsWith("_hanging_sign") || base.endsWith("_wall_sign")) {
    report.droppedSigns += 1;
    return undefined;
  }
  const java = parsed.states;
  const states = {};
  if (base.endsWith("_stairs")) {
    const map = { east: 0, west: 1, south: 2, north: 3 };
    states.weirdo_direction = toInt(map[java.facing] ?? 0);
    states.upside_down_bit = toBool(java.half === "top");
  } else if (base.endsWith("_slab")) {
    if (java.type === "double") base = base.replace("_slab", "_double_slab");
    else if (java.type === "top") states["minecraft:vertical_half"] = "top";
  } else if (base.endsWith("_trapdoor")) {
    const map = { east: 0, west: 1, south: 2, north: 3 };
    states.direction = toInt(map[java.facing] ?? 0);
    states.upside_down_bit = toBool(java.half === "top");
    states.open_bit = toBool(java.open === "true");
  } else if (base.endsWith("_door")) {
    const map = { east: 0, south: 1, west: 2, north: 3 };
    states.direction = toInt(map[java.facing] ?? 0);
    states.upper_block_bit = toBool(java.half === "upper");
    states.door_hinge_bit = toBool(java.hinge === "right");
    states.open_bit = toBool(java.open === "true");
  } else if (
    java.axis &&
    (base.endsWith("_log") ||
      base.endsWith("_wood") ||
      base.endsWith("_stem") ||
      base.endsWith("_hyphae") ||
      [
        "hay_block",
        "bone_block",
        "purpur_pillar",
        "quartz_pillar",
        "basalt",
        "polished_basalt",
      ].includes(base))
  ) {
    states.pillar_axis = java.axis;
  } else if (base === "ladder" && java.facing) {
    const map = { north: 2, south: 3, west: 4, east: 5 };
    states.facing_direction = toInt(map[java.facing] ?? 2);
  } else if (base.endsWith("lantern") && java.hanging === "true") {
    states.hanging = true;
  } else if (
    ["chest", "trapped_chest", "barrel", "furnace", "blast_furnace", "smoker"].includes(base)
  ) {
    report.defaultFaced += 1;
  }
  if (!base.match(/^[a-z0-9_]+$/)) {
    report.unmapped += 1;
    return { name: SUBSTITUTE_BLOCK, states: {}, substituted: true, source: rawState };
  }
  return {
    name: `minecraft:${base}`,
    states,
    substituted: false,
    source: rawState,
  };
}

function decodeVarints(buffer) {
  const out = [];
  let i = 0;
  while (i < buffer.length) {
    let value = 0;
    let shift = 0;
    while (true) {
      const b = buffer[i++];
      value |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
      if (i >= buffer.length) break;
    }
    out.push(value >>> 0);
  }
  return out;
}

function nbtCompound(value) {
  return { type: "compound", value };
}

function nbtString(value) {
  return { type: "string", value };
}

function nbtInt(value) {
  return { type: "int", value };
}

function nbtList(type, value) {
  return { type: "list", value: { type, value } };
}

/** Bedrock block_indices are ZYX: index = z + y*sizeZ + x*sizeY*sizeZ */
function bedrockIndex(x, y, z, height, length) {
  return z + y * length + x * height * length;
}

/** Sponge .schem BlockData is XZY: index = x + z*width + y*width*length */
function schemToBedrockBlocks(blocks, width, height, length) {
  const out = Array(width * height * length).fill(undefined);
  for (let i = 0; i < blocks.length; i += 1) {
    const x = i % width;
    const z = Math.floor(i / width) % length;
    const y = Math.floor(i / (width * length));
    out[bedrockIndex(x, y, z, height, length)] = blocks[i];
  }
  return out;
}

function buildMcstructure({ width, height, length, blocks }) {
  // `blocks` must already be in Bedrock ZYX order.
  const palette = [];
  const paletteIndex = new Map();
  const indices = [];
  for (const block of blocks) {
    if (!block) {
      indices.push(-1);
      continue;
    }
    const key = `${block.name}|${JSON.stringify(block.states)}`;
    let idx = paletteIndex.get(key);
    if (idx === undefined) {
      idx = palette.length;
      paletteIndex.set(key, idx);
      const stateCompound = {};
      for (const [k, v] of Object.entries(block.states)) {
        if (typeof v === "boolean") stateCompound[k] = { type: "byte", value: v ? 1 : 0 };
        else if (typeof v === "number") stateCompound[k] = { type: "int", value: v };
        else stateCompound[k] = { type: "string", value: String(v) };
      }
      palette.push(
        nbtCompound({
          name: nbtString(block.name),
          states: nbtCompound(stateCompound),
          version: nbtInt(BEDROCK_BLOCK_VERSION),
        })
      );
    }
    indices.push(idx);
  }

  const root = {
    name: "",
    type: "compound",
    value: {
      format_version: nbtInt(1),
      size: nbtList("int", [width, height, length]),
      structure_world_origin: nbtList("int", [0, 0, 0]),
      structure: nbtCompound({
        block_indices: nbtList("list", [
          nbtList("int", indices),
          nbtList("int", Array(indices.length).fill(-1)),
        ]),
        entities: nbtList("compound", []),
        palette: nbtCompound({
          default: nbtCompound({
            block_palette: nbtList("compound", palette),
            block_position_data: nbtCompound({}),
          }),
        }),
      }),
    },
  };
  return nbt.writeUncompressed(root, "little");
}

async function parseSchem(filePath) {
  const data = readFileSync(filePath);
  const { parsed } = await nbt.parse(data);
  const simplified = nbt.simplify(parsed);
  const root = simplified.Schematic ?? simplified;
  const width = Number(root.Width);
  const height = Number(root.Height);
  const length = Number(root.Length);
  const palette = root.Blocks?.Palette ?? root.Palette ?? {};
  const blockData = root.Blocks?.Data ?? root.BlockData ?? [];
  const blockEntities = root.Blocks?.BlockEntities ?? root.BlockEntities ?? [];
  const invPalette = {};
  for (const [name, idx] of Object.entries(palette)) {
    invPalette[Number(idx)] = name;
  }
  const ids = decodeVarints(Buffer.from(blockData));
  return {
    width,
    height,
    length,
    ids,
    invPalette,
    blockEntitiesCount: Array.isArray(blockEntities) ? blockEntities.length : 0,
  };
}

function collectSchemFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSchemFiles(child));
    else if (entry.name.toLowerCase().endsWith(".schem")) out.push(child);
  }
  return out;
}

export function trueFootprintWithMargin(
  blocks,
  width,
  length,
  margin = PAD_MARGIN
) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < blocks.length; i += 1) {
    if (!blocks[i]) continue;
    const x = i % width;
    const z = Math.floor(i / width) % length;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  if (!Number.isFinite(minX)) {
    return [width + margin * 2, length + margin * 2];
  }
  return [
    maxX - minX + 1 + margin * 2,
    maxZ - minZ + 1 + margin * 2,
  ];
}

export function appendRegistryEntryIfMissing(registry, id, padSize) {
  registry.structures ??= [];
  if (registry.structures.some((entry) => entry?.id === id)) return false;
  registry.structures.push({
    id,
    padSize,
    anchor: "front-left-pad-corner",
    anchorOffset: [0, 0, 0],
    front: "south",
    gateOffset: "TODO",
    npcAnchors: {
      storefront: "TODO",
      office: "TODO",
    },
    zones: {},
  });
  return true;
}

export async function ingestSchematics() {
  const files = collectSchemFiles(SCHEM_DIR);
  mkdirSync(OUT_DIR, { recursive: true });
  if (!files.length) {
    console.log("[schem] no .schem files found under assets/schematics/");
    return { converted: 0 };
  }
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const autoAddedIds = [];
  let converted = 0;
  for (const filePath of files) {
    const stem = basename(filePath).replace(/\.schem$/i, "");
    const structureId = `ew:${stem}`;
    const outPath = resolve(OUT_DIR, `${stem}.mcstructure`);
    const report = {
      droppedSigns: 0,
      defaultFaced: 0,
      unmapped: 0,
      substituted: 0,
    };
    const schem = await parseSchem(filePath);
    const blocks = [];
    for (let i = 0; i < schem.ids.length; i += 1) {
      const rawState = schem.invPalette[schem.ids[i]];
      const mapped = rawState ? toBedrockBlock(rawState, report) : undefined;
      if (mapped?.substituted) report.substituted += 1;
      blocks.push(mapped);
    }
    const bedrockBlocks = schemToBedrockBlocks(
      blocks,
      schem.width,
      schem.height,
      schem.length
    );
    const payload = buildMcstructure({
      width: schem.width,
      height: schem.height,
      length: schem.length,
      blocks: bedrockBlocks,
    });
    writeFileSync(outPath, payload);
    const padSize = trueFootprintWithMargin(
      blocks,
      schem.width,
      schem.length
    );
    const registryAdded = appendRegistryEntryIfMissing(
      registry,
      structureId,
      padSize
    );
    if (registryAdded) autoAddedIds.push(structureId);
    converted += 1;
    console.log(
      `[schem] ${stem}.schem -> ${basename(outPath)} | blockEntities=${schem.blockEntitiesCount} droppedSigns=${report.droppedSigns} defaultFaced=${report.defaultFaced} substituted=${report.substituted} registry=${registryAdded ? `auto-added(${structureId})` : "existing"}`
    );
  }
  if (autoAddedIds.length) {
    writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    console.log(`[schem] registry auto-added: ${autoAddedIds.join(", ")}`);
  }
  return { converted, autoAddedIds };
}
