/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/ProgressController');
const authGuard = require('../middleware/user-guard');

// All progress routes require authentication (any role)
router.get('/', authGuard(), ProgressController.getUserProgress);
router.get('/stats', authGuard(), ProgressController.getProgressStats);
router.get('/detailed', authGuard(), ProgressController.getDetailedProgress);
router.get('/all', authGuard(['admin', 'teacher']), ProgressController.getAllProgress);
router.get('/lesson/:lessonId', authGuard(), ProgressController.getLessonProgress);
router.post('/lesson/:lessonId/start', authGuard(['student', 'teacher', 'admin']), ProgressController.startLesson);
router.put('/lesson/:lessonId', authGuard(['student', 'teacher', 'admin']), ProgressController.updateProgress);
router.put('/lesson/:lessonId/complete', authGuard(['student', 'teacher', 'admin']), ProgressController.completeLesson);

module.exports = router;
