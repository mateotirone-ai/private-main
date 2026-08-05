import { formatAmount } from "./theme";

export function insufficientFundsMessage(
  subject: string,
  needed: number,
  available: number
): string {
  return `${subject} can't cover this — ${formatAmount(needed)} needed, ${formatAmount(available)} available.`;
}
