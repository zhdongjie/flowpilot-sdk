import type { DomAdapter } from "../adapter/dom";
import type { Workflow } from "../core/types";
import type { RecoveryStrategy } from "./recovery";

export const reconcileStepIndex = (
  workflow: Workflow,
  currentIndex: number,
  strategy: RecoveryStrategy,
  adapter: DomAdapter,
  page = adapter.getCurrentPage()
): number | null => {
  const steps = workflow.steps;
  if (!steps.length) {
    return null;
  }

  if (strategy.type === "reset") {
    return findNearestResolvableStep(steps, 0, adapter, page);
  }

  if (
    strategy.type === "retry" &&
    currentIndex >= 0 &&
    currentIndex < steps.length &&
    adapter.canResolveStep(steps[currentIndex], page)
  ) {
    return currentIndex;
  }

  const start = Math.max(0, Math.min(currentIndex, steps.length - 1));
  return findNearestResolvableStep(steps, start, adapter, page);
};

const findNearestResolvableStep = (
  steps: Workflow["steps"],
  start: number,
  adapter: DomAdapter,
  page: string
) => {
  for (let offset = 0; offset < steps.length; offset += 1) {
    const forward = start + offset;
    if (forward < steps.length && adapter.canResolveStep(steps[forward], page)) {
      return forward;
    }

    if (offset === 0) {
      continue;
    }

    const backward = start - offset;
    if (backward >= 0 && adapter.canResolveStep(steps[backward], page)) {
      return backward;
    }
  }

  return null;
};
