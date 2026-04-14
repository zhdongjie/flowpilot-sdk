export type FormField = {
  field: string;
  desc?: string;
};

export type Step = {
  step: number;
  highlight: string;
  action?: string;
  desc?: string;
  page?: string;
  state?: Record<string, any>;
  form?: FormField[];
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

export type StepContext = {
  currentPage?: string;
  currentStep?: number | null;
  state?: Record<string, any>;
};

export type InitConfig = {
  workflow: Workflow | Workflow[];
  mapping?: MappingRegistry;
  debug?: boolean;
  autoStart?: boolean;
  getCurrentPage?: () => string;
  getState?: () => Record<string, any>;
  onStepChange?: (step: Step) => void;
  onFinish?: () => void;
  onError?: (err: Error) => void;
};
