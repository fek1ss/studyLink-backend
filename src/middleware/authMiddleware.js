
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * Express middleware to verify JWT from Authorization header.
 * If valid: attaches { id } to req.user and calls next()
 * If invalid or missing: responds with 401
 */
function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization || req.headers.Authorization;
	if (!authHeader) {
		return res.status(401).json({ error: 'Authorization header missing' });
	}

	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
		return res.status(401).json({ error: 'Invalid authorization format' });
	}

	const token = parts[1];
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		// Attach minimal user info. Prefer decoded.id but fall back to common claims
		const userId = decoded && (decoded.id || decoded.userId || decoded.sub || (decoded.user && decoded.user.id));
		if (!userId) {
			// still attach full decoded payload for callers that need it
			req.user = decoded;
		} else {
			req.user = { id: userId };
		}
		return next();
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('authMiddleware token verify error', err && err.message ? err.message : err);
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
}

module.exports = authMiddleware;
