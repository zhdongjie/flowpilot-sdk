export type RuntimeAdapter = {
  getCurrentPage: () => string;
};

export const createRuntimeAdapter = (config: { getCurrentPage?: () => string }): RuntimeAdapter => {
  return {
    getCurrentPage: () => {
      if (config.getCurrentPage) {
        return config.getCurrentPage() || "";
      }
      if (typeof window !== "undefined") {
        return window.location.pathname || "";
      }
      return "";
    },
  };
};
