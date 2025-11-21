/* eslint-disable no-undef */
/**
 * Role-Based Permissions Middleware
 * Defines and enforces permissions for different user roles
 */

const { ApiResponse } = require('../utils/response');

/**
 * Permission definitions for each role
 */
const PERMISSIONS = {
    teacher: {
        lessons: ['create', 'read', 'update', 'delete', 'manage'],
        assignments: ['create', 'read', 'update', 'delete', 'manage'],
        grades: ['create', 'read', 'update', 'manage'],
        submissions: ['read', 'update', 'grade'],
        students: ['read'], // Can view their assigned students
        progress: ['read'] // Can view student progress
    },
    student: {
        lessons: ['read', 'view'],
        assignments: ['read', 'view'],
        grades: ['read'], // Can only view their own grades
        submissions: ['create', 'read', 'update'], // Can only manage their own
        students: [], // Cannot view other students
        progress: ['read'] // Can only view their own progress
    },
    parent: {
        lessons: ['read'], // Can view lessons their children are taking
        assignments: ['read'], // Can view assignments for their children
        grades: ['read'], // Can view their children's grades only
        submissions: ['read'], // Can view their children's submissions
        students: ['read'], // Can view their own children
        progress: ['read'] // Can view their children's progress
    },
    admin: {
        lessons: ['create', 'read', 'update', 'delete', 'manage'],
        assignments: ['create', 'read', 'update', 'delete', 'manage'],
        grades: ['create', 'read', 'update', 'delete', 'manage'],
        submissions: ['create', 'read', 'update', 'delete', 'manage'],
        students: ['create', 'read', 'update', 'delete', 'manage'],
        progress: ['read', 'manage']
    }
};

/**
 * Check if a user has permission for a resource and action
 * @param {string} role - User role
 * @param {string} resource - Resource name (lessons, assignments, etc.)
 * @param {string} action - Action name (create, read, update, delete, etc.)
 * @returns {boolean} True if user has permission
 */
const hasPermission = (role, resource, action) => {
    if (!PERMISSIONS[role]) {
        return false;
    }

    const rolePermissions = PERMISSIONS[role][resource];
    if (!rolePermissions) {
        return false;
    }

    // Check for specific action or 'manage' permission (which grants all)
    return rolePermissions.includes(action) || rolePermissions.includes('manage');
};

/**
 * Middleware factory to check permissions
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Function} Express middleware
 */
const requirePermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return ApiResponse.unauthorized(res, 'Authentication required');
        }

        const userRole = req.user.role;

        if (!hasPermission(userRole, resource, action)) {
            return ApiResponse.forbidden(
                res,
                `Access denied. ${userRole} role does not have ${action} permission for ${resource}`
            );
        }

        next();
    };
};

/**
 * Middleware to check if user can access a specific resource
 * For example, students can only access their own data
 * @param {Function} ownershipCheck - Function that checks if user owns the resource
 * @returns {Function} Express middleware
 */
const requireOwnershipOrRole = (ownershipCheck, allowedRoles = ['admin', 'teacher']) => {
    return async (req, res, next) => {
        if (!req.user || !req.user.role) {
            return ApiResponse.unauthorized(res, 'Authentication required');
        }

        const userRole = req.user.role;

        // Admins and teachers (if allowed) can access any resource
        if (allowedRoles.includes(userRole)) {
            return next();
        }

        // For other roles, check ownership
        try {
            const isOwner = await ownershipCheck(req);
            if (!isOwner) {
                return ApiResponse.forbidden(res, 'Access denied. You can only access your own resources.');
            }
            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            return ApiResponse.error(res, 'Failed to verify resource ownership');
        }
    };
};

/**
 * Helper to check if user can view student data
 * Parents can view their children, teachers can view assigned students
 */
const canViewStudent = async (req, studentId) => {
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (userRole === 'admin') {
        return true;
    }

    if (userRole === 'student' && userId === studentId) {
        return true;
    }

    if (userRole === 'parent') {
        const { StudentParent } = require('../models/database');
        const relationship = await StudentParent.findOne({
            where: { parentId: userId, studentId }
        });
        return !!relationship;
    }

    if (userRole === 'teacher') {
        const { TeacherStudent } = require('../models/database');
        const assignment = await TeacherStudent.findOne({
            where: { teacherId: userId, studentId }
        });
        return !!assignment;
    }

    return false;
};

module.exports = {
    PERMISSIONS,
    hasPermission,
    requirePermission,
    requireOwnershipOrRole,
    canViewStudent
};

