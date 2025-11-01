
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { createPost, getFeed, getUserPosts } = require('../controllers/postController');

// Create a new post (authenticated)
router.post('/create', authMiddleware, createPost);

// Feed (all posts)
router.get('/feed', getFeed);

// Posts by user
router.get('/user/:userId', getUserPosts);

module.exports = router;
