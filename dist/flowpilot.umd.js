(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.FlowPilot = factory());
})(this, function() {
  "use strict";
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
  class StepBehaviorEngine {
    getType(step) {
      if (step.type) {
        return step.type;
      }
      if (step.form && step.form.length) {
        return "form";
      }
      return "click";
    }
    canAutoNext(step) {
      const type = this.getType(step);
      if (type === "form" || type === "view" || type === "route") {
        return false;
      }
      return Boolean(step.autoNext);
    }
    shouldWaitUser(step) {
      const type = this.getType(step);
      if (type === "view") {
        return true;
      }
      if (type === "form") {
        return true;
      }
      return Boolean(step.requireConfirm);
    }
    shouldBindClick(step) {
      return this.getType(step) === "click";
    }
    shouldTrackRoute(step) {
      return this.getType(step) === "route" || Boolean(step.waitForStable);
    }
    shouldShowConfirm(step) {
      return this.getType(step) === "form" && Boolean(step.requireConfirm);
    }
    allowAdvance(step, source) {
      const type = this.getType(step);
      if (type === "view") {
        return false;
      }
      if (source === "auto") {
        return this.canAutoNext(step);
      }
      return true;
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
  class StepLifecycle {
    constructor(ui, mapping) {
      this.clickTarget = null;
      this.clickHandler = null;
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
      this.ui.render(element, {
        message: step.action || "",
        reason: step.desc || "",
        showNext: options.showConfirm,
        onNext: options.showConfirm ? options.onAdvance : void 0
      });
      if (!element || !options.bindClick) {
        this.detachListener();
        return;
      }
      if (this.clickTarget === element && this.clickHandler) {
        return;
      }
      this.detachListener();
      const handler = () => {
        var _a;
        (_a = options.onAdvance) == null ? void 0 : _a.call(options);
      };
      element.addEventListener("click", handler, { once: true });
      this.clickTarget = element;
      this.clickHandler = handler;
    }
    exit() {
      this.detachListener();
      this.ui.clear();
    }
    destroy() {
      this.exit();
      this.ui.destroy();
    }
    detachListener() {
      if (this.clickTarget && this.clickHandler) {
        this.clickTarget.removeEventListener("click", this.clickHandler);
      }
      this.clickTarget = null;
      this.clickHandler = null;
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
        btn.textContent = "我已填写，继续";
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

.fp-chat { position: fixed; right: 24px; bottom: 24px; z-index: 10001; }
.fp-chat-fab {
  border: none;
  background: #0c5b4c;
  color: #fff;
  border-radius: 999px;
  padding: 10px 16px;
  cursor: pointer;
}
.fp-chat-panel {
  margin-top: 8px;
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 10px 24px rgba(12, 24, 40, 0.2);
  display: grid;
  gap: 8px;
  width: 400px;
}
.fp-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #1b1f23;
}
.fp-chat-header span {
  color: #5b6574;
  font-size: 11px;
}
.fp-chat-body {
  background: #f6f7fb;
  border-radius: 10px;
  padding: 8px;
  height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fp-chat-bubble {
  background: #fff;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #1b1f23;
  border: 1px solid #e6eaf0;
  max-width: 75%;
  width: fit-content;
  line-height: 1.4;
  word-break: break-word;
}
.fp-chat-bubble.user {
  background: #0c5b4c;
  color: #fff;
  border-color: transparent;
  align-self: flex-end;
}
.fp-chat-input-row {
  display: flex;
  gap: 6px;
}
.fp-chat-input {
  border: 1px solid #dfe4ee;
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  flex: 1;
}
.fp-chat-send {
  border: none;
  background: #0c5b4c;
  color: #fff;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
`;
  class GuideRuntime {
    constructor(root) {
      this.root = root;
      const style = document.createElement("style");
      style.textContent = STYLE_TEXT;
      this.root.appendChild(style);
      this.style = style;
      this.highlight = createHighlight(this.root);
      this.tooltip = createTooltip(this.root);
      this.highlight.update(null);
      this.tooltip.update(null, { message: "", reason: "" });
    }
    render(element, options = {}) {
      if (!element) {
        this.clear();
        return;
      }
      const rect = element.getBoundingClientRect();
      this.highlight.update(rect);
      this.tooltip.update(rect, {
        message: options.message || "",
        reason: options.reason || "",
        showNext: options.showNext,
        onNext: options.onNext
      });
    }
    clear() {
      this.highlight.update(null);
      this.tooltip.update(null, { message: "", reason: "" });
    }
    destroy() {
      this.clear();
      this.highlight.destroy();
      this.tooltip.destroy();
      if (this.style.parentNode) {
        this.style.parentNode.removeChild(this.style);
      }
    }
  }
  class PageWatcher {
    constructor(options) {
      this.intervalId = null;
      this.patched = false;
      this.handleNavigation = () => {
        this.checkPage(true);
      };
      this.getCurrentPage = options.getCurrentPage;
      this.onChange = options.onChange;
      this.intervalMs = options.intervalMs ?? 500;
      this.lastPage = this.getCurrentPage();
    }
    start() {
      if (typeof window === "undefined" || this.intervalId !== null) {
        return;
      }
      this.lastPage = this.getCurrentPage();
      window.addEventListener("popstate", this.handleNavigation);
      this.patchHistory();
      this.intervalId = window.setInterval(() => {
        this.checkPage();
      }, this.intervalMs);
    }
    stop() {
      if (typeof window === "undefined") {
        return;
      }
      window.removeEventListener("popstate", this.handleNavigation);
      this.restoreHistory();
      if (this.intervalId !== null) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }
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
        this.checkPage(true);
        return result;
      };
      history.replaceState = (...args) => {
        var _a;
        const result = (_a = this.originalReplaceState) == null ? void 0 : _a.call(this, ...args);
        this.checkPage(true);
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
    constructor(config, root) {
      this.activeWorkflow = null;
      this.lastInvalidKey = null;
      this.config = config;
      this.adapter = createRuntimeAdapter(config);
      this.ui = new GuideRuntime(root);
      this.lifecycle = new StepLifecycle(this.ui, config.mapping);
      this.behavior = new StepBehaviorEngine();
      this.stateMachine = new RuntimeStateMachine(this.adapter.getCurrentPage());
      this.watcher = new PageWatcher({
        getCurrentPage: () => this.adapter.getCurrentPage(),
        onChange: (page) => this.dispatch({ type: "PAGE_CHANGE", page })
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
      this.lifecycle.exit();
      this.lastInvalidKey = null;
      this.activeWorkflow = workflow;
      const currentPage = this.adapter.getCurrentPage();
      this.stateMachine.start(taskId, currentPage);
      this.watcher.start();
      this.dispatch({ type: "PAGE_CHANGE", page: currentPage });
    }
    next() {
      this.dispatch({ type: "STEP_COMPLETE", source: "user" });
    }
    reset() {
      this.lifecycle.exit();
      this.watcher.stop();
      this.activeWorkflow = null;
      this.lastInvalidKey = null;
      this.stateMachine.reset(this.adapter.getCurrentPage());
    }
    destroy() {
      this.reset();
      this.lifecycle.destroy();
    }
    dispatch(event) {
      switch (event.type) {
        case "PAGE_CHANGE": {
          this.onPageChange(event.page);
          return;
        }
        case "STEP_CHANGE": {
          this.onStepChange(event.step, event.index);
          return;
        }
        case "STEP_COMPLETE": {
          this.onStepComplete(event.source);
          return;
        }
        case "FLOW_FINISH": {
          this.onFlowFinish();
        }
      }
    }
    onPageChange(page) {
      this.lifecycle.exit();
      this.stateMachine.updatePage(page);
      const state2 = this.stateMachine.getState();
      if (!this.activeWorkflow || state2.status !== "running") {
        this.stateMachine.clearStep(true);
        return;
      }
      const candidate = reconcileStep(this.activeWorkflow, page, this.getState());
      if (!candidate) {
        this.stateMachine.clearStep(true);
        return;
      }
      this.dispatch({
        type: "STEP_CHANGE",
        step: candidate.step,
        index: candidate.index
      });
    }
    onStepChange(step, index) {
      var _a, _b, _c;
      if (!step || typeof index !== "number") {
        this.lifecycle.exit();
        this.stateMachine.clearStep(true);
        return;
      }
      this.stateMachine.setStep(step, index);
      if ((_a = this.activeWorkflow) == null ? void 0 : _a.steps) {
        backfillCompletion(this.activeWorkflow.steps, index);
      }
      const validation = this.lifecycle.validate(step, {
        currentPage: this.stateMachine.getState().currentPage,
        state: this.getState()
      });
      if (!validation.valid) {
        if (validation.reason === "element-missing") {
          this.reportInvalidOnce(step.step, validation.reason, {
            selectors: validation.selectors
          });
        } else if (validation.reason !== "page-mismatch") {
          this.reportInvalidOnce(step.step, validation.reason);
        }
        return;
      }
      this.lastInvalidKey = null;
      this.lifecycle.enter(step, validation.element, {
        bindClick: this.behavior.shouldBindClick(step),
        showConfirm: this.behavior.shouldShowConfirm(step),
        onAdvance: () => this.dispatch({ type: "STEP_COMPLETE", source: "user" })
      });
      (_c = (_b = this.config).onStepChange) == null ? void 0 : _c.call(_b, step);
      this.logDebug("step change", step);
      if (this.behavior.canAutoNext(step)) {
        queueMicrotask(() => {
          this.dispatch({ type: "STEP_COMPLETE", source: "auto" });
        });
      }
    }
    onStepComplete(source) {
      const state2 = this.stateMachine.getState();
      if (!this.activeWorkflow || state2.status !== "running" || !state2.currentStep) {
        return;
      }
      if (!this.behavior.allowAdvance(state2.currentStep, source)) {
        return;
      }
      state2.currentStep.status = "completed";
      this.lifecycle.exit();
      const next2 = findNextStep(this.activeWorkflow, state2.currentStepIndex, {
        currentPage: state2.currentPage,
        state: this.getState()
      });
      if (!next2) {
        const hasRemainingSteps = typeof state2.currentStepIndex === "number" && this.activeWorkflow.steps.length > state2.currentStepIndex + 1;
        if (hasRemainingSteps) {
          this.stateMachine.clearStep(true);
          return;
        }
        this.dispatch({ type: "FLOW_FINISH" });
        return;
      }
      this.dispatch({ type: "STEP_CHANGE", step: next2.step, index: next2.index });
    }
    onFlowFinish() {
      var _a, _b;
      this.lifecycle.exit();
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
  }
  const mountChat = (root, options) => {
    const container = document.createElement("div");
    container.className = "fp-chat";
    root.appendChild(container);
    const button = document.createElement("button");
    button.className = "fp-chat-fab";
    button.textContent = "在线客服";
    container.appendChild(button);
    const panel = document.createElement("div");
    panel.className = "fp-chat-panel";
    panel.style.display = "none";
    container.appendChild(panel);
    const header = document.createElement("div");
    header.className = "fp-chat-header";
    header.innerHTML = "<strong>智能客服</strong><span>插件引导助手</span>";
    panel.appendChild(header);
    const body = document.createElement("div");
    body.className = "fp-chat-body";
    panel.appendChild(body);
    const inputRow = document.createElement("div");
    inputRow.className = "fp-chat-input-row";
    panel.appendChild(inputRow);
    const input = document.createElement("input");
    input.className = "fp-chat-input";
    input.placeholder = "例如：我要开卡";
    inputRow.appendChild(input);
    const send = document.createElement("button");
    send.className = "fp-chat-send";
    send.textContent = "发送";
    inputRow.appendChild(send);
    const addMessage = (role, text) => {
      const bubble = document.createElement("div");
      bubble.className = `fp-chat-bubble ${role}`;
      bubble.textContent = text;
      body.appendChild(bubble);
      body.scrollTop = body.scrollHeight;
    };
    const toggle = () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    };
    button.addEventListener("click", toggle);
    send.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      addMessage("user", text);
      options.onSend(text);
    });
    return { addMessage, panel };
  };
  const VERSION = "0.2.0";
  const GLOBAL_INIT_FLAG = "__FLOWPILOT__";
  const DEFAULT_STEP_MESSAGE = "Please continue the flow.";
  const FINISH_MESSAGE = "Flow completed.";
  const state = {
    config: null,
    runtime: null,
    chat: null,
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
  const wrapConfig = (config) => {
    const userOnStepChange = config.onStepChange;
    const userOnFinish = config.onFinish;
    const userOnError = config.onError;
    return {
      ...config,
      onStepChange: (step) => {
        if (state.chat) {
          const message = step.action || step.desc || DEFAULT_STEP_MESSAGE;
          state.chat.addMessage("assistant", message);
        }
        userOnStepChange == null ? void 0 : userOnStepChange(step);
      },
      onFinish: () => {
        if (state.chat) {
          state.chat.addMessage("assistant", FINISH_MESSAGE);
        }
        userOnFinish == null ? void 0 : userOnFinish();
      },
      onError: (err) => {
        userOnError == null ? void 0 : userOnError(err);
      }
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
    state.config = config;
    const shadowRoot = mountShadowRoot();
    state.chat = mountChat(shadowRoot, {
      onSend: (text) => start(text, true)
    });
    const runtimeConfig = wrapConfig(config);
    state.runtime = new FlowPilotRuntime(runtimeConfig, shadowRoot);
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
        (_a = runtimeConfig.onError) == null ? void 0 : _a.call(runtimeConfig, new Error("Workflow not found for autoStart"));
      }
    }
  };
  const start = (intent, fromChat = false) => {
    if (!state.runtime) {
      return;
    }
    if (!fromChat && state.chat) {
      state.chat.addMessage("user", intent);
    }
    state.runtime.start(intent);
  };
  const next = () => {
    var _a;
    (_a = state.runtime) == null ? void 0 : _a.next();
  };
  const reset = () => {
    var _a;
    (_a = state.runtime) == null ? void 0 : _a.reset();
  };
  const destroy = () => {
    var _a;
    (_a = state.runtime) == null ? void 0 : _a.destroy();
    const host = document.getElementById("flowpilot-root");
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
    }
    if (typeof window !== "undefined") {
      delete window[GLOBAL_INIT_FLAG];
    }
    state.config = null;
    state.runtime = null;
    state.chat = null;
    state.initialized = false;
  };
  const FlowPilot = { init, start, next, reset, destroy, version: VERSION };
  if (typeof window !== "undefined") {
    window.FlowPilot = FlowPilot;
  }
  return FlowPilot;
});
