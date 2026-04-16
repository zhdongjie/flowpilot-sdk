import type { FlowPilotEvent } from "./protocol";

export type BehaviorType = "click" | "form" | "route";

export type Completion =
  | {
      type: "event";
      name?: string;
      match?: (event: FlowPilotEvent) => boolean;
    }
  | {
      type: "state";
      validator: (ctx: any) => boolean;
    };

export interface StepBehavior {
  type: BehaviorType;
  trigger?: {
    selector?: string;
  };
  autoEmit?: string;
  completion?: Completion;
}

export type StepCompletePayload = {
  stepId: number;
  event: FlowPilotEvent;
};
