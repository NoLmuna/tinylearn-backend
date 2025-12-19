/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Student, Parent, Teacher, StudentParent } = require('../models');
const send = require('../utils/response');

const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

// Login user - checks Teacher, Parent, and Student models
module.exports.userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return send.sendResponseMessage(res, 400, null, 'Email and password are required');
        }

        // Check all three models to find the user
        let user = null;
        let role = null;

        // Check Teacher model
        const teacher = await Teacher.findOne({ email: email.toLowerCase() });
        if (teacher) {
            user = teacher;
            role = 'teacher';
        } else {
            // Check Parent model
            const parent = await Parent.findOne({ email: email.toLowerCase() });
            if (parent) {
                user = parent;
                role = 'parent';
            } else {
                // Check Student model
                const student = await Student.findOne({ email: email.toLowerCase() });
                if (student) {
                    user = student;
                    role = 'student';
                }
            }
        }

        if (!user) {
            return send.sendResponseMessage(res, 404, null, 'User not found');
        }

        // Check if account is active
        if (!user.isActive) {
            return send.sendResponseMessage(res, 401, null, 'Account is deactivated. Please contact support.');
        }

        // Check account status
        if (user.accountStatus === 'pending') {
            return send.sendResponseMessage(res, 401, null, 'Account is pending approval. Please wait for admin approval.');
        }

        if (user.accountStatus === 'suspended') {
            return send.sendResponseMessage(res, 401, null, 'Account is suspended. Please contact support.');
        }

        // Verify password
        const verifyPassword = await argon2.verify(user.password, password);
        if (!verifyPassword) {
            return send.sendResponseMessage(res, 401, null, 'Invalid credentials');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id || user.id,
                email: user.email,
                role: role
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Prepare user response
        const userResponse = {
            id: user._id || user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: role,
            accountStatus: user.accountStatus
        };

        // Include additional fields based on role
        if (role === 'student') {
            userResponse.age = user.age;
            userResponse.grade = user.grade;
        } else if (role === 'teacher') {
            userResponse.bio = user.bio;
            userResponse.subjectSpecialty = user.subjectSpecialty;
        } else if (role === 'parent') {
            userResponse.phoneNumber = user.phoneNumber;
            userResponse.relationship = user.relationship;
        }

        return send.sendResponseMessage(res, 200, userResponse, 'Login successful');
    } catch (error) {
        console.error('Login error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

// Get user profile
module.exports.getProfile = async (req, res) => {
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
}

// Get users by role with proper permissions
module.exports.getUsersByRole = async (req, res) => {
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
}

// Get parent children
module.exports.getParentChildren = async (req, res) => {
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
}

// Get teachers for parent messaging
module.exports.getTeachersForParent = async (req, res) => {
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
    module.exports.getParentsForTeacher = async (req, res) => {
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
    }

// Get all users (admin only)
module.exports.getAllUsers = async (req, res) => {
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
    module.exports.updateUser = async (req, res) => {
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
    }

// Delete user (admin only)
module.exports.deleteUser = async (req, res) => {
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
}

// Get user by ID (admin only)
module.exports.getUserById = async (req, res) => {
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
}

// Get system statistics (admin only)
module.exports.getSystemStats = async (req, res) => {
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

