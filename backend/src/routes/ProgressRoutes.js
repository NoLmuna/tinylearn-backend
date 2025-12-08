/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/ProgressController');

// All progress routes require authentication (any role)
router.get('/', ProgressController.getUserProgress);
router.get('/stats', ProgressController.getProgressStats);
router.get('/detailed', ProgressController.getDetailedProgress);
router.get('/all', ProgressController.getAllProgress);
router.get('/lesson/:lessonId', ProgressController.getLessonProgress);
router.post('/lesson/:lessonId/start', ProgressController.startLesson);
router.put('/lesson/:lessonId', ProgressController.updateProgress);
router.put('/lesson/:lessonId/complete', ProgressController.completeLesson);

module.exports = router;
