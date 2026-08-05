export type DevPhase = "Core" | "A" | "B" | "C" | "D" | "E" | "F";

export type DevCommandId =
  | "help"
  | "grant"
  | "audit"
  | "stipend"
  | "bank"
  | "dealer"
  | "commons"
  | "wallet"
  | "jobs"
  | "givewallet"
  | "shop"
  | "shops"
  | "produce"
  | "zone"
  | "publiczone"
  | "station"
  | "service"
  | "owner"
  | "need";

export interface DevCommandSpec {
  id: DevCommandId;
  phase: DevPhase;
  usage: string;
  description: string;
  argument?: string;
}

/**
 * Single source of truth for ew:dev dispatch and help output.
 * Add every new dev command here before wiring its handler.
 */
export const DEV_COMMANDS: readonly DevCommandSpec[] = [
  { id: "help", phase: "Core", usage: "help", description: "List all dev commands" },
  { id: "grant", phase: "A", usage: "grant", description: "Mint test merids" },
  { id: "audit", phase: "A", usage: "audit", description: "Run ledger conservation audit" },
  { id: "stipend", phase: "A", usage: "stipend", description: "Claim the test stipend" },
  { id: "bank", phase: "B", usage: "bank", description: "Open the bank" },
  { id: "dealer", phase: "B", usage: "dealer", description: "Open the commodity dealer" },
  { id: "wallet", phase: "B", usage: "wallet", description: "Open wallet controls" },
  { id: "givewallet", phase: "B", usage: "givewallet", description: "Grant a wallet item" },
  { id: "commons", phase: "C", usage: "commons", description: "Open commons sales" },
  { id: "shop", phase: "C", usage: "shop <trade>", description: "Open a trade storefront", argument: "trade" },
  { id: "shops", phase: "C", usage: "shops", description: "List CPU storefront trades" },
  { id: "produce", phase: "C", usage: "produce", description: "Force one CPU production tick" },
  { id: "jobs", phase: "D", usage: "jobs", description: "Open the job board" },
  { id: "zone", phase: "D", usage: "zone <trade>", description: "Stamp an employee extraction pit", argument: "trade" },
  { id: "publiczone", phase: "D", usage: "publiczone <trade>", description: "Stamp a public extraction pit", argument: "trade" },
  { id: "station", phase: "D", usage: "station <trade>", description: "Open a processing station", argument: "trade" },
  { id: "service", phase: "D", usage: "service <trade>", description: "Open a service host", argument: "trade" },
  { id: "need", phase: "D", usage: "need <trade>", description: "Force one customer need", argument: "trade" },
  { id: "owner", phase: "E", usage: "owner <trade|businessId>", description: "Open buyout or owner management", argument: "target" },
] as const;

export interface ParsedDevCommand {
  id: DevCommandId;
  argument?: string;
  spec: DevCommandSpec;
}

export function parseDevCommand(message: string): ParsedDevCommand | undefined {
  const clean = message.trim();
  for (const spec of DEV_COMMANDS) {
    if (!spec.argument && clean === spec.id) return { id: spec.id, spec };
    if (!spec.argument || !clean.startsWith(`${spec.id} `)) continue;
    const argument = clean.slice(spec.id.length + 1).trim();
    if (argument) return { id: spec.id, argument, spec };
  }
  return undefined;
}

export function devHelpLines(): string[] {
  const phases: DevPhase[] = ["Core", "A", "B", "C", "D", "E", "F"];
  const lines: string[] = ["§6Economy World dev commands"];
  for (const phase of phases) {
    const commands = DEV_COMMANDS.filter((command) => command.phase === phase);
    if (!commands.length) continue;
    lines.push(`§ePhase ${phase}`);
    for (const command of commands) {
      lines.push(`§f/scriptevent ew:dev ${command.usage}§7 — ${command.description}`);
    }
  }
  return lines;
}
