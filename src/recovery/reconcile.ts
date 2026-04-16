import type { DomAdapter } from "../adapter/dom";
import type { Workflow } from "../core/types";

export const reconcileStepIndex = (
  workflow: Workflow,
  currentIndex: number,
  adapter: DomAdapter
): number | null => {
  const steps = workflow.steps;
  if (!steps.length) {
    return null;
  }

  const start = Math.max(0, Math.min(currentIndex, steps.length - 1));

  for (let offset = 0; offset < steps.length; offset += 1) {
    const forward = start + offset;
    if (forward < steps.length && adapter.canResolveStep(steps[forward])) {
      return forward;
    }

    const backward = start - offset;
    if (backward >= 0 && adapter.canResolveStep(steps[backward])) {
      return backward;
    }
  }

  return null;
};
