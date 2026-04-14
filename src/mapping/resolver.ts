import type { MappingRegistry } from "../types";

const normalizeEntry = (entry: any) => {
  if (!entry) {
    return { selector: "", fallback: [], pages: [] };
  }
  if (typeof entry === "string") {
    return { selector: entry, fallback: [], pages: [] };
  }
  return {
    selector: entry.selector || "",
    fallback: entry.fallback || [],
    pages: entry.pages || [],
  };
};

export const resolveSelectors = (
  key: string,
  mapping?: MappingRegistry
): string[] => {
  if (!key) {
    return [];
  }
  const entry = normalizeEntry(mapping ? mapping[key] : null);
  const selectors: string[] = [];
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

export const resolvePages = (
  key: string,
  mapping?: MappingRegistry
): string[] => {
  const entry = normalizeEntry(mapping ? mapping[key] : null);
  return Array.isArray(entry.pages) ? entry.pages : [];
};

export const resolveElement = (
  key: string,
  mapping?: MappingRegistry,
  currentPage?: string
): { element: Element | null; selectors: string[] } => {
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
