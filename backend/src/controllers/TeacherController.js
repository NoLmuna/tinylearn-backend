/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Teacher, Student, Parent, TeacherStudent, Lesson, Assignment } = require('../models');
const send = require('../utils/response');

const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

module.exports.registerTeacher = async (req, res) => {
    try {
        const { firstName, lastName, email, password, bio, subjectSpecialty } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
        }

        const existingTeacher = await Teacher.findOne({ email });
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
}

module.exports.loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return send.sendResponseMessage(res, 400, null, 'Email and password are required');
        }

        const teacher = await Teacher.findOne({ email });
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

        teacher.lastLogin = new Date();
        await teacher.save();

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
}

module.exports.getTeachers = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) {
            query.accountStatus = status;
        }

        const teachers = await Teacher.find(query).select('-password').sort({ createdAt: -1 });

        return send.sendResponseMessage(res, 200, teachers, 'Teachers retrieved successfully');
    } catch (error) {
        console.error('Get teachers error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.updateTeacherStatus = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { accountStatus, isActive } = req.body;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return send.sendResponseMessage(res, 404, null, 'Teacher not found');
        }

        if (accountStatus !== undefined) teacher.accountStatus = accountStatus;
        if (isActive !== undefined) teacher.isActive = isActive;
        await teacher.save();

        return send.sendResponseMessage(res, 200, teacher, 'Teacher updated successfully');
    } catch (error) {
        console.error('Update teacher error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.updateTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { firstName, lastName, bio, password, subjectSpecialty } = req.body;

        if (req.user.role !== 'admin' && (req.user.userId || req.user.id).toString() !== teacherId.toString()) {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return send.sendResponseMessage(res, 404, null, 'Teacher not found');
        }

        if (firstName !== undefined) teacher.firstName = firstName;
        if (lastName !== undefined) teacher.lastName = lastName;
        if (bio !== undefined) teacher.bio = bio;
        if (subjectSpecialty !== undefined) teacher.subjectSpecialty = subjectSpecialty;
        if (password !== undefined) teacher.password = await argon2.hash(password);
        await teacher.save();

        return send.sendResponseMessage(res, 200, teacher, 'Teacher profile updated successfully');
    } catch (error) {
        console.error('Update teacher profile error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.deleteTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return send.sendResponseMessage(res, 404, null, 'Teacher not found');
        }

        await Teacher.findByIdAndDelete(teacherId);
        return send.sendResponseMessage(res, 200, null, 'Teacher deleted successfully');
    } catch (error) {
        console.error('Delete teacher error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
},

    module.exports.getTeacherById = async (req, res) => {
        try {
            const { teacherId } = req.params;
            const teacher = await Teacher.findById(teacherId).select('-password');

            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            return send.sendResponseMessage(res, 200, teacher, 'Teacher retrieved successfully');
        } catch (error) {
            console.error('Get teacher by ID error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    module.exports.getProfile = async (req, res) => {
        try {
            const teacher = await Teacher.findById(req.user.userId).select('-password');

            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            const profile = teacher.toObject ? teacher.toObject() : teacher;
            profile.role = 'teacher';

            return send.sendResponseMessage(res, 200, profile, 'Teacher profile retrieved successfully');
        } catch (error) {
            console.error('Get teacher profile error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    module.exports.getAssignedStudents = async (req, res) => {
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

            const assignments = await TeacherStudent.find({ teacherId })
                .populate('studentId', '-password');

            const students = assignments
                .map((assignment) => assignment.studentId)
                .filter(Boolean)
                .map((student) => ({
                    ...(student.toObject ? student.toObject() : student),
                    role: 'student'
                }));

            return send.sendResponseMessage(res, 200, students, 'Assigned students retrieved successfully');
        } catch (error) {
            console.error('Get assigned students error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    module.exports.createStudent = async (req, res) => {
        try {
            if (!['teacher', 'admin'].includes(req.user.role)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const { firstName, lastName, email, password, age, grade } = req.body;

            if (!firstName || !lastName || !email || !password) {
                return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
            }

            const existingStudent = await Student.findOne({ email });
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

            // Optionally assign student to the teacher
            const teacherId = req.user.role === 'teacher' ? (req.user.userId || req.user.id) : null;
            if (teacherId) {
                await TeacherStudent.findOneAndUpdate(
                    { teacherId, studentId: student.id },
                    { teacherId, studentId: student.id },
                    { upsert: true, new: true }
                );
            }

            const response = {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                grade: student.grade,
                age: student.age,
                role: 'student'
            };

            return send.sendResponseMessage(res, 201, response, 'Student created successfully');
        } catch (error) {
            console.error('Create student error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    module.exports.createParent = async (req, res) => {
        try {
            if (!['teacher', 'admin'].includes(req.user.role)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const { firstName, lastName, email, password, phoneNumber, relationship } = req.body;

            if (!firstName || !lastName || !email || !password) {
                return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
            }

            const existingParent = await Parent.findOne({ email });
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
                relationship: parent.relationship,
                role: 'parent'
            };

            return send.sendResponseMessage(res, 201, response, 'Parent created successfully');
        } catch (error) {
            console.error('Create parent error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }

module.exports.getLessons = async (req, res) => {
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
        const skip = (page - 1) * limit;

        let query = { teacherId };
        if (status === 'published') {
            query.isPublished = true;
        } else if (status === 'draft') {
            query.isPublished = false;
        }

        const [lessons, total] = await Promise.all([
            Lesson.find(query)
                .populate('teacherId', 'firstName lastName email')
                .populate({
                    path: 'assignments',
                    select: '-createdAt -updatedAt'
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Lesson.countDocuments(query)
        ]);

        return send.sendResponseMessage(res, 200, {
            lessons,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        }, 'Teacher lessons retrieved successfully');
    } catch (error) {
        console.error('Get teacher lessons error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}
