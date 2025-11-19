/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const ParentController = require('../controllers/ParentController');
const authGuard = require('../middleware/user-guard');

router.post('/register', ParentController.registerParent);
router.post('/login', ParentController.loginParent);

router.use(authGuard(['parent', 'admin']));
router.get('/profile', ParentController.getProfile);
router.get('/', authGuard(['admin']), ParentController.getParents);
router.put('/:parentId', ParentController.updateParent);
router.delete('/:parentId', authGuard(['admin']), ParentController.deleteParent);

module.exports = router;

