const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { saveResult, getUserResults } = require('../controllers/resultController');

// Save a result (authenticated)
router.post('/save', authMiddleware, saveResult);

// Get results for a user (authenticated)
router.get('/user/:userId', authMiddleware, getUserResults);

module.exports = router;
