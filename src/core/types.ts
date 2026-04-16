export type StepType = "click" | "form" | "route";

export type Step = {
  id: string;
  type: StepType;
  highlight: string;
  desc?: string;
};

export type Workflow = {
  id: string;
  steps: Step[];
};

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
