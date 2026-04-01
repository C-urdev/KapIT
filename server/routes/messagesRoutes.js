const express = require('express');
const router = express.Router();
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const { listConversations, listMessages, sendMessage } = require('../controllers/messagesController');

router.get('/conversations', verifyToken, listConversations);
router.get('/:contact', verifyToken, listMessages);
router.post('/:contact', requireCsrfForCookieAuth, verifyToken, sendMessage);

module.exports = router;
