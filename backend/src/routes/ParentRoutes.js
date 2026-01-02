/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const ParentController = require('../controllers/ParentController');
const { authenticate } = require('../middleware/auth');

router.post('/register', ParentController.registerParent);
router.post('/login', ParentController.loginParent);

// Protected routes
router.get('/profile', authenticate, ParentController.getProfile);
router.get('/:parentId', authenticate, ParentController.getParentById);
router.put('/:parentId', authenticate, ParentController.updateParent);
router.delete('/:parentId', authenticate, ParentController.deleteParent);

// Public route (may need authentication in future)
router.get('/', ParentController.getParents);

module.exports = router;

