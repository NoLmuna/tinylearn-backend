/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/StudentController');
const { authenticate } = require('../middleware/auth');

router.post('/register', StudentController.registerStudent);
router.post('/login', StudentController.loginStudent);


// Protected routes
router.get('/profile', authenticate, StudentController.getProfile);
router.get('/assigned', authenticate, StudentController.getAssignedStudents);
router.get('/:studentId', authenticate, StudentController.getStudentById);
router.put('/:studentId', authenticate, StudentController.updateStudent);
router.delete('/:studentId', authenticate, StudentController.deleteStudent);

// Public route (may need authentication in future)
router.get('/', StudentController.getStudents);

module.exports = router;

