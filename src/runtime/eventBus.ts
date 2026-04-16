import type { ActionEvent } from "../behavior/protocol";

type EventHandler<T> = (payload: T) => void;

export type RuntimeEvents = {
  ACTION: ActionEvent;
};

export class EventBus {
  private listeners = new Map<keyof RuntimeEvents, Set<EventHandler<any>>>();

  on<K extends keyof RuntimeEvents>(event: K, handler: EventHandler<RuntimeEvents[K]>) {
    const set = this.listeners.get(event) ?? new Set<EventHandler<any>>();
    set.add(handler as EventHandler<any>);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }

  off<K extends keyof RuntimeEvents>(event: K, handler: EventHandler<RuntimeEvents[K]>) {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    set.delete(handler as EventHandler<any>);
    if (set.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<K extends keyof RuntimeEvents>(event: K, payload: RuntimeEvents[K]) {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    set.forEach((handler) => handler(payload));
  }
}
