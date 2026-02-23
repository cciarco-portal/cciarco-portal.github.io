const functions = require("firebase-functions");
const express = require("express");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

// Save chat logs into Google Drive
async function saveChatToDrive(userMessage, aiReply) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
    scopes: ["https://www.googleapis.com/auth/drive.file"]
  });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: "chatlog.txt",
    parents: [process.env.DRIVE_FOLDER_ID]
  };

  const media = {
    mimeType: "text/plain",
    body: `${new Date().toISOString()}\nUser: ${userMessage}\nAI: ${aiReply}\n\n`
  };

  await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id"
  });
}

// Chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const aiReply = "AI response to: " + userMessage; // later: connect to Copilot AI
  await saveChatToDrive(userMessage, aiReply);
  res.json({ reply: aiReply });
});

exports.api = functions.https.onRequest(app);
