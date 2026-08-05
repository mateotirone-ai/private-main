// src/main.ts
import { world as world3, system as system3 } from "@minecraft/server";

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
    fishery: { buyout: 2200, t2: { price: 4400, buildMins: 25, requiresProduced: 4e3 }, _comment: "\u2691 10th L1 trade \u2014 was missing from Phase A matrix" },
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
  gain: "\xA7a",
  caution: "\xA7e",
  warning: "\xA76",
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
  barFull: "\uE00F",
  barEmpty: "\uE010"
};
var PAGE_SIZE = 8;
function formatAmount(amount) {
  const n = Math.trunc(amount);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toString();
  const withCommas = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + withCommas;
}
function merids(amount) {
  return `${formatAmount(amount)} merids`;
}
function money(amount) {
  return merids(amount);
}
function bareAmount(amount) {
  return formatAmount(amount);
}
function titleWithGlyph(glyph, title) {
  if (glyph) return `${glyph} ${Ink.emerald}${Ink.bold}${title}${Ink.reset}`;
  return `${Ink.emerald}${Ink.bold}${title}${Ink.reset}`;
}
function progressBar(filled, total, width = 10) {
  const t = Math.max(1, total);
  const n = Math.max(0, Math.min(width, Math.round(filled / t * width)));
  return Glyph.barFull.repeat(n) + Glyph.barEmpty.repeat(width - n);
}
function bodyWithNarrator(facts, narrator) {
  const data = facts.filter((f) => f.length > 0);
  if (!narrator) return data.join("\n");
  return [...data, "", `"${narrator}"`].join("\n");
}

// src/ui/voice.ts
var Voice = {
  // bank
  bankWelcome: "Meridian Central Bank. Your money is safe. Your pockets are not.",
  depositNarrator: "Convert physical cash into your bank balance.",
  depositOk: (n) => `Deposited ${n}. Pockets lighter. Civilization heavier.`,
  depositEmpty: "Nothing to deposit. The ledger declines empty gestures.",
  withdrawNarrator: "Cash leaves the vault. It can die with you.",
  withdrawOk: (n) => `Withdrawn ${n}. Try not to die with it.`,
  withdrawFail: "Insufficient balance. The vault is not a suggestion box.",
  transferNarrator: "Traceable. Regrettably civilized.",
  transferOk: (n, to) => `Transferred ${n} to ${to}. Traceable. Regrettably civilized.`,
  transferFailFunds: "Balance insufficient for the amount plus the transfer fee.",
  transferFailSelf: "You already have that money. The fee would be comedy.",
  transferFailTarget: "Recipient not found. Online players only \u2014 for now.",
  transferNoPlayers: "No one else is online. Cash hand-offs remain an option.",
  statementEmpty: "No recent activity. Either thrift or a very new account.",
  statementNarrator: "Recent ledger activity for this account.",
  feeLine: (fee) => `Flat transfer fee: ${fee}`,
  // dealer
  dealerWelcome: "Assay window. Gold and diamonds become merids. Everything else is scenery.",
  dealerSellNarrator: "Assayed. Merids issued. Fort Knox sends its regards.",
  dealerSold: (good, qty, n) => `Assayed ${qty} ${good}. Issued ${n}. Fort Knox sends its regards.`,
  dealerEmpty: (good) => `No ${good} on you. The window does not accept vibes.`,
  dealerSoft: "Volume is noted. Today's price has\u2026 adjusted.",
  pricesBoard: "Today's mint window. Softened by volume. Published because secrets are for bandits.",
  // stipend
  stipendOk: (n) => `Resettlement grant: ${n}. One mistake's worth. Spend wisely.`,
  stipendAlready: "Stipend already claimed. Meridian remembers.",
  // storefront / commons (Phase C)
  shopWelcome: "Storefront open. Prices move. Stock is finite.",
  shopBuyOk: (good, n) => `Purchased ${good} for ${n}.`,
  shopSellOk: (good, n) => `Sold ${good} for ${n}. Freelancer rate applied.`,
  shopEmpty: "Sold out. The shelves are resting.",
  shopNoGoods: "You have nothing this shop buys.",
  commonsWelcome: "Public commons. Gather what you can. Sell to the matching trade.",
  commonsSellOk: (good, n) => `Commons sale: ${good} for ${n}.`,
  // wallet
  walletPacked: (n) => `Packed ${n} into your wallet.`,
  walletUnpacked: (n) => `Unpacked ${n} from your wallet.`,
  walletEmpty: "Wallet is empty.",
  walletNoNotes: "No loose merid notes to pack.",
  walletMissing: "No wallet on you. Notes stay loose.",
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

// src/ui/safeShow.ts
import { system as system2 } from "@minecraft/server";

// src/ui/safeShowPolicy.ts
var USER_BUSY = "UserBusy";
var SAFE_SHOW_RETRY_TICKS = 5;
var SAFE_SHOW_MAX_WAIT_TICKS = 100;
function isUserBusy(canceled, reason) {
  return canceled && reason === USER_BUSY;
}
function userBusyRetryDelay(waitedTicks, retryTicks = SAFE_SHOW_RETRY_TICKS, maxWaitTicks = SAFE_SHOW_MAX_WAIT_TICKS) {
  if (waitedTicks >= maxWaitTicks) return null;
  return retryTicks;
}
async function safeShowLoop(showOnce, sleep, opts = {}) {
  const retryTicks = opts.retryTicks ?? SAFE_SHOW_RETRY_TICKS;
  const maxWaitTicks = opts.maxWaitTicks ?? SAFE_SHOW_MAX_WAIT_TICKS;
  let waited = 0;
  while (true) {
    const res = await showOnce();
    if (!isUserBusy(res.canceled, res.cancelationReason)) return res;
    const delay = userBusyRetryDelay(waited, retryTicks, maxWaitTicks);
    if (delay === null) {
      opts.onGiveUp?.();
      return res;
    }
    await sleep(delay);
    waited += delay;
  }
}

// src/ui/safeShow.ts
function sleepTicks(ticks) {
  return new Promise((resolve) => {
    system2.runTimeout(() => resolve(), ticks);
  });
}
async function safeShow(player, form) {
  return safeShowLoop(() => form.show(player), sleepTicks, {
    onGiveUp: () => console.warn(`[ew] safeShow gave up after UserBusy (~${SAFE_SHOW_MAX_WAIT_TICKS} ticks)`)
  });
}

// src/ui/patterns.ts
async function menuHub(player, opts) {
  const page = opts.page ?? 0;
  const totalPages = Math.max(1, Math.ceil(opts.buttons.length / PAGE_SIZE));
  const slice = opts.buttons.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const form = new ActionFormData().title(titleWithGlyph(opts.glyph, opts.title));
  const facts = [...opts.facts ?? []];
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
  const lineFacts = opts.lines.map((l) => {
    const ink = l.sense === "gain" ? Ink.gain : l.sense === "loss" ? Ink.loss : Ink.gold;
    return `${l.label}: ${ink}${merids(l.amount)}${Ink.reset}`;
  });
  const facts = [
    ...opts.facts,
    ...lineFacts,
    `Balance now: ${bareAmount(opts.balanceBefore)}`,
    `Balance after: ${bareAmount(opts.balanceAfter)}`
  ];
  const body = bodyWithNarrator(facts, opts.narrator);
  const form = new MessageFormData().title(titleWithGlyph(opts.glyph, opts.title)).body(body).button1(opts.confirmLabel ?? `${Glyph.check} Confirm`).button2(`${Glyph.cross} Cancel`);
  const res = await safeShow(player, form);
  if (res.canceled || res.selection === void 0 || res.selection === 1) {
    toast(player, Voice.cancelled, "caution");
    return false;
  }
  return true;
}
async function catalog(player, opts) {
  const page = opts.page ?? 0;
  const totalPages = Math.max(1, Math.ceil(opts.entries.length / PAGE_SIZE));
  const slice = opts.entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const form = new ActionFormData().title(titleWithGlyph(opts.glyph, opts.title));
  const facts = [...opts.facts ?? []];
  if (totalPages > 1) facts.push(`Page ${page + 1}/${totalPages}`);
  const body = bodyWithNarrator(facts, opts.narrator);
  if (body) form.body(body);
  for (const e of slice) {
    const price = bareAmount(e.price);
    if (e.locked) {
      form.button(`${Glyph.lock} ${e.name} \u2014 ${price}`);
    } else {
      form.button(`${e.glyph ? e.glyph + " " : ""}${e.name} \u2014 ${price}`);
    }
  }
  if (page > 0) form.button(`${Glyph.up} Previous`);
  if (page + 1 < totalPages) form.button(`${Glyph.down} Next`);
  form.button(`${Glyph.cross} Back`);
  const res = await safeShow(player, form);
  if (res.canceled || res.selection === void 0) return;
  let idx = res.selection;
  if (idx < slice.length) {
    const e = slice[idx];
    if (e.locked) {
      toast(player, e.lockReason ?? Voice.reserved, "caution");
      await catalog(player, opts);
      return;
    }
    if (e.detailFacts?.length) {
      const detail = new MessageFormData().title(titleWithGlyph(e.glyph, e.name)).body(
        bodyWithNarrator(
          [...e.detailFacts, `Price: ${merids(e.price)}`],
          e.detailNarrator
        )
      ).button1(`${Glyph.check} Continue`).button2(`${Glyph.cross} Back`);
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
async function managePanel(player, opts) {
  const form = new ModalFormData().title(titleWithGlyph(opts.glyph, opts.title));
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
  const res = await safeShow(player, form);
  if (res.canceled || !res.formValues) {
    toast(player, Voice.cancelled, "caution");
    return void 0;
  }
  return { values: res.formValues, raw: res };
}
async function progressPanel(player, opts) {
  const rowLines = opts.rows.map((r) => {
    const mark = r.ok === true ? Glyph.check : r.ok === false ? Glyph.lock : "";
    const bar = r.filled !== void 0 && r.total !== void 0 ? ` ${progressBar(r.filled, r.total)} ${r.filled}/${r.total}` : "";
    const note = r.note ? `
  ${Ink.slate}${r.note}${Ink.reset}` : "";
    return `${mark ? mark + " " : ""}${r.label}${bar}${note}`;
  });
  const body = bodyWithNarrator([...opts.facts ?? [], ...rowLines], opts.narrator);
  const form = new ActionFormData().title(titleWithGlyph(opts.glyph, opts.title)).body(body).button(opts.doneLabel ?? `${Glyph.check} Done`);
  await safeShow(player, form);
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
var WALLET_ID = "ew:wallet";
var WALLET_BAL_KEY = "ew:bal";
function cashItemId(denom) {
  return `ew:cash_${denom}`;
}
function parseCashDenom(typeId) {
  const m = /^ew:cash_(\d+)$/.exec(typeId);
  if (!m) return void 0;
  return Number(m[1]);
}
function invOf(player) {
  return player.getComponent("inventory")?.container;
}
function getWalletBalance(item) {
  const v = item.getDynamicProperty(WALLET_BAL_KEY);
  return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : 0;
}
function setWalletBalance(item, amount) {
  if (!Number.isInteger(amount) || amount < 0) throw new Error(`bad wallet bal ${amount}`);
  item.setDynamicProperty(WALLET_BAL_KEY, amount);
  item.nameTag = amount > 0 ? `Wallet (${amount} merids)` : "Wallet";
}
function findWallet(player) {
  const inv = invOf(player);
  if (!inv) return void 0;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item?.typeId === WALLET_ID) return { item, slot: i };
  }
  return void 0;
}
function countLooseCash(player) {
  const inv = invOf(player);
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
function countCarriedCash(player) {
  const loose = countLooseCash(player).total;
  const w = findWallet(player);
  const wallet = w ? getWalletBalance(w.item) : 0;
  return { total: loose + wallet, loose, wallet };
}
function takeLooseCash(player) {
  const { total, stacks } = countLooseCash(player);
  const inv = invOf(player);
  if (!inv) return 0;
  for (const s of stacks) inv.setItem(s.slot, void 0);
  return total;
}
function takeAllCarriedCash(player) {
  const loose = takeLooseCash(player);
  const w = findWallet(player);
  let wallet = 0;
  if (w) {
    wallet = getWalletBalance(w.item);
    if (wallet > 0) {
      setWalletBalance(w.item, 0);
      invOf(player)?.setItem(w.slot, w.item);
    }
  }
  return loose + wallet;
}
function giveNotes(player, amount) {
  if (amount <= 0) return;
  const parts = breakIntoCash(amount, cashDenominations());
  const inv = invOf(player);
  if (!inv) throw new Error("no inventory");
  for (const p of parts) {
    let left = p.count;
    while (left > 0) {
      const n = Math.min(64, left);
      const stack = new ItemStack(cashItemId(p.denom), n);
      const leftover = inv.addItem(stack);
      if (leftover) player.dimension.spawnItem(leftover, player.location);
      left -= n;
    }
  }
}
function spawnCash(player, amount) {
  const w = findWallet(player);
  if (w) {
    setWalletBalance(w.item, getWalletBalance(w.item) + amount);
    invOf(player)?.setItem(w.slot, w.item);
    return;
  }
  giveNotes(player, amount);
}
function packLooseIntoWallet(player) {
  const w = findWallet(player);
  if (!w) return -1;
  const loose = takeLooseCash(player);
  if (loose <= 0) return 0;
  setWalletBalance(w.item, getWalletBalance(w.item) + loose);
  invOf(player)?.setItem(w.slot, w.item);
  return loose;
}
function unpackFromWallet(player, amount) {
  const w = findWallet(player);
  if (!w) return -1;
  const bal = getWalletBalance(w.item);
  if (bal <= 0) return 0;
  const take = amount === void 0 ? bal : Math.min(bal, Math.max(0, Math.floor(amount)));
  if (take <= 0) return 0;
  setWalletBalance(w.item, bal - take);
  invOf(player)?.setItem(w.slot, w.item);
  giveNotes(player, take);
  return take;
}
function ensureWallet(player) {
  if (findWallet(player)) return;
  const inv = invOf(player);
  if (!inv) return;
  const stack = new ItemStack(WALLET_ID, 1);
  setWalletBalance(stack, 0);
  const leftover = inv.addItem(stack);
  if (leftover) player.dimension.spawnItem(leftover, player.location);
}
function countItem(player, typeId) {
  const inv = invOf(player);
  if (!inv) return 0;
  let n = 0;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item?.typeId === typeId) n += item.amount;
  }
  return n;
}
function takeItems(player, typeId, qty) {
  const inv = invOf(player);
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
function giveItem(player, typeId, qty) {
  const inv = invOf(player);
  if (!inv) throw new Error("no inventory");
  let left = qty;
  while (left > 0) {
    const n = Math.min(64, left);
    const stack = new ItemStack(typeId, n);
    const leftover = inv.addItem(stack);
    if (leftover) player.dimension.spawnItem(leftover, player.location);
    left -= n;
  }
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
    facts: [`Balance: ${bareAmount(bal)}`],
    narrator: Voice.bankWelcome,
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
  const { total } = countCarriedCash(player);
  if (total <= 0) {
    toast(player, Voice.depositEmpty, "caution");
    return;
  }
  const before = balance(ledger2, acct);
  const ok = await confirmTxn(player, {
    title: "Deposit",
    glyph: Glyph.bank,
    facts: [`Depositing: ${merids(total)}`],
    lines: [{ label: "Deposit", amount: total, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + total,
    narrator: Voice.depositNarrator
  });
  if (!ok) return;
  try {
    const taken = takeAllCarriedCash(player);
    if (taken <= 0) {
      toast(player, Voice.depositEmpty, "caution");
      return;
    }
    cashIn(ledger2, acct, taken, currentTick());
    toast(player, Voice.depositOk(merids(taken)), "gain");
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
        label: `Amount (max ${bareAmount(before)})`,
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
    facts: [`Withdrawing: ${merids(amount)}`],
    lines: [{ label: "Withdraw", amount, sense: "loss" }],
    balanceBefore: before,
    balanceAfter: before - amount,
    narrator: Voice.withdrawNarrator
  });
  if (!ok) return;
  try {
    cashOut(ledger2, acct, amount, currentTick());
    spawnCash(player, amount);
    toast(player, Voice.withdrawOk(merids(amount)), "caution");
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
        label: `Amount (fee ${bareAmount(fee)} extra)`,
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
    facts: [
      `Recipient: ${target.name}`,
      `Send: ${merids(plan.amount)}`,
      `Fee: ${merids(plan.fee)}`
    ],
    lines: [
      { label: "Send", amount: plan.amount, sense: "loss" },
      { label: "Fee", amount: plan.fee, sense: "loss" }
    ],
    balanceBefore: before,
    balanceAfter: before - plan.totalDebit,
    narrator: Voice.transferNarrator
  });
  if (!ok) return;
  try {
    const tick = currentTick();
    if (plan.fee > 0) sink(ledger2, acct, plan.fee, tick, "sink:fee");
    transfer(ledger2, acct, playerAccount(target), plan.amount, tick, "bank:transfer");
    toast(player, Voice.transferOk(merids(plan.amount), target.name), "gain");
    toast(target, Voice.transferOk(merids(plan.amount), player.name), "gain");
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
      facts: [`Balance: ${bareAmount(balance(ledger2, acct))}`],
      narrator: Voice.statementEmpty,
      rows: [{ label: "No entries", ok: false }]
    });
    return;
  }
  await progressPanel(player, {
    title: "Statements",
    glyph: Glyph.bank,
    facts: [`Balance: ${bareAmount(balance(ledger2, acct))}`],
    narrator: Voice.statementNarrator,
    rows: mine.map((e) => ({
      label: formatEntry(e, acct),
      ok: e.kind === "mint" || e.kind === "cashIn" || e.kind === "transfer" && e.to === acct
    }))
  });
}
function formatEntry(e, acct) {
  const dir = e.kind === "transfer" ? e.to === acct ? "+" : "-" : e.kind === "mint" || e.kind === "cashIn" ? "+" : "-";
  return `#${e.seq} ${e.kind} ${dir}${bareAmount(e.amount)}${e.tag ? ` (${e.tag})` : ""}`;
}

// data/prices.json
var prices_default = {
  _comment: "Pricing engine v1 config. base prices are relative-value guesses; ALL tuning numbers.",
  tickMinutes: 10,
  mintTier: ["gold", "diamond"],
  goods: {
    stone: { base: 2, band: [0.4, 2.5], driftRate: 0.03, target: 400 },
    log: { base: 3, band: [0.4, 2.5], driftRate: 0.03, target: 300 },
    lumber: { base: 6, band: [0.4, 2.5], driftRate: 0.03, target: 200 },
    wheat: { base: 2, band: [0.4, 2.5], driftRate: 0.04, target: 300 },
    bread: { base: 5, band: [0.4, 2.5], driftRate: 0.04, target: 150 },
    iron_ore: { base: 8, band: [0.4, 2.5], driftRate: 0.03, target: 150 },
    iron: { base: 15, band: [0.4, 2.5], driftRate: 0.03, target: 100 },
    fish: { base: 4, band: [0.4, 2.5], driftRate: 0.04, target: 200, _comment: "\u2691 fishery good \u2014 added with 10th trade" },
    gold: { base: 100, band: [0.8, 1.3], driftRate: 0.01, target: 50, _: "mint tier: L1 constant (no drift tick)" },
    diamond: { base: 400, band: [0.8, 1.3], driftRate: 0.01, target: 12, _: "mint tier: L1 constant (no drift tick)" }
  }
};

// src/content/prices.ts
var prices = prices_default;
function basePrice(good) {
  const g = prices.goods[good];
  if (!g) throw new Error(`missing price for ${good} in data/prices.json`);
  return g.base;
}
function goodConfig(good) {
  const g = prices.goods[good];
  if (!g) throw new Error(`missing price for ${good} in data/prices.json`);
  return g;
}
function isMintTier(good) {
  return prices.mintTier.includes(good);
}
function priceTickMinutes() {
  return prices.tickMinutes;
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
var GOOD_LABEL = {
  gold: "gold ingots",
  diamond: "diamonds"
};
async function openDealer(player, ledger2) {
  await menuHub(player, {
    title: "Commodity Dealer",
    glyph: Glyph.coin,
    facts: ["Assay window open"],
    narrator: Voice.dealerWelcome,
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
  const unitLabel = GOOD_LABEL[good];
  const facts = [
    `Selling: ${qty} ${unitLabel}`,
    quote.softened ? `Price: ${bareAmount(quote.avgUnitPrice)} each (softened from ${bareAmount(quote.base)} \u2014 high volume today)` : `Price: ${bareAmount(quote.base)} each`
  ];
  const ok = await confirmTxn(player, {
    title: `Sell ${good}`,
    glyph: Glyph.coin,
    facts,
    lines: [{ label: "Payout", amount: quote.payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + quote.payout,
    narrator: quote.softened ? Voice.dealerSoft : Voice.dealerSellNarrator
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
  toast(player, Voice.dealerSold(good, taken, merids(finalQuote.payout)), "gain");
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
      label: `${good}`,
      filled: sold,
      total: cap,
      note: `Unit: ${bareAmount(unit)} (base ${bareAmount(basePrice(good))})`,
      ok: mult >= 0.99
    };
  });
  await progressPanel(player, {
    title: "Prices today",
    glyph: Glyph.coin,
    facts: [
      `Reserve gold: ${reserve.goldUnits}`,
      `Reserve diamond: ${reserve.diamondUnits}`
    ],
    narrator: Voice.pricesBoard,
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

// src/systems/pricingMath.ts
function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}
function pressure(stock, target) {
  if (!(target > 0)) return 0;
  return clamp((target - stock) / target, -1, 1);
}
function tickPrice(cfg, runtime) {
  const p = pressure(runtime.stock, cfg.target);
  let next = runtime.current + runtime.current * cfg.driftRate * p;
  const lo = cfg.base * cfg.band[0];
  const hi = cfg.base * cfg.band[1];
  next = clamp(next, lo, hi);
  return next;
}
function quoteUnit(current) {
  return Math.max(1, Math.floor(current));
}
function freelancePayout(current, qty, rate) {
  if (!Number.isInteger(qty) || qty <= 0) throw new Error(`invalid qty: ${qty}`);
  if (!(rate > 0) || rate > 1) throw new Error(`invalid freelance rate: ${rate}`);
  const unit = Math.max(1, Math.floor(current * rate));
  return unit * qty;
}

// src/systems/pricing.ts
var KEY4 = "ew:prices";
function emptyPrices() {
  const goods = {};
  for (const [id, cfg] of Object.entries(prices.goods)) {
    goods[id] = { current: cfg.base, stock: cfg.target };
  }
  return { schema: 1, goods };
}
function loadPrices() {
  const s = loadBlob(KEY4);
  if (!s) return emptyPrices();
  for (const [id, cfg] of Object.entries(prices.goods)) {
    if (!s.goods[id]) s.goods[id] = { current: cfg.base, stock: cfg.target };
  }
  return s;
}
function savePrices(s) {
  saveBlob(KEY4, s);
}
function currentUnitPrice(s, good) {
  if (isMintTier(good)) return quoteUnit(goodConfig(good).base);
  const rt = s.goods[good];
  if (!rt) return quoteUnit(goodConfig(good).base);
  return quoteUnit(rt.current);
}
function adjustStock(s, good, delta) {
  const rt = s.goods[good] ?? { current: goodConfig(good).base, stock: goodConfig(good).target };
  rt.stock = Math.max(0, rt.stock + delta);
  s.goods[good] = rt;
}
function runPriceTick(s) {
  for (const [id, cfg] of Object.entries(prices.goods)) {
    if (isMintTier(id)) {
      const rt2 = s.goods[id] ?? { current: cfg.base, stock: cfg.target };
      rt2.current = cfg.base;
      s.goods[id] = rt2;
      continue;
    }
    const rt = s.goods[id] ?? { current: cfg.base, stock: cfg.target };
    rt.current = tickPrice(cfg, rt);
    s.goods[id] = rt;
  }
}
function startPricingJob(get, set) {
  const everyTicks = Math.max(1, Math.floor(priceTickMinutes() * 60 * 20));
  every("prices:tick", everyTicks, () => {
    const s = get();
    runPriceTick(s);
    set(s);
    savePrices(s);
  });
}

// data/trades.json
var trades_default = {
  _comment: "Layer 1 ten-trade loop. Buyout/t2 mirrored from matrix.json. producePerTick + storageCap are \u2691 playtest tuning (master doc \xA713 CPU restock rates).",
  cpuProduceEveryMinutes: 10,
  trades: {
    stone_quarry: {
      name: "Stone Quarry",
      good: "stone",
      item: "minecraft:cobblestone",
      kind: "extraction",
      storageCap: 400,
      producePerTick: 8,
      buyout: 2500,
      t2: { price: 5e3, buildMins: 30, requiresProduced: 5e3 }
    },
    ore_mine: {
      name: "Ore Mine",
      good: "iron_ore",
      item: "minecraft:raw_iron",
      kind: "extraction",
      storageCap: 150,
      producePerTick: 4,
      buyout: 4e3,
      t2: { price: 8e3, buildMins: 45, requiresProduced: 4e3 }
    },
    precious_mine: {
      name: "Precious Mine",
      good: "gold",
      item: "minecraft:gold_ingot",
      kind: "extraction",
      storageCap: 50,
      producePerTick: 1,
      buyout: 15e3,
      t2: { price: 25e3, buildMins: 90, requiresProduced: 500 },
      _note: "Sells gold ore/ingots at storefront; mint still only via dealer."
    },
    lumber_camp: {
      name: "Lumber Camp",
      good: "log",
      item: "minecraft:oak_log",
      kind: "extraction",
      storageCap: 300,
      producePerTick: 6,
      buyout: 2500,
      t2: { price: 5e3, buildMins: 30, requiresProduced: 5e3 }
    },
    crop_farm: {
      name: "Crop Farm",
      good: "wheat",
      item: "minecraft:wheat",
      kind: "extraction",
      storageCap: 300,
      producePerTick: 6,
      buyout: 2e3,
      t2: { price: 4e3, buildMins: 25, requiresProduced: 6e3 }
    },
    sawmill: {
      name: "Sawmill",
      good: "lumber",
      item: "minecraft:oak_planks",
      kind: "processing",
      storageCap: 200,
      producePerTick: 4,
      buyout: 3500,
      t2: { price: 7e3, buildMins: 40, requiresProduced: 3e3 }
    },
    smeltery: {
      name: "Smeltery",
      good: "iron",
      item: "minecraft:iron_ingot",
      kind: "processing",
      storageCap: 100,
      producePerTick: 3,
      buyout: 4500,
      t2: { price: 9e3, buildMins: 50, requiresProduced: 2500 }
    },
    bakery: {
      name: "Bakery",
      good: "bread",
      item: "minecraft:bread",
      kind: "processing",
      storageCap: 150,
      producePerTick: 4,
      buyout: 3e3,
      t2: { price: 6e3, buildMins: 35, requiresProduced: 3e3 }
    },
    fishery: {
      name: "Fishery",
      good: "fish",
      item: "minecraft:cod",
      kind: "extraction",
      storageCap: 200,
      producePerTick: 5,
      buyout: 2200,
      t2: { price: 4400, buildMins: 25, requiresProduced: 4e3 },
      _comment: "\u2691 10th L1 trade \u2014 matrix.json only listed 9; fishery added to match layer1 'ten-trade' count."
    },
    general_store: {
      name: "General Store",
      good: "bread",
      item: "minecraft:bread",
      kind: "service",
      storageCap: 100,
      producePerTick: 2,
      buyout: 5e3,
      t2: { price: 1e4, buildMins: 45, requiresProduced: 0 },
      _note: "Service stub: restocks bread as a stand-in SKU until multi-SKU shops land."
    }
  },
  commons: {
    _comment: "Public gather floors \u2014 sell-to-matching-business only (master doc Commons). Zone regen is Phase D.",
    zones: [
      { id: "woodlot", name: "Community Woodlot", good: "log", trade: "lumber_camp" },
      { id: "quarry_pit", name: "Public Quarry Pit", good: "stone", trade: "stone_quarry" },
      { id: "forage", name: "Forage Patch", good: "wheat", trade: "crop_farm" }
    ]
  }
};

// src/content/trades.ts
var tradesFile = trades_default;
function allTradeIds() {
  return Object.keys(tradesFile.trades);
}
function tradeDef(id) {
  const t = tradesFile.trades[id];
  if (!t) throw new Error(`unknown trade: ${id}`);
  return t;
}
function commonsZones() {
  return tradesFile.commons.zones;
}
function cpuProduceEveryMinutes() {
  return tradesFile.cpuProduceEveryMinutes;
}

// src/systems/businessMath.ts
function seedCpuBusinesses() {
  const byId = {};
  for (const trade of allTradeIds()) {
    const id = `cpu_${trade}`;
    const def = tradeDef(trade);
    byId[id] = {
      id,
      trade,
      tier: 1,
      owner: "cpu",
      storage: Math.floor(def.storageCap / 2),
      producedTotal: 0
    };
  }
  return byId;
}
function produceOnce(biz, def = tradeDef(biz.trade)) {
  const room = Math.max(0, def.storageCap - biz.storage);
  const add = Math.min(def.producePerTick, room);
  biz.storage += add;
  biz.producedTotal += add;
  return add;
}
function runCpuProduction(byId) {
  const out = [];
  for (const biz of Object.values(byId)) {
    if (biz.owner !== "cpu") continue;
    const def = tradeDef(biz.trade);
    const added = produceOnce(biz, def);
    if (added > 0) out.push({ trade: biz.trade, good: def.good, added });
  }
  return out;
}

// src/systems/businesses.ts
var KEY5 = "ew:businesses";
function bizAccount(bizId) {
  return `b:${bizId}`;
}
function emptyBusinesses() {
  return { schema: 1, byId: seedCpuBusinesses() };
}
function loadBusinesses() {
  const s = loadBlob(KEY5);
  if (!s) return emptyBusinesses();
  for (const trade of allTradeIds()) {
    const id = `cpu_${trade}`;
    if (!s.byId[id]) {
      const def = tradeDef(trade);
      s.byId[id] = {
        id,
        trade,
        tier: 1,
        owner: "cpu",
        storage: Math.floor(def.storageCap / 2),
        producedTotal: 0
      };
    }
  }
  return s;
}
function saveBusinesses(s) {
  saveBlob(KEY5, s);
}
function runCpuProduction2(s, prices2) {
  const results = runCpuProduction(s.byId);
  for (const r of results) adjustStock(prices2, r.good, r.added);
}
function ensureBizFloat(ledger2, bizId, amount) {
  const acct = bizAccount(bizId);
  const bal = balance(ledger2, acct);
  if (bal >= amount) return;
  mint(ledger2, acct, amount - bal, currentTick(), "mint:system");
}
function startBusinessJobs(getBiz, setBiz, getPrices, setPrices) {
  const everyTicks = Math.max(1, Math.floor(cpuProduceEveryMinutes() * 60 * 20));
  every("biz:cpu_produce", everyTicks, () => {
    const biz = getBiz();
    const prices2 = getPrices();
    runCpuProduction2(biz, prices2);
    setBiz(biz);
    setPrices(prices2);
    saveBusinesses(biz);
  });
}
function listCpuBusinesses(s) {
  return Object.values(s.byId).filter((b) => b.owner === "cpu");
}

// src/systems/storefront.ts
async function openStorefront(player, ledger2, bizState2, prices2, bizId) {
  const biz = bizState2.byId[bizId];
  if (!biz) {
    toast(player, Voice.error, "error");
    return;
  }
  const def = tradeDef(biz.trade);
  const unit = currentUnitPrice(prices2, def.good);
  await menuHub(player, {
    title: def.name,
    facts: [
      `Stock: ${biz.storage}`,
      `Price: ${bareAmount(unit)} each`,
      `Freelance rate: ${Math.round(matrix.freelanceRate * 100)}%`
    ],
    narrator: Voice.shopWelcome,
    buttons: [
      {
        label: "Buy",
        onSelect: () => buyFlow(player, ledger2, bizState2, prices2, biz)
      },
      {
        label: "Sell (freelancer)",
        onSelect: () => sellFlow2(player, ledger2, bizState2, prices2, biz)
      }
    ]
  });
}
async function buyFlow(player, ledger2, bizState2, prices2, biz) {
  const def = tradeDef(biz.trade);
  if (biz.storage <= 0) {
    toast(player, Voice.shopEmpty, "caution");
    return;
  }
  const unit = currentUnitPrice(prices2, def.good);
  const maxBuy = Math.min(biz.storage, 64);
  await catalog(player, {
    title: `Buy \u2014 ${def.name}`,
    facts: [`In stock: ${biz.storage}`],
    narrator: Voice.shopWelcome,
    entries: [
      {
        name: `${def.good} \xD71`,
        price: unit,
        detailFacts: [`Good: ${def.good}`, `Stock: ${biz.storage}`],
        onBuy: () => confirmBuy(player, ledger2, bizState2, prices2, biz, 1, unit)
      },
      {
        name: `${def.good} \xD7${Math.min(8, maxBuy)}`,
        price: unit * Math.min(8, maxBuy),
        locked: maxBuy < 8,
        lockReason: Voice.shopEmpty,
        onBuy: () => confirmBuy(player, ledger2, bizState2, prices2, biz, Math.min(8, maxBuy), unit)
      },
      {
        name: `${def.good} \xD7${maxBuy} (max)`,
        price: unit * maxBuy,
        onBuy: () => confirmBuy(player, ledger2, bizState2, prices2, biz, maxBuy, unit)
      }
    ]
  });
}
async function confirmBuy(player, ledger2, bizState2, prices2, biz, qty, unit) {
  const def = tradeDef(biz.trade);
  const live = bizState2.byId[biz.id];
  if (live.storage < qty) {
    toast(player, Voice.shopEmpty, "caution");
    return;
  }
  const total = unit * qty;
  const acct = playerAccount(player);
  const before = balance(ledger2, acct);
  if (before < total) {
    toast(player, Voice.transferFailFunds, "error");
    return;
  }
  const ok = await confirmTxn(player, {
    title: "Buy",
    facts: [
      `Buying: ${qty} ${def.good}`,
      `Price: ${bareAmount(unit)} each`
    ],
    lines: [{ label: "Cost", amount: total, sense: "loss" }],
    balanceBefore: before,
    balanceAfter: before - total,
    narrator: Voice.shopWelcome
  });
  if (!ok) return;
  try {
    transfer(ledger2, acct, bizAccount(biz.id), total, currentTick(), "shop:buy");
    live.storage -= qty;
    adjustStock(prices2, def.good, -qty);
    giveItem(player, def.item, qty);
    saveBusinesses(bizState2);
    savePrices(prices2);
    toast(player, Voice.shopBuyOk(`${qty} ${def.good}`, merids(total)), "gain");
  } catch (e) {
    if (e instanceof LedgerError) toast(player, Voice.transferFailFunds, "error");
    else {
      console.error(`[ew] shop buy failed: ${e}`);
      toast(player, Voice.error, "error");
    }
  }
}
async function sellFlow2(player, ledger2, bizState2, prices2, biz) {
  const def = tradeDef(biz.trade);
  const qty = countItem(player, def.item);
  if (qty <= 0) {
    toast(player, Voice.shopNoGoods, "caution");
    return;
  }
  const unitMarket = currentUnitPrice(prices2, def.good);
  const payout = freelancePayout(
    prices2.goods[def.good]?.current ?? unitMarket,
    qty,
    matrix.freelanceRate
  );
  const acct = playerAccount(player);
  const before = balance(ledger2, acct);
  const ok = await confirmTxn(player, {
    title: "Sell (freelancer)",
    facts: [
      `Selling: ${qty} ${def.good}`,
      `Market: ${bareAmount(unitMarket)} each`,
      `Freelance rate: ${Math.round(matrix.freelanceRate * 100)}%`
    ],
    lines: [{ label: "Payout", amount: payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + payout,
    narrator: Voice.shopWelcome
  });
  if (!ok) return;
  const taken = takeItems(player, def.item, qty);
  if (taken !== qty) {
    toast(player, Voice.error, "error");
    return;
  }
  try {
    const live = bizState2.byId[biz.id];
    ensureBizFloat(ledger2, biz.id, payout);
    transfer(ledger2, bizAccount(biz.id), acct, payout, currentTick(), "shop:freelance");
    const room = Math.max(0, def.storageCap - live.storage);
    const stored = Math.min(taken, room);
    live.storage += stored;
    adjustStock(prices2, def.good, stored);
    saveBusinesses(bizState2);
    savePrices(prices2);
    toast(player, Voice.shopSellOk(`${taken} ${def.good}`, merids(payout)), "gain");
  } catch (e) {
    console.error(`[ew] shop sell failed: ${e}`);
    toast(player, Voice.error, "error");
  }
}

// src/systems/commons.ts
async function openCommons(player, ledger2, bizState2, prices2) {
  const zones = commonsZones();
  await menuHub(player, {
    title: "Public Commons",
    facts: [`Zones: ${zones.length}`, `Freelance rate: ${Math.round(matrix.freelanceRate * 100)}%`],
    narrator: Voice.commonsWelcome,
    buttons: zones.map((z) => ({
      label: `Sell ${z.good} \u2014 ${z.name}`,
      onSelect: () => sellAtZone(player, ledger2, bizState2, prices2, z.trade, z.good, z.name)
    }))
  });
}
async function sellAtZone(player, ledger2, bizState2, prices2, tradeId, good, zoneName) {
  const def = tradeDef(tradeId);
  const bizId = `cpu_${tradeId}`;
  const biz = bizState2.byId[bizId];
  if (!biz) {
    toast(player, Voice.error, "error");
    return;
  }
  const qty = countItem(player, def.item);
  if (qty <= 0) {
    toast(player, Voice.shopNoGoods, "caution");
    return;
  }
  const unitMarket = currentUnitPrice(prices2, good);
  const current = prices2.goods[good]?.current ?? unitMarket;
  const payout = freelancePayout(current, qty, matrix.freelanceRate);
  const acct = playerAccount(player);
  const before = balance(ledger2, acct);
  const ok = await confirmTxn(player, {
    title: zoneName,
    facts: [
      `Selling: ${qty} ${good}`,
      `Market: ${bareAmount(unitMarket)} each`,
      `Freelance rate: ${Math.round(matrix.freelanceRate * 100)}%`,
      `Buyer: ${def.name}`
    ],
    lines: [{ label: "Payout", amount: payout, sense: "gain" }],
    balanceBefore: before,
    balanceAfter: before + payout,
    narrator: Voice.commonsWelcome
  });
  if (!ok) return;
  const taken = takeItems(player, def.item, qty);
  if (taken !== qty) {
    toast(player, Voice.error, "error");
    return;
  }
  try {
    ensureBizFloat(ledger2, bizId, payout);
    transfer(ledger2, bizAccount(bizId), acct, payout, currentTick(), "commons:sell");
    const room = Math.max(0, def.storageCap - biz.storage);
    const stored = Math.min(taken, room);
    biz.storage += stored;
    adjustStock(prices2, good, stored);
    saveBusinesses(bizState2);
    savePrices(prices2);
    toast(player, Voice.commonsSellOk(`${taken} ${good}`, merids(payout)), "gain");
  } catch (e) {
    console.error(`[ew] commons sell failed: ${e}`);
    toast(player, Voice.error, "error");
  }
}

// src/systems/wallet.ts
async function openWallet(player) {
  let w = findWallet(player);
  if (!w) {
    ensureWallet(player);
    w = findWallet(player);
  }
  const bal = w ? getWalletBalance(w.item) : 0;
  const loose = countLooseCash(player).total;
  await menuHub(player, {
    title: "Wallet",
    facts: [`Wallet: ${bareAmount(bal)}`, `Loose notes: ${bareAmount(loose)}`],
    narrator: "Cash notes stack here so your pockets stay civil.",
    buttons: [
      {
        label: "Pack loose notes",
        onSelect: () => {
          const n = packLooseIntoWallet(player);
          if (n < 0) toast(player, Voice.walletMissing, "caution");
          else if (n === 0) toast(player, Voice.walletNoNotes, "caution");
          else toast(player, Voice.walletPacked(merids(n)), "gain");
        }
      },
      {
        label: "Unpack all",
        onSelect: () => {
          const n = unpackFromWallet(player);
          if (n < 0) toast(player, Voice.walletMissing, "caution");
          else if (n === 0) toast(player, Voice.walletEmpty, "caution");
          else toast(player, Voice.walletUnpacked(merids(n)), "caution");
        }
      }
    ]
  });
}

// src/main.ts
var LEDGER_KEY = "ew:ledger";
var ledger;
var pricesState;
var bizState;
function asPlayer(e) {
  if (!e || e.typeId !== "minecraft:player") return void 0;
  return e;
}
function boot() {
  ledger = loadBlob(LEDGER_KEY) ?? emptyLedger();
  pricesState = loadPrices();
  bizState = loadBusinesses();
  savePrices(pricesState);
  saveBusinesses(bizState);
  startScheduler();
  every("ledger:save", 20 * 30, () => {
    saveBlob(LEDGER_KEY, ledger);
    savePrices(pricesState);
    saveBusinesses(bizState);
  });
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
  startPricingJob(
    () => pricesState,
    (s) => {
      pricesState = s;
    }
  );
  startBusinessJobs(
    () => bizState,
    (s) => {
      bizState = s;
    },
    () => pricesState,
    (s) => {
      pricesState = s;
    }
  );
  system3.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id === "ew:dev") {
      const player = asPlayer(ev.sourceEntity);
      if (ev.message === "grant" && player) {
        mint(ledger, `p:${player.id}`, 100, currentTick(), "mint:system");
        world3.sendMessage(`\xA7a[dev] granted 100 merids to ${player.nameTag}`);
      }
      if (ev.message === "audit") {
        const r = audit(ledger);
        world3.sendMessage(`\xA7e[dev] audit ok=${r.ok} supply=${r.expected} drift=${r.drift}`);
      }
      if (ev.message === "stipend" && player) claimStipend(player, ledger);
      if (ev.message === "bank" && player) void openBank(player, ledger);
      if (ev.message === "dealer" && player) void openDealer(player, ledger);
      if (ev.message === "commons" && player) void openCommons(player, ledger, bizState, pricesState);
      if (ev.message === "wallet" && player) void openWallet(player);
      if (ev.message === "givewallet" && player) {
        ensureWallet(player);
        world3.sendMessage("\xA7a[dev] wallet granted");
      }
      if (ev.message.startsWith("shop ") && player) {
        const trade = ev.message.slice(5).trim();
        const id = `cpu_${trade}`;
        if (!bizState.byId[id]) {
          world3.sendMessage(`\xA7c[dev] unknown shop trade: ${trade}`);
          return;
        }
        void openStorefront(player, ledger, bizState, pricesState, id);
      }
      if (ev.message === "shops" && player) {
        const list = listCpuBusinesses(bizState).map((b) => b.trade).join(", ");
        world3.sendMessage(`\xA7e[dev] shops: ${list}`);
      }
      return;
    }
    if (ev.id === "ew:npc") {
      const player = asPlayer(ev.sourceEntity);
      if (!player) return;
      if (ev.message === "bank") void openBank(player, ledger);
      if (ev.message === "dealer") void openDealer(player, ledger);
      if (ev.message === "commons") void openCommons(player, ledger, bizState, pricesState);
      if (ev.message === "wallet") void openWallet(player);
      if (ev.message.startsWith("shop ")) {
        const trade = ev.message.slice(5).trim();
        const id = `cpu_${trade}`;
        if (bizState.byId[id]) void openStorefront(player, ledger, bizState, pricesState, id);
      }
    }
  });
  world3.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    console.log("[ew] playerInteractWithEntity beforeEvent fired");
    const tags = ev.target.getTags();
    if (tags.includes("ew:npc_bank")) {
      ev.cancel = true;
      const player = ev.player;
      system3.run(() => void openBank(player, ledger));
    } else if (tags.includes("ew:npc_dealer")) {
      ev.cancel = true;
      const player = ev.player;
      system3.run(() => void openDealer(player, ledger));
    } else if (tags.includes("ew:npc_commons")) {
      ev.cancel = true;
      const player = ev.player;
      system3.run(() => void openCommons(player, ledger, bizState, pricesState));
    } else {
      const shopTag = tags.find((t) => t.startsWith("ew:shop_"));
      if (shopTag) {
        ev.cancel = true;
        const trade = shopTag.slice("ew:shop_".length);
        const id = `cpu_${trade}`;
        if (bizState.byId[id]) {
          const player = ev.player;
          system3.run(() => void openStorefront(player, ledger, bizState, pricesState, id));
        } else {
          console.warn(`[ew] shop tag ${shopTag} has no business (known: ${Object.keys(bizState.byId).join(",")})`);
        }
      }
    }
  });
  world3.afterEvents.itemUse.subscribe((ev) => {
    if (ev.itemStack.typeId === "ew:wallet") void openWallet(ev.source);
  });
  const tradeNames = listCpuBusinesses(bizState).map((b) => tradeDef(b.trade).name).join(", ");
  console.log(`[ew] Economy World Phase C booted. CPU shops: ${tradeNames}`);
}
system3.run(boot);
