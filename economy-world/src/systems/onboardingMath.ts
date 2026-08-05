export interface OnboardingProgress {
  jobBoardVisited: boolean;
  clockedIn: boolean;
  firstOutput: boolean;
  firstPaycheckClaimed: boolean;
}

export function onboardingComplete(progress: OnboardingProgress): boolean {
  return (
    progress.jobBoardVisited &&
    progress.clockedIn &&
    progress.firstOutput &&
    progress.firstPaycheckClaimed
  );
}

export function onboardingChecklistLine(
  progress: OnboardingProgress
): string | undefined {
  if (onboardingComplete(progress)) return undefined;
  if (!progress.jobBoardVisited) return "Checklist: find the Jobs Board";
  if (!progress.clockedIn) return "Checklist: clock into any job";
  if (!progress.firstOutput) return "Checklist: produce one unit";
  return "Checklist: return and clock out";
}
