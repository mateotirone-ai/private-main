/**
 * Narrator-voice string table — Meridian HR-department-of-a-utopia tone
 * (master design §12.5 / UI law §5). No raw error strings at call sites.
 */

export const Voice = {
  // bank
  bankWelcome: "Meridian Central Bank. Your money is safe. Your pockets are not.",
  depositOk: (n: string) => `Deposited ${n}. Pockets lighter. Civilization heavier.`,
  depositEmpty: "Nothing to deposit. The ledger declines empty gestures.",
  withdrawOk: (n: string) => `Withdrawn ${n}. Try not to die with it.`,
  withdrawFail: "Insufficient balance. The vault is not a suggestion box.",
  transferOk: (n: string, to: string) => `Transferred ${n} to ${to}. Traceable. Regrettably civilized.`,
  transferFailFunds: "Balance insufficient for the amount plus the transfer fee.",
  transferFailSelf: "You already have that money. The fee would be comedy.",
  transferFailTarget: "Recipient not found. Online players only — for now.",
  transferNoPlayers: "No one else is online. Cash hand-offs remain an option.",
  statementEmpty: "No recent activity. Either thrift or a very new account.",
  feeLine: (fee: string) => `Flat transfer fee: ${fee}`,

  // dealer
  dealerWelcome: "Assay window. Gold and diamonds become merids. Everything else is scenery.",
  dealerSold: (good: string, qty: number, n: string) =>
    `Assayed ${qty} ${good}. Issued ${n}. Fort Knox sends its regards.`,
  dealerEmpty: (good: string) => `No ${good} on you. The window does not accept vibes.`,
  dealerSoft: "Volume is noted. Today's price has… adjusted.",
  pricesBoard: "Today's mint window. Softened by volume. Published because secrets are for bandits.",

  // stipend
  stipendOk: (n: string) => `Resettlement grant: ${n}. One mistake's worth. Spend wisely.`,
  stipendAlready: "Stipend already claimed. Meridian remembers.",

  // generic
  cancelled: "Declined. The Federation remains unimpressed, but polite.",
  error: "That didn't work. Anomaly logged. Smile for the audit.",
  reserved: "Reserved for future expansion. Please admire the empty lot.",
} as const;
