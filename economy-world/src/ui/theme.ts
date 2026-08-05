/**
 * Emerald Edition design tokens — ui-design-system.md §2 + ui-amendment-1.md.
 * Amendment wins on money rendering (A1.3–A1.4): no controller-glyph coin mark;
 * thousands separators; "merids" in sentences / bare numbers on balance lines.
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
  gain: "§a",
  caution: "§e",
  warning: "§6",
  loss: "§c",
  reset: "§r",
  bold: "§l",
} as const;

/**
 * Icon placeholders (A1.5) — accepted temporarily on EXISTING Phase B buttons only.
 * Do not add to new Phase C+ screen elements. PRE-LAUNCH BLOCKER until art pass.
 */
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
  barFull: "\uE00F",
  barEmpty: "\uE010",
} as const;

/** Console rule: ≤8 options per page. */
export const PAGE_SIZE = 8;

/** A1.3 — every merid amount ≥ 1,000 gets comma separators. */
export function formatAmount(amount: number): string {
  const n = Math.trunc(amount);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toString();
  const withCommas = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + withCommas;
}

/**
 * Sentence / toast money (A1.4): `5,594 merids`.
 * Never use controller glyphs as currency.
 */
export function merids(amount: number): string {
  return `${formatAmount(amount)} merids`;
}

/** Alias used across call sites for sentence money. */
export function money(amount: number): string {
  return merids(amount);
}

/** Balance / payout bare number when the label already implies merids (A1.4). */
export function bareAmount(amount: number): string {
  return formatAmount(amount);
}

export function titleWithGlyph(glyph: string | undefined, title: string): string {
  // A1.5: existing screens may still pass a placeholder glyph; new screens omit it.
  if (glyph) return `${glyph} ${Ink.emerald}${Ink.bold}${title}${Ink.reset}`;
  return `${Ink.emerald}${Ink.bold}${title}${Ink.reset}`;
}

export function progressBar(filled: number, total: number, width = 10): string {
  const t = Math.max(1, total);
  const n = Math.max(0, Math.min(width, Math.round((filled / t) * width)));
  return Glyph.barFull.repeat(n) + Glyph.barEmpty.repeat(width - n);
}

/**
 * A1.1 + A1.2 body builder: stacked facts, then blank line, then quoted narrator.
 */
export function bodyWithNarrator(facts: string[], narrator?: string): string {
  const data = facts.filter((f) => f.length > 0);
  if (!narrator) return data.join("\n");
  return [...data, "", `"${narrator}"`].join("\n");
}
