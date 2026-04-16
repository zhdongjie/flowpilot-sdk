import type { Step, StepType } from "./types";

const normalizeType = (value: unknown): StepType => {
  if (value === "click" || value === "form" || value === "route") {
    return value;
  }
  return "click";
};

export const normalizeStep = (raw: any, index: number): Step => {
  const idCandidate = raw?.id ?? raw?.step;
  const id = typeof idCandidate === "string"
    ? idCandidate
    : typeof idCandidate === "number"
      ? String(idCandidate)
      : String(index + 1);

  const typeCandidate = raw?.type ?? (Array.isArray(raw?.form) && raw.form.length ? "form" : "click");
  const highlight = typeof raw?.highlight === "string" ? raw.highlight : "";
  const desc = typeof raw?.desc === "string"
    ? raw.desc
    : typeof raw?.action === "string"
      ? raw.action
      : undefined;

  return {
    id,
    type: normalizeType(typeCandidate),
    highlight,
    desc,
  };
};
