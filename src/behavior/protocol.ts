export type BehaviorSource = "click" | "form" | "route";

export type BehaviorEvent = {
  source: BehaviorSource;
  timestamp: number;
  guideId?: string;
  pathname?: string;
  formData?: Record<string, any>;
};

export type ActionEvent = {
  type: "ACTION";
  name: string;
  payload?: any;
};
