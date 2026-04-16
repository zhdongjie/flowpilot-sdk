import type { ActionEvent } from "../behavior/protocol";
import type { Workflow } from "../core/types";
import { validateStepEvent } from "../recovery/validator";
import type { RecoveryManager } from "../recovery/recovery";
import type { DomAdapter } from "../adapter/dom";
import type { EventBus } from "./eventBus";
import type { RuntimeLifecycle } from "./lifecycle";
import { RuntimeStateStore } from "./state";

type RuntimeEngineOptions = {
  workflows: Workflow[];
  eventBus: EventBus;
  adapter: DomAdapter;
  lifecycle: RuntimeLifecycle;
  recovery: RecoveryManager;
  debug?: boolean;
};

export class RuntimeEngine {
  private workflows: Workflow[];
  private eventBus: EventBus;
  private adapter: DomAdapter;
  private lifecycle: RuntimeLifecycle;
  private recovery: RecoveryManager;
  private state: RuntimeStateStore;
  private debug: boolean;
  private detachAction: (() => void) | null = null;

  constructor(options: RuntimeEngineOptions) {
    this.workflows = options.workflows;
    this.eventBus = options.eventBus;
    this.adapter = options.adapter;
    this.lifecycle = options.lifecycle;
    this.recovery = options.recovery;
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
    this.activateStep(0);
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
    if (snapshot.status !== "running" || !snapshot.workflow || !snapshot.currentStep) {
      return;
    }

    this.state.setPage(event.meta.page || this.adapter.getCurrentPage());

    const validation = validateStepEvent(snapshot.currentStep, event);
    if (validation.valid) {
      this.log("complete", snapshot.currentStep.id, event.name);
      this.advance();
      return;
    }

    this.log("mismatch", validation.reason, event.name);
    const recovered = this.recovery.recover(
      snapshot.workflow,
      snapshot.currentStepIndex ?? 0
    );
    this.activateStep(recovered.index);
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

    this.activateStep(nextIndex);
  }

  private activateStep(index: number) {
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

  private log(...args: any[]) {
    if (this.debug) {
      console.log("[FlowPilot:engine]", ...args);
    }
  }
}
