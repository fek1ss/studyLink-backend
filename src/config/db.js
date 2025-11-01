// Sequelize MySQL connection using environment variables
// Expects DB_HOST, DB_USER, DB_PASS, DB_NAME to be provided in a .env file

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Environment variables
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'studylink';

if (!DB_NAME || !DB_USER) {
	console.warn('⚠️ Missing database environment variables (DB_NAME, DB_USER)');
}

// Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
	host: DB_HOST,
	dialect: 'mysql',
	logging: false,
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
	define: {
		timestamps: true,
	},
});

// Test connection
(async () => {
	try {
		await sequelize.authenticate();
		console.log(`✅ Database connection established successfully (${DB_HOST}).`);
	} catch (err) {
		console.error('❌ Unable to connect to the database:', err.message);
	}
})();

module.exports = sequelize;