type TooltipOptions = {
  message?: string;
  reason?: string;
  showNext?: boolean;
  onNext?: () => void;
};

export const createTooltip = (root: ShadowRoot) => {
  const tooltip = document.createElement("div");
  tooltip.className = "fp-tooltip";
  tooltip.style.display = "none";
  root.appendChild(tooltip);

  const update = (rect: DOMRect | null, options: TooltipOptions) => {
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
    const top =
      rawTop + 120 > window.innerHeight
        ? Math.max(12, rect.top - 80)
        : rawTop;

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

  return { update };
};
