import type { Step } from "../core/types";
import type { DomAdapter } from "../adapter/dom";

type LifecycleHooks = {
  onStepChange?: (step: Step) => void;
  onFinish?: () => void;
  onError?: (err: Error) => void;
};

export class RuntimeLifecycle {
  private adapter: DomAdapter;
  private hooks: LifecycleHooks;

  constructor(adapter: DomAdapter, hooks: LifecycleHooks) {
    this.adapter = adapter;
    this.hooks = hooks;
  }

  enterStep(step: Step) {
    this.adapter.renderStep(step);
    this.hooks.onStepChange?.(step);
  }

  clearStep() {
    this.adapter.clear();
  }

  finish() {
    this.adapter.clear();
    this.hooks.onFinish?.();
  }

  error(error: Error) {
    console.error("[FlowPilot]", error);
    this.hooks.onError?.(error);
  }

  destroy() {
    this.adapter.destroy();
  }
}
