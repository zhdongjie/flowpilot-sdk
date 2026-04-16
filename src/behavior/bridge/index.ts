import { EventBus } from "../eventBus";
import { initClickBridge } from "./clickBridge";
import { initFormBridge } from "./formBridge";
import { initRouteBridge } from "./routeBridge";

export const initBehaviorBridge = (eventBus: EventBus) => {
  const cleanups = [
    initClickBridge(eventBus),
    initFormBridge(eventBus),
    initRouteBridge(eventBus),
  ];

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};

export { initClickBridge, initFormBridge, initRouteBridge };
