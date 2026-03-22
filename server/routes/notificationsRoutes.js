const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} = require('../controllers/notificationsController');

router.get('/', verifyToken, listNotifications);
router.get('/unread-count', verifyToken, getUnreadNotificationCount);
router.patch('/read', verifyToken, markNotificationsRead);

module.exports = router;
