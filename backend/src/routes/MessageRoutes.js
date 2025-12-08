/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');

// Get all conversations for the current user
router.get('/conversations', MessageController.getConversations);

// Send message
router.post('/', MessageController.sendMessage);

// Get messages with a specific user
router.get('/:otherUserId', MessageController.getMessages);

module.exports = router;
