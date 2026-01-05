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
        const { title, description, lessonId, assignedTo, dueDate, maxPoints, assignmentType, attachments } = req.body;
        const teacherId = req.user.userId || req.user.id;

        // Validate that the user is a teacher
        if (req.user.role !== 'teacher') {
            return sendResponse(res, 403, 'error', 'Only teachers can create assignments');
        }

        // Validate required fields
        if (!title || !description || !dueDate) {
            return sendResponse(res, 400, 'error', 'Title, description, and due date are required');
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
        const teacherId = req.user.userId || req.user.id;
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

        const skip = (page - 1) * limit;
        
        // Build query
        const query = { teacherId };

        // Filter by status
        if (status !== 'all') {
            query.isActive = status === 'active';
        }

        // Filter by assignment type
        if (assignmentType) {
            query.assignmentType = assignmentType;
        }

        // Build sort
        const sortOptions = {};
        const validSortFields = ['createdAt', 'dueDate', 'title', 'assignmentType', 'maxPoints'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const order = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;
        sortOptions[sortField] = order;

        // Fetch assignments with populated lesson
        const assignments = await Assignment.find(query)
            .populate('lessonId', 'title ageGroup category')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Assignment.countDocuments(query);

        // Get all students assigned to this teacher for "all students" assignments
        const teacherStudents = await TeacherStudent.find({ teacherId })
            .select('studentId');
        const allStudentIds = teacherStudents.map(ts => {
            const studentId = ts.studentId;
            return studentId._id || studentId.id || studentId;
        });

        // Get submissions for these assignments
        const assignmentIds = assignments.map(a => a._id);
        const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
            .populate('studentId', 'firstName lastName grade');

        // Group submissions by assignment
        const submissionsByAssignment = {};
        submissions.forEach(sub => {
            const assignmentId = sub.assignmentId.toString();
            if (!submissionsByAssignment[assignmentId]) {
                submissionsByAssignment[assignmentId] = [];
            }
            submissionsByAssignment[assignmentId].push(sub);
        });

        // Build assignments with stats
        let assignmentsWithStats = assignments.map(assignment => {
            const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
            
            // If assignedTo is empty, it means "all students"
            const totalAssigned = assignment.assignedTo && assignment.assignedTo.length > 0
                ? assignment.assignedTo.length
                : allStudentIds.length;
            
            const assignmentSubmissions = submissionsByAssignment[assignment._id.toString()] || [];
            const submitted = assignmentSubmissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
            const graded = assignmentSubmissions.filter(s => s.status === 'graded').length;
            
            const submissionStats = {
                total: totalAssigned,
                submitted: submitted,
                graded: graded,
                pending: assignmentSubmissions.filter(s => s.status === 'submitted').length
            };

            // Determine completion status
            let compStatus = 'not_started';
            if (graded === totalAssigned && totalAssigned > 0) {
                compStatus = 'all_graded';
            } else if (submitted === totalAssigned && totalAssigned > 0) {
                compStatus = 'all_submitted';
            } else if (submitted > 0) {
                compStatus = 'partial';
            }

            return {
                ...assignmentObj,
                submissionStats,
                completionStatus: compStatus
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
        const studentId = req.user.userId || req.user.id;
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

        const skip = (page - 1) * limit;
        
        // Find assignments where the student is assigned
        // Empty assignedTo array means "all students assigned to teacher"
        
        console.log('🔍 Fetching assignments for student:', studentId);
        
        // First, get the teacher IDs this student is assigned to
        const teacherAssignments = await TeacherStudent.find({ studentId })
            .select('teacherId');
        const teacherIds = teacherAssignments.map(ta => {
            const teacherId = ta.teacherId;
            return teacherId._id || teacherId.id || teacherId;
        }).filter(Boolean);
        
        console.log('👩‍🏫 Student teachers:', teacherIds);

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
                .sort({ dueDate: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Assignment.countDocuments(query)
        ]);

        // Get submissions for these assignments
        const assignmentIds = assignments.map(a => a._id);
        const submissions = await Submission.find({ 
            assignmentId: { $in: assignmentIds },
            studentId: studentId
        });

        // Create a map of submissions by assignment ID
        const submissionsByAssignment = {};
        submissions.forEach(sub => {
            const assignmentId = sub.assignmentId.toString();
            submissionsByAssignment[assignmentId] = sub;
        });

        const assignmentsWithSubmission = assignments.map(assignment => {
            const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
            const submission = submissionsByAssignment[assignment._id.toString()] || null;
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
                ...assignmentObj,
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
                total,
                pages: Math.ceil(total / limit)
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
        const userId = req.user.userId || req.user.id;
        const userRole = req.user.role;

        const assignment = await Assignment.findById(id)
            .populate('teacherId', 'firstName lastName')
            .populate('lessonId', 'title');

        if (!assignment) {
            return sendResponse(res, 404, 'error', 'Assignment not found');
        }

        // Check permissions
        if (userRole === 'student') {
            const studentIdStr = userId.toString();
            const assignedToIds = assignment.assignedTo.map(id => id.toString());
            
            // Check if assignment is assigned to this student
            const isAssigned = assignment.assignedTo && assignment.assignedTo.length > 0
                ? assignedToIds.includes(studentIdStr)
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

            // Fetch student's submission for this assignment
            const submission = await Submission.findOne({
                assignmentId: id,
                studentId: userId
            });

            const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
            return sendResponse(res, 200, 'success', 'Assignment retrieved successfully', {
                ...assignmentObj,
                submission: submission || null
            });
        } else if (userRole === 'teacher') {
            const teacherIdStr = userId.toString();
            const assignmentTeacherIdStr = assignment.teacherId.toString();
            
            if (assignmentTeacherIdStr !== teacherIdStr) {
                return sendResponse(res, 403, 'error', 'You do not have permission to view this assignment');
            }

            // For teachers, fetch all submissions for this assignment
            const submissions = await Submission.find({ assignmentId: id })
                .populate('studentId', 'firstName lastName');

            const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
            return sendResponse(res, 200, 'success', 'Assignment retrieved successfully', {
                ...assignmentObj,
                submissions: submissions || []
            });
        } else {
            // Admin or other roles - return assignment without submissions
            const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
            return sendResponse(res, 200, 'success', 'Assignment retrieved successfully', assignmentObj);
        }
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
