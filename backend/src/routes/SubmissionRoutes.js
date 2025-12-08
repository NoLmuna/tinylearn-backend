/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const SubmissionController = require('../controllers/SubmissionController');

// Create submission (students only)
router.post('/', SubmissionController.createSubmission);

// Update submission
router.put('/:id', SubmissionController.updateSubmission);

// Grade submission (teachers only)
router.patch('/:id/grade', SubmissionController.gradeSubmission);

// Get submissions
router.get('/student', SubmissionController.getStudentSubmissions);
router.get('/teacher', SubmissionController.getTeacherSubmissions);

// Get specific submission by ID
router.get('/:id', SubmissionController.getSubmissionById);

module.exports = router;
