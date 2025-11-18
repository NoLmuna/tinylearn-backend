/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TeacherStudent = sequelize.define('TeacherStudent', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'student_id',
            references: {
                model: 'students',
                key: 'id'
            }
        }
    }, {
        tableName: 'teacher_students',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['teacher_id', 'student_id']
            },
            {
                fields: ['teacher_id']
            },
            {
                fields: ['student_id']
            }
        ]
    });

    return TeacherStudent;
};

