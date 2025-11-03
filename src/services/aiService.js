require('dotenv').config();
const util = require('util');

// AI service: generate quizzes from extracted PDF text using Gemini (or fallback)
const gemini = require('../config/gemini');

/**
 * Generate a quiz from extracted text.
 * @param {string} extractedText - The text extracted from a PDF or other source.
 * @param {object} [options]
 * @param {'multiple-choice'|'text'} [options.type='multiple-choice'] - quiz question type
 * @param {number} [options.numQuestions=10]
 * @param {number} [options.temperature=0.2]
 * @returns {Promise<{title?:string, questions: Array}>} - { title, questions: [{questionText, options, correctAnswer, type}] }
 */
async function generateQuiz(extractedText, options = {}) {
	if (!extractedText || typeof extractedText !== 'string') {
		throw new Error('extractedText (string) is required');
	}

	const { type = 'multiple-choice', numQuestions = 10, temperature = 0.2 } = options;

	// Build a strict prompt asking the model to return JSON only.
	const prompt = `You are an assistant that creates quizzes from source text.\n` +
		`Input: the source text is provided below. Use it to create a quiz.\n` +
		`Requirements:\n` +
		`- Produce ONLY valid JSON (no explanatory text).\n` +
		`- Output an object with keys: "title" (string) and "questions" (array).\n` +
		`- Each question must be an object with: \n` +
		`  - "questionText": string,\n` +
		`  - "options": array of strings (for multiple-choice) or null,\n` +
		`  - "correctAnswer": string (exact answer or option text),\n` +
		`  - "type": either "multiple-choice" or "text".\n` +
		`- For multiple-choice questions include 3-5 plausible options.\n` +
		`- Create exactly ${numQuestions} questions of type ${type}.\n` +
		`- Keep questions closely tied to the provided source text (use facts, definitions, examples).\n` +
		`- Ensure the returned JSON parses without errors.\n\n` +
		`Source text:\n"""\n${extractedText}\n"""\n\n` +
		`Return the JSON object now.`;

	let aiResponse;
	try {
		// increase token limit slightly to allow larger JSON outputs
		aiResponse = await gemini.sendPrompt(prompt, { temperature, maxOutputTokens: 2048 });
	} catch (err) {
		// bubble up with context
		const e = new Error('AI generation failed: ' + (err.message || err));
		e.cause = err;
		throw e;
	}

	// gemini.sendPrompt may return parsed JSON already or an object with a text field.
	let parsed = null;

	if (!aiResponse) {
		console.error('Empty response from AI');
		return { title: `Generated Quiz`, questions: [] };
	}

	// If DEBUG_AI env var is set, dump raw response for troubleshooting
	if (process.env.DEBUG_AI === '1' || process.env.DEBUG_AI === 'true') {
		try {
			console.error('DEBUG_AI raw aiResponse:', util.inspect(aiResponse, { depth: 5, maxArrayLength: 200 }));
		} catch (e) {
			console.error('DEBUG_AI failed to inspect aiResponse', e);
		}
	}

	// Helper: robustly extract JSON from text (handles ```json fenced blocks and stray markdown)
	function extractJsonString(text) {
		if (!text || typeof text !== 'string') return null;
		// 1) Try to capture fenced code block labeled json: ```json ... ```
		const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
		if (fenceMatch && fenceMatch[1]) {
			return fenceMatch[1].trim();
		}
		// 2) Remove common markdown wrappers like leading/trailing ``` or ```json markers
		let cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
		// 3) Remove any markdown headings or lines that just say "json" or "response"
		cleaned = cleaned.replace(/^\s*(json|response|result)\s*[:\-]*\s*\n/i, '').trim();
		// 4) Attempt to extract the first JSON object substring
		const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
		if (jsonMatch) return jsonMatch[0].trim();
		// 5) As a fallback, return the cleaned text
		return cleaned;
	}

	// If response already looks like JSON object with questions, use it
	if (typeof aiResponse === 'object' && aiResponse.questions) {
		parsed = aiResponse;
	} else {
		// Determine raw text to parse
		let text = null;
		if (typeof aiResponse === 'string') text = aiResponse;
		else if (typeof aiResponse === 'object' && aiResponse.text) text = aiResponse.text;
		else if (typeof aiResponse === 'object') {
			// Attempt to extract textual content from common response shapes (e.g., Gemini candidates)
			if (Array.isArray(aiResponse.candidates) && aiResponse.candidates.length > 0) {
				text = aiResponse.candidates.map((c) => {
					if (!c) return '';
					if (typeof c === 'string') return c;
					if (c.output) return String(c.output);
					if (c.content) {
						if (Array.isArray(c.content)) return c.content.map(x => x.text || x).join('\n');
						return String(c.content);
					}
					return '';
				}).join('\n');
			}
		}

		if (text) {
			const candidate = extractJsonString(text);
			if (candidate) {
				try {
					parsed = JSON.parse(candidate);
				} catch (err) {
					// Try a secondary extraction attempt: find inner JSON substring
					const inner = (candidate.match(/\{[\s\S]*\}/) || [])[0];
					if (inner) {
						try { parsed = JSON.parse(inner); } catch (e) {
							console.error('Failed to parse inner JSON from AI response:', e && e.message ? e.message : e);
						}
					} else {
						console.error('Failed to parse JSON from AI response (no JSON object found after cleaning).');
					}
					// Do not throw; we'll handle missing parsed below
				}
			} else {
				console.error('No JSON-like content found in AI response text');
			}
		} else {
			console.error('AI response has no text to parse');
		}
	}

	// Basic validation / normalization
	if (!parsed) {
		console.error('AI response could not be parsed as JSON; returning empty questions array');
		parsed = {};
	}

	if (!Array.isArray(parsed.questions)) {
		console.warn('AI response does not contain a questions array; defaulting to empty array');
	}

	const questionsSource = Array.isArray(parsed.questions) ? parsed.questions : [];

	// Normalize fields for each question
	const questions = questionsSource.slice(0, numQuestions).map((q) => {
		const questionText = q.questionText || q.question || q.prompt || '';
		const qtype = q.type || type;
		let options = null;
		if (qtype === 'multiple-choice') {
			if (Array.isArray(q.options)) options = q.options.map(String);
			else if (typeof q.options === 'string') {
				try { options = JSON.parse(q.options); } catch (_) { options = q.options.split('|').map(s => s.trim()); }
			}
		}
		const correctAnswer = q.correctAnswer || q.answer || null;
		return { questionText, options, correctAnswer, type: qtype };
	});

	return { title: parsed.title || `Generated Quiz`, questions };
}

module.exports = { generateQuiz };

