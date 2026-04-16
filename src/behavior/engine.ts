import type { Step } from "../types";
import { EventBus } from "./eventBus";
import type { ActionEvent, BehaviorEvent } from "./protocol";
import type { StepBehavior } from "./types";

type RegisteredBehavior = {
  stepId: number;
  guideId: string;
  behavior: StepBehavior;
};

export class BehaviorEngine {
  private eventBus: EventBus;
  private behaviors = new Map<number, RegisteredBehavior>();
  private activeStepId: number | null = null;
  private completedSteps = new Set<number>();
  private detachBehaviorListener: (() => void) | null = null;
  private detachActionListener: (() => void) | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.bindBehaviorEvent();
    this.bindActionEvent();
  }

  register(stepId: number, behavior: StepBehavior, guideId = "") {
    this.behaviors.set(stepId, {
      stepId,
      guideId,
      behavior,
    });
  }

  registerStep(step: Step) {
    this.register(step.step, this.resolveBehavior(step), step.highlight || "");
  }

  activate(stepId: number) {
    const step = this.behaviors.get(stepId);
    if (!step) {
      this.activeStepId = null;
      return;
    }
    this.activeStepId = stepId;
  }

  deactivate() {
    this.activeStepId = null;
  }

  shouldShowConfirm(_stepId: number) {
    return false;
  }

  reset() {
    this.deactivate();
    this.behaviors.clear();
    this.completedSteps.clear();
  }

  destroy() {
    if (this.detachBehaviorListener) {
      this.detachBehaviorListener();
      this.detachBehaviorListener = null;
    }
    if (this.detachActionListener) {
      this.detachActionListener();
      this.detachActionListener = null;
    }
    this.reset();
  }

  private bindBehaviorEvent() {
    this.detachBehaviorListener = this.eventBus.on<BehaviorEvent>(
      "BEHAVIOR_EVENT",
      (event) => {
        const current = this.getCurrentStep();
        if (!current) {
          return;
        }

        const autoEmit = current.behavior.autoEmit;
        if (!autoEmit) {
          return;
        }

        if (!this.matchesAutoEmit(current, event)) {
          return;
        }

        this.eventBus.emit<ActionEvent>("ACTION", {
          type: "ACTION",
          name: autoEmit,
          payload: event,
        });
      }
    );
  }

  private bindActionEvent() {
    this.detachActionListener = this.eventBus.on<ActionEvent>("ACTION", (event) => {
      const current = this.getCurrentStep();
      if (!current) {
        return;
      }

      const completion = current.behavior.completion;
      if (!completion || completion.type !== "event") {
        return;
      }

      if (event.name !== completion.name) {
        return;
      }

      if (typeof completion.validator === "function") {
        if (!completion.validator(event.payload)) {
          return;
        }
      }

      this.complete(current, event);
    });
  }

  private matchesAutoEmit(step: RegisteredBehavior, event: BehaviorEvent) {
    if (event.source === "route") {
      return true;
    }

    if (event.source === "click" || event.source === "form") {
      if (!step.guideId) {
        return true;
      }
      return event.guideId === step.guideId;
    }

    return false;
  }

  private getCurrentStep() {
    if (this.activeStepId === null) {
      return null;
    }
    const current = this.behaviors.get(this.activeStepId);
    if (!current) {
      return null;
    }
    if (this.completedSteps.has(current.stepId)) {
      return null;
    }
    return current;
  }

  private complete(step: RegisteredBehavior, event: BehaviorEvent | ActionEvent) {
    if (this.completedSteps.has(step.stepId)) {
      return;
    }

    this.completedSteps.add(step.stepId);
    this.eventBus.emit("STEP_COMPLETE", {
      stepId: step.stepId,
      event,
    });
  }

  private resolveBehavior(step: Step): StepBehavior {
    if (step.behavior) {
      return step.behavior;
    }

    if (step.type) {
      return { type: step.type };
    }

    if (step.form && step.form.length) {
      return { type: "form" };
    }

    return { type: "click" };
  }
}
