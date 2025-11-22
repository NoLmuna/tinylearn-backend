/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Assignment = sequelize.define('Assignment', {
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
            allowNull: false
        },
        instructions: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        lessonId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'lesson_id',
            references: {
                model: 'lessons',
                key: 'id'
            }
        },
        teacherId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'teacher_id',
            references: {
                model: 'teachers',
                key: 'id'
            }
        },
        assignedTo: {
            type: DataTypes.TEXT, // JSON array of student IDs
            allowNull: false,
            field: 'assigned_to',
            get() {
                const rawValue = this.getDataValue('assignedTo');
                if (!rawValue) return [];
                if (Array.isArray(rawValue)) return rawValue;
                if (typeof rawValue === 'string') {
                    try {
                        return JSON.parse(rawValue);
                    } catch (e) {
                        console.error('Failed to parse assignedTo:', rawValue);
                        return [];
                    }
                }
                return [];
            },
            set(value) {
                this.setDataValue('assignedTo', JSON.stringify(value));
            }
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'due_date'
        },
        maxPoints: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'max_points',
            defaultValue: 100,
            validate: {
                min: 1,
                max: 1000
            }
        },
        assignmentType: {
            type: DataTypes.ENUM('homework', 'quiz', 'project', 'reading', 'practice'),
            allowNull: false,
            field: 'assignment_type',
            defaultValue: 'homework'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
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
        }
    }, {
        tableName: 'assignments',
        timestamps: true,
        indexes: [
            {
                fields: ['teacher_id']
            },
            {
                fields: ['due_date']
            },
            {
                fields: ['assignment_type']
            }
        ]
    });

    return Assignment;
};
