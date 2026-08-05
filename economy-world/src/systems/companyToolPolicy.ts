export interface CompanyToolMarker {
  ownerId: string;
  businessId: string;
  trade: string;
  tier: number;
  quality: number;
}

export function encodeCompanyToolMarker(marker: CompanyToolMarker): string {
  return JSON.stringify(marker);
}

export function decodeCompanyToolMarker(
  value: unknown
): CompanyToolMarker | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<CompanyToolMarker>;
    if (
      typeof parsed.ownerId !== "string" ||
      typeof parsed.businessId !== "string" ||
      typeof parsed.trade !== "string" ||
      !Number.isInteger(parsed.tier) ||
      !Number.isInteger(parsed.quality)
    ) {
      return undefined;
    }
    return parsed as CompanyToolMarker;
  } catch {
    return undefined;
  }
}

/** Personal tools are unrestricted; company tools only work on matching nodes. */
export function companyToolCanUse(
  marker: CompanyToolMarker | undefined,
  registeredNodeBusinessId: string | undefined,
  playerId?: string
): boolean {
  if (!marker) return true;
  return (
    marker.ownerId === playerId &&
    marker.businessId === registeredNodeBusinessId
  );
}

export function shouldReclaimCompanyTool(
  marker: CompanyToolMarker | undefined,
  playerId: string,
  reason: "clockOut" | "death"
): boolean {
  return Boolean(
    marker && marker.ownerId === playerId && (reason === "clockOut" || reason === "death")
  );
}
