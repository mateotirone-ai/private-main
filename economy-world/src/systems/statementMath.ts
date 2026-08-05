import type { JournalEntry } from "../core/ledger";
import { merids } from "../ui/theme";

export interface StatementLine {
  label: string;
  positive: boolean;
}

function description(entry: JournalEntry, account: string): string {
  switch (entry.tag) {
    case "sink:medical":
      return "Medical bill";
    case "sink:fee":
      return "Transfer fee";
    case "sink:buyout":
      return "Business purchase";
    case "sink:construction":
      return "Business upgrade";
    case "owner:capital":
      return entry.from === account ? "Business deposit" : "Owner funding";
    case "owner:collect":
      return entry.to === account ? "Business earnings" : "Owner withdrawal";
    case "bank:transfer":
      return entry.to === account ? "Transfer received" : "Transfer sent";
    case "shop:buy":
      return "Store purchase";
    case "mint:dealer":
      return "Commodity sale";
    case "mint:stipend":
      return "Stipend";
    case "mint:immigration":
      return "Arrival grant";
  }
  if (entry.kind === "cashIn") return "Cash deposit";
  if (entry.kind === "cashOut") return "Cash withdrawal";
  if (entry.kind === "mint") return "Account credit";
  if (entry.kind === "sink") return "Account charge";
  if (entry.kind === "transfer") {
    return entry.to === account ? "Payment received" : "Payment sent";
  }
  return "Account activity";
}

export function statementLine(
  entry: JournalEntry,
  account: string
): StatementLine {
  const positive =
    entry.kind === "mint" ||
    entry.kind === "cashIn" ||
    (entry.kind === "transfer" && entry.to === account);
  return {
    label: `${description(entry, account)} — ${merids(entry.amount)}`,
    positive,
  };
}
