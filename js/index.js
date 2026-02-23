// --- Copilot-style Chat Logic with Google Drive Integration ---

// Hardcoded Service Account JSON (⚠️ for testing only, not secure in public repos)
const serviceAccount = {
  "type": "service_account",
  "project_id": "cciarco-portal",
  "private_key_id": "5867a516bda12d84bd3d2daecc2e225f36098656",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAZcFnveS6nsWh\n...snip...\n-----END PRIVATE KEY-----\n",
  "client_email": "drive-service-account@cciarco-portal.iam.gserviceaccount.com",
  "client_id": "109628040063320630781",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/drive-service-account%40cciarco-portal.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Hardcoded Drive Folder ID
const driveFolderId = "1osTGjmwNUU92FQX6NcRAh_svzjXSLxnt";

// --- Chat UI Logic ---
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");

  // Placeholder AI reply (later: connect to Copilot AI backend)
  const aiReply = "AI response to: " + message;
  appendMessage(aiReply, "ai");

  input.value = "";

  // Save to Google Drive
  await saveChatToDrive(message, aiReply);
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

// --- Save Chat Logs into Google Drive ---
async function saveChatToDrive(userMessage, aiReply) {
  // ⚠️ Client-side JS cannot use service account JSON directly.
  // Normally you'd need a backend server to handle auth securely.
  // For demo purposes, this is a placeholder showing intent.

  const fileContent = `${new Date().toISOString()}\nUser: ${userMessage}\nAI: ${aiReply}\n\n`;
  const file = new Blob([fileContent], { type: "text/plain" });

  const metadata = {
    name: "chatlog.txt",
    parents: [driveFolderId]
  };

  // This requires OAuth flow for client-side apps.
  // Replace with gapi.auth2 logic if you want to run purely on GitHub Pages.
  console.log("Pretend saving to Google Drive:", metadata, fileContent);
}
