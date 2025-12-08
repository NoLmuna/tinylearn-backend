/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

// Public routes
router.post('/login', userController.userLogin);

// Protected routes (require authentication)
router.get('/profile', userController.getProfile);
router.get('/all', userController.getAllUsers);
router.get('/by-role', userController.getUsersByRole);
router.get('/parent/children', userController.getParentChildren);
router.get('/parent/teachers', userController.getTeachersForParent);
router.get('/teacher/parents', userController.getParentsForTeacher);

// Admin-only routes (specific routes BEFORE parameterized routes)
router.post('/register', userController.registerUser);
router.get('/stats', userController.getSystemStats);
router.get('/:userId', userController.getUserById);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);

module.exports = router;