
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

/**
 * User model
 * Fields: id, firstName, lastName, email (unique), passwordHash, course, gpa, major, university, createdAt
 */
const User = sequelize.define('User', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	firstName: {
		type: DataTypes.STRING(100),
		allowNull: true,
	},
	lastName: {
		type: DataTypes.STRING(100),
		allowNull: true,
	},
	email: {
		type: DataTypes.STRING(255),
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true,
		},
	},
	passwordHash: {
		type: DataTypes.STRING(512),
		allowNull: false,
	},
	course: {
		type: DataTypes.STRING(255),
		allowNull: true,
	},
	gpa: {
		type: DataTypes.DECIMAL(3, 2),
		allowNull: true,
		validate: {
			min: 0,
			max: 4.0,
		},
	},
	major: {
		type: DataTypes.STRING(255),
		allowNull: true,
	},
	university: {
		type: DataTypes.STRING(255),
		allowNull: true,
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
}, {
	tableName: 'Users',
	timestamps: true,
	updatedAt: 'updatedAt',
});

module.exports = User;
