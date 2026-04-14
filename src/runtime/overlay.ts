type Rect = { top: number; left: number; width: number; height: number };

export const createHighlight = (root: ShadowRoot) => {
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

  const update = (rect: Rect | null) => {
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

  return { update };
};
