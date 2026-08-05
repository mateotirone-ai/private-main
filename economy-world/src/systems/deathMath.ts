export interface MedicalBill {
  bank: number;
  carriedCash: number;
  wealth: number;
  flatCharge: number;
  wealthCharge: number;
  due: number;
  charged: number;
  unpaid: number;
}

/** Binding rule: calculate the complete bill and round once at the end. */
export function medicalBill(
  flat: number,
  pctOfWealth: number,
  bank: number,
  carriedCash: number
): MedicalBill {
  if (
    !Number.isFinite(flat) ||
    flat < 0 ||
    !Number.isFinite(pctOfWealth) ||
    pctOfWealth < 0 ||
    !Number.isInteger(bank) ||
    bank < 0 ||
    !Number.isInteger(carriedCash) ||
    carriedCash < 0
  ) {
    throw new Error("invalid medical bill inputs");
  }
  const wealth = bank + carriedCash;
  const due = Math.max(0, Math.round(flat + pctOfWealth * wealth));
  const flatCharge = Math.min(due, Math.round(flat));
  const wealthCharge = due - flatCharge;
  const charged = Math.min(bank, due);
  return {
    bank,
    carriedCash,
    wealth,
    flatCharge,
    wealthCharge,
    due,
    charged,
    unpaid: due - charged,
  };
}

export interface PendingMedicalReceipt extends MedicalBill {
  tick: number;
}

export interface PendingReceiptState {
  pending: Record<string, PendingMedicalReceipt>;
}

export function setPendingReceipt(
  state: PendingReceiptState,
  playerId: string,
  receipt: PendingMedicalReceipt
): void {
  state.pending[playerId] = receipt;
}

export function takePendingReceipt(
  state: PendingReceiptState,
  playerId: string
): PendingMedicalReceipt | undefined {
  const receipt = state.pending[playerId];
  if (receipt) delete state.pending[playerId];
  return receipt;
}
