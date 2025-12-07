/* eslint-disable no-undef */
const { Assignment, Lesson, Submission, Teacher, Student, TeacherStudent } = require('../models');
const { sendResponse } = require('../utils/response');

// Create a new assignment
const createAssignment = async (req, res) => {
    try {
        const { title, description, instructions, lessonId, assignedTo, dueDate, maxPoints, assignmentType, attachments } = req.body;
        const teacherId = req.user.userId;

        // Validate that the user is a teacher
        if (req.user.role !== 'teacher') {
            return sendResponse(res, 403, 'error', 'Only teachers can create assignments');
        }

        // Validate due date
        if (new Date(dueDate) <= new Date()) {
            return sendResponse(res, 400, 'error', 'Due date must be in the future');
        }

        // If assignedTo is empty array, it means "assign to all students"
        // We'll store it as empty array and handle it in queries
        let finalAssignedTo = assignedTo || [];
        
        // If lessonId is provided, validate it belongs to the teacher
        if (lessonId) {
            const lesson = await Lesson.findOne({
                _id: lessonId,
                teacherId
            });
            if (!lesson) {
                return sendResponse(res, 404, 'error', 'Lesson not found or does not belong to you');
            }
        }

        const assignment = await Assignment.create({
            title,
            description,
            instructions,
            lessonId: lessonId || null, // Allow null for standalone assignments
            teacherId,
            assignedTo: finalAssignedTo, // Empty array means "all students"
            dueDate,
            maxPoints: maxPoints || 100,
            assignmentType: assignmentType || 'homework',
            attachments: attachments || []
        });

        const assignmentWithDetails = await Assignment.findById(assignment._id)
            .populate('teacherId', 'firstName lastName')
            .populate('lessonId', 'title');

        sendResponse(res, 201, 'success', 'Assignment created successfully', assignmentWithDetails);
    } catch (error) {
        console.error('Create assignment error:', error);
        sendResponse(res, 500, 'error', 'Failed to create assignment', null);
    }
};

// Get all assignments (for teachers - shows their assignments)
const getAssignments = async (req, res) => {
    try {
        // If user is a teacher, show their assignments
        if (req.user.role === 'teacher') {
            return getTeacherAssignments(req, res);
        }
        
        // If user is a student, show their assigned assignments
        if (req.user.role === 'student') {
            return getStudentAssignments(req, res);
        }

        // For admin users, show all assignments
        if (req.user.role === 'admin') {
            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            const [assignments, total] = await Promise.all([
                Assignment.find()
                    .populate('teacherId', 'firstName lastName')
                    .populate('lessonId', 'title')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Assignment.countDocuments()
            ]);

            return sendResponse(res, 200, 'success', 'All assignments retrieved successfully', {
                assignments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }

        sendResponse(res, 403, 'error', 'Access denied', null);
    } catch (error) {
        console.error('Get assignments error:', error);
        sendResponse(res, 500, 'error', 'Failed to retrieve assignments', null);
    }
};

// Get assignments for a teacher
const getTeacherAssignments = async (req, res) => {
    try {
        const teacherId = req.user.userId;
        const { page = 1, limit = 10, status = 'all' } = req.query;

        const skip = (page - 1) * limit;
        const query = { teacherId };

        if (status !== 'all') {
            query.isActive = status === 'active';
        }

        const [assignments, total] = await Promise.all([
            Assignment.find(query)
                .populate('lessonId', 'title')
                .populate({
                    path: 'submissions',
                    populate: {
                        path: 'studentId',
                        select: 'firstName lastName'
                    }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Assignment.countDocuments(query)
        ]);

        // Get all students assigned to this teacher for "all students" assignments
        const teacherStudents = await TeacherStudent.find({ teacherId })
            .select('studentId');
        const allStudentIds = teacherStudents.map(ts => ts.studentId);

        const assignmentsWithStats = assignments.map(assignment => {
            // If assignedTo is empty, it means "all students"
            const totalAssigned = assignment.assignedTo && assignment.assignedTo.length > 0
                ? assignment.assignedTo.length
                : allStudentIds.length;
            
            const submissions = assignment.submissions || [];
            const submissionStats = {
                total: totalAssigned,
                submitted: submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
                graded: submissions.filter(s => s.status === 'graded').length,
                pending: submissions.filter(s => s.status === 'submitted').length
            };

            return {
                ...(assignment.toObject ? assignment.toObject() : assignment),
                submissionStats
            };
        });

        sendResponse(res, 200, 'success', 'Assignments retrieved successfully', {
            assignments: assignmentsWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get teacher assignments error:', error);
        sendResponse(res, 500, 'error', 'Failed to retrieve assignments', null);
    }
};

// Get assignments for a student
const getStudentAssignments = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { page = 1, limit = 10, status = 'all' } = req.query;

        const skip = (page - 1) * limit;
        
        // Find assignments where the student is assigned
        // Empty assignedTo array means "all students assigned to teacher"
        
        // First, get the teacher IDs this student is assigned to
        const teacherAssignments = await TeacherStudent.find({ studentId })
            .select('teacherId');
        const teacherIds = teacherAssignments.map(ta => ta.teacherId);

        // Build query: assignment is for this student if:
        // 1. assignedTo contains the studentId, OR
        // 2. assignedTo is empty AND the assignment's teacherId is in the student's teacher list
        const query = {
            isActive: true,
            $or: [
                // Assignment specifically assigned to this student
                { assignedTo: studentId },
                // Assignment assigned to all students (empty array) AND teacher matches
                {
                    $and: [
                        { assignedTo: { $size: 0 } },
                        { teacherId: { $in: teacherIds } }
                    ]
                }
            ]
        };

        const [assignments, total] = await Promise.all([
            Assignment.find(query)
                .populate('teacherId', 'firstName lastName')
                .populate('lessonId', 'title')
                .populate({
                    path: 'submissions',
                    match: { studentId },
                    select: '-password'
                })
                .sort({ dueDate: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Assignment.countDocuments(query)
        ]);

        const assignmentsWithSubmission = assignments.map(assignment => {
            const submissions = assignment.submissions || [];
            const submission = submissions.length > 0 ? submissions[0] : null;
            const isOverdue = new Date(assignment.dueDate) < new Date() && (!submission || submission.status === 'draft');
            
            return {
                ...(assignment.toObject ? assignment.toObject() : assignment),
                submission,
                isOverdue,
                daysUntilDue: Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
            };
        });

        // Filter by status if specified
        let filteredAssignments = assignmentsWithSubmission;
        if (status !== 'all') {
            filteredAssignments = assignmentsWithSubmission.filter(assignment => {
                switch (status) {
                    case 'pending':
                        return !assignment.submission || assignment.submission.status === 'draft';
                    case 'submitted':
                        return assignment.submission && assignment.submission.status === 'submitted';
                    case 'graded':
                        return assignment.submission && assignment.submission.status === 'graded';
                    case 'overdue':
                        return assignment.isOverdue;
                    default:
                        return true;
                }
            });
        }

        sendResponse(res, 200, 'success', 'Assignments retrieved successfully', {
            assignments: filteredAssignments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get student assignments error:', error);
        sendResponse(res, 500, 'error', 'Failed to retrieve assignments', null);
    }
};

// Update assignment
const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.userId;

        const assignment = await Assignment.findOne({
            _id: id,
            teacherId
        });

        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found or you do not have permission to edit it');
        }

        Object.assign(assignment, req.body);
        await assignment.save();

        const assignmentWithDetails = await Assignment.findById(assignment._id)
            .populate('teacherId', 'firstName lastName')
            .populate('lessonId', 'title');

        sendResponse(res, 200, 'success', 'Assignment updated successfully', assignmentWithDetails);
    } catch (error) {
        console.error('Update assignment error:', error);
        sendResponse(res, 500, 'error', 'Failed to update assignment', null);
    }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.userId;

        const assignment = await Assignment.findOne({
            _id: id,
            teacherId
        });

        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found or you do not have permission to delete it');
        }

        assignment.isActive = false;
        await assignment.save();

        sendResponse(res, 200, 'success', 'Assignment deleted successfully');
    } catch (error) {
        console.error('Delete assignment error:', error);
        sendResponse(res, 500, 'error', 'Failed to delete assignment', null);
    }
};

// Get assignment by ID
const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const assignment = await Assignment.findById(id)
            .populate('teacherId', 'firstName lastName')
            .populate('lessonId', 'title')
            .populate({
                path: 'submissions',
                populate: {
                    path: 'studentId',
                    select: 'firstName lastName'
                }
            });

        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found');
        }

        // Check permissions
        if (userRole === 'student') {
            // Check if assignment is assigned to this student
            const isAssigned = assignment.assignedTo && assignment.assignedTo.length > 0
                ? assignment.assignedTo.includes(userId)
                : false;
            
            // If not specifically assigned, check if it's "all students" and student is assigned to teacher
            if (!isAssigned) {
                if (assignment.assignedTo && assignment.assignedTo.length === 0) {
                    // Empty array means "all students" - check if student is assigned to this teacher
                    const teacherStudent = await TeacherStudent.findOne({
                        studentId: userId,
                        teacherId: assignment.teacherId
                    });
                    if (!teacherStudent) {
                        return sendResponse(res, 403, 'error', 'You do not have permission to view this assignment');
                    }
                } else {
                    return sendResponse(res, 403, 'error', 'You do not have permission to view this assignment');
                }
            }
        } else if (userRole === 'teacher' && assignment.teacherId.toString() !== userId.toString()) {
            return sendResponse(res, 403, 'error', 'You do not have permission to view this assignment');
        }

        sendResponse(res, 200, 'success', 'Assignment retrieved successfully', assignment);
    } catch (error) {
        console.error('Get assignment by ID error:', error);
        sendResponse(res, 500, 'error', 'Failed to retrieve assignment', null);
    }
};

module.exports = {
    createAssignment,
    getAssignments,
    getTeacherAssignments,
    getStudentAssignments,
    updateAssignment,
    deleteAssignment,
    getAssignmentById
};
