
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

/**
 * Question model
 * Fields: id, quizId (FK to Quizzes), questionText, options (JSON), correctAnswer, type ('multiple-choice' | 'text')
 */
const Question = sequelize.define('Question', {
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
	questionText: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	options: {
		// for multiple-choice questions; stored as JSON array/object
		type: DataTypes.JSON,
		allowNull: true,
	},
	correctAnswer: {
		type: DataTypes.STRING(1024),
		allowNull: true,
	},
	type: {
		type: DataTypes.ENUM('multiple-choice', 'text'),
		allowNull: false,
		defaultValue: 'multiple-choice',
	},
}, {
	tableName: 'Questions',
	timestamps: true,
	updatedAt: 'updatedAt',
});

module.exports = Question;
