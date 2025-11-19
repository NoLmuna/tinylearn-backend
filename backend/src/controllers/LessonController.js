/* eslint-disable no-undef */
const { Lesson, Progress, Teacher, Assignment } = require('../models/database');
const send = require('../utils/response');

const LessonController = {
    // Get all lessons
    getAllLessons: async (req, res) => {
        try {
            const { category, difficulty, ageGroup, page = 1, limit = 10 } = req.query;
            
            let whereClause = { isActive: true };
            
            if (category) whereClause.category = category;
            if (difficulty) whereClause.difficulty = difficulty;
            if (ageGroup) whereClause.ageGroup = ageGroup;

            const offset = (page - 1) * limit;

            const lessons = await Lesson.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Teacher,
                        as: 'teacher',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    },
                    {
                        model: Assignment,
                        as: 'assignments',
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        required: false
                    }
                ]
            });

            return send.sendResponseMessage(res, 200, {
                lessons: lessons.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(lessons.count / limit),
                    totalItems: lessons.count,
                    itemsPerPage: parseInt(limit)
                }
            }, 'Lessons retrieved successfully');
        } catch (error) {
            console.error('Get lessons error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get lesson by ID
    getLessonById: async (req, res) => {
        try {
            const { id } = req.params;

            const lesson = await Lesson.findByPk(id, {
                include: [
                    {
                        model: Teacher,
                        as: 'teacher',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    },
                    {
                        model: Assignment,
                        as: 'assignments',
                        attributes: { exclude: ['password'] },
                        required: false
                    }
                ]
            });

            if (!lesson) {
                return send.sendResponseMessage(res, 404, null, 'Lesson not found');
            }

            return send.sendResponseMessage(res, 200, lesson, 'Lesson retrieved successfully');
        } catch (error) {
            console.error('Get lesson error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Create new lesson (teacher/admin only)
    createLesson: async (req, res) => {
        try {
            if (!['teacher', 'admin'].includes(req.user.role)) {
                return send.sendResponseMessage(res, 403, null, 'Access denied. Teacher or admin role required.');
            }

            const {
                title,
                description,
                content,
                category,
                difficulty,
                ageGroup,
                duration,
                imageUrl,
                videoUrl,
                isPublished,
                teacherId: overrideTeacherId
            } = req.body;

            // Validate required fields
            if (!title || !category || !ageGroup) {
                return send.sendResponseMessage(res, 400, null, 'Title, category, and age group are required');
            }

            let teacherId = req.user.role === 'teacher' ? (req.user.userId || req.user.id) : overrideTeacherId;

            if (!teacherId) {
                return send.sendResponseMessage(res, 400, null, 'Teacher ID is required to create a lesson');
            }

            const teacher = await Teacher.findByPk(teacherId);
            if (!teacher) {
                return send.sendResponseMessage(res, 404, null, 'Teacher not found');
            }

            const newLesson = await Lesson.create({
                title,
                description,
                content,
                category,
                difficulty: difficulty || 'beginner',
                ageGroup,
                duration,
                imageUrl,
                videoUrl,
                isPublished: isPublished !== undefined ? isPublished : false,
                teacherId
            });

            return send.sendResponseMessage(res, 201, newLesson, 'Lesson created successfully');
        } catch (error) {
            console.error('Create lesson error:', error);
            if (error.name === 'SequelizeValidationError') {
                const validationErrors = error.errors.map(err => err.message);
                return send.sendResponseMessage(res, 400, null, `Validation error: ${validationErrors.join(', ')}`);
            }
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Update lesson
    updateLesson: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId || req.user.id;

            const lesson = await Lesson.findByPk(id);
            if (!lesson) {
                return send.sendResponseMessage(res, 404, null, 'Lesson not found');
            }

            // Check if user can update (creator, admin, or teacher)
            if (lesson.teacherId !== userId && req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            const {
                title,
                description,
                content,
                category,
                difficulty,
                ageGroup,
                duration,
                imageUrl,
                videoUrl,
                isActive
            } = req.body;

            await lesson.update({
                title: title || lesson.title,
                description: description || lesson.description,
                content: content || lesson.content,
                category: category || lesson.category,
                difficulty: difficulty || lesson.difficulty,
                ageGroup: ageGroup || lesson.ageGroup,
                duration: duration || lesson.duration,
                imageUrl: imageUrl || lesson.imageUrl,
                videoUrl: videoUrl || lesson.videoUrl,
                isActive: isActive !== undefined ? isActive : lesson.isActive
            });

            return send.sendResponseMessage(res, 200, lesson, 'Lesson updated successfully');
        } catch (error) {
            console.error('Update lesson error:', error);
            if (error.name === 'SequelizeValidationError') {
                const validationErrors = error.errors.map(err => err.message);
                return send.sendResponseMessage(res, 400, null, `Validation error: ${validationErrors.join(', ')}`);
            }
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Delete lesson
    deleteLesson: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId || req.user.id;

            const lesson = await Lesson.findByPk(id);
            if (!lesson) {
                return send.sendResponseMessage(res, 404, null, 'Lesson not found');
            }

            // Check if user can delete (creator or admin)
            if (lesson.teacherId !== userId && req.user.role !== 'admin') {
                return send.sendResponseMessage(res, 403, null, 'Access denied');
            }

            await lesson.destroy();
            return send.sendResponseMessage(res, 200, null, 'Lesson deleted successfully');
        } catch (error) {
            console.error('Delete lesson error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    },

    // Get lessons by category
    getLessonsByCategory: async (req, res) => {
        try {
            const { category } = req.params;
            
            const lessons = await Lesson.findAll({
                where: { 
                    category, 
                    isActive: true 
                },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Teacher,
                        as: 'teacher',
                        attributes: ['id', 'firstName', 'lastName']
                    }
                ]
            });

            return send.sendResponseMessage(res, 200, lessons, `Lessons in ${category} category retrieved successfully`);
        } catch (error) {
            console.error('Get lessons by category error:', error);
            return send.sendErrorMessage(res, 500, error);
        }
    }
};

module.exports = LessonController;
