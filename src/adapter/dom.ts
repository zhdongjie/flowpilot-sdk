import type { ActionEvent, FlowPilotEventElement, MappingEntry, MappingRegistry, Step } from "../core/types";

type ValidationReason = "ok" | "page-mismatch" | "element-missing" | "element-mismatch";

type AdapterValidationResult = {
  valid: boolean;
  reason: ValidationReason;
};

type ResolvedMapping = {
  selector: string;
  fallback: string[];
  pages: string[];
};

type StepResolution = {
  element: Element | null;
  selectors: string[];
  pages: string[];
  matchedPage: boolean;
};

type TooltipContent = {
  message: string;
  reason: string;
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

const normalizeEntry = (entry?: MappingEntry): ResolvedMapping => {
  if (!entry) {
    return { selector: "", fallback: [], pages: [] };
  }

  if (typeof entry === "string") {
    return { selector: entry, fallback: [], pages: [] };
  }

  return {
    selector: typeof entry.selector === "string" ? entry.selector : "",
    fallback: Array.isArray(entry.fallback) ? entry.fallback.filter(Boolean) : [],
    pages: Array.isArray(entry.pages) ? entry.pages.filter(Boolean) : [],
  };
};

const ensureShadowRoot = () => {
  const existing = document.getElementById("flowpilot-root");
  if (existing?.shadowRoot) {
    return existing.shadowRoot;
  }

  const host = document.createElement("div");
  host.id = "flowpilot-root";
  (document.body || document.documentElement).appendChild(host);
  return host.attachShadow({ mode: "open" });
};

class GuideRenderer {
  private root: ShadowRoot;
  private style: HTMLStyleElement;
  private highlight: HTMLDivElement;
  private masks: HTMLDivElement[];
  private tooltip: HTMLDivElement;
  private tooltipTitle: HTMLDivElement;
  private tooltipReason: HTMLDivElement;
  private activeElement: Element | null = null;
  private activeTooltip: TooltipContent | null = null;
  private onGlobalUpdate = () => {
    this.refresh();
  };

  constructor(root: ShadowRoot) {
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

  render(element: Element | null, tooltip: TooltipContent) {
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

  private refresh() {
    if (!this.activeTooltip?.message) {
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

  private updateHighlight(rect: DOMRect | null) {
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

  private updateTooltip(rect: DOMRect | null, tooltip: TooltipContent) {
    this.tooltip.style.display = "block";
    this.tooltipTitle.textContent = tooltip.message;
    this.tooltipReason.textContent = tooltip.reason;
    this.tooltipReason.style.display = tooltip.reason ? "block" : "none";

    if (!rect) {
      const left = Math.max(12, window.innerWidth - 332);
      this.tooltip.style.top = "20px";
      this.tooltip.style.left = `${left}px`;
      return;
    }

    const margin = 12;
    const rawTop = rect.bottom + margin;
    const maxLeft = window.innerWidth - 320;
    const left = Math.max(12, Math.min(rect.left, maxLeft));
    const top =
      rawTop + 120 > window.innerHeight ? Math.max(12, rect.top - 80) : rawTop;

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }

  private hideHighlight() {
    this.highlight.style.display = "none";
    this.masks.forEach((piece) => {
      piece.style.display = "none";
    });
  }

  private hideTooltip() {
    this.tooltip.style.display = "none";
    this.tooltipTitle.textContent = "";
    this.tooltipReason.textContent = "";
  }
}

export class DomAdapter {
  private mapping?: MappingRegistry;
  private getCurrentPageImpl?: () => string;
  private renderer: GuideRenderer;

  constructor(mapping?: MappingRegistry, getCurrentPage?: () => string) {
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

  canResolveStep(step: Step, page = this.getCurrentPage()) {
    return this.validateStepAvailability(step, page).valid;
  }

  validateStepAvailability(step: Step, page = this.getCurrentPage()): AdapterValidationResult {
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

  matchStepEvent(step: Step, event: ActionEvent): AdapterValidationResult {
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

  renderStep(step: Step) {
    const resolved = this.resolveStep(step, this.getCurrentPage());
    this.renderer.render(resolved.element, {
      message: step.desc || step.id,
      reason: step.desc || "",
    });
  }

  clear() {
    this.renderer.clear();
  }

  destroy() {
    this.renderer.destroy();
  }

  private resolveStep(step: Step, page: string): StepResolution {
    const selectors = this.resolveSelectors(step.highlight);
    const pages = this.resolvePages(step);
    const matchedPage = !pages.length || pages.includes(page);

    if (!matchedPage || typeof document === "undefined") {
      return {
        element: null,
        selectors,
        pages,
        matchedPage,
      };
    }

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return {
          element,
          selectors,
          pages,
          matchedPage,
        };
      }
    }

    return {
      element: null,
      selectors,
      pages,
      matchedPage,
    };
  }

  private resolveSelectors(key: string) {
    if (!key) {
      return [];
    }

    const entry = normalizeEntry(this.mapping?.[key]);
    const selectors = [entry.selector, ...entry.fallback].filter(Boolean);
    const guideSelector = `[data-guide-id='${key}']`;

    if (!selectors.includes(guideSelector)) {
      selectors.push(guideSelector);
    }

    return selectors;
  }

  private resolvePages(step: Step) {
    const entry = normalizeEntry(this.mapping?.[step.highlight]);
    if (entry.pages.length > 0) {
      return entry.pages;
    }

    if (step.type === "route" && step.highlight.startsWith("/")) {
      return [step.highlight];
    }

    return [];
  }

  private matchesStepElement(
    highlight: string,
    selectors: string[],
    element?: FlowPilotEventElement
  ) {
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
