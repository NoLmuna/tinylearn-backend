/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/StudentController');
const authGuard = require('../middleware/user-guard');

router.post('/register', StudentController.registerStudent);
router.post('/login', StudentController.loginStudent);

router.use(authGuard);
router.get('/profile', StudentController.getProfile);
router.get('/', StudentController.getStudents);
router.get('/assigned', StudentController.getAssignedStudents);
router.get('/:studentId', StudentController.getStudentById);
router.put('/:studentId', StudentController.updateStudent);
router.delete('/:studentId', StudentController.deleteStudent);

module.exports = router;

