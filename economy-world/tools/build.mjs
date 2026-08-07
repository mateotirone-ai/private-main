// Bundles src/main.ts -> packs/economy_bp/scripts/main.js
import * as esbuild from "esbuild";
import { ingestSchematics } from "./ingest-schematics.mjs";

const opts = {
  entryPoints: ["src/main.ts"],
  outfile: "packs/economy_bp/scripts/main.js",
  bundle: true,
  format: "esm",
  target: "es2023",
  external: ["@minecraft/server", "@minecraft/server-ui"],
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  await ingestSchematics();
  const ctx = await esbuild.context(opts);
  await ctx.watch();
  console.log("watching src/ ...");
} else {
  await ingestSchematics();
  await esbuild.build(opts);
}
