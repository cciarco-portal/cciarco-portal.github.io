const functions = require("firebase-functions");
const express = require("express");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

// Hardcoded Service Account JSON (⚠️ not secure for production)
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

async function saveChatToDrive(userMessage, aiReply) {
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/drive.file"]
  });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: "chatlog.txt",
    parents: ["1osTGjmwNUU92FQX6NcRAh_svzjXSLxnt"] // your Drive folder ID
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

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const aiReply = "AI response to: " + userMessage;
  await saveChatToDrive(userMessage, aiReply);
  res.json({ reply: aiReply });
});

exports.api = functions.https.onRequest(app);
