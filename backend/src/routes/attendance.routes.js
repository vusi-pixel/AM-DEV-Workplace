'use strict';
const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const { validateBody } = require('../middleware/validate');
const { clockInSchema, clockOutSchema, correctionRequestSchema } = require('../validators/attendance.validators');

const router = express.Router();

// All attendance routes require authentication
router.use(requireAuth);

// Attendance status — no active session required (needed before clock-in)
router.get('/status', attendanceController.getStatus);

// Clock operations
router.post('/clock-in', requirePermission('attendance.clock_in'), validateBody(clockInSchema), attendanceController.clockIn);
router.post('/clock-out', requirePermission('attendance.clock_out'), validateBody(clockOutSchema), attendanceController.clockOut);

// Personal history — accessible post clock-out
router.get('/me', requirePermission('attendance.read.self'), attendanceController.getMyAttendance);

// HR/Admin — all attendance records
router.get('/', requirePermission('attendance.read.all'), attendanceController.getAllAttendance);

// Correction request
router.post('/:id/correction-requests', requirePermission('attendance.read.self'), validateBody(correctionRequestSchema), attendanceController.submitCorrection);

module.exports = router;
