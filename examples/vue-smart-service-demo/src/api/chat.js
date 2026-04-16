export async function sendChat(message, currentPage, currentStep) {
  const payload = {
    message,
    current_page: currentPage || "",
  };
  if (typeof currentStep === "number") {
    payload.current_step = currentStep;
  }

  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
