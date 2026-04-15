const express = require('express');
const router = express.Router();
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} = require('../controllers/notificationsController');
const { validateRequest } = require('../middleware/validateRequest');
const { writeSchemas } = require('../validation/writeSchemas');

router.get('/', verifyToken, listNotifications);
router.get('/unread-count', verifyToken, getUnreadNotificationCount);
router.patch('/read', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.notificationsRead), markNotificationsRead);

module.exports = router;
