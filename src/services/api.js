const getBaseUrl = () => {
  // In development, always use the proxy (relative path) to avoid CORS issues
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || '/api';
  }
  // If VITE_BACKEND_URL is explicitly set (e.g. in production), use it.
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (backendUrl && backendUrl.startsWith('http')) {
    // If it ends with /api, use it, otherwise add /api suffix
    return backendUrl.endsWith('/api') ? backendUrl : `${backendUrl.replace(/\/$/, '')}/api`;
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

export const apiBaseUrl = getBaseUrl();
const BASE = apiBaseUrl;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    let detail = res.statusText
    try {
      const err = JSON.parse(text)
      detail = err.detail || err.message || detail
    } catch {
      detail = text || detail
    }
    throw new Error(detail)
  }
  return res.json()
}

export const api = {
  /** Full multi-agent teaching session */
  teach: (topic, difficulty = 'beginner') =>
    post('/teach', { topic, difficulty }),

  /** Fast notes generation */
  notes: (topic, type = 'detailed', text = '') =>
    post('/notes', { topic, type, text }),

  /** Fast quiz generation */
  quiz: (topic, quizType = 'mcq', difficulty = 'beginner', count = 5) =>
    post('/quiz', { topic, quiz_type: quizType, difficulty, count }),

  /** AI-powered text extraction from PDF/Images */
  extractText: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${BASE}/extract_text`, {
      method: 'POST',
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Extraction failed')
      return res.json()
    })
  },

  /** Fast single-turn chat */
  chat: (message, history = []) =>
    post('/chat', { message, history }),
}
