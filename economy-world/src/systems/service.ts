/**
 * Service engine: CPU customer needs, active fulfillment, margin bonus.
 * Customer hosts are tagged `ew:service_<trade>`.
 */
import type { Player } from "@minecraft/server";
import { balance, mint, transfer, type LedgerState } from "../core/ledger";
import { loadBlob, saveBlob } from "../core/state";
import { currentTick, every } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { workConfig } from "../content/work";
import { tradeDef } from "../content/trades";
import { confirmTxn } from "../ui/patterns";
import { toast } from "../ui/toast";
import { merids } from "../ui/theme";
import { playerAccount } from "./bank";
import {
  bizAccount,
  saveBusinesses,
  type BusinessesState,
} from "./businesses";
import {
  employmentSession,
  recordEmployeeOutput,
  saveEmployment,
  type EmploymentState,
} from "./employment";
import { currentUnitPrice, adjustStock, savePrices, type PricesState } from "./pricing";
import {
  serviceOrderTotal,
  type CustomerRequest,
} from "./serviceMath";

export interface ServiceState {
  schema: 1;
  requests: Record<string, CustomerRequest>;
}

const KEY = "ew:service";
const CUSTOMER_ACCOUNT = "sys:customers";

export function emptyService(): ServiceState {
  return { schema: 1, requests: {} };
}

export function loadService(): ServiceState {
  return loadBlob<ServiceState>(KEY) ?? emptyService();
}

export function saveService(state: ServiceState): void {
  saveBlob(KEY, state);
}

function spawnRequests(state: ServiceState, tick: number): void {
  for (const [trade, cfg] of Object.entries(workConfig.service)) {
    const businessId = `cpu_${trade}`;
    if (state.requests[businessId]) continue;
    state.requests[businessId] = {
      businessId,
      good: cfg.needGood,
      qty: matrix.work.service.requestQty,
      createdTick: tick,
    };
  }
  saveService(state);
}

export function startServiceJob(state: ServiceState): void {
  spawnRequests(state, currentTick());
  every(
    "service:customers",
    matrix.work.service.spawnEveryTicks,
    (tick) => spawnRequests(state, tick)
  );
}

export async function openServiceCustomer(
  player: Player,
  ledger: LedgerState,
  service: ServiceState,
  businesses: BusinessesState,
  prices: PricesState,
  employment: EmploymentState,
  trade: string
): Promise<void> {
  const businessId = `cpu_${trade}`;
  const request = service.requests[businessId];
  const business = businesses.byId[businessId];
  if (!request || !business) {
    toast(player, "No customer is waiting.", "info");
    return;
  }
  if (business.storage < request.qty) {
    toast(player, "The requested stock is unavailable.", "caution");
    return;
  }

  const unit = currentUnitPrice(prices, request.good);
  const total = serviceOrderTotal(
    unit,
    request.qty,
    matrix.work.service.activeMarginBonus
  );
  const before = balance(ledger, playerAccount(player));
  const ok = await confirmTxn(player, {
    title: "Serve customer",
    facts: [
      `Need: ${request.qty} ${request.good}`,
      `Business: ${tradeDef(trade).name}`,
      `Order total: ${merids(total)}`,
    ],
    lines: [],
    balanceBefore: before,
    balanceAfter: before,
    narrator: "Active service earns the better margin.",
  });
  if (!ok) return;

  const customerBalance = balance(ledger, CUSTOMER_ACCOUNT);
  if (customerBalance < total) {
    mint(
      ledger,
      CUSTOMER_ACCOUNT,
      total - customerBalance,
      currentTick(),
      "mint:system"
    );
  }
  transfer(
    ledger,
    CUSTOMER_ACCOUNT,
    bizAccount(businessId),
    total,
    currentTick(),
    "service:customer"
  );
  business.storage -= request.qty;
  adjustStock(prices, request.good, -request.qty);
  const session = employmentSession(employment, player.id);
  if (session?.businessId === businessId) {
    recordEmployeeOutput(employment, player.id, request.qty);
    saveEmployment(employment);
  }
  delete service.requests[businessId];
  saveService(service);
  saveBusinesses(businesses);
  savePrices(prices);
  toast(player, `Order served: ${merids(total)}`, "gain");
}
