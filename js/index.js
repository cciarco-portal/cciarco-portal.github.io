async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");

  const response = await fetch("http://localhost:3000/copilot-api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: message })
  });

  const data = await response.json();
  appendMessage(data.reply, "ai");

  input.value = "";
}

function appendMessage(text, sender) {
  const chatLog = document.getElementById("chatLog");
  const bubble = document.createElement("div");
  bubble.classList.add("message", sender);
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}
