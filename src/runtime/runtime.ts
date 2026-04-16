import type { InitConfig, Step, Workflow } from "../types";
import type { StepCompletePayload } from "../behavior/types";
import { BehaviorEngine } from "../behavior/engine";
import { EventBus } from "../behavior/eventBus";
import { BehaviorLifecycle } from "../behavior/lifecycle";
import { isValidationFailure, StepLifecycle } from "./lifecycle";
import { RuntimeStateMachine } from "./stateMachine";
import { backfillCompletion } from "./stepCompletion";
import { reconcileStep } from "./stepReconciler";
import { GuideRuntime } from "./ui";
import { PageWatcher } from "./watcher";
import { findNextStep, isStepEligible } from "./stepEngine";
import { createRuntimeAdapter, type RuntimeAdapter } from "./adapter";

export class FlowPilotRuntime {
  private config: InitConfig;
  private adapter: RuntimeAdapter;
  private ui: GuideRuntime;
  private lifecycle: StepLifecycle;
  private stateMachine: RuntimeStateMachine;
  private watcher: PageWatcher;
  private eventBus: EventBus;
  private behaviorEngine: BehaviorEngine;
  private behaviorLifecycle: BehaviorLifecycle;
  private activeWorkflow: Workflow | null = null;
  private lastInvalidKey: string | null = null;
  private elementRetryTimer: number | null = null;
  private elementRetryAttempts = 0;
  private elementRetryStepId: number | null = null;

  constructor(config: InitConfig, root: ShadowRoot, eventBus?: EventBus) {
    this.config = config;
    this.adapter = createRuntimeAdapter(config);
    this.ui = new GuideRuntime(root);
    this.lifecycle = new StepLifecycle(this.ui, config.mapping);
    this.stateMachine = new RuntimeStateMachine(this.adapter.getCurrentPage());

    this.eventBus = eventBus ?? new EventBus();
    this.behaviorEngine = new BehaviorEngine(this.eventBus);
    this.behaviorLifecycle = new BehaviorLifecycle(
      this.eventBus,
      this,
      this.behaviorEngine
    );
    this.behaviorLifecycle.start();

    this.watcher = new PageWatcher({
      getCurrentPage: () => this.adapter.getCurrentPage(),
      onChange: (page) => {
        this.onPageChange(page);
      },
    });
  }

  start(taskId: string) {
    const workflow = this.getWorkflow(taskId);
    if (!workflow) {
      this.handleError(new Error("Workflow not found"));
      return;
    }
    if (!workflow.steps || workflow.steps.length === 0) {
      this.handleError(new Error("Workflow has no steps"));
      return;
    }

    this.behaviorEngine.reset();
    workflow.steps.forEach((step) => {
      step.status = "pending";
      this.behaviorEngine.registerStep(step);
    });

    this.lifecycle.exit();
    this.lastInvalidKey = null;
    this.activeWorkflow = workflow;

    const currentPage = this.adapter.getCurrentPage();
    this.stateMachine.start(taskId, currentPage);
    this.watcher.start();
    this.onPageChange(currentPage);
  }

  reset() {
    this.clearElementRetry();
    this.lifecycle.exit();
    this.behaviorEngine.reset();
    this.watcher.stop();
    this.activeWorkflow = null;
    this.lastInvalidKey = null;
    this.stateMachine.reset(this.adapter.getCurrentPage());
  }

  destroy() {
    this.reset();
    this.behaviorLifecycle.stop();
    this.behaviorEngine.destroy();
    this.lifecycle.destroy();
  }

  completeStep(stepId: number, stepComplete?: StepCompletePayload) {
    const state = this.stateMachine.getState();
    if (!this.activeWorkflow || state.status !== "running" || !state.currentStep) {
      return;
    }

    if (state.currentStep.step !== stepId || state.currentStep.status === "completed") {
      return;
    }

    const actionEvent = stepComplete?.event;
    if (
      actionEvent &&
      actionEvent.meta.trigger === "route" &&
      typeof actionEvent.meta.page === "string"
    ) {
      this.stateMachine.updatePage(actionEvent.meta.page);
    }

    this.clearElementRetry();
    state.currentStep.status = "completed";
    this.lifecycle.exit();

    const next = findNextStep(this.activeWorkflow, state.currentStepIndex, {
      currentPage: state.currentPage,
      state: this.getState(),
    });

    if (!next) {
      const hasRemainingSteps =
        typeof state.currentStepIndex === "number" &&
        this.activeWorkflow.steps.length > state.currentStepIndex + 1;
      if (hasRemainingSteps) {
        this.stateMachine.clearStep(true);
        return;
      }

      this.onFlowFinish();
      return;
    }

    this.onStepChange(next.step, next.index);
  }

  private onPageChange(page: string) {
    this.stateMachine.updatePage(page);

    const state = this.stateMachine.getState();
    if (!this.activeWorkflow || state.status !== "running") {
      this.stateMachine.clearStep(true);
      this.lifecycle.exit();
      this.behaviorEngine.deactivate();
      return;
    }

    if (state.currentStep && typeof state.currentStepIndex === "number") {
      const stillEligible = isStepEligible(state.currentStep, {
        currentPage: page,
        state: this.getState(),
      });

      if (stillEligible) {
        this.onStepChange(state.currentStep, state.currentStepIndex);
        return;
      }
    }

    const candidate = reconcileStep(this.activeWorkflow, page, this.getState());
    if (!candidate) {
      this.stateMachine.clearStep(true);
      this.lifecycle.exit();
      this.behaviorEngine.deactivate();
      return;
    }

    this.onStepChange(candidate.step, candidate.index);
  }

  private onStepChange(step: Step | null, index: number | null) {
    if (!step || typeof index !== "number") {
      this.clearElementRetry();
      this.lifecycle.exit();
      this.behaviorEngine.deactivate();
      this.stateMachine.clearStep(true);
      return;
    }

    const state = this.stateMachine.getState();
    const isSameStep =
      state.currentStep?.step === step.step && state.currentStepIndex === index;

    if (!isSameStep) {
      this.stateMachine.setStep(step, index);
      if (this.activeWorkflow?.steps) {
        backfillCompletion(this.activeWorkflow.steps, index);
      }
      this.config.onStepChange?.(step);
      this.logDebug("step change", step);
    }

    const validation = this.lifecycle.validate(step, {
      currentPage: this.stateMachine.getState().currentPage,
      state: this.getState(),
    });

    if (isValidationFailure(validation)) {
      if (validation.reason === "element-missing") {
        this.reportInvalidOnce(step.step, validation.reason, {
          selectors: validation.selectors,
        });
        this.scheduleElementRetry(step, index);
      } else if (validation.reason !== "page-mismatch") {
        this.reportInvalidOnce(step.step, validation.reason);
        this.clearElementRetry();
      } else {
        this.clearElementRetry();
      }
      this.lifecycle.exit();
      return;
    }

    this.clearElementRetry();
    this.lastInvalidKey = null;
    this.lifecycle.enter(step, validation.element);
    this.behaviorEngine.activate(step.step);
  }

  private onFlowFinish() {
    this.lifecycle.exit();
    this.behaviorEngine.deactivate();
    this.stateMachine.finish();
    this.stateMachine.clearStep(true);
    this.config.onFinish?.();
  }

  private reportInvalidOnce(
    stepNumber: number,
    reason: string,
    detail?: { selectors?: string[] }
  ) {
    const key = `${stepNumber}:${reason}`;
    if (this.lastInvalidKey === key) {
      return;
    }
    this.lastInvalidKey = key;

    if (reason === "element-missing" && detail?.selectors?.length) {
      this.handleError(
        new Error(
          `Element not found. Tried selectors: ${detail.selectors.join(", ")}`
        )
      );
      return;
    }

    if (reason === "state-mismatch") {
      this.handleError(new Error("Step state does not match current state"));
    }
  }

  private getWorkflow(taskId?: string) {
    const workflows = Array.isArray(this.config.workflow)
      ? this.config.workflow
      : [this.config.workflow];
    if (taskId) {
      return workflows.find((item) => item.id === taskId) || workflows[0] || null;
    }
    return workflows[0] || null;
  }

  private getState() {
    if (this.config.getState) {
      return this.config.getState() || {};
    }
    return {};
  }

  private logDebug(...args: any[]) {
    if (this.config.debug) {
      console.log("[FlowPilot]", ...args);
    }
  }

  private handleError(error: Error) {
    console.error("[FlowPilot]", error);
    this.config.onError?.(error);
  }

  private clearElementRetry() {
    if (this.elementRetryTimer !== null) {
      if (typeof window !== "undefined") {
        window.clearTimeout(this.elementRetryTimer);
      } else {
        clearTimeout(this.elementRetryTimer);
      }
      this.elementRetryTimer = null;
    }
    this.elementRetryAttempts = 0;
    this.elementRetryStepId = null;
  }

  private scheduleElementRetry(step: Step, index: number) {
    if (typeof window === "undefined") {
      return;
    }

    if (this.elementRetryStepId !== step.step) {
      this.elementRetryStepId = step.step;
      this.elementRetryAttempts = 0;
    }

    if (this.elementRetryAttempts >= 20 || this.elementRetryTimer !== null) {
      return;
    }

    this.elementRetryAttempts += 1;
    this.elementRetryTimer = window.setTimeout(() => {
      this.elementRetryTimer = null;
      const state = this.stateMachine.getState();
      if (!this.activeWorkflow || state.status !== "running") {
        return;
      }
      if (!state.currentStep || typeof state.currentStepIndex !== "number") {
        return;
      }
      if (state.currentStep.step !== step.step || state.currentStepIndex !== index) {
        return;
      }
      this.onStepChange(state.currentStep, state.currentStepIndex);
    }, 80);
  }
}
