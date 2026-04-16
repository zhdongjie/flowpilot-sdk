import { EventBus } from "../eventBus";
import { initClickBridge } from "./clickBridge";
import { initFormBridge } from "./formBridge";
import { initRouteBridge } from "./routeBridge";
import { initNetworkBridge } from "./networkBridge";

export const initBehaviorBridge = (eventBus: EventBus) => {
  const cleanups = [
    initClickBridge(eventBus),
    initFormBridge(eventBus),
    initRouteBridge(eventBus),
    initNetworkBridge(eventBus),
  ];

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};

export { initClickBridge, initFormBridge, initRouteBridge, initNetworkBridge };
