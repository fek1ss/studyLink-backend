
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

/**
 * Post model
 * Fields: id, userId (FK to Users), content (TEXT), hashtags (STRING), likes (INTEGER), createdAt
 */
const Post = sequelize.define('Post', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
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
	content: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	hashtags: {
		type: DataTypes.STRING(1024),
		allowNull: true,
	},
	likes: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
}, {
	tableName: 'Posts',
	timestamps: true,
	updatedAt: 'updatedAt',
});

module.exports = Post;
