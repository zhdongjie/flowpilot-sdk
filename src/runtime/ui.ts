import { createHighlight } from "./overlay";
import { createTooltip } from "./tooltip";

type RenderOptions = {
  message?: string;
  reason?: string;
  showNext?: boolean;
  onNext?: () => void;
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

export class GuideRuntime {
  private root: ShadowRoot;
  private style: HTMLStyleElement;
  private highlight: ReturnType<typeof createHighlight>;
  private tooltip: ReturnType<typeof createTooltip>;
  private activeElement: Element | null = null;
  private activeOptions: RenderOptions = {};
  private onGlobalUpdate = () => {
    this.refresh();
  };

  constructor(root: ShadowRoot) {
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

  render(element: Element | null, options: RenderOptions = {}) {
    this.activeElement = element;
    this.activeOptions = {
      message: options.message || "",
      reason: options.reason || "",
      showNext: options.showNext,
      onNext: options.onNext,
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

  private refresh() {
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
      onNext: this.activeOptions.onNext,
    });
  }
}
