/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/LessonController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (for browsing lessons)
router.get('/', LessonController.getAllLessons);
router.get('/:id', LessonController.getLessonById);
router.get('/category/:category', LessonController.getLessonsByCategory);

// Protected routes (require authentication)
router.post('/', authenticate, upload.single('image'), LessonController.createLesson);
router.put('/:id', authenticate, upload.single('image'), LessonController.updateLesson);
router.put('/:id/archive', authenticate, LessonController.archiveLesson);
router.put('/:id/restore', authenticate, LessonController.restoreLesson);
router.put('/:id/chapter/seen', authenticate, LessonController.markChapterAsSeen);
router.delete('/:id', authenticate, LessonController.deleteLesson);

module.exports = router;
