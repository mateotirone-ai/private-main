// src/main.ts
import { world as world3, system as system2 } from "@minecraft/server";

// src/core/ledger.ts
var JOURNAL_CAP = 512;
var LedgerError = class extends Error {
};
function emptyLedger() {
  return {
    schema: 1,
    seq: 0,
    balances: {},
    totalMinted: 0,
    totalSunk: 0,
    cashOutstanding: 0,
    journal: []
  };
}
function assertAmount(amount) {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new LedgerError(`invalid amount: ${amount} (merids are positive integers)`);
  }
}
function credit(s, acct, amount) {
  s.balances[acct] = (s.balances[acct] ?? 0) + amount;
}
function debit(s, acct, amount) {
  const bal = s.balances[acct] ?? 0;
  if (bal < amount) throw new LedgerError(`insufficient funds: ${acct} has ${bal}, needs ${amount}`);
  s.balances[acct] = bal - amount;
}
function journal(s, e) {
  s.seq += 1;
  s.journal.push({ seq: s.seq, ...e });
  if (s.journal.length > JOURNAL_CAP) s.journal.shift();
}
function transfer(s, from, to, amount, tick, tag) {
  assertAmount(amount);
  if (from === to) throw new LedgerError("transfer to self");
  debit(s, from, amount);
  credit(s, to, amount);
  journal(s, { tick, kind: "transfer", from, to, amount, tag });
}
function mint(s, to, amount, tick, tag) {
  assertAmount(amount);
  credit(s, to, amount);
  s.totalMinted += amount;
  journal(s, { tick, kind: "mint", to, amount, tag });
}
function sink(s, from, amount, tick, tag) {
  assertAmount(amount);
  debit(s, from, amount);
  s.totalSunk += amount;
  journal(s, { tick, kind: "sink", from, amount, tag });
}
function cashOut(s, acct, amount, tick) {
  assertAmount(amount);
  debit(s, acct, amount);
  s.cashOutstanding += amount;
  journal(s, { tick, kind: "cashOut", from: acct, amount });
}
function cashIn(s, acct, amount, tick) {
  assertAmount(amount);
  if (s.cashOutstanding < amount) {
    throw new LedgerError(`cashIn exceeds cashOutstanding (${amount} > ${s.cashOutstanding}) \u2014 counterfeit?`);
  }
  s.cashOutstanding -= amount;
  credit(s, acct, amount);
  journal(s, { tick, kind: "cashIn", to: acct, amount });
}
function audit(s) {
  let sum = 0;
  for (const k in s.balances) sum += s.balances[k] ?? 0;
  const actual = sum + s.cashOutstanding;
  const expected = s.totalMinted - s.totalSunk;
  return { ok: actual === expected, expected, actual, drift: actual - expected };
}
function balance(s, acct) {
  return s.balances[acct] ?? 0;
}

// src/core/state.ts
import { world } from "@minecraft/server";
var CHUNK = 3e4;
function saveBlob(key, value) {
  const json = JSON.stringify(value);
  const parts = Math.ceil(json.length / CHUNK) || 1;
  world.setDynamicProperty(`${key}:n`, parts);
  for (let i = 0; i < parts; i++) {
    world.setDynamicProperty(`${key}:${i}`, json.slice(i * CHUNK, (i + 1) * CHUNK));
  }
}
function loadBlob(key) {
  const parts = world.getDynamicProperty(`${key}:n`);
  if (typeof parts !== "number") return void 0;
  let json = "";
  for (let i = 0; i < parts; i++) {
    const p = world.getDynamicProperty(`${key}:${i}`);
    if (typeof p !== "string") return void 0;
    json += p;
  }
  return JSON.parse(json);
}

// src/core/scheduler.ts
import { system } from "@minecraft/server";
var jobs = [];
var tickCount = 0;
function every(name, everyTicks, fn) {
  jobs.push({ name, every: everyTicks, fn, last: 0 });
}
function startScheduler() {
  system.runInterval(() => {
    tickCount += 1;
    for (const j of jobs) {
      if (tickCount - j.last >= j.every) {
        j.last = tickCount;
        try {
          j.fn(tickCount);
        } catch (e) {
          console.error(`[ew] job ${j.name} failed: ${e}`);
        }
      }
    }
  }, 1);
}
function currentTick() {
  return tickCount;
}

// src/systems/bank.ts
import { world as world2 } from "@minecraft/server";

// data/matrix.json
var matrix_default = {
  _comment: "TIER & COST MATRIX - every number here is a PLACEHOLDER flagged for playtest tuning.",
  stipend: 250,
  medical: { flat: 100, pctOfWealth: 0.02 },
  freelanceRate: 0.45,
  wagePerHourByTier: { "1": 60, "2": 90 },
  bank: {
    _comment: "\u2691 transferFee \u2014 master doc \xA713 lists transfer fee as playtest tuning; 'tiny flat fee'.",
    transferFee: 5
  },
  cash: {
    _comment: "Denominations locked by layer1-technical-spec.md \xA73 (ew:cash_1/10/100/1000).",
    denominations: [1e3, 100, 10, 1]
  },
  dealer: {
    _comment: "\u2691 daily capacity + softFloor \u2014 master doc locks 'price softens with volume' but gives no numbers. Linear soften: mult = 1 - min(1, soldToday/capacity) * (1 - softFloor).",
    dailyCapacity: {
      gold: 64,
      diamond: 16
    },
    softFloor: 0.5
  },
  trades: {
    stone_quarry: { buyout: 2500, t2: { price: 5e3, buildMins: 30, requiresProduced: 5e3 } },
    ore_mine: { buyout: 4e3, t2: { price: 8e3, buildMins: 45, requiresProduced: 4e3 } },
    precious_mine: { buyout: 15e3, t2: { price: 25e3, buildMins: 90, requiresProduced: 500 } },
    lumber_camp: { buyout: 2500, t2: { price: 5e3, buildMins: 30, requiresProduced: 5e3 } },
    crop_farm: { buyout: 2e3, t2: { price: 4e3, buildMins: 25, requiresProduced: 6e3 } },
    sawmill: { buyout: 3500, t2: { price: 7e3, buildMins: 40, requiresProduced: 3e3 } },
    smeltery: { buyout: 4500, t2: { price: 9e3, buildMins: 50, requiresProduced: 2500 } },
    bakery: { buyout: 3e3, t2: { price: 6e3, buildMins: 35, requiresProduced: 3e3 } },
    general_store: { buyout: 5e3, t2: { price: 1e4, buildMins: 45, requiresProduced: 0 } }
  }
};

// src/content/matrix.ts
var matrix = matrix_default;
function transferFee() {
  return matrix.bank.transferFee;
}
function cashDenominations() {
  return matrix.cash.denominations;
}
function dealerCapacity(good) {
  return matrix.dealer.dailyCapacity[good];
}
function dealerSoftFloor() {
  return matrix.dealer.softFloor;
}
function stipendAmount() {
  return matrix.stipend;
}

// src/ui/theme.ts
var Ink = {
  emerald: "\xA72",
  deepEmerald: "\xA72",
  gold: "\xA76",
  slate: "\xA78",
  paper: "\xA7f",
  signalRed: "\xA7c",
  signalBlue: "\xA79",
  /** status: green = open/positive/gain */
  gain: "\xA7a",
  /** status: yellow = toll/caution/pending */
  caution: "\xA7e",
  /** status: orange = closed/warning */
  warning: "\xA76",
  /** status: red = hostile/danger/loss */
  loss: "\xA7c",
  reset: "\xA7r",
  bold: "\xA7l"
};
var Glyph = {
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
  barEmpty: "\uE010"
};
var PAGE_SIZE = 8;
function money(amount) {
  return `${Ink.gold}${Glyph.coin}${Ink.reset} ${amount}`;
}
function titleWithGlyph(glyph, title) {
  return `${glyph} ${Ink.emerald}${Ink.bold}${title}${Ink.reset}`;
}
function progressBar(filled, total, width = 10) {
  const t = Math.max(1, total);
  const n = Math.max(0, Math.min(width, Math.round(filled / t * width)));
  return Glyph.barFull.repeat(n) + Glyph.barEmpty.repeat(width - n);
}

// src/ui/voice.ts
var Voice = {
  // bank
  bankWelcome: "Meridian Central Bank. Your money is safe. Your pockets are not.",
  depositOk: (n) => `Deposited ${n}. Pockets lighter. Civilization heavier.`,
  depositEmpty: "Nothing to deposit. The ledger declines empty gestures.",
  withdrawOk: (n) => `Withdrawn ${n}. Try not to die with it.`,
  withdrawFail: "Insufficient balance. The vault is not a suggestion box.",
  transferOk: (n, to) => `Transferred ${n} to ${to}. Traceable. Regrettably civilized.`,
  transferFailFunds: "Balance insufficient for the amount plus the transfer fee.",
  transferFailSelf: "You already have that money. The fee would be comedy.",
  transferFailTarget: "Recipient not found. Online players only \u2014 for now.",
  transferNoPlayers: "No one else is online. Cash hand-offs remain an option.",
  statementEmpty: "No recent activity. Either thrift or a very new account.",
  feeLine: (fee) => `Flat transfer fee: ${fee}`,
  // dealer
  dealerWelcome: "Assay window. Gold and diamonds become merids. Everything else is scenery.",
  dealerSold: (good, qty, n) => `Assayed ${qty} ${good}. Issued ${n}. Fort Knox sends its regards.`,
  dealerEmpty: (good) => `No ${good} on you. The window does not accept vibes.`,
  dealerSoft: "Volume is noted. Today's price has\u2026 adjusted.",
  pricesBoard: "Today's mint window. Softened by volume. Published because secrets are for bandits.",
  // stipend
  stipendOk: (n) => `Resettlement grant: ${n}. One mistake's worth. Spend wisely.`,
  stipendAlready: "Stipend already claimed. Meridian remembers.",
  // generic
  cancelled: "Declined. The Federation remains unimpressed, but polite.",
  error: "That didn't work. Anomaly logged. Smile for the audit.",
  reserved: "Reserved for future expansion. Please admire the empty lot."
};

// src/ui/toast.ts
var KIND_INK = {
  gain: Ink.gain,
  loss: Ink.loss,
  caution: Ink.caution,
  info: Ink.signalBlue,
  error: Ink.signalRed
};
function toast(player, message, kind = "info") {
  const color = KIND_INK[kind];
  player.onScreenDisplay.setTitle(`${color}${message}${Ink.reset}`, {
    fadeInDuration: 5,
    stayDuration: 40,
    fadeOutDuration: 10
  });
}

// src/ui/patterns.ts
import {
  ActionFormData,
  MessageFormData,
  ModalFormData
} from "@minecraft/server-ui";
async function menuHub(player, opts) {
  const page = opts.page ?? 0;
  const totalPages = Math.max(1, Math.ceil(opts.buttons.length / PAGE_SIZE));
  const slice = opts.buttons.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const form = new ActionFormData().title(titleWithGlyph(opts.glyph ?? Glyph.bank, opts.title));
  const body = [opts.context ?? "", totalPages > 1 ? `Page ${page + 1}/${totalPages}` : ""].filter(Boolean).join("\n");
  if (body) form.body(body);
  for (const b of slice) {
    form.button(`${b.glyph ? b.glyph + " " : ""}${b.label}`);
  }
  if (page > 0) form.button(`${Glyph.up} Previous`);
  if (page + 1 < totalPages) form.button(`${Glyph.down} Next`);
  form.button(`${Glyph.cross} Cancel`);
  const res = await form.show(player);
  if (res.canceled || res.selection === void 0) {
    toast(player, Voice.cancelled, "caution");
    return;
  }
  let idx = res.selection;
  if (idx < slice.length) {
    await slice[idx].onSelect();
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
  toast(player, Voice.cancelled, "caution");
}
async function confirmTxn(player, opts) {
  const lines = opts.lines.map((l) => {
    const ink = l.sense === "gain" ? Ink.gain : l.sense === "loss" ? Ink.loss : Ink.gold;
    return `${l.label}: ${ink}${money(l.amount)}${Ink.reset}`;
  }).join("\n");
  const body = [
    opts.context,
    "",
    lines,
    "",
    `Balance now: ${money(opts.balanceBefore)}`,
    `Balance after: ${money(opts.balanceAfter)}`
  ].join("\n");
  const form = new MessageFormData().title(titleWithGlyph(opts.glyph ?? Glyph.coin, opts.title)).body(body).button1(opts.confirmLabel ?? `${Glyph.check} Confirm`).button2(`${Glyph.cross} Cancel`);
  const res = await form.show(player);
  if (res.canceled || res.selection === void 0 || res.selection === 1) {
    toast(player, Voice.cancelled, "caution");
    return false;
  }
  return true;
}
async function managePanel(player, opts) {
  const form = new ModalFormData().title(titleWithGlyph(opts.glyph ?? Glyph.hammer, opts.title));
  for (const f of opts.fields) {
    if (f.type === "toggle") {
      form.toggle(f.label, { defaultValue: Boolean(f.defaultValue) });
    } else if (f.type === "slider") {
      form.slider(f.label, f.min ?? 0, f.max ?? 100, {
        valueStep: f.step ?? 1,
        defaultValue: typeof f.defaultValue === "number" ? f.defaultValue : f.min ?? 0
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
    return void 0;
  }
  return { values: res.formValues, raw: res };
}
async function progressPanel(player, opts) {
  const lines = opts.rows.map((r) => {
    const mark = r.ok === true ? Glyph.check : r.ok === false ? Glyph.lock : "";
    const bar = r.filled !== void 0 && r.total !== void 0 ? ` ${progressBar(r.filled, r.total)} ${r.filled}/${r.total}` : "";
    const note = r.note ? `
  ${Ink.slate}${r.note}${Ink.reset}` : "";
    return `${mark ? mark + " " : ""}${r.label}${bar}${note}`;
  });
  const body = [opts.context ?? "", ...lines].filter(Boolean).join("\n");
  const form = new ActionFormData().title(titleWithGlyph(opts.glyph ?? Glyph.clock, opts.title)).body(body).button(opts.doneLabel ?? `${Glyph.check} Done`);
  await form.show(player);
}

// src/systems/bankMath.ts
function planTransfer(amount, fee) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`invalid transfer amount: ${amount}`);
  }
  if (!Number.isInteger(fee) || fee < 0) {
    throw new Error(`invalid transfer fee: ${fee}`);
  }
  return { amount, fee, totalDebit: amount + fee };
}
function canAffordTransfer(balance2, amount, fee) {
  return balance2 >= planTransfer(amount, fee).totalDebit;
}
function breakIntoCash(amount, denominations) {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`invalid cash amount: ${amount}`);
  }
  let left = amount;
  const out = [];
  const sorted = [...denominations].sort((a, b) => b - a);
  for (const d of sorted) {
    if (d <= 0 || !Number.isInteger(d)) throw new Error(`bad denomination: ${d}`);
    const count = Math.floor(left / d);
    if (count > 0) {
      out.push({ denom: d, count });
      left -= count * d;
    }
  }
  if (left !== 0) throw new Error(`cannot make exact change for ${amount} with ${denominations}`);
  return out;
}
function sumCash(stacks) {
  let n = 0;
  for (const s of stacks) n += s.denom * s.count;
  return n;
}

// src/systems/cash.ts
import { ItemStack } from "@minecraft/server";
function cashItemId(denom) {
  return `ew:cash_${denom}`;
}
function parseCashDenom(typeId) {
  const m = /^ew:cash_(\d+)$/.exec(typeId);
  if (!m) return void 0;
  return Number(m[1]);
}
function countCashInInventory(player) {
  const inv = player.getComponent("inventory")?.container;
  const stacks = [];
  if (!inv) return { total: 0, stacks };
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (!item) continue;
    const denom = parseCashDenom(item.typeId);
    if (denom === void 0) continue;
    stacks.push({ denom, count: item.amount, slot: i });
  }
  return { total: sumCash(stacks), stacks };
}
function takeAllCash(player) {
  const { total, stacks } = countCashInInventory(player);
  const inv = player.getComponent("inventory")?.container;
  if (!inv) return 0;
  for (const s of stacks) {
    inv.setItem(s.slot, void 0);
  }
  return total;
}
function spawnCash(player, amount) {
  const parts = breakIntoCash(amount, cashDenominations());
  const inv = player.getComponent("inventory")?.container;
  if (!inv) throw new Error("no inventory");
  for (const p of parts) {
    let left = p.count;
    while (left > 0) {
      const n = Math.min(64, left);
      const stack = new ItemStack(cashItemId(p.denom), n);
      const leftover = inv.addItem(stack);
      if (leftover) {
        const dim = player.dimension;
        dim.spawnItem(leftover, player.location);
      }
      left -= n;
    }
  }
}
function countItem(player, typeId) {
  const inv = player.getComponent("inventory")?.container;
  if (!inv) return 0;
  let n = 0;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item?.typeId === typeId) n += item.amount;
  }
  return n;
}
function takeItems(player, typeId, qty) {
  const inv = player.getComponent("inventory")?.container;
  if (!inv) return 0;
  let left = qty;
  for (let i = 0; i < inv.size && left > 0; i++) {
    const item = inv.getItem(i);
    if (!item || item.typeId !== typeId) continue;
    if (item.amount <= left) {
      left -= item.amount;
      inv.setItem(i, void 0);
    } else {
      item.amount -= left;
      inv.setItem(i, item);
      left = 0;
    }
  }
  return qty - left;
}

// src/systems/bank.ts
function playerAccount(player) {
  return `p:${player.id}`;
}
async function openBank(player, ledger2) {
  const acct = playerAccount(player);
  const bal = balance(ledger2, acct);
  await menuHub(player, {
    title: "Central Bank",
    glyph: Glyph.bank,
    context: `${Voice.bankWelcome}
Balance: ${money(bal)}`,
    buttons: [
      { label: "Deposit cash", glyph: Glyph.down, onSelect: () => depositFlow(player, ledger2) },
      { label: "Withdraw cash", glyph: Glyph.up, onSelect: () => withdrawFlow(player, ledger2) },
      { label: "Transfer", glyph: Glyph.contract, onSelect: () => transferFlow(player, ledger2) },
      { label: "Statements", glyph: Glyph.clock, onSelect: () => statementsFlow(player, ledger2) }
    ]
  });
}
async function depositFlow(player, ledger2) {
  const acct = playerAccount(player);
  const { total } = countCashInInventory(player);
  if (total <= 0) {
    toast(player, Voice.depositEmpty, "caution");
    return;
  }
  const before = balance(ledger2, acct);
  const ok = await confirmTxn(player, {
    title: "Deposit",
    glyph: Glyph.bank,
    context: "Convert physical cash into your bank balance.",
    lines: [{ label: "Deposit", amount: total, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + total
  });
  if (!ok) return;
  try {
    const taken = takeAllCash(player);
    if (taken <= 0) {
      toast(player, Voice.depositEmpty, "caution");
      return;
    }
    cashIn(ledger2, acct, taken, currentTick());
    toast(player, Voice.depositOk(money(taken)), "gain");
  } catch (e) {
    console.error(`[ew] deposit failed: ${e}`);
    toast(player, Voice.error, "error");
  }
}
async function withdrawFlow(player, ledger2) {
  const acct = playerAccount(player);
  const before = balance(ledger2, acct);
  if (before <= 0) {
    toast(player, Voice.withdrawFail, "error");
    return;
  }
  const panel = await managePanel(player, {
    title: "Withdraw",
    glyph: Glyph.bank,
    fields: [
      {
        type: "slider",
        label: `Amount (max ${before})`,
        min: 1,
        max: before,
        step: 1,
        defaultValue: Math.min(before, 100)
      }
    ]
  });
  if (!panel) return;
  const amount = Math.floor(Number(panel.values[0]));
  if (!Number.isFinite(amount) || amount <= 0 || amount > before) {
    toast(player, Voice.withdrawFail, "error");
    return;
  }
  const ok = await confirmTxn(player, {
    title: "Withdraw",
    glyph: Glyph.bank,
    context: "Cash leaves the vault. It can die with you.",
    lines: [{ label: "Withdraw", amount, sense: "loss" }],
    balanceBefore: before,
    balanceAfter: before - amount
  });
  if (!ok) return;
  try {
    cashOut(ledger2, acct, amount, currentTick());
    spawnCash(player, amount);
    toast(player, Voice.withdrawOk(money(amount)), "caution");
  } catch (e) {
    if (e instanceof LedgerError) toast(player, Voice.withdrawFail, "error");
    else {
      console.error(`[ew] withdraw failed: ${e}`);
      toast(player, Voice.error, "error");
    }
  }
}
async function transferFlow(player, ledger2) {
  const acct = playerAccount(player);
  const before = balance(ledger2, acct);
  const fee = transferFee();
  const others = world2.getAllPlayers().filter((p) => p.id !== player.id);
  if (others.length === 0) {
    toast(player, Voice.transferNoPlayers, "caution");
    return;
  }
  if (before <= fee) {
    toast(player, Voice.transferFailFunds, "error");
    return;
  }
  const maxSend = before - fee;
  const panel = await managePanel(player, {
    title: "Transfer",
    glyph: Glyph.contract,
    fields: [
      {
        type: "dropdown",
        label: "Recipient",
        options: others.map((p) => p.name),
        defaultIndex: 0
      },
      {
        type: "slider",
        label: `Amount (fee ${fee} extra)`,
        min: 1,
        max: maxSend,
        step: 1,
        defaultValue: Math.min(maxSend, 50)
      }
    ]
  });
  if (!panel) return;
  const targetIdx = Number(panel.values[0]);
  const amount = Math.floor(Number(panel.values[1]));
  const target = others[targetIdx];
  if (!target) {
    toast(player, Voice.transferFailTarget, "error");
    return;
  }
  if (!canAffordTransfer(before, amount, fee)) {
    toast(player, Voice.transferFailFunds, "error");
    return;
  }
  const plan = planTransfer(amount, fee);
  const ok = await confirmTxn(player, {
    title: "Transfer",
    glyph: Glyph.contract,
    context: `Send to ${target.name}. ${Voice.feeLine(money(fee))}`,
    lines: [
      { label: "Send", amount: plan.amount, sense: "loss" },
      { label: "Fee", amount: plan.fee, sense: "loss" }
    ],
    balanceBefore: before,
    balanceAfter: before - plan.totalDebit
  });
  if (!ok) return;
  try {
    const tick = currentTick();
    if (plan.fee > 0) sink(ledger2, acct, plan.fee, tick, "sink:fee");
    transfer(ledger2, acct, playerAccount(target), plan.amount, tick, "bank:transfer");
    toast(player, Voice.transferOk(money(plan.amount), target.name), "gain");
    toast(target, Voice.transferOk(money(plan.amount), player.name), "gain");
  } catch (e) {
    if (e instanceof LedgerError) toast(player, Voice.transferFailFunds, "error");
    else {
      console.error(`[ew] transfer failed: ${e}`);
      toast(player, Voice.error, "error");
    }
  }
}
async function statementsFlow(player, ledger2) {
  const acct = playerAccount(player);
  const mine = ledger2.journal.filter((e) => e.from === acct || e.to === acct).slice(-12);
  if (mine.length === 0) {
    await progressPanel(player, {
      title: "Statements",
      glyph: Glyph.bank,
      context: Voice.statementEmpty,
      rows: [{ label: "No entries", ok: false }]
    });
    return;
  }
  await progressPanel(player, {
    title: "Statements",
    glyph: Glyph.bank,
    context: `Balance: ${money(balance(ledger2, acct))}`,
    rows: mine.map((e) => ({
      label: formatEntry(e, acct),
      ok: e.kind === "mint" || e.kind === "cashIn" || e.kind === "transfer" && e.to === acct
    }))
  });
}
function formatEntry(e, acct) {
  const dir = e.kind === "transfer" ? e.to === acct ? "+" : "-" : e.kind === "mint" || e.kind === "cashIn" ? "+" : "-";
  return `#${e.seq} ${e.kind} ${dir}${e.amount}${e.tag ? ` (${e.tag})` : ""}`;
}

// data/prices.json
var prices_default = {
  _comment: "Pricing engine v1 config. base prices are relative-value guesses; ALL tuning numbers.",
  tickMinutes: 10,
  goods: {
    stone: { base: 2, band: [0.4, 2.5], driftRate: 0.03, target: 400 },
    log: { base: 3, band: [0.4, 2.5], driftRate: 0.03, target: 300 },
    lumber: { base: 6, band: [0.4, 2.5], driftRate: 0.03, target: 200 },
    wheat: { base: 2, band: [0.4, 2.5], driftRate: 0.04, target: 300 },
    bread: { base: 5, band: [0.4, 2.5], driftRate: 0.04, target: 150 },
    iron_ore: { base: 8, band: [0.4, 2.5], driftRate: 0.03, target: 150 },
    iron: { base: 15, band: [0.4, 2.5], driftRate: 0.03, target: 100 },
    gold: { base: 100, band: [0.8, 1.3], driftRate: 0.01, target: 50, _: "mint tier: tight band, slow drift" },
    diamond: { base: 400, band: [0.8, 1.3], driftRate: 0.01, target: 12 }
  }
};

// src/content/prices.ts
var prices = prices_default;
function basePrice(good) {
  const g = prices.goods[good];
  if (!g) throw new Error(`missing price for ${good} in data/prices.json`);
  return g.base;
}
var PRECIOUS_ITEMS = {
  gold: "minecraft:gold_ingot",
  diamond: "minecraft:diamond"
};

// src/systems/dealerMath.ts
function unitMultiplier(soldBefore, capacity, softFloor) {
  if (!(capacity > 0)) return softFloor;
  if (softFloor < 0 || softFloor > 1) throw new Error(`softFloor out of range: ${softFloor}`);
  const t = Math.min(1, Math.max(0, soldBefore) / capacity);
  return 1 - t * (1 - softFloor);
}
function quoteSale(qty, base, soldToday, capacity, softFloor) {
  if (!Number.isInteger(qty) || qty <= 0) throw new Error(`invalid qty: ${qty}`);
  if (!Number.isInteger(base) || base <= 0) throw new Error(`invalid base: ${base}`);
  if (!Number.isInteger(soldToday) || soldToday < 0) throw new Error(`invalid soldToday: ${soldToday}`);
  let payout = 0;
  let firstMult = 0;
  let lastMult = 0;
  for (let i = 0; i < qty; i++) {
    const m = unitMultiplier(soldToday + i, capacity, softFloor);
    if (i === 0) firstMult = m;
    lastMult = m;
    payout += Math.floor(base * m);
  }
  if (payout <= 0) throw new Error("sale payout collapsed to zero \u2014 capacity/softFloor misconfigured");
  return {
    qty,
    base,
    payout,
    avgUnitPrice: Math.floor(payout / qty),
    firstMult,
    lastMult,
    softened: firstMult < 1 - 1e-9 || lastMult < 1 - 1e-9
  };
}

// src/systems/reserve.ts
var KEY = "ew:reserve";
function emptyReserve() {
  return { schema: 1, goldUnits: 0, diamondUnits: 0 };
}
function loadReserve() {
  return loadBlob(KEY) ?? emptyReserve();
}
function saveReserve(r) {
  saveBlob(KEY, r);
}
function addReserve(r, good, qty) {
  if (!Number.isInteger(qty) || qty <= 0) throw new Error(`invalid reserve qty: ${qty}`);
  if (good === "gold") r.goldUnits += qty;
  else r.diamondUnits += qty;
}

// src/systems/dealerState.ts
var KEY2 = "ew:dealer";
function emptyDealerState(day = 0) {
  return { schema: 1, day, soldToday: { gold: 0, diamond: 0 } };
}
function loadDealerState() {
  return loadBlob(KEY2) ?? emptyDealerState();
}
function saveDealerState(s) {
  saveBlob(KEY2, s);
}
function rollDealerDay(s, tick) {
  const day = Math.floor(tick / 24e3);
  if (day !== s.day) {
    s.day = day;
    s.soldToday = { gold: 0, diamond: 0 };
  }
}

// src/systems/dealer.ts
async function openDealer(player, ledger2) {
  await menuHub(player, {
    title: "Commodity Dealer",
    glyph: Glyph.coin,
    context: Voice.dealerWelcome,
    buttons: [
      { label: "Sell gold", glyph: Glyph.up, onSelect: () => sellFlow(player, ledger2, "gold") },
      { label: "Sell diamonds", glyph: Glyph.up, onSelect: () => sellFlow(player, ledger2, "diamond") },
      { label: "Prices today", glyph: Glyph.clock, onSelect: () => pricesBoard(player) }
    ]
  });
}
async function sellFlow(player, ledger2, good) {
  const typeId = PRECIOUS_ITEMS[good];
  const qty = countItem(player, typeId);
  if (qty <= 0) {
    toast(player, Voice.dealerEmpty(good), "caution");
    return;
  }
  const dState = loadDealerState();
  rollDealerDay(dState, currentTick());
  const quote = quoteSale(
    qty,
    basePrice(good),
    dState.soldToday[good],
    dealerCapacity(good),
    dealerSoftFloor()
  );
  const acct = playerAccount(player);
  const before = balance(ledger2, acct);
  const ok = await confirmTxn(player, {
    title: `Sell ${good}`,
    glyph: Glyph.coin,
    context: quote.softened ? `${Voice.dealerSoft}
${qty} \xD7 ~${money(quote.avgUnitPrice)} (base ${money(quote.base)})` : `${qty} \xD7 ${money(quote.base)}`,
    lines: [{ label: "Payout", amount: quote.payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + quote.payout
  });
  if (!ok) return;
  const taken = takeItems(player, typeId, qty);
  if (taken !== qty) {
    toast(player, Voice.error, "error");
    return;
  }
  rollDealerDay(dState, currentTick());
  const finalQuote = quoteSale(
    taken,
    basePrice(good),
    dState.soldToday[good],
    dealerCapacity(good),
    dealerSoftFloor()
  );
  mint(ledger2, acct, finalQuote.payout, currentTick(), "mint:dealer");
  dState.soldToday[good] += taken;
  saveDealerState(dState);
  const reserve = loadReserve();
  addReserve(reserve, good, taken);
  saveReserve(reserve);
  toast(player, Voice.dealerSold(good, taken, money(finalQuote.payout)), "gain");
}
async function pricesBoard(player) {
  const dState = loadDealerState();
  rollDealerDay(dState, currentTick());
  const reserve = loadReserve();
  const rows = ["gold", "diamond"].map((good) => {
    const cap = dealerCapacity(good);
    const sold = dState.soldToday[good];
    const mult = unitMultiplier(sold, cap, dealerSoftFloor());
    const unit = Math.floor(basePrice(good) * mult);
    return {
      label: `${good}: ${money(unit)} / unit (base ${money(basePrice(good))})`,
      filled: sold,
      total: cap,
      note: `sold today ${sold}/${cap} \xB7 mult ${mult.toFixed(2)}`,
      ok: mult >= 0.99
    };
  });
  await progressPanel(player, {
    title: "Prices today",
    glyph: Glyph.coin,
    context: `${Voice.pricesBoard}
Reserve: gold ${reserve.goldUnits} \xB7 diamond ${reserve.diamondUnits}`,
    rows
  });
}

// src/systems/players.ts
var KEY3 = "ew:players";
function emptyPlayers() {
  return { schema: 1, byId: {} };
}
function loadPlayers() {
  return loadBlob(KEY3) ?? emptyPlayers();
}
function savePlayers(s) {
  saveBlob(KEY3, s);
}
function playerRec(s, playerId) {
  if (!s.byId[playerId]) s.byId[playerId] = { stipendClaimed: false };
  return s.byId[playerId];
}

// src/systems/stipend.ts
function claimStipend(player, ledger2) {
  const players = loadPlayers();
  const rec = playerRec(players, player.id);
  if (rec.stipendClaimed) {
    toast(player, Voice.stipendAlready, "caution");
    return;
  }
  const amt = stipendAmount();
  mint(ledger2, playerAccount(player), amt, currentTick(), "mint:stipend");
  rec.stipendClaimed = true;
  savePlayers(players);
  toast(player, Voice.stipendOk(money(amt)), "gain");
}

// src/main.ts
var LEDGER_KEY = "ew:ledger";
var ledger;
function boot() {
  ledger = loadBlob(LEDGER_KEY) ?? emptyLedger();
  startScheduler();
  every("ledger:save", 20 * 30, () => saveBlob(LEDGER_KEY, ledger));
  every("ledger:audit", 24e3, () => {
    const r = audit(ledger);
    if (!r.ok) {
      console.error(`[ew] AUDIT FAILED drift=${r.drift} expected=${r.expected} actual=${r.actual}`);
      world3.sendMessage("\xA7c[Meridian Central Bank] Ledger anomaly detected. This is being looked into.");
    } else {
      console.log(`[ew] audit ok: supply=${r.expected}`);
    }
  });
  every("dealer:dayroll", 24e3, (tick) => {
    const s = loadDealerState();
    rollDealerDay(s, tick);
    saveDealerState(s);
  });
  console.log("[ew] Economy World Phase B booted.");
}
system2.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id === "ew:dev") {
    const player = ev.sourceEntity;
    if (ev.message === "grant" && player && player.typeId === "minecraft:player") {
      mint(ledger, `p:${player.id}`, 100, currentTick(), "mint:system");
      world3.sendMessage(`\xA7a[dev] granted 100 merids to ${player.nameTag}`);
    }
    if (ev.message === "audit") {
      const r = audit(ledger);
      world3.sendMessage(`\xA7e[dev] audit ok=${r.ok} supply=${r.expected} drift=${r.drift}`);
    }
    if (ev.message === "stipend" && player && player.typeId === "minecraft:player") {
      claimStipend(player, ledger);
    }
    if (ev.message === "bank" && player && player.typeId === "minecraft:player") {
      void openBank(player, ledger);
    }
    if (ev.message === "dealer" && player && player.typeId === "minecraft:player") {
      void openDealer(player, ledger);
    }
    return;
  }
  if (ev.id === "ew:npc") {
    const player = ev.sourceEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    const p = player;
    if (ev.message === "bank") void openBank(p, ledger);
    if (ev.message === "dealer") void openDealer(p, ledger);
  }
});
world3.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  const tags = ev.target.getTags();
  if (tags.includes("ew:npc_bank")) {
    void openBank(ev.player, ledger);
  } else if (tags.includes("ew:npc_dealer")) {
    void openDealer(ev.player, ledger);
  }
});
boot();
