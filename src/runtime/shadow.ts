export const mountShadowRoot = (): ShadowRoot => {
  const existing = document.getElementById("flowpilot-root");
  if (existing && existing.shadowRoot) {
    return existing.shadowRoot;
  }

  const host = document.createElement("div");
  host.id = "flowpilot-root";
  document.body.appendChild(host);
  return host.attachShadow({ mode: "open" });
};
