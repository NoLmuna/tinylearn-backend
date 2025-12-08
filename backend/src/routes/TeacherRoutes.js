/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const TeacherController = require('../controllers/TeacherController');

router.post('/register', TeacherController.registerTeacher);
router.post('/login', TeacherController.loginTeacher);

router.get('/profile', TeacherController.getProfile);
router.get('/', TeacherController.getTeachers);
router.get('/lessons', TeacherController.getLessons);
router.get('/students',  TeacherController.getAssignedStudents);
router.put('/:teacherId/status', TeacherController.updateTeacherStatus);
router.put('/:teacherId',  TeacherController.updateTeacher);
router.delete('/:teacherId', TeacherController.deleteTeacher);

module.exports = router;

