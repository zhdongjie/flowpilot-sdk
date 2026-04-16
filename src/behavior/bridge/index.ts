import { BehaviorListener } from "../listener";
import type { EventBus } from "../../runtime/eventBus";

export const initClickBridge = (_eventBus: EventBus) => {
  return () => {};
};

export const initFormBridge = (_eventBus: EventBus) => {
  return () => {};
};

export const initRouteBridge = (_eventBus: EventBus) => {
  return () => {};
};

export const initBehaviorBridge = (eventBus: EventBus, getCurrentPage: () => string) => {
  const listener = new BehaviorListener(eventBus, { getCurrentPage });
  listener.start();
  return () => listener.stop();
};
