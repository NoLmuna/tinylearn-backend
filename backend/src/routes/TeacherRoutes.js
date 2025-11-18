/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const TeacherController = require('../controllers/TeacherController');
const authGuard = require('../middleware/user-guard');

router.post('/register', TeacherController.registerTeacher);
router.post('/login', TeacherController.loginTeacher);

router.use(authGuard(['teacher', 'admin']));
router.get('/profile', TeacherController.getProfile);
router.get('/', authGuard(['admin']), TeacherController.getTeachers);
router.get('/lessons', TeacherController.getLessons);
router.get('/students', authGuard(['teacher', 'admin']), TeacherController.getAssignedStudents);
router.put('/:teacherId/status', authGuard(['admin']), TeacherController.updateTeacherStatus);
router.put('/:teacherId', authGuard(['teacher', 'admin']), TeacherController.updateTeacher);
router.delete('/:teacherId', authGuard(['admin']), TeacherController.deleteTeacher);

module.exports = router;

