import { normalizeStep } from "./step";
import type { Workflow } from "./types";

const normalizeWorkflow = (raw: any, index: number): Workflow | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : index === 0
        ? "default"
        : `workflow_${index + 1}`;
  const sourceSteps = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = sourceSteps.map((step, idx) => normalizeStep(step, idx));

  if (!steps.length) {
    return null;
  }

  return Object.freeze({
    id,
    steps: Object.freeze(steps.slice()),
  });
};

export const normalizeWorkflows = (input: any): Workflow[] => {
  const rawList = Array.isArray(input) ? input : [input];
  const normalized = rawList
    .map((item, index) => normalizeWorkflow(item, index))
    .filter((item): item is Workflow => Boolean(item));

  if (normalized.length) {
    return normalized;
  }

  return [];
};
