import type { InitConfig } from "../types";

export type RuntimeAdapter = {
  getCurrentPage: () => string;
};

export const createRuntimeAdapter = (config: InitConfig): RuntimeAdapter => {
  const getCurrentPage = () => {
    if (config.getCurrentPage) {
      return config.getCurrentPage() || "";
    }
    if (typeof window !== "undefined") {
      return window.location.pathname || "";
    }
    return "";
  };

  return { getCurrentPage };
};
