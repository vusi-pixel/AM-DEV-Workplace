'use strict';
const prisma = require('../config/prisma');
const response = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 30 });
    const where = { userId: req.user.id };
    if (req.query.unread === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    return response.paginated(res, { data: notifications, total, page, limit });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    // Only allow marking your own notifications
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) {
      return response.error(res, 'Notification not found', 404);
    }

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });

    return response.success(res, null, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return response.success(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    return response.success(res, { unreadCount: count });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount };
