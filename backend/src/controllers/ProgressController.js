/* eslint-disable no-undef */
const { Progress, Lesson, Student } = require('../models/database');
const send = require('../utils/response');
const ProgressService = require('../services/ProgressService');

const ProgressController = {
    // Get user's progress for all lessons
    getUserProgress: async (req, res) => {
        try {
            const studentId = req.user.userId || req.user.id;

            const progress = await Progress.findAll({
                where: { studentId },
                include: [
                    {
                        model: Lesson,
                        as: 'lesson',
                        attributes: ['id', 'title', 'category', 'difficulty', 'ageGroup', 'duration']
                    }
                ],
                order: [['updatedAt', 'DESC']]
            });

            return send.sendResponseMessage(res, 200, progress, 'User progress retrieved successfully');
        } catch (error) {
            console.error('Get user progress error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get user's progress for a specific lesson
    getLessonProgress: async (req, res) => {
        try {
            const { lessonId } = req.params;
            const studentId = req.user.userId || req.user.id;

            const progress = await Progress.findOne({
                where: { studentId, lessonId },
                include: [
                    {
                        model: Lesson,
                        as: 'lesson',
                        attributes: ['id', 'title', 'category', 'difficulty', 'ageGroup', 'duration']
                    }
                ]
            });

            if (!progress) {
                return send.sendResponseMessage(res, 404, null, 'Progress not found for this lesson');
            }

            return send.sendResponseMessage(res, 200, progress, 'Lesson progress retrieved successfully');
        } catch (error) {
            console.error('Get lesson progress error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Start a lesson (create progress entry)
    startLesson: async (req, res) => {
        try {
            const { lessonId } = req.params;
            const studentId = req.user.userId || req.user.id;

            // Check if lesson exists
            const lesson = await Lesson.findByPk(lessonId);
            if (!lesson) {
                return send.sendResponseMessage(res, 404, null, 'Lesson not found');
            }

            // Check if progress already exists
            let progress = await Progress.findOne({
                where: { studentId, lessonId }
            });

            if (progress) {
                // Update status to in_progress if not already
                if (progress.status === 'not_started') {
                    await progress.update({ status: 'in_progress' });
                }
                return send.sendResponseMessage(res, 200, progress, 'Lesson started successfully');
            }

            // Create new progress entry
            progress = await Progress.create({
                studentId,
                lessonId,
                status: 'in_progress'
            });

            return send.sendResponseMessage(res, 201, progress, 'Lesson started successfully');
        } catch (error) {
            console.error('Start lesson error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Update lesson progress
    updateProgress: async (req, res) => {
        try {
            const { lessonId } = req.params;
            const studentId = req.user.userId || req.user.id;
            const { status, score, timeSpent, notes } = req.body;

            const progress = await Progress.findOne({
                where: { studentId, lessonId }
            });

            if (!progress) {
                return send.sendResponseMessage(res, 404, null, 'Progress not found for this lesson');
            }

            const updateData = {};
            if (status) updateData.status = status;
            if (score !== undefined) updateData.score = score;
            if (timeSpent !== undefined) updateData.timeSpent = (progress.timeSpent || 0) + timeSpent;
            if (notes) updateData.notes = notes;
            
            // Set completion date if lesson is completed
            if (status === 'completed') {
                updateData.completedAt = new Date();
            }

            await progress.update(updateData);

            return send.sendResponseMessage(res, 200, progress, 'Progress updated successfully');
        } catch (error) {
            console.error('Update progress error:', error);
            if (error.name === 'SequelizeValidationError') {
                const validationErrors = error.errors.map(err => err.message);
                return send.sendResponseMessage(res, 400, null, `Validation error: ${validationErrors.join(', ')}`);
            }
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Complete a lesson
    completeLesson: async (req, res) => {
        try {
            const { lessonId } = req.params;
            const studentId = req.user.userId || req.user.id;
            const { score, notes } = req.body;

            const progress = await Progress.findOne({
                where: { studentId, lessonId }
            });

            if (!progress) {
                return send.sendResponseMessage(res, 404, null, 'Progress not found for this lesson');
            }

            await progress.update({
                status: 'completed',
                score: score || progress.score,
                notes: notes || progress.notes,
                completedAt: new Date()
            });

            return send.sendResponseMessage(res, 200, progress, 'Lesson completed successfully');
        } catch (error) {
            console.error('Complete lesson error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get progress statistics for a user (enhanced with assignments)
    getProgressStats: async (req, res) => {
        try {
            const studentId = req.user.userId || req.user.id;

            // Use the new ProgressService for comprehensive progress calculation
            const progressStats = await ProgressService.calculateStudentProgress(studentId);

            return send.sendResponseMessage(res, 200, progressStats, 'Progress statistics retrieved successfully');
        } catch (error) {
            console.error('Get progress stats error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get detailed progress with recent activity
    getDetailedProgress: async (req, res) => {
        try {
            const studentId = req.user.userId || req.user.id;
            const userRole = req.user.role;

            // Students can only view their own progress
            if (userRole === 'student' && studentId !== (req.user.userId || req.user.id)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const detailedProgress = await ProgressService.getDetailedProgress(studentId);

            return send.sendResponseMessage(res, 200, detailedProgress, 'Detailed progress retrieved successfully');
        } catch (error) {
            console.error('Get detailed progress error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get all progress (admin/teacher only)
    getAllProgress: async (req, res) => {
        try {
            if (!['admin', 'teacher'].includes(req.user.role)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Admin or teacher role required.');
            }

            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const progress = await Progress.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [
                    {
                        model: Student,
                        as: 'student',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    },
                    {
                        model: Lesson,
                        as: 'lesson',
                        attributes: ['id', 'title', 'category', 'difficulty']
                    }
                ],
                order: [['updatedAt', 'DESC']]
            });

            return send.sendResponseMessage(res, 200, {
                progress: progress.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(progress.count / limit),
                    totalItems: progress.count,
                    itemsPerPage: parseInt(limit)
                }
            }, 'All progress retrieved successfully');
        } catch (error) {
            console.error('Get all progress error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }
};

module.exports = ProgressController;
