/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const AssignmentController = require('../controllers/AssignmentController');
const userGuard = require('../middleware/user-guard');

// Protected routes - all assignment routes require authentication
router.use(userGuard(['teacher', 'admin']));

// Create assignment (teachers only)
router.post('/', AssignmentController.createAssignment);

// Get assignments (role-based)
router.get('/', AssignmentController.getAssignments);

// Get assignments
router.get('/teacher', AssignmentController.getTeacherAssignments);
router.get('/student', AssignmentController.getStudentAssignments);

// Get specific assignment
router.get('/:id', AssignmentController.getAssignmentById);

// Update assignment (teachers only)
router.put('/:id', AssignmentController.updateAssignment);

// Delete assignment (teachers only - soft delete)
router.delete('/:id', AssignmentController.deleteAssignment);

module.exports = router;
