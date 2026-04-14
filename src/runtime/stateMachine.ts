import type { Step } from "../types";

export type RuntimeStatus = "idle" | "running" | "finished";

export type RuntimeState = {
  activeTaskId: string | null;
  currentStepIndex: number | null;
  currentStep: Step | null;
  status: RuntimeStatus;
  currentPage: string;
};

export class RuntimeStateMachine {
  private state: RuntimeState;

  constructor(initialPage: string) {
    this.state = {
      activeTaskId: null,
      currentStepIndex: null,
      currentStep: null,
      status: "idle",
      currentPage: initialPage,
    };
  }

  get snapshot(): RuntimeState {
    return { ...this.state };
  }

  getState(): RuntimeState {
    return this.state;
  }

  start(taskId: string, page: string) {
    this.state.activeTaskId = taskId;
    this.state.status = "running";
    this.state.currentPage = page;
    this.state.currentStepIndex = null;
    this.state.currentStep = null;
  }

  setStep(step: Step, index: number) {
    this.state.currentStep = step;
    this.state.currentStepIndex = index;
  }

  clearStep(keepIndex = false) {
    this.state.currentStep = null;
    if (!keepIndex) {
      this.state.currentStepIndex = null;
    }
  }

  finish() {
    this.state.status = "finished";
  }

  reset(page: string) {
    this.state.activeTaskId = null;
    this.state.status = "idle";
    this.state.currentPage = page;
    this.state.currentStepIndex = null;
    this.state.currentStep = null;
  }

  updatePage(page: string) {
    this.state.currentPage = page;
  }
}
