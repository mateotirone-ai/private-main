import { describe, expect, it } from "vitest";
import {
  DEV_COMMANDS,
  devHelpLines,
  parseDevCommand,
} from "../src/dev/commands";

describe("developer command registry", () => {
  it("parses every registered command from its usage example", () => {
    for (const command of DEV_COMMANDS) {
      const sample = command.usage
        .replace("<trade|businessId>", "bakery")
        .replace("<trade>", "bakery");
      expect(parseDevCommand(sample)?.id).toBe(command.id);
    }
  });

  it("renders every command in grouped help", () => {
    const help = devHelpLines().join("\n");
    for (const command of DEV_COMMANDS) {
      expect(help).toContain(`/scriptevent ew:dev ${command.usage}`);
    }
    expect(help).toContain("Phase A");
    expect(help).toContain("Phase E");
    expect(help).toContain("Phase G");
  });

  it("rejects missing arguments and unknown commands", () => {
    expect(parseDevCommand("shop")).toBeUndefined();
    expect(parseDevCommand("not-a-command")).toBeUndefined();
    expect(parseDevCommand("seedtown starter")?.argument).toBe("starter");
  });
});
