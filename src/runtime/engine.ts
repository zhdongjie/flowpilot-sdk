import type { ActionEvent, Workflow } from "../core/types";
import { validateStepAvailability, validateStepEvent } from "../recovery/validator";
import { decideRecovery } from "../recovery/recovery";
import { reconcileStepIndex } from "../recovery/reconcile";
import type { DomAdapter } from "../adapter/dom";
import type { EventBus } from "./eventBus";
import type { RuntimeLifecycle } from "./lifecycle";
import { RuntimeStateStore } from "./state";

type RuntimeEngineOptions = {
  workflows: Workflow[];
  eventBus: EventBus;
  adapter: DomAdapter;
  lifecycle: RuntimeLifecycle;
  debug?: boolean;
};

export class RuntimeEngine {
  private workflows: Workflow[];
  private eventBus: EventBus;
  private adapter: DomAdapter;
  private lifecycle: RuntimeLifecycle;
  private state: RuntimeStateStore;
  private debug: boolean;
  private detachAction: (() => void) | null = null;

  constructor(options: RuntimeEngineOptions) {
    this.workflows = options.workflows;
    this.eventBus = options.eventBus;
    this.adapter = options.adapter;
    this.lifecycle = options.lifecycle;
    this.debug = Boolean(options.debug);
    this.state = new RuntimeStateStore(this.adapter.getCurrentPage());
    this.bindAction();
  }

  start(workflowId: string) {
    const workflow = this.resolveWorkflow(workflowId);
    if (!workflow) {
      this.lifecycle.error(new Error("Workflow not found"));
      return;
    }
    if (!workflow.steps.length) {
      this.lifecycle.error(new Error("Workflow has no steps"));
      return;
    }

    this.state.start(workflow, this.adapter.getCurrentPage());
    this.log("start", workflow.id);
    this.transitionTo(0);
  }

  reset() {
    this.state.reset(this.adapter.getCurrentPage());
    this.lifecycle.clearStep();
  }

  destroy() {
    if (this.detachAction) {
      this.detachAction();
      this.detachAction = null;
    }
    this.reset();
    this.lifecycle.destroy();
  }

  private bindAction() {
    this.detachAction = this.eventBus.on("ACTION", (event) => {
      this.handleAction(event);
    });
  }

  private handleAction(event: ActionEvent) {
    const snapshot = this.state.snapshot;
    if (
      snapshot.status !== "running" ||
      !snapshot.workflow ||
      !snapshot.currentStep ||
      typeof snapshot.currentStepIndex !== "number"
    ) {
      return;
    }

    this.state.setPage(event.meta.page || this.adapter.getCurrentPage());

    const validation = validateStepEvent(snapshot.currentStep, event, this.adapter);
    if (validation.valid) {
      this.log("complete", snapshot.currentStep.id, event.name);
      this.advance();
      return;
    }

    this.log("mismatch", validation.reason, event.name);
    this.recover(snapshot.workflow, snapshot.currentStepIndex, validation);
  }

  private advance() {
    const snapshot = this.state.snapshot;
    if (!snapshot.workflow || typeof snapshot.currentStepIndex !== "number") {
      return;
    }

    const nextIndex = snapshot.currentStepIndex + 1;
    if (nextIndex >= snapshot.workflow.steps.length) {
      this.finish();
      return;
    }

    this.transitionTo(nextIndex);
  }

  private transitionTo(index: number) {
    const snapshot = this.state.snapshot;
    const workflow = snapshot.workflow;
    if (snapshot.status !== "running" || !workflow) {
      return;
    }

    if (index < 0 || index >= workflow.steps.length) {
      this.finish();
      return;
    }

    const step = workflow.steps[index];
    this.state.setStep(index, step);
    const validation = validateStepAvailability(
      step,
      this.adapter,
      snapshot.currentPage || this.adapter.getCurrentPage()
    );

    if (!validation.valid) {
      this.log("activate-mismatch", step.id, validation.reason);
      this.recover(workflow, index, validation);
      return;
    }

    this.lifecycle.enterStep(step);
    this.log("activate", step.id);
  }

  private finish() {
    this.state.finish();
    this.lifecycle.finish();
    this.log("finish");
  }

  private resolveWorkflow(workflowId: string) {
    return this.workflows.find((item) => item.id === workflowId) || this.workflows[0] || null;
  }

  private recover(
    workflow: Workflow,
    currentIndex: number,
    validation: ReturnType<typeof validateStepEvent>
  ) {
    const strategy = decideRecovery(workflow, currentIndex, validation);
    const page = this.state.snapshot.currentPage || this.adapter.getCurrentPage();
    const nextIndex = reconcileStepIndex(workflow, currentIndex, strategy, this.adapter, page);

    if (nextIndex === null) {
      this.lifecycle.clearStep();
      this.lifecycle.error(new Error(`Recovery failed: ${validation.reason}`));
      return;
    }

    if (nextIndex === currentIndex && this.adapter.canResolveStep(workflow.steps[currentIndex], page)) {
      this.lifecycle.enterStep(workflow.steps[currentIndex]);
      this.log("retry", workflow.steps[currentIndex].id, validation.reason);
      return;
    }

    this.log("recover", strategy.type, workflow.steps[nextIndex]?.id || nextIndex);
    this.transitionTo(nextIndex);
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log("[FlowPilot:engine]", ...args);
    }
  }
}
