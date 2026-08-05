import {
  EnchantmentTypes,
  ItemLockMode,
  ItemStack,
  type Container,
  type Player,
} from "@minecraft/server";
import { matrix } from "../content/matrix";
import { jobToolItem } from "../content/work";
import { tradeDef } from "../content/trades";
import {
  decodeCompanyToolMarker,
  encodeCompanyToolMarker,
  shouldReclaimCompanyTool,
  type CompanyToolMarker,
} from "./companyToolPolicy";

const COMPANY_TOOL_KEY = "ew:company_tool";

function inventory(player: Player): Container | undefined {
  return player.getComponent("inventory")?.container;
}

export function companyToolMarker(
  item: ItemStack | undefined
): CompanyToolMarker | undefined {
  return item
    ? decodeCompanyToolMarker(item.getDynamicProperty(COMPANY_TOOL_KEY))
    : undefined;
}

export function issueCompanyTool(
  player: Player,
  businessId: string,
  trade: string,
  tier: number
): boolean {
  const inv = inventory(player);
  if (!inv) return false;
  reclaimCompanyTools(player, "clockOut");
  if (inv.emptySlotsCount <= 0) return false;

  const quality = matrix.work.employment.toolQualityByTier[String(tier)];
  if (quality === undefined) {
    throw new Error(`missing company tool quality for tier ${tier}`);
  }
  const businessName = tradeDef(trade).name;
  const marker: CompanyToolMarker = {
    ownerId: player.id,
    businessId,
    trade,
    tier,
    quality,
  };
  const tool = new ItemStack(jobToolItem(trade, tier), 1);
  tool.nameTag = `${businessName} Company Tool`;
  tool.setLore([
    `Property of ${businessName}`,
    `Company quality ${quality} · Tier ${tier}`,
  ]);
  tool.setDynamicProperty(COMPANY_TOOL_KEY, encodeCompanyToolMarker(marker));
  const enchantable = tool.getComponent("minecraft:enchantable");
  const unbreaking = EnchantmentTypes.get("minecraft:unbreaking");
  if (enchantable && unbreaking) {
    enchantable.addEnchantment({ type: unbreaking, level: quality });
  }
  tool.keepOnDeath = true;
  tool.lockMode = ItemLockMode.inventory;
  return inv.addItem(tool) === undefined;
}

export function reclaimCompanyTools(
  player: Player,
  reason: "clockOut" | "death"
): number {
  const inv = inventory(player);
  if (!inv) return 0;
  let reclaimed = 0;
  for (let slot = 0; slot < inv.size; slot++) {
    const item = inv.getItem(slot);
    const marker = companyToolMarker(item);
    if (!shouldReclaimCompanyTool(marker, player.id, reason)) continue;
    inv.setItem(slot, undefined);
    reclaimed += 1;
  }
  return reclaimed;
}
