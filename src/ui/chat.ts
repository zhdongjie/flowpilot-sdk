type ChatOptions = {
  onSend: (text: string) => void;
};

export const mountChat = (root: ShadowRoot, options: ChatOptions) => {
  const container = document.createElement("div");
  container.className = "fp-chat";
  root.appendChild(container);

  const button = document.createElement("button");
  button.className = "fp-chat-fab";
  button.textContent = "在线客服";
  container.appendChild(button);

  const panel = document.createElement("div");
  panel.className = "fp-chat-panel";
  panel.style.display = "none";
  container.appendChild(panel);

  const header = document.createElement("div");
  header.className = "fp-chat-header";
  header.innerHTML = "<strong>智能客服</strong><span>插件引导助手</span>";
  panel.appendChild(header);

  const body = document.createElement("div");
  body.className = "fp-chat-body";
  panel.appendChild(body);

  const inputRow = document.createElement("div");
  inputRow.className = "fp-chat-input-row";
  panel.appendChild(inputRow);

  const input = document.createElement("input");
  input.className = "fp-chat-input";
  input.placeholder = "例如：我要开卡";
  inputRow.appendChild(input);

  const send = document.createElement("button");
  send.className = "fp-chat-send";
  send.textContent = "发送";
  inputRow.appendChild(send);

  const addMessage = (role: "user" | "assistant", text: string) => {
    const bubble = document.createElement("div");
    bubble.className = `fp-chat-bubble ${role}`;
    bubble.textContent = text;
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
  };

  const toggle = () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  };

  button.addEventListener("click", toggle);
  send.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMessage("user", text);
    options.onSend(text);
  });

  return { addMessage, panel };
};
