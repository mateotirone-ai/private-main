export type StorefrontOwnershipAction = "buyout" | "manage";

export function storefrontOwnershipAction(
  owner: "cpu" | string,
  playerId: string
): StorefrontOwnershipAction | undefined {
  if (owner === "cpu") return "buyout";
  if (owner === playerId) return "manage";
  return undefined;
}
