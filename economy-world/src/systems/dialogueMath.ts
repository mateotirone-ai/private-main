import type { DialogueConfig } from "../content/dialogue";

export interface DialogueSlots {
  good: string;
  price: string;
  playerName: string;
  ownerName: string;
  stock: string;
  recentEvent: string;
}

export function personalityFromTags(
  tags: readonly string[],
  config: DialogueConfig
): string {
  const tagged = tags
    .find((tag) => tag.startsWith("ew:personality_"))
    ?.slice("ew:personality_".length);
  return tagged && config.personalities[tagged]
    ? tagged
    : config.fallbackPersonality;
}

export function renderDialogueTemplate(
  template: string,
  slots: DialogueSlots
): string {
  return template.replace(
    /\{(good|price|playerName|ownerName|stock|recentEvent)\}/g,
    (_, key: keyof DialogueSlots) => slots[key] || "unknown"
  );
}

export function dialogueTemplate(
  config: DialogueConfig,
  role: string,
  personality: string,
  rng: () => number = Math.random
): string {
  const poolName = config.rolePools[role] ?? "civic";
  const pools =
    config.personalities[personality] ??
    config.personalities[config.fallbackPersonality];
  const pool =
    pools?.[poolName] ??
    config.personalities[config.fallbackPersonality]?.[poolName] ??
    [];
  if (!pool.length) return "The town is still finding its words.";
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]!;
}
