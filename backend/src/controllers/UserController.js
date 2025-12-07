/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Student, Parent, StudentParent } = require('../models');
const send = require('../utils/response');

const UserController = {
    // Register a new user
    registerUser: async (req, res) => {
        try {
            const { firstName, lastName, email, password, role, age, grade, parentEmail } = req.body;

            if (!firstName || !lastName || !email || !password) {
                return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
            }

            if (!['parent', 'teacher'].includes(role)) {
                return send.sendResponseMessage(res, 400, null, 'Only parent and teacher registrations are allowed');
            }

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return send.sendResponseMessage(res, 409, null, 'User with this email already exists');
            }

            const hashedPassword = await argon2.hash(password);
            
            let accountStatus = 'approved';
            if (role === 'teacher') {
                accountStatus = 'pending';
            }

            const newUser = await User.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                age: age || null,
                grade: grade || null,
                parentEmail: parentEmail || null,
                accountStatus,
                isActive: true
            });

            const userResponse = {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role,
                accountStatus: newUser.accountStatus,
                createdAt: newUser.createdAt
            };

            const message = role === 'teacher' 
                ? 'Teacher account created successfully. Please wait for admin approval.' 
                : 'Parent account created successfully.';

            return send.sendResponseMessage(res, 201, userResponse, message);
        } catch (error) {
            console.error('Registration error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Login user
    userLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log(email, password);

            if (!email || !password) {
                return send.sendResponseMessage(res, 400, null, 'Email and password are required');
            }

            const existingUser = await User.findOne({ where: { email } });
            if (!existingUser) {
                return send.sendResponseMessage(res, 404, null, 'User not found');
            }

            if (!existingUser.isActive) {
                return send.sendResponseMessage(res, 401, null, 'Account is deactivated. Please contact support.');
            }

            if (existingUser.accountStatus === 'pending') {
                return send.sendResponseMessage(res, 401, null, 'Account is pending approval. Please wait for admin approval.');
            }

            if (existingUser.accountStatus === 'suspended') {
                return send.sendResponseMessage(res, 401, null, 'Account is suspended. Please contact support.');
            }

            const verifyPassword = await argon2.verify(existingUser.password, password);
            if (!verifyPassword) {
                return send.sendResponseMessage(res, 401, null, 'Invalid credentials');
            }

            const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

            const token = jwt.sign(
                { 
                    userId: existingUser.id, 
                    email: existingUser.email, 
                    role: existingUser.role 
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            const userResponse = {
                id: existingUser.id,
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
                role: existingUser.role,
                accountStatus: existingUser.accountStatus,
                token
            };

            return send.sendResponseMessage(res, 200, userResponse, 'Login successful');
        } catch (error) {
            console.error('Login error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findByPk(req.user.userId, {
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                return send.sendResponseMessage(res, 404, null, 'User not found');
            }

            return send.sendResponseMessage(res, 200, user, 'Profile retrieved successfully');
        } catch (error) {
            console.error('Get profile error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get users by role with proper permissions
    getUsersByRole: async (req, res) => {
        try {
            const { role } = req.query;
            let users;

            if (req.user.role === 'admin') {
                // Admin can access all users
                const whereClause = role ? { role } : {};
                users = await User.findAll({
                    where: whereClause,
                    attributes: { exclude: ['password'] },
                    order: [['createdAt', 'DESC']]
                });
            } else if (req.user.role === 'teacher') {
                // Teacher can only access students
                users = await User.findAll({
                    where: { role: 'student' },
                    attributes: { exclude: ['password'] },
                    order: [['createdAt', 'DESC']]
                });
            } else if (req.user.role === 'parent' && role === 'teacher') {
                // Parent can access teachers for messaging
                users = await User.findAll({
                    where: { 
                        role: 'teacher',
                        accountStatus: 'approved',
                        isActive: true
                    },
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    order: [['firstName', 'ASC'], ['lastName', 'ASC']]
                });
            } else {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Insufficient permissions.');
            }

            return send.sendResponseMessage(res, 200, users, 'Users retrieved successfully');
        } catch (error) {
            console.error('Get users by role error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get parent children
    getParentChildren: async (req, res) => {
        try {
            if (req.user.role !== 'parent') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Parent role required.');
            }

            const parentId = req.user.userId;
            const relations = await StudentParent.findAll({
                where: { parentId },
                include: [
                    {
                        model: User,
                        as: 'student',
                        attributes: ['id', 'firstName', 'lastName', 'email', 'grade']
                    }
                ]
            });

            const children = relations.map(relation => relation.student);

            return send.sendResponseMessage(res, 200, children, 'Children retrieved successfully');
        } catch (error) {
            console.error('Get parent children error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get teachers for parent messaging
    getTeachersForParent: async (req, res) => {
        try {
            if (req.user.role !== 'parent') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Parent role required.');
            }

            const teachers = await User.findAll({
                where: { 
                    role: 'teacher',
                    accountStatus: 'approved',
                    isActive: true
                },
                attributes: ['id', 'firstName', 'lastName', 'email'],
                order: [['firstName', 'ASC'], ['lastName', 'ASC']]
            });

            return send.sendResponseMessage(res, 200, teachers, 'Teachers retrieved successfully');
        } catch (error) {
            console.error('Get teachers for parent error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get parents for teacher
    getParentsForTeacher: async (req, res) => {
        try {
            if (req.user.role !== 'teacher') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Teacher role required.');
            }

            const parents = await User.findAll({
                where: { 
                    role: 'parent',
                    isActive: true
                },
                attributes: ['id', 'firstName', 'lastName', 'email'],
                order: [['firstName', 'ASC'], ['lastName', 'ASC']]
            });

            return send.sendResponseMessage(res, 200, parents, 'Parents retrieved successfully');
        } catch (error) {
            console.error('Get parents for teacher error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get all users (admin only)
    getAllUsers: async (req, res) => {
        try {
            if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Admin or Teacher role required.');
            }

            let users;
            if (req.user.role === 'teacher') {
                // Teachers can only see students
                users = await User.findAll({
                    where: { role: 'student' },
                    attributes: { exclude: ['password'] },
                    order: [['firstName', 'ASC'], ['lastName', 'ASC']]
                });
            } else {
                // Admin can see all users
                users = await User.findAll({
                    attributes: { exclude: ['password'] },
                    order: [['createdAt', 'DESC']]
                });
            }

            return send.sendResponseMessage(res, 200, users, 'Users retrieved successfully');
        } catch (error) {
            console.error('Get all users error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Update user (admin only)
    updateUser: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Admin role required.');
            }

            const { userId } = req.params;
            const { firstName, lastName, email, role, isActive, accountStatus } = req.body;

            // Find the user
            const user = await User.findByPk(userId);
            if (!user) {
                return send.sendResponseMessage(res, 404, null, 'User not found');
            }

            // Prevent admin from deactivating themselves
            if (userId == req.user.id && isActive === false) {
                return send.sendResponseMessage(res, 400, null, 'You cannot deactivate your own account');
            }

            // Update user fields
            const updateData = {};
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (email !== undefined) updateData.email = email;
            if (role !== undefined) updateData.role = role;
            if (isActive !== undefined) updateData.isActive = isActive;
            if (accountStatus !== undefined) updateData.accountStatus = accountStatus;

            await user.update(updateData);

            return send.sendResponseMessage(res, 200, user, 'User updated successfully');
        } catch (error) {
            console.error('Update user error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Delete user (admin only)
    deleteUser: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Admin role required.');
            }

            const { userId } = req.params;

            // Find the user
            const user = await User.findByPk(userId);
            if (!user) {
                return send.sendResponseMessage(res, 404, null, 'User not found');
            }

            // Prevent admin from deleting themselves
            if (userId == req.user.id) {
                return send.sendResponseMessage(res, 400, null, 'You cannot delete your own account');
            }

            // Soft delete - just set isActive to false
            await user.update({ isActive: false, accountStatus: 'deleted' });

            return send.sendResponseMessage(res, 200, null, 'User deleted successfully');
        } catch (error) {
            console.error('Delete user error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get user by ID (admin only)
    getUserById: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Admin role required.');
            }

            const { userId } = req.params;

            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                return send.sendResponseMessage(res, 404, null, 'User not found');
            }

            return send.sendResponseMessage(res, 200, user, 'User retrieved successfully');
        } catch (error) {
            console.error('Get user by ID error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get system statistics (admin only)
    getSystemStats: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Admin role required.');
            }

            const totalUsers = await User.count();
            const activeUsers = await User.count({ where: { isActive: true } });
            const totalStudents = await User.count({ where: { role: 'student' } });
            const totalTeachers = await User.count({ where: { role: 'teacher' } });
            const totalParents = await User.count({ where: { role: 'parent' } });
            const totalAdmins = await User.count({ where: { role: 'admin' } });

            // Get recent users (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentUsers = await User.count({
                where: {
                    createdAt: {
                        [require('sequelize').Op.gte]: thirtyDaysAgo
                    }
                }
            });

            const stats = {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                totalStudents,
                totalTeachers,
                totalParents,
                totalAdmins,
                recentUsers,
                systemUptime: '99.9%', // This would come from actual system monitoring
                lastUpdated: new Date()
            };

            return send.sendResponseMessage(res, 200, stats, 'System statistics retrieved successfully');
        } catch (error) {
            console.error('Get system stats error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }
};

module.exports = UserController; 
