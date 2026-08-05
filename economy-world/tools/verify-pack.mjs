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
  `verified Phase ${expectedPhase} ${pkg.version}: manifest, main.js, wallet, node cleanup`
);
