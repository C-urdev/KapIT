const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { listConversations, listMessages, sendMessage } = require('../controllers/messagesController');

router.get('/conversations', verifyToken, listConversations);
router.get('/:contact', verifyToken, listMessages);
router.post('/:contact', verifyToken, sendMessage);

module.exports = router;
