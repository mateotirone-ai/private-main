import { describe, expect, it } from "vitest";
import {
  onboardingChecklistLine,
  onboardingComplete,
} from "../src/systems/onboardingMath";

describe("onboarding checklist", () => {
  it("advances through the expected first-paycheck sequence", () => {
    expect(
      onboardingChecklistLine({
        jobBoardVisited: false,
        clockedIn: false,
        firstOutput: false,
        firstPaycheckClaimed: false,
      })
    ).toBe("Checklist: find the Jobs Board");
    expect(
      onboardingChecklistLine({
        jobBoardVisited: true,
        clockedIn: false,
        firstOutput: false,
        firstPaycheckClaimed: false,
      })
    ).toBe("Checklist: clock into any job");
    expect(
      onboardingChecklistLine({
        jobBoardVisited: true,
        clockedIn: true,
        firstOutput: false,
        firstPaycheckClaimed: false,
      })
    ).toBe("Checklist: produce one unit");
    expect(
      onboardingChecklistLine({
        jobBoardVisited: true,
        clockedIn: true,
        firstOutput: true,
        firstPaycheckClaimed: false,
      })
    ).toBe("Checklist: return and clock out");
  });

  it("marks completion only after first paycheck", () => {
    expect(
      onboardingComplete({
        jobBoardVisited: true,
        clockedIn: true,
        firstOutput: true,
        firstPaycheckClaimed: false,
      })
    ).toBe(false);
    expect(
      onboardingComplete({
        jobBoardVisited: true,
        clockedIn: true,
        firstOutput: true,
        firstPaycheckClaimed: true,
      })
    ).toBe(true);
    expect(
      onboardingChecklistLine({
        jobBoardVisited: true,
        clockedIn: true,
        firstOutput: true,
        firstPaycheckClaimed: true,
      })
    ).toBeUndefined();
  });
});
