
const Post = require('../models/Post');

// createPost: create a post using userId from authenticated token (req.user.id)
async function createPost(req, res) {
	try {
		const userId = req.user && req.user.id;
		if (!userId) return res.status(401).json({ error: 'Authentication required' });

		const { content, hashtags = null, fileUrl = null } = req.body || {};
		if (!content || String(content).trim() === '') {
			return res.status(400).json({ error: 'Content is required' });
		}

		const post = await Post.create({
			userId,
			content,
			hashtags: Array.isArray(hashtags) ? hashtags.join(',') : hashtags,
			fileUrl,
			likes: 0,
		});

		return res.status(201).json({ post });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('createPost error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// getFeed: return all posts sorted by createdAt desc
async function getFeed(req, res) {
	try {
		const posts = await Post.findAll({ order: [['createdAt', 'DESC']] });
		return res.json({ posts });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('getFeed error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

// getUserPosts: return posts for a specific user (param or token)
async function getUserPosts(req, res) {
	try {
		const userId = req.params.userId || (req.user && req.user.id);
		if (!userId) return res.status(400).json({ error: 'userId is required' });

		const posts = await Post.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
		return res.json({ posts });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('getUserPosts error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = {
	createPost,
	getFeed,
	getUserPosts,
};
