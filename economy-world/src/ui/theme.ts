/**
 * Emerald Edition design tokens — ui-design-system.md §2.
 * Hex for JSON-UI / handbook; § codes for form/actionbar text.
 * Glyphs are PUA codepoints; RP font/ wiring lands when the glyph atlas ships.
 */

export const Hex = {
  emerald: "#1E8E4E",
  deepEmerald: "#146639",
  gold: "#E8A81C",
  slate: "#2B2B2B",
  paper: "#F7F3E8",
  signalRed: "#B23B3B",
  signalBlue: "#3B6FB2",
} as const;

/** Bedrock § color codes mapped to Emerald status meanings. */
export const Ink = {
  emerald: "§2",
  deepEmerald: "§2",
  gold: "§6",
  slate: "§8",
  paper: "§f",
  signalRed: "§c",
  signalBlue: "§9",
  /** status: green = open/positive/gain */
  gain: "§a",
  /** status: yellow = toll/caution/pending */
  caution: "§e",
  /** status: orange = closed/warning */
  warning: "§6",
  /** status: red = hostile/danger/loss */
  loss: "§c",
  reset: "§r",
  bold: "§l",
} as const;

/** Custom font glyphs (ui-design-system.md §2). Wired when RP font ships. */
export const Glyph = {
  coin: "\uE000",
  bank: "\uE001",
  deed: "\uE002",
  crest: "\uE003",
  contract: "\uE004",
  toll: "\uE005",
  skull: "\uE006",
  bounty: "\uE007",
  lock: "\uE008",
  check: "\uE009",
  cross: "\uE00A",
  up: "\uE00B",
  down: "\uE00C",
  clock: "\uE00D",
  hammer: "\uE00E",
  /** filled / empty blocks for P7 progress bars */
  barFull: "\uE00F",
  barEmpty: "\uE010",
} as const;

/** Console rule: ≤8 options per page. */
export const PAGE_SIZE = 8;

/** Money is always glyphed (UI law §7). */
export function money(amount: number): string {
  return `${Ink.gold}${Glyph.coin}${Ink.reset} ${amount}`;
}

export function titleWithGlyph(glyph: string, title: string): string {
  return `${glyph} ${Ink.emerald}${Ink.bold}${title}${Ink.reset}`;
}

export function progressBar(filled: number, total: number, width = 10): string {
  const t = Math.max(1, total);
  const n = Math.max(0, Math.min(width, Math.round((filled / t) * width)));
  return Glyph.barFull.repeat(n) + Glyph.barEmpty.repeat(width - n);
}
