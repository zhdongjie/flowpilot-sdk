import type { Step, Workflow } from "../types";

export type StepCandidate = {
  step: Step;
  index: number;
};

type StepContext = {
  currentPage?: string;
  state?: Record<string, any>;
};

export const stateMatches = (
  stepState: Record<string, any> | undefined,
  state: Record<string, any> | undefined
) => {
  if (!stepState || !state) {
    return true;
  }
  return Object.keys(stepState).every((key) => state[key] === stepState[key]);
};

const normalizePage = (value: string) => {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  const cutIndex =
    hashIndex === -1
      ? queryIndex
      : queryIndex === -1
        ? hashIndex
        : Math.min(hashIndex, queryIndex);
  return cutIndex === -1 ? value : value.slice(0, cutIndex);
};

export const pageMatches = (step: Step, currentPage?: string) => {
  if (!step.page) {
    return true;
  }
  if (!currentPage) {
    return false;
  }
  if (step.page.includes("#") || step.page.includes("?")) {
    return step.page === currentPage;
  }
  return normalizePage(currentPage) === step.page;
};

export const isStepEligible = (step: Step, context: StepContext) => {
  return pageMatches(step, context.currentPage) &&
    stateMatches(step.state, context.state);
};

export const findInitialStep = (
  workflow: Workflow,
  context: StepContext
): StepCandidate | null => {
  const steps = workflow.steps || [];
  if (!steps.length) {
    return null;
  }
  if (context.currentPage) {
    for (let idx = 0; idx < steps.length; idx += 1) {
      const candidate = steps[idx];
      if (isStepEligible(candidate, context)) {
        return { step: candidate, index: idx };
      }
    }
  }
  for (let idx = 0; idx < steps.length; idx += 1) {
    const candidate = steps[idx];
    if (stateMatches(candidate.state, context.state)) {
      return { step: candidate, index: idx };
    }
  }
  return steps[0] ? { step: steps[0], index: 0 } : null;
};

export const findNextStep = (
  workflow: Workflow,
  currentStepIndex: number | null,
  context: StepContext
): StepCandidate | null => {
  const steps = workflow.steps || [];
  if (!steps.length) {
    return null;
  }
  const startIndex =
    typeof currentStepIndex === "number" ? currentStepIndex + 1 : 0;
  for (let idx = startIndex; idx < steps.length; idx += 1) {
    const candidate = steps[idx];
    if (isStepEligible(candidate, context)) {
      return { step: candidate, index: idx };
    }
  }
  return null;
};
