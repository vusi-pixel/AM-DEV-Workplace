'use strict';
const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/mark-all-read', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
