// Copies packs into com.mojang development folders (Windows).
// Run AFTER npm run build.
// Xbox-app installs use Roaming/Minecraft Bedrock; UWP Store path is the fallback.
import { cpSync, existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CANDIDATES = [
  join(homedir(), "AppData/Roaming/Minecraft Bedrock/Users/Shared/games/com.mojang"),
  join(
    homedir(),
    "AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang"
  ),
];

const MOJANG = CANDIDATES.find((p) => existsSync(p));
if (!MOJANG) {
  console.error(
    "com.mojang not found - is Minecraft (Bedrock) installed? Looked in:\n" +
      CANDIDATES.map((p) => `  - ${p}`).join("\n")
  );
  process.exit(1);
}

const BP_DEST = join(MOJANG, "development_behavior_packs/economy_bp");
const RP_DEST = join(MOJANG, "development_resource_packs/economy_rp");

// Replace rather than merge. A merge leaves deleted block definitions behind,
// which can keep obsolete texture references alive after an upgrade.
rmSync(BP_DEST, { recursive: true, force: true });
rmSync(RP_DEST, { recursive: true, force: true });
cpSync("packs/economy_bp", BP_DEST, { recursive: true });
cpSync("packs/economy_rp", RP_DEST, { recursive: true });
console.log(`deployed economy_bp + economy_rp to:\n  ${MOJANG}`);
