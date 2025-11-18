/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Student = sequelize.define('Student', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'first_name',
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'last_name',
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 18
            }
        },
        grade: {
            type: DataTypes.STRING,
            allowNull: true
        },
        accountStatus: {
            type: DataTypes.ENUM('active', 'suspended'),
            defaultValue: 'active',
            field: 'account_status'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_login'
        }
    }, {
        tableName: 'students',
        timestamps: true,
        indexes: [
            { fields: ['grade'] },
            { fields: ['account_status'] }
        ]
    });

    return Student;
};

