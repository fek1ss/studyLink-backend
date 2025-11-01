
const sequelize = require('../config/db');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');

// Prefer aiService if provided; fall back to gemini client
let aiService;
try {
	aiService = require('../services/aiService');
} catch (e) {
	aiService = null;
}
let gemini;
try {
	gemini = require('../config/gemini');
} catch (e) {
	gemini = null;
}

// Helper to call AI: expects to return an object { title?, questions: [ { questionText, options, correctAnswer, type } ] }
async function callAiToGenerate(prompt, opts = {}) {
	// If aiService has generateQuiz, prefer it
	if (aiService && typeof aiService.generateQuiz === 'function') {
		return aiService.generateQuiz(prompt, opts);
	}

	// If aiService has sendPrompt or gemini is available, use that
	const textPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
	if (aiService && typeof aiService.sendPrompt === 'function') {
		return aiService.sendPrompt(textPrompt, opts);
	}

	if (gemini && typeof gemini.sendPrompt === 'function') {
		const resp = await gemini.sendPrompt(textPrompt, opts);
		// try to interpret response body
		if (resp && resp.candidates) {
			// Google generative API may return candidates with output text
			const out = resp.candidates.map(c => c.content?.[0]?.text || c.output || '').join('\n');
			// attempt to parse JSON in output
			try {
				return JSON.parse(out);
			} catch (err) {
				// return raw text as a fallback
				return { text: out };
			}
		}
		return resp;
	}

	throw new Error('No AI service available to generate quiz');
}

// generateQuiz: create a quiz using AI-generated questions and save to DB
async function generateQuiz(req, res) {
	const t = await sequelize.transaction();
	try {
		const { title, type = 'multiple-choice', prompt } = req.body || {};
		// createdBy may come from authenticated user or body
		const createdBy = (req.user && req.user.id) || req.body.createdBy;

		if (!createdBy) {
			await t.rollback();
			return res.status(400).json({ error: 'createdBy (user id) is required' });
		}

		if (!prompt) {
			await t.rollback();
			return res.status(400).json({ error: 'prompt is required to generate a quiz' });
		}

		// Call AI
		const aiResult = await callAiToGenerate(prompt, { model: undefined, temperature: 0.2, maxOutputTokens: 800 });

		// Expect aiResult.questions or try to extract
		let questions = aiResult && aiResult.questions;
		let quizTitle = title || aiResult && aiResult.title;
		if (!questions && aiResult && typeof aiResult === 'object' && aiResult.text) {
			// try to parse text for JSON
			try {
				const parsed = JSON.parse(aiResult.text);
				questions = parsed.questions || parsed.items || parsed.questions_list;
				quizTitle = quizTitle || parsed.title;
			} catch (err) {
				// fallback: cannot parse
			}
		}

		if (!questions || !Array.isArray(questions) || questions.length === 0) {
			await t.rollback();
			return res.status(502).json({ error: 'AI did not return valid questions' });
		}

		// Create quiz
		const quiz = await Quiz.create({ title: quizTitle || 'Generated Quiz', type, createdBy, isPublished: false }, { transaction: t });

		// Insert questions
		const createdQuestions = [];
		for (const q of questions) {
			const { questionText, options = null, correctAnswer = null, type: qtype = type } = q;
			const createdQ = await Question.create({ quizId: quiz.id, questionText, options, correctAnswer, type: qtype }, { transaction: t });
			createdQuestions.push(createdQ);
		}

		await t.commit();

		return res.status(201).json({ quiz, questions: createdQuestions });
	} catch (err) {
		await t.rollback();
		// eslint-disable-next-line no-console
		console.error('generateQuiz error', err);
		return res.status(500).json({ error: 'Failed to generate quiz' });
	}
}

// getUserQuizzes: list quizzes created by a user
async function getUserQuizzes(req, res) {
	try {
		const userId = req.params.userId || (req.user && req.user.id);
		if (!userId) return res.status(400).json({ error: 'userId is required' });

		const quizzes = await Quiz.findAll({ where: { createdBy: userId }, order: [['createdAt', 'DESC']] });
		return res.json({ quizzes });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('getUserQuizzes error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// getQuizById: return quiz with its questions
async function getQuizById(req, res) {
	try {
		const quizId = req.params.quizId;
		if (!quizId) return res.status(400).json({ error: 'quizId is required' });

		const quiz = await Quiz.findByPk(quizId);
		if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

		const questions = await Question.findAll({ where: { quizId }, order: [['id', 'ASC']] });
		return res.json({ quiz, questions });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('getQuizById error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// publishQuiz: mark isPublished = true (only owner can publish)
async function publishQuiz(req, res) {
	try {
		const quizId = req.params.quizId;
		const userId = (req.user && req.user.id) || req.body.userId;
		if (!quizId) return res.status(400).json({ error: 'quizId is required' });
		if (!userId) return res.status(400).json({ error: 'userId is required' });

		const quiz = await Quiz.findByPk(quizId);
		if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
		if (parseInt(quiz.createdBy, 10) !== parseInt(userId, 10)) {
			return res.status(403).json({ error: 'Not authorized to publish this quiz' });
		}

		quiz.isPublished = true;
		await quiz.save();
		return res.json({ quiz });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('publishQuiz error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// submitResults: save user's answers, compute score if possible
async function submitResults(req, res) {
	try {
		const { quizId } = req.params || {};
		const userId = (req.user && req.user.id) || req.body.userId;
		const answers = req.body.answers; // expected: [{ questionId, answer }]

		if (!quizId || !userId || !Array.isArray(answers)) {
			return res.status(400).json({ error: 'quizId, userId and answers array are required' });
		}

		const questions = await Question.findAll({ where: { quizId } });
		const questionMap = {};
		for (const q of questions) questionMap[q.id] = q;

		let correctCount = 0;
		let totalCount = 0;
		const normalizedAnswers = [];

		for (const a of answers) {
			const q = questionMap[a.questionId];
			if (!q) continue;
			totalCount += 1;
			const userAns = a.answer;
			const correct = q.correctAnswer;
			let isCorrect = false;
			if (q.type === 'multiple-choice') {
				// strict equality check
				isCorrect = String(userAns).trim() === String(correct).trim();
			} else {
				// for text, do a simple case-insensitive comparison; could be improved
				if (typeof userAns === 'string' && typeof correct === 'string') {
					isCorrect = userAns.trim().toLowerCase() === correct.trim().toLowerCase();
				}
			}
			if (isCorrect) correctCount += 1;
			normalizedAnswers.push({ questionId: a.questionId, answer: userAns, isCorrect });
		}

		const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

		const result = await Result.create({ quizId, userId, score, answers: normalizedAnswers });

		return res.status(201).json({ result });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('submitResults error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = {
	generateQuiz,
	getUserQuizzes,
	getQuizById,
	publishQuiz,
	submitResults,
};
