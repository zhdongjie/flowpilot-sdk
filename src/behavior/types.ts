import type { ActionEvent } from "./protocol";

export type BehaviorType = "click" | "form" | "route";

export type Completion =
  | {
      type: "event";
      name?: string;
      match?: (event: ActionEvent) => boolean;
    }
  | {
      type: "state";
      validator: (ctx: any) => boolean;
    };

export interface StepBehavior {
  type: BehaviorType;
  autoEmit?: string;
  completion?: Completion;
}

export type StepCompletePayload = {
  stepId: number;
  event: ActionEvent;
};
