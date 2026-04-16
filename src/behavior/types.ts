import type { BehaviorEvent } from "./protocol";

export type BehaviorType = "click" | "form" | "route";

export interface StepBehavior {
  type: BehaviorType;
  trigger?: {
    selector?: string;
  };
  completion?: {
    type: "event" | "state" | "dom";
    validator?: (ctx: any) => boolean;
  };
}

export type StepCompletePayload = {
  stepId: number;
  event: BehaviorEvent;
};
