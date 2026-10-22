'use strict';
const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const workplaceController = require('../controllers/workplace.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', dashboardController.getSummary);
router.get('/search', dashboardController.searchWorkplace);
router.get('/approvals', dashboardController.getApprovals);

router.get('/tasks', dashboardController.getMyTasks);
router.post('/tasks', dashboardController.createTask);
router.patch('/tasks/:id/status', dashboardController.updateTaskStatus);

router.get('/messages', dashboardController.getMyMessages);
router.patch('/messages/:id/read', dashboardController.markMessageRead);
router.post('/messages', dashboardController.sendMessage);

router.get('/timeline', dashboardController.getTimeline);

router.get('/projects', workplaceController.getProjects);
router.get('/calendar', workplaceController.getCalendar);
router.post('/calendar', workplaceController.createCalendarEvent);
router.get('/announcements', workplaceController.getAnnouncements);
router.post('/announcements', workplaceController.publishAnnouncement);
router.get('/expenses', workplaceController.getMyExpenses);
router.post('/expenses', workplaceController.submitExpense);

module.exports = router;
