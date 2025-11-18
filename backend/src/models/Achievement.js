/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Achievement = sequelize.define('Achievement', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'student_id',
            references: {
                model: 'students',
                key: 'id'
            }
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
            allowNull: false
        },
        badgeIcon: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'badge_icon'
        },
        badgeColor: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'badge_color',
            defaultValue: '#3B82F6'
        },
        achievementType: {
            type: DataTypes.ENUM('completion', 'streak', 'score', 'participation', 'improvement', 'special'),
            allowNull: false,
            field: 'achievement_type'
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true // e.g., 'math', 'reading', 'general'
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10,
            validate: {
                min: 1,
                max: 1000
            }
        },
        earnedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'earned_at',
            defaultValue: DataTypes.NOW
        },
        relatedLessonId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'related_lesson_id',
            references: {
                model: 'lessons',
                key: 'id'
            }
        },
        relatedAssignmentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'related_assignment_id',
            references: {
                model: 'assignments',
                key: 'id'
            }
        }
    }, {
        tableName: 'achievements',
        timestamps: true,
        indexes: [
            {
                fields: ['student_id']
            },
            {
                fields: ['achievement_type']
            },
            {
                fields: ['category']
            },
            {
                fields: ['earned_at']
            }
        ]
    });

    return Achievement;
};
