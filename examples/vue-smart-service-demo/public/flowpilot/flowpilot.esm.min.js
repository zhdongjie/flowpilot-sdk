const normalizeType = (value) => {
  if (value === "click" || value === "form" || value === "route") {
    return value;
  }
  return "click";
};
const normalizeId = (value, index) => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return String(index + 1);
};
const normalizeDescription = (raw) => {
  if (typeof (raw == null ? void 0 : raw.desc) === "string" && raw.desc.trim()) {
    return raw.desc.trim();
  }
  if (typeof (raw == null ? void 0 : raw.action) === "string" && raw.action.trim()) {
    return raw.action.trim();
  }
  return void 0;
};
const normalizeStep = (raw, index) => {
  const typeCandidate = (raw == null ? void 0 : raw.type) ?? (Array.isArray(raw == null ? void 0 : raw.form) && raw.form.length > 0 ? "form" : "click");
  const desc = normalizeDescription(raw);
  const step = {
    id: normalizeId((raw == null ? void 0 : raw.id) ?? (raw == null ? void 0 : raw.step), index),
    type: normalizeType(typeCandidate),
    highlight: typeof (raw == null ? void 0 : raw.highlight) === "string" ? raw.highlight.trim() : "",
    ...desc ? { desc } : {}
  };
  return Object.freeze(step);
};
const normalizeWorkflow = (raw, index) => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : index === 0 ? "default" : `workflow_${index + 1}`;
  const sourceSteps = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = sourceSteps.map((step, idx) => normalizeStep(step, idx));
  if (!steps.length) {
    return null;
  }
  return Object.freeze({
    id,
    steps: Object.freeze(steps.slice())
  });
};
const normalizeWorkflows = (input) => {
  const rawList = Array.isArray(input) ? input : [input];
  const normalized = rawList.map((item, index) => normalizeWorkflow(item, index)).filter((item) => Boolean(item));
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
    this.started = false;
    this.eventBus = eventBus;
    this.getCurrentPage = options.getCurrentPage;
  }
  start() {
    if (this.started) {
      return;
    }
    this.started = true;
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
    this.started = false;
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
  max-width: 300px;
  font-size: 12px;
  line-height: 1.5;
  pointer-events: none;
  z-index: 10000;
  display: none;
}
.fp-tooltip-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.fp-tooltip-reason {
  opacity: 0.8;
}
`;
const normalizeEntry = (entry) => {
  if (!entry) {
    return { selector: "", fallback: [], pages: [] };
  }
  if (typeof entry === "string") {
    return { selector: entry, fallback: [], pages: [] };
  }
  return {
    selector: typeof entry.selector === "string" ? entry.selector : "",
    fallback: Array.isArray(entry.fallback) ? entry.fallback.filter(Boolean) : [],
    pages: Array.isArray(entry.pages) ? entry.pages.filter(Boolean) : []
  };
};
const ensureShadowRoot = () => {
  const existing = document.getElementById("flowpilot-root");
  if (existing == null ? void 0 : existing.shadowRoot) {
    return existing.shadowRoot;
  }
  const host = document.createElement("div");
  host.id = "flowpilot-root";
  (document.body || document.documentElement).appendChild(host);
  return host.attachShadow({ mode: "open" });
};
class GuideRenderer {
  constructor(root) {
    this.activeElement = null;
    this.activeTooltip = null;
    this.onGlobalUpdate = () => {
      this.refresh();
    };
    this.root = root;
    this.style = document.createElement("style");
    this.style.textContent = STYLE_TEXT;
    this.root.appendChild(this.style);
    this.highlight = document.createElement("div");
    this.highlight.className = "fp-highlight";
    this.root.appendChild(this.highlight);
    this.masks = Array.from({ length: 4 }, () => {
      const piece = document.createElement("div");
      piece.className = "fp-mask-piece";
      this.root.appendChild(piece);
      return piece;
    });
    this.tooltip = document.createElement("div");
    this.tooltip.className = "fp-tooltip";
    this.tooltipTitle = document.createElement("div");
    this.tooltipTitle.className = "fp-tooltip-title";
    this.tooltipReason = document.createElement("div");
    this.tooltipReason.className = "fp-tooltip-reason";
    this.tooltip.appendChild(this.tooltipTitle);
    this.tooltip.appendChild(this.tooltipReason);
    this.root.appendChild(this.tooltip);
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.onGlobalUpdate);
      window.addEventListener("scroll", this.onGlobalUpdate, true);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("transitionend", this.onGlobalUpdate, true);
      document.addEventListener("animationend", this.onGlobalUpdate, true);
    }
  }
  render(element, tooltip) {
    this.activeElement = element;
    this.activeTooltip = tooltip;
    this.refresh();
  }
  clear() {
    this.activeElement = null;
    this.activeTooltip = null;
    this.hideHighlight();
    this.hideTooltip();
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
    this.highlight.remove();
    this.masks.forEach((piece) => piece.remove());
    this.tooltip.remove();
    this.style.remove();
  }
  refresh() {
    var _a;
    if (!((_a = this.activeTooltip) == null ? void 0 : _a.message)) {
      this.hideHighlight();
      this.hideTooltip();
      return;
    }
    if (!this.activeElement || !this.activeElement.isConnected) {
      this.hideHighlight();
      this.updateTooltip(null, this.activeTooltip);
      return;
    }
    const rect = this.activeElement.getBoundingClientRect();
    this.updateHighlight(rect);
    this.updateTooltip(rect, this.activeTooltip);
  }
  updateHighlight(rect) {
    if (!rect || rect.width <= 1 || rect.height <= 1) {
      this.hideHighlight();
      return;
    }
    const pad = 8;
    const top = Math.max(rect.top - pad, 0);
    const left = Math.max(rect.left - pad, 0);
    const right = Math.min(rect.left + rect.width + pad, window.innerWidth);
    const bottom = Math.min(rect.top + rect.height + pad, window.innerHeight);
    const middleHeight = Math.max(bottom - top, 0);
    const [maskTop, maskLeft, maskRight, maskBottom] = this.masks;
    this.highlight.style.display = "block";
    this.highlight.style.top = `${top}px`;
    this.highlight.style.left = `${left}px`;
    this.highlight.style.width = `${right - left}px`;
    this.highlight.style.height = `${middleHeight}px`;
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
  }
  updateTooltip(rect, tooltip) {
    this.tooltip.style.display = "block";
    this.tooltipTitle.textContent = tooltip.message;
    this.tooltipReason.textContent = tooltip.reason;
    this.tooltipReason.style.display = tooltip.reason ? "block" : "none";
    if (!rect) {
      const left2 = Math.max(12, window.innerWidth - 332);
      this.tooltip.style.top = "20px";
      this.tooltip.style.left = `${left2}px`;
      return;
    }
    const margin = 12;
    const rawTop = rect.bottom + margin;
    const maxLeft = window.innerWidth - 320;
    const left = Math.max(12, Math.min(rect.left, maxLeft));
    const top = rawTop + 120 > window.innerHeight ? Math.max(12, rect.top - 80) : rawTop;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }
  hideHighlight() {
    this.highlight.style.display = "none";
    this.masks.forEach((piece) => {
      piece.style.display = "none";
    });
  }
  hideTooltip() {
    this.tooltip.style.display = "none";
    this.tooltipTitle.textContent = "";
    this.tooltipReason.textContent = "";
  }
}
class DomAdapter {
  constructor(mapping, getCurrentPage) {
    this.mapping = mapping;
    this.getCurrentPageImpl = getCurrentPage;
    this.renderer = new GuideRenderer(ensureShadowRoot());
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
  canResolveStep(step, page = this.getCurrentPage()) {
    return this.validateStepAvailability(step, page).valid;
  }
  validateStepAvailability(step, page = this.getCurrentPage()) {
    const resolved = this.resolveStep(step, page);
    if (!resolved.matchedPage) {
      return { valid: false, reason: "page-mismatch" };
    }
    if (step.type === "route") {
      if (resolved.element || resolved.pages.length > 0) {
        return { valid: true, reason: "ok" };
      }
      return { valid: false, reason: "element-missing" };
    }
    if (!resolved.element) {
      return { valid: false, reason: "element-missing" };
    }
    return { valid: true, reason: "ok" };
  }
  matchStepEvent(step, event) {
    const page = event.meta.page || this.getCurrentPage();
    const resolved = this.resolveStep(step, page);
    if (!resolved.matchedPage) {
      return { valid: false, reason: "page-mismatch" };
    }
    if (step.type === "route") {
      return { valid: true, reason: "ok" };
    }
    if (!resolved.element) {
      return { valid: false, reason: "element-missing" };
    }
    if (this.matchesStepElement(step.highlight, resolved.selectors, event.meta.element)) {
      return { valid: true, reason: "ok" };
    }
    return { valid: false, reason: "element-mismatch" };
  }
  renderStep(step) {
    const resolved = this.resolveStep(step, this.getCurrentPage());
    this.renderer.render(resolved.element, {
      message: step.desc || step.id,
      reason: step.desc || ""
    });
  }
  clear() {
    this.renderer.clear();
  }
  destroy() {
    this.renderer.destroy();
  }
  resolveStep(step, page) {
    const selectors = this.resolveSelectors(step.highlight);
    const pages = this.resolvePages(step);
    const matchedPage = !pages.length || pages.includes(page);
    if (!matchedPage || typeof document === "undefined") {
      return {
        element: null,
        selectors,
        pages,
        matchedPage
      };
    }
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return {
          element,
          selectors,
          pages,
          matchedPage
        };
      }
    }
    return {
      element: null,
      selectors,
      pages,
      matchedPage
    };
  }
  resolveSelectors(key) {
    var _a;
    if (!key) {
      return [];
    }
    const entry = normalizeEntry((_a = this.mapping) == null ? void 0 : _a[key]);
    const selectors = [entry.selector, ...entry.fallback].filter(Boolean);
    const guideSelector = `[data-guide-id='${key}']`;
    if (!selectors.includes(guideSelector)) {
      selectors.push(guideSelector);
    }
    return selectors;
  }
  resolvePages(step) {
    var _a;
    const entry = normalizeEntry((_a = this.mapping) == null ? void 0 : _a[step.highlight]);
    if (entry.pages.length > 0) {
      return entry.pages;
    }
    if (step.type === "route" && step.highlight.startsWith("/")) {
      return [step.highlight];
    }
    return [];
  }
  matchesStepElement(highlight, selectors, element) {
    if (!element) {
      return false;
    }
    if (element.guideId && element.guideId === highlight) {
      return true;
    }
    if (element.selector && selectors.includes(element.selector)) {
      return true;
    }
    return false;
  }
}
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
const validateStepAvailability = (step, adapter, page = adapter.getCurrentPage()) => {
  return adapter.validateStepAvailability(step, page);
};
const validateStepEvent = (step, event, adapter) => {
  if (event.meta.trigger !== step.type) {
    return { valid: false, reason: "trigger-mismatch" };
  }
  return adapter.matchStepEvent(step, event);
};
const decideRecovery = (workflow, currentIndex, validation) => {
  if (!workflow.steps.length || currentIndex < 0 || currentIndex >= workflow.steps.length) {
    return { type: "reset", reason: validation.reason };
  }
  if (validation.reason === "page-mismatch" || validation.reason === "element-missing") {
    return { type: "remap", reason: validation.reason };
  }
  if (validation.reason === "trigger-mismatch" || validation.reason === "element-mismatch") {
    return { type: "retry", reason: validation.reason };
  }
  return { type: "reset", reason: validation.reason };
};
const reconcileStepIndex = (workflow, currentIndex, strategy, adapter, page = adapter.getCurrentPage()) => {
  const steps = workflow.steps;
  if (!steps.length) {
    return null;
  }
  if (strategy.type === "reset") {
    return findNearestResolvableStep(steps, 0, adapter, page);
  }
  if (strategy.type === "retry" && currentIndex >= 0 && currentIndex < steps.length && adapter.canResolveStep(steps[currentIndex], page)) {
    return currentIndex;
  }
  const start2 = Math.max(0, Math.min(currentIndex, steps.length - 1));
  return findNearestResolvableStep(steps, start2, adapter, page);
};
const findNearestResolvableStep = (steps, start2, adapter, page) => {
  for (let offset = 0; offset < steps.length; offset += 1) {
    const forward = start2 + offset;
    if (forward < steps.length && adapter.canResolveStep(steps[forward], page)) {
      return forward;
    }
    if (offset === 0) {
      continue;
    }
    const backward = start2 - offset;
    if (backward >= 0 && adapter.canResolveStep(steps[backward], page)) {
      return backward;
    }
  }
  return null;
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
    this.transitionTo(0);
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
    if (snapshot.status !== "running" || !snapshot.workflow || !snapshot.currentStep || typeof snapshot.currentStepIndex !== "number") {
      return;
    }
    this.state.setPage(event.meta.page || this.adapter.getCurrentPage());
    const validation = validateStepEvent(snapshot.currentStep, event, this.adapter);
    if (validation.valid) {
      this.log("complete", snapshot.currentStep.id, event.name);
      this.advance();
      return;
    }
    this.log("mismatch", validation.reason, event.name);
    this.recover(snapshot.workflow, snapshot.currentStepIndex, validation);
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
    this.transitionTo(nextIndex);
  }
  transitionTo(index) {
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
    const validation = validateStepAvailability(
      step,
      this.adapter,
      snapshot.currentPage || this.adapter.getCurrentPage()
    );
    if (!validation.valid) {
      this.log("activate-mismatch", step.id, validation.reason);
      this.recover(workflow, index, validation);
      return;
    }
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
  recover(workflow, currentIndex, validation) {
    var _a;
    const strategy = decideRecovery(workflow, currentIndex, validation);
    const page = this.state.snapshot.currentPage || this.adapter.getCurrentPage();
    const nextIndex = reconcileStepIndex(workflow, currentIndex, strategy, this.adapter, page);
    if (nextIndex === null) {
      this.lifecycle.clearStep();
      this.lifecycle.error(new Error(`Recovery failed: ${validation.reason}`));
      return;
    }
    if (nextIndex === currentIndex && this.adapter.canResolveStep(workflow.steps[currentIndex], page)) {
      this.lifecycle.enterStep(workflow.steps[currentIndex]);
      this.log("retry", workflow.steps[currentIndex].id, validation.reason);
      return;
    }
    this.log("recover", strategy.type, ((_a = workflow.steps[nextIndex]) == null ? void 0 : _a.id) || nextIndex);
    this.transitionTo(nextIndex);
  }
  log(...args) {
    if (this.debug) {
      console.log("[FlowPilot:engine]", ...args);
    }
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
    stepId: typeof metaInput.stepId === "string" && metaInput.stepId.length > 0 ? metaInput.stepId : void 0,
    workflowId: typeof metaInput.workflowId === "string" && metaInput.workflowId.length > 0 ? metaInput.workflowId : void 0,
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
  const adapter = new DomAdapter(config.mapping, config.getCurrentPage);
  const lifecycle = new RuntimeLifecycle(adapter, {
    onStepChange: config.onStepChange,
    onFinish: config.onFinish,
    onError: config.onError
  });
  const engine = new RuntimeEngine({
    workflows,
    eventBus,
    adapter,
    lifecycle,
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
