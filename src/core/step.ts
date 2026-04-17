import type { Step, StepType } from "./types";

const normalizeType = (value: unknown): StepType => {
  if (value === "click" || value === "form" || value === "route") {
    return value;
  }
  return "click";
};

const normalizeId = (value: unknown, index: number) => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return String(index + 1);
};

const normalizeDescription = (raw: any) => {
  if (typeof raw?.desc === "string" && raw.desc.trim()) {
    return raw.desc.trim();
  }
  if (typeof raw?.action === "string" && raw.action.trim()) {
    return raw.action.trim();
  }
  return undefined;
};

export const normalizeStep = (raw: any, index: number): Step => {
  const typeCandidate =
    raw?.type ?? (Array.isArray(raw?.form) && raw.form.length > 0 ? "form" : "click");
  const desc = normalizeDescription(raw);
  const step: Step = {
    id: normalizeId(raw?.id ?? raw?.step, index),
    type: normalizeType(typeCandidate),
    highlight: typeof raw?.highlight === "string" ? raw.highlight.trim() : "",
    ...(desc ? { desc } : {}),
  };

  return Object.freeze(step);
};
