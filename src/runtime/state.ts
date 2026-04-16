import type { Step, Workflow } from "../core/types";

export type RuntimeStatus = "idle" | "running" | "finished";

export type RuntimeState = {
  status: RuntimeStatus;
  workflow: Workflow | null;
  currentStepIndex: number | null;
  currentStep: Step | null;
  currentPage: string;
};

export class RuntimeStateStore {
  private state: RuntimeState;

  constructor(initialPage: string) {
    this.state = {
      status: "idle",
      workflow: null,
      currentStepIndex: null,
      currentStep: null,
      currentPage: initialPage,
    };
  }

  get snapshot(): RuntimeState {
    return { ...this.state };
  }

  setPage(page: string) {
    this.state.currentPage = page;
  }

  start(workflow: Workflow, page: string) {
    this.state.status = "running";
    this.state.workflow = workflow;
    this.state.currentPage = page;
    this.state.currentStepIndex = null;
    this.state.currentStep = null;
  }

  setStep(index: number, step: Step) {
    this.state.currentStepIndex = index;
    this.state.currentStep = step;
  }

  finish() {
    this.state.status = "finished";
    this.state.currentStep = null;
    this.state.currentStepIndex = null;
  }

  reset(page: string) {
    this.state.status = "idle";
    this.state.workflow = null;
    this.state.currentStepIndex = null;
    this.state.currentStep = null;
    this.state.currentPage = page;
  }
}
