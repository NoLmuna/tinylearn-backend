/* eslint-disable no-undef */
const { Lesson, Progress, Teacher, Assignment } = require('../models');
const send = require('../utils/response');


module.exports.getAllLessons = async (req, res) => {
    try {
        const { category, difficulty, ageGroup, page = 1, limit = 10 } = req.query;

        let query = { isActive: true };

        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (ageGroup) query.ageGroup = ageGroup;

        const skip = (page - 1) * limit;

        const [lessons, total] = await Promise.all([
            Lesson.find(query)
                .populate('teacherId', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Lesson.countDocuments(query)
        ]);

        return send.sendResponseMessage(res, 200, {
            lessons,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        }, 'Lessons retrieved successfully');
    } catch (error) {
        console.error('Get lessons error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

// Get lesson by ID
module.exports.getLessonById = async (req, res) => {
    try {
        const { id } = req.params;

        const lesson = await Lesson.findById(id)
            .populate('teacherId', 'firstName lastName email');

        if (!lesson) {
            return send.sendResponseMessage(res, 404, null, 'Lesson not found');
        }

        return send.sendResponseMessage(res, 200, lesson, 'Lesson retrieved successfully');
    } catch (error) {
        console.error('Get lesson error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

// Create new lesson (teacher/admin only)
module.exports.createLesson = async (req, res) => {
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

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return send.sendResponseMessage(res, 404, null, 'Teacher not found');
        }

        // Handle file upload - if file was uploaded, use its path
        let imageUrl = null;
        if (req.file) {
            // Construct the URL to access the uploaded file
            const baseUrl = req.protocol + '://' + req.get('host');
            imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
        } else if (req.body.imageUrl) {
            // Fallback to URL if provided (for backward compatibility)
            imageUrl = req.body.imageUrl;
        }

        const newLesson = await Lesson.create({
            title,
            description,
            content: typeof content === 'string' ? JSON.parse(content) : content,
            category,
            difficulty: difficulty || 'beginner',
            ageGroup,
            duration: duration ? parseInt(duration) : null,
            imageUrl,
            videoUrl,
            isActive: isPublished !== undefined ? isPublished : true,
            teacherId
        });

        return send.sendResponseMessage(res, 201, newLesson, 'Lesson created successfully');
    } catch (error) {
        console.error('Create lesson error:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return send.sendResponseMessage(res, 400, null, `Validation error: ${validationErrors.join(', ')}`);
        }
        return send.sendErrorMessage(res, 500, error);
    }
}

// Update lesson
module.exports.updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId || req.user.id;

        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return send.sendResponseMessage(res, 404, null, 'Lesson not found');
        }

        // Check if user can update (creator, admin, or teacher)
        if (lesson.teacherId.toString() !== userId.toString() && req.user.role !== 'admin') {
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
            videoUrl,
            isActive
        } = req.body;

        // Handle file upload - if file was uploaded, use its path
        if (req.file) {
            const baseUrl = req.protocol + '://' + req.get('host');
            lesson.imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
        } else if (req.body.imageUrl !== undefined) {
            // Fallback to URL if provided (for backward compatibility)
            lesson.imageUrl = req.body.imageUrl;
        }

        if (title !== undefined) lesson.title = title;
        if (description !== undefined) lesson.description = description;
        if (content !== undefined) {
            lesson.content = typeof content === 'string' ? JSON.parse(content) : content;
        }
        if (category !== undefined) lesson.category = category;
        if (difficulty !== undefined) lesson.difficulty = difficulty;
        if (ageGroup !== undefined) lesson.ageGroup = ageGroup;
        if (duration !== undefined) lesson.duration = duration;
        if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
        if (isActive !== undefined) lesson.isActive = isActive;
        await lesson.save();

        return send.sendResponseMessage(res, 200, lesson, 'Lesson updated successfully');
    } catch (error) {
        console.error('Update lesson error:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return send.sendResponseMessage(res, 400, null, `Validation error: ${validationErrors.join(', ')}`);
        }
        return send.sendErrorMessage(res, 500, error);
    }
}

// Archive lesson (set isActive to false)
module.exports.archiveLesson = async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.user.role)) {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        const { id } = req.params;
        const userId = req.user.userId || req.user.id;

        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return send.sendResponseMessage(res, 404, null, 'Lesson not found');
        }

        // Check if user can archive (creator or admin)
        if (lesson.teacherId.toString() !== userId.toString() && req.user.role !== 'admin') {
            return send.sendResponseMessage(res, 403, null, 'Access denied. You can only archive your own lessons.');
        }

        lesson.isActive = false;
        await lesson.save();

        return send.sendResponseMessage(res, 200, lesson, 'Lesson archived successfully');
    } catch (error) {
        console.error('Archive lesson error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

// Restore lesson (set isActive to true)
module.exports.restoreLesson = async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.user.role)) {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        const { id } = req.params;
        const userId = req.user.userId || req.user.id;

        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return send.sendResponseMessage(res, 404, null, 'Lesson not found');
        }

        // Check if user can restore (creator or admin)
        if (lesson.teacherId.toString() !== userId.toString() && req.user.role !== 'admin') {
            return send.sendResponseMessage(res, 403, null, 'Access denied. You can only restore your own lessons.');
        }

        lesson.isActive = true;
        await lesson.save();

        return send.sendResponseMessage(res, 200, lesson, 'Lesson restored successfully');
    } catch (error) {
        console.error('Restore lesson error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

// Mark chapter as seen (for students)
module.exports.markChapterAsSeen = async (req, res) => {
    try {
        if (!['student', 'teacher', 'admin'].includes(req.user.role)) {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        const { id } = req.params;
        const { chapterIndex } = req.body;

        if (chapterIndex === undefined || chapterIndex === null) {
            return send.sendResponseMessage(res, 400, null, 'Chapter index is required');
        }

        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return send.sendResponseMessage(res, 404, null, 'Lesson not found');
        }

        if (!lesson.content || !Array.isArray(lesson.content)) {
            return send.sendResponseMessage(res, 400, null, 'Lesson has no chapters');
        }

        if (chapterIndex < 0 || chapterIndex >= lesson.content.length) {
            return send.sendResponseMessage(res, 400, null, 'Invalid chapter index');
        }

        // Mark the chapter as seen
        lesson.content[chapterIndex].isSeen = true;
        await lesson.save();

        return send.sendResponseMessage(res, 200, lesson, 'Chapter marked as seen successfully');
    } catch (error) {
        console.error('Mark chapter as seen error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

// Delete lesson
module.exports.deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId || req.user.id;

        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return send.sendResponseMessage(res, 404, null, 'Lesson not found');
        }

        // Check if user can delete (creator or admin)
        if (lesson.teacherId.toString() !== userId.toString() && req.user.role !== 'admin') {
            return send.sendResponseMessage(res, 403, null, 'Access denied');
        }

        await Lesson.findByIdAndDelete(id);
        return send.sendResponseMessage(res, 200, null, 'Lesson deleted successfully');
    } catch (error) {
        console.error('Delete lesson error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}

// Get lessons by category
module.exports.getLessonsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const lessons = await Lesson.find({
            category,
            isActive: true
        })
            .populate('teacherId', 'firstName lastName')
            .sort({ createdAt: -1 });

        return send.sendResponseMessage(res, 200, lessons, `Lessons in ${category} category retrieved successfully`);
    } catch (error) {
        console.error('Get lessons by category error:', error);
        return send.sendErrorMessage(res, 500, error);
    }
}
