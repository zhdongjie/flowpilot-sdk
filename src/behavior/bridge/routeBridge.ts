import { EventBus } from "../eventBus";
import type { ActionEvent } from "../protocol";

const buildRouteEvent = (): ActionEvent => ({
  type: "ACTION",
  name: "sdk_route_change",
  meta: {
    timestamp: Date.now(),
    source: "sdk",
    trigger: "route",
    page: window.location.pathname,
    context: {
      search: window.location.search,
      hash: window.location.hash,
    },
  },
});

export const initRouteBridge = (eventBus: EventBus) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const emitRouteChange = () => {
    eventBus.emit("ACTION", buildRouteEvent());
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
