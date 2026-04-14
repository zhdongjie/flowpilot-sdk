type WatcherOptions = {
  getCurrentPage: () => string;
  onChange: (page: string) => void;
  intervalMs?: number;
};

export class PageWatcher {
  private getCurrentPage: () => string;
  private onChange: (page: string) => void;
  private intervalMs: number;
  private lastPage: string;
  private intervalId: number | null = null;
  private patched = false;
  private originalPushState?: History["pushState"];
  private originalReplaceState?: History["replaceState"];

  constructor(options: WatcherOptions) {
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

  private handleNavigation = () => {
    this.checkPage(true);
  };

  private checkPage(force = false) {
    const current = this.getCurrentPage();
    if (force || current !== this.lastPage) {
      this.lastPage = current;
      this.onChange(current);
    }
  }

  private patchHistory() {
    if (this.patched || typeof window === "undefined") {
      return;
    }
    this.originalPushState = history.pushState.bind(history);
    this.originalReplaceState = history.replaceState.bind(history);
    history.pushState = (...args) => {
      const result = this.originalPushState?.(...args);
      this.checkPage(true);
      return result;
    };
    history.replaceState = (...args) => {
      const result = this.originalReplaceState?.(...args);
      this.checkPage(true);
      return result;
    };
    this.patched = true;
  }

  private restoreHistory() {
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
