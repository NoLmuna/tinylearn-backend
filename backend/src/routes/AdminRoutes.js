/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const authGuard = require('../middleware/user-guard');
const TeacherController = require('../controllers/TeacherController');
const StudentController = require('../controllers/StudentController');
const ParentController = require('../controllers/ParentController');

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

router.post('/register', AdminController.registerAdmin);
router.post('/login', AdminController.loginAdmin);

router.use(authGuard(['admin', 'teacher', 'student', 'parent']));
router.use(requireAdmin);

router.get('/profile', AdminController.getProfile);
router.get('/', AdminController.getAdmins);
router.get('/stats', AdminController.getSystemStats);
router.get('/users/admins', AdminController.getAdmins);
router.get('/users/admins/:adminId', AdminController.getAdminById);
router.get('/users/teachers', AdminController.getTeachersList);
router.get('/users/teachers/:teacherId', AdminController.getTeachersDetail);
router.get('/users/students', AdminController.getStudentsList);
router.get('/users/students/:studentId', AdminController.getStudentsDetail);
router.get('/users/parents', AdminController.getParentsList);
router.get('/users/parents/:parentId', AdminController.getParentsDetail);
// Teacher management
router.get('/teachers', TeacherController.getTeachers);
router.get('/teachers/:teacherId', TeacherController.getTeacherById);
router.put('/teachers/:teacherId/status', TeacherController.updateTeacherStatus);
router.put('/teachers/:teacherId', TeacherController.updateTeacher);
router.delete('/teachers/:teacherId', TeacherController.deleteTeacher);
router.get('/teachers/:teacherId/students', AdminController.getTeacherStudents);
router.post('/teachers/:teacherId/students', AdminController.assignStudentsToTeacher);

// Student management
router.get('/students', StudentController.getStudents);
router.get('/students/:studentId', StudentController.getStudentById);
router.put('/students/:studentId', StudentController.updateStudent);
router.delete('/students/:studentId', StudentController.deleteStudent);

// Parent management
router.get('/parents', ParentController.getParents);
router.get('/parents/:parentId', ParentController.getParentById);
router.put('/parents/:parentId', ParentController.updateParent);
router.delete('/parents/:parentId', ParentController.deleteParent);

// Admin self-management (keep these last to avoid intercepting nested routes)
router.get('/:adminId', AdminController.getAdminById);
router.put('/:adminId', AdminController.updateAdmin);
router.delete('/:adminId', AdminController.deleteAdmin);

module.exports = router;

