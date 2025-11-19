/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Teacher, Student, TeacherStudent, Lesson, Assignment } = require('../models/database');
const send = require('../utils/response');

const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

const TeacherController = {
    registerTeacher: async (req, res) => {
        try {
            const { firstName, lastName, email, password, bio, subjectSpecialty } = req.body;

            if (!firstName || !lastName || !email || !password) {
                return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
            }

            const existingTeacher = await Teacher.findOne({ where: { email } });
            if (existingTeacher) {
                return send.sendResponseMessage(res, 409, null, 'Teacher with this email already exists');
            }

            const hashedPassword = await argon2.hash(password);
            const teacher = await Teacher.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                bio,
                subjectSpecialty,
                accountStatus: 'pending'
            });

            const response = {
                id: teacher.id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                accountStatus: teacher.accountStatus
            };

            return send.sendResponseMessage(res, 201, response, 'Teacher registered successfully. Awaiting admin approval.');
        } catch (error) {
            console.error('Register teacher error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    loginTeacher: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return send.sendResponseMessage(res, 400, null, 'Email and password are required');
            }

            const teacher = await Teacher.findOne({ where: { email } });
            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            if (teacher.accountStatus === 'pending') {
                return send.sendResponseMessage(res, 403, null, 'Account is pending approval');
            }

            if (teacher.accountStatus === 'suspended') {
                return send.sendResponseMessage(res, 403, null, 'Account is suspended');
            }

            const validPassword = await argon2.verify(teacher.password, password);
            if (!validPassword) {
                return send.sendResponseMessage(res, 401, null, 'Invalid credentials');
            }

            await teacher.update({ lastLogin: new Date() });

            const token = jwt.sign(
                {
                    userId: teacher.id,
                    role: 'teacher',
                    email: teacher.email
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            const response = {
                id: teacher.id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                accountStatus: teacher.accountStatus,
                subjectSpecialty: teacher.subjectSpecialty,
                role: 'teacher'
            };

            return send.sendResponseMessage(res, 200, { user: response, token }, 'Teacher login successful');
        } catch (error) {
            console.error('Teacher login error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getTeachers: async (req, res) => {
        try {
            const { status } = req.query;
            const whereClause = {};
            if (status) {
                whereClause.accountStatus = status;
            }

            const teachers = await Teacher.findAll({
                where: whereClause,
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });

            return send.sendResponseMessage(res, 200, teachers, 'Teachers retrieved successfully');
        } catch (error) {
            console.error('Get teachers error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    updateTeacherStatus: async (req, res) => {
        try {
            const { teacherId } = req.params;
            const { accountStatus, isActive } = req.body;

            const teacher = await Teacher.findByPk(teacherId);
            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            await teacher.update({
                accountStatus: accountStatus ?? teacher.accountStatus,
                isActive: isActive !== undefined ? isActive : teacher.isActive
            });

            return send.sendResponseMessage(res, 200, teacher, 'Teacher updated successfully');
        } catch (error) {
            console.error('Update teacher error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    updateTeacher: async (req, res) => {
        try {
            const { teacherId } = req.params;
            const { firstName, lastName, bio, subjectSpecialty } = req.body;

            if (req.user.role !== 'admin' && (req.user.userId || req.user.id) !== parseInt(teacherId, 10)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const teacher = await Teacher.findByPk(teacherId);
            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            await teacher.update({
                firstName: firstName ?? teacher.firstName,
                lastName: lastName ?? teacher.lastName,
                bio: bio ?? teacher.bio,
                subjectSpecialty: subjectSpecialty ?? teacher.subjectSpecialty
            });

            return send.sendResponseMessage(res, 200, teacher, 'Teacher profile updated successfully');
        } catch (error) {
            console.error('Update teacher profile error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    deleteTeacher: async (req, res) => {
        try {
            const { teacherId } = req.params;

            const teacher = await Teacher.findByPk(teacherId);
            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            await teacher.destroy();
            return send.sendResponseMessage(res, 200, null, 'Teacher deleted successfully');
        } catch (error) {
            console.error('Delete teacher error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getTeacherById: async (req, res) => {
        try {
            const { teacherId } = req.params;
            const teacher = await Teacher.findByPk(teacherId, {
                attributes: { exclude: ['password'] }
            });

            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            return send.sendResponseMessage(res, 200, teacher, 'Teacher retrieved successfully');
        } catch (error) {
            console.error('Get teacher by ID error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getProfile: async (req, res) => {
        try {
            const teacher = await Teacher.findByPk(req.user.userId, {
                attributes: { exclude: ['password'] }
            });

            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            const profile = teacher.toJSON ? teacher.toJSON() : teacher;
            profile.role = 'teacher';

            return send.sendResponseMessage(res, 200, profile, 'Teacher profile retrieved successfully');
        } catch (error) {
            console.error('Get teacher profile error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getAssignedStudents: async (req, res) => {
        try {
            if (!['teacher', 'admin'].includes(req.user.role)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const teacherId = req.user.role === 'teacher'
                ? (req.user.userId || req.user.id)
                : (req.params.teacherId || req.query.teacherId);

            if (!teacherId) {
                return send.sendResponseMessage(res, 400, null, 'Teacher id is required');
            }

            const assignments = await TeacherStudent.findAll({
                where: { teacherId },
                include: [{
                    model: Student,
                    as: 'student',
                    attributes: { exclude: ['password'] }
                }]
            });

            const students = assignments
                .map((assignment) => assignment.student)
                .filter(Boolean)
                .map((student) => ({
                    ...student.toJSON(),
                    role: 'student'
                }));

            return send.sendResponseMessage(res, 200, students, 'Assigned students retrieved successfully');
        } catch (error) {
            console.error('Get assigned students error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getLessons: async (req, res) => {
        try {
            if (!['teacher', 'admin'].includes(req.user.role)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const teacherId = req.user.role === 'teacher'
                ? (req.user.userId || req.user.id)
                : (req.params.teacherId || req.query.teacherId);

            if (!teacherId) {
                return send.sendResponseMessage(res, 400, null, 'Teacher id is required');
            }

            const { page = 1, limit = 10, status } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = { teacherId };
            if (status === 'published') {
                whereClause.isPublished = true;
            } else if (status === 'draft') {
                whereClause.isPublished = false;
            }

            const lessons = await Lesson.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Teacher,
                        as: 'teacher',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    },
                    {
                        model: Assignment,
                        as: 'assignments',
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        required: false
                    }
                ]
            });

            return send.sendResponseMessage(res, 200, {
                lessons: lessons.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(lessons.count / limit),
                    totalItems: lessons.count,
                    itemsPerPage: parseInt(limit)
                }
            }, 'Teacher lessons retrieved successfully');
        } catch (error) {
            console.error('Get teacher lessons error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }
};

module.exports = TeacherController;
