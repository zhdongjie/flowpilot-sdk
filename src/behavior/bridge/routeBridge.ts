import { EventBus } from "../eventBus";
import type { BehaviorEvent } from "../protocol";

const buildRouteEvent = (): BehaviorEvent => ({
  source: "route",
  pathname: window.location.pathname,
  timestamp: Date.now(),
});

export const initRouteBridge = (eventBus: EventBus) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const emitRouteChange = () => {
    eventBus.emit("BEHAVIOR_EVENT", buildRouteEvent());
  };

  const onPopState = () => emitRouteChange();
  const onHashChange = () => emitRouteChange();

  window.addEventListener("popstate", onPopState);
  window.addEventListener("hashchange", onHashChange);

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = (...args) => {
    const result = originalPushState(...args);
    emitRouteChange();
    return result;
  };

  history.replaceState = (...args) => {
    const result = originalReplaceState(...args);
    emitRouteChange();
    return result;
  };

  return () => {
    window.removeEventListener("popstate", onPopState);
    window.removeEventListener("hashchange", onHashChange);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
};
