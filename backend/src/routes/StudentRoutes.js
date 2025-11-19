/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/StudentController');
const authGuard = require('../middleware/user-guard');

router.post('/register', StudentController.registerStudent);
router.post('/login', StudentController.loginStudent);

router.use(authGuard(['student', 'teacher', 'admin']));

router.get('/profile', StudentController.getProfile);
router.get('/', authGuard(['admin', 'teacher']), StudentController.getStudents);
router.get('/assigned', authGuard(['teacher', 'admin']), StudentController.getAssignedStudents);
router.get('/:studentId', authGuard(['student', 'admin']), StudentController.getStudentById);
router.put('/:studentId', authGuard(['student', 'admin']), StudentController.updateStudent);
router.delete('/:studentId', authGuard(['admin']), StudentController.deleteStudent);

module.exports = router;

