(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.FlowPilot = factory());
})(this, function() {
  "use strict";
  const initClickBridge = (eventBus2) => {
    if (typeof document === "undefined") {
      return () => {
      };
    }
    const handler = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const guideNode = target.closest("[data-guide-id]");
      if (!guideNode) {
        return;
      }
      const guideId = guideNode.getAttribute("data-guide-id");
      if (!guideId) {
        return;
      }
      const eventPayload = {
        source: "click",
        guideId,
        timestamp: Date.now()
      };
      eventBus2.emit("BEHAVIOR_EVENT", eventPayload);
    };
    document.addEventListener("click", handler, true);
    return () => {
      document.removeEventListener("click", handler, true);
    };
  };
  const serializeFormData = (form) => {
    const formData = new FormData(form);
    const output = {};
    formData.forEach((value, key) => {
      if (key in output) {
        const current = output[key];
        output[key] = Array.isArray(current) ? [...current, value] : [current, value];
        return;
      }
      output[key] = value;
    });
    return output;
  };
  const initFormBridge = (eventBus2) => {
    if (typeof document === "undefined") {
      return () => {
      };
    }
    const resolveGuideForm = (target) => {
      if (!(target instanceof Element)) {
        return null;
      }
      const form = target instanceof HTMLFormElement ? target : target.closest("form");
      if (!(form instanceof HTMLFormElement)) {
        return null;
      }
      const guideNode = form.closest("[data-guide-id]");
      if (!guideNode) {
        return null;
      }
      const guideId = guideNode.getAttribute("data-guide-id");
      if (!guideId) {
        return null;
      }
      return { form, guideId };
    };
    const emitFormEvent = (event) => {
      const resolved = resolveGuideForm(event.target);
      if (!resolved) {
        return;
      }
      const { form, guideId } = resolved;
      const eventPayload = {
        source: "form",
        guideId,
        formData: serializeFormData(form),
        timestamp: Date.now()
      };
      eventBus2.emit("BEHAVIOR_EVENT", eventPayload);
    };
    const onSubmit = (event) => emitFormEvent(event);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
    };
  };
  const buildRouteEvent = () => ({
    source: "route",
    pathname: window.location.pathname,
    timestamp: Date.now()
  });
  const initRouteBridge = (eventBus2) => {
    if (typeof window === "undefined") {
      return () => {
      };
    }
    const emitRouteChange = () => {
      eventBus2.emit("BEHAVIOR_EVENT", buildRouteEvent());
    };
    const onPopState = () => emitRouteChange();
    const onHashChange = () => emitRouteChange();
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    history.pushState = (...args) => {
      const result = originalPushState(...args);
      emitRouteChange();
      return result;
    };
    history.replaceState = (...args) => {
      const result = originalReplaceState(...args);
      emitRouteChange();
      return result;
    };
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  };
  const initBehaviorBridge = (eventBus2) => {
    const cleanups = [
      initClickBridge(eventBus2),
      initFormBridge(eventBus2),
      initRouteBridge(eventBus2)
    ];
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
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
  const eventBus = new EventBus();
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
  class BehaviorEngine {
    constructor(eventBus2) {
      this.behaviors = /* @__PURE__ */ new Map();
      this.activeStepId = null;
      this.completedSteps = /* @__PURE__ */ new Set();
      this.detachBehaviorListener = null;
      this.detachActionListener = null;
      this.eventBus = eventBus2;
      this.bindBehaviorEvent();
      this.bindActionEvent();
    }
    register(stepId, behavior, guideId = "") {
      this.behaviors.set(stepId, {
        stepId,
        guideId,
        behavior
      });
    }
    registerStep(step) {
      this.register(step.step, this.resolveBehavior(step), step.highlight || "");
    }
    activate(stepId) {
      const step = this.behaviors.get(stepId);
      if (!step) {
        this.activeStepId = null;
        return;
      }
      this.activeStepId = stepId;
    }
    deactivate() {
      this.activeStepId = null;
    }
    shouldShowConfirm(_stepId) {
      return false;
    }
    reset() {
      this.deactivate();
      this.behaviors.clear();
      this.completedSteps.clear();
    }
    destroy() {
      if (this.detachBehaviorListener) {
        this.detachBehaviorListener();
        this.detachBehaviorListener = null;
      }
      if (this.detachActionListener) {
        this.detachActionListener();
        this.detachActionListener = null;
      }
      this.reset();
    }
    bindBehaviorEvent() {
      this.detachBehaviorListener = this.eventBus.on(
        "BEHAVIOR_EVENT",
        (event) => {
          const current = this.getCurrentStep();
          if (!current) {
            return;
          }
          const autoEmit = current.behavior.autoEmit;
          if (!autoEmit) {
            return;
          }
          if (!this.matchesAutoEmit(current, event)) {
            return;
          }
          this.eventBus.emit("ACTION", {
            type: "ACTION",
            name: autoEmit,
            payload: event
          });
        }
      );
    }
    bindActionEvent() {
      this.detachActionListener = this.eventBus.on("ACTION", (event) => {
        const current = this.getCurrentStep();
        if (!current) {
          return;
        }
        const completion = current.behavior.completion;
        if (!completion || completion.type !== "event") {
          return;
        }
        if (event.name !== completion.name) {
          return;
        }
        if (typeof completion.validator === "function") {
          if (!completion.validator(event.payload)) {
            return;
          }
        }
        this.complete(current, event);
      });
    }
    matchesAutoEmit(step, event) {
      if (event.source === "route") {
        return true;
      }
      if (event.source === "click" || event.source === "form") {
        if (!step.guideId) {
          return true;
        }
        return event.guideId === step.guideId;
      }
      return false;
    }
    getCurrentStep() {
      if (this.activeStepId === null) {
        return null;
      }
      const current = this.behaviors.get(this.activeStepId);
      if (!current) {
        return null;
      }
      if (this.completedSteps.has(current.stepId)) {
        return null;
      }
      return current;
    }
    complete(step, event) {
      if (this.completedSteps.has(step.stepId)) {
        return;
      }
      this.completedSteps.add(step.stepId);
      this.eventBus.emit("STEP_COMPLETE", {
        stepId: step.stepId,
        event
      });
    }
    resolveBehavior(step) {
      if (step.behavior) {
        return step.behavior;
      }
      if (step.type) {
        return { type: step.type };
      }
      if (step.form && step.form.length) {
        return { type: "form" };
      }
      return { type: "click" };
    }
  }
  class BehaviorLifecycle {
    constructor(eventBus2, runtime, engine) {
      this.detach = null;
      this.eventBus = eventBus2;
      this.runtime = runtime;
      this.engine = engine;
    }
    start() {
      if (this.detach) {
        return;
      }
      this.detach = this.eventBus.on(
        "STEP_COMPLETE",
        (event) => {
          this.engine.deactivate();
          this.runtime.completeStep(event.stepId, event);
        }
      );
    }
    stop() {
      if (!this.detach) {
        return;
      }
      this.detach();
      this.detach = null;
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
      fallback: entry.fallback || [],
      pages: entry.pages || []
    };
  };
  const resolveSelectors = (key, mapping) => {
    if (!key) {
      return [];
    }
    const entry = normalizeEntry(mapping ? mapping[key] : null);
    const selectors = [];
    if (entry.selector) {
      selectors.push(entry.selector);
    }
    if (Array.isArray(entry.fallback)) {
      entry.fallback.forEach((item) => selectors.push(item));
    }
    const dataGuideSelector = `[data-guide-id="${key}"]`;
    if (!selectors.includes(dataGuideSelector)) {
      selectors.push(dataGuideSelector);
    }
    return selectors.filter(Boolean);
  };
  const resolvePages = (key, mapping) => {
    const entry = normalizeEntry(mapping ? mapping[key] : null);
    return Array.isArray(entry.pages) ? entry.pages : [];
  };
  const resolveElement = (key, mapping, currentPage) => {
    const selectors = resolveSelectors(key, mapping);
    const pages = resolvePages(key, mapping);
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
  };
  const stateMatches = (stepState, state2) => {
    if (!stepState || !state2) {
      return true;
    }
    return Object.keys(stepState).every((key) => state2[key] === stepState[key]);
  };
  const normalizePage = (value) => {
    const hashIndex = value.indexOf("#");
    const queryIndex = value.indexOf("?");
    const cutIndex = hashIndex === -1 ? queryIndex : queryIndex === -1 ? hashIndex : Math.min(hashIndex, queryIndex);
    return cutIndex === -1 ? value : value.slice(0, cutIndex);
  };
  const pageMatches = (step, currentPage) => {
    if (!step.page) {
      return true;
    }
    if (!currentPage) {
      return false;
    }
    if (step.page.includes("#") || step.page.includes("?")) {
      return step.page === currentPage;
    }
    return normalizePage(currentPage) === step.page;
  };
  const isStepEligible = (step, context) => {
    return pageMatches(step, context.currentPage) && stateMatches(step.state, context.state);
  };
  const findNextStep = (workflow, currentStepIndex, context) => {
    const steps = workflow.steps || [];
    if (!steps.length) {
      return null;
    }
    const startIndex = typeof currentStepIndex === "number" ? currentStepIndex + 1 : 0;
    for (let idx = startIndex; idx < steps.length; idx += 1) {
      const candidate = steps[idx];
      if (isStepEligible(candidate, context)) {
        return { step: candidate, index: idx };
      }
    }
    return null;
  };
  const isValidationFailure = (result) => !result.valid;
  class StepLifecycle {
    constructor(ui, mapping, _legacyBehavior) {
      this.ui = ui;
      this.mapping = mapping;
    }
    validate(step, context) {
      if (!pageMatches(step, context.currentPage)) {
        return { valid: false, reason: "page-mismatch" };
      }
      if (!stateMatches(step.state, context.state)) {
        return { valid: false, reason: "state-mismatch" };
      }
      const mappingPages = resolvePages(step.highlight, this.mapping);
      if (mappingPages.length && context.currentPage && !mappingPages.includes(context.currentPage)) {
        return { valid: false, reason: "page-mismatch" };
      }
      const { element, selectors } = resolveElement(
        step.highlight,
        this.mapping,
        context.currentPage
      );
      if (!element) {
        return { valid: false, reason: "element-missing", selectors };
      }
      return { valid: true, element, selectors };
    }
    enter(step, element, options) {
      this.exit();
      this.ui.render(element, {
        message: step.action || "",
        reason: step.desc || "",
        showNext: options == null ? void 0 : options.showNext,
        onNext: options == null ? void 0 : options.onNext
      });
    }
    exit() {
      this.ui.clear();
    }
    destroy() {
      this.exit();
      this.ui.destroy();
    }
  }
  class RuntimeStateMachine {
    constructor(initialPage) {
      this.state = {
        activeTaskId: null,
        currentStepIndex: null,
        currentStep: null,
        status: "idle",
        currentPage: initialPage
      };
    }
    get snapshot() {
      return { ...this.state };
    }
    getState() {
      return this.state;
    }
    start(taskId, page) {
      this.state.activeTaskId = taskId;
      this.state.status = "running";
      this.state.currentPage = page;
      this.state.currentStepIndex = null;
      this.state.currentStep = null;
    }
    setStep(step, index) {
      this.state.currentStep = step;
      this.state.currentStepIndex = index;
    }
    clearStep(keepIndex = false) {
      this.state.currentStep = null;
      if (!keepIndex) {
        this.state.currentStepIndex = null;
      }
    }
    finish() {
      this.state.status = "finished";
    }
    reset(page) {
      this.state.activeTaskId = null;
      this.state.status = "idle";
      this.state.currentPage = page;
      this.state.currentStepIndex = null;
      this.state.currentStep = null;
    }
    updatePage(page) {
      this.state.currentPage = page;
    }
  }
  const backfillCompletion = (steps = [], currentIndex) => {
    if (!steps.length) {
      return;
    }
    const activeIndex = typeof currentIndex === "number" ? currentIndex : -1;
    steps.forEach((step, index) => {
      if (index < activeIndex) {
        step.status = "completed";
      } else if (index === activeIndex) {
        step.status = "active";
      } else {
        step.status = step.status === "completed" ? "completed" : "pending";
      }
    });
  };
  const reconcileStep = (workflow, page, state2 = {}) => {
    if (!workflow) {
      return null;
    }
    const steps = workflow.steps || [];
    if (!steps.length) {
      return null;
    }
    const candidates = [];
    for (let idx = 0; idx < steps.length; idx += 1) {
      const step = steps[idx];
      if (!pageMatches(step, page)) {
        continue;
      }
      if (!stateMatches(step.state, state2)) {
        continue;
      }
      candidates.push({ step, index: idx });
    }
    if (!candidates.length) {
      return null;
    }
    const active = candidates.find((item) => item.step.status === "active");
    if (active) {
      return active;
    }
    const pending = candidates.find(
      (item) => !item.step.status || item.step.status === "pending"
    );
    if (pending) {
      return pending;
    }
    return candidates[candidates.length - 1];
  };
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
  class PageWatcher {
    constructor(options) {
      this.started = false;
      this.patched = false;
      this.handleNavigation = () => {
        this.checkPage(true);
      };
      this.getCurrentPage = options.getCurrentPage;
      this.onChange = options.onChange;
      this.lastPage = this.getCurrentPage();
    }
    start() {
      if (typeof window === "undefined" || this.started) {
        return;
      }
      this.started = true;
      this.lastPage = this.getCurrentPage();
      window.addEventListener("popstate", this.handleNavigation);
      window.addEventListener("hashchange", this.handleNavigation);
      this.patchHistory();
    }
    stop() {
      if (typeof window === "undefined" || !this.started) {
        return;
      }
      this.started = false;
      window.removeEventListener("popstate", this.handleNavigation);
      window.removeEventListener("hashchange", this.handleNavigation);
      this.restoreHistory();
    }
    checkPage(force = false) {
      const current = this.getCurrentPage();
      if (force || current !== this.lastPage) {
        this.lastPage = current;
        this.onChange(current);
      }
    }
    patchHistory() {
      if (this.patched || typeof window === "undefined") {
        return;
      }
      this.originalPushState = history.pushState.bind(history);
      this.originalReplaceState = history.replaceState.bind(history);
      history.pushState = (...args) => {
        var _a;
        const result = (_a = this.originalPushState) == null ? void 0 : _a.call(this, ...args);
        this.checkPage();
        return result;
      };
      history.replaceState = (...args) => {
        var _a;
        const result = (_a = this.originalReplaceState) == null ? void 0 : _a.call(this, ...args);
        this.checkPage();
        return result;
      };
      this.patched = true;
    }
    restoreHistory() {
      if (!this.patched || typeof window === "undefined") {
        return;
      }
      if (this.originalPushState) {
        history.pushState = this.originalPushState;
      }
      if (this.originalReplaceState) {
        history.replaceState = this.originalReplaceState;
      }
      this.patched = false;
    }
  }
  const createRuntimeAdapter = (config) => {
    const getCurrentPage = () => {
      if (config.getCurrentPage) {
        return config.getCurrentPage() || "";
      }
      if (typeof window !== "undefined") {
        return window.location.pathname || "";
      }
      return "";
    };
    return { getCurrentPage };
  };
  class FlowPilotRuntime {
    constructor(config, root, eventBus2) {
      this.activeWorkflow = null;
      this.lastInvalidKey = null;
      this.elementRetryTimer = null;
      this.elementRetryAttempts = 0;
      this.elementRetryStepId = null;
      this.config = config;
      this.adapter = createRuntimeAdapter(config);
      this.ui = new GuideRuntime(root);
      this.lifecycle = new StepLifecycle(this.ui, config.mapping);
      this.stateMachine = new RuntimeStateMachine(this.adapter.getCurrentPage());
      this.eventBus = eventBus2 ?? new EventBus();
      this.behaviorEngine = new BehaviorEngine(this.eventBus);
      this.behaviorLifecycle = new BehaviorLifecycle(
        this.eventBus,
        this,
        this.behaviorEngine
      );
      this.behaviorLifecycle.start();
      this.watcher = new PageWatcher({
        getCurrentPage: () => this.adapter.getCurrentPage(),
        onChange: (page) => {
          this.onPageChange(page);
        }
      });
    }
    start(taskId) {
      const workflow = this.getWorkflow(taskId);
      if (!workflow) {
        this.handleError(new Error("Workflow not found"));
        return;
      }
      if (!workflow.steps || workflow.steps.length === 0) {
        this.handleError(new Error("Workflow has no steps"));
        return;
      }
      this.behaviorEngine.reset();
      workflow.steps.forEach((step) => {
        step.status = "pending";
        this.behaviorEngine.registerStep(step);
      });
      this.lifecycle.exit();
      this.lastInvalidKey = null;
      this.activeWorkflow = workflow;
      const currentPage = this.adapter.getCurrentPage();
      this.stateMachine.start(taskId, currentPage);
      this.watcher.start();
      this.onPageChange(currentPage);
    }
    reset() {
      this.clearElementRetry();
      this.lifecycle.exit();
      this.behaviorEngine.reset();
      this.watcher.stop();
      this.activeWorkflow = null;
      this.lastInvalidKey = null;
      this.stateMachine.reset(this.adapter.getCurrentPage());
    }
    destroy() {
      this.reset();
      this.behaviorLifecycle.stop();
      this.behaviorEngine.destroy();
      this.lifecycle.destroy();
    }
    completeStep(stepId, stepComplete) {
      const state2 = this.stateMachine.getState();
      if (!this.activeWorkflow || state2.status !== "running" || !state2.currentStep) {
        return;
      }
      if (state2.currentStep.step !== stepId || state2.currentStep.status === "completed") {
        return;
      }
      const behaviorEvent = stepComplete == null ? void 0 : stepComplete.event;
      if (behaviorEvent && "source" in behaviorEvent && behaviorEvent.source === "route" && typeof behaviorEvent.pathname === "string") {
        this.stateMachine.updatePage(behaviorEvent.pathname);
      }
      this.clearElementRetry();
      state2.currentStep.status = "completed";
      this.lifecycle.exit();
      const next = findNextStep(this.activeWorkflow, state2.currentStepIndex, {
        currentPage: state2.currentPage,
        state: this.getState()
      });
      if (!next) {
        const hasRemainingSteps = typeof state2.currentStepIndex === "number" && this.activeWorkflow.steps.length > state2.currentStepIndex + 1;
        if (hasRemainingSteps) {
          this.stateMachine.clearStep(true);
          return;
        }
        this.onFlowFinish();
        return;
      }
      this.onStepChange(next.step, next.index);
    }
    onPageChange(page) {
      this.stateMachine.updatePage(page);
      const state2 = this.stateMachine.getState();
      if (!this.activeWorkflow || state2.status !== "running") {
        this.stateMachine.clearStep(true);
        this.lifecycle.exit();
        this.behaviorEngine.deactivate();
        return;
      }
      if (state2.currentStep && typeof state2.currentStepIndex === "number") {
        const stillEligible = isStepEligible(state2.currentStep, {
          currentPage: page,
          state: this.getState()
        });
        if (stillEligible) {
          this.onStepChange(state2.currentStep, state2.currentStepIndex);
          return;
        }
      }
      const candidate = reconcileStep(this.activeWorkflow, page, this.getState());
      if (!candidate) {
        this.stateMachine.clearStep(true);
        this.lifecycle.exit();
        this.behaviorEngine.deactivate();
        return;
      }
      this.onStepChange(candidate.step, candidate.index);
    }
    onStepChange(step, index) {
      var _a, _b, _c, _d;
      if (!step || typeof index !== "number") {
        this.clearElementRetry();
        this.lifecycle.exit();
        this.behaviorEngine.deactivate();
        this.stateMachine.clearStep(true);
        return;
      }
      const state2 = this.stateMachine.getState();
      const isSameStep = ((_a = state2.currentStep) == null ? void 0 : _a.step) === step.step && state2.currentStepIndex === index;
      if (!isSameStep) {
        this.stateMachine.setStep(step, index);
        if ((_b = this.activeWorkflow) == null ? void 0 : _b.steps) {
          backfillCompletion(this.activeWorkflow.steps, index);
        }
        (_d = (_c = this.config).onStepChange) == null ? void 0 : _d.call(_c, step);
        this.logDebug("step change", step);
      }
      const validation = this.lifecycle.validate(step, {
        currentPage: this.stateMachine.getState().currentPage,
        state: this.getState()
      });
      if (isValidationFailure(validation)) {
        if (validation.reason === "element-missing") {
          this.reportInvalidOnce(step.step, validation.reason, {
            selectors: validation.selectors
          });
          this.scheduleElementRetry(step, index);
        } else if (validation.reason !== "page-mismatch") {
          this.reportInvalidOnce(step.step, validation.reason);
          this.clearElementRetry();
        } else {
          this.clearElementRetry();
        }
        this.lifecycle.exit();
        return;
      }
      this.clearElementRetry();
      this.lastInvalidKey = null;
      this.lifecycle.enter(step, validation.element);
      this.behaviorEngine.activate(step.step);
    }
    onFlowFinish() {
      var _a, _b;
      this.lifecycle.exit();
      this.behaviorEngine.deactivate();
      this.stateMachine.finish();
      this.stateMachine.clearStep(true);
      (_b = (_a = this.config).onFinish) == null ? void 0 : _b.call(_a);
    }
    reportInvalidOnce(stepNumber, reason, detail) {
      var _a;
      const key = `${stepNumber}:${reason}`;
      if (this.lastInvalidKey === key) {
        return;
      }
      this.lastInvalidKey = key;
      if (reason === "element-missing" && ((_a = detail == null ? void 0 : detail.selectors) == null ? void 0 : _a.length)) {
        this.handleError(
          new Error(
            `Element not found. Tried selectors: ${detail.selectors.join(", ")}`
          )
        );
        return;
      }
      if (reason === "state-mismatch") {
        this.handleError(new Error("Step state does not match current state"));
      }
    }
    getWorkflow(taskId) {
      const workflows = Array.isArray(this.config.workflow) ? this.config.workflow : [this.config.workflow];
      if (taskId) {
        return workflows.find((item) => item.id === taskId) || workflows[0] || null;
      }
      return workflows[0] || null;
    }
    getState() {
      if (this.config.getState) {
        return this.config.getState() || {};
      }
      return {};
    }
    logDebug(...args) {
      if (this.config.debug) {
        console.log("[FlowPilot]", ...args);
      }
    }
    handleError(error) {
      var _a, _b;
      console.error("[FlowPilot]", error);
      (_b = (_a = this.config).onError) == null ? void 0 : _b.call(_a, error);
    }
    clearElementRetry() {
      if (this.elementRetryTimer !== null) {
        if (typeof window !== "undefined") {
          window.clearTimeout(this.elementRetryTimer);
        } else {
          clearTimeout(this.elementRetryTimer);
        }
        this.elementRetryTimer = null;
      }
      this.elementRetryAttempts = 0;
      this.elementRetryStepId = null;
    }
    scheduleElementRetry(step, index) {
      if (typeof window === "undefined") {
        return;
      }
      if (this.elementRetryStepId !== step.step) {
        this.elementRetryStepId = step.step;
        this.elementRetryAttempts = 0;
      }
      if (this.elementRetryAttempts >= 20 || this.elementRetryTimer !== null) {
        return;
      }
      this.elementRetryAttempts += 1;
      this.elementRetryTimer = window.setTimeout(() => {
        this.elementRetryTimer = null;
        const state2 = this.stateMachine.getState();
        if (!this.activeWorkflow || state2.status !== "running") {
          return;
        }
        if (!state2.currentStep || typeof state2.currentStepIndex !== "number") {
          return;
        }
        if (state2.currentStep.step !== step.step || state2.currentStepIndex !== index) {
          return;
        }
        this.onStepChange(state2.currentStep, state2.currentStepIndex);
      }, 80);
    }
  }
  const VERSION = "0.2.0";
  const GLOBAL_INIT_FLAG = "__FLOWPILOT__";
  const state = {
    config: null,
    runtime: null,
    disposeBehaviorBridge: null,
    initialized: false
  };
  const logDebug = (...args) => {
    var _a;
    if ((_a = state.config) == null ? void 0 : _a.debug) {
      console.log("[FlowPilot]", ...args);
    }
  };
  const getWorkflow = (config, taskId) => {
    const workflows = Array.isArray(config.workflow) ? config.workflow : [config.workflow];
    return workflows[0] || null;
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
    state.config = config;
    const shadowRoot = mountShadowRoot();
    state.runtime = new FlowPilotRuntime(config, shadowRoot, eventBus);
    state.disposeBehaviorBridge = initBehaviorBridge(eventBus);
    state.initialized = true;
    window[GLOBAL_INIT_FLAG] = true;
    if (state.config.debug) {
      logDebug("init", config);
    }
    if (state.config.autoStart) {
      const workflow = getWorkflow(config);
      if (workflow) {
        start(workflow.id);
      } else {
        (_a = config.onError) == null ? void 0 : _a.call(config, new Error("Workflow not found for autoStart"));
      }
    }
  };
  const start = (intent) => {
    if (!state.runtime) {
      return;
    }
    state.runtime.start(intent);
  };
  const emit = (event) => {
    eventBus.emit("ACTION", event);
  };
  const reset = () => {
    var _a;
    (_a = state.runtime) == null ? void 0 : _a.reset();
  };
  const destroy = () => {
    var _a, _b;
    (_a = state.runtime) == null ? void 0 : _a.destroy();
    (_b = state.disposeBehaviorBridge) == null ? void 0 : _b.call(state);
    const host = document.getElementById("flowpilot-root");
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
    }
    if (typeof window !== "undefined") {
      delete window[GLOBAL_INIT_FLAG];
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
    version: VERSION
  };
  if (typeof window !== "undefined") {
    window.FlowPilot = FlowPilot;
  }
  return FlowPilot;
});
