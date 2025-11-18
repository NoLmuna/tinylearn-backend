/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Parent } = require('../models/database');
const send = require('../utils/response');

const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

const ParentController = {
    registerParent: async (req, res) => {
        try {
            const { firstName, lastName, email, password, phoneNumber, relationship } = req.body;

            if (!firstName || !lastName || !email || !password) {
                return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
            }

            const existingParent = await Parent.findOne({ where: { email } });
            if (existingParent) {
                return send.sendResponseMessage(res, 409, null, 'Parent with this email already exists');
            }

            const hashedPassword = await argon2.hash(password);
            const parent = await Parent.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phoneNumber,
                relationship,
                accountStatus: 'active'
            });

            const response = {
                id: parent.id,
                firstName: parent.firstName,
                lastName: parent.lastName,
                email: parent.email,
                phoneNumber: parent.phoneNumber,
                role: 'parent'
            };

            return send.sendResponseMessage(res, 201, response, 'Parent registered successfully');
        } catch (error) {
            console.error('Register parent error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    loginParent: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return send.sendResponseMessage(res, 400, null, 'Email and password are required');
            }

            const parent = await Parent.findOne({ where: { email } });
            if (!parent) {
                return send.sendResponseMessage(res, 404, null, 'Parent not found');
            }

            if (parent.accountStatus === 'suspended') {
                return send.sendResponseMessage(res, 403, null, 'Account is suspended');
            }

            const validPassword = await argon2.verify(parent.password, password);
            if (!validPassword) {
                return send.sendResponseMessage(res, 401, null, 'Invalid credentials');
            }

            await parent.update({ lastLogin: new Date() });

            const token = jwt.sign(
                {
                    userId: parent.id,
                    role: 'parent',
                    email: parent.email
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            const response = {
                id: parent.id,
                firstName: parent.firstName,
                lastName: parent.lastName,
                email: parent.email,
                phoneNumber: parent.phoneNumber
            };

            return send.sendResponseMessage(res, 200, { user: response, token }, 'Parent login successful');
        } catch (error) {
            console.error('Parent login error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getParents: async (req, res) => {
        try {
            const parents = await Parent.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });

            return send.sendResponseMessage(res, 200, parents, 'Parents retrieved successfully');
        } catch (error) {
            console.error('Get parents error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    updateParent: async (req, res) => {
        try {
            const { parentId } = req.params;
            const { firstName, lastName, phoneNumber, relationship, accountStatus, isActive } = req.body;

            if (req.user.role !== 'admin' && (req.user.userId || req.user.id) !== parseInt(parentId, 10)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const parent = await Parent.findByPk(parentId);
            if (!parent) {
                return send.sendResponseMessage(res, 404, null, 'Parent not found');
            }

            await parent.update({
                firstName: firstName ?? parent.firstName,
                lastName: lastName ?? parent.lastName,
                phoneNumber: phoneNumber ?? parent.phoneNumber,
                relationship: relationship ?? parent.relationship,
                accountStatus: accountStatus ?? parent.accountStatus,
                isActive: isActive !== undefined ? isActive : parent.isActive
            });

            return send.sendResponseMessage(res, 200, parent, 'Parent updated successfully');
        } catch (error) {
            console.error('Update parent error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    deleteParent: async (req, res) => {
        try {
            const { parentId } = req.params;

            const parent = await Parent.findByPk(parentId);
            if (!parent) {
                return send.sendResponseMessage(res, 404, null, 'Parent not found');
            }

            await parent.destroy();
            return send.sendResponseMessage(res, 200, null, 'Parent deleted successfully');
        } catch (error) {
            console.error('Delete parent error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getParentById: async (req, res) => {
        try {
            const { parentId } = req.params;
            const parent = await Parent.findByPk(parentId, {
                attributes: { exclude: ['password'] }
            });

            if (!parent) {
                return send.sendResponseMessage(res, 404, null, 'Parent not found');
            }

            return send.sendResponseMessage(res, 200, parent, 'Parent retrieved successfully');
        } catch (error) {
            console.error('Get parent by ID error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getProfile: async (req, res) => {
        try {
            const parent = await Parent.findByPk(req.user.userId, {
                attributes: { exclude: ['password'] }
            });

            if (!parent) {
                return send.sendResponseMessage(res, 404, null, 'Parent not found');
            }

            const profile = parent.toJSON ? parent.toJSON() : parent;
            profile.role = 'parent';

            return send.sendResponseMessage(res, 200, profile, 'Parent profile retrieved successfully');
        } catch (error) {
            console.error('Get parent profile error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }
};

module.exports = ParentController;
