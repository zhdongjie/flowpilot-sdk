import type { ActionEvent } from "../behavior/protocol";
import type { Step } from "../core/types";

export type ValidationReason =
  | "ok"
  | "trigger-mismatch"
  | "element-mismatch";

export type ValidationResult = {
  valid: boolean;
  reason: ValidationReason;
};

export const validateStepEvent = (step: Step, event: ActionEvent): ValidationResult => {
  if (event.meta.trigger !== step.type) {
    return { valid: false, reason: "trigger-mismatch" };
  }

  if ((step.type === "click" || step.type === "form") && step.highlight) {
    const guideId = event.meta.element?.guideId;
    if (!guideId || guideId !== step.highlight) {
      return { valid: false, reason: "element-mismatch" };
    }
  }

  return { valid: true, reason: "ok" };
};
