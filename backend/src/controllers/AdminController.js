/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Admin, Teacher, Student, Parent, TeacherStudent } = require('../models');
const send = require('../utils/response');

const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

module.exports.registerAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password, isSuperAdmin } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
        }

        const adminCount = await Admin.countDocuments();
        if (adminCount > 0 && (!req.user || req.user.role !== 'admin')) {
            return send.sendResponseMessage(res, 403, null, 'Only admins can create additional admin accounts');
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return send.sendResponseMessage(res, 409, null, 'Admin with this email already exists');
        }

        const hashedPassword = await argon2.hash(password);
        const admin = await Admin.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            isSuperAdmin: adminCount === 0 ? true : !!isSuperAdmin,
            accountStatus: 'active'
        });

        const response = {
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            isSuperAdmin: admin.isSuperAdmin,
            accountStatus: admin.accountStatus,
            role: 'admin'
        };

        return send.sendResponseMessage(res, 201, response, 'Admin registered successfully');
    } catch (error) {
        console.error('Register admin error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

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
            accountStatus: 'approved',
            // accountStatus will use the model default: 'pending'
        });

        const response = {
            id: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            bio: teacher.bio,
            subjectSpecialty: teacher.subjectSpecialty,
            accountStatus: teacher.accountStatus,
            role: 'teacher'
        };

        return send.sendResponseMessage(res, 201, response, 'Teacher registered successfully');
    } catch (error) {
        console.error('Register teacher error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return send.sendResponseMessage(res, 400, null, 'Email and password are required');
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return send.sendResponseMessage(res, 404, null, 'Admin not found');
        }

        if (admin.accountStatus === 'suspended') {
            return send.sendResponseMessage(res, 403, null, 'Account is suspended');
        }

        const validPassword = await argon2.verify(admin.password, password);
        if (!validPassword) {
            return send.sendResponseMessage(res, 401, null, 'Invalid credentials');
        }

        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            {
                userId: admin.id,
                role: 'admin',
                email: admin.email,
                isSuperAdmin: admin.isSuperAdmin
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        const response = {
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            isSuperAdmin: admin.isSuperAdmin,
            accountStatus: admin.accountStatus
        };

        return send.sendResponseMessage(res, 200, { user: response, token }, 'Admin login successful');
    } catch (error) {
        console.error('Admin login error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password').sort({ createdAt: -1 });

        return send.sendResponseMessage(res, 200, admins, 'Admins retrieved successfully');
    } catch (error) {
        console.error('Get admins error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.getTeachersList = async (req, res) => {
    try {
        const teachers = await Teacher.find().select('-password').sort({ createdAt: -1 });

        const normalized = teachers.map(teacher => {
            const record = teacher.toObject ? teacher.toObject() : teacher;
            record.role = 'teacher';
            return record;
        });

        return send.sendResponseMessage(res, 200, normalized, 'Teachers retrieved successfully');
    } catch (error) {
        console.error('Get teachers error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.getTeachersDetail = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const teacher = await Teacher.findById(teacherId).select('-password');

        if (!teacher) {
            return send.sendResponseMessage(res, 404, null, 'Teacher not found');
        }

        const record = teacher.toObject ? teacher.toObject() : teacher;
        record.role = 'teacher';

        return send.sendResponseMessage(res, 200, record, 'Teacher retrieved successfully');
    } catch (error) {
        console.error('Get teacher detail error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.getStudentsList = async (req, res) => {
    try {
        const students = await Student.find().select('-password').sort({ createdAt: -1 });

        const normalized = students.map(student => {
            const record = student.toObject ? student.toObject() : student;
            record.role = 'student';
            return record;
        });

        return send.sendResponseMessage(res, 200, normalized, 'Students retrieved successfully');
    } catch (error) {
        console.error('Get students error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.getStudentsDetail = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId).select('-password');

        if (!student) {
            return send.sendResponseMessage(res, 404, null, 'Student not found');
        }

        const record = student.toObject ? student.toObject() : student;
        record.role = 'student';

        return send.sendResponseMessage(res, 200, record, 'Student retrieved successfully');
    } catch (error) {
        console.error('Get student detail error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
},

    module.exports.getParentsList = async (req, res) => {
        try {
            const parents = await Parent.find().select('-password').sort({ createdAt: -1 });

            const normalized = parents.map(parent => {
                const record = parent.toObject ? parent.toObject() : parent;
                record.role = 'parent';
                return record;
            });

            return send.sendResponseMessage(res, 200, normalized, 'Parents retrieved successfully');
        } catch (error) {
            console.error('Get parents error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }

module.exports.getParentsDetail = async (req, res) => {
    try {
        const { parentId } = req.params;
        const parent = await Parent.findById(parentId).select('-password');

        if (!parent) {
            return send.sendResponseMessage(res, 404, null, 'Parent not found');
        }

        const record = parent.toObject ? parent.toObject() : parent;
        record.role = 'parent';

        return send.sendResponseMessage(res, 200, record, 'Parent retrieved successfully');
    } catch (error) {
        console.error('Get parent detail error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.getAdminById = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return send.sendResponseMessage(res, 400, null, 'Invalid admin ID format');
        }

        const admin = await Admin.findById(adminId).select('-password');

        if (!admin) {
            return send.sendResponseMessage(res, 404, null, 'Admin not found');
        }

        return send.sendResponseMessage(res, 200, admin, 'Admin retrieved successfully');
    } catch (error) {
        console.error('Get admin by ID error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.userId).select('-password');

        if (!admin) {
            return send.sendResponseMessage(res, 404, null, 'Admin not found');
        }

        const profile = admin.toObject ? admin.toObject() : admin;
        profile.role = 'admin';

        return send.sendResponseMessage(res, 200, profile, 'Admin profile retrieved successfully');
    } catch (error) {
        console.error('Get admin profile error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
},

    module.exports.updateAdmin = async (req, res) => {
        try {
            const { adminId } = req.params;
            const { firstName, lastName, email, accountStatus, isSuperAdmin } = req.body;

            const admin = await Admin.findById(adminId);
            if (!admin) {
                return send.sendResponseMessage(res, 404, null, 'Admin not found');
            }

            if (firstName !== undefined) admin.firstName = firstName;
            if (lastName !== undefined) admin.lastName = lastName;
            if (email !== undefined) admin.email = email;
            if (accountStatus !== undefined) admin.accountStatus = accountStatus;
            if (isSuperAdmin !== undefined) admin.isSuperAdmin = isSuperAdmin;
            await admin.save();

            return send.sendResponseMessage(res, 200, admin, 'Admin updated successfully');
        } catch (error) {
            console.error('Update admin error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }

module.exports.deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        if (adminId.toString() === (req.user.userId || req.user.id).toString()) {
            return send.sendResponseMessage(res, 400, null, 'You cannot delete your own account');
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return send.sendResponseMessage(res, 404, null, 'Admin not found');
        }

        await Admin.findByIdAndDelete(adminId);
        return send.sendResponseMessage(res, 200, null, 'Admin deleted successfully');
    } catch (error) {
        console.error('Delete admin error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
},

    module.exports.getSystemStats = async (req, res) => {
        try {
            const [
                totalAdmins,
                totalTeachers,
                totalStudents,
                totalParents,
                pendingTeachers
            ] = await Promise.all([
                Admin.countDocuments(),
                Teacher.countDocuments(),
                Student.countDocuments(),
                Parent.countDocuments(),
                Teacher.countDocuments({ accountStatus: 'pending' })
            ]);

            const stats = {
                totalAdmins,
                totalTeachers,
                totalStudents,
                totalParents,
                pendingTeachers,
                totalUsers: totalAdmins + totalTeachers + totalStudents + totalParents
            };

            return send.sendResponseMessage(res, 200, stats, 'System stats retrieved successfully');
        } catch (error) {
            console.error('Get system stats error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }

module.exports.getTeacherStudents = async (req, res) => {
    try {
        const { teacherId } = req.params;

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return send.sendResponseMessage(res, 404, null, 'Teacher not found');
        }

        const assignments = await TeacherStudent.find({ teacherId })
            .populate('studentId', '-password');

        const students = assignments
            .map((assignment) => assignment.studentId)
            .filter(Boolean)
            .map(student => ({
                ...(student.toObject ? student.toObject() : student),
                role: 'student'
            }));

        return send.sendResponseMessage(res, 200, students, 'Teacher students retrieved successfully');
    } catch (error) {
        console.error('Get teacher students error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.assignStudentsToTeacher = async (req, res) => {
    const session = await TeacherStudent.db.startSession();
    try {
        session.startTransaction();
        const { teacherId } = req.params;
        const { studentIds } = req.body;

        if (!Array.isArray(studentIds)) {
            await session.abortTransaction();
            return send.sendResponseMessage(res, 400, null, 'studentIds array is required');
        }

        const teacher = await Teacher.findById(teacherId).session(session);
        if (!teacher) {
            await session.abortTransaction();
            return send.sendResponseMessage(res, 404, null, 'Teacher not found');
        }

        if (studentIds.length > 0) {
            const students = await Student.find({
                _id: { $in: studentIds }
            }).session(session);

            if (students.length !== studentIds.length) {
                await session.abortTransaction();
                return send.sendResponseMessage(res, 400, null, 'One or more student IDs are invalid');
            }
        }

        const existingAssignments = await TeacherStudent.find({
            teacherId
        }).session(session);
        const existingIds = existingAssignments.map((assignment) => assignment.studentId.toString());

        const idsToAdd = studentIds.filter((id) => !existingIds.includes(id.toString()));
        const idsToRemove = existingIds.filter((id) => !studentIds.map(s => s.toString()).includes(id));

        if (idsToRemove.length > 0) {
            await TeacherStudent.deleteMany({
                teacherId,
                studentId: { $in: idsToRemove }
            }).session(session);
        }

        if (idsToAdd.length > 0) {
            await TeacherStudent.insertMany(
                idsToAdd.map((studentId) => ({ teacherId, studentId })),
                { session }
            );
        }

        await session.commitTransaction();

        const updatedAssignments = await TeacherStudent.find({ teacherId })
            .populate('studentId', '-password');

        const students = updatedAssignments
            .map((assignment) => assignment.studentId)
            .filter(Boolean)
            .map(student => ({
                ...(student.toObject ? student.toObject() : student),
                role: 'student'
            }));

        return send.sendResponseMessage(res, 200, students, 'Students assigned successfully');
    } catch (error) {
        await session.abortTransaction();
        console.error('Assign teacher students error:', error);
        return send.sendErrorMessage(res, 500, error);
    } finally {
        session.endSession();
    }
}

