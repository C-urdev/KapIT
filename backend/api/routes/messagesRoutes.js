const express = require('express');
const router = express.Router();
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const { requireMessagingDebugAccess } = require('../middleware/messagingDebug');
const { listConversations, listMessages, sendMessage } = require('../controllers/messagesController');
const { validateRequest } = require('../middleware/validateRequest');
const { writeSchemas } = require('../validation/writeSchemas');
const {
  listMigrationHealth,
  getThreadComparison,
  getParityReport,
} = require('../controllers/messagesDebugController');

router.get('/debug/migration-health', verifyToken, requireMessagingDebugAccess, listMigrationHealth);
router.get('/debug/parity-report', verifyToken, requireMessagingDebugAccess, getParityReport);
router.get('/debug/thread/:contact', verifyToken, requireMessagingDebugAccess, getThreadComparison);
router.get('/conversations', verifyToken, listConversations);
router.get('/:contact', verifyToken, listMessages);
router.post('/:contact', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.messageSend), sendMessage);

module.exports = router;
