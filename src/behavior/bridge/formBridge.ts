import { EventBus } from "../eventBus";
import type { BehaviorEvent } from "../protocol";

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

export const initFormBridge = (eventBus: EventBus) => {
  if (typeof document === "undefined") {
    return () => {};
  }

  const resolveGuideForm = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
      return null;
    }
    const form = target instanceof HTMLFormElement ? target : target.closest("form");
    if (!(form instanceof HTMLFormElement)) {
      return null;
    }

    const guideNode = form.closest("[data-guide-id]");
    if (!guideNode) {
      return null;
    }

    const guideId = guideNode.getAttribute("data-guide-id");
    if (!guideId) {
      return null;
    }

    return { form, guideId };
  };

  const emitFormEvent = (event: Event) => {
    const resolved = resolveGuideForm(event.target);
    if (!resolved) {
      return;
    }
    const { form, guideId } = resolved;

    const eventPayload: BehaviorEvent = {
      source: "form",
      guideId,
      formData: serializeFormData(form),
      timestamp: Date.now(),
    };

    eventBus.emit("BEHAVIOR_EVENT", eventPayload);
  };

  const onSubmit = (event: Event) => {
    emitFormEvent(event);
  };

  const onInput = (event: Event) => {
    emitFormEvent(event);
  };

  const onChange = (event: Event) => {
    emitFormEvent(event);
  };

  document.addEventListener("submit", onSubmit, true);
  document.addEventListener("input", onInput, true);
  document.addEventListener("change", onChange, true);

  return () => {
    document.removeEventListener("submit", onSubmit, true);
    document.removeEventListener("input", onInput, true);
    document.removeEventListener("change", onChange, true);
  };
};
