import type { MappingRegistry, Step } from "../core/types";
import { GuideRuntime } from "../runtime/ui";

type ElementResolution = {
  element: Element | null;
  selectors: string[];
};

const normalizeEntry = (entry: any) => {
  if (!entry) {
    return { selector: "", fallback: [] as string[], pages: [] as string[] };
  }
  if (typeof entry === "string") {
    return { selector: entry, fallback: [] as string[], pages: [] as string[] };
  }
  return {
    selector: entry.selector || "",
    fallback: Array.isArray(entry.fallback) ? entry.fallback : [],
    pages: Array.isArray(entry.pages) ? entry.pages : [],
  };
};

export class DomAdapter {
  private mapping?: MappingRegistry;
  private getCurrentPageImpl?: () => string;
  private ui: GuideRuntime;

  constructor(root: ShadowRoot, mapping?: MappingRegistry, getCurrentPage?: () => string) {
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

  resolveStepElement(step: Step): ElementResolution {
    return this.resolveElement(step.highlight);
  }

  canResolveStep(step: Step) {
    if (step.type === "route") {
      return true;
    }
    const resolved = this.resolveStepElement(step);
    return Boolean(resolved.element);
  }

  renderStep(step: Step) {
    const resolved = this.resolveStepElement(step);
    this.ui.render(resolved.element, {
      message: step.desc || "",
      reason: step.desc || "",
    });
  }

  clear() {
    this.ui.clear();
  }

  destroy() {
    this.ui.destroy();
  }

  private resolveElement(key: string): ElementResolution {
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

  private resolveSelectors(key: string): string[] {
    if (!key) {
      return [];
    }

    const entry = normalizeEntry(this.mapping ? this.mapping[key] : null);
    const selectors: string[] = [];

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

  private resolvePages(key: string): string[] {
    const entry = normalizeEntry(this.mapping ? this.mapping[key] : null);
    return Array.isArray(entry.pages) ? entry.pages : [];
  }
}
