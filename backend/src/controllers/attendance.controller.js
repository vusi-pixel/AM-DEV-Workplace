'use strict';
const attendanceService = require('../services/attendance.service');
const response = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

const getStatus = async (req, res, next) => {
  try {
    const { session, workDate } = await attendanceService.getAttendanceStatus(req.user.id);
    return response.success(res, {
      hasActiveSession: !!session && session.status === 'CLOCKED_IN',
      session,
      workDate,
      userProfile: req.user.profile,
    });
  } catch (err) {
    next(err);
  }
};

const clockIn = async (req, res, next) => {
  try {
    const { method, notes } = req.body;
    const session = await attendanceService.clockIn(req.user.id, { method, notes });
    return response.success(res, { session }, 'Clocked in successfully', 201);
  } catch (err) {
    next(err);
  }
};

const clockOut = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const session = await attendanceService.clockOut(req.user.id, { notes });
    return response.success(res, { session }, 'Clocked out successfully');
  } catch (err) {
    next(err);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { sessions, total } = await attendanceService.getMyAttendance(req.user.id, { skip, limit });
    return response.paginated(res, { data: sessions, total, page, limit });
  } catch (err) {
    next(err);
  }
};

const getAllAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { date, departmentId, status } = req.query;
    const { sessions, total } = await attendanceService.getAllAttendance({ skip, limit, date, departmentId, status });
    return response.paginated(res, { data: sessions, total, page, limit });
  } catch (err) {
    next(err);
  }
};

const submitCorrection = async (req, res, next) => {
  try {
    const request = await attendanceService.submitCorrectionRequest(
      req.params.id,
      req.user.id,
      req.body
    );
    return response.success(res, { request }, 'Correction request submitted', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getStatus, clockIn, clockOut, getMyAttendance, getAllAttendance, submitCorrection };
