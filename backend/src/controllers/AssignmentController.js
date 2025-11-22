/* eslint-disable no-undef */
const { Assignment, Lesson, Submission, Teacher, Student, TeacherStudent } = require('../models');
const { sendResponse } = require('../utils/response');

/**
 * Helper function to build order clause for sorting
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - ASC or DESC
 * @returns {Array} Sequelize order clause
 */
const buildOrderClause = (sortBy, sortOrder) => {
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const validSortFields = ['createdAt', 'dueDate', 'title', 'assignmentType', 'maxPoints'];
    
    if (!validSortFields.includes(sortBy)) {
        return [['dueDate', 'ASC']];
    }

    switch (sortBy) {
        case 'dueDate':
            return [['dueDate', order]];
        case 'title':
            return [['title', order]];
        case 'assignmentType':
            return [['assignmentType', order]];
        case 'maxPoints':
            return [['maxPoints', order]];
        default:
            return [['createdAt', order]];
    }
};

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
        const { 
            page = 1, 
            limit = 10, 
            status = 'all',
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            assignmentType,
            gradeLevel,
            subject,
            completionStatus
        } = req.query;

        const offset = (page - 1) * limit;
        const { Op } = require('sequelize');
        const whereClause = { teacherId };

        // Filter by status
        if (status !== 'all') {
            whereClause.isActive = status === 'active';
        }

        // Filter by assignment type
        if (assignmentType) {
            whereClause.assignmentType = assignmentType;
        }

        // Filter by grade level (if lesson has grade info, or we can add it to assignment)
        // For now, we'll filter by lesson age group which correlates to grade
        const includeLesson = {
            model: Lesson,
            as: 'lesson',
            attributes: ['id', 'title', 'ageGroup'],
            required: false
        };

        if (gradeLevel) {
            includeLesson.where = { ageGroup: gradeLevel };
            includeLesson.required = true;
        }

        // Filter by subject (category from lesson)
        if (subject) {
            if (!includeLesson.where) includeLesson.where = {};
            includeLesson.where.category = subject;
            includeLesson.required = true;
        }

        // Build order clause
        let orderClause = [];
        const validSortFields = ['createdAt', 'dueDate', 'title', 'assignmentType', 'maxPoints'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        if (sortBy === 'dueDate') {
            orderClause = [['dueDate', order]];
        } else if (sortBy === 'title') {
            orderClause = [['title', order]];
        } else {
            orderClause = [[sortField, order]];
        }

        const assignments = await Assignment.findAndCountAll({
            where: whereClause,
            include: [
                includeLesson,
                { 
                    model: Submission, 
                    as: 'submissions',
                    include: [
                        { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName', 'grade'] }
                    ],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: orderClause,
            distinct: true // Important for count with includes
        });

        // Get all students assigned to this teacher for "all students" assignments
        const teacherStudents = await TeacherStudent.findAll({
            where: { teacherId },
            attributes: ['studentId']
        });
        const allStudentIds = teacherStudents.map(ts => ts.studentId);

        let assignmentsWithStats = assignments.rows.map(assignment => {
            // If assignedTo is empty, it means "all students"
            const totalAssigned = assignment.assignedTo && assignment.assignedTo.length > 0
                ? assignment.assignedTo.length
                : allStudentIds.length;
            
            const submitted = assignment.submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
            const graded = assignment.submissions.filter(s => s.status === 'graded').length;
            const pending = assignment.submissions.filter(s => s.status === 'submitted').length;
            
            const submissionStats = {
                total: totalAssigned,
                submitted,
                graded,
                pending,
                notSubmitted: totalAssigned - submitted
            };

            // Determine completion status
            let completionStatus = 'not_started';
            if (graded === totalAssigned && totalAssigned > 0) {
                completionStatus = 'all_graded';
            } else if (submitted === totalAssigned && totalAssigned > 0) {
                completionStatus = 'all_submitted';
            } else if (submitted > 0) {
                completionStatus = 'partial';
            }

            return {
                ...assignment.toJSON(),
                submissionStats,
                completionStatus
            };
        });

        // Filter by completion status if specified
        if (completionStatus) {
            assignmentsWithStats = assignmentsWithStats.filter(assignment => 
                assignment.completionStatus === completionStatus
            );
        }

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
        const { 
            page = 1, 
            limit = 10, 
            status = 'all',
            sortBy = 'dueDate',
            sortOrder = 'ASC',
            assignmentType,
            subject,
            completionStatus
        } = req.query;

        const offset = (page - 1) * limit;
        
        // Find assignments where the student is assigned
        // Empty assignedTo array means "all students assigned to teacher"
        const { Op } = require('sequelize');
        
        console.log('🔍 Fetching assignments for student:', studentId);
        
        // First, get the teacher IDs this student is assigned to
        const teacherAssignments = await TeacherStudent.findAll({
            where: { studentId },
            attributes: ['teacherId']
        });
        const teacherIds = teacherAssignments.map(ta => ta.teacherId);
        
        console.log('👩‍🏫 Student teachers:', teacherIds);

        // If student has no teachers, return empty result
        if (teacherIds.length === 0) {
            console.log('⚠️ Student has no assigned teachers');
            return sendResponse(res, 200, 'success', 'No assignments found', {
                assignments: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0
                }
            });
        }

        console.log('📋 Fetching assignments from teachers...');
        
        // Fetch all active assignments from student's teachers
        const assignments = await Assignment.findAll({
            where: {
                teacherId: { [Op.in]: teacherIds },
                isActive: true
            },
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
                { 
                    model: Lesson, 
                    as: 'lesson', 
                    attributes: ['id', 'title', 'category', 'ageGroup'],
                    required: false,
                    ...(subject ? { where: { category: subject } } : {})
                },
                { 
                    model: Submission, 
                    as: 'submissions',
                    where: { studentId },
                    required: false
                }
            ],
            order: buildOrderClause(sortBy, sortOrder)
        });
        
        console.log(`✅ Found ${assignments.length} total assignments from teachers`);
        
        // Debug: Log raw data for first assignment
        if (assignments.length > 0) {
            console.log('🔍 First assignment raw data:', {
                id: assignments[0].id,
                assignedTo: assignments[0].assignedTo,
                assignedToType: typeof assignments[0].assignedTo,
                dataValues: assignments[0].dataValues.assignedTo,
                dataValuesType: typeof assignments[0].dataValues.assignedTo
            });
        }

        // Filter assignments - include if:
        // 1. assignedTo array is empty (all students), OR
        // 2. assignedTo array includes this studentId
        let filteredByStudent = assignments.filter(assignment => {
            // Get assignedTo - it might be a string that needs parsing
            let assignedTo = assignment.assignedTo;
            
            // If it's a string, parse it
            if (typeof assignedTo === 'string') {
                try {
                    assignedTo = JSON.parse(assignedTo);
                } catch (err) {
                    console.error(`Failed to parse assignedTo for assignment ${assignment.id}:`, assignedTo, err.message);
                    assignedTo = [];
                }
            }
            
            // Ensure it's an array
            if (!Array.isArray(assignedTo)) {
                assignedTo = [];
            }
            
            console.log(`Assignment ${assignment.id}: assignedTo =`, assignedTo, `(type: ${typeof assignment.assignedTo})`);
            
            // Empty array means "all students"
            if (assignedTo.length === 0) {
                console.log(`  ✓ Assignment ${assignment.id} is for all students`);
                return true;
            }
            
            // Check if student is in the assignedTo array
            const isAssigned = assignedTo.includes(studentId);
            console.log(`  ${isAssigned ? '✓' : '✗'} Assignment ${assignment.id} student ${studentId} in array:`, isAssigned);
            return isAssigned;
        });
        
        console.log(`📝 Filtered to ${filteredByStudent.length} assignments for this student`);

        // Filter by assignment type
        if (assignmentType) {
            filteredByStudent = filteredByStudent.filter(a => a.assignmentType === assignmentType);
        }

        // Apply pagination manually
        const paginatedAssignments = filteredByStudent.slice(offset, offset + parseInt(limit));

        const assignmentsWithSubmission = paginatedAssignments.map(assignment => {
            const submission = assignment.submissions.length > 0 ? assignment.submissions[0] : null;
            const isOverdue = new Date(assignment.dueDate) < new Date() && (!submission || submission.status === 'draft');
            
            // Determine completion status
            let compStatus = 'not_started';
            if (submission) {
                if (submission.status === 'graded') {
                    compStatus = 'graded';
                } else if (submission.status === 'submitted') {
                    compStatus = 'submitted';
                } else {
                    compStatus = 'draft';
                }
            }
            
            return {
                ...assignment.toJSON(),
                submission,
                isOverdue,
                completionStatus: compStatus,
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

        // Filter by completion status
        if (completionStatus) {
            filteredAssignments = filteredAssignments.filter(assignment => 
                assignment.completionStatus === completionStatus
            );
        }
        
        console.log(`🎯 Returning ${filteredAssignments.length} assignments to student`);

        sendResponse(res, 200, 'success', 'Assignments retrieved successfully', {
            assignments: filteredAssignments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredByStudent.length,
                pages: Math.ceil(filteredByStudent.length / limit)
            }
        });
    } catch (error) {
        console.error('❌ Get student assignments error:', error);
        console.error('Error stack:', error.stack);
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
