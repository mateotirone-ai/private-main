/**
 * The seven pattern builders (P1–P4, P7 for L1).
 * ui-design-system.md §3 + ui-amendment-1.md A1.1–A1.4.
 * Confirm-first / Cancel-last. ≤8 options/page.
 */
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
  type ModalFormResponse,
} from "@minecraft/server-ui";
import type { Player } from "@minecraft/server";
import {
  Glyph,
  Ink,
  PAGE_SIZE,
  bareAmount,
  bodyWithNarrator,
  merids,
  progressBar,
  titleWithGlyph,
} from "./theme";
import { Voice } from "./voice";
import { feedback } from "./feedback";
import { safeShow } from "./safeShow";

export interface HubButton {
  label: string;
  /** A1.5: only on pre-existing Phase B buttons — omit on new screens. */
  glyph?: string;
  onSelect: () => void | Promise<void>;
}

/** P1 Menu Hub — button list. Data facts first; narrator last (A1.2). */
export async function menuHub(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    /** One-fact-per-line data (A1.1). */
    facts?: string[];
    narrator?: string;
    buttons: HubButton[];
    page?: number;
  }
): Promise<void> {
  const page = opts.page ?? 0;
  const totalPages = Math.max(1, Math.ceil(opts.buttons.length / PAGE_SIZE));
  const slice = opts.buttons.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const form = new ActionFormData().title(titleWithGlyph(opts.glyph, opts.title));
  const facts = [...(opts.facts ?? [])];
  if (totalPages > 1) facts.push(`Page ${page + 1}/${totalPages}`);
  const body = bodyWithNarrator(facts, opts.narrator);
  if (body) form.body(body);

  for (const b of slice) {
    form.button(`${b.glyph ? b.glyph + " " : ""}${b.label}`);
  }
  if (page > 0) form.button(`${Glyph.up} Previous`);
  if (page + 1 < totalPages) form.button(`${Glyph.down} Next`);
  form.button(`${Glyph.cross} Cancel`);

  const res = await safeShow(player, form);
  if (res.canceled || res.selection === undefined) {
    return;
  }

  let idx = res.selection;
  if (idx < slice.length) {
    await slice[idx]!.onSelect();
    return;
  }
  idx -= slice.length;
  if (page > 0) {
    if (idx === 0) {
      await menuHub(player, { ...opts, page: page - 1 });
      return;
    }
    idx -= 1;
  }
  if (page + 1 < totalPages) {
    if (idx === 0) {
      await menuHub(player, { ...opts, page: page + 1 });
      return;
    }
    idx -= 1;
  }
  // Explicit Cancel is intentionally silent.
}

export interface TxnLine {
  label: string;
  amount: number;
  sense?: "gain" | "loss" | "neutral";
}

/** P2 Transaction Confirm — A1.1 facts, A1.2 narrator last, A1.3/A1.4 amounts. */
export async function confirmTxn(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    /** Stacked plain facts (no inline math). */
    facts: string[];
    lines: TxnLine[];
    balanceBefore: number;
    balanceAfter: number;
    narrator?: string;
    confirmLabel?: string;
  }
): Promise<boolean> {
  const lineFacts = opts.lines.map((l) => {
    const ink = l.sense === "gain" ? Ink.gain : l.sense === "loss" ? Ink.loss : Ink.gold;
    return `${l.label}: ${ink}${merids(l.amount)}${Ink.reset}`;
  });
  const facts = [
    ...opts.facts,
    ...lineFacts,
    `Balance now: ${bareAmount(opts.balanceBefore)}`,
    `Balance after: ${bareAmount(opts.balanceAfter)}`,
  ];
  const body = bodyWithNarrator(facts, opts.narrator);

  const form = new MessageFormData()
    .title(titleWithGlyph(opts.glyph, opts.title))
    .body(body)
    .button1(opts.confirmLabel ?? `${Glyph.check} Confirm`)
    .button2(`${Glyph.cross} Cancel`);

  const res = await safeShow(player, form);
  if (res.canceled || res.selection === undefined || res.selection === 1) {
    return false;
  }
  return true;
}

export interface CatalogEntry {
  name: string;
  price: number;
  glyph?: string;
  locked?: boolean;
  lockReason?: string;
  detailFacts?: string[];
  detailNarrator?: string;
  onBuy: () => void | Promise<void>;
}

/** P3 Catalog Browse — button labels use bare/comma amounts (A1.3/A1.4). */
export async function catalog(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    facts?: string[];
    narrator?: string;
    entries: CatalogEntry[];
    page?: number;
  }
): Promise<void> {
  const page = opts.page ?? 0;
  const totalPages = Math.max(1, Math.ceil(opts.entries.length / PAGE_SIZE));
  const slice = opts.entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const form = new ActionFormData().title(titleWithGlyph(opts.glyph, opts.title));
  const facts = [...(opts.facts ?? [])];
  if (totalPages > 1) facts.push(`Page ${page + 1}/${totalPages}`);
  const body = bodyWithNarrator(facts, opts.narrator);
  if (body) form.body(body);

  for (const e of slice) {
    const price = bareAmount(e.price);
    if (e.locked) {
      form.button(`${Glyph.lock} ${e.name} — ${price}`);
    } else {
      form.button(`${e.glyph ? e.glyph + " " : ""}${e.name} — ${price}`);
    }
  }
  if (page > 0) form.button(`${Glyph.up} Previous`);
  if (page + 1 < totalPages) form.button(`${Glyph.down} Next`);
  form.button(`${Glyph.cross} Back`);

  const res = await safeShow(player, form);
  if (res.canceled || res.selection === undefined) return;

  let idx = res.selection;
  if (idx < slice.length) {
    const e = slice[idx]!;
    if (e.locked) {
      feedback(player, e.lockReason ?? Voice.reserved, "caution");
      await catalog(player, opts);
      return;
    }
    if (e.detailFacts?.length) {
      const detail = new MessageFormData()
        .title(titleWithGlyph(e.glyph, e.name))
        .body(
          bodyWithNarrator(
            [...e.detailFacts, `Price: ${merids(e.price)}`],
            e.detailNarrator
          )
        )
        .button1(`${Glyph.check} Continue`)
        .button2(`${Glyph.cross} Back`);
      const d = await safeShow(player, detail);
      if (d.canceled || d.selection !== 0) {
        await catalog(player, opts);
        return;
      }
    }
    await e.onBuy();
    return;
  }
  idx -= slice.length;
  if (page > 0) {
    if (idx === 0) {
      await catalog(player, { ...opts, page: page - 1 });
      return;
    }
    idx -= 1;
  }
  if (page + 1 < totalPages) {
    if (idx === 0) {
      await catalog(player, { ...opts, page: page + 1 });
      return;
    }
  }
}

export interface ManageField {
  type: "toggle" | "slider" | "dropdown" | "text";
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | boolean | string;
  options?: string[];
  defaultIndex?: number;
  defaultText?: string;
}

export interface ManageResult {
  values: (string | number | boolean | undefined)[];
  raw: ModalFormResponse;
}

/** P4 Management Panel. */
export async function managePanel(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    fields: ManageField[];
    saveLabel?: string;
  }
): Promise<ManageResult | undefined> {
  const form = new ModalFormData().title(titleWithGlyph(opts.glyph, opts.title));
  for (const f of opts.fields) {
    if (f.type === "toggle") {
      form.toggle(f.label, { defaultValue: Boolean(f.defaultValue) });
    } else if (f.type === "slider") {
      form.slider(f.label, f.min ?? 0, f.max ?? 100, {
        valueStep: f.step ?? 1,
        defaultValue: typeof f.defaultValue === "number" ? f.defaultValue : f.min ?? 0,
      });
    } else if (f.type === "dropdown") {
      form.dropdown(f.label, f.options ?? [], { defaultValueIndex: f.defaultIndex ?? 0 });
    } else {
      form.textField(f.label, f.defaultText ?? "", { defaultValue: String(f.defaultValue ?? "") });
    }
  }
  form.submitButton(opts.saveLabel ?? `${Glyph.check} Continue`);

  const res = await safeShow(player, form);
  if (res.canceled || !res.formValues) {
    return undefined;
  }
  return { values: res.formValues, raw: res };
}

export interface ProgressRow {
  label: string;
  filled?: number;
  total?: number;
  note?: string;
  ok?: boolean;
}

/** P7 Progress Panel — facts first, narrator last. */
export async function progressPanel(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    facts?: string[];
    narrator?: string;
    rows: ProgressRow[];
    doneLabel?: string;
  }
): Promise<void> {
  const rowLines = opts.rows.map((r) => {
    const mark = r.ok === true ? Glyph.check : r.ok === false ? Glyph.lock : "";
    const bar =
      r.filled !== undefined && r.total !== undefined
        ? ` ${progressBar(r.filled, r.total)} ${r.filled}/${r.total}`
        : "";
    const note = r.note ? `\n  ${Ink.slate}${r.note}${Ink.reset}` : "";
    return `${mark ? mark + " " : ""}${r.label}${bar}${note}`;
  });
  const body = bodyWithNarrator([...(opts.facts ?? []), ...rowLines], opts.narrator);

  const form = new ActionFormData()
    .title(titleWithGlyph(opts.glyph, opts.title))
    .body(body)
    .button(opts.doneLabel ?? `${Glyph.check} Done`);
  await safeShow(player, form);
}
