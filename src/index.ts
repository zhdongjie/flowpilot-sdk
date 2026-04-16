import type { InitConfig, Workflow } from "./types";
import { initBehaviorBridge } from "./behavior/bridge";
import type { ActionEvent, ActionEventInput, FlowPilotEventMeta } from "./behavior/protocol";
import { eventBus } from "./behavior/eventBus";
import { mountShadowRoot } from "./runtime/shadow";
import { FlowPilotRuntime } from "./runtime/runtime";

type PluginState = {
  config: InitConfig | null;
  runtime: FlowPilotRuntime | null;
  disposeBehaviorBridge: (() => void) | null;
  initialized: boolean;
};

const VERSION = "0.2.0";
const GLOBAL_INIT_FLAG = "__FLOWPILOT__";

const state: PluginState = {
  config: null,
  runtime: null,
  disposeBehaviorBridge: null,
  initialized: false,
};

const logDebug = (...args: any[]) => {
  if (state.config?.debug) {
    console.log("[FlowPilot]", ...args);
  }
};

const getWorkflow = (config: InitConfig, taskId?: string): Workflow | null => {
  const workflows = Array.isArray(config.workflow)
    ? config.workflow
    : [config.workflow];
  if (taskId) {
    return workflows.find((item) => item.id === taskId) || workflows[0] || null;
  }
  return workflows[0] || null;
};

const resolveCurrentPage = () => {
  if (state.config?.getCurrentPage) {
    return state.config.getCurrentPage() || "";
  }
  if (typeof window !== "undefined") {
    return window.location.pathname || "";
  }
  return "";
};

const normalizeActionEvent = (event: ActionEventInput): ActionEvent => {
  if (!event || typeof event.name !== "string" || !event.name.trim()) {
    throw new Error("FlowPilot.emit requires a non-empty event.name");
  }

  const metaInput = event.meta || {};
  const meta: FlowPilotEventMeta = {
    timestamp:
      typeof metaInput.timestamp === "number" ? metaInput.timestamp : Date.now(),
    source: metaInput.source || "system",
    trigger: metaInput.trigger || "manual",
    page:
      typeof metaInput.page === "string" && metaInput.page.length > 0
        ? metaInput.page
        : resolveCurrentPage(),
    stepId: metaInput.stepId,
    workflowId: metaInput.workflowId,
    element: metaInput.element
      ? {
          selector: metaInput.element.selector,
          guideId: metaInput.element.guideId,
          text: metaInput.element.text,
        }
      : undefined,
    context: metaInput.context ? { ...metaInput.context } : undefined,
  };

  return {
    type: "ACTION",
    name: event.name,
    payload: event.payload,
    meta,
  };
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
  state.runtime = new FlowPilotRuntime(config, shadowRoot, eventBus);
  state.disposeBehaviorBridge = initBehaviorBridge(eventBus);
  state.initialized = true;
  (window as any)[GLOBAL_INIT_FLAG] = true;

  if (state.config.debug) {
    logDebug("init", config);
  }

  if (state.config.autoStart) {
    const workflow = getWorkflow(config);
    if (workflow) {
      start(workflow.id);
    } else {
      config.onError?.(new Error("Workflow not found for autoStart"));
    }
  }
};

const start = (intent: string) => {
  if (!state.runtime) {
    return;
  }
  state.runtime.start(intent);
};

const emit = (event: ActionEventInput) => {
  try {
    const normalized = normalizeActionEvent(event);
    eventBus.emit("ACTION", normalized);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error("FlowPilot.emit failed");
    state.config?.onError?.(normalizedError);
    throw normalizedError;
  }
};

const reset = () => {
  state.runtime?.reset();
};

const destroy = () => {
  state.runtime?.destroy();
  state.disposeBehaviorBridge?.();
  const host = document.getElementById("flowpilot-root");
  if (host && host.parentNode) {
    host.parentNode.removeChild(host);
  }
  if (typeof window !== "undefined") {
    delete (window as any)[GLOBAL_INIT_FLAG];
  }
  state.config = null;
  state.runtime = null;
  state.disposeBehaviorBridge = null;
  state.initialized = false;
};

const FlowPilot = {
  init,
  start,
  emit,
  reset,
  destroy,
  version: VERSION,
};

if (typeof window !== "undefined") {
  (window as any).FlowPilot = FlowPilot;
}

export default FlowPilot;
