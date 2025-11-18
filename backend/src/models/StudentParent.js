/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StudentParent = sequelize.define('StudentParent', {
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
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'parent_id',
            references: {
                model: 'parents',
                key: 'id'
            }
        },
        relationship: {
            type: DataTypes.ENUM('mother', 'father', 'guardian', 'grandmother', 'grandfather', 'other'),
            defaultValue: 'guardian'
        },
        isPrimary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_primary'
        },
        canReceiveMessages: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'can_receive_messages'
        },
        canViewProgress: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'can_view_progress'
        }
    }, {
        tableName: 'student_parents',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['student_id', 'parent_id']
            },
            {
                fields: ['student_id']
            },
            {
                fields: ['parent_id']
            }
        ]
    });

    return StudentParent;
};
