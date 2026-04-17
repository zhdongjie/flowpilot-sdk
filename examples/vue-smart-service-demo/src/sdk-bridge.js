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

/**
 * 触发 SDK 动作
 * @param {string} name 动作名称
 * @param {any} payload 业务数据
 * @param {string} stepType 当前步骤的触发类型 ('click' | 'form' | 'route')，默认 'click'
 * @param {string} guideId 目标元素的高亮 ID（如果需要校验元素），默认空
 */
export const emitFlowPilotAction = (name, payload, stepType = "click", guideId = "") => {
  const FlowPilot = getFlowPilot();
  if (!FlowPilot || typeof FlowPilot.emit !== "function") {
    console.warn("[FlowPilot Demo] SDK emit is not available.");
    return false;
  }

  // 组装 V1 架构所需的数据结构
  const eventPayload = {
    type: "ACTION",
    name,
    payload,
    // 补全 meta 信息以通过 V1 架构的 validator 校验
    meta: {
      timestamp: Date.now(),
      source: "business_logic",
      trigger: stepType,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      element: guideId ? { guideId } : undefined,
      context: payload
    }
  };

  FlowPilot.emit(eventPayload);
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