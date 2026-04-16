import { EventBus } from "../eventBus";
import type { ActionEvent } from "../protocol";

const getPage = () => {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.pathname || "";
};

const getText = (target: Element) => {
  const raw = target.textContent?.trim() || "";
  if (!raw) {
    return undefined;
  }
  return raw.length > 120 ? raw.slice(0, 120) : raw;
};

export const initClickBridge = (eventBus: EventBus) => {
  if (typeof document === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const guideNode = target.closest("[data-guide-id]");
    const guideId = guideNode?.getAttribute("data-guide-id") || undefined;
    const text = getText(target);
    const element =
      guideId || text
        ? {
            selector: guideId ? `[data-guide-id='${guideId}']` : undefined,
            guideId,
            text,
          }
        : undefined;

    const actionEvent: ActionEvent = {
      type: "ACTION",
      name: "sdk_click",
      meta: {
        timestamp: Date.now(),
        source: "sdk",
        trigger: "click",
        page: getPage(),
        element,
      },
    };

    eventBus.emit("ACTION", actionEvent);
  };

  document.addEventListener("click", handler, true);

  return () => {
    document.removeEventListener("click", handler, true);
  };
};
