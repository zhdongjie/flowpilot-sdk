const FLOWPILOT_CONFIG_API = "/flowpilot/config";

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
