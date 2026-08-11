/**
 * Generate ew:home_6 — a buyable Construction Co. starter cottage.
 * Palette: sandstone/calcite + spruce timber + mud-brick roof + copper lanterns.
 * Front: north. Odd primary footprint. L-ish porch wing.
 *
 * Usage: node tools/gen-catalog-home.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import * as nbt from "prismarine-nbt";

const BEDROCK_BLOCK_VERSION = 18168865;
const OUT_DIR = resolve(process.cwd(), "packs/economy_bp/structures/ew");
const REGISTRY_PATH = resolve(process.cwd(), "data/structures.json");
const BLUEPRINT_PATH = resolve(process.cwd(), "docs/blueprints/home_6.md");

// Structure bounds (includes 1-block landscaping margin)
const W = 15; // x
const H = 11; // y
const L = 17; // z

const FACE = { east: 0, west: 1, south: 2, north: 3 };
const DOOR = { east: 0, south: 1, west: 2, north: 3 };

function block(name, states = {}) {
  return { name: name.startsWith("minecraft:") ? name : `minecraft:${name}`, states };
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

function buildMcstructure({ width, height, length, blocks }) {
  // Bedrock structures store air in the palette (index 0), matching captured exports.
  const paletteValues = [
    {
      name: nbtString("minecraft:air"),
      states: nbtCompound({}),
      version: nbtInt(BEDROCK_BLOCK_VERSION),
    },
  ];
  const paletteIndex = new Map([["minecraft:air|{}", 0]]);
  const indices = [];
  for (const b of blocks) {
    const block = b ?? { name: "minecraft:air", states: {} };
    const key = `${block.name}|${JSON.stringify(block.states)}`;
    let idx = paletteIndex.get(key);
    if (idx === undefined) {
      idx = paletteValues.length;
      paletteIndex.set(key, idx);
      const stateCompound = {};
      for (const [k, v] of Object.entries(block.states)) {
        if (typeof v === "boolean") stateCompound[k] = { type: "byte", value: v ? 1 : 0 };
        else if (typeof v === "number") stateCompound[k] = { type: "int", value: v };
        else stateCompound[k] = { type: "string", value: String(v) };
      }
      paletteValues.push({
        name: nbtString(block.name),
        states: nbtCompound(stateCompound),
        version: nbtInt(BEDROCK_BLOCK_VERSION),
      });
    }
    indices.push(idx);
  }
  // Nested list shape must match captured .mcstructure files:
  // block_indices = list<list> of bare int arrays; block_palette = list of bare compounds.
  const root = {
    name: "",
    type: "compound",
    value: {
      format_version: nbtInt(1),
      size: nbtList("int", [width, height, length]),
      structure_world_origin: nbtList("int", [0, 0, 0]),
      structure: nbtCompound({
        block_indices: {
          type: "list",
          value: {
            type: "list",
            value: [
              { type: "int", value: indices },
              { type: "int", value: Array(indices.length).fill(-1) },
            ],
          },
        },
        entities: { type: "list", value: { type: "compound", value: [] } },
        palette: nbtCompound({
          default: nbtCompound({
            block_palette: {
              type: "list",
              value: { type: "compound", value: paletteValues },
            },
            block_position_data: nbtCompound({}),
          }),
        }),
      }),
    },
  };
  return nbt.writeUncompressed(root, "little");
}

// Bedrock .mcstructure block_indices are ZYX order:
// index = z + y * sizeZ + x * sizeY * sizeZ
function idx(x, y, z) {
  return z + y * L + x * H * L;
}

function set(grid, x, y, z, b) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= L) return;
  grid[idx(x, y, z)] = b;
}

function fill(grid, x0, y0, z0, x1, y1, z1, b) {
  const xa = Math.min(x0, x1),
    xb = Math.max(x0, x1);
  const ya = Math.min(y0, y1),
    yb = Math.max(y0, y1);
  const za = Math.min(z0, z1),
    zb = Math.max(z0, z1);
  for (let y = ya; y <= yb; y++)
    for (let z = za; z <= zb; z++)
      for (let x = xa; x <= xb; x++) set(grid, x, y, z, b);
}

function hollow(grid, x0, y0, z0, x1, y1, z1, b) {
  fill(grid, x0, y0, z0, x1, y1, z1, b);
  fill(grid, x0 + 1, y0 + 1, z0 + 1, x1 - 1, y1 - 1, z1 - 1, null);
}

function hash(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

function wallField(x, y, z) {
  const n = hash(x, y, z) % 10;
  if (n === 0) return block("calcite");
  if (n <= 2) return block("smooth_sandstone");
  return block("sandstone");
}

function buildHouse() {
  const grid = Array(W * H * L).fill(null);

  // Main volume (odd): x=3..11 (9), z=4..14 (11), walls y=1..5
  const mx0 = 3,
    mx1 = 11,
    mz0 = 4,
    mz1 = 14;
  // Porch wing north: x=5..9 (5), z=2..3
  const px0 = 5,
    px1 = 9,
    pz0 = 2,
    pz1 = 3;

  // --- Ground / landscaping ---
  fill(grid, 0, 0, 0, W - 1, 0, L - 1, block("grass_block"));
  // Path from north gate to porch (noisy)
  for (let z = 0; z <= 3; z++) {
    for (let x = 6; x <= 8; x++) {
      const n = hash(x, 0, z) % 5;
      set(
        grid,
        x,
        0,
        z,
        n === 0
          ? block("coarse_dirt")
          : n === 1
            ? block("gravel")
            : block("grass_path")
      );
    }
  }
  // Foundation plinth under house
  fill(grid, mx0 - 1, 0, mz0 - 1, mx1 + 1, 0, mz1 + 1, block("smooth_sandstone"));
  fill(grid, px0 - 1, 0, pz0, px1 + 1, 0, pz1, block("smooth_sandstone"));

  // Flower beds (jittered)
  for (const [x, z] of [
    [2, 3],
    [3, 2],
    [11, 2],
    [12, 3],
    [1, 8],
    [13, 10],
  ]) {
    if (hash(x, 1, z) % 2 === 0) set(grid, x, 1, z, block("poppy"));
    else set(grid, x, 1, z, block("dandelion"));
    set(grid, x, 0, z, block("dirt"));
  }
  // Hedge bits
  for (const [x, z] of [
    [1, 5],
    [1, 6],
    [13, 5],
    [13, 6],
    [4, 15],
    [10, 15],
  ]) {
    set(grid, x, 1, z, block("oak_leaves"));
  }

  // --- Floors ---
  fill(grid, mx0, 1, mz0, mx1, 1, mz1, block("spruce_planks"));
  fill(grid, px0, 1, pz0, px1, 1, pz1, block("spruce_planks"));
  // Carpet living area
  fill(grid, 5, 2, 8, 9, 2, 11, block("orange_carpet"));

  // --- Walls (height 5: y=2..5, floor at y=1) ---
  // Main shell
  for (let y = 2; y <= 5; y++) {
    for (let x = mx0; x <= mx1; x++) {
      set(grid, x, y, mz0, wallField(x, y, mz0));
      set(grid, x, y, mz1, wallField(x, y, mz1));
    }
    for (let z = mz0; z <= mz1; z++) {
      set(grid, mx0, y, z, wallField(mx0, y, z));
      set(grid, mx1, y, z, wallField(mx1, y, z));
    }
  }
  // Clear interior air already null; ensure hollow
  fill(grid, mx0 + 1, 2, mz0 + 1, mx1 - 1, 5, mz1 - 1, null);
  // Re-floor (cleared)
  fill(grid, mx0, 1, mz0, mx1, 1, mz1, block("spruce_planks"));
  fill(grid, 5, 2, 8, 9, 2, 11, block("orange_carpet"));

  // Porch low walls / railing
  for (let x = px0; x <= px1; x++) {
    set(grid, x, 2, pz0, block("spruce_fence"));
  }
  set(grid, px0, 2, pz0, block("spruce_fence"));
  set(grid, px1, 2, pz0, block("spruce_fence"));
  set(grid, px0, 2, pz1, block("spruce_fence"));
  set(grid, px1, 2, pz1, block("spruce_fence"));
  // Porch posts
  for (const x of [px0, px1]) {
    for (let y = 2; y <= 4; y++) set(grid, x, y, pz0, block("spruce_log", { pillar_axis: "y" }));
  }

  // --- Outer spruce frame (depth) ---
  for (const [x, z] of [
    [mx0 - 1, mz0 - 1],
    [mx1 + 1, mz0 - 1],
    [mx0 - 1, mz1 + 1],
    [mx1 + 1, mz1 + 1],
  ]) {
    for (let y = 1; y <= 5; y++) set(grid, x, y, z, block("spruce_log", { pillar_axis: "y" }));
  }
  // Mid wall pillars every ~3–4 along north/south
  for (const x of [5, 7, 9]) {
    for (let y = 2; y <= 5; y++) {
      if (x === 7) continue; // door bay
      set(grid, x, y, mz0 - 1, block("spruce_log", { pillar_axis: "y" }));
    }
  }
  // Base ledge slabs
  for (let x = mx0; x <= mx1; x++) {
    set(grid, x, 1, mz0 - 1, block("sandstone_slab", { "minecraft:vertical_half": "bottom" }));
  }

  // --- Door (north center x=7) ---
  set(grid, 7, 2, mz0, block("spruce_door", { direction: DOOR.north, upper_block_bit: false, open_bit: false, door_hinge_bit: false }));
  set(grid, 7, 3, mz0, block("spruce_door", { direction: DOOR.north, upper_block_bit: true, open_bit: false, door_hinge_bit: false }));
  set(grid, 7, 4, mz0, block("sandstone_stairs", { weirdo_direction: FACE.north, upside_down_bit: true }));
  // Clear porch path through fence at door
  set(grid, 7, 2, pz0, null);
  set(grid, 7, 2, pz1, null);
  set(grid, 7, 1, pz0, block("spruce_planks"));
  set(grid, 7, 1, pz1, block("spruce_planks"));

  // --- Inset windows ---
  function window(x, z, facing) {
    set(grid, x, 3, z, block("glass_pane"));
    set(grid, x, 4, z, block("glass_pane"));
    // sill
    const sillDir =
      facing === "south" ? FACE.south : facing === "north" ? FACE.north : facing === "east" ? FACE.east : FACE.west;
    set(grid, x, 2, z, block("sandstone_stairs", { weirdo_direction: sillDir, upside_down_bit: true }));
    // shutters
    if (facing === "south" || facing === "north") {
      set(grid, x - 1, 3, z, block("spruce_trapdoor", { direction: FACE.east, upside_down_bit: false, open_bit: true }));
      set(grid, x + 1, 3, z, block("spruce_trapdoor", { direction: FACE.west, upside_down_bit: false, open_bit: true }));
    }
  }
  window(5, mz0, "north");
  window(9, mz0, "north");
  window(5, mz1, "south");
  window(9, mz1, "south");
  window(mx0, 8, "west");
  window(mx0, 11, "west");
  window(mx1, 8, "east");
  window(mx1, 11, "east");

  // --- Interior: kitchen / living / loft feel ---
  // Counter
  fill(grid, 4, 2, 12, 4, 2, 13, block("barrel"));
  set(grid, 4, 2, 11, block("crafting_table"));
  set(grid, 5, 2, 13, block("smoker"));
  // Table + chairs
  set(grid, 8, 2, 9, block("spruce_fence"));
  set(grid, 8, 3, 9, block("spruce_pressure_plate"));
  set(grid, 7, 2, 9, block("spruce_stairs", { weirdo_direction: FACE.east, upside_down_bit: false }));
  set(grid, 9, 2, 9, block("spruce_stairs", { weirdo_direction: FACE.west, upside_down_bit: false }));
  // Bed in NE corner
  set(grid, 10, 2, 12, block("white_wool"));
  set(grid, 10, 2, 13, block("white_wool"));
  set(grid, 10, 3, 13, block("white_carpet"));
  // Chest storage
  set(grid, 10, 2, 5, block("chest"));
  // Bookshelf accent
  set(grid, 4, 2, 5, block("bookshelf"));
  set(grid, 4, 3, 5, block("bookshelf"));

  // Ceiling beams at y=5
  for (let x = mx0 + 1; x <= mx1 - 1; x += 2) {
    for (let z = mz0 + 1; z <= mz1 - 1; z++) {
      set(grid, x, 5, z, block("spruce_log", { pillar_axis: "z" }));
    }
  }
  // Fill ceiling gaps with planks
  for (let x = mx0 + 1; x <= mx1 - 1; x++) {
    for (let z = mz0 + 1; z <= mz1 - 1; z++) {
      if (!grid[idx(x, 5, z)]) set(grid, x, 5, z, block("spruce_planks"));
    }
  }

  // Hidden lighting under carpet / trapdoors
  set(grid, 7, 2, 7, block("lantern", { hanging: false }));
  set(grid, 6, 4, 9, block("lantern", { hanging: true }));
  set(grid, 8, 4, 12, block("lantern", { hanging: true }));
  // Exterior copper-ish lantern posts (oxidized copper + lantern)
  set(grid, 4, 1, 2, block("oxidized_copper"));
  set(grid, 4, 2, 2, block("oxidized_copper"));
  set(grid, 4, 3, 2, block("lantern", { hanging: false }));
  set(grid, 10, 1, 2, block("oxidized_copper"));
  set(grid, 10, 2, 2, block("lantern", { hanging: false }));

  // --- Roof: mud brick gable, ridge along Z (main), overhang 1 ---
  // Roof covers x=mx0-1..mx1+1, z=mz0-1..mz1+1, porch lean-to
  const roofZ0 = mz0 - 1,
    roofZ1 = mz1 + 1;
  const roofX0 = mx0 - 1,
    roofX1 = mx1 + 1;
  const midX = 7; // odd center

  // Gable slopes rising toward midX
  for (let z = roofZ0; z <= roofZ1; z++) {
    for (let step = 0; step <= 4; step++) {
      const y = 6 + step;
      const xL = roofX0 + step;
      const xR = roofX1 - step;
      // Stairs ascend inward toward the ridge.
      if (xL < midX) {
        set(grid, xL, y, z, block("mud_brick_stairs", { weirdo_direction: FACE.east, upside_down_bit: false }));
        if (step > 0) set(grid, xL + 1, y, z, block("mud_bricks"));
      }
      if (xR > midX) {
        set(grid, xR, y, z, block("mud_brick_stairs", { weirdo_direction: FACE.west, upside_down_bit: false }));
        if (step > 0) set(grid, xR - 1, y, z, block("mud_bricks"));
      }
    }
    // ridge slab
    set(grid, midX, 10, z, block("mud_brick_slab", { "minecraft:vertical_half": "bottom" }));
    // darker edge trim mix
    if (hash(midX, 10, z) % 4 === 0) {
      set(grid, midX, 10, z, block("spruce_slab", { "minecraft:vertical_half": "bottom" }));
    }
  }

  // Eave underside trim (upside-down stairs)
  for (let z = roofZ0; z <= roofZ1; z++) {
    set(grid, roofX0 - 1, 6, z, block("mud_brick_stairs", { weirdo_direction: FACE.east, upside_down_bit: true }));
    set(grid, roofX1 + 1, 6, z, block("mud_brick_stairs", { weirdo_direction: FACE.west, upside_down_bit: true }));
  }

  // Porch shed roof (lean-to north)
  for (let x = px0 - 1; x <= px1 + 1; x++) {
    set(grid, x, 5, pz0 - 1, block("mud_brick_stairs", { weirdo_direction: FACE.north, upside_down_bit: false }));
    set(grid, x, 4, pz0 - 1, block("mud_brick_stairs", { weirdo_direction: FACE.north, upside_down_bit: true }));
    set(grid, x, 5, pz1, block("mud_bricks"));
  }

  // Chimney on north roof
  fill(grid, 9, 6, 13, 9, 9, 13, block("cobblestone"));
  set(grid, 9, 10, 13, block("cobblestone"));
  set(grid, 9, 9, 13, block("campfire"));

  // Gate marker area (north path front)
  set(grid, 6, 1, 0, block("spruce_fence"));
  set(grid, 8, 1, 0, block("spruce_fence"));

  return grid;
}

function materialCounts(grid) {
  const counts = new Map();
  for (const b of grid) {
    if (!b) continue;
    counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function writeBlueprint(grid, counts) {
  const lines = [];
  lines.push("# Blueprint — `ew:home_6` (Catalog Cottage)");
  lines.push("");
  lines.push("Buyable Construction Co. starter home. Soft Mediterranean/cozy");
  lines.push("palette for Economy World.");
  lines.push("");
  lines.push("## Brief");
  lines.push("- Program: 1-bed catalog cottage (living, kitchen nook, porch)");
  lines.push("- Footprint: main 9×11 + north porch 5×2 (odd centers)");
  lines.push("- Front: north · Gate ~ `[7, 1, 0]`");
  lines.push("- Palette: sandstone/calcite · spruce timber · mud-brick roof · oxidized copper lantern posts");
  lines.push("");
  lines.push("## Size");
  lines.push(`- Structure box: ${W} × ${H} × ${L} (x,y,z)`);
  lines.push("- Pad suggestion: `[17, 19]` with margin");
  lines.push("");
  lines.push("## Material counts");
  lines.push("");
  lines.push("| Block | Count |");
  lines.push("|---|---|");
  for (const [name, n] of counts) lines.push(`| \`${name}\` | ${n} |`);
  lines.push("");
  lines.push("## Layer sheets (legend: `.` air/grass skip, letters = key blocks)");
  lines.push("");
  lines.push("Key: `S` sandstone family · `P` spruce plank/log · `M` mud brick · `G` glass · `F` furniture · `#` other");
  lines.push("");

  const legend = (b) => {
    if (!b) return ".";
    if (b.name.includes("sandstone") || b.name.includes("calcite")) return "S";
    if (b.name.includes("spruce") || b.name.includes("log")) return "P";
    if (b.name.includes("mud")) return "M";
    if (b.name.includes("glass")) return "G";
    if (
      b.name.includes("barrel") ||
      b.name.includes("chest") ||
      b.name.includes("stairs") ||
      b.name.includes("carpet") ||
      b.name.includes("wool") ||
      b.name.includes("smoker") ||
      b.name.includes("crafting")
    )
      return "F";
    return "#";
  };

  for (let y = 0; y < H; y++) {
    lines.push(`### Y=${y}`);
    lines.push("```");
    for (let z = 0; z < L; z++) {
      let row = "";
      for (let x = 0; x < W; x++) row += legend(grid[idx(x, y, z)]);
      lines.push(row);
    }
    lines.push("```");
    lines.push("");
  }

  lines.push("## Anchors");
  lines.push("- `gateOffset`: `[7, 1, 0]`");
  lines.push("- Door: `[7, 2, 4]` (structure-local)");
  lines.push("- No NPC office/storefront (residential)");
  lines.push("");
  lines.push("## Renders");
  lines.push("- Front (north): porch + gable + path + copper lantern posts");
  lines.push("- Back (south): chimney + twin windows + hedge");
  lines.push("- Preview image: `docs/blueprints/home_6_preview.png`");
  lines.push("");

  mkdirSync(resolve(BLUEPRINT_PATH, ".."), { recursive: true });
  writeFileSync(BLUEPRINT_PATH, lines.join("\n"));
}

function updateRegistry(padSize) {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  registry.structures ??= [];
  const id = "ew:home_6";
  const existing = registry.structures.find((e) => e.id === id);
  const entry = {
    id,
    trade: "home",
    padSize,
    anchor: "front-left-pad-corner",
    anchorOffset: [0, 0, 0],
    front: "north",
    gateOffset: [7, 1, 0],
    npcAnchors: {},
    zones: {},
  };
  let changed = false;
  if (existing) {
    const before = JSON.stringify(existing);
    Object.assign(existing, entry);
    changed = JSON.stringify(existing) !== before;
  } else {
    registry.structures.push(entry);
    changed = true;
  }
  if (!changed) return;
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
}

const grid = buildHouse();
const payload = buildMcstructure({ width: W, height: H, length: L, blocks: grid });
mkdirSync(OUT_DIR, { recursive: true });
const outPath = resolve(OUT_DIR, "home_6.mcstructure");
writeFileSync(outPath, payload);
const counts = materialCounts(grid);
writeBlueprint(grid, counts);
updateRegistry([17, 19]);
console.log(`Wrote ${outPath} (${payload.length} bytes)`);
console.log(`Blueprint ${BLUEPRINT_PATH}`);
console.log(`Blocks placed: ${counts.reduce((s, [, n]) => s + n, 0)}`);
console.log("Top materials:", counts.slice(0, 8).map(([n, c]) => `${n}:${c}`).join(", "));
