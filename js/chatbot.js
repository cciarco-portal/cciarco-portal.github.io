const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const aiProviderSelect = document.getElementById('aiProvider');
const llmApiKeyInput = document.getElementById('llmApiKey');
const llmModelInput = document.getElementById('llmModel');
const googleClientIdInput = document.getElementById('googleClientId');
const connectDriveBtn = document.getElementById('connectDriveBtn');
const refreshFilesBtn = document.getElementById('refreshFilesBtn');
const driveFilesEl = document.getElementById('driveFiles');
const useDriveContextCheckbox = document.getElementById('useDriveContext');
const knowledgeUploadInput = document.getElementById('knowledgeUpload');
const uploadFilesEl = document.getElementById('uploadFiles');
const clearUploadsBtn = document.getElementById('clearUploadsBtn');
const useUploadContextCheckbox = document.getElementById('useUploadContext');
const menuIcon = document.getElementById('menu-icon');
const navbar = document.querySelector('.navbar');

const DEFAULT_GEMINI_API_KEY = 'AIzaSyDNn9hOuX-c_H4_jdlWYtq51Fjt1QAfbwE';
const DEFAULT_GOOGLE_CLIENT_ID = '513140257536-7e9dus3vgcnkvon2cvk16a6egr56s5n2.apps.googleusercontent.com';

const MODEL_DEFAULTS = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  xai: 'grok-2-latest'
};

let tokenClient;
let driveAccessToken = '';
let driveFiles = [];
let uploadedKnowledge = [];
let lastSystemMessage = '';
let lastSystemMessageAt = 0;
const SYSTEM_MESSAGE_COOLDOWN_MS = 4000;
const RETRY_DELAYS_MS = [1200, 2500];
const DRIVE_CONNECTED_COOKIE = 'cciarco_drive_connected';
const DRIVE_CLIENT_COOKIE = 'cciarco_drive_client_id';

appendMessage('AI', 'Ready. Select a provider, then ask a question.');

if (!llmApiKeyInput.value) {
  llmApiKeyInput.value = DEFAULT_GEMINI_API_KEY;
}

if (!googleClientIdInput.value) {
  googleClientIdInput.value = DEFAULT_GOOGLE_CLIENT_ID;
}

restoreDriveSessionFromCookie();
applyProviderDefaults(aiProviderSelect.value);

if (menuIcon && navbar) {
  menuIcon.addEventListener('click', () => {
    navbar.classList.toggle('active');
  });
}

aiProviderSelect.addEventListener('change', () => {
  const provider = aiProviderSelect.value;
  applyProviderDefaults(provider);
});

connectDriveBtn.addEventListener('click', async () => {
  try {
    if (driveAccessToken) {
      appendMessage('AI', 'Drive session already active. Refreshing files...');
      await loadDriveFiles();
      return;
    }
    const clientId = googleClientIdInput.value.trim();
    if (!clientId) {
      appendMessage('AI', 'Please enter your Google OAuth Client ID first.');
      return;
    }

    if (!looksLikeGoogleClientId(clientId)) {
      appendMessage('AI', 'Google OAuth Client ID looks invalid. Use a Web Client ID from Google Cloud (...apps.googleusercontent.com), not your email address.');
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
        rememberDriveSession(clientId);
        appendMessage('AI', 'Google Drive connected. Loading files...');
        await loadDriveFiles();
      }
    });

    requestDriveTokenWithPrompt('consent');
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

knowledgeUploadInput.addEventListener('change', async (event) => {
  const files = [...event.target.files];
  if (!files.length) return;

  for (const file of files.slice(0, 10)) {
    const parsed = await parseLocalKnowledgeFile(file);
    if (parsed) {
      uploadedKnowledge.push(parsed);
    }
  }

  renderUploadedFiles();
  appendMessage('AI', `Loaded ${files.length} uploaded file(s) for knowledge context.`);
});

clearUploadsBtn.addEventListener('click', () => {
  uploadedKnowledge = [];
  knowledgeUploadInput.value = '';
  renderUploadedFiles();
  appendMessage('AI', 'Cleared uploaded knowledge files.');
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const provider = aiProviderSelect.value;
  const question = userInput.value.trim();
  const apiKey = llmApiKeyInput.value.trim();
  const model = llmModelInput.value.trim() || MODEL_DEFAULTS[provider];

  if (!question) return;

  if (!apiKey) {
    appendMessage('AI', 'Please enter an API key for the selected provider.');
    return;
  }

  if (provider === 'gemini' && !looksLikeGeminiApiKey(apiKey)) {
    appendMessage('AI', 'Gemini API key format looks invalid. It should typically start with "AIza".');
    return;
  }

  appendMessage('You', question, 'user');
  userInput.value = '';

  try {
    const driveContext = useDriveContextCheckbox.checked
      ? await buildDriveContext(question, provider)
      : { textContext: '', geminiPdfParts: [] };

    const uploadContext = useUploadContextCheckbox.checked
      ? await buildUploadContext(question, provider)
      : { textContext: '', geminiPdfParts: [] };

    const combinedTextContext = [driveContext.textContext, uploadContext.textContext]
      .filter(Boolean)
      .join('\n\n');

    const geminiPdfParts = [...(driveContext.geminiPdfParts || []), ...(uploadContext.geminiPdfParts || [])].slice(0, 2);

    const aiReply = await askProvider({
      provider,
      apiKey,
      model,
      question,
      textContext: combinedTextContext,
      geminiPdfParts
    });

    appendMessage('AI', aiReply);
  } catch (error) {
    appendMessage('AI', `Request failed: ${error.message}`);
  }
});


function restoreDriveSessionFromCookie() {
  const remembered = getCookie(DRIVE_CONNECTED_COOKIE) === '1';
  const rememberedClientId = getCookie(DRIVE_CLIENT_COOKIE);

  if (!remembered || !rememberedClientId) {
    return;
  }

  if (!googleClientIdInput.value) {
    googleClientIdInput.value = rememberedClientId;
  }

  if (!looksLikeGoogleClientId(googleClientIdInput.value.trim())) {
    return;
  }

  if (!(window.google && google.accounts && google.accounts.oauth2)) {
    setTimeout(restoreDriveSessionFromCookie, 500);
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: googleClientIdInput.value.trim(),
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    callback: async (response) => {
      if (response.error) {
        if (response.error !== 'interaction_required') {
          appendMessage('AI', `Drive session restore failed: ${friendlyDriveError(response.error)}`);
        }
        return;
      }

      driveAccessToken = response.access_token;
      appendMessage('AI', 'Drive session restored from memory.');
      await loadDriveFiles();
    }
  });

  requestDriveTokenWithPrompt('');
}

function requestDriveTokenWithPrompt(promptValue) {
  if (!tokenClient) {
    return;
  }

  const options = promptValue ? { prompt: promptValue } : {};
  tokenClient.requestAccessToken(options);
}

function rememberDriveSession(clientId) {
  setCookie(DRIVE_CONNECTED_COOKIE, '1', 30);
  setCookie(DRIVE_CLIENT_COOKIE, clientId, 30);
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const key = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(';').map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(key)) {
      return decodeURIComponent(part.slice(key.length));
    }
  }
  return '';
}

function applyProviderDefaults(provider) {
  if (!llmModelInput.value) {
    llmModelInput.value = MODEL_DEFAULTS[provider];
  }

  if (provider === 'gemini') {
    llmApiKeyInput.placeholder = 'Gemini API key (AIza...)';
    if (!llmApiKeyInput.value) {
      llmApiKeyInput.value = DEFAULT_GEMINI_API_KEY;
    }
  } else if (provider === 'openai') {
    llmApiKeyInput.placeholder = 'OpenAI API key (sk-...)';
    if (llmApiKeyInput.value === DEFAULT_GEMINI_API_KEY) {
      llmApiKeyInput.value = '';
    }
  } else {
    llmApiKeyInput.placeholder = 'xAI API key (xai-...)';
    if (llmApiKeyInput.value === DEFAULT_GEMINI_API_KEY) {
      llmApiKeyInput.value = '';
    }
  }

  if (llmModelInput.value && llmModelInput.dataset.provider !== provider) {
    llmModelInput.value = MODEL_DEFAULTS[provider];
  }

  llmModelInput.dataset.provider = provider;
}

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
  driveFiles = (data.files || []).filter((file) => isSupportedDriveMime(file.mimeType));
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

async function buildDriveContext(question, provider) {
  if (!driveAccessToken) return { textContext: '', geminiPdfParts: [] };

  const selectedIds = [...driveFilesEl.querySelectorAll('input[type="checkbox"]:checked')]
    .map((item) => item.dataset.fileId);

  if (!selectedIds.length) return { textContext: '', geminiPdfParts: [] };

  const chosenFiles = driveFiles.filter((file) => selectedIds.includes(file.id)).slice(0, 6);
  const textDocs = [];
  const geminiPdfParts = [];

  for (const file of chosenFiles) {
    if (file.mimeType === 'application/pdf' && provider === 'gemini') {
      const pdfPart = await fetchDrivePdfInlinePart(file);
      if (pdfPart) geminiPdfParts.push(pdfPart);
      continue;
    }

    const text = await fetchDriveFileText(file);
    if (text) textDocs.push({ name: file.name, text: text.slice(0, 7000) });
  }

  return {
    textContext: buildSnippetContext(textDocs, question, 'Drive'),
    geminiPdfParts: geminiPdfParts.slice(0, 1)
  };
}

async function buildUploadContext(question, provider) {
  if (!uploadedKnowledge.length) return { textContext: '', geminiPdfParts: [] };

  const textDocs = uploadedKnowledge
    .filter((item) => item.text)
    .map((item) => ({ name: item.name, text: item.text.slice(0, 7000) }));

  const geminiPdfParts = provider === 'gemini'
    ? uploadedKnowledge.filter((item) => item.geminiPdfPart).map((item) => item.geminiPdfPart).slice(0, 1)
    : [];

  if (provider !== 'gemini' && uploadedKnowledge.some((item) => item.isPdf)) {
    appendMessage('AI', 'PDF upload context is currently used only with Gemini provider.');
  }

  return {
    textContext: buildSnippetContext(textDocs, question, 'Upload'),
    geminiPdfParts
  };
}

function buildSnippetContext(docs, question, prefix) {
  const snippets = docs
    .map((doc) => ({
      name: doc.name,
      snippet: extractBestSnippet(doc.text, question)
    }))
    .filter((item) => item.snippet)
    .slice(0, 4);

  return snippets
    .map((item, index) => `${prefix} Document ${index + 1}: ${item.name}\n${item.snippet}`)
    .join('\n\n');
}

async function fetchDriveFileText(file) {
  let endpoint;

  if (file.mimeType === 'application/vnd.google-apps.document') {
    endpoint = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
  } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    endpoint = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
  } else if (file.mimeType === 'text/plain' || file.mimeType === 'text/markdown' || file.mimeType === 'application/json' || file.mimeType === 'text/csv') {
    endpoint = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
  } else {
    return '';
  }

  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${driveAccessToken}` } });
  if (!response.ok) return '';
  return response.text();
}

async function fetchDrivePdfInlinePart(file) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${driveAccessToken}` }
  });

  if (!response.ok) return null;
  const blob = await response.blob();
  return buildGeminiPdfPart(blob, file.name);
}

async function parseLocalKnowledgeFile(file) {
  const mime = file.type || '';
  const name = file.name;

  if (isPlainTextFile(file, mime)) {
    const text = await file.text();
    return { name, text, isPdf: false, mimeType: mime || guessMimeFromName(name) };
  }

  if (mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    const geminiPdfPart = await buildGeminiPdfPart(file, name);
    return { name, text: '', isPdf: true, geminiPdfPart, mimeType: 'application/pdf' };
  }

  appendMessage('AI', `Skipped unsupported upload type for ${name}. Use txt/md/csv/json/pdf.`);
  return null;
}

function isPlainTextFile(file, mime) {
  const lower = file.name.toLowerCase();
  if (mime.startsWith('text/')) return true;
  return lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.csv') || lower.endsWith('.json');
}

function guessMimeFromName(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.json')) return 'application/json';
  return 'text/plain';
}

function renderUploadedFiles() {
  uploadFilesEl.innerHTML = '';

  if (!uploadedKnowledge.length) {
    const li = document.createElement('li');
    li.textContent = 'No uploaded knowledge files yet.';
    uploadFilesEl.appendChild(li);
    return;
  }

  uploadedKnowledge.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.name} (${friendlyMime(item.mimeType || 'text/plain')})`;
    uploadFilesEl.appendChild(li);
  });
}

async function buildGeminiPdfPart(blobLike, nameForMessage) {
  const blob = blobLike instanceof Blob ? blobLike : new Blob([blobLike], { type: 'application/pdf' });
  if (blob.size > 4 * 1024 * 1024) {
    appendMessage('AI', `Skipped PDF "${nameForMessage}" because it is larger than 4MB.`);
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

async function askProvider({ provider, apiKey, model, question, textContext, geminiPdfParts }) {
  const combinedPrompt = textContext
    ? `Knowledge context:\n${textContext}\n\nUser question:\n${question}`
    : `User question:\n${question}`;

  if (provider === 'gemini') {
    return askGemini({ apiKey, model, question, textContext, geminiPdfParts });
  }

  if (provider === 'openai') {
    return askOpenAI({ apiKey, model, prompt: combinedPrompt });
  }

  if (provider === 'xai') {
    return askXAI({ apiKey, model, prompt: combinedPrompt });
  }

  throw new Error('Unsupported provider selected.');
}

async function askGemini({ apiKey, model, question, textContext, geminiPdfParts }) {
  const parts = [];
  const systemInstruction = 'You are a helpful enterprise assistant. Use provided knowledge context when available.';

  if (textContext) {
    parts.push({ text: `Knowledge context:\n${textContext}` });
  }

  if (geminiPdfParts?.length) {
    parts.push(...geminiPdfParts);
  }

  parts.push({ text: `User question:\n${question}` });

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts }]
  });

  const modelsToTry = await resolveGeminiModels(apiKey, model);
  let lastStatus = 0;
  let lastPayload = null;

  for (const candidate of modelsToTry) {
    const response = await fetchWithRateLimitRetry(`https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    }, 'Gemini');

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    }

    let errorPayload = null;
    try {
      errorPayload = await response.json();
    } catch (_) {
      errorPayload = null;
    }

    lastStatus = response.status;
    lastPayload = errorPayload;

    if (response.status !== 404) {
      break;
    }
  }

  throw new Error(friendlyGeminiError(lastStatus, lastPayload));
}

async function resolveGeminiModels(apiKey, preferredModel) {
  const preferred = [preferredModel || MODEL_DEFAULTS.gemini, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  const uniquePreferred = [...new Set(preferred.filter(Boolean))];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
  if (!response.ok) return uniquePreferred;

  const payload = await response.json();
  const available = (payload.models || [])
    .filter((item) => (item.supportedGenerationMethods || []).includes('generateContent'))
    .map((item) => (item.name || '').replace(/^models\//, ''))
    .filter(Boolean);

  if (!available.length) return uniquePreferred;

  const prioritized = uniquePreferred.filter((name) => available.includes(name));
  const remaining = available.filter((name) => !prioritized.includes(name));
  return [...prioritized, ...remaining];
}

async function askOpenAI({ apiKey, model, prompt }) {
  const response = await fetchWithRateLimitRetry('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful enterprise assistant.' },
        { role: 'user', content: prompt }
      ]
    })
  }, 'OpenAI');

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(friendlyOpenAIError(response.status, payload));
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

async function askXAI({ apiKey, model, prompt }) {
  const response = await fetchWithRateLimitRetry('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful enterprise assistant.' },
        { role: 'user', content: prompt }
      ]
    })
  }, 'xAI');

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(friendlyXAIError(response.status, payload));
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}


async function fetchWithRateLimitRetry(url, options, providerName) {
  let attempt = 0;
  let lastResponse;

  while (attempt <= RETRY_DELAYS_MS.length) {
    const response = await fetch(url, options);
    if (response.status !== 429) {
      return response;
    }

    lastResponse = response;
    if (attempt >= RETRY_DELAYS_MS.length) {
      return response;
    }

    const delay = RETRY_DELAYS_MS[attempt];
    appendMessage('AI', `${providerName} rate limit detected. Retrying in ${Math.round(delay / 1000)}s...`);
    await sleep(delay);
    attempt += 1;
  }

  return lastResponse;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
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

  const keywords = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  const scored = lines.map((line) => {
    const lower = line.toLowerCase();
    const score = keywords.reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0);
    return { line, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map((item) => item.line).join('\n');
}

function appendMessage(sender, text, cssClass = 'ai') {
  if (sender === 'AI' && cssClass === 'ai') {
    const now = Date.now();
    if (text === lastSystemMessage && now - lastSystemMessageAt < SYSTEM_MESSAGE_COOLDOWN_MS) {
      return;
    }

    lastSystemMessage = text;
    lastSystemMessageAt = now;
  }

  const bubble = document.createElement('div');
  bubble.className = `message ${cssClass}`;
  bubble.textContent = `${sender}: ${text}`;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function isSupportedDriveMime(mimeType) {
  return mimeType === 'application/vnd.google-apps.document'
    || mimeType === 'application/vnd.google-apps.spreadsheet'
    || mimeType === 'text/plain'
    || mimeType === 'text/markdown'
    || mimeType === 'application/json'
    || mimeType === 'text/csv'
    || mimeType === 'application/pdf';
}

function friendlyMime(mimeType) {
  if (mimeType === 'application/vnd.google-apps.document') return 'Google Doc';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheet';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/json') return 'JSON';
  if (mimeType === 'text/csv') return 'CSV';
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

  return `${errorCode}. Verify OAuth client configuration and allowed origins in Google Cloud.`;
}

function friendlyGeminiError(status, payload) {
  const message = payload?.error?.message || '';
  if (status === 400 && /API key not valid/i.test(message)) {
    return 'Gemini API key is invalid. Use a valid key from Google AI Studio.';
  }
  if (status === 403) {
    return 'Gemini request was forbidden. Check API key restrictions and make sure Generative Language API is enabled.';
  }
  if (status === 404) {
    return 'No compatible Gemini model was available for generateContent with this API key/project.';
  }
  if (status === 429) {
    return 'Gemini rate limit reached after automatic retries. Please wait a bit, lower request frequency, or switch provider.';
  }
  return `Gemini request failed (${status}). ${message || 'Please verify setup and try again.'}`;
}

function friendlyOpenAIError(status, payload) {
  const message = payload?.error?.message || '';
  if (status === 401) return 'OpenAI API key is invalid or missing.';
  if (status === 429) return 'OpenAI rate limit reached after automatic retries. Please retry later or switch provider.';
  return `OpenAI request failed (${status}). ${message || 'Please verify API key/model.'}`;
}

function friendlyXAIError(status, payload) {
  const message = payload?.error?.message || '';
  if (status === 401) return 'xAI API key is invalid or missing.';
  if (status === 429) return 'xAI rate limit reached after automatic retries. Please retry later or switch provider.';
  return `xAI request failed (${status}). ${message || 'Please verify API key/model.'}`;
}
