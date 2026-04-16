import type { DomAdapter } from "../adapter/dom";
import type { Workflow } from "../core/types";
import { reconcileStepIndex } from "./reconcile";

export type RecoveryResult =
  | { type: "jump"; index: number }
  | { type: "reset"; index: number };

export class RecoveryManager {
  private adapter: DomAdapter;

  constructor(adapter: DomAdapter) {
    this.adapter = adapter;
  }

  recover(workflow: Workflow, currentIndex: number): RecoveryResult {
    const reconciledIndex = reconcileStepIndex(workflow, currentIndex, this.adapter);

    if (typeof reconciledIndex === "number") {
      return { type: "jump", index: reconciledIndex };
    }

    return { type: "reset", index: 0 };
  }
}
