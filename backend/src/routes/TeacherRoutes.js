/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const TeacherController = require('../controllers/TeacherController');
const { authenticate } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', TeacherController.registerTeacher);
router.post('/login', TeacherController.loginTeacher);

// Protected routes (authentication required)
// Specific routes must come before parameterized routes
router.get('/profile', authenticate, TeacherController.getProfile);
router.get('/lessons', authenticate, TeacherController.getLessons);
router.get('/students', authenticate, TeacherController.getAssignedStudents);
router.get('/parents', authenticate, TeacherController.getAssignedParents);
router.get('/', authenticate, TeacherController.getTeachers);
router.get('/:teacherId', authenticate, TeacherController.getTeacherById);

router.post('/students', authenticate, TeacherController.createStudent);
router.post('/parents', authenticate, TeacherController.createParent);

router.put('/:teacherId', authenticate, TeacherController.updateTeacher);
router.put('/:teacherId/status', authenticate, TeacherController.updateTeacherStatus);

// Archive routes (set isActive to false)
router.put('/students/:studentId/archive', authenticate, TeacherController.archiveStudent);
router.put('/parents/:parentId/archive', authenticate, TeacherController.archiveParent);

// Restore routes (set isActive to true)
router.put('/students/:studentId/restore', authenticate, TeacherController.restoreStudent);
router.put('/parents/:parentId/restore', authenticate, TeacherController.restoreParent);

router.delete('/:teacherId', authenticate, TeacherController.deleteTeacher);

module.exports = router;

