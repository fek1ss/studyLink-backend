
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

/**
 * Quiz model
 * Fields: id, title, type ('multiple-choice' | 'text'), fileUrl, createdBy (FK to Users), isPublished, createdAt
 */
const Quiz = sequelize.define('Quiz', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	title: {
		type: DataTypes.STRING(255),
		allowNull: false,
	},
	type: {
		type: DataTypes.ENUM('multiple-choice', 'text'),
		allowNull: false,
		defaultValue: 'multiple-choice',
	},
	fileUrl: {
		type: DataTypes.STRING(2048),
		allowNull: true,
	},
	createdBy: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: 'Users',
			key: 'id',
		},
		onDelete: 'CASCADE',
		onUpdate: 'CASCADE',
	},
	isPublished: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
}, {
	tableName: 'Quizzes',
	timestamps: true,
	updatedAt: 'updatedAt',
});

module.exports = Quiz;
