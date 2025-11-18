/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/LessonController');
const authGuard = require('../middleware/user-guard');

// Public routes (for browsing lessons)
router.get('/', LessonController.getAllLessons);
router.get('/:id', LessonController.getLessonById);
router.get('/category/:category', LessonController.getLessonsByCategory);

// Protected routes (require authentication)
router.post('/', authGuard(['teacher', 'admin']), LessonController.createLesson);
router.put('/:id', authGuard(['teacher', 'admin']), LessonController.updateLesson);
router.delete('/:id', authGuard(['teacher', 'admin']), LessonController.deleteLesson);

module.exports = router;
