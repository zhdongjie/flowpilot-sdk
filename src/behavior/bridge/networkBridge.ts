import { EventBus } from "../eventBus";
import type { BehaviorEvent } from "../protocol";

type AxiosLike = {
  interceptors?: {
    response?: {
      use?: (onFulfilled: (response: any) => any) => number;
      eject?: (id: number) => void;
    };
  };
};

const inferFetchMethod = (input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.method) {
    return init.method.toUpperCase();
  }
  if (typeof Request !== "undefined" && input instanceof Request) {
    return (input.method || "GET").toUpperCase();
  }
  return "GET";
};

const inferFetchUrl = (input: RequestInfo | URL) => {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.url;
  }
  return "";
};

export const initNetworkBridge = (eventBus: EventBus) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const cleanups: Array<() => void> = [];

  if (typeof window.fetch === "function") {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      const eventPayload: BehaviorEvent = {
        source: "fetch",
        url: response.url || inferFetchUrl(input),
        method: inferFetchMethod(input, init),
        status: response.status,
        ok: response.ok,
        timestamp: Date.now(),
      };
      eventBus.emit("BEHAVIOR_EVENT", eventPayload);
      return response;
    };

    cleanups.push(() => {
      window.fetch = originalFetch;
    });
  }

  const axios = (window as any).axios as AxiosLike | undefined;
  if (axios?.interceptors?.response?.use) {
    const interceptorId = axios.interceptors.response.use((response: any) => {
      const status = Number(response?.status || 0);
      const eventPayload: BehaviorEvent = {
        source: "fetch",
        url: response?.config?.url || "",
        method: String(response?.config?.method || "GET").toUpperCase(),
        status,
        ok: status >= 200 && status < 300,
        timestamp: Date.now(),
      };
      eventBus.emit("BEHAVIOR_EVENT", eventPayload);
      return response;
    });

    cleanups.push(() => {
      axios.interceptors?.response?.eject?.(interceptorId);
    });
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};
