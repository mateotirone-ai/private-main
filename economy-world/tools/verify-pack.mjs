import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const [bpArg, rpArg] = process.argv.slice(2);
if (!bpArg || !rpArg) {
  throw new Error("usage: node tools/verify-pack.mjs <bp-dir> <rp-dir>");
}

const root = process.cwd();
const bp = resolve(root, bpArg);
const rp = resolve(root, rpArg);
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const expectedPhase = pkg.phase;
const expectedVersion = pkg.version.split(".").map(Number);
const banned = [
  "ew_node_depleted",
  "ew_node_recovering",
  "ew:node_depleted",
  "ew:node_recovering",
];

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function filesUnder(path) {
  const out = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(child));
    else out.push(child);
  }
  return out;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const bpManifest = json(resolve(bp, "manifest.json"));
const rpManifest = json(resolve(rp, "manifest.json"));
const bpModuleTypes = new Set(bpManifest.modules.map((module) => module.type));
assert(
  bpModuleTypes.has("data"),
  "BP manifest is missing a data module; custom items may be stripped on load"
);
assert(
  bpModuleTypes.has("script"),
  "BP manifest is missing a script module"
);
assert(
  bpManifest.header.description.includes(`Phase ${expectedPhase}`),
  `BP manifest is not Phase ${expectedPhase}`
);
assert(
  JSON.stringify(bpManifest.header.version) === JSON.stringify(expectedVersion),
  "BP manifest version does not match package.json"
);
assert(
  JSON.stringify(rpManifest.header.version) === JSON.stringify(expectedVersion),
  "RP manifest version does not match package.json"
);
assert(
  rpManifest.header.description.includes(`Phase ${expectedPhase}`),
  `RP manifest is not Phase ${expectedPhase}`
);

const mainPath = resolve(bp, "scripts/main.js");
assert(existsSync(mainPath), "compiled BP scripts/main.js is missing");
const main = readFileSync(mainPath, "utf8");
assert(
  main.includes(`Economy World Phase ${expectedPhase} booted`),
  `compiled main.js is not Phase ${expectedPhase}`
);

const itemAtlas = json(resolve(rp, "textures/item_texture.json"));
const walletTexture = itemAtlas.texture_data?.ew_wallet?.textures;
assert(walletTexture, "ew_wallet atlas key is missing");
assert(
  existsSync(resolve(rp, `${walletTexture}.png`)),
  "ew_wallet PNG is missing"
);
const textureList = new Set(json(resolve(rp, "textures_list.json")));
assert(textureList.has(walletTexture), "ew_wallet is absent from textures_list");

const hud = json(resolve(rp, "ui/hud_screen.json"));
const hudMerge = hud.root_panel?.modifications?.find(
  (entry) => entry.array_name === "controls"
);
assert(
  hudMerge?.value?.["ew_wallet_chip@hud.ew_wallet_chip"],
  "wallet chip is not merged into hud.root_panel"
);
const cashData = hud.ew_wallet_chip?.controls?.[0]?.cash_data;
assert(
  hud.ew_wallet_chip?.$cash_update_prefix === "ewcash:",
  "wallet chip update prefix does not match the script bridge"
);
assert(
  cashData?.bindings?.some(
    (binding) =>
      binding.binding_name === "#hud_title_text_string" &&
      binding.binding_type === "global"
  ),
  "wallet chip does not consume the global title update channel"
);
assert(
  cashData?.bindings?.some(
    (binding) =>
      binding.binding_name_override === "#preserved_cash_text" &&
      binding.binding_condition === "visibility_changed"
  ),
  "wallet chip does not preserve cash-only updates"
);
assert(
  main.includes('CASH_HUD_PREFIX = "ewcash:"') &&
    main.includes('CASH_OBJECTIVE = "ew_cash"'),
  "compiled HUD script is missing its cash bridge or scoreboard mirror"
);

for (const path of [...filesUnder(bp), ...filesUnder(rp)]) {
  assert(
    !/node_(depleted|recovering)/i.test(path),
    `obsolete node-stage file remains: ${path}`
  );
  if (!/\.(json|lang|js|ts)$/i.test(path)) continue;
  const content = readFileSync(path, "utf8");
  for (const token of banned) {
    assert(!content.includes(token), `obsolete node-stage id ${token} in ${path}`);
  }
}

console.log(
  `verified Phase ${expectedPhase} ${pkg.version}: manifest, main.js, wallet, HUD merge, node cleanup`
);
