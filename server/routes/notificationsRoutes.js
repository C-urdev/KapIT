const express = require('express');
const router = express.Router();
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} = require('../controllers/notificationsController');

router.get('/', verifyToken, listNotifications);
router.get('/unread-count', verifyToken, getUnreadNotificationCount);
router.patch('/read', requireCsrfForCookieAuth, verifyToken, markNotificationsRead);

module.exports = router;
