// Copies packs into com.mojang development folders (Windows).
// Run AFTER npm run build. Edit MOJANG if your install differs.
import { cpSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const MOJANG = join(
  homedir(),
  "AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang"
);
if (!existsSync(MOJANG)) {
  console.error("com.mojang not found - is Minecraft (Bedrock) installed? Looked in:\n" + MOJANG);
  process.exit(1);
}
cpSync("packs/economy_bp", join(MOJANG, "development_behavior_packs/economy_bp"), { recursive: true });
cpSync("packs/economy_rp", join(MOJANG, "development_resource_packs/economy_rp"), { recursive: true });
console.log("deployed economy_bp + economy_rp to development packs.");
