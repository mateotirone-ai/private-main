export interface ActionbarContext {
  key: string;
  message: string;
  priority: number;
  expiresTick?: number;
}

export function activeActionbarContext(
  contexts: readonly ActionbarContext[],
  tick: number
): ActionbarContext | undefined {
  return contexts
    .filter(
      (context) =>
        context.expiresTick === undefined || context.expiresTick > tick
    )
    .sort((a, b) => b.priority - a.priority)[0];
}

export function cashChipText(
  carriedCash: number,
  context?: string,
  danger = false
): string {
  const dangerText = danger ? " ☠" : "";
  const base = `Cash ${Math.max(0, Math.floor(carriedCash))}${dangerText}`;
  return context ? `${base} · ${context}` : base;
}

/** Layer 1 has no PvP zones; keep the input explicit for future province data. */
export function layerOneDangerState(): boolean {
  return false;
}
