import type { Step, Workflow } from "../types";
import { pageMatches, stateMatches } from "./stepEngine";

export type ReconciledStep = {
  step: Step;
  index: number;
};

export const reconcileStep = (
  workflow: Workflow | null,
  page: string,
  state: Record<string, any> = {}
): ReconciledStep | null => {
  if (!workflow) {
    return null;
  }
  const steps = workflow.steps || [];
  if (!steps.length) {
    return null;
  }

  const candidates: ReconciledStep[] = [];
  for (let idx = 0; idx < steps.length; idx += 1) {
    const step = steps[idx];
    if (!pageMatches(step, page)) {
      continue;
    }
    if (!stateMatches(step.state, state)) {
      continue;
    }
    candidates.push({ step, index: idx });
  }

  if (!candidates.length) {
    return null;
  }

  const active = candidates.find((item) => item.step.status === "active");
  if (active) {
    return active;
  }

  const pending = candidates.find(
    (item) => !item.step.status || item.step.status === "pending"
  );
  if (pending) {
    return pending;
  }

  return candidates[candidates.length - 1];
};
