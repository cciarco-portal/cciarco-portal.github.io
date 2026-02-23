// --- Hardcoded Copilot-style AI Chat ---

function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");

  // Hardcoded AI logic
  const aiReply = getAIResponse(message);
  appendMessage(aiReply, "ai");

  input.value = "";
}

// Append styled message bubbles
function appendMessage(text, sender) {
  const chatLog = document.getElementById("chatLog");
  const bubble = document.createElement("div");
  bubble.classList.add("message", sender);
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// --- Hardcoded AI responses ---
function getAIResponse(userMessage) {
  const lower = userMessage.toLowerCase();

  if (lower.includes("incident management")) {
    return "Incident Management Policy: Critical incidents must be contained within 1 hour, high severity within 4 hours, medium within 24 hours, and low within 3 business days.";
  }
  if (lower.includes("rapid7")) {
    return "Rapid7 logs are used as PCI DSS evidence for quarterly vulnerability scans (Req. 11.2) and annual penetration testing (Req. 11.3).";
  }
  if (lower.includes("disaster recovery")) {
    return "Disaster Recovery Plan: Defines RTO/RPO targets, rollback planning, and alternate site activation.";
  }

  // Default fallback
  return "I don’t have a hardcoded answer for that yet. Please refine your question.";
}
