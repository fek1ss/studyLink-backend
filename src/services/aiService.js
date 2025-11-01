require('dotenv').config();

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
		aiResponse = await gemini.sendPrompt(prompt, { temperature, maxOutputTokens: 1024 });
	} catch (err) {
		// bubble up with context
		const e = new Error('AI generation failed: ' + (err.message || err));
		e.cause = err;
		throw e;
	}

	// gemini.sendPrompt may return parsed JSON already or an object with a text field.
	let parsed = null;

	if (!aiResponse) {
		throw new Error('Empty response from AI');
	}

	// If response already looks like JSON object with questions, return it
	if (typeof aiResponse === 'object' && aiResponse.questions) {
		parsed = aiResponse;
	} else if (typeof aiResponse === 'object' && aiResponse.text) {
		// try to parse aiResponse.text
		try {
			parsed = JSON.parse(aiResponse.text);
		} catch (err) {
			// fallback: try to extract JSON substring
			const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				try {
					parsed = JSON.parse(jsonMatch[0]);
				} catch (e) {
					// cannot parse
				}
			}
		}
	} else if (typeof aiResponse === 'string') {
		try {
			parsed = JSON.parse(aiResponse);
		} catch (err) {
			const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				try {
					parsed = JSON.parse(jsonMatch[0]);
				} catch (e) {
					// ignore
				}
			}
		}
	}

	if (!parsed) {
		// As a last resort, return the raw AI response inside an object
		return { raw: aiResponse };
	}

	// Basic validation / normalization
	if (!Array.isArray(parsed.questions)) {
		throw new Error('AI response does not contain a questions array');
	}

	// Normalize fields for each question
	const questions = parsed.questions.slice(0, numQuestions).map((q) => {
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

