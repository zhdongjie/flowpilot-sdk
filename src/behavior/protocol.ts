export type BehaviorSource = "click" | "form" | "route" | "fetch";

export type BehaviorEvent = {
  source: BehaviorSource;
  timestamp: number;
  guideId?: string;
  pathname?: string;
  formData?: Record<string, any>;
  url?: string;
  method?: string;
  status?: number;
  ok?: boolean;
};
