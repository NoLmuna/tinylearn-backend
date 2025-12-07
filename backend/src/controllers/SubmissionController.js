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

// Grade a submission (teacher only) - Simplified and fixed
const gradeSubmission = async (req, res) => {
    console.log('\n===========================================');
    console.log('[GradeSubmission] ⚡ FUNCTION CALLED');
    console.log('[GradeSubmission] Params:', req.params);
    console.log('[GradeSubmission] Body:', req.body);
    console.log('[GradeSubmission] User:', req.user);
    console.log('===========================================\n');
    
    const startTime = Date.now();
    
    try {
        const { id } = req.params;
        const { score, feedback } = req.body;
        const graderId = req.user.userId;

        console.log(`[GradeSubmission] 🎯 Processing - submissionId=${id}, score=${score}, graderId=${graderId}`);

        // Validate role
        if (req.user.role !== 'teacher') {
            console.log('[GradeSubmission] ❌ Access denied - not a teacher');
            return sendResponse(res, 403, 'error', 'Only teachers can grade submissions');
        }

        // Validate score
        if (score === undefined || score === null) {
            console.log('[GradeSubmission] ❌ Score is missing');
            return sendResponse(res, 400, 'error', 'Score is required');
        }

        const scoreValue = parseFloat(score);
        if (isNaN(scoreValue) || scoreValue < 0) {
            console.log('[GradeSubmission] ❌ Invalid score value');
            return sendResponse(res, 400, 'error', 'Score must be a valid non-negative number');
        }

        console.log(`[GradeSubmission] 📊 Fetching submission...`);
        const fetchStart = Date.now();
        
        // Get submission with assignment
        const submissionToUpdate = await Submission.findByPk(parseInt(id), {
            include: [{
                model: Assignment,
                as: 'assignment',
                attributes: ['id', 'maxPoints', 'teacherId']
            }]
        });
        
        console.log(`[GradeSubmission] ✅ Fetch completed in ${Date.now() - fetchStart}ms`);

        if (!submissionToUpdate) {
            console.log('[GradeSubmission] ❌ Submission not found');
            return sendResponse(res, 404, 'error', 'Submission not found');
        }

        const assignment = submissionToUpdate.assignment;
        if (!assignment) {
            console.log('[GradeSubmission] ❌ Assignment not found');
            return sendResponse(res, 404, 'error', 'Assignment not found');
        }

        console.log(`[GradeSubmission] Assignment teacherId=${assignment.teacherId}, requesting graderId=${graderId}`);

        // Check teacher permission
        if (assignment.teacherId !== graderId) {
            console.log(`[GradeSubmission] ❌ Permission denied`);
            return sendResponse(res, 403, 'error', 'You can only grade submissions for your assignments');
        }

        // Validate score against max points
        if (scoreValue > assignment.maxPoints) {
            console.log(`[GradeSubmission] ❌ Score exceeds max`);
            return sendResponse(res, 400, 'error', `Score cannot exceed maximum points (${assignment.maxPoints})`);
        }

        // Calculate percentage
        const percentage = (scoreValue / assignment.maxPoints) * 100;
        const gradeLetter = getGradeLetter(percentage);

        // Prepare feedback - handle empty string as null
        const finalFeedback = (feedback && feedback.trim()) ? feedback.trim().substring(0, 5000) : null;

        console.log(`[GradeSubmission] 💾 Updating with score=${scoreValue}, feedback=${finalFeedback ? 'provided' : 'null'}`);
        const updateStart = Date.now();

        // Direct SQL update for reliability
        const [affectedRows] = await Submission.update(
            {
                score: scoreValue,
                feedback: finalFeedback,
                status: 'graded',
                gradedAt: new Date(),
                gradedBy: parseInt(graderId)
            },
            {
                where: { id: parseInt(id) }
            }
        );
        
        console.log(`[GradeSubmission] ✅ Update completed in ${Date.now() - updateStart}ms, affected ${affectedRows} row(s)`);

        // Build response
        const responseData = {
            id: parseInt(id),
            score: scoreValue,
            feedback: finalFeedback,
            status: 'graded',
            gradedAt: new Date().toISOString(),
            gradedBy: parseInt(graderId),
            percentage: parseFloat(percentage.toFixed(2)),
            gradeLetter: gradeLetter,
            maxPoints: assignment.maxPoints
        };

        console.log(`[GradeSubmission] 📤 Sending success response`);
        console.log(`[GradeSubmission] ✅ COMPLETED in ${Date.now() - startTime}ms\n`);
        
        return sendResponse(res, 200, 'success', 'Submission graded successfully', responseData);
        
    } catch (error) {
        console.error('[GradeSubmission] 💥 ERROR:', error.message);
        console.error('[GradeSubmission] Stack:', error.stack);
        console.error(`[GradeSubmission] Failed after ${Date.now() - startTime}ms\n`);
        
        // Prevent double response
        if (res.headersSent) {
            console.error('[GradeSubmission] ⚠️  Headers already sent');
            return;
        }
        
        // Handle specific errors
        if (error.name === 'SequelizeDatabaseError') {
            return sendResponse(res, 500, 'error', 'Database error while grading submission');
        }
        
        if (error.name === 'SequelizeValidationError') {
            return sendResponse(res, 400, 'error', `Validation error: ${error.message}`);
        }
        
        return sendResponse(res, 500, 'error', `Failed to grade submission: ${error.message}`);
    }
};

// Get submissions for a teacher - Enhanced with filtering and sorting
const getTeacherSubmissions = async (req, res) => {
    try {
        const teacherId = req.user.userId;
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

        const offset = (page - 1) * limit;
        const { Op } = require('sequelize');
        const whereClause = {};

        // Filter by status
        if (status !== 'all') {
            query.status = status;
        }

        // Filter by assignment
        if (assignmentId) {
            query.assignmentId = assignmentId;
        }

        // Filter by student
        if (studentId) {
            whereClause.studentId = studentId;
        }

        // Filter by graded status
        if (graded === 'graded') {
            whereClause.status = 'graded';
        } else if (graded === 'ungraded') {
            whereClause.status = { [Op.in]: ['submitted', 'draft'] };
        }

        // Build order clause
        let orderClause = [];
        const validSortFields = ['submittedAt', 'gradedAt', 'score', 'status'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        orderClause = [[sortField, order]];

        // Get submissions for assignments created by this teacher
        const submissions = await Submission.findAndCountAll({
            where: whereClause,
            include: [
                { 
                    model: Assignment, 
                    as: 'assignment',
                    where: { teacherId },
                    attributes: ['id', 'title', 'dueDate', 'maxPoints', 'assignmentType'],
                    required: true
                },
                { 
                    model: Student, 
                    as: 'student', 
                    attributes: ['id', 'firstName', 'lastName', 'email', 'grade']
                },
                { 
                    model: Teacher, 
                    as: 'grader', 
                    attributes: ['id', 'firstName', 'lastName'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: orderClause,
            distinct: true
        });

        // Enhance submissions with calculated fields
        const enhancedSubmissions = submissions.rows.map(submission => {
            const submissionData = submission.toJSON();
            if (submissionData.score !== null && submissionData.assignment) {
                submissionData.percentage = ((submissionData.score / submissionData.assignment.maxPoints) * 100).toFixed(2);
                submissionData.gradeLetter = getGradeLetter(parseFloat(submissionData.percentage));
            }
            return submissionData;
        });

        sendResponse(res, 200, 'success', 'Submissions retrieved successfully', {
            submissions: enhancedSubmissions,
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
