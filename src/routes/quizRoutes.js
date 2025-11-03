
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const {
	generateQuiz,
	getUserQuizzes,
	getQuizById,
	publishQuiz,
	submitResults,
	testGenerateQuiz,
} = require('../controllers/quizController');

// If upload middleware exposes a `single` handler (e.g. multer), use it; otherwise no-op
const uploadHandler = (uploadMiddleware && typeof uploadMiddleware.single === 'function')
	? uploadMiddleware.single('file')
	: (req, res, next) => next();

router.post('/generate/test', uploadHandler, testGenerateQuiz);

router.post('/generate', authMiddleware, uploadHandler, generateQuiz);
router.get('/user/:userId', authMiddleware, getUserQuizzes);
router.get('/:quizId', authMiddleware, getQuizById);
router.post('/publish/:quizId', authMiddleware, publishQuiz);
router.post('/submit/:quizId', authMiddleware, submitResults);



module.exports = router;
