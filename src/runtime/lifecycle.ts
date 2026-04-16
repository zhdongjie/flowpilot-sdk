import type { MappingRegistry, Step } from "../types";
import { resolveElement, resolvePages } from "../mapping/resolver";
import { pageMatches, stateMatches } from "./stepEngine";
import { GuideRuntime } from "./ui";

export type ValidationSuccess = {
  valid: true;
  element: Element;
  selectors: string[];
};

export type ValidationFailure = {
  valid: false;
  reason: "page-mismatch" | "state-mismatch" | "element-missing";
  selectors?: string[];
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

export const isValidationFailure = (
  result: ValidationResult
): result is ValidationFailure => !result.valid;

type ValidationContext = {
  currentPage?: string;
  state?: Record<string, any>;
};

type EnterOptions = {
  showNext?: boolean;
  onNext?: () => void;
};

export class StepLifecycle {
  private ui: GuideRuntime;
  private mapping?: MappingRegistry;

  constructor(
    ui: GuideRuntime,
    mapping: MappingRegistry | undefined,
    _legacyBehavior?: unknown
  ) {
    this.ui = ui;
    this.mapping = mapping;
  }

  validate(step: Step, context: ValidationContext): ValidationResult {
    if (!pageMatches(step, context.currentPage)) {
      return { valid: false, reason: "page-mismatch" };
    }
    if (!stateMatches(step.state, context.state)) {
      return { valid: false, reason: "state-mismatch" };
    }
    const mappingPages = resolvePages(step.highlight, this.mapping);
    if (
      mappingPages.length &&
      context.currentPage &&
      !mappingPages.includes(context.currentPage)
    ) {
      return { valid: false, reason: "page-mismatch" };
    }
    const { element, selectors } = resolveElement(
      step.highlight,
      this.mapping,
      context.currentPage
    );
    if (!element) {
      return { valid: false, reason: "element-missing", selectors };
    }
    return { valid: true, element, selectors };
  }

  enter(step: Step, element: Element | null, options?: EnterOptions) {
    this.exit();

    this.ui.render(element, {
      message: step.action || "",
      reason: step.desc || "",
      showNext: options?.showNext,
      onNext: options?.onNext,
    });
  }

  exit() {
    this.ui.clear();
  }

  destroy() {
    this.exit();
    this.ui.destroy();
  }
}
