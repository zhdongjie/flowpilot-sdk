import { EventBus } from "../eventBus";
import type { BehaviorEvent } from "../protocol";

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
    if (!guideNode) {
      return;
    }

    const guideId = guideNode.getAttribute("data-guide-id");
    if (!guideId) {
      return;
    }

    const eventPayload: BehaviorEvent = {
      source: "click",
      guideId,
      timestamp: Date.now(),
    };

    eventBus.emit("BEHAVIOR_EVENT", eventPayload);
  };

  document.addEventListener("click", handler, true);

  return () => {
    document.removeEventListener("click", handler, true);
  };
};
