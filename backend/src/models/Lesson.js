/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Lesson = sequelize.define('Lesson', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        category: {
            type: DataTypes.ENUM('math', 'reading', 'science', 'art', 'music', 'physical', 'social'),
            allowNull: false
        },
        difficulty: {
            type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
            defaultValue: 'beginner'
        },
        ageGroup: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'age_group',
            validate: {
                notEmpty: true
            }
        },
        duration: {
            type: DataTypes.INTEGER, // in minutes
            allowNull: true,
            validate: {
                min: 1,
                max: 300
            }
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'image_url'
        },
        videoUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'video_url'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        teacherId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'teacher_id',
            references: {
                model: 'teachers',
                key: 'id'
            }
        }
    }, {
        tableName: 'lessons',
        timestamps: true,
        indexes: [
            {
                fields: ['category']
            },
            {
                fields: ['difficulty']
            },
            {
                fields: ['age_group']
            }
        ]
    });

    return Lesson;
};
