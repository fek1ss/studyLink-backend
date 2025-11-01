
// Google Gemini / Generative API client helper
// Exports: sendPrompt(prompt, options)
// Uses GEMINI_API_KEY from .env

require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.0';

if (!API_KEY) {
	// warn early; function will also throw if called without key
	// eslint-disable-next-line no-console
	console.warn('GEMINI_API_KEY is not set in environment; Gemini requests will fail until it is provided.');
}

/**
 * Send a prompt to Google Generative API (Gemini) using an API key.
 * NOTE: Google may require slightly different request shape depending on model/version.
 * This helper sends a basic JSON payload and returns parsed JSON response.
 *
 * @param {string} prompt - The text prompt to send.
 * @param {object} [options]
 * @param {string} [options.model] - Model name (e.g. 'gemini-1.0'). Defaults to env GEMINI_MODEL or 'gemini-1.0'.
 * @param {number} [options.temperature]
 * @param {number} [options.maxOutputTokens]
 * @returns {Promise<object>} Parsed JSON response from the API
 */
async function sendPrompt(prompt, options = {}) {
	if (!API_KEY) {
		throw new Error('GEMINI_API_KEY is not set in environment. Set it in .env as GEMINI_API_KEY=your_key');
	}

	const model = options.model || DEFAULT_MODEL;

	// Endpoint pattern for Google Generative API (text generation). Adjust version/model as needed.
	const url = `https://generativeai.googleapis.com/v1/models/${encodeURIComponent(model)}:generateText?key=${encodeURIComponent(API_KEY)}`;

	// Basic request body — this is a common/simple shape. Adjust to match the exact model API contract.
	const body = {
		prompt: { text: String(prompt) },
		temperature: typeof options.temperature === 'number' ? options.temperature : 0.2,
		maxOutputTokens: typeof options.maxOutputTokens === 'number' ? options.maxOutputTokens : 512,
	};

	// Use global fetch if present (Node 18+). Otherwise dynamically import node-fetch.
	let fetchFn;
	if (typeof fetch !== 'undefined') {
		fetchFn = fetch;
	} else {
		// dynamic import only when needed
		// eslint-disable-next-line node/no-unsupported-features/es-syntax
		const nf = await import('node-fetch').then(m => m.default || m);
		fetchFn = nf;
	}

	const res = await fetchFn(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const text = await res.text();
		const err = new Error(`Gemini API request failed: ${res.status} ${res.statusText}`);
		// attach response body for easier debugging
		err.responseText = text;
		throw err;
	}

	return res.json();
}

module.exports = { sendPrompt };
