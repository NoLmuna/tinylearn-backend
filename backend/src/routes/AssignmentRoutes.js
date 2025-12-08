/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const AssignmentController = require('../controllers/AssignmentController');

// Create assignment (teachers/admin only)
router.post('/', AssignmentController.createAssignment);

// Get assignments (students can read, teachers/admin can manage)
router.get('/', AssignmentController.getAssignments);

// Role-specific listings
router.get('/teacher', AssignmentController.getTeacherAssignments);
router.get('/student', AssignmentController.getStudentAssignments);

// Get specific assignment
router.get('/:id', AssignmentController.getAssignmentById);

// Update assignment (teachers/admin only)
router.put('/:id', AssignmentController.updateAssignment);

// Delete assignment (teachers/admin only - soft delete)
router.delete('/:id', AssignmentController.deleteAssignment);

module.exports = router;
