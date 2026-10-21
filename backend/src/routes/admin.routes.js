'use strict';
const express = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');

const router = express.Router();
router.use(requireAuth);
router.use(requirePermission('settings.manage')); // all admin routes require this

router.get('/dashboard', adminController.getDashboard);
router.get('/roles', adminController.getRoles);
router.get('/permissions', adminController.getPermissions);
router.get('/departments', adminController.getDepartments);
router.get('/schedules', adminController.getSchedules);
router.get('/audit-logs', requirePermission('audit.read'), adminController.getAuditLogs);

// Role management
router.post('/roles/assign', requirePermission('roles.manage'), adminController.assignRole);
router.post('/roles/revoke', requirePermission('roles.manage'), adminController.revokeRole);

module.exports = router;
