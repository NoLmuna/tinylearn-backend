/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Student, TeacherStudent, Teacher } = require('../models/database');
const send = require('../utils/response');

const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

const StudentController = {
    registerStudent: async (req, res) => {
        try {
            const { firstName, lastName, email, password, age, grade } = req.body;

            if (!firstName || !lastName || !email || !password) {
                return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
            }

            const existingStudent = await Student.findOne({ where: { email } });
            if (existingStudent) {
                return send.sendResponseMessage(res, 409, null, 'Student with this email already exists');
            }

            const hashedPassword = await argon2.hash(password);
            const student = await Student.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                age,
                grade,
                accountStatus: 'active'
            });

            const response = {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                grade: student.grade,
                role: 'student'
            };

            return send.sendResponseMessage(res, 201, response, 'Student registered successfully');
        } catch (error) {
            console.error('Register student error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    loginStudent: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return send.sendResponseMessage(res, 400, null, 'Email and password are required');
            }

            const student = await Student.findOne({ where: { email } });
            if (!student) {
                return send.sendResponseMessage(res, 404, null, 'Student not found');
            }

            if (student.accountStatus === 'suspended') {
                return send.sendResponseMessage(res, 403, null, 'Account is suspended');
            }

            const validPassword = await argon2.verify(student.password, password);
            if (!validPassword) {
                return send.sendResponseMessage(res, 401, null, 'Invalid credentials');
            }

            await student.update({ lastLogin: new Date() });

            const token = jwt.sign(
                {
                    userId: student.id,
                    role: 'student',
                    email: student.email
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            const response = {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                grade: student.grade
            };

            return send.sendResponseMessage(res, 200, { user: response, token }, 'Student login successful');
        } catch (error) {
            console.error('Student login error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getStudents: async (req, res) => {
        try {
            const students = await Student.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });

            return send.sendResponseMessage(res, 200, students, 'Students retrieved successfully');
        } catch (error) {
            console.error('Get students error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getStudentById: async (req, res) => {
        try {
            const { studentId } = req.params;

            if (req.user.role !== 'admin' && (req.user.userId || req.user.id) !== parseInt(studentId, 10)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const student = await Student.findByPk(studentId, {
                attributes: { exclude: ['password'] }
            });

            if (!student) {
                return send.sendResponseMessage(res, 404, null, 'Student not found');
            }

            return send.sendResponseMessage(res, 200, student, 'Student retrieved successfully');
        } catch (error) {
            console.error('Get student by ID error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    updateStudent: async (req, res) => {
        try {
            const { studentId } = req.params;
            const { firstName, lastName, grade, age, accountStatus, isActive } = req.body;

            if (req.user.role !== 'admin' && (req.user.userId || req.user.id) !== parseInt(studentId, 10)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const student = await Student.findByPk(studentId);
            if (!student) {
                return send.sendResponseMessage(res, 404, null, 'Student not found');
            }

            await student.update({
                firstName: firstName ?? student.firstName,
                lastName: lastName ?? student.lastName,
                grade: grade ?? student.grade,
                age: age ?? student.age,
                accountStatus: accountStatus ?? student.accountStatus,
                isActive: isActive !== undefined ? isActive : student.isActive
            });

            return send.sendResponseMessage(res, 200, student, 'Student updated successfully');
        } catch (error) {
            console.error('Update student error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    deleteStudent: async (req, res) => {
        try {
            const { studentId } = req.params;

            const student = await Student.findByPk(studentId);
            if (!student) {
                return send.sendResponseMessage(res, 404, null, 'Student not found');
            }

            await student.destroy();
            return send.sendResponseMessage(res, 200, null, 'Student deleted successfully');
        } catch (error) {
            console.error('Delete student error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getProfile: async (req, res) => {
        try {
            const student = await Student.findByPk(req.user.userId, {
                attributes: { exclude: ['password'] }
            });

            if (!student) {
                return send.sendResponseMessage(res, 404, null, 'Student not found');
            }

            const profile = student.toJSON ? student.toJSON() : student;
            profile.role = 'student';

            return send.sendResponseMessage(res, 200, profile, 'Student profile retrieved successfully');
        } catch (error) {
            console.error('Get student profile error:', error);
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
                : (req.query.teacherId || req.params.teacherId);

            if (!teacherId) {
                return send.sendResponseMessage(res, 400, null, 'Teacher ID is required');
            }

            const teacher = await Teacher.findByPk(teacherId);
            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
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
    }
};

module.exports = StudentController;
