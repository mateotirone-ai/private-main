import { loadBlob, saveBlob } from "../core/state";
import { dialogueConfig } from "../content/dialogue";
import { matrix } from "../content/matrix";
import {
  dialogueTemplate,
  personalityFromTags,
  renderDialogueTemplate,
  type DialogueSlots,
} from "./dialogueMath";

export interface DialogueEvent {
  kind: string;
  summary: string;
  tick: number;
  trade?: string;
}

export interface DialogueState {
  schema: 1;
  recent: DialogueEvent[];
}

const KEY = "ew:dialogue";
let activeState: DialogueState | undefined;

export function emptyDialogue(): DialogueState {
  return { schema: 1, recent: [] };
}

export function loadDialogue(): DialogueState {
  const state = loadBlob<DialogueState>(KEY);
  return state?.schema === 1 ? state : emptyDialogue();
}

export function bindDialogueState(state: DialogueState): void {
  activeState = state;
}

export function saveDialogue(state: DialogueState): void {
  saveBlob(KEY, state);
}

export function noteDialogueEvent(event: DialogueEvent): void {
  if (!activeState) return;
  activeState.recent.push(event);
  const cap = matrix.dialogue.recentEventCap;
  if (activeState.recent.length > cap) {
    activeState.recent.splice(0, activeState.recent.length - cap);
  }
  saveDialogue(activeState);
}

export function latestDialogueEvent(
  state: DialogueState,
  trade?: string
): DialogueEvent | undefined {
  for (let i = state.recent.length - 1; i >= 0; i--) {
    const event = state.recent[i]!;
    if (!trade || !event.trade || event.trade === trade) return event;
  }
  return state.recent.at(-1);
}

export function npcDialogueLine(
  state: DialogueState,
  role: string,
  tags: readonly string[],
  slots: Omit<DialogueSlots, "recentEvent"> & { recentEvent?: string },
  trade?: string,
  rng: () => number = Math.random
): string {
  const personality = personalityFromTags(tags, dialogueConfig);
  const template = dialogueTemplate(dialogueConfig, role, personality, rng);
  const recentEvent =
    slots.recentEvent ??
    latestDialogueEvent(state, trade)?.summary ??
    "business continues";
  return renderDialogueTemplate(template, { ...slots, recentEvent });
}
