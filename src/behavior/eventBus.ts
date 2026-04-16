type EventHandler<T = any> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  on<T = any>(event: string, handler: EventHandler<T>) {
    const set = this.listeners.get(event) ?? new Set<EventHandler>();
    set.add(handler as EventHandler);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }

  off<T = any>(event: string, handler: EventHandler<T>) {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    set.delete(handler as EventHandler);
    if (set.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<T = any>(event: string, payload: T) {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    set.forEach((handler) => handler(payload));
  }
}

export const eventBus = new EventBus();
