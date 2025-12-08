/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const ParentController = require('../controllers/ParentController');

router.post('/register', ParentController.registerParent);
router.post('/login', ParentController.loginParent);

router.get('/profile', ParentController.getProfile);
router.get('/',  ParentController.getParents);
router.put('/:parentId', ParentController.updateParent);
router.delete('/:parentId', ParentController.deleteParent);

module.exports = router;

