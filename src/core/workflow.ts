import { normalizeStep } from "./step";
import type { Workflow } from "./types";

const normalizeWorkflow = (raw: any): Workflow | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : "default";
  const sourceSteps = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = sourceSteps.map((step, idx) => normalizeStep(step, idx));

  if (!steps.length) {
    return null;
  }

  return { id, steps };
};

export const normalizeWorkflows = (input: any): Workflow[] => {
  const rawList = Array.isArray(input) ? input : [input];
  const normalized = rawList
    .map((item) => normalizeWorkflow(item))
    .filter((item): item is Workflow => Boolean(item));

  if (normalized.length) {
    return normalized;
  }

  return [];
};
