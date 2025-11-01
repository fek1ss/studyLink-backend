
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

async function registerUser(req, res) {
	try {
		const { firstName, lastName, email, password, course, gpa, major, university } = req.body || {};

		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		// check existing
		const existing = await User.findOne({ where: { email } });
		if (existing) {
			return res.status(409).json({ error: 'User with this email already exists' });
		}

		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

		const user = await User.create({
			firstName,
			lastName,
			email,
			passwordHash,
			course,
			gpa,
			major,
			university,
		});

		// don't return sensitive fields
		const safeUser = {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			course: user.course,
			gpa: user.gpa,
			major: user.major,
			university: user.university,
			createdAt: user.createdAt,
		};

		return res.status(201).json({ user: safeUser });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('registerUser error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function loginUser(req, res) {
	try {
		const { email, password } = req.body || {};
		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		const user = await User.findOne({ where: { email } });
		if (!user) {
			// avoid revealing which part failed
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const match = await bcrypt.compare(password, user.passwordHash);
		if (!match) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const payload = { id: user.id, email: user.email };
		const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

		const safeUser = {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
		};

		return res.json({ token, user: safeUser });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('loginUser error', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

module.exports = {
	registerUser,
	loginUser,
};
