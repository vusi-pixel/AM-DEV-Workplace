'use strict';
const express = require('express');
const hrController = require('../controllers/hr.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/authorization');

const router = express.Router();
router.use(requireAuth);

// HR workspace
router.get('/dashboard', requirePermission('attendance.read.all'), hrController.getDashboard);
router.get('/attendance', requirePermission('attendance.read.all'), hrController.getDashboard); // delegates to service
router.get('/leave-requests', requirePermission('leave.review'), hrController.getLeaveRequests);
router.post('/leave-requests/:id/approve', requirePermission('leave.review'), hrController.approveLeave);
router.post('/leave-requests/:id/reject', requirePermission('leave.review'), hrController.rejectLeave);

// Employee self-service leave
router.post('/leave', requirePermission('leave.request'), hrController.submitLeave);
router.get('/leave/me', hrController.getMyLeave);

module.exports = router;
