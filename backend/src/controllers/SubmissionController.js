/* eslint-disable no-undef */
const { Submission, Assignment, Teacher, Student } = require('../models');
const { sendResponse } = require('../utils/response');

/**
 * Helper function to get grade letter from percentage
 * @param {number} percentage - Score percentage
 * @returns {string} Grade letter
 */
const getGradeLetter = (percentage) => {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
};

// Create a submission
const createSubmission = async (req, res) => {
    try {
        const { assignmentId, content, attachments, status } = req.body;
        const studentId = req.user.userId || req.user.id;

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
        
        // If assignedTo is empty, check if student is assigned to the teacher
        if (assignment.assignedTo.length > 0 && !assignedToIds.includes(studentIdStr)) {
            return sendResponse(res, 403, 'error', 'You are not assigned to this assignment');
        } else if (assignment.assignedTo.length === 0) {
            // Empty array means "all students" - check if student is assigned to this teacher
            const TeacherStudent = require('../models/TeacherStudent');
            const teacherStudent = await TeacherStudent.findOne({
                studentId: studentId,
                teacherId: assignment.teacherId
            });
            if (!teacherStudent) {
                return sendResponse(res, 403, 'error', 'You are not assigned to this assignment');
            }
        }

        // Check if submission already exists
        const existingSubmission = await Submission.findOne({
            assignmentId,
            studentId
        });

        if (existingSubmission) {
            return sendResponse(res, 409, 'error', 'Submission already exists. Use update endpoint instead.');
        }

        // Determine submission status - default to 'draft' unless explicitly 'submitted'
        const submissionStatus = status === 'submitted' ? 'submitted' : 'draft';
        const submittedAt = submissionStatus === 'submitted' ? new Date() : null;

        const submission = await Submission.create({
            assignmentId,
            studentId,
            content,
            attachments: attachments || [],
            status: submissionStatus,
            submittedAt: submittedAt
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
        const studentId = req.user.userId || req.user.id;

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
        
        // If status is being updated to 'submitted', set submittedAt
        if (req.body.status === 'submitted' && submission.status !== 'submitted') {
            submission.status = 'submitted';
            submission.submittedAt = new Date();
        }
        
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
        const { score, feedback } = req.body;
        const graderId = req.user.userId || req.user.id;

        // Validate role
        if (req.user.role !== 'teacher') {
            return sendResponse(res, 403, 'error', 'Only teachers can grade submissions');
        }

        // Validate score
        if (score === undefined || score === null) {
            return sendResponse(res, 400, 'error', 'Score is required');
        }

        const scoreValue = parseFloat(score);
        if (isNaN(scoreValue) || scoreValue < 0) {
            return sendResponse(res, 400, 'error', 'Score must be a valid non-negative number');
        }

        // Get submission with assignment
        const submission = await Submission.findById(id)
            .populate('assignmentId', 'maxPoints teacherId');

        if (!submission) {
            return sendResponse(res, 404, 'error', 'Submission not found');
        }

        const assignment = submission.assignmentId;
        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found');
        }

        // Check teacher permission
        const assignmentTeacherId = assignment.teacherId.toString();
        const graderIdStr = graderId.toString();
        if (assignmentTeacherId !== graderIdStr) {
            return sendResponse(res, 403, 'error', 'You can only grade submissions for your assignments');
        }

        // Validate score against max points
        if (scoreValue > assignment.maxPoints) {
            return sendResponse(res, 400, 'error', `Score cannot exceed maximum points (${assignment.maxPoints})`);
        }

        // Calculate percentage
        const percentage = (scoreValue / assignment.maxPoints) * 100;
        const gradeLetter = getGradeLetter(percentage);

        // Prepare feedback - handle empty string as null
        const finalFeedback = (feedback && feedback.trim()) ? feedback.trim().substring(0, 5000) : null;

        // Update submission
        submission.score = scoreValue;
        submission.feedback = finalFeedback;
        submission.status = 'graded';
        submission.gradedAt = new Date();
        submission.gradedBy = graderId;
        await submission.save();

        // Get updated submission with populated data
        const updatedSubmission = await Submission.findById(id)
            .populate('assignmentId', 'title dueDate maxPoints')
            .populate('studentId', 'firstName lastName')
            .populate('gradedBy', 'firstName lastName');

        const submissionObj = updatedSubmission.toObject ? updatedSubmission.toObject() : updatedSubmission;

        return sendResponse(res, 200, 'success', 'Submission graded successfully', {
            ...submissionObj,
            percentage: parseFloat(percentage.toFixed(2)),
            gradeLetter: gradeLetter
        });
        
    } catch (error) {
        console.error('Grade submission error:', error);
        return sendResponse(res, 500, 'error', `Failed to grade submission: ${error.message}`);
    }
};

// Get submissions for a teacher
const getTeacherSubmissions = async (req, res) => {
    try {
        const teacherId = req.user.userId || req.user.id;
        const { 
            page = 1, 
            limit = 10, 
            status = 'all', 
            assignmentId,
            studentId,
            sortBy = 'submittedAt',
            sortOrder = 'DESC',
            graded = 'all' // 'all', 'graded', 'ungraded'
        } = req.query;

        if (req.user.role !== 'teacher') {
            return sendResponse(res, 403, 'error', 'Only teachers can view submissions');
        }

        const skip = (page - 1) * limit;

        // First, get all assignment IDs for this teacher
        const assignments = await Assignment.find({ teacherId }).select('_id');
        const assignmentIds = assignments.map(a => a._id);

        if (assignmentIds.length === 0) {
            return sendResponse(res, 200, 'success', 'Submissions retrieved successfully', {
                submissions: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0
                }
            });
        }

        // Build query
        const query = { assignmentId: { $in: assignmentIds } };

        // Filter by assignment
        if (assignmentId) {
            query.assignmentId = assignmentId;
        }

        // Filter by student
        if (studentId) {
            query.studentId = studentId;
        }

        // Filter by status
        if (status !== 'all') {
            query.status = status;
        }

        // Filter by graded status
        if (graded === 'graded') {
            query.status = 'graded';
        } else if (graded === 'ungraded') {
            query.status = { $in: ['submitted', 'draft'] };
        }

        // Build sort
        const sortOptions = {};
        const validSortFields = ['submittedAt', 'gradedAt', 'score', 'status', 'createdAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';
        const order = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;
        sortOptions[sortField] = order;

        // Fetch submissions
        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .populate('assignmentId', 'title dueDate maxPoints assignmentType')
                .populate('studentId', 'firstName lastName email grade')
                .populate('gradedBy', 'firstName lastName')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Submission.countDocuments(query)
        ]);

        // Enhance submissions with calculated fields
        const enhancedSubmissions = submissions.map(submission => {
            const submissionObj = submission.toObject ? submission.toObject() : submission;
            if (submissionObj.score !== null && submissionObj.assignmentId && submissionObj.assignmentId.maxPoints) {
                submissionObj.percentage = ((submissionObj.score / submissionObj.assignmentId.maxPoints) * 100).toFixed(2);
                submissionObj.gradeLetter = getGradeLetter(parseFloat(submissionObj.percentage));
            }
            return submissionObj;
        });

        sendResponse(res, 200, 'success', 'Submissions retrieved successfully', {
            submissions: enhancedSubmissions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
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
