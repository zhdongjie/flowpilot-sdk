import type { Step } from "../types";
import { EventBus } from "./eventBus";
import type { ActionEvent, BehaviorSource } from "./protocol";
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
  private detachActionListener: (() => void) | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
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
    if (this.detachActionListener) {
      this.detachActionListener();
      this.detachActionListener = null;
    }
    this.reset();
  }

  private bindActionEvent() {
    this.detachActionListener = this.eventBus.on<ActionEvent>("ACTION", (event) => {
      const current = this.getCurrentStep();
      if (!current) {
        return;
      }

      const autoEmit = current.behavior.autoEmit;
      if (autoEmit && this.shouldAutoEmit(current, event, autoEmit)) {
        this.eventBus.emit<ActionEvent>("ACTION", {
          ...event,
          name: autoEmit,
          payload: event.payload ?? event,
        });
      }

      if (this.shouldCompleteFromActionEvent(current, event)) {
        this.complete(current, event);
      }
    });
  }

  private shouldAutoEmit(
    step: RegisteredBehavior,
    event: ActionEvent,
    autoEmit: string
  ) {
    if (event.name === autoEmit) {
      return false;
    }

    const trigger = event.meta.trigger;
    if (!this.isBehaviorTrigger(trigger) || trigger !== step.behavior.type) {
      return false;
    }

    if (trigger === "route") {
      return true;
    }

    if (!step.guideId) {
      return true;
    }

    return event.meta.element?.guideId === step.guideId;
  }

  private isBehaviorTrigger(trigger: ActionEvent["meta"]["trigger"]): trigger is BehaviorSource {
    return trigger === "click" || trigger === "route" || trigger === "form";
  }

  private shouldCompleteFromActionEvent(step: RegisteredBehavior, event: ActionEvent) {
    const completion = step.behavior.completion;
    if (!completion || completion.type !== "event") {
      return false;
    }

    const matchesName =
      typeof completion.name === "string" &&
      completion.name.length > 0 &&
      event.name === completion.name;
    const matchesEvent =
      typeof completion.match === "function" && completion.match(event);

    return matchesName || matchesEvent;
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

  private complete(step: RegisteredBehavior, event: ActionEvent) {
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
    let resolved: StepBehavior;

    if (step.behavior) {
      resolved = { ...step.behavior };
    } else if (step.type) {
      resolved = { type: step.type };
    } else if (step.form && step.form.length) {
      resolved = { type: "form" };
    } else {
      resolved = { type: "click" };
    }

    return this.normalizeBehaviorCompletion(resolved, step.highlight || "");
  }

  private normalizeBehaviorCompletion(
    behavior: StepBehavior,
    guideId: string
  ): StepBehavior {
    if (behavior.type === "click") {
      return {
        ...behavior,
        completion: this.resolveClickOrRouteCompletion(
          "click",
          behavior.completion,
          guideId
        ),
      };
    }

    if (behavior.type === "route") {
      return {
        ...behavior,
        completion: this.resolveClickOrRouteCompletion("route", behavior.completion),
      };
    }

    return behavior;
  }

  private resolveClickOrRouteCompletion(
    source: "click" | "route",
    completion: StepBehavior["completion"],
    guideId = ""
  ): StepBehavior["completion"] {
    if (completion?.type === "event") {
      return completion;
    }

    return {
      type: "event",
      match: (event) => {
        if (event.meta.trigger !== source) {
          return false;
        }

        if (source !== "click" || !guideId) {
          return true;
        }

        return event.meta.element?.guideId === guideId;
      },
    };
  }
}
