/**
 * Service engine: CPU customer needs, active fulfillment, margin bonus.
 * Customer hosts are tagged `ew:service_<trade>`.
 */
import { world, type Player } from "@minecraft/server";
import { balance, mint, transfer, type LedgerState } from "../core/ledger";
import { loadBlob, saveBlob } from "../core/state";
import { currentTick, every } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { tradeDef } from "../content/trades";
import { confirmTxn } from "../ui/patterns";
import { actionbar } from "../ui/toast";
import { feedback } from "../ui/feedback";
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
  createCustomerRequest,
  type CustomerRequest,
  type ServiceHost,
} from "./serviceMath";

export interface ServiceState {
  schema: 2;
  hosts: Record<string, ServiceHost>;
  requests: Record<string, CustomerRequest>;
}

const KEY = "ew:service";
const CUSTOMER_ACCOUNT = "sys:customers";

export function emptyService(): ServiceState {
  return { schema: 2, hosts: {}, requests: {} };
}

export function loadService(): ServiceState {
  const state = loadBlob<ServiceState>(KEY);
  return state?.schema === 2 ? state : emptyService();
}

export function saveService(state: ServiceState): void {
  saveBlob(KEY, state);
}

export function registerServiceHost(
  state: ServiceState,
  hostId: string,
  trade: string
): ServiceHost {
  tradeDef(trade);
  const host = { id: hostId, trade };
  state.hosts[hostId] = host;
  saveService(state);
  return host;
}

function discoverLoadedServiceHosts(state: ServiceState): void {
  const dimensions = new Map(
    world.getAllPlayers().map((player) => [player.dimension.id, player.dimension])
  );
  for (const dimension of dimensions.values()) {
    for (const entity of dimension.getEntities()) {
      const serviceTag = entity
        .getTags()
        .find((tag) => tag.startsWith("ew:service_"));
      if (!serviceTag) continue;
      const trade = serviceTag.slice("ew:service_".length);
      try {
        registerServiceHost(state, entity.id, trade);
      } catch {
        console.warn(`[ew] ignored unknown service host trade: ${trade}`);
      }
    }
  }
}

export function forceSpawnCustomerNeed(
  state: ServiceState,
  trade: string,
  tick: number
): CustomerRequest {
  discoverLoadedServiceHosts(state);
  const matchingHosts = Object.values(state.hosts).filter(
    (candidate) => candidate.trade === trade
  );
  const host =
    matchingHosts.find((candidate) => !candidate.id.startsWith("dev:")) ??
    matchingHosts[0] ??
    registerServiceHost(state, `dev:${trade}`, trade);
  const request = createCustomerRequest(
    host,
    tradeDef(trade).good,
    matrix.work.service.requestQty,
    tick
  );
  state.requests[host.id] = request;
  saveService(state);
  return request;
}

export function spawnServiceNeeds(state: ServiceState, tick: number): void {
  for (const host of Object.values(state.hosts)) {
    if (state.requests[host.id]) continue;
    state.requests[host.id] = createCustomerRequest(
      host,
      tradeDef(host.trade).good,
      matrix.work.service.requestQty,
      tick
    );
  }
  saveService(state);
}

export function startServiceJob(state: ServiceState): void {
  discoverLoadedServiceHosts(state);
  spawnServiceNeeds(state, currentTick());
  console.log(
    `[ew] service need spawner registered every ${matrix.work.service.spawnEveryTicks} ticks`
  );
  every(
    "service:customers",
    matrix.work.service.spawnEveryTicks,
    (tick) => {
      discoverLoadedServiceHosts(state);
      spawnServiceNeeds(state, tick);
    }
  );
}

export async function openServiceCustomer(
  player: Player,
  ledger: LedgerState,
  service: ServiceState,
  businesses: BusinessesState,
  prices: PricesState,
  employment: EmploymentState,
  trade: string,
  hostId = `dev:${trade}`
): Promise<void> {
  registerServiceHost(service, hostId, trade);
  const businessId = `cpu_${trade}`;
  const request = service.requests[hostId];
  const business = businesses.byId[businessId];
  if (!request || !business) {
    feedback(player, "No customer is waiting.", "info");
    return;
  }
  if (business.storage < request.qty) {
    feedback(player, "The requested stock is unavailable.", "caution");
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
    const progress = recordEmployeeOutput(employment, player.id, request.qty);
    saveEmployment(employment);
    if (progress) {
      actionbar(
        player,
        `${tradeDef(trade).name} · +${progress.increment} · total ${progress.total}`,
        "info"
      );
    }
  }
  delete service.requests[hostId];
  saveService(service);
  saveBusinesses(businesses);
  savePrices(prices);
  feedback(player, `Order served: ${merids(total)}`, "gain");
}
