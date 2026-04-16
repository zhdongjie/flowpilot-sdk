import type { ActionEvent, BehaviorEvent } from "./protocol";

export type BehaviorType = "click" | "form" | "route";

export type Completion =
  | { type: "event"; name: string }
  | { type: "state"; validator: (ctx: any) => boolean };

export interface StepBehavior {
  type: BehaviorType;
  trigger?: {
    selector?: string;
  };
  completion?: Completion;
}

export type StepCompletePayload = {
  stepId: number;
  event: BehaviorEvent | ActionEvent;
};
