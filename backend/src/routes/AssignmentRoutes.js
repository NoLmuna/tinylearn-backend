/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const AssignmentController = require('../controllers/AssignmentController');
const { authenticate } = require('../middleware/auth');

// Create assignment (teachers/admin only)
router.post('/', authenticate, AssignmentController.createAssignment);

// Get assignments (students can read, teachers/admin can manage)
router.get('/', authenticate, AssignmentController.getAssignments);

// Role-specific listings
router.get('/teacher', authenticate, AssignmentController.getTeacherAssignments);
router.get('/student', authenticate, AssignmentController.getStudentAssignments);

// Get specific assignment
router.get('/:id', authenticate, AssignmentController.getAssignmentById);

// Update assignment (teachers/admin only)
router.put('/:id', authenticate, AssignmentController.updateAssignment);

// Delete assignment (teachers/admin only - soft delete)
router.delete('/:id', authenticate, AssignmentController.deleteAssignment);

module.exports = router;
