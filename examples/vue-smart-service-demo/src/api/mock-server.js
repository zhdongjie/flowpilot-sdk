import flowPilotData from "../flowpilot/flowpilot-data.json";

const OPEN_ACCOUNT_STEPS = [
  {
    step: 1,
    page: "/home",
    id: "step_login_submit",
    action: "Submit login form",
    highlight: "ui.form_login",
    desc: "Submit the login form to enter customer service center.",
  },
  {
    step: 2,
    page: "/customer",
    id: "step_menu_open_account",
    action: "Click Open Account",
    highlight: "ui.menu_open_account",
    desc: "Choose Open Account business menu after login.",
  },
  {
    step: 3,
    page: "/customer/create",
    id: "step_submit_application",
    action: "Submit account opening form",
    highlight: "ui.form_open_account",
    desc: "Submit the account opening form and wait for success.",
  },
];

const INSTALL_FLAG = "__FLOW_PILOT_MOCK_API_INSTALLED__";

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const randomDelay = () => 220 + Math.floor(Math.random() * 380);

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
};

const readBody = async (input, init) => {
  if (typeof init?.body === "string") {
    return safeJsonParse(init.body);
  }

  if (typeof Request !== "undefined" && input instanceof Request) {
    const clone = input.clone();
    const text = await clone.text();
    if (!text) {
      return {};
    }
    return safeJsonParse(text);
  }

  return {};
};

const resolvePathname = (input) => {
  let raw = "";
  if (typeof input === "string") {
    raw = input;
  } else if (input instanceof URL) {
    raw = input.toString();
  } else if (typeof Request !== "undefined" && input instanceof Request) {
    raw = input.url;
  }

  const resolved = new URL(raw || "/", window.location.origin);
  return resolved.pathname;
};

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const resolveIntent = (message) => {
  const text = String(message || "").toLowerCase();
  if (!text.trim()) {
    return "unknown";
  }
  if (
    /(开户|开卡|开账户|open account|open|account|register|signup|create account)/i.test(
      text
    )
  ) {
    return "open_account";
  }
  return "unknown";
};

const formatReply = (currentPage, nextStep) => {
  const lines = [
    `Current page: ${currentPage || "unknown"}`,
    "",
    "Flow:",
    ...OPEN_ACCOUNT_STEPS.map((step) => `${step.step}. ${step.action} (${step.page})`),
    "",
    "Suggested next step:",
    nextStep ? nextStep.action : "Flow completed.",
  ];
  return lines.join("\n");
};

const nextStepByCurrentStep = (currentStep) => {
  if (typeof currentStep !== "number") {
    return OPEN_ACCOUNT_STEPS[0] || null;
  }
  return OPEN_ACCOUNT_STEPS.find((step) => step.step === currentStep + 1) || null;
};

const handleChat = async ({ body }) => {
  await delay(randomDelay());

  const message = String(body?.message || "").trim();
  const currentPage = String(body?.current_page || "");
  const currentStep =
    typeof body?.current_step === "number" ? body.current_step : undefined;

  if (!message) {
    return jsonResponse(
      {
        reply: "Empty input.",
        message: "Please enter intent text, for example: I want to open an account.",
        highlight: null,
        reason: "No valid message provided.",
        next_step: null,
      },
      400
    );
  }

  const intent = resolveIntent(message);
  if (intent === "unknown") {
    return jsonResponse({
      reply: "Intent not recognized.",
      message: "Try: I want to open an account.",
      highlight: null,
      reason: "This demo currently focuses on open-account flow.",
      next_step: null,
    });
  }

  const nextStep = nextStepByCurrentStep(currentStep);
  if (!nextStep) {
    return jsonResponse({
      reply: formatReply(currentPage, null),
      message: "Flow completed.",
      highlight: null,
      reason: "All steps are complete.",
      next_step: null,
    });
  }

  return jsonResponse({
    reply: formatReply(currentPage, nextStep),
    message: nextStep.action,
    highlight: nextStep.highlight,
    reason: nextStep.desc,
    next_step: {
      step: nextStep.step,
      page: nextStep.page,
      id: nextStep.id,
      action: nextStep.action,
      highlight: nextStep.highlight,
      desc: nextStep.desc,
    },
  });
};

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");

const handleLogin = async ({ body }) => {
  await delay(randomDelay());

  const phone = normalizePhone(body?.phone);
  const code = String(body?.code || "").trim();

  if (!phone || !code) {
    return jsonResponse({ detail: "Phone and code are required." }, 400);
  }

  if (code === "0000") {
    return jsonResponse({ detail: "Invalid verification code." }, 401);
  }

  return jsonResponse({
    status: "ok",
    intro: "Login success, welcome to customer service center.",
    user: {
      name: "Demo User",
      phone,
    },
  });
};

const buildApplicationId = () =>
  `AP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const handleOpenAccount = async ({ body }) => {
  await delay(randomDelay());

  const name = String(body?.name || "").trim();
  const idCard = String(body?.id_card || "").trim();

  if (!name || !idCard) {
    return jsonResponse({ detail: "Name and ID card are required." }, 400);
  }

  const applicationId = buildApplicationId();
  return jsonResponse({
    status: "submitted",
    intro: `Application received. Tracking number: ${applicationId}.`,
    application_id: applicationId,
  });
};

const handleFlowPilotConfig = async () => {
  await delay(randomDelay());
  return jsonResponse({
    workflow: flowPilotData.workflow,
    mapping: flowPilotData.mapping,
  });
};

const ROUTE_HANDLERS = {
  "/flowpilot/config": handleFlowPilotConfig,
  "/chat": handleChat,
  "/auth/login": handleLogin,
  "/account/open": handleOpenAccount,
};

export const installMockApi = () => {
  if (typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }

  if (window[INSTALL_FLAG]) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const pathname = resolvePathname(input);
    const handler = ROUTE_HANDLERS[pathname];
    if (!handler) {
      return originalFetch(input, init);
    }

    const body = await readBody(input, init);
    return handler({ body, input, init });
  };

  window[INSTALL_FLAG] = true;
};
