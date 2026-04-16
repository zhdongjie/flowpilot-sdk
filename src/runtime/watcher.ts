type WatcherOptions = {
  getCurrentPage: () => string;
  onChange: (page: string) => void;
};

export class PageWatcher {
  private getCurrentPage: () => string;
  private onChange: (page: string) => void;
  private lastPage: string;
  private started = false;
  private patched = false;
  private originalPushState?: History["pushState"];
  private originalReplaceState?: History["replaceState"];

  constructor(options: WatcherOptions) {
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
      this.checkPage();
      return result;
    };
    history.replaceState = (...args) => {
      const result = this.originalReplaceState?.(...args);
      this.checkPage();
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
