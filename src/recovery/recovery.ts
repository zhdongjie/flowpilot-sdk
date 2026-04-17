import type { Workflow } from "../core/types";
import type { ValidationResult } from "./validator";

export type RecoveryStrategy =
  | { type: "retry"; reason: ValidationResult["reason"] }
  | { type: "remap"; reason: ValidationResult["reason"] }
  | { type: "reset"; reason: ValidationResult["reason"] };

export const decideRecovery = (
  workflow: Workflow,
  currentIndex: number,
  validation: ValidationResult
): RecoveryStrategy => {
  if (!workflow.steps.length || currentIndex < 0 || currentIndex >= workflow.steps.length) {
    return { type: "reset", reason: validation.reason };
  }

  if (validation.reason === "page-mismatch" || validation.reason === "element-missing") {
    return { type: "remap", reason: validation.reason };
  }

  if (validation.reason === "trigger-mismatch" || validation.reason === "element-mismatch") {
    return { type: "retry", reason: validation.reason };
  }

  return { type: "reset", reason: validation.reason };
};
