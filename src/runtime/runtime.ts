import type { InitConfig, Step, Workflow } from "../types";
import { StepBehaviorEngine } from "./behaviorEngine";
import { StepLifecycle } from "./lifecycle";
import { RuntimeStateMachine } from "./stateMachine";
import { backfillCompletion } from "./stepCompletion";
import { reconcileStep } from "./stepReconciler";
import { GuideRuntime } from "./ui";
import { PageWatcher } from "./watcher";
import { findNextStep } from "./stepEngine";
import { createRuntimeAdapter, type RuntimeAdapter } from "./adapter";

type RuntimeEvent =
  | { type: "PAGE_CHANGE"; page: string }
  | { type: "STEP_CHANGE"; step: Step | null; index: number | null }
  | { type: "STEP_COMPLETE"; source: "user" | "auto" }
  | { type: "FLOW_FINISH" };

export class FlowPilotRuntime {
  private config: InitConfig;
  private adapter: RuntimeAdapter;
  private ui: GuideRuntime;
  private lifecycle: StepLifecycle;
  private behavior: StepBehaviorEngine;
  private stateMachine: RuntimeStateMachine;
  private watcher: PageWatcher;
  private activeWorkflow: Workflow | null = null;
  private lastInvalidKey: string | null = null;

  constructor(config: InitConfig, root: ShadowRoot) {
    this.config = config;
    this.adapter = createRuntimeAdapter(config);
    this.ui = new GuideRuntime(root);
    this.lifecycle = new StepLifecycle(this.ui, config.mapping);
    this.behavior = new StepBehaviorEngine();
    this.stateMachine = new RuntimeStateMachine(this.adapter.getCurrentPage());
    this.watcher = new PageWatcher({
      getCurrentPage: () => this.adapter.getCurrentPage(),
      onChange: (page) => this.dispatch({ type: "PAGE_CHANGE", page }),
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

    this.lifecycle.exit();
    this.lastInvalidKey = null;
    this.activeWorkflow = workflow;
    const currentPage = this.adapter.getCurrentPage();
    this.stateMachine.start(taskId, currentPage);
    this.watcher.start();
    this.dispatch({ type: "PAGE_CHANGE", page: currentPage });
  }

  next() {
    this.dispatch({ type: "STEP_COMPLETE", source: "user" });
  }

  reset() {
    this.lifecycle.exit();
    this.watcher.stop();
    this.activeWorkflow = null;
    this.lastInvalidKey = null;
    this.stateMachine.reset(this.adapter.getCurrentPage());
  }

  destroy() {
    this.reset();
    this.lifecycle.destroy();
  }

  private dispatch(event: RuntimeEvent) {
    switch (event.type) {
      case "PAGE_CHANGE": {
        this.onPageChange(event.page);
        return;
      }
      case "STEP_CHANGE": {
        this.onStepChange(event.step, event.index);
        return;
      }
      case "STEP_COMPLETE": {
        this.onStepComplete(event.source);
        return;
      }
      case "FLOW_FINISH": {
        this.onFlowFinish();
      }
    }
  }

  private onPageChange(page: string) {
    this.lifecycle.exit();
    this.stateMachine.updatePage(page);
    const state = this.stateMachine.getState();

    if (!this.activeWorkflow || state.status !== "running") {
      this.stateMachine.clearStep(true);
      return;
    }

    const candidate = reconcileStep(this.activeWorkflow, page, this.getState());
    if (!candidate) {
      this.stateMachine.clearStep(true);
      return;
    }

    this.dispatch({
      type: "STEP_CHANGE",
      step: candidate.step,
      index: candidate.index,
    });
  }

  private onStepChange(step: Step | null, index: number | null) {
    if (!step || typeof index !== "number") {
      this.lifecycle.exit();
      this.stateMachine.clearStep(true);
      return;
    }

    this.stateMachine.setStep(step, index);
    if (this.activeWorkflow?.steps) {
      backfillCompletion(this.activeWorkflow.steps, index);
    }

    const validation = this.lifecycle.validate(step, {
      currentPage: this.stateMachine.getState().currentPage,
      state: this.getState(),
    });

    if (!validation.valid) {
      if (validation.reason === "element-missing") {
        this.reportInvalidOnce(step.step, validation.reason, {
          selectors: validation.selectors,
        });
      } else if (validation.reason !== "page-mismatch") {
        this.reportInvalidOnce(step.step, validation.reason);
      }
      return;
    }

    this.lastInvalidKey = null;
    this.lifecycle.enter(step, validation.element, {
      bindClick: this.behavior.shouldBindClick(step),
      showConfirm: this.behavior.shouldShowConfirm(step),
      onAdvance: () => this.dispatch({ type: "STEP_COMPLETE", source: "user" }),
    });

    this.config.onStepChange?.(step);
    this.logDebug("step change", step);

    if (this.behavior.canAutoNext(step)) {
      queueMicrotask(() => {
        this.dispatch({ type: "STEP_COMPLETE", source: "auto" });
      });
    }
  }

  private onStepComplete(source: "user" | "auto") {
    const state = this.stateMachine.getState();
    if (!this.activeWorkflow || state.status !== "running" || !state.currentStep) {
      return;
    }
    if (!this.behavior.allowAdvance(state.currentStep, source)) {
      return;
    }

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
        // No eligible step on the current page/state yet.
        // Keep the flow running and wait for PAGE_CHANGE reconciliation.
        this.stateMachine.clearStep(true);
        return;
      }
      this.dispatch({ type: "FLOW_FINISH" });
      return;
    }

    this.dispatch({ type: "STEP_CHANGE", step: next.step, index: next.index });
  }

  private onFlowFinish() {
    this.lifecycle.exit();
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
}
