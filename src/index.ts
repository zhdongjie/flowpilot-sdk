import type { InitConfig, Step, Workflow } from "./types";
import { mountShadowRoot } from "./runtime/shadow";
import { FlowPilotRuntime } from "./runtime/runtime";
import { mountChat } from "./ui/chat";

type PluginState = {
  config: InitConfig | null;
  runtime: FlowPilotRuntime | null;
  chat: ReturnType<typeof mountChat> | null;
  initialized: boolean;
};

const VERSION = "0.2.0";
const GLOBAL_INIT_FLAG = "__FLOWPILOT__";
const DEFAULT_STEP_MESSAGE = "Please continue the flow.";
const FINISH_MESSAGE = "Flow completed.";

const state: PluginState = {
  config: null,
  runtime: null,
  chat: null,
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

const wrapConfig = (config: InitConfig): InitConfig => {
  const userOnStepChange = config.onStepChange;
  const userOnFinish = config.onFinish;
  const userOnError = config.onError;

  return {
    ...config,
    onStepChange: (step: Step) => {
      if (state.chat) {
        const message = step.action || step.desc || DEFAULT_STEP_MESSAGE;
        state.chat.addMessage("assistant", message);
      }
      userOnStepChange?.(step);
    },
    onFinish: () => {
      if (state.chat) {
        state.chat.addMessage("assistant", FINISH_MESSAGE);
      }
      userOnFinish?.();
    },
    onError: (err: Error) => {
      userOnError?.(err);
    },
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
  state.chat = mountChat(shadowRoot, {
    onSend: (text) => start(text, true),
  });

  const runtimeConfig = wrapConfig(config);
  state.runtime = new FlowPilotRuntime(runtimeConfig, shadowRoot);
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
      runtimeConfig.onError?.(new Error("Workflow not found for autoStart"));
    }
  }
};

const start = (intent: string, fromChat = false) => {
  if (!state.runtime) {
    return;
  }
  if (!fromChat && state.chat) {
    state.chat.addMessage("user", intent);
  }
  state.runtime.start(intent);
};

const next = () => {
  state.runtime?.next();
};

const reset = () => {
  state.runtime?.reset();
};

const destroy = () => {
  state.runtime?.destroy();
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
