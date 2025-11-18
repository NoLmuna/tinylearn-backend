/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const ParentController = require('../controllers/ParentController');
const authGuard = require('../middleware/user-guard');

router.post('/register', ParentController.registerParent);
router.post('/login', ParentController.loginParent);

router.use(authGuard);
router.get('/profile', ParentController.getProfile);
router.get('/', ParentController.getParents);
router.put('/:parentId', ParentController.updateParent);
router.delete('/:parentId', ParentController.deleteParent);

module.exports = router;

