/**
 * The seven pattern builders (Phase B ships P1–P4, P7).
 * ui-design-system.md §3. Confirm-first / Cancel-last. ≤8 options/page.
 */
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
  type ModalFormResponse,
} from "@minecraft/server-ui";
import type { Player } from "@minecraft/server";
import { Glyph, Ink, PAGE_SIZE, money, progressBar, titleWithGlyph } from "./theme";
import { Voice } from "./voice";
import { toast } from "./toast";

export interface HubButton {
  label: string;
  glyph?: string;
  onSelect: () => void | Promise<void>;
}

/** P1 Menu Hub — button list with glyphs. */
export async function menuHub(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    context?: string;
    buttons: HubButton[];
    page?: number;
  }
): Promise<void> {
  const page = opts.page ?? 0;
  const totalPages = Math.max(1, Math.ceil(opts.buttons.length / PAGE_SIZE));
  const slice = opts.buttons.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const form = new ActionFormData().title(titleWithGlyph(opts.glyph ?? Glyph.bank, opts.title));
  const body = [opts.context ?? "", totalPages > 1 ? `Page ${page + 1}/${totalPages}` : ""]
    .filter(Boolean)
    .join("\n");
  if (body) form.body(body);

  for (const b of slice) {
    form.button(`${b.glyph ? b.glyph + " " : ""}${b.label}`);
  }
  if (page > 0) form.button(`${Glyph.up} Previous`);
  if (page + 1 < totalPages) form.button(`${Glyph.down} Next`);
  form.button(`${Glyph.cross} Cancel`);

  const res = await form.show(player);
  if (res.canceled || res.selection === undefined) {
    toast(player, Voice.cancelled, "caution");
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
  // Cancel
  toast(player, Voice.cancelled, "caution");
}

export interface TxnLine {
  label: string;
  amount: number;
  /** loss = debit style, gain = credit style */
  sense?: "gain" | "loss" | "neutral";
}

/** P2 Transaction Confirm — itemized, balance-after, Confirm first / Cancel last. */
export async function confirmTxn(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    context: string;
    lines: TxnLine[];
    balanceBefore: number;
    balanceAfter: number;
    confirmLabel?: string;
  }
): Promise<boolean> {
  const lines = opts.lines
    .map((l) => {
      const ink = l.sense === "gain" ? Ink.gain : l.sense === "loss" ? Ink.loss : Ink.gold;
      return `${l.label}: ${ink}${money(l.amount)}${Ink.reset}`;
    })
    .join("\n");
  const body = [
    opts.context,
    "",
    lines,
    "",
    `Balance now: ${money(opts.balanceBefore)}`,
    `Balance after: ${money(opts.balanceAfter)}`,
  ].join("\n");

  const form = new MessageFormData()
    .title(titleWithGlyph(opts.glyph ?? Glyph.coin, opts.title))
    .body(body)
    .button1(opts.confirmLabel ?? `${Glyph.check} Confirm`)
    .button2(`${Glyph.cross} Cancel`);

  const res = await form.show(player);
  if (res.canceled || res.selection === undefined || res.selection === 1) {
    toast(player, Voice.cancelled, "caution");
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
  detail?: string;
  onBuy: () => void | Promise<void>;
}

/** P3 Catalog Browse — paged; selection → detail → caller runs P2. */
export async function catalog(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    context?: string;
    entries: CatalogEntry[];
    page?: number;
  }
): Promise<void> {
  const page = opts.page ?? 0;
  const totalPages = Math.max(1, Math.ceil(opts.entries.length / PAGE_SIZE));
  const slice = opts.entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const form = new ActionFormData().title(titleWithGlyph(opts.glyph ?? Glyph.deed, opts.title));
  if (opts.context) form.body(opts.context);

  for (const e of slice) {
    if (e.locked) {
      form.button(`${Glyph.lock} ${e.name} — ${money(e.price)}`);
    } else {
      form.button(`${e.glyph ? e.glyph + " " : ""}${e.name} — ${money(e.price)}`);
    }
  }
  if (page > 0) form.button(`${Glyph.up} Previous`);
  if (page + 1 < totalPages) form.button(`${Glyph.down} Next`);
  form.button(`${Glyph.cross} Back`);

  const res = await form.show(player);
  if (res.canceled || res.selection === undefined) return;

  let idx = res.selection;
  if (idx < slice.length) {
    const e = slice[idx]!;
    if (e.locked) {
      toast(player, e.lockReason ?? Voice.reserved, "caution");
      await catalog(player, opts);
      return;
    }
    if (e.detail) {
      const detail = new MessageFormData()
        .title(titleWithGlyph(e.glyph ?? Glyph.deed, e.name))
        .body(`${e.detail}\n\nPrice: ${money(e.price)}`)
        .button1(`${Glyph.check} Continue`)
        .button2(`${Glyph.cross} Back`);
      const d = await detail.show(player);
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
  /** slider */
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

/** P4 Management Panel — modal form + Save (Confirm-shaped). */
export async function managePanel(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    fields: ManageField[];
    saveLabel?: string;
  }
): Promise<ManageResult | undefined> {
  const form = new ModalFormData().title(titleWithGlyph(opts.glyph ?? Glyph.hammer, opts.title));
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

  const res = await form.show(player);
  if (res.canceled || !res.formValues) {
    toast(player, Voice.cancelled, "caution");
    return undefined;
  }
  return { values: res.formValues, raw: res };
}

export interface ProgressRow {
  label: string;
  /** 0..1 or absolute with total */
  filled?: number;
  total?: number;
  note?: string;
  ok?: boolean;
}

/** P7 Progress Panel — read-only status with bars / lock-check glyphs. */
export async function progressPanel(
  player: Player,
  opts: {
    title: string;
    glyph?: string;
    context?: string;
    rows: ProgressRow[];
    doneLabel?: string;
  }
): Promise<void> {
  const lines = opts.rows.map((r) => {
    const mark =
      r.ok === true ? Glyph.check : r.ok === false ? Glyph.lock : "";
    const bar =
      r.filled !== undefined && r.total !== undefined
        ? ` ${progressBar(r.filled, r.total)} ${r.filled}/${r.total}`
        : "";
    const note = r.note ? `\n  ${Ink.slate}${r.note}${Ink.reset}` : "";
    return `${mark ? mark + " " : ""}${r.label}${bar}${note}`;
  });
  const body = [opts.context ?? "", ...lines].filter(Boolean).join("\n");

  const form = new ActionFormData()
    .title(titleWithGlyph(opts.glyph ?? Glyph.clock, opts.title))
    .body(body)
    .button(opts.doneLabel ?? `${Glyph.check} Done`);
  await form.show(player);
}
