import type { InitConfig, Workflow } from "./core/types";
import { normalizeWorkflows } from "./core/workflow";
import { BehaviorListener } from "./behavior/listener";
import type { ActionEvent, ActionEventInput, FlowPilotEventMeta } from "./behavior/protocol";
import { DomAdapter } from "./adapter/dom";
import { mountShadowRoot } from "./runtime/shadow";
import { EventBus } from "./runtime/eventBus";
import { RuntimeLifecycle } from "./runtime/lifecycle";
import { RuntimeEngine } from "./runtime/engine";
import { RecoveryManager } from "./recovery/recovery";

type PluginState = {
  config: InitConfig | null;
  workflows: Workflow[];
  eventBus: EventBus | null;
  adapter: DomAdapter | null;
  listener: BehaviorListener | null;
  engine: RuntimeEngine | null;
  initialized: boolean;
};

const VERSION = "0.2.0";
const GLOBAL_INIT_FLAG = "__FLOWPILOT__";

const state: PluginState = {
  config: null,
  workflows: [],
  eventBus: null,
  adapter: null,
  listener: null,
  engine: null,
  initialized: false,
};

const resolveCurrentPage = () => {
  if (state.adapter) {
    return state.adapter.getCurrentPage();
  }
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

  const workflows = normalizeWorkflows(config.workflow);
  if (!workflows.length) {
    config.onError?.(new Error("Workflow not found"));
    return;
  }

  const eventBus = new EventBus();
  const root = mountShadowRoot();
  const adapter = new DomAdapter(root, config.mapping, config.getCurrentPage);
  const lifecycle = new RuntimeLifecycle(adapter, {
    onStepChange: config.onStepChange,
    onFinish: config.onFinish,
    onError: config.onError,
  });
  const recovery = new RecoveryManager(adapter);
  const engine = new RuntimeEngine({
    workflows,
    eventBus,
    adapter,
    lifecycle,
    recovery,
    debug: config.debug,
  });
  const listener = new BehaviorListener(eventBus, {
    getCurrentPage: () => adapter.getCurrentPage(),
  });

  listener.start();

  state.config = config;
  state.workflows = workflows;
  state.eventBus = eventBus;
  state.adapter = adapter;
  state.listener = listener;
  state.engine = engine;
  state.initialized = true;

  if (typeof window !== "undefined") {
    (window as any)[GLOBAL_INIT_FLAG] = true;
  }

  if (config.autoStart) {
    const firstWorkflow = workflows[0];
    if (firstWorkflow) {
      engine.start(firstWorkflow.id);
    }
  }
};

const start = (taskId: string) => {
  state.engine?.start(taskId);
};

const emit = (event: ActionEventInput) => {
  try {
    const normalized = normalizeActionEvent(event);
    state.eventBus?.emit("ACTION", normalized);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error("FlowPilot.emit failed");
    state.config?.onError?.(normalizedError);
    throw normalizedError;
  }
};

const reset = () => {
  state.engine?.reset();
};

const destroy = () => {
  state.listener?.stop();
  state.engine?.destroy();

  const host = document.getElementById("flowpilot-root");
  if (host && host.parentNode) {
    host.parentNode.removeChild(host);
  }

  if (typeof window !== "undefined") {
    delete (window as any)[GLOBAL_INIT_FLAG];
  }

  state.config = null;
  state.workflows = [];
  state.eventBus = null;
  state.adapter = null;
  state.listener = null;
  state.engine = null;
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
