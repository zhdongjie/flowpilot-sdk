import type { BehaviorEvent } from "./protocol";
import type { BehaviorRule } from "./rule";

export type BehaviorType = "click" | "form" | "route";

export interface StepBehavior {
  type: BehaviorType;
  trigger?: {
    selector?: string;
  };
  completion?: {
    type: "event" | "state" | "dom";
    validator?: (ctx: any) => boolean;
    rule?: BehaviorRule;
  };
}

export type StepCompletePayload = {
  stepId: number;
  event: BehaviorEvent;
};
