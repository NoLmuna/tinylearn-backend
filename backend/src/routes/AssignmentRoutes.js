/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const AssignmentController = require('../controllers/AssignmentController');
const authGuard = require('../middleware/user-guard');

const teacherOrAdmin = ['teacher', 'admin'];
const studentAccess = ['student', 'teacher', 'admin'];

// Create assignment (teachers/admin only)
router.post('/', authGuard(teacherOrAdmin), AssignmentController.createAssignment);

// Get assignments (students can read, teachers/admin can manage)
router.get('/', authGuard(studentAccess), AssignmentController.getAssignments);

// Role-specific listings
router.get('/teacher', authGuard(teacherOrAdmin), AssignmentController.getTeacherAssignments);
router.get('/student', authGuard(['student']), AssignmentController.getStudentAssignments);

// Get specific assignment
router.get('/:id', authGuard(studentAccess), AssignmentController.getAssignmentById);

// Update assignment (teachers/admin only)
router.put('/:id', authGuard(teacherOrAdmin), AssignmentController.updateAssignment);

// Delete assignment (teachers/admin only - soft delete)
router.delete('/:id', authGuard(teacherOrAdmin), AssignmentController.deleteAssignment);

module.exports = router;
