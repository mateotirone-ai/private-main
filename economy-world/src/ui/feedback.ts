/**
 * Context-aware feedback rail.
 * NPC interactions speak in name-tagged chat; non-NPC/system flows use toasts.
 */
import type { Player } from "@minecraft/server";
import { toast, type ToastKind } from "./toast";

interface SpeakerContext {
  name: string;
}

const speakers = new Map<string, SpeakerContext>();

export async function withNpcSpeaker<T>(
  player: Player,
  name: string,
  action: () => Promise<T>
): Promise<T> {
  const previous = speakers.get(player.id);
  speakers.set(player.id, { name });
  try {
    return await action();
  } finally {
    if (previous) speakers.set(player.id, previous);
    else speakers.delete(player.id);
  }
}

export function npcSpeechLine(name: string, message: string): string {
  return `§6[${name}]§r ${message}`;
}

export function speakAs(player: Player, name: string, message: string): void {
  player.sendMessage(npcSpeechLine(name, message));
}

export function feedback(
  player: Player,
  message: string,
  kind: ToastKind = "info"
): void {
  const speaker = speakers.get(player.id);
  if (speaker) {
    speakAs(player, speaker.name, message);
    return;
  }
  toast(player, message, kind);
}

export function clearSpeakerContext(playerId: string): void {
  speakers.delete(playerId);
}
