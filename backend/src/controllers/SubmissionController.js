/* eslint-disable no-undef */
const { Submission, Assignment, Teacher, Student } = require('../models');
const { sendResponse } = require('../utils/response');

// Create a submission
const createSubmission = async (req, res) => {
    try {
        const { assignmentId, content, attachments } = req.body;
        const studentId = req.user.userId;

        // Validate that the user is a student
        if (req.user.role !== 'student') {
            return sendResponse(res, 403, 'error', 'Only students can submit assignments');
        }

        // Check if assignment exists and student is assigned
        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found');
        }

        // Check if student is assigned to this assignment
        if (!assignment.assignedTo.includes(studentId)) {
            return sendResponse(res, 403, 'error', 'You are not assigned to this assignment');
        }

        // Check if submission already exists
        const existingSubmission = await Submission.findOne({
            where: { assignmentId, studentId }
        });

        if (existingSubmission) {
            return sendResponse(res, 409, 'error', 'Submission already exists. Use update endpoint instead.');
        }

        const submission = await Submission.create({
            assignmentId,
            studentId,
            content,
            attachments: attachments || [],
            status: 'submitted',
            submittedAt: new Date()
        });

        const submissionWithDetails = await Submission.findByPk(submission.id, {
            include: [
                { model: Assignment, as: 'assignment', attributes: ['id', 'title', 'dueDate', 'maxPoints'] },
                { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        sendResponse(res, 201, 'success', 'Submission created successfully', submissionWithDetails);
    } catch (error) {
        console.error('Create submission error:', error);
        sendResponse(res, 500, 'error', 'Failed to create submission', null);
    }
};

// Update a submission
const updateSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, attachments } = req.body;
        const studentId = req.user.userId;

        const submission = await Submission.findOne({
            where: { id, studentId }
        });

        if (!submission) {
            return sendResponse(res, 404, 'error', 'Submission not found or you do not have permission to edit it');
        }

        if (submission.status === 'graded') {
            return sendResponse(res, 400, 'error', 'Cannot update a graded submission');
        }

        await submission.update({
            content,
            attachments: attachments || submission.attachments,
            submittedAt: new Date()
        });

        const updatedSubmission = await Submission.findByPk(submission.id, {
            include: [
                { model: Assignment, as: 'assignment', attributes: ['id', 'title', 'dueDate', 'maxPoints'] },
                { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        sendResponse(res, 200, 'success', 'Submission updated successfully', updatedSubmission);
    } catch (error) {
        console.error('Update submission error:', error);
        sendResponse(res, 500, 'error', 'Failed to update submission', null);
    }
};

// Grade a submission (teacher only)
const gradeSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { score, feedback, comments } = req.body;
        const graderId = req.user.userId;

        if (req.user.role !== 'teacher') {
            return sendResponse(res, 403, 'error', 'Only teachers can grade submissions');
        }

        const submission = await Submission.findByPk(id, {
            include: [
                { model: Assignment, as: 'assignment' }
            ]
        });

        if (!submission) {
            return sendResponse(res, 404, 'error', 'Submission not found');
        }

        // Check if teacher is the one who created the assignment
        if (submission.assignment.teacherId !== graderId) {
            return sendResponse(res, 403, 'error', 'You can only grade submissions for your assignments');
        }

        if (score > submission.assignment.maxPoints) {
            return sendResponse(res, 400, 'error', `Score cannot exceed maximum points (${submission.assignment.maxPoints})`);
        }

        await submission.update({
            score,
            feedback,
            comments,
            status: 'graded',
            gradedAt: new Date(),
            gradedBy: graderId
        });

        const gradedSubmission = await Submission.findByPk(submission.id, {
            include: [
                { model: Assignment, as: 'assignment', attributes: ['id', 'title', 'maxPoints'] },
                { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
                { model: Teacher, as: 'grader', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        sendResponse(res, 200, 'success', 'Submission graded successfully', gradedSubmission);
    } catch (error) {
        console.error('Grade submission error:', error);
        sendResponse(res, 500, 'error', 'Failed to grade submission', null);
    }
};

// Get submissions for a teacher
const getTeacherSubmissions = async (req, res) => {
    try {
        const teacherId = req.user.userId;
        const { page = 1, limit = 10, status = 'all', assignmentId } = req.query;

        if (req.user.role !== 'teacher') {
            return sendResponse(res, 403, 'error', 'Only teachers can view submissions');
        }

        const offset = (page - 1) * limit;
        const whereClause = {};

        if (status !== 'all') {
            whereClause.status = status;
        }

        if (assignmentId) {
            whereClause.assignmentId = assignmentId;
        }

        // Get submissions for assignments created by this teacher
        const submissions = await Submission.findAndCountAll({
            where: whereClause,
            include: [
                { 
                    model: Assignment, 
                    as: 'assignment',
                    where: { teacherId },
                    attributes: ['id', 'title', 'dueDate', 'maxPoints']
                },
                { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['submittedAt', 'DESC']]
        });

        sendResponse(res, 200, 'success', 'Submissions retrieved successfully', {
            submissions: submissions.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: submissions.count,
                pages: Math.ceil(submissions.count / limit)
            }
        });
    } catch (error) {
        console.error('Get teacher submissions error:', error);
        sendResponse(res, 500, 'error', 'Failed to retrieve submissions', null);
    }
};

// Get submissions for a student
const getStudentSubmissions = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { page = 1, limit = 10, status = 'all', assignmentId } = req.query;

        if (req.user.role !== 'student') {
            return sendResponse(res, 403, 'error', 'Only students can view their submissions');
        }

        const offset = (page - 1) * limit;
        const whereClause = { studentId };

        if (status !== 'all') {
            whereClause.status = status;
        }

        if (assignmentId) {
            whereClause.assignmentId = assignmentId;
        }

        const submissions = await Submission.findAndCountAll({
            where: whereClause,
            include: [
                { 
                    model: Assignment, 
                    as: 'assignment',
                    attributes: ['id', 'title', 'dueDate', 'maxPoints'],
                    include: [
                        { model: Teacher, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['submittedAt', 'DESC']]
        });

        sendResponse(res, 200, 'success', 'Submissions retrieved successfully', {
            submissions: submissions.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: submissions.count,
                pages: Math.ceil(submissions.count / limit)
            }
        });
    } catch (error) {
        console.error('Get student submissions error:', error);
        sendResponse(res, 500, 'error', 'Failed to retrieve submissions', null);
    }
};

// Get submission by ID
const getSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const submission = await Submission.findByPk(id, {
            include: [
                { 
                    model: Assignment, 
                    as: 'assignment',
                    attributes: ['id', 'title', 'dueDate', 'maxPoints', 'teacherId'],
                    include: [
                        { model: Teacher, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] }
                    ]
                },
                { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
                { model: Teacher, as: 'grader', attributes: ['id', 'firstName', 'lastName'], required: false }
            ]
        });

        if (!submission) {
            return sendResponse(res, 404, 'error', 'Submission not found');
        }

        // Check permissions
        const canView = (
            (userRole === 'student' && submission.studentId === userId) ||
            (userRole === 'teacher' && submission.assignment.teacherId === userId) ||
            userRole === 'admin'
        );

        if (!canView) {
            return sendResponse(res, 403, 'error', 'You do not have permission to view this submission');
        }

        sendResponse(res, 200, 'success', 'Submission retrieved successfully', submission);
    } catch (error) {
        console.error('Get submission by ID error:', error);
        sendResponse(res, 500, 'error', 'Failed to retrieve submission', null);
    }
};

module.exports = {
    createSubmission,
    updateSubmission,
    gradeSubmission,
    getTeacherSubmissions,
    getStudentSubmissions,
    getSubmissionById
};
