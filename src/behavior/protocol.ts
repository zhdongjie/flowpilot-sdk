export type FlowPilotEventSource = "user" | "system" | "sdk" | "ai";

export type FlowPilotEventTrigger =
  | "click"
  | "route"
  | "form"
  | "api"
  | "manual";

export type FlowPilotEventElement = {
  selector?: string;
  guideId?: string;
  text?: string;
};

export type FlowPilotEventMeta = {
  timestamp: number;
  source: FlowPilotEventSource;
  trigger: FlowPilotEventTrigger;
  page: string;
  stepId?: number;
  workflowId?: string;
  element?: FlowPilotEventElement;
  context?: Record<string, any>;
};

export type FlowPilotEvent = {
  type: "ACTION";
  name: string;
  payload?: any;
  meta: FlowPilotEventMeta;
};

export type ActionEventInput = {
  type?: "ACTION";
  name: string;
  payload?: any;
  meta?: Partial<FlowPilotEventMeta>;
};

export type ActionEvent = FlowPilotEvent;

export type BehaviorSource = Extract<FlowPilotEventTrigger, "click" | "route" | "form">;
export type BehaviorEvent = FlowPilotEvent;
