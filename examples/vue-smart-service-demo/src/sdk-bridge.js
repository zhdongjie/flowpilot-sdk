const FLOWPILOT_CONFIG_API = "/flowpilot/config";

const stepChangeListeners = new Set();
const finishListeners = new Set();

const getFlowPilot = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.FlowPilot || null;
};

const loadFlowPilotConfig = async () => {
  const response = await fetch(FLOWPILOT_CONFIG_API, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Load FlowPilot config failed: HTTP ${response.status}`);
  }

  return response.json();
};

const notifyStepChange = (step) => {
  stepChangeListeners.forEach((listener) => {
    listener(step);
  });
};

const notifyFinish = () => {
  finishListeners.forEach((listener) => {
    listener();
  });
};

export const subscribeFlowPilot = ({ onStepChange, onFinish } = {}) => {
  if (typeof onStepChange === "function") {
    stepChangeListeners.add(onStepChange);
  }

  if (typeof onFinish === "function") {
    finishListeners.add(onFinish);
  }

  return () => {
    if (typeof onStepChange === "function") {
      stepChangeListeners.delete(onStepChange);
    }

    if (typeof onFinish === "function") {
      finishListeners.delete(onFinish);
    }
  };
};

export const initFlowPilot = async () => {
  const FlowPilot = getFlowPilot();
  if (!FlowPilot) {
    console.warn("[FlowPilot Demo] SDK not loaded, skip init.");
    return;
  }

  try {
    const config = await loadFlowPilotConfig();
    FlowPilot.init({
      workflow: config.workflow,
      mapping: config.mapping,
      autoStart: false,
      onStepChange: notifyStepChange,
      onFinish: notifyFinish,
    });
  } catch (error) {
    console.error("[FlowPilot Demo] init failed:", error);
  }
};

export const startFlowPilot = (taskId = "open_account") => {
  const FlowPilot = getFlowPilot();
  if (!FlowPilot) {
    console.warn("[FlowPilot Demo] SDK not loaded, skip start.");
    return false;
  }

  FlowPilot.start(taskId);
  return true;
};

export const resetFlowPilot = () => {
  const FlowPilot = getFlowPilot();
  if (!FlowPilot) {
    return false;
  }

  FlowPilot.reset();
  return true;
};
