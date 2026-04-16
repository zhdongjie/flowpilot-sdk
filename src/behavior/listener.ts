import type { ActionEvent } from "./protocol";
import { EventBus } from "../runtime/eventBus";

const getTargetText = (target: Element) => {
  const text = target.textContent?.trim() || "";
  if (!text) {
    return undefined;
  }
  return text.length > 120 ? text.slice(0, 120) : text;
};

type ListenerOptions = {
  getCurrentPage: () => string;
};

export class BehaviorListener {
  private eventBus: EventBus;
  private getCurrentPage: () => string;
  private detachFns: Array<() => void> = [];

  constructor(eventBus: EventBus, options: ListenerOptions) {
    this.eventBus = eventBus;
    this.getCurrentPage = options.getCurrentPage;
  }

  start() {
    if (typeof document !== "undefined") {
      this.bindClick();
      this.bindForm();
    }

    if (typeof window !== "undefined") {
      this.bindRoute();
    }
  }

  stop() {
    this.detachFns.forEach((dispose) => dispose());
    this.detachFns = [];
  }

  private bindClick() {
    const onClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const guideNode = target.closest("[data-guide-id]");
      const guideId = guideNode?.getAttribute("data-guide-id") || undefined;
      const text = getTargetText(target);
      const element = guideId || text
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
          page: this.getCurrentPage(),
          element,
        },
      };

      this.eventBus.emit("ACTION", actionEvent);
    };

    document.addEventListener("click", onClick, true);
    this.detachFns.push(() => document.removeEventListener("click", onClick, true));
  }

  private bindForm() {
    const serializeFormData = (form: HTMLFormElement) => {
      const fd = new FormData(form);
      const output: Record<string, any> = {};
      fd.forEach((value, key) => {
        if (key in output) {
          const current = output[key];
          output[key] = Array.isArray(current) ? [...current, value] : [current, value];
          return;
        }
        output[key] = value;
      });
      return output;
    };

    const onSubmit = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const form = target instanceof HTMLFormElement ? target : target.closest("form");
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      const guideNode = form.closest("[data-guide-id]");
      const guideId = guideNode?.getAttribute("data-guide-id") || undefined;
      const element = guideId
        ? {
            selector: `[data-guide-id='${guideId}']`,
            guideId,
          }
        : undefined;

      const actionEvent: ActionEvent = {
        type: "ACTION",
        name: "sdk_form_submit",
        meta: {
          timestamp: Date.now(),
          source: "sdk",
          trigger: "form",
          page: this.getCurrentPage(),
          element,
          context: {
            formData: serializeFormData(form),
          },
        },
      };

      this.eventBus.emit("ACTION", actionEvent);
    };

    document.addEventListener("submit", onSubmit, true);
    this.detachFns.push(() => document.removeEventListener("submit", onSubmit, true));
  }

  private bindRoute() {
    const emitRoute = () => {
      const actionEvent: ActionEvent = {
        type: "ACTION",
        name: "sdk_route_change",
        meta: {
          timestamp: Date.now(),
          source: "sdk",
          trigger: "route",
          page: this.getCurrentPage(),
          context: {
            search: typeof window !== "undefined" ? window.location.search : "",
            hash: typeof window !== "undefined" ? window.location.hash : "",
          },
        },
      };

      this.eventBus.emit("ACTION", actionEvent);
    };

    const onPopState = () => emitRoute();
    const onHashChange = () => emitRoute();

    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      const result = originalPushState(...args);
      emitRoute();
      return result;
    };

    history.replaceState = (...args) => {
      const result = originalReplaceState(...args);
      emitRoute();
      return result;
    };

    this.detachFns.push(() => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    });
  }
}
