/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AssignmentAnswer = sequelize.define('AssignmentAnswer', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        assignmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'assignment_id',
            references: {
                model: 'assignments',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'student_id',
            references: {
                model: 'students',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        answers: {
            type: DataTypes.TEXT('long'), // Long text for JSON or large text content
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('answers');
                if (!rawValue) return null;
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    return rawValue; // Return as string if not valid JSON
                }
            },
            set(value) {
                if (typeof value === 'object' && value !== null) {
                    this.setDataValue('answers', JSON.stringify(value));
                } else {
                    this.setDataValue('answers', value);
                }
            }
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: true,
            validate: {
                min: 0
            }
        }
    }, {
        tableName: 'assignment_answers',
        timestamps: true,
        indexes: [
            {
                fields: ['assignment_id']
            },
            {
                fields: ['student_id']
            },
            {
                unique: true,
                fields: ['assignment_id', 'student_id']
            }
        ]
    });

    return AssignmentAnswer;
};

