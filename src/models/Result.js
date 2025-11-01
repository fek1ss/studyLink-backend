
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

/**
 * Result model
 * Fields: id, quizId (FK to Quizzes), userId (FK to Users), score, answers (JSON), createdAt
 */
const Result = sequelize.define('Result', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	quizId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Quizzes',
			key: 'id',
		},
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
	userId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Users',
			key: 'id',
		},
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
	score: {
		// store as decimal percentage or points
		type: DataTypes.DECIMAL(5, 2),
		allowNull: false,
		defaultValue: 0,
		validate: {
			min: 0,
		},
	},
	answers: {
		type: DataTypes.JSON,
		allowNull: true,
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
}, {
	tableName: 'Results',
	timestamps: true,
	updatedAt: 'updatedAt',
});

module.exports = Result;
