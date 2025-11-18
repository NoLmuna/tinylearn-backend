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
                where: { id: lessonId, teacherId }
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

        const assignmentWithDetails = await Assignment.findByPk(assignment.id, {
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
                { model: Lesson, as: 'lesson', attributes: ['id', 'title'] }
            ]
        });

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
            const offset = (page - 1) * limit;

            const assignments = await Assignment.findAndCountAll({
                include: [
                    { model: Teacher, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
                    { model: Lesson, as: 'lesson', attributes: ['id', 'title'] }
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']]
            });

            return sendResponse(res, 200, 'success', 'All assignments retrieved successfully', {
                assignments: assignments.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: assignments.count,
                    pages: Math.ceil(assignments.count / limit)
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

        const offset = (page - 1) * limit;
        const whereClause = { teacherId };

        if (status !== 'all') {
            whereClause.isActive = status === 'active';
        }

        const assignments = await Assignment.findAndCountAll({
            where: whereClause,
            include: [
                { model: Lesson, as: 'lesson', attributes: ['id', 'title'] },
                { 
                    model: Submission, 
                    as: 'submissions',
                    include: [
                        { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        // Get all students assigned to this teacher for "all students" assignments
        const teacherStudents = await TeacherStudent.findAll({
            where: { teacherId },
            attributes: ['studentId']
        });
        const allStudentIds = teacherStudents.map(ts => ts.studentId);

        const assignmentsWithStats = assignments.rows.map(assignment => {
            // If assignedTo is empty, it means "all students"
            const totalAssigned = assignment.assignedTo && assignment.assignedTo.length > 0
                ? assignment.assignedTo.length
                : allStudentIds.length;
            
            const submissionStats = {
                total: totalAssigned,
                submitted: assignment.submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
                graded: assignment.submissions.filter(s => s.status === 'graded').length,
                pending: assignment.submissions.filter(s => s.status === 'submitted').length
            };

            return {
                ...assignment.toJSON(),
                submissionStats
            };
        });

        sendResponse(res, 200, 'success', 'Assignments retrieved successfully', {
            assignments: assignmentsWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: assignments.count,
                pages: Math.ceil(assignments.count / limit)
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

        const offset = (page - 1) * limit;
        
        // Find assignments where the student is assigned
        // Empty assignedTo array means "all students assigned to teacher"
        const { Op } = require('sequelize');
        
        // First, get the teacher IDs this student is assigned to
        const teacherAssignments = await TeacherStudent.findAll({
            where: { studentId },
            attributes: ['teacherId']
        });
        const teacherIds = teacherAssignments.map(ta => ta.teacherId);

        // Build query: assignment is for this student if:
        // 1. assignedTo contains the studentId, OR
        // 2. assignedTo is empty AND the assignment's teacherId is in the student's teacher list
        const assignments = await Assignment.findAndCountAll({
            where: {
                [Op.and]: [
                    { isActive: true },
                    {
                        [Op.or]: [
                            // Assignment specifically assigned to this student
                            Assignment.sequelize.where(
                                Assignment.sequelize.fn('JSON_CONTAINS', 
                                    Assignment.sequelize.col('assigned_to'), 
                                    JSON.stringify(studentId)
                                ), 
                                true
                            ),
                            // Assignment assigned to all students (empty array) AND teacher matches
                            {
                                [Op.and]: [
                                    Assignment.sequelize.where(
                                        Assignment.sequelize.fn('JSON_LENGTH',
                                            Assignment.sequelize.col('assigned_to')
                                        ),
                                        0
                                    ),
                                    { teacherId: { [Op.in]: teacherIds } }
                                ]
                            }
                        ]
                    }
                ]
            },
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
                { model: Lesson, as: 'lesson', attributes: ['id', 'title'] },
                { 
                    model: Submission, 
                    as: 'submissions',
                    where: { studentId },
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['dueDate', 'ASC']]
        });

        const assignmentsWithSubmission = assignments.rows.map(assignment => {
            const submission = assignment.submissions.length > 0 ? assignment.submissions[0] : null;
            const isOverdue = new Date(assignment.dueDate) < new Date() && (!submission || submission.status === 'draft');
            
            return {
                ...assignment.toJSON(),
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
                total: assignments.count,
                pages: Math.ceil(assignments.count / limit)
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
            where: { id, teacherId }
        });

        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found or you do not have permission to edit it');
        }

        const updatedAssignment = await assignment.update(req.body);

        const assignmentWithDetails = await Assignment.findByPk(updatedAssignment.id, {
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
                { model: Lesson, as: 'lesson', attributes: ['id', 'title'] }
            ]
        });

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
            where: { id, teacherId }
        });

        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found or you do not have permission to delete it');
        }

        await assignment.update({ isActive: false });

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

        const assignment = await Assignment.findByPk(id, {
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
                { model: Lesson, as: 'lesson', attributes: ['id', 'title'] },
                { 
                    model: Submission, 
                    as: 'submissions',
                    include: [
                        { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] }
                    ]
                }
            ]
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
                        where: { studentId: userId, teacherId: assignment.teacherId }
                    });
                    if (!teacherStudent) {
                        return sendResponse(res, 403, 'error', 'You do not have permission to view this assignment');
                    }
                } else {
                    return sendResponse(res, 403, 'error', 'You do not have permission to view this assignment');
                }
            }
        } else if (userRole === 'teacher' && assignment.teacherId !== userId) {
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
