import { EventBus } from "./eventBus";
import { BehaviorEngine } from "./engine";
import type { StepCompletePayload } from "./types";

type RuntimeLike = {
  completeStep: (stepId: number, event?: StepCompletePayload) => void;
};

export class BehaviorLifecycle {
  private eventBus: EventBus;
  private runtime: RuntimeLike;
  private engine: BehaviorEngine;
  private detach: (() => void) | null = null;

  constructor(eventBus: EventBus, runtime: RuntimeLike, engine: BehaviorEngine) {
    this.eventBus = eventBus;
    this.runtime = runtime;
    this.engine = engine;
  }

  start() {
    if (this.detach) {
      return;
    }

    this.detach = this.eventBus.on<StepCompletePayload>(
      "STEP_COMPLETE",
      (event) => {
        this.engine.deactivate();
        this.runtime.completeStep(event.stepId, event);
      }
    );
  }

  stop() {
    if (!this.detach) {
      return;
    }
    this.detach();
    this.detach = null;
  }
}
