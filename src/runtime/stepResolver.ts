import type { Step } from "../types";
import { pageMatches } from "./stepEngine";

export type ResolvedStep = {
  step: Step;
  index: number;
};

export const resolveStep = (
  steps: Step[] = [],
  currentStepIndex: number | null,
  currentPage: string,
  matcher?: (step: Step) => boolean
): ResolvedStep | null => {
  if (!steps.length) {
    return null;
  }

  const isMatch =
    matcher ?? ((candidate: Step) => pageMatches(candidate, currentPage));

  const startIndex =
    typeof currentStepIndex === "number" ? currentStepIndex + 1 : 0;

  for (let idx = startIndex; idx < steps.length; idx += 1) {
    const candidate = steps[idx];
    if (isMatch(candidate)) {
      return { step: candidate, index: idx };
    }
  }

  for (let idx = 0; idx < steps.length; idx += 1) {
    const candidate = steps[idx];
    if (isMatch(candidate)) {
      return { step: candidate, index: idx };
    }
  }

  return null;
};
