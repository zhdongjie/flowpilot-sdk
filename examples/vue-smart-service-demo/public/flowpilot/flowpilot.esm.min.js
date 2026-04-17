const normalizeType = (value) => {
  if (value === "click" || value === "form" || value === "route") {
    return value;
  }
  return "click";
};
const normalizeStep = (raw, index) => {
  const idCandidate = (raw == null ? void 0 : raw.id) ?? (raw == null ? void 0 : raw.step);
  const id = typeof idCandidate === "string" ? idCandidate : typeof idCandidate === "number" ? String(idCandidate) : String(index + 1);
  const typeCandidate = (raw == null ? void 0 : raw.type) ?? (Array.isArray(raw == null ? void 0 : raw.form) && raw.form.length ? "form" : "click");
  const highlight = typeof (raw == null ? void 0 : raw.highlight) === "string" ? raw.highlight : "";
  const desc = typeof (raw == null ? void 0 : raw.desc) === "string" ? raw.desc : typeof (raw == null ? void 0 : raw.action) === "string" ? raw.action : void 0;
  return {
    id,
    type: normalizeType(typeCandidate),
    highlight,
    desc
  };
};
const normalizeWorkflow = (raw) => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : "default";
  const sourceSteps = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = sourceSteps.map((step, idx) => normalizeStep(step, idx));
  if (!steps.length) {
    return null;
  }
  return { id, steps };
};
const normalizeWorkflows = (input) => {
  const rawList = Array.isArray(input) ? input : [input];
  const normalized = rawList.map((item) => normalizeWorkflow(item)).filter((item) => Boolean(item));
  if (normalized.length) {
    return normalized;
  }
  return [];
};
const getTargetText = (target) => {
  var _a;
  const text = ((_a = target.textContent) == null ? void 0 : _a.trim()) || "";
  if (!text) {
    return void 0;
  }
  return text.length > 120 ? text.slice(0, 120) : text;
};
class BehaviorListener {
  constructor(eventBus, options) {
    this.detachFns = [];
    this.eventBus = eventBus;
    this.getCurrentPage = options.getCurrentPage;
  }
  start() {
    if (typeof document !== "undefined") {
      this.bindClick();
      this.bindForm();
    }
    if (typeof window !== "undefined") {
      this.bindRoute();
    }
  }
  stop() {
    this.detachFns.forEach((dispose) => dispose());
    this.detachFns = [];
  }
  bindClick() {
    const onClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const guideNode = target.closest("[data-guide-id]");
      const guideId = (guideNode == null ? void 0 : guideNode.getAttribute("data-guide-id")) || void 0;
      const text = getTargetText(target);
      const element = guideId || text ? {
        selector: guideId ? `[data-guide-id='${guideId}']` : void 0,
        guideId,
        text
      } : void 0;
      const actionEvent = {
        type: "ACTION",
        name: "sdk_click",
        meta: {
          timestamp: Date.now(),
          source: "sdk",
          trigger: "click",
          page: this.getCurrentPage(),
          element
        }
      };
      this.eventBus.emit("ACTION", actionEvent);
    };
    document.addEventListener("click", onClick, true);
    this.detachFns.push(() => document.removeEventListener("click", onClick, true));
  }
  bindForm() {
    const serializeFormData = (form) => {
      const fd = new FormData(form);
      const output = {};
      fd.forEach((value, key) => {
        if (key in output) {
          const current = output[key];
          output[key] = Array.isArray(current) ? [...current, value] : [current, value];
          return;
        }
        output[key] = value;
      });
      return output;
    };
    const onSubmit = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const form = target instanceof HTMLFormElement ? target : target.closest("form");
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      const guideNode = form.closest("[data-guide-id]");
      const guideId = (guideNode == null ? void 0 : guideNode.getAttribute("data-guide-id")) || void 0;
      const element = guideId ? {
        selector: `[data-guide-id='${guideId}']`,
        guideId
      } : void 0;
      const actionEvent = {
        type: "ACTION",
        name: "sdk_form_submit",
        meta: {
          timestamp: Date.now(),
          source: "sdk",
          trigger: "form",
          page: this.getCurrentPage(),
          element,
          context: {
            formData: serializeFormData(form)
          }
        }
      };
      this.eventBus.emit("ACTION", actionEvent);
    };
    document.addEventListener("submit", onSubmit, true);
    this.detachFns.push(() => document.removeEventListener("submit", onSubmit, true));
  }
  bindRoute() {
    const emitRoute = () => {
      const actionEvent = {
        type: "ACTION",
        name: "sdk_route_change",
        meta: {
          timestamp: Date.now(),
          source: "sdk",
          trigger: "route",
          page: this.getCurrentPage(),
          context: {
            search: typeof window !== "undefined" ? window.location.search : "",
            hash: typeof window !== "undefined" ? window.location.hash : ""
          }
        }
      };
      this.eventBus.emit("ACTION", actionEvent);
    };
    const onPopState = () => emitRoute();
    const onHashChange = () => emitRoute();
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    history.pushState = (...args) => {
      const result = originalPushState(...args);
      emitRoute();
      return result;
    };
    history.replaceState = (...args) => {
      const result = originalReplaceState(...args);
      emitRoute();
      return result;
    };
    this.detachFns.push(() => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    });
  }
}
const createHighlight = (root) => {
  const highlight = document.createElement("div");
  highlight.className = "fp-highlight";
  highlight.style.display = "none";
  root.appendChild(highlight);
  const maskTop = document.createElement("div");
  const maskLeft = document.createElement("div");
  const maskRight = document.createElement("div");
  const maskBottom = document.createElement("div");
  [maskTop, maskLeft, maskRight, maskBottom].forEach((el) => {
    el.className = "fp-mask-piece";
    el.style.display = "none";
    root.appendChild(el);
  });
  const update = (rect) => {
    if (!rect || rect.width <= 1 || rect.height <= 1) {
      highlight.style.display = "none";
      [maskTop, maskLeft, maskRight, maskBottom].forEach((el) => {
        el.style.display = "none";
      });
      return;
    }
    const pad = 8;
    const top = Math.max(rect.top - pad, 0);
    const left = Math.max(rect.left - pad, 0);
    const right = Math.min(rect.left + rect.width + pad, window.innerWidth);
    const bottom = Math.min(rect.top + rect.height + pad, window.innerHeight);
    const middleHeight = Math.max(bottom - top, 0);
    highlight.style.display = "block";
    highlight.style.top = `${top}px`;
    highlight.style.left = `${left}px`;
    highlight.style.width = `${right - left}px`;
    highlight.style.height = `${middleHeight}px`;
    maskTop.style.display = "block";
    maskTop.style.top = "0px";
    maskTop.style.left = "0px";
    maskTop.style.width = `${window.innerWidth}px`;
    maskTop.style.height = `${top}px`;
    maskBottom.style.display = "block";
    maskBottom.style.top = `${bottom}px`;
    maskBottom.style.left = "0px";
    maskBottom.style.width = `${window.innerWidth}px`;
    maskBottom.style.height = `${window.innerHeight - bottom}px`;
    maskLeft.style.display = "block";
    maskLeft.style.top = `${top}px`;
    maskLeft.style.left = "0px";
    maskLeft.style.width = `${left}px`;
    maskLeft.style.height = `${middleHeight}px`;
    maskRight.style.display = "block";
    maskRight.style.top = `${top}px`;
    maskRight.style.left = `${right}px`;
    maskRight.style.width = `${window.innerWidth - right}px`;
    maskRight.style.height = `${middleHeight}px`;
  };
  const destroy2 = () => {
    highlight.remove();
    [maskTop, maskLeft, maskRight, maskBottom].forEach((el) => el.remove());
  };
  return { update, destroy: destroy2 };
};
const createTooltip = (root) => {
  const tooltip = document.createElement("div");
  tooltip.className = "fp-tooltip";
  tooltip.style.display = "none";
  root.appendChild(tooltip);
  const update = (rect, options) => {
    if (!rect || !options.message) {
      tooltip.style.display = "none";
      tooltip.innerHTML = "";
      return;
    }
    tooltip.style.display = "block";
    const margin = 12;
    const rawTop = rect.bottom + margin;
    const maxLeft = window.innerWidth - 300;
    const left = Math.max(12, Math.min(rect.left, maxLeft));
    const top = rawTop + 120 > window.innerHeight ? Math.max(12, rect.top - 80) : rawTop;
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.innerHTML = "";
    const title = document.createElement("div");
    title.className = "fp-tooltip-title";
    title.textContent = options.message || "";
    tooltip.appendChild(title);
    if (options.reason) {
      const reason = document.createElement("div");
      reason.className = "fp-tooltip-reason";
      reason.textContent = options.reason;
      tooltip.appendChild(reason);
    }
    if (options.showNext && options.onNext) {
      const btn = document.createElement("button");
      btn.className = "fp-tooltip-action";
      btn.type = "button";
      btn.textContent = "I have filled it";
      btn.addEventListener("click", options.onNext, { once: true });
      tooltip.appendChild(btn);
    }
  };
  const destroy2 = () => {
    tooltip.remove();
  };
  return { update, destroy: destroy2 };
};
const STYLE_TEXT = `
:host { all: initial; }
* { box-sizing: border-box; font-family: "Noto Sans SC", sans-serif; }
.fp-highlight {
  position: fixed;
  border: 2px solid #f1b256;
  border-radius: 12px;
  box-shadow: 0 0 0 6px rgba(241, 178, 86, 0.22);
  pointer-events: none;
  z-index: 9999;
  display: none;
}
.fp-mask-piece {
  position: fixed;
  background: rgba(12, 18, 28, 0.5);
  border-radius: 0;
  pointer-events: none;
  z-index: 9998;
  display: none;
}
.fp-tooltip {
  position: fixed;
  background: #0f1b2b;
  color: #f7f9fc;
  padding: 12px 14px;
  border-radius: 12px;
  max-width: 280px;
  font-size: 12px;
  line-height: 1.5;
  pointer-events: auto;
  z-index: 10000;
  display: none;
}
.fp-tooltip-title { font-weight: 600; margin-bottom: 6px; }
.fp-tooltip-reason { opacity: 0.8; margin-bottom: 8px; }
.fp-tooltip-action {
  border: none;
  background: #f1b256;
  color: #1b1f23;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}
`;
class GuideRuntime {
  constructor(root) {
    this.activeElement = null;
    this.activeOptions = {};
    this.onGlobalUpdate = () => {
      this.refresh();
    };
    this.root = root;
    const style = document.createElement("style");
    style.textContent = STYLE_TEXT;
    this.root.appendChild(style);
    this.style = style;
    this.highlight = createHighlight(this.root);
    this.tooltip = createTooltip(this.root);
    this.highlight.update(null);
    this.tooltip.update(null, { message: "", reason: "" });
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.onGlobalUpdate);
      window.addEventListener("scroll", this.onGlobalUpdate, true);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("transitionend", this.onGlobalUpdate, true);
      document.addEventListener("animationend", this.onGlobalUpdate, true);
    }
  }
  render(element, options = {}) {
    this.activeElement = element;
    this.activeOptions = {
      message: options.message || "",
      reason: options.reason || "",
      showNext: options.showNext,
      onNext: options.onNext
    };
    this.refresh();
  }
  clear() {
    this.activeElement = null;
    this.activeOptions = {};
    this.highlight.update(null);
    this.tooltip.update(null, { message: "", reason: "" });
  }
  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.onGlobalUpdate);
      window.removeEventListener("scroll", this.onGlobalUpdate, true);
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("transitionend", this.onGlobalUpdate, true);
      document.removeEventListener("animationend", this.onGlobalUpdate, true);
    }
    this.clear();
    this.highlight.destroy();
    this.tooltip.destroy();
    if (this.style.parentNode) {
      this.style.parentNode.removeChild(this.style);
    }
  }
  refresh() {
    if (!this.activeElement || !this.activeElement.isConnected) {
      this.highlight.update(null);
      this.tooltip.update(null, { message: "", reason: "" });
      return;
    }
    const rect = this.activeElement.getBoundingClientRect();
    this.highlight.update(rect);
    this.tooltip.update(rect, {
      message: this.activeOptions.message || "",
      reason: this.activeOptions.reason || "",
      showNext: this.activeOptions.showNext,
      onNext: this.activeOptions.onNext
    });
  }
}
const normalizeEntry = (entry) => {
  if (!entry) {
    return { selector: "", fallback: [], pages: [] };
  }
  if (typeof entry === "string") {
    return { selector: entry, fallback: [], pages: [] };
  }
  return {
    selector: entry.selector || "",
    fallback: Array.isArray(entry.fallback) ? entry.fallback : [],
    pages: Array.isArray(entry.pages) ? entry.pages : []
  };
};
class DomAdapter {
  constructor(root, mapping, getCurrentPage) {
    this.mapping = mapping;
    this.getCurrentPageImpl = getCurrentPage;
    this.ui = new GuideRuntime(root);
  }
  getCurrentPage() {
    if (this.getCurrentPageImpl) {
      return this.getCurrentPageImpl() || "";
    }
    if (typeof window !== "undefined") {
      return window.location.pathname || "";
    }
    return "";
  }
  resolveStepElement(step) {
    return this.resolveElement(step.highlight);
  }
  canResolveStep(step) {
    if (step.type === "route") {
      return true;
    }
    const resolved = this.resolveStepElement(step);
    return Boolean(resolved.element);
  }
  renderStep(step) {
    const resolved = this.resolveStepElement(step);
    this.ui.render(resolved.element, {
      message: step.desc || "",
      reason: step.desc || ""
    });
  }
  clear() {
    this.ui.clear();
  }
  destroy() {
    this.ui.destroy();
  }
  resolveElement(key) {
    const selectors = this.resolveSelectors(key);
    const pages = this.resolvePages(key);
    const currentPage = this.getCurrentPage();
    if (pages.length && currentPage && !pages.includes(currentPage)) {
      return { element: null, selectors };
    }
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return { element, selectors };
      }
    }
    return { element: null, selectors };
  }
  resolveSelectors(key) {
    if (!key) {
      return [];
    }
    const entry = normalizeEntry(this.mapping ? this.mapping[key] : null);
    const selectors = [];
    if (entry.selector) {
      selectors.push(entry.selector);
    }
    if (entry.fallback.length) {
      entry.fallback.forEach((item) => selectors.push(item));
    }
    const guideSelector = `[data-guide-id="${key}"]`;
    if (!selectors.includes(guideSelector)) {
      selectors.push(guideSelector);
    }
    return selectors.filter(Boolean);
  }
  resolvePages(key) {
    const entry = normalizeEntry(this.mapping ? this.mapping[key] : null);
    return Array.isArray(entry.pages) ? entry.pages : [];
  }
}
const mountShadowRoot = () => {
  const existing = document.getElementById("flowpilot-root");
  if (existing && existing.shadowRoot) {
    return existing.shadowRoot;
  }
  const host = document.createElement("div");
  host.id = "flowpilot-root";
  document.body.appendChild(host);
  return host.attachShadow({ mode: "open" });
};
class EventBus {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  on(event, handler) {
    const set = this.listeners.get(event) ?? /* @__PURE__ */ new Set();
    set.add(handler);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }
  off(event, handler) {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    set.delete(handler);
    if (set.size === 0) {
      this.listeners.delete(event);
    }
  }
  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    set.forEach((handler) => handler(payload));
  }
}
class RuntimeLifecycle {
  constructor(adapter, hooks) {
    this.adapter = adapter;
    this.hooks = hooks;
  }
  enterStep(step) {
    var _a, _b;
    this.adapter.renderStep(step);
    (_b = (_a = this.hooks).onStepChange) == null ? void 0 : _b.call(_a, step);
  }
  clearStep() {
    this.adapter.clear();
  }
  finish() {
    var _a, _b;
    this.adapter.clear();
    (_b = (_a = this.hooks).onFinish) == null ? void 0 : _b.call(_a);
  }
  error(error) {
    var _a, _b;
    console.error("[FlowPilot]", error);
    (_b = (_a = this.hooks).onError) == null ? void 0 : _b.call(_a, error);
  }
  destroy() {
    this.adapter.destroy();
  }
}
const validateStepEvent = (step, event) => {
  var _a;
  if (event.meta.trigger !== step.type) {
    return { valid: false, reason: "trigger-mismatch" };
  }
  if ((step.type === "click" || step.type === "form") && step.highlight) {
    const guideId = (_a = event.meta.element) == null ? void 0 : _a.guideId;
    if (!guideId || guideId !== step.highlight) {
      return { valid: false, reason: "element-mismatch" };
    }
  }
  return { valid: true, reason: "ok" };
};
class RuntimeStateStore {
  constructor(initialPage) {
    this.state = {
      status: "idle",
      workflow: null,
      currentStepIndex: null,
      currentStep: null,
      currentPage: initialPage
    };
  }
  get snapshot() {
    return { ...this.state };
  }
  setPage(page) {
    this.state.currentPage = page;
  }
  start(workflow, page) {
    this.state.status = "running";
    this.state.workflow = workflow;
    this.state.currentPage = page;
    this.state.currentStepIndex = null;
    this.state.currentStep = null;
  }
  setStep(index, step) {
    this.state.currentStepIndex = index;
    this.state.currentStep = step;
  }
  finish() {
    this.state.status = "finished";
    this.state.currentStep = null;
    this.state.currentStepIndex = null;
  }
  reset(page) {
    this.state.status = "idle";
    this.state.workflow = null;
    this.state.currentStepIndex = null;
    this.state.currentStep = null;
    this.state.currentPage = page;
  }
}
class RuntimeEngine {
  constructor(options) {
    this.detachAction = null;
    this.workflows = options.workflows;
    this.eventBus = options.eventBus;
    this.adapter = options.adapter;
    this.lifecycle = options.lifecycle;
    this.recovery = options.recovery;
    this.debug = Boolean(options.debug);
    this.state = new RuntimeStateStore(this.adapter.getCurrentPage());
    this.bindAction();
  }
  start(workflowId) {
    const workflow = this.resolveWorkflow(workflowId);
    if (!workflow) {
      this.lifecycle.error(new Error("Workflow not found"));
      return;
    }
    if (!workflow.steps.length) {
      this.lifecycle.error(new Error("Workflow has no steps"));
      return;
    }
    this.state.start(workflow, this.adapter.getCurrentPage());
    this.log("start", workflow.id);
    this.activateStep(0);
  }
  reset() {
    this.state.reset(this.adapter.getCurrentPage());
    this.lifecycle.clearStep();
  }
  destroy() {
    if (this.detachAction) {
      this.detachAction();
      this.detachAction = null;
    }
    this.reset();
    this.lifecycle.destroy();
  }
  bindAction() {
    this.detachAction = this.eventBus.on("ACTION", (event) => {
      this.handleAction(event);
    });
  }
  handleAction(event) {
    const snapshot = this.state.snapshot;
    if (snapshot.status !== "running" || !snapshot.workflow || !snapshot.currentStep) {
      return;
    }
    this.state.setPage(event.meta.page || this.adapter.getCurrentPage());
    const validation = validateStepEvent(snapshot.currentStep, event);
    if (validation.valid) {
      this.log("complete", snapshot.currentStep.id, event.name);
      this.advance();
      return;
    }
    this.log("mismatch", validation.reason, event.name);
    const recovered = this.recovery.recover(
      snapshot.workflow,
      snapshot.currentStepIndex ?? 0
    );
    this.activateStep(recovered.index);
  }
  advance() {
    const snapshot = this.state.snapshot;
    if (!snapshot.workflow || typeof snapshot.currentStepIndex !== "number") {
      return;
    }
    const nextIndex = snapshot.currentStepIndex + 1;
    if (nextIndex >= snapshot.workflow.steps.length) {
      this.finish();
      return;
    }
    this.activateStep(nextIndex);
  }
  activateStep(index) {
    const snapshot = this.state.snapshot;
    const workflow = snapshot.workflow;
    if (snapshot.status !== "running" || !workflow) {
      return;
    }
    if (index < 0 || index >= workflow.steps.length) {
      this.finish();
      return;
    }
    const step = workflow.steps[index];
    this.state.setStep(index, step);
    this.lifecycle.enterStep(step);
    this.log("activate", step.id);
  }
  finish() {
    this.state.finish();
    this.lifecycle.finish();
    this.log("finish");
  }
  resolveWorkflow(workflowId) {
    return this.workflows.find((item) => item.id === workflowId) || this.workflows[0] || null;
  }
  log(...args) {
    if (this.debug) {
      console.log("[FlowPilot:engine]", ...args);
    }
  }
}
const reconcileStepIndex = (workflow, currentIndex, adapter) => {
  const steps = workflow.steps;
  if (!steps.length) {
    return null;
  }
  const start2 = Math.max(0, Math.min(currentIndex, steps.length - 1));
  for (let offset = 0; offset < steps.length; offset += 1) {
    const forward = start2 + offset;
    if (forward < steps.length && adapter.canResolveStep(steps[forward])) {
      return forward;
    }
    const backward = start2 - offset;
    if (backward >= 0 && adapter.canResolveStep(steps[backward])) {
      return backward;
    }
  }
  return null;
};
class RecoveryManager {
  constructor(adapter) {
    this.adapter = adapter;
  }
  recover(workflow, currentIndex) {
    const reconciledIndex = reconcileStepIndex(workflow, currentIndex, this.adapter);
    if (typeof reconciledIndex === "number") {
      return { type: "jump", index: reconciledIndex };
    }
    return { type: "reset", index: 0 };
  }
}
const VERSION = "0.2.0";
const GLOBAL_INIT_FLAG = "__FLOWPILOT__";
const state = {
  config: null,
  workflows: [],
  eventBus: null,
  adapter: null,
  listener: null,
  engine: null,
  initialized: false
};
const resolveCurrentPage = () => {
  var _a;
  if (state.adapter) {
    return state.adapter.getCurrentPage();
  }
  if ((_a = state.config) == null ? void 0 : _a.getCurrentPage) {
    return state.config.getCurrentPage() || "";
  }
  if (typeof window !== "undefined") {
    return window.location.pathname || "";
  }
  return "";
};
const normalizeActionEvent = (event) => {
  if (!event || typeof event.name !== "string" || !event.name.trim()) {
    throw new Error("FlowPilot.emit requires a non-empty event.name");
  }
  const metaInput = event.meta || {};
  const meta = {
    timestamp: typeof metaInput.timestamp === "number" ? metaInput.timestamp : Date.now(),
    source: metaInput.source || "system",
    trigger: metaInput.trigger || "manual",
    page: typeof metaInput.page === "string" && metaInput.page.length > 0 ? metaInput.page : resolveCurrentPage(),
    stepId: metaInput.stepId,
    workflowId: metaInput.workflowId,
    element: metaInput.element ? {
      selector: metaInput.element.selector,
      guideId: metaInput.element.guideId,
      text: metaInput.element.text
    } : void 0,
    context: metaInput.context ? { ...metaInput.context } : void 0
  };
  return {
    type: "ACTION",
    name: event.name,
    payload: event.payload,
    meta
  };
};
const init = (config) => {
  var _a;
  if (typeof window !== "undefined" && window[GLOBAL_INIT_FLAG]) {
    console.warn("[FlowPilot] already initialized on this page.");
    return;
  }
  if (state.initialized) {
    console.warn("[FlowPilot] init has already been called.");
    return;
  }
  const workflows = normalizeWorkflows(config.workflow);
  if (!workflows.length) {
    (_a = config.onError) == null ? void 0 : _a.call(config, new Error("Workflow not found"));
    return;
  }
  const eventBus = new EventBus();
  const root = mountShadowRoot();
  const adapter = new DomAdapter(root, config.mapping, config.getCurrentPage);
  const lifecycle = new RuntimeLifecycle(adapter, {
    onStepChange: config.onStepChange,
    onFinish: config.onFinish,
    onError: config.onError
  });
  const recovery = new RecoveryManager(adapter);
  const engine = new RuntimeEngine({
    workflows,
    eventBus,
    adapter,
    lifecycle,
    recovery,
    debug: config.debug
  });
  const listener = new BehaviorListener(eventBus, {
    getCurrentPage: () => adapter.getCurrentPage()
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
    window[GLOBAL_INIT_FLAG] = true;
  }
  if (config.autoStart) {
    const firstWorkflow = workflows[0];
    if (firstWorkflow) {
      engine.start(firstWorkflow.id);
    }
  }
};
const start = (taskId) => {
  var _a;
  (_a = state.engine) == null ? void 0 : _a.start(taskId);
};
const emit = (event) => {
  var _a, _b, _c;
  try {
    const normalized = normalizeActionEvent(event);
    (_a = state.eventBus) == null ? void 0 : _a.emit("ACTION", normalized);
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error("FlowPilot.emit failed");
    (_c = (_b = state.config) == null ? void 0 : _b.onError) == null ? void 0 : _c.call(_b, normalizedError);
    throw normalizedError;
  }
};
const reset = () => {
  var _a;
  (_a = state.engine) == null ? void 0 : _a.reset();
};
const destroy = () => {
  var _a, _b;
  (_a = state.listener) == null ? void 0 : _a.stop();
  (_b = state.engine) == null ? void 0 : _b.destroy();
  const host = document.getElementById("flowpilot-root");
  if (host && host.parentNode) {
    host.parentNode.removeChild(host);
  }
  if (typeof window !== "undefined") {
    delete window[GLOBAL_INIT_FLAG];
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
  version: VERSION
};
if (typeof window !== "undefined") {
  window.FlowPilot = FlowPilot;
}
export {
  FlowPilot as default
};
