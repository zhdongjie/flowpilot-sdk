export type StepType = "click" | "form" | "route";

export type Step = Readonly<{
  id: string;
  type: StepType;
  highlight: string;
  desc?: string;
}>;

export type Workflow = Readonly<{
  id: string;
  steps: readonly Step[];
}>;

export type MappingEntry =
  | string
  | {
      selector: string;
      fallback?: string[];
      pages?: string[];
    };

export type MappingRegistry = Record<string, MappingEntry>;

export type InitConfig = {
  workflow: Workflow | Workflow[] | Record<string, any> | Record<string, any>[];
  mapping?: MappingRegistry;
  debug?: boolean;
  autoStart?: boolean;
  getCurrentPage?: () => string;
  onStepChange?: (step: Step) => void;
  onFinish?: () => void;
  onError?: (err: Error) => void;
};

export type FlowPilotEventSource = "user" | "system" | "sdk";

export type FlowPilotEventTrigger = StepType | "manual";

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
  stepId?: string;
  workflowId?: string;
  element?: FlowPilotEventElement;
  context?: Record<string, any>;
};

export type ActionEvent = {
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
