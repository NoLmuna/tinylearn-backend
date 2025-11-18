/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Admin, Teacher, Student, Parent, TeacherStudent, sequelize } = require('../models/database');
const send = require('../utils/response');

const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';

const AdminController = {
    registerAdmin: async (req, res) => {
        try {
            const { firstName, lastName, email, password, isSuperAdmin } = req.body;

            if (!firstName || !lastName || !email || !password) {
                return send.sendResponseMessage(res, 400, null, 'First name, last name, email, and password are required');
            }

            const adminCount = await Admin.count();
            if (adminCount > 0 && (!req.user || req.user.role !== 'admin')) {
                return send.sendResponseMessage(res, 403, null, 'Only admins can create additional admin accounts');
            }

            const existingAdmin = await Admin.findOne({ where: { email } });
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
    },

    loginAdmin: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return send.sendResponseMessage(res, 400, null, 'Email and password are required');
            }

            const admin = await Admin.findOne({ where: { email } });
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

            await admin.update({ lastLogin: new Date() });

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
    },

    getAdmins: async (req, res) => {
        try {
            const admins = await Admin.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });

            return send.sendResponseMessage(res, 200, admins, 'Admins retrieved successfully');
        } catch (error) {
            console.error('Get admins error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getTeachersList: async (req, res) => {
        try {
            const teachers = await Teacher.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });

            const normalized = teachers.map(teacher => {
                const record = teacher.toJSON ? teacher.toJSON() : teacher;
                record.role = 'teacher';
                return record;
            });

            return send.sendResponseMessage(res, 200, normalized, 'Teachers retrieved successfully');
        } catch (error) {
            console.error('Get teachers error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getTeachersDetail: async (req, res) => {
        try {
            const { teacherId } = req.params;
            const teacher = await Teacher.findByPk(teacherId, {
                attributes: { exclude: ['password'] }
            });

            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            const record = teacher.toJSON ? teacher.toJSON() : teacher;
            record.role = 'teacher';

            return send.sendResponseMessage(res, 200, record, 'Teacher retrieved successfully');
        } catch (error) {
            console.error('Get teacher detail error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getStudentsList: async (req, res) => {
        try {
            const students = await Student.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });

            const normalized = students.map(student => {
                const record = student.toJSON ? student.toJSON() : student;
                record.role = 'student';
                return record;
            });

            return send.sendResponseMessage(res, 200, normalized, 'Students retrieved successfully');
        } catch (error) {
            console.error('Get students error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getStudentsDetail: async (req, res) => {
        try {
            const { studentId } = req.params;
            const student = await Student.findByPk(studentId, {
                attributes: { exclude: ['password'] }
            });

            if (!student) {
                return send.sendResponseMessage(res, 404, null, 'Student not found');
            }

            const record = student.toJSON ? student.toJSON() : student;
            record.role = 'student';

            return send.sendResponseMessage(res, 200, record, 'Student retrieved successfully');
        } catch (error) {
            console.error('Get student detail error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getParentsList: async (req, res) => {
        try {
            const parents = await Parent.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });

            const normalized = parents.map(parent => {
                const record = parent.toJSON ? parent.toJSON() : parent;
                record.role = 'parent';
                return record;
            });

            return send.sendResponseMessage(res, 200, normalized, 'Parents retrieved successfully');
        } catch (error) {
            console.error('Get parents error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getParentsDetail: async (req, res) => {
        try {
            const { parentId } = req.params;
            const parent = await Parent.findByPk(parentId, {
                attributes: { exclude: ['password'] }
            });

            if (!parent) {
                return send.sendResponseMessage(res, 404, null, 'Parent not found');
            }

            const record = parent.toJSON ? parent.toJSON() : parent;
            record.role = 'parent';

            return send.sendResponseMessage(res, 200, record, 'Parent retrieved successfully');
        } catch (error) {
            console.error('Get parent detail error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getAdminById: async (req, res) => {
        try {
            const { adminId } = req.params;
            const admin = await Admin.findByPk(adminId, {
                attributes: { exclude: ['password'] }
            });

            if (!admin) {
                return send.sendResponseMessage(res, 404, null, 'Admin not found');
            }

            return send.sendResponseMessage(res, 200, admin, 'Admin retrieved successfully');
        } catch (error) {
            console.error('Get admin by ID error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getProfile: async (req, res) => {
        try {
            const admin = await Admin.findByPk(req.user.userId, {
                attributes: { exclude: ['password'] }
            });

            if (!admin) {
                return send.sendResponseMessage(res, 404, null, 'Admin not found');
            }

            const profile = admin.toJSON ? admin.toJSON() : admin;
            profile.role = 'admin';

            return send.sendResponseMessage(res, 200, profile, 'Admin profile retrieved successfully');
        } catch (error) {
            console.error('Get admin profile error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    updateAdmin: async (req, res) => {
        try {
            const { adminId } = req.params;
            const { firstName, lastName, email, accountStatus, isSuperAdmin } = req.body;

            const admin = await Admin.findByPk(adminId);
            if (!admin) {
                return send.sendResponseMessage(res, 404, null, 'Admin not found');
            }

            await admin.update({
                firstName: firstName ?? admin.firstName,
                lastName: lastName ?? admin.lastName,
                email: email ?? admin.email,
                accountStatus: accountStatus ?? admin.accountStatus,
                isSuperAdmin: isSuperAdmin !== undefined ? isSuperAdmin : admin.isSuperAdmin
            });

            return send.sendResponseMessage(res, 200, admin, 'Admin updated successfully');
        } catch (error) {
            console.error('Update admin error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    deleteAdmin: async (req, res) => {
        try {
            const { adminId } = req.params;

            if (parseInt(adminId, 10) === (req.user.userId || req.user.id)) {
                return send.sendResponseMessage(res, 400, null, 'You cannot delete your own account');
            }

            const admin = await Admin.findByPk(adminId);
            if (!admin) {
                return send.sendResponseMessage(res, 404, null, 'Admin not found');
            }

            await admin.destroy();
            return send.sendResponseMessage(res, 200, null, 'Admin deleted successfully');
        } catch (error) {
            console.error('Delete admin error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    getSystemStats: async (req, res) => {
        try {
            const [
                totalAdmins,
                totalTeachers,
                totalStudents,
                totalParents,
                pendingTeachers
            ] = await Promise.all([
                Admin.count(),
                Teacher.count(),
                Student.count(),
                Parent.count(),
                Teacher.count({ where: { accountStatus: 'pending' } })
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
    },

    getTeacherStudents: async (req, res) => {
        try {
            const { teacherId } = req.params;

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
                .map(student => ({
                    ...student.toJSON(),
                    role: 'student'
                }));

            return send.sendResponseMessage(res, 200, students, 'Teacher students retrieved successfully');
        } catch (error) {
            console.error('Get teacher students error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    assignStudentsToTeacher: async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { teacherId } = req.params;
            const { studentIds } = req.body;

            if (!Array.isArray(studentIds)) {
                await transaction.rollback();
                return send.sendResponseMessage(res, 400, null, 'studentIds array is required');
            }

            const teacher = await Teacher.findByPk(teacherId);
            if (!teacher) {
                await transaction.rollback();
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            if (studentIds.length > 0) {
                const students = await Student.findAll({
                    where: { id: studentIds }
                });

                if (students.length !== studentIds.length) {
                    await transaction.rollback();
                    return send.sendResponseMessage(res, 400, null, 'One or more student IDs are invalid');
                }
            }

            const existingAssignments = await TeacherStudent.findAll({
                where: { teacherId },
                transaction
            });
            const existingIds = existingAssignments.map((assignment) => assignment.studentId);

            const idsToAdd = studentIds.filter((id) => !existingIds.includes(id));
            const idsToRemove = existingIds.filter((id) => !studentIds.includes(id));

            if (idsToRemove.length > 0) {
                await TeacherStudent.destroy({
                    where: { teacherId, studentId: idsToRemove },
                    transaction
                });
            }

            if (idsToAdd.length > 0) {
                await TeacherStudent.bulkCreate(
                    idsToAdd.map((studentId) => ({ teacherId, studentId })),
                    { transaction }
                );
            }

            await transaction.commit();

            const updatedAssignments = await TeacherStudent.findAll({
                where: { teacherId },
                include: [{
                    model: Student,
                    as: 'student',
                    attributes: { exclude: ['password'] }
                }]
            });

            const students = updatedAssignments
                .map((assignment) => assignment.student)
                .filter(Boolean)
                .map(student => ({
                    ...student.toJSON(),
                    role: 'student'
                }));

            return send.sendResponseMessage(res, 200, students, 'Students assigned successfully');
        } catch (error) {
            await transaction.rollback();
            console.error('Assign teacher students error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }
};

module.exports = AdminController;
