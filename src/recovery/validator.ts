import type { DomAdapter } from "../adapter/dom";
import type { ActionEvent, Step } from "../core/types";

export type ValidationReason =
  | "ok"
  | "trigger-mismatch"
  | "page-mismatch"
  | "element-missing"
  | "element-mismatch";

export type ValidationResult = {
  valid: boolean;
  reason: ValidationReason;
};

export const validateStepAvailability = (
  step: Step,
  adapter: DomAdapter,
  page = adapter.getCurrentPage()
): ValidationResult => {
  return adapter.validateStepAvailability(step, page);
};

export const validateStepEvent = (
  step: Step,
  event: ActionEvent,
  adapter: DomAdapter
): ValidationResult => {
  if (event.meta.trigger !== step.type) {
    return { valid: false, reason: "trigger-mismatch" };
  }

  return adapter.matchStepEvent(step, event);
};
