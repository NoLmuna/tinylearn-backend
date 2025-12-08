/* eslint-disable no-undef */
const { Progress, Lesson, Student } = require('../models');
const send = require('../utils/response');

const ProgressController = {
    // Get user's progress for all lessons
    getUserProgress: async (req, res) => {
        try {
            const studentId = req.user.userId || req.user.id;

            const progress = await Progress.find({ studentId })
                .populate('lessonId', 'title category difficulty ageGroup duration')
                .sort({ updatedAt: -1 });

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

            const progress = await Progress.findOne({ studentId, lessonId })
                .populate('lessonId', 'title category difficulty ageGroup duration');

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
            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return send.sendResponseMessage(res, 404, null, 'Lesson not found');
            }

            // Check if progress already exists
            let progress = await Progress.findOne({ studentId, lessonId });

            if (progress) {
                // Update status to in_progress if not already
                if (progress.status === 'not_started') {
                    progress.status = 'in_progress';
                    await progress.save();
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

            const progress = await Progress.findOne({ studentId, lessonId });

            if (!progress) {
                return send.sendResponseMessage(res, 404, null, 'Progress not found for this lesson');
            }

            if (status) progress.status = status;
            if (score !== undefined) progress.score = score;
            if (timeSpent !== undefined) progress.timeSpent = (progress.timeSpent || 0) + timeSpent;
            if (notes) progress.notes = notes;
            
            // Set completion date if lesson is completed
            if (status === 'completed') {
                progress.completedAt = new Date();
            }

            await progress.save();

            return send.sendResponseMessage(res, 200, progress, 'Progress updated successfully');
        } catch (error) {
            console.error('Update progress error:', error);
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
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

            const progress = await Progress.findOne({ studentId, lessonId });

            if (!progress) {
                return send.sendResponseMessage(res, 404, null, 'Progress not found for this lesson');
            }

            progress.status = 'completed';
            if (score !== undefined) progress.score = score;
            if (notes !== undefined) progress.notes = notes;
            progress.completedAt = new Date();
            await progress.save();

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

            const allProgress = await Progress.find({ studentId });
            const totalLessons = await Lesson.countDocuments({ isActive: true });
            
            const completedProgress = allProgress.filter(p => p.status === 'completed');
            const inProgressLessons = allProgress.filter(p => p.status === 'in_progress').length;
            const completedLessons = completedProgress.length;
            
            const averageScore = completedProgress.length > 0
                ? completedProgress.reduce((sum, p) => sum + (p.score || 0), 0) / completedProgress.length
                : 0;
            const totalTimeSpent = allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

            const progressStats = {
                totalLessons,
                completedLessons,
                inProgressLessons,
                completionRate: totalLessons > 0 ? ((completedLessons / totalLessons) * 100).toFixed(2) : 0,
                averageScore: parseFloat(averageScore).toFixed(2),
                totalTimeSpent: totalTimeSpent
            };

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
            const skip = (page - 1) * limit;

            const [progressList, total] = await Promise.all([
                Progress.find()
                    .populate('studentId', 'firstName lastName email')
                    .populate('lessonId', 'title category difficulty')
                    .sort({ updatedAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Progress.countDocuments()
            ]);

            return send.sendResponseMessage(res, 200, {
                progress: progressList,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
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
