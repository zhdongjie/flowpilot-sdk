const T = (t, e) => t.findIndex((n) => n.step === e), b = (t, e) => !t || !e ? !0 : Object.keys(t).every((n) => e[n] === t[n]), M = (t, e = {}) => {
  const n = t.steps || [];
  if (!n.length)
    return null;
  if (typeof e.currentStep == "number") {
    const r = T(n, e.currentStep);
    if (r >= 0 && r + 1 < n.length) {
      for (let l = r + 1; l < n.length; l += 1) {
        const s = n[l];
        if (b(s.state, e.state))
          return s;
      }
      return null;
    }
    return null;
  }
  if (e.currentPage) {
    const r = n.find(
      (l) => l.page === e.currentPage && b(l.state, e.state)
    );
    if (r)
      return r;
  }
  return n.find((r) => b(r.state, e.state)) || n[0] || null;
}, S = (t) => t ? typeof t == "string" ? { selector: t, fallback: [], pages: [] } : {
  selector: t.selector || "",
  fallback: t.fallback || [],
  pages: t.pages || []
} : { selector: "", fallback: [], pages: [] }, H = (t, e) => {
  if (!t)
    return [];
  const n = S(e ? e[t] : null), i = [];
  n.selector && i.push(n.selector), Array.isArray(n.fallback) && n.fallback.forEach((l) => i.push(l));
  const r = `[data-guide-id="${t}"]`;
  return i.includes(r) || i.push(r), i.filter(Boolean);
}, P = (t, e) => {
  const n = S(e ? e[t] : null);
  return Array.isArray(n.pages) ? n.pages : [];
}, C = (t, e, n) => {
  const i = H(t, e), r = P(t, e);
  if (r.length && n && !r.includes(n))
    return { element: null, selectors: i };
  for (const l of i) {
    const s = document.querySelector(l);
    if (s)
      return { element: s, selectors: i };
  }
  return { element: null, selectors: i };
}, I = () => {
  const t = document.getElementById("flowpilot-root");
  if (t && t.shadowRoot)
    return t.shadowRoot;
  const e = document.createElement("div");
  return e.id = "flowpilot-root", document.body.appendChild(e), e.attachShadow({ mode: "open" });
}, F = (t) => {
  const e = document.createElement("div");
  e.className = "fp-highlight", e.style.display = "none", t.appendChild(e);
  const n = document.createElement("div"), i = document.createElement("div"), r = document.createElement("div"), l = document.createElement("div");
  return [n, i, r, l].forEach((a) => {
    a.className = "fp-mask-piece", a.style.display = "none", t.appendChild(a);
  }), { update: (a) => {
    if (!a || a.width <= 1 || a.height <= 1) {
      e.style.display = "none", [n, i, r, l].forEach((g) => {
        g.style.display = "none";
      });
      return;
    }
    const c = 8, d = Math.max(a.top - c, 0), u = Math.max(a.left - c, 0), p = Math.min(a.left + a.width + c, window.innerWidth), f = Math.min(a.top + a.height + c, window.innerHeight), h = Math.max(f - d, 0);
    e.style.display = "block", e.style.top = `${d}px`, e.style.left = `${u}px`, e.style.width = `${p - u}px`, e.style.height = `${h}px`, n.style.display = "block", n.style.top = "0px", n.style.left = "0px", n.style.width = `${window.innerWidth}px`, n.style.height = `${d}px`, l.style.display = "block", l.style.top = `${f}px`, l.style.left = "0px", l.style.width = `${window.innerWidth}px`, l.style.height = `${window.innerHeight - f}px`, i.style.display = "block", i.style.top = `${d}px`, i.style.left = "0px", i.style.width = `${u}px`, i.style.height = `${h}px`, r.style.display = "block", r.style.top = `${d}px`, r.style.left = `${p}px`, r.style.width = `${window.innerWidth - p}px`, r.style.height = `${h}px`;
  } };
}, W = (t) => {
  const e = document.createElement("div");
  return e.className = "fp-tooltip", e.style.display = "none", t.appendChild(e), { update: (i, r) => {
    if (!i || !r.message) {
      e.style.display = "none", e.innerHTML = "";
      return;
    }
    e.style.display = "block";
    const s = i.bottom + 12, a = window.innerWidth - 300, c = Math.max(12, Math.min(i.left, a)), d = s + 120 > window.innerHeight ? Math.max(12, i.top - 80) : s;
    e.style.top = `${d}px`, e.style.left = `${c}px`, e.innerHTML = "";
    const u = document.createElement("div");
    if (u.className = "fp-tooltip-title", u.textContent = r.message || "", e.appendChild(u), r.reason) {
      const p = document.createElement("div");
      p.className = "fp-tooltip-reason", p.textContent = r.reason, e.appendChild(p);
    }
    if (r.showNext && r.onNext) {
      const p = document.createElement("button");
      p.className = "fp-tooltip-action", p.type = "button", p.textContent = "我已填写，继续", p.addEventListener("click", r.onNext, { once: !0 }), e.appendChild(p);
    }
  } };
}, A = `
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
class D {
  constructor(e) {
    this.root = e;
    const n = document.createElement("style");
    n.textContent = A, this.root.appendChild(n), this.highlight = F(this.root), this.tooltip = W(this.root), this.highlight.update(null), this.tooltip.update(null, { message: "", reason: "" });
  }
  render(e, n, i) {
    if (!n) {
      this.highlight.update(null), this.tooltip.update(null, { message: "", reason: "" });
      return;
    }
    const r = n.getBoundingClientRect();
    this.highlight.update(r);
    const l = !!(e.form && e.form.length);
    this.tooltip.update(r, {
      message: e.action || "",
      reason: e.desc || "",
      showNext: l,
      onNext: i
    });
  }
  clear() {
    this.highlight.update(null), this.tooltip.update(null, { message: "", reason: "" });
  }
}
const R = (t, e) => {
  const n = document.createElement("div");
  n.className = "fp-chat", t.appendChild(n);
  const i = document.createElement("button");
  i.className = "fp-chat-fab", i.textContent = "在线客服", n.appendChild(i);
  const r = document.createElement("div");
  r.className = "fp-chat-panel", r.style.display = "none", n.appendChild(r);
  const l = document.createElement("div");
  l.className = "fp-chat-header", l.innerHTML = "<strong>智能客服</strong><span>插件引导助手</span>", r.appendChild(l);
  const s = document.createElement("div");
  s.className = "fp-chat-body", r.appendChild(s);
  const a = document.createElement("div");
  a.className = "fp-chat-input-row", r.appendChild(a);
  const c = document.createElement("input");
  c.className = "fp-chat-input", c.placeholder = "例如：我要开卡", a.appendChild(c);
  const d = document.createElement("button");
  d.className = "fp-chat-send", d.textContent = "发送", a.appendChild(d);
  const u = (f, h) => {
    const g = document.createElement("div");
    g.className = `fp-chat-bubble ${f}`, g.textContent = h, s.appendChild(g), s.scrollTop = s.scrollHeight;
  }, p = () => {
    r.style.display = r.style.display === "none" ? "block" : "none";
  };
  return i.addEventListener("click", p), d.addEventListener("click", () => {
    const f = c.value.trim();
    f && (c.value = "", u("user", f), e.onSend(f));
  }), { addMessage: u, panel: r };
}, B = "0.1.0", y = "__FLOWPILOT__", o = {
  config: null,
  runtime: null,
  currentStep: null,
  currentIntent: "",
  currentStepData: null,
  currentElement: null,
  currentTarget: null,
  clickHandler: null,
  chat: null,
  initialized: !1
}, N = (t) => {
  if (!o.config)
    return null;
  const e = Array.isArray(o.config.workflow) ? o.config.workflow : [o.config.workflow];
  return t ? e.find((n) => n.id === t) || e[0] || null : e[0] || null;
}, E = () => {
  var t;
  return (t = o.config) != null && t.getCurrentPage ? o.config.getCurrentPage() : window.location.pathname || "";
}, _ = () => {
  var t;
  return (t = o.config) != null && t.getState ? o.config.getState() || {} : {};
}, $ = (...t) => {
  var e;
  (e = o.config) != null && e.debug && console.log("[FlowPilot]", ...t);
}, m = (t) => {
  var n, i;
  const e = t instanceof Error ? t : new Error(String(t));
  console.error("[FlowPilot]", e), (i = (n = o.config) == null ? void 0 : n.onError) == null || i.call(n, e);
}, v = () => {
  o.currentTarget && o.clickHandler && o.currentTarget.removeEventListener("click", o.clickHandler), o.currentTarget = null, o.clickHandler = null;
}, w = () => {
  if (!o.runtime || !o.config || !o.currentStepData)
    return;
  const { element: t } = C(
    o.currentStepData.highlight,
    o.config.mapping,
    E()
  );
  o.currentElement = t, o.runtime.render(
    o.currentStepData,
    t,
    () => {
      var e;
      return x(((e = o.currentStepData) == null ? void 0 : e.step) ?? null);
    }
  ), z(o.currentStepData, t);
}, z = (t, e) => {
  v();
  const n = !!(t.form && t.form.length);
  if (!e || n)
    return;
  const i = () => {
    x(t.step);
  };
  e.addEventListener("click", i, { once: !0 }), o.currentTarget = e, o.clickHandler = i;
}, x = (t) => {
  var s, a, c, d;
  if (!o.config || !o.runtime)
    return;
  const e = N(o.currentIntent);
  if (!e) {
    m(new Error("Workflow not found"));
    return;
  }
  if (!e.steps || e.steps.length === 0) {
    m(new Error("Workflow has no steps"));
    return;
  }
  if (typeof t == "number" && !e.steps.some((u) => u.step === t)) {
    m(new Error(`Step ${t} not found in workflow`));
    return;
  }
  const n = M(e, {
    currentStep: t,
    currentPage: E(),
    state: _()
  }), i = o.currentStep;
  if (o.currentStep = n ? n.step : null, o.currentStepData = n, !n) {
    v(), o.currentElement = null, o.runtime.clear(), o.chat && i !== null && o.chat.addMessage("assistant", "✅ 已完成"), (a = (s = o.config).onFinish) == null || a.call(s);
    return;
  }
  const { element: r, selectors: l } = C(
    n.highlight,
    o.config.mapping,
    E()
  );
  if (r || m(
    new Error(
      `Element not found for "${n.highlight}". Tried selectors: ${l.join(
        ", "
      )}`
    )
  ), o.currentElement = r, o.runtime.render(n, r, () => x(n.step)), z(n, r), o.chat && i !== n.step) {
    const u = n.action || n.desc || "请继续完成流程。";
    o.chat.addMessage("assistant", u);
  }
  (d = (c = o.config).onStepChange) == null || d.call(c, n), $("step change", n);
}, O = (t) => {
  if (typeof window < "u" && window[y]) {
    console.warn("[FlowPilot] already initialized on this page.");
    return;
  }
  if (o.initialized) {
    console.warn("[FlowPilot] init has already been called.");
    return;
  }
  o.config = t;
  const e = I();
  if (o.runtime = new D(e), o.chat = R(e, {
    onSend: (n) => k(n, !0)
  }), o.initialized || (window.addEventListener("scroll", w, !0), window.addEventListener("resize", w), o.initialized = !0, window[y] = !0), o.config.debug && $("init", t), o.config.autoStart) {
    const n = N();
    n ? k(n.id) : m(new Error("Workflow not found for autoStart"));
  }
}, k = (t, e = !1) => {
  o.currentIntent = t, !e && o.chat && o.chat.addMessage("user", t), x(null);
}, G = () => x(o.currentStep), L = () => {
  var t;
  v(), o.currentStep = null, o.currentStepData = null, o.currentElement = null, o.currentIntent = "", (t = o.runtime) == null || t.clear();
}, j = () => {
  L(), o.runtime && o.runtime.clear(), o.initialized && (window.removeEventListener("scroll", w, !0), window.removeEventListener("resize", w));
  const t = document.getElementById("flowpilot-root");
  t && t.parentNode && t.parentNode.removeChild(t), typeof window < "u" && delete window[y], o.config = null, o.runtime = null, o.chat = null, o.initialized = !1;
}, q = { init: O, start: k, next: G, reset: L, destroy: j, version: B };
typeof window < "u" && (window.FlowPilot = q);
export {
  q as default
};
