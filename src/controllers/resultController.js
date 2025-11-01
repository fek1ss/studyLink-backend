
const Result = require('../models/Result');
const Quiz = require('../models/Quiz');

// saveResult: store a user's result for a quiz
async function saveResult(req, res) {
	try {
		const quizId = req.params.quizId || req.body.quizId;
		const userId = (req.user && req.user.id) || req.body.userId;
		const { score, answers } = req.body || {};

		if (!quizId || !userId) return res.status(400).json({ error: 'quizId and userId are required' });
		if (typeof score === 'undefined' || !Array.isArray(answers)) {
			return res.status(400).json({ error: 'score and answers array are required' });
		}

		const result = await Result.create({ quizId, userId, score, answers });

		return res.status(201).json({ result });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('saveResult error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// getUserResults: return results for a user, optionally including quiz metadata
async function getUserResults(req, res) {
	try {
		const userId = req.params.userId || (req.user && req.user.id);
		if (!userId) return res.status(400).json({ error: 'userId is required' });

		const results = await Result.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });

		// Attach quiz title (lightweight) using Quiz model
		const enriched = [];
		for (const r of results) {
			let quiz = null;
			try {
				quiz = await Quiz.findByPk(r.quizId, { attributes: ['id', 'title', 'isPublished', 'createdBy'] });
			} catch (e) {
				// ignore per-item fetch errors
			}
			enriched.push({ result: r, quiz });
		}

		return res.json({ results: enriched });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('getUserResults error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = {
	saveResult,
	getUserResults,
};
