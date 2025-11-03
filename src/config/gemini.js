require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

if (!API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in .env');
}

async function sendPrompt(prompt, options = {}) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY missing in environment');

  const model = options.model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: String(prompt) }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API request failed: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = await res.json();

  // Извлекаем текст из ответа модели
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.output ||
    null;

  return text ? { text } : data;
}

module.exports = { sendPrompt };
