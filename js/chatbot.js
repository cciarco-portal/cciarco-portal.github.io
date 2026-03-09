const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const googleClientIdInput = document.getElementById('googleClientId');
const connectDriveBtn = document.getElementById('connectDriveBtn');
const refreshFilesBtn = document.getElementById('refreshFilesBtn');
const driveFilesEl = document.getElementById('driveFiles');
const useDriveContextCheckbox = document.getElementById('useDriveContext');
const menuIcon = document.getElementById('menu-icon');
const navbar = document.querySelector('.navbar');

let tokenClient;
let driveAccessToken = '';
let driveFiles = [];

appendMessage('AI', 'Ready. Add your Gemini API key, then ask a question.');

if (menuIcon && navbar) {
  menuIcon.addEventListener('click', () => {
    navbar.classList.toggle('active');
  });
}

connectDriveBtn.addEventListener('click', async () => {
  try {
    const clientId = googleClientIdInput.value.trim();
    if (!clientId) {
      appendMessage('AI', 'Please enter your Google OAuth Client ID first.');
      return;
    }

    if (!looksLikeGoogleClientId(clientId)) {
      appendMessage('AI', 'Google OAuth Client ID looks invalid. Use the Web Client ID from Google Cloud (format: ...apps.googleusercontent.com), not your email address.');
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: async (response) => {
        if (response.error) {
          appendMessage('AI', `Drive connection failed: ${friendlyDriveError(response.error)}`);
          return;
        }

        driveAccessToken = response.access_token;
        appendMessage('AI', 'Google Drive connected. Loading files...');
        await loadDriveFiles();
      }
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (error) {
    appendMessage('AI', `Drive setup error: ${error.message}`);
  }
});

refreshFilesBtn.addEventListener('click', async () => {
  if (!driveAccessToken) {
    appendMessage('AI', 'Connect Google Drive first.');
    return;
  }

  await loadDriveFiles();
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const question = userInput.value.trim();
  const apiKey = geminiApiKeyInput.value.trim();

  if (!question) return;

  if (!apiKey) {
    appendMessage('AI', 'Please enter your Gemini API key first.');
    return;
  }

  if (!looksLikeGeminiApiKey(apiKey)) {
    appendMessage('AI', 'Gemini API key format looks invalid. It should typically start with "AIza".');
    return;
  }

  appendMessage('You', question, 'user');
  userInput.value = '';

  try {
    const contextPayload = useDriveContextCheckbox.checked
      ? await buildDriveContext(question)
      : { textContext: '', pdfParts: [] };

    const aiReply = await askGemini({
      apiKey,
      question,
      driveContext: contextPayload.textContext,
      pdfParts: contextPayload.pdfParts
    });

    appendMessage('AI', aiReply);
  } catch (error) {
    appendMessage('AI', `Request failed: ${error.message}`);
  }
});

async function loadDriveFiles() {
  const params = new URLSearchParams({
    pageSize: '30',
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,mimeType,modifiedTime)'
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${driveAccessToken}` }
  });

  if (!response.ok) throw new Error('Unable to load Drive files.');

  const data = await response.json();
  driveFiles = (data.files || []).filter((file) => isSupportedFile(file.mimeType));
  renderDriveFiles();
}

function renderDriveFiles() {
  driveFilesEl.innerHTML = '';

  if (!driveFiles.length) {
    const li = document.createElement('li');
    li.textContent = 'No supported Drive files found.';
    driveFilesEl.appendChild(li);
    return;
  }

  driveFiles.forEach((file) => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.fileId = file.id;

    const label = document.createElement('label');
    label.textContent = `${file.name} (${friendlyMime(file.mimeType)})`;

    li.appendChild(checkbox);
    li.appendChild(label);
    driveFilesEl.appendChild(li);
  });
}

async function buildDriveContext(question) {
  if (!driveAccessToken) return { textContext: '', pdfParts: [] };

  const selectedIds = [...driveFilesEl.querySelectorAll('input[type="checkbox"]:checked')]
    .map((item) => item.dataset.fileId);

  if (!selectedIds.length) return { textContext: '', pdfParts: [] };

  const chosenFiles = driveFiles.filter((file) => selectedIds.includes(file.id)).slice(0, 6);
  const textDocs = [];
  const pdfParts = [];

  for (const file of chosenFiles) {
    if (file.mimeType === 'application/pdf') {
      const pdfPart = await fetchPdfInlinePart(file);
      if (pdfPart) pdfParts.push(pdfPart);
      continue;
    }

    const text = await fetchFileText(file);
    if (text) textDocs.push({ name: file.name, text: text.slice(0, 6000) });
  }

  const topSnippets = textDocs
    .map((doc) => ({ name: doc.name, snippet: extractBestSnippet(doc.text, question) }))
    .filter((item) => item.snippet)
    .slice(0, 4);

  const textContext = topSnippets
    .map((item, index) => `Document ${index + 1}: ${item.name}\n${item.snippet}`)
    .join('\n\n');

  return { textContext, pdfParts: pdfParts.slice(0, 1) };
}

async function fetchFileText(file) {
  let endpoint;

  if (file.mimeType === 'application/vnd.google-apps.document') {
    endpoint = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
  } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    endpoint = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
  } else if (file.mimeType === 'text/plain' || file.mimeType === 'text/markdown') {
    endpoint = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
  } else {
    return '';
  }

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${driveAccessToken}` }
  });

  if (!response.ok) return '';
  return response.text();
}

async function fetchPdfInlinePart(file) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${driveAccessToken}` }
  });

  if (!response.ok) return null;

  const blob = await response.blob();
  if (blob.size > 4 * 1024 * 1024) {
    appendMessage('AI', `Skipped PDF "${file.name}" because it is larger than 4MB.`);
    return null;
  }

  const base64Data = await blobToBase64(blob);
  return {
    inline_data: {
      mime_type: 'application/pdf',
      data: base64Data
    }
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to convert file to base64.'));
        return;
      }
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function extractBestSnippet(text, query) {
  const lines = text.split(/\n+/).filter(Boolean);
  if (!lines.length) return '';

  const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const scored = lines.map((line) => {
    const lower = line.toLowerCase();
    const score = keywords.reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0);
    return { line, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map((item) => item.line).join('\n');
}

async function askGemini({ apiKey, question, driveContext, pdfParts }) {
  const parts = [];
  const systemInstruction = 'You are a helpful enterprise assistant. Use Drive context/PDF content when provided, and mention which source type you used.';

  if (driveContext) {
    parts.push({ text: `Drive text context:\n${driveContext}` });
  }

  if (pdfParts?.length) {
    parts.push(...pdfParts);
  }

  parts.push({ text: `User question:\n${question}` });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts }]
    })
  });

  if (!response.ok) {
    let errorPayload = null;
    try {
      errorPayload = await response.json();
    } catch (_) {
      errorPayload = null;
    }

    const friendly = friendlyGeminiError(response.status, errorPayload);
    throw new Error(friendly);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

function appendMessage(sender, text, cssClass = 'ai') {
  const bubble = document.createElement('div');
  bubble.className = `message ${cssClass}`;
  bubble.textContent = `${sender}: ${text}`;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function isSupportedFile(mimeType) {
  return mimeType === 'application/vnd.google-apps.document'
    || mimeType === 'application/vnd.google-apps.spreadsheet'
    || mimeType === 'text/plain'
    || mimeType === 'text/markdown'
    || mimeType === 'application/pdf';
}

function friendlyMime(mimeType) {
  if (mimeType === 'application/vnd.google-apps.document') return 'Google Doc';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheet';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/plain') return 'TXT';
  if (mimeType === 'text/markdown') return 'Markdown';
  return mimeType;
}

function looksLikeGoogleClientId(value) {
  return /\.apps\.googleusercontent\.com$/.test(value);
}

function looksLikeGeminiApiKey(value) {
  return /^AIza[\w-]{10,}$/.test(value);
}

function friendlyDriveError(errorCode) {
  if (errorCode === 'popup_closed_by_user') {
    return 'The sign-in popup was closed before completion.';
  }

  if (errorCode === 'access_denied') {
    return 'Drive access was denied. Please allow Drive read access.';
  }

  return `${errorCode}. Verify your OAuth client ID and allowed origins in Google Cloud.`;
}

function friendlyGeminiError(status, payload) {
  const message = payload?.error?.message || '';

  if (status === 400 && /API key not valid/i.test(message)) {
    return 'Gemini API key is invalid. Use a valid key from Google AI Studio.';
  }

  if (status === 403) {
    return 'Gemini request was forbidden. Check API key restrictions and ensure the Generative Language API is enabled.';
  }

  if (status === 429) {
    return 'Rate limit reached. Please wait a moment and retry.';
  }

  return `Gemini request failed (${status}). ${message || 'Please verify API setup and try again.'}`;
}
