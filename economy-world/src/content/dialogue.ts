import raw from "../../data/dialogue.json";

export interface DialogueConfig {
  fallbackPersonality: string;
  rolePools: Record<string, string>;
  personalities: Record<string, Record<string, string[]>>;
}

export const dialogueConfig = raw as unknown as DialogueConfig;
