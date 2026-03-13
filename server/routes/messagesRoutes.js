const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { listMessages, sendMessage } = require('../controllers/messagesController');

router.get('/:contact', verifyToken, listMessages);
router.post('/:contact', verifyToken, sendMessage);

module.exports = router;
