/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/LessonController');

// Public routes (for browsing lessons)
router.get('/', LessonController.getAllLessons);
router.get('/:id', LessonController.getLessonById);
router.get('/category/:category', LessonController.getLessonsByCategory);

// Protected routes (require authentication)
router.post('/',  LessonController.createLesson);
router.put('/:id',  LessonController.updateLesson);
router.delete('/:id',  LessonController.deleteLesson);

module.exports = router;
