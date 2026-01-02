/* eslint-disable no-undef */
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { Teacher, Student, Parent, TeacherStudent, StudentParent, Lesson, Assignment } = require('../models');
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
}

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
}

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
}

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

            // Get parent information for each student
            const studentIds = students.map(s => s._id || s.id);
            const studentParentRelations = await StudentParent.find({ studentId: { $in: studentIds } })
                .populate('parentId', '-password')
                .populate('studentId', 'firstName lastName');

            // Map parents to students
            const studentsWithParents = students.map(student => {
                const studentObj = student.toObject ? student.toObject() : student;
                const parentRelations = studentParentRelations.filter(
                    rel => (rel.studentId._id || rel.studentId.id).toString() === (studentObj._id || studentObj.id).toString()
                );
                const parents = parentRelations.map(rel => ({
                    ...(rel.parentId.toObject ? rel.parentId.toObject() : rel.parentId),
                    relationship: rel.relationship,
                    isPrimary: rel.isPrimary
                }));

                return {
                    ...studentObj,
                    role: 'student',
                    parents: parents || []
                };
            });

            // Filter based on includeArchived query parameter
            const includeArchived = req.query.includeArchived === 'true';
            const filteredStudents = includeArchived 
                ? studentsWithParents 
                : studentsWithParents.filter(student => student.isActive !== false);

            return send.sendResponseMessage(res, 200, filteredStudents, 'Assigned students retrieved successfully');
        } catch (error) {
            console.error('Get assigned students error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
}

module.exports.getAssignedParents = async (req, res) => {
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

        // Get all students assigned to this teacher
        const assignments = await TeacherStudent.find({ teacherId });
        const studentIds = assignments.map(a => {
            // Handle both populated and non-populated studentId
            if (a.studentId && typeof a.studentId === 'object') {
                return a.studentId._id || a.studentId.id || a.studentId;
            }
            return a.studentId;
        }).filter(Boolean);

        if (studentIds.length === 0) {
            return send.sendResponseMessage(res, 200, [], 'No parents found for assigned students');
        }

        // Get all parent-student relationships for these students
        const studentParentRelations = await StudentParent.find({ studentId: { $in: studentIds } })
            .populate('parentId', '-password')
            .populate('studentId', 'firstName lastName email grade');

        // Get unique parents and include their children info
        const parentMap = new Map();
        
        studentParentRelations.forEach(rel => {
            if (!rel.parentId) return;
            
            const parentId = (rel.parentId._id || rel.parentId.id).toString();
            const parentObj = rel.parentId.toObject ? rel.parentId.toObject() : rel.parentId;
            
            if (!parentMap.has(parentId)) {
                parentMap.set(parentId, {
                    ...parentObj,
                    role: 'parent',
                    children: []
                });
            }
            
            const parent = parentMap.get(parentId);
            const studentInfo = {
                id: rel.studentId._id || rel.studentId.id,
                firstName: rel.studentId.firstName,
                lastName: rel.studentId.lastName,
                email: rel.studentId.email,
                grade: rel.studentId.grade,
                relationship: rel.relationship
            };
            
            // Avoid duplicates
            if (!parent.children.some(c => c.id.toString() === studentInfo.id.toString())) {
                parent.children.push(studentInfo);
            }
        });

        const parents = Array.from(parentMap.values());

        // Filter based on includeArchived query parameter
        const includeArchived = req.query.includeArchived === 'true';
        const filteredParents = includeArchived 
            ? parents 
            : parents.filter(parent => parent.isActive !== false);

        return send.sendResponseMessage(res, 200, filteredParents, 'Assigned parents retrieved successfully');
    } catch (error) {
        console.error('Get assigned parents error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.createStudent = async (req, res) => {
        try {
            if (!['teacher', 'admin'].includes(req.user.role)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const { 
                // Student fields
                studentFirstName, 
                studentLastName, 
                studentEmail, 
                studentPassword, 
                age, 
                grade,
                // Parent fields
                parentFirstName,
                parentLastName,
                parentEmail,
                parentPassword,
                phoneNumber,
                relationship
            } = req.body;

            // Validate student fields
            if (!studentFirstName || !studentLastName || !studentEmail || !studentPassword) {
                return send.sendResponseMessage(res, 400, null, 'Student first name, last name, email, and password are required');
            }

            // Validate parent fields
            if (!parentFirstName || !parentLastName || !parentEmail || !parentPassword) {
                return send.sendResponseMessage(res, 400, null, 'Parent first name, last name, email, and password are required');
            }

            // Check for existing student
            const existingStudent = await Student.findOne({ email: studentEmail });
            if (existingStudent) {
                return send.sendResponseMessage(res, 409, null, 'Student with this email already exists');
            }

            // Check for existing parent
            const existingParent = await Parent.findOne({ email: parentEmail });
            if (existingParent) {
                return send.sendResponseMessage(res, 409, null, 'Parent with this email already exists');
            }

            // Create student
            const hashedStudentPassword = await argon2.hash(studentPassword);
            const student = await Student.create({
                firstName: studentFirstName,
                lastName: studentLastName,
                email: studentEmail,
                password: hashedStudentPassword,
                age,
                grade,
                accountStatus: 'active'
            });

            // Create parent
            const hashedParentPassword = await argon2.hash(parentPassword);
            const parent = await Parent.create({
                firstName: parentFirstName,
                lastName: parentLastName,
                email: parentEmail,
                password: hashedParentPassword,
                phoneNumber,
                relationship,
                accountStatus: 'active'
            });

            // Link parent to student
            await StudentParent.findOneAndUpdate(
                { studentId: student.id, parentId: parent.id },
                { 
                    studentId: student.id, 
                    parentId: parent.id,
                    relationship: relationship || 'guardian',
                    isPrimary: true
                },
                { upsert: true, new: true }
            );

            // Assign student to the teacher
            const teacherId = req.user.role === 'teacher' ? (req.user.userId || req.user.id) : null;
            if (teacherId) {
                await TeacherStudent.findOneAndUpdate(
                    { teacherId, studentId: student.id },
                    { teacherId, studentId: student.id },
                    { upsert: true, new: true }
                );
            }

            const response = {
                student: {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email,
                    grade: student.grade,
                    age: student.age,
                    role: 'student'
                },
                parent: {
                    id: parent.id,
                    firstName: parent.firstName,
                    lastName: parent.lastName,
                    email: parent.email,
                    phoneNumber: parent.phoneNumber,
                    relationship: parent.relationship,
                    role: 'parent'
                }
            };

            return send.sendResponseMessage(res, 201, response, 'Student and parent created successfully');
        } catch (error) {
            console.error('Create student and parent error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
}

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

module.exports.archiveStudent = async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.user.role)) {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        const { studentId } = req.params;

        // Check if teacher has access to this student
        const teacherId = req.user.role === 'teacher' ? (req.user.userId || req.user.id) : null;
        if (teacherId) {
            const assignment = await TeacherStudent.findOne({
                teacherId: teacherId,
                studentId: studentId
            });
            if (!assignment && req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Student not assigned to you.');
            }
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return send.sendResponseMessage(res, 404, null, 'Student not found');
        }

        student.isActive = false;
        await student.save();

        return send.sendResponseMessage(res, 200, student, 'Student archived successfully');
    } catch (error) {
        console.error('Archive student error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.archiveParent = async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.user.role)) {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        const { parentId } = req.params;

        // Check if teacher has access to this parent (through assigned students)
        const teacherId = req.user.role === 'teacher' ? (req.user.userId || req.user.id) : null;
        if (teacherId) {
            const assignments = await TeacherStudent.find({ teacherId });
            const studentIds = assignments.map(a => {
                if (a.studentId && typeof a.studentId === 'object') {
                    return a.studentId._id || a.studentId.id || a.studentId;
                }
                return a.studentId;
            }).filter(Boolean);

            if (studentIds.length > 0) {
                const parentRelation = await StudentParent.findOne({
                    parentId: parentId,
                    studentId: { $in: studentIds }
                });
                if (!parentRelation && req.user.role !== 'admin') {
                    return send.sendResponseMessage(res, 403, null, 'Access denied. Parent not linked to your assigned students.');
                }
            } else if (req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied.');
            }
        }

        const parent = await Parent.findById(parentId);
        if (!parent) {
            return send.sendResponseMessage(res, 404, null, 'Parent not found');
        }

        parent.isActive = false;
        await parent.save();

        return send.sendResponseMessage(res, 200, parent, 'Parent archived successfully');
    } catch (error) {
        console.error('Archive parent error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.restoreStudent = async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.user.role)) {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        const { studentId } = req.params;

        // Check if teacher has access to this student
        const teacherId = req.user.role === 'teacher' ? (req.user.userId || req.user.id) : null;
        if (teacherId) {
            const assignment = await TeacherStudent.findOne({
                teacherId: teacherId,
                studentId: studentId
            });
            if (!assignment && req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Student not assigned to you.');
            }
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return send.sendResponseMessage(res, 404, null, 'Student not found');
        }

        student.isActive = true;
        await student.save();

        return send.sendResponseMessage(res, 200, student, 'Student restored successfully');
    } catch (error) {
        console.error('Restore student error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

module.exports.restoreParent = async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.user.role)) {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        const { parentId } = req.params;

        // Check if teacher has access to this parent (through assigned students)
        const teacherId = req.user.role === 'teacher' ? (req.user.userId || req.user.id) : null;
        if (teacherId) {
            const assignments = await TeacherStudent.find({ teacherId });
            const studentIds = assignments.map(a => {
                if (a.studentId && typeof a.studentId === 'object') {
                    return a.studentId._id || a.studentId.id || a.studentId;
                }
                return a.studentId;
            }).filter(Boolean);

            if (studentIds.length > 0) {
                const parentRelation = await StudentParent.findOne({
                    parentId: parentId,
                    studentId: { $in: studentIds }
                });
                if (!parentRelation && req.user.role !== 'admin') {
                    return send.sendResponseMessage(res, 403, null, 'Access denied. Parent not linked to your assigned students.');
                }
            } else if (req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied.');
            }
        }

        const parent = await Parent.findById(parentId);
        if (!parent) {
            return send.sendResponseMessage(res, 404, null, 'Parent not found');
        }

        parent.isActive = true;
        await parent.save();

        return send.sendResponseMessage(res, 200, parent, 'Parent restored successfully');
    } catch (error) {
        console.error('Restore parent error:', error);
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

        const { page = 1, limit = 10, status, includeArchived } = req.query;
        const skip = (page - 1) * limit;

        let query = { teacherId };
        if (status === 'published') {
            query.isActive = true;
        } else if (status === 'draft') {
            query.isActive = false;
        } else if (includeArchived !== 'true') {
            // By default, only show active lessons unless includeArchived is true
            query.isActive = true;
        }

        const [lessons, total] = await Promise.all([
            Lesson.find(query)
                .populate('teacherId', 'firstName lastName email')
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
