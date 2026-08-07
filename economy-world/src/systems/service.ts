/**
 * Service engine: CPU customer needs, active fulfillment, margin bonus.
 * Customer hosts are tagged `ew:service_<trade>`.
 */
import { world, type Player, type Vector3 } from "@minecraft/server";
import { balance, mint, transfer, type LedgerState } from "../core/ledger";
import { loadBlob, saveBlob } from "../core/state";
import { currentTick, every } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { tradeDef } from "../content/trades";
import { confirmTxn } from "../ui/patterns";
import { setActionbarContext } from "../ui/toast";
import { feedback } from "../ui/feedback";
import { merids } from "../ui/theme";
import { playerAccount } from "./bank";
import {
  bizAccount,
  effectiveBusinessUnitPrice,
  storefrontBusinessForTrade,
  saveBusinesses,
  type BusinessesState,
} from "./businesses";
import { businessIsOpen } from "./businessMath";
import {
  employmentSession,
  EmploymentSession,
  recordEmployeeOutput,
  saveEmployment,
  type EmploymentState,
} from "./employment";
import { currentUnitPrice, adjustStock, savePrices, type PricesState } from "./pricing";
import { noteBusinessRevenue } from "./ownership";
import {
  serviceOrderTotal,
  claimCustomerNeed,
  canFulfillClaimedNeed,
  createCustomerRequest,
  releaseCustomerNeedClaim,
  rollRequestQty,
  type ServiceClaim,
  type CustomerRequest,
  type ServiceHost,
} from "./serviceMath";
import { noteOnboardingOutput } from "./onboarding";

export interface ServiceState {
  schema: 3;
  hosts: Record<string, ServiceHost>;
  requests: Record<string, CustomerRequest>;
  claims: Record<string, ServiceClaim>;
}

const KEY = "ew:service";
const CUSTOMER_ACCOUNT = "sys:customers";

export function emptyService(): ServiceState {
  return { schema: 3, hosts: {}, requests: {}, claims: {} };
}

export function loadService(): ServiceState {
  const state = loadBlob<ServiceState>(KEY);
  if (!state) return emptyService();
  const normalized: ServiceState = {
    schema: 3,
    hosts: state.hosts ?? {},
    requests: state.requests ?? {},
    claims: state.claims ?? {},
  };
  for (const hostId of Object.keys(normalized.claims)) {
    if (!normalized.requests[hostId]) delete normalized.claims[hostId];
  }
  return normalized;
}

export function saveService(state: ServiceState): void {
  saveBlob(KEY, state);
}

export function registerServiceHost(
  state: ServiceState,
  hostId: string,
  trade: string,
  dimensionId: string,
  location: Vector3,
  speaker: string,
  businessId?: string
): ServiceHost {
  tradeDef(trade);
  const host = {
    id: hostId,
    trade,
    businessId,
    dimensionId,
    location: {
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z),
    },
    speaker,
  };
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
        registerServiceHost(
          state,
          entity.id,
          trade,
          dimension.id,
          entity.location,
          entity.nameTag || tradeDef(trade).name
        );
      } catch {
        console.warn(`[ew] ignored unknown service host trade: ${trade}`);
      }
    }
  }
}

export function forceSpawnCustomerNeed(
  state: ServiceState,
  trade: string,
  tick: number,
  sourcePlayer?: Player
): CustomerRequest {
  discoverLoadedServiceHosts(state);
  const matchingHosts = Object.values(state.hosts).filter(
    (candidate) => candidate.trade === trade
  );
  const host =
    matchingHosts.find((candidate) => !candidate.id.startsWith("dev:")) ??
    matchingHosts[0] ??
    registerServiceHost(
      state,
      `dev:${trade}`,
      trade,
      sourcePlayer?.dimension.id ?? "minecraft:overworld",
      sourcePlayer?.location ?? { x: 0, y: 64, z: 0 },
      tradeDef(trade).name
    );
  const request = createCustomerRequest(
    host,
    tradeDef(trade).good,
    rollRequestQty({
      minQty: matrix.work.service.requestQtyMin,
      maxQty: matrix.work.service.requestQtyMax,
      largeOrderChance: matrix.work.service.largeOrderChance,
      largeMinQty: matrix.work.service.largeOrderQtyMin,
      largeMaxQty: matrix.work.service.largeOrderQtyMax,
    }),
    tick
  );
  state.requests[host.id] = request;
  delete state.claims[host.id];
  saveService(state);
  return request;
}

function serviceStaffPlayers(
  businessId: string,
  businesses: BusinessesState,
  employment: EmploymentState
): Player[] {
  const owner = businesses.byId[businessId]?.owner;
  const staff = new Map<string, Player>();
  for (const player of world.getAllPlayers()) {
    const ownerMatch =
      owner && owner !== "cpu" && (owner === player.id || owner === `p:${player.id}`);
    if (ownerMatch) {
      staff.set(player.id, player);
      continue;
    }
    const session: EmploymentSession | undefined = employment.sessions[player.id];
    if (session?.businessId === businessId) staff.set(player.id, player);
  }
  return [...staff.values()];
}

function displayGood(good: string): string {
  if (good === "log") return "logs";
  return good.replaceAll("_", " ");
}

function notifyNeed(
  request: CustomerRequest,
  host: ServiceHost,
  businesses: BusinessesState,
  employment: EmploymentState
): void {
  const staff = serviceStaffPlayers(request.businessId, businesses, employment);
  if (!staff.length) return;
  const noun = request.qty === 1 ? request.good : `${request.good}`;
  const line = `Customer waiting — ${request.qty} ${noun}.`;
  for (const player of staff) {
    if (player.dimension.id !== host.dimensionId) continue;
    player.playSound("block.bell.hit", { location: host.location });
    setActionbarContext(
      player,
      "service",
      line,
      "caution",
      currentTick() + matrix.ui.hud.serviceAlertTicks
    );
  }
}

export function spawnServiceNeeds(
  state: ServiceState,
  businesses: BusinessesState,
  employment: EmploymentState,
  tick: number
): void {
  for (const host of Object.values(state.hosts)) {
    host.businessId =
      storefrontBusinessForTrade(businesses, host.trade)?.id ?? `cpu_${host.trade}`;
  }
  for (const host of Object.values(state.hosts)) {
    const business = host.businessId
      ? businesses.byId[host.businessId]
      : undefined;
    if (business && !businessIsOpen(business)) continue;
    if (state.requests[host.id]) continue;
    const request = createCustomerRequest(
      host,
      tradeDef(host.trade).good,
      rollRequestQty({
        minQty: matrix.work.service.requestQtyMin,
        maxQty: matrix.work.service.requestQtyMax,
        largeOrderChance: matrix.work.service.largeOrderChance,
        largeMinQty: matrix.work.service.largeOrderQtyMin,
        largeMaxQty: matrix.work.service.largeOrderQtyMax,
      }),
      tick
    );
    state.requests[host.id] = request;
    delete state.claims[host.id];
    notifyNeed(request, host, businesses, employment);
  }
  saveService(state);
}

export function startServiceJob(
  state: ServiceState,
  businesses: BusinessesState,
  employment: EmploymentState
): void {
  discoverLoadedServiceHosts(state);
  spawnServiceNeeds(state, businesses, employment, currentTick());
  console.log(
    `[ew] service need spawner registered every ${matrix.work.service.spawnEveryTicks} ticks`
  );
  every(
    "service:customers",
    matrix.work.service.spawnEveryTicks,
    (tick) => {
      discoverLoadedServiceHosts(state);
      spawnServiceNeeds(state, businesses, employment, tick);
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
  const existingHost = service.hosts[hostId];
  if (!existingHost) {
    registerServiceHost(
      service,
      hostId,
      trade,
      player.dimension.id,
      player.location,
      tradeDef(trade).name,
      storefrontBusinessForTrade(businesses, trade)?.id
    );
  }
  const businessId = `cpu_${trade}`;
  const request = service.requests[hostId];
  const requestBusinessId = request?.businessId ?? businessId;
  const business =
    businesses.byId[requestBusinessId] ??
    storefrontBusinessForTrade(businesses, trade);
  if (!request || !business) {
    feedback(player, "No customer is waiting.", "info");
    return;
  }
  if (!businessIsOpen(business)) {
    feedback(
      player,
      `${tradeDef(business.trade).name} is closed for renovation.`,
      "caution"
    );
    return;
  }
  if (
    !claimCustomerNeed(service.claims, service.requests, hostId, player.id, currentTick())
  ) {
    feedback(player, "Another worker is already serving this customer.", "caution");
    return;
  }
  saveService(service);
  if (business.storage < request.qty) {
    releaseCustomerNeedClaim(service.claims, hostId, player.id);
    saveService(service);
    feedback(player, "The requested stock is unavailable.", "caution");
    return;
  }

  const unit = effectiveBusinessUnitPrice(
    business,
    currentUnitPrice(prices, request.good)
  );
  const total = serviceOrderTotal(
    unit,
    request.qty,
    matrix.work.service.activeMarginBonus
  );
  const before = balance(ledger, playerAccount(player));
  const ok = await confirmTxn(player, {
    title: "Serve customer",
    facts: [
      `Need: ${request.qty} ${displayGood(request.good)}`,
      `Business: ${tradeDef(trade).name}`,
      `Order total: ${merids(total)}`,
    ],
    lines: [],
    balanceBefore: before,
    balanceAfter: before,
    narrator: "Active service earns the better margin.",
  });
  if (!ok) {
    releaseCustomerNeedClaim(service.claims, hostId, player.id);
    saveService(service);
    return;
  }
  const liveRequest = canFulfillClaimedNeed(
    service.claims,
    service.requests,
    hostId,
    player.id
  );
  const liveBusiness = liveRequest
    ? businesses.byId[liveRequest.businessId] ??
      storefrontBusinessForTrade(businesses, trade)
    : undefined;
  if (!liveRequest || !liveBusiness) {
    releaseCustomerNeedClaim(service.claims, hostId, player.id);
    saveService(service);
    feedback(player, "That customer was already handled.", "caution");
    return;
  }
  if (!businessIsOpen(liveBusiness)) {
    releaseCustomerNeedClaim(service.claims, hostId, player.id);
    saveService(service);
    feedback(
      player,
      `${tradeDef(liveBusiness.trade).name} is closed for renovation.`,
      "caution"
    );
    return;
  }
  if (liveBusiness.storage < liveRequest.qty) {
    releaseCustomerNeedClaim(service.claims, hostId, player.id);
    saveService(service);
    feedback(player, "The requested stock is unavailable.", "caution");
    return;
  }

  try {
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
      bizAccount(liveBusiness.id),
      total,
      currentTick(),
      "service:customer"
    );
    noteBusinessRevenue(businesses, liveBusiness.id, total);
    liveBusiness.storage -= liveRequest.qty;
    adjustStock(prices, liveRequest.good, -liveRequest.qty);
    const session = employmentSession(employment, player.id);
    if (session?.businessId === liveBusiness.id) {
      const progress = recordEmployeeOutput(employment, player.id, liveRequest.qty);
      saveEmployment(employment);
      if (progress) {
        noteOnboardingOutput(player);
        setActionbarContext(
          player,
          "employment",
          `${tradeDef(trade).name} · +${progress.increment} · total ${progress.total}`,
          "info"
        );
      }
    }
    delete service.requests[hostId];
    delete service.claims[hostId];
    saveService(service);
    saveBusinesses(businesses);
    savePrices(prices);
    feedback(player, `Order served: ${merids(total)}`, "gain");
  } catch (error) {
    releaseCustomerNeedClaim(service.claims, hostId, player.id);
    saveService(service);
    console.error(`[ew] service fulfillment failed: ${error}`);
    feedback(player, "Service order failed to settle.", "error");
  }
}
