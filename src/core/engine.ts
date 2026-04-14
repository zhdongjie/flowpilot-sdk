import type { Step, StepContext, Workflow } from "../types";

const findStepIndex = (steps: Step[], stepNumber: number) =>
  steps.findIndex((item) => item.step === stepNumber);

const stateMatches = (
  stepState: Record<string, any> | undefined,
  state: Record<string, any> | undefined
) => {
  if (!stepState || !state) {
    return true;
  }
  return Object.keys(stepState).every((key) => state[key] === stepState[key]);
};

export const resolveNextStep = (
  workflow: Workflow,
  context: StepContext = {}
): Step | null => {
  const steps = workflow.steps || [];
  if (!steps.length) {
    return null;
  }

  if (typeof context.currentStep === "number") {
    const currentIndex = findStepIndex(steps, context.currentStep);
    if (currentIndex >= 0 && currentIndex + 1 < steps.length) {
      for (let idx = currentIndex + 1; idx < steps.length; idx += 1) {
        const candidate = steps[idx];
        if (stateMatches(candidate.state, context.state)) {
          return candidate;
        }
      }
      return null;
    }
    return null;
  }

  if (context.currentPage) {
    const match = steps.find(
      (step) =>
        step.page === context.currentPage &&
        stateMatches(step.state, context.state)
    );
    if (match) {
      return match;
    }
  }

  const first = steps.find((step) => stateMatches(step.state, context.state));
  return first || steps[0] || null;
};
