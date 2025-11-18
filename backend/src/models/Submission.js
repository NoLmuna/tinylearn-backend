/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Submission = sequelize.define('Submission', {
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
            }
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
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        attachments: {
            type: DataTypes.TEXT, // JSON array of file URLs
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('attachments');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('attachments', JSON.stringify(value));
            }
        },
        status: {
            type: DataTypes.ENUM('draft', 'submitted', 'graded', 'returned'),
            defaultValue: 'draft'
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        submittedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'submitted_at'
        },
        gradedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'graded_at'
        },
        gradedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'graded_by',
            references: {
                model: 'teachers',
                key: 'id'
            }
        },
        timeSpent: {
            type: DataTypes.INTEGER, // in minutes
            allowNull: true,
            field: 'time_spent',
            defaultValue: 0
        }
    }, {
        tableName: 'submissions',
        timestamps: true,
        indexes: [
            {
                fields: ['assignment_id']
            },
            {
                fields: ['student_id']
            },
            {
                fields: ['status']
            },
            {
                unique: true,
                fields: ['assignment_id', 'student_id']
            }
        ]
    });

    return Submission;
};
