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
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found');
        }

        // Check if student is assigned to this assignment
        const studentIdStr = studentId.toString();
        const assignedToIds = assignment.assignedTo.map(id => id.toString());
        if (assignment.assignedTo.length > 0 && !assignedToIds.includes(studentIdStr)) {
            return sendResponse(res, 403, 'error', 'You are not assigned to this assignment');
        }

        // Check if submission already exists
        const existingSubmission = await Submission.findOne({
            assignmentId,
            studentId
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

        const submissionWithDetails = await Submission.findById(submission._id)
            .populate('assignmentId', 'title dueDate maxPoints')
            .populate('studentId', 'firstName lastName');

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
            _id: id,
            studentId
        });

        if (!submission) {
            return sendResponse(res, 404, 'error', 'Submission not found or you do not have permission to edit it');
        }

        if (submission.status === 'graded') {
            return sendResponse(res, 400, 'error', 'Cannot update a graded submission');
        }

        submission.content = content;
        if (attachments !== undefined) submission.attachments = attachments;
        submission.submittedAt = new Date();
        await submission.save();

        const updatedSubmission = await Submission.findById(submission._id)
            .populate('assignmentId', 'title dueDate maxPoints')
            .populate('studentId', 'firstName lastName');

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

        const submission = await Submission.findById(id)
            .populate('assignmentId');

        if (!submission) {
            return sendResponse(res, 404, 'error', 'Submission not found');
        }

        // Check if teacher is the one who created the assignment
        if (submission.assignmentId.teacherId.toString() !== graderId.toString()) {
            return sendResponse(res, 403, 'error', 'You can only grade submissions for your assignments');
        }

        if (score > submission.assignmentId.maxPoints) {
            return sendResponse(res, 400, 'error', `Score cannot exceed maximum points (${submission.assignmentId.maxPoints})`);
        }

        submission.score = score;
        submission.feedback = feedback;
        submission.comments = comments;
        submission.status = 'graded';
        submission.gradedAt = new Date();
        submission.gradedBy = graderId;
        await submission.save();

        const gradedSubmission = await Submission.findById(submission._id)
            .populate('assignmentId', 'title maxPoints')
            .populate('studentId', 'firstName lastName')
            .populate('gradedBy', 'firstName lastName');

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

        const skip = (page - 1) * limit;
        const query = {};

        if (status !== 'all') {
            query.status = status;
        }

        if (assignmentId) {
            query.assignmentId = assignmentId;
        }

        // Get submissions for assignments created by this teacher
        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .populate({
                    path: 'assignmentId',
                    match: { teacherId },
                    select: 'title dueDate maxPoints'
                })
                .populate('studentId', 'firstName lastName')
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Submission.countDocuments(query)
        ]);

        // Filter out submissions where assignment doesn't match teacherId
        const filteredSubmissions = submissions.filter(s => s.assignmentId && s.assignmentId.teacherId.toString() === teacherId.toString());

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

        const skip = (page - 1) * limit;
        const query = { studentId };

        if (status !== 'all') {
            query.status = status;
        }

        if (assignmentId) {
            query.assignmentId = assignmentId;
        }

        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .populate({
                    path: 'assignmentId',
                    select: 'title dueDate maxPoints',
                    populate: {
                        path: 'teacherId',
                        select: 'firstName lastName'
                    }
                })
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Submission.countDocuments(query)
        ]);

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

        const submission = await Submission.findById(id)
            .populate({
                path: 'assignmentId',
                select: 'title dueDate maxPoints teacherId',
                populate: {
                    path: 'teacherId',
                    select: 'firstName lastName'
                }
            })
            .populate('studentId', 'firstName lastName')
            .populate('gradedBy', 'firstName lastName');

        if (!submission) {
            return sendResponse(res, 404, 'error', 'Submission not found');
        }

        // Check permissions
        const canView = (
            (userRole === 'student' && submission.studentId.toString() === userId.toString()) ||
            (userRole === 'teacher' && submission.assignmentId.teacherId.toString() === userId.toString()) ||
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
