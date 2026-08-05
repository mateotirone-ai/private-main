export interface OwnershipFirsts {
  firstOwnershipClaimed: boolean;
  firstTierThreeClaimed: boolean;
}

export type OwnershipFirstKey =
  | "firstOwnershipClaimed"
  | "firstTierThreeClaimed";

export function claimOwnershipFirst(
  state: OwnershipFirsts,
  key: OwnershipFirstKey
): boolean {
  if (state[key]) return false;
  state[key] = true;
  return true;
}

export function claimBusinessLock(
  locks: Map<string, string>,
  businessId: string,
  playerId: string
): boolean {
  const current = locks.get(businessId);
  if (current && current !== playerId) return false;
  locks.set(businessId, playerId);
  return true;
}

export function releaseBusinessLock(
  locks: Map<string, string>,
  businessId: string,
  playerId: string
): void {
  if (locks.get(businessId) === playerId) locks.delete(businessId);
}
