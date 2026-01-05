/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const SubmissionController = require('../controllers/SubmissionController');
const { authenticate } = require('../middleware/auth');

// Create submission (students only)
router.post('/', authenticate, SubmissionController.createSubmission);

// Update submission
router.put('/:id', authenticate, SubmissionController.updateSubmission);

// Grade submission (teachers only)
router.patch('/:id/grade', authenticate, SubmissionController.gradeSubmission);

// Get submissions
router.get('/student', authenticate, SubmissionController.getStudentSubmissions);
router.get('/teacher', authenticate, SubmissionController.getTeacherSubmissions);

// Get specific submission by ID
router.get('/:id', authenticate, SubmissionController.getSubmissionById);

module.exports = router;
