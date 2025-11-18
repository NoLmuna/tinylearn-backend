/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Admin = sequelize.define('Admin', {
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
        isSuperAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_super_admin'
        },
        accountStatus: {
            type: DataTypes.ENUM('active', 'suspended'),
            defaultValue: 'active',
            field: 'account_status'
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_login'
        }
    }, {
        tableName: 'admins',
        timestamps: true
    });

    return Admin;
};

