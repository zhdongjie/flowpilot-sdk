import type { InitConfig, Step } from "./types";
import { resolveNextStep } from "./core/engine";
import { resolveElement } from "./mapping/resolver";
import { mountShadowRoot } from "./runtime/shadow";
import { GuideRuntime } from "./runtime/runtime";
import { mountChat } from "./ui/chat";

type PluginState = {
  config: InitConfig | null;
  runtime: GuideRuntime | null;
  currentStep: number | null;
  currentIntent: string;
  currentStepData: Step | null;
  currentElement: Element | null;
  currentTarget: Element | null;
  clickHandler: ((event: Event) => void) | null;
  chat: ReturnType<typeof mountChat> | null;
  initialized: boolean;
};

const VERSION = "0.1.0";
const GLOBAL_INIT_FLAG = "__FLOWPILOT__";

const state: PluginState = {
  config: null,
  runtime: null,
  currentStep: null,
  currentIntent: "",
  currentStepData: null,
  currentElement: null,
  currentTarget: null,
  clickHandler: null,
  chat: null,
  initialized: false,
};

const getWorkflow = (taskId?: string) => {
  if (!state.config) {
    return null;
  }
  const workflows = Array.isArray(state.config.workflow)
    ? state.config.workflow
    : [state.config.workflow];
  if (taskId) {
    return workflows.find((item) => item.id === taskId) || workflows[0] || null;
  }
  return workflows[0] || null;
};

const getCurrentPage = () => {
  if (state.config?.getCurrentPage) {
    return state.config.getCurrentPage();
  }
  return window.location.pathname || "";
};

const getState = () => {
  if (state.config?.getState) {
    return state.config.getState() || {};
  }
  return {};
};

const logDebug = (...args: any[]) => {
  if (state.config?.debug) {
    console.log("[FlowPilot]", ...args);
  }
};

const handleError = (err: unknown) => {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error("[FlowPilot]", error);
  state.config?.onError?.(error);
};

const clearListener = () => {
  if (state.currentTarget && state.clickHandler) {
    state.currentTarget.removeEventListener("click", state.clickHandler);
  }
  state.currentTarget = null;
  state.clickHandler = null;
};

const refreshCurrentStep = () => {
  if (!state.runtime || !state.config || !state.currentStepData) {
    return;
  }
  const { element } = resolveElement(
    state.currentStepData.highlight,
    state.config.mapping,
    getCurrentPage()
  );
  state.currentElement = element;
  state.runtime.render(state.currentStepData, element, () =>
    advance(state.currentStepData?.step ?? null)
  );
  attachAdvance(state.currentStepData, element);
};

const attachAdvance = (step: Step, element: Element | null) => {
  clearListener();
  const isFormStep = Boolean(step.form && step.form.length);
  if (!element || isFormStep) {
    return;
  }
  const handler = () => {
    advance(step.step);
  };
  element.addEventListener("click", handler, { once: true });
  state.currentTarget = element;
  state.clickHandler = handler;
};

const advance = (currentStep: number | null) => {
  if (!state.config || !state.runtime) {
    return;
  }
  const workflow = getWorkflow(state.currentIntent);
  if (!workflow) {
    handleError(new Error("Workflow not found"));
    return;
  }
  if (!workflow.steps || workflow.steps.length === 0) {
    handleError(new Error("Workflow has no steps"));
    return;
  }
  if (
    typeof currentStep === "number" &&
    !workflow.steps.some((step) => step.step === currentStep)
  ) {
    handleError(new Error(`Step ${currentStep} not found in workflow`));
    return;
  }
  const next = resolveNextStep(workflow, {
    currentStep,
    currentPage: getCurrentPage(),
    state: getState(),
  });
  const prevStep = state.currentStep;
  state.currentStep = next ? next.step : null;
  state.currentStepData = next;

  if (!next) {
    clearListener();
    state.currentElement = null;
    state.runtime.clear();
    if (state.chat && prevStep !== null) {
      state.chat.addMessage("assistant", "✅ 已完成");
    }
    state.config.onFinish?.();
    return;
  }

  const { element, selectors } = resolveElement(
    next.highlight,
    state.config.mapping,
    getCurrentPage()
  );

  if (!element) {
    handleError(
      new Error(
        `Element not found for "${next.highlight}". Tried selectors: ${selectors.join(
          ", "
        )}`
      )
    );
  }

  state.currentElement = element;
  state.runtime.render(next, element, () => advance(next.step));
  attachAdvance(next, element);

  if (state.chat && prevStep !== next.step) {
    const message = next.action || next.desc || "请继续完成流程。";
    state.chat.addMessage("assistant", message);
  }
  state.config.onStepChange?.(next);
  logDebug("step change", next);
};

const init = (config: InitConfig) => {
  if (typeof window !== "undefined" && (window as any)[GLOBAL_INIT_FLAG]) {
    console.warn("[FlowPilot] already initialized on this page.");
    return;
  }
  if (state.initialized) {
    console.warn("[FlowPilot] init has already been called.");
    return;
  }
  state.config = config;
  const shadowRoot = mountShadowRoot();
  state.runtime = new GuideRuntime(shadowRoot);
  state.chat = mountChat(shadowRoot, {
    onSend: (text) => start(text, true),
  });

  if (!state.initialized) {
    window.addEventListener("scroll", refreshCurrentStep, true);
    window.addEventListener("resize", refreshCurrentStep);
    state.initialized = true;
    (window as any)[GLOBAL_INIT_FLAG] = true;
  }

  if (state.config.debug) {
    logDebug("init", config);
  }

  if (state.config.autoStart) {
    const workflow = getWorkflow();
    if (workflow) {
      start(workflow.id);
    } else {
      handleError(new Error("Workflow not found for autoStart"));
    }
  }
};

const start = (intent: string, fromChat = false) => {
  state.currentIntent = intent;
  if (!fromChat && state.chat) {
    state.chat.addMessage("user", intent);
  }
  advance(null);
};

const next = () => advance(state.currentStep);

const reset = () => {
  clearListener();
  state.currentStep = null;
  state.currentStepData = null;
  state.currentElement = null;
  state.currentIntent = "";
  state.runtime?.clear();
};

const destroy = () => {
  reset();
  if (state.runtime) {
    state.runtime.clear();
  }
  if (state.initialized) {
    window.removeEventListener("scroll", refreshCurrentStep, true);
    window.removeEventListener("resize", refreshCurrentStep);
  }
  const host = document.getElementById("flowpilot-root");
  if (host && host.parentNode) {
    host.parentNode.removeChild(host);
  }
  if (typeof window !== "undefined") {
    delete (window as any)[GLOBAL_INIT_FLAG];
  }
  state.config = null;
  state.runtime = null;
  state.chat = null;
  state.initialized = false;
};

const FlowPilot = { init, start, next, reset, destroy, version: VERSION };

if (typeof window !== "undefined") {
  (window as any).FlowPilot = FlowPilot;
}

export default FlowPilot;
