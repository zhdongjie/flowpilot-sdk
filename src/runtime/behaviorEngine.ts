import type { Step } from "../types";

export type StepType = "click" | "form" | "view" | "route";

export class StepBehaviorEngine {
  getType(step: Step): StepType {
    if (step.type) {
      return step.type;
    }
    if (step.form && step.form.length) {
      return "form";
    }
    return "click";
  }

  canAutoNext(step: Step): boolean {
    const type = this.getType(step);
    if (type === "form" || type === "view" || type === "route") {
      return false;
    }
    return Boolean(step.autoNext);
  }

  shouldWaitUser(step: Step): boolean {
    const type = this.getType(step);
    if (type === "view") {
      return true;
    }
    if (type === "form") {
      return true;
    }
    return Boolean(step.requireConfirm);
  }

  shouldBindClick(step: Step): boolean {
    return this.getType(step) === "click";
  }

  shouldTrackRoute(step: Step): boolean {
    return this.getType(step) === "route" || Boolean(step.waitForStable);
  }

  shouldShowConfirm(step: Step): boolean {
    return this.getType(step) === "form" && Boolean(step.requireConfirm);
  }

  allowAdvance(step: Step, source: "user" | "auto"): boolean {
    const type = this.getType(step);
    if (type === "view") {
      return false;
    }
    if (source === "auto") {
      return this.canAutoNext(step);
    }
    return true;
  }
}
