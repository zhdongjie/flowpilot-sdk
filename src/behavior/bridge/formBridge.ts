import { EventBus } from "../eventBus";
import type { ActionEvent } from "../protocol";

const serializeFormData = (form: HTMLFormElement) => {
  const formData = new FormData(form);
  const output: Record<string, any> = {};

  formData.forEach((value, key) => {
    if (key in output) {
      const current = output[key];
      output[key] = Array.isArray(current) ? [...current, value] : [current, value];
      return;
    }
    output[key] = value;
  });

  return output;
};

const getPage = () => {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.pathname || "";
};

export const initFormBridge = (eventBus: EventBus) => {
  if (typeof document === "undefined") {
    return () => {};
  }

  const resolveForm = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
      return null;
    }

    const form = target instanceof HTMLFormElement ? target : target.closest("form");
    if (!(form instanceof HTMLFormElement)) {
      return null;
    }

    const guideNode = form.closest("[data-guide-id]");
    const guideId = guideNode?.getAttribute("data-guide-id") || undefined;

    return { form, guideId };
  };

  const emitFormEvent = (event: Event) => {
    const resolved = resolveForm(event.target);
    if (!resolved) {
      return;
    }

    const { form, guideId } = resolved;
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
        page: getPage(),
        element,
        context: {
          formData: serializeFormData(form),
        },
      },
    };

    eventBus.emit("ACTION", actionEvent);
  };

  const onSubmit = (event: Event) => emitFormEvent(event);

  document.addEventListener("submit", onSubmit, true);

  return () => {
    document.removeEventListener("submit", onSubmit, true);
  };
};
