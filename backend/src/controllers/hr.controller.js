'use strict';
const prisma = require('../config/prisma');
const response = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

// ─── HR Dashboard ─────────────────────────────────────────────────────────────

const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const workDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const [
      totalActive,
      clockedInToday,
      pendingLeave,
      pendingWorkMode,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.attendanceSession.count({ where: { workDate, status: 'CLOCKED_IN' } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.workModeRequest.count({ where: { status: 'PENDING' } }),
    ]);

    const notClockedIn = totalActive - clockedInToday;

    return response.success(res, {
      totalActive,
      clockedInToday,
      notClockedIn: Math.max(0, notClockedIn),
      pendingLeave,
      pendingWorkMode,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Leave Requests ───────────────────────────────────────────────────────────

const getLeaveRequests = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status } = req.query;
    const where = status ? { status } : {};

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true, employeeId: true } },
            },
          },
          reviewer: {
            select: { id: true, profile: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return response.paginated(res, { data: requests, total, page, limit });
  } catch (err) {
    next(err);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const request = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return response.error(res, 'Leave request not found', 404);
    if (request.status !== 'PENDING') return response.error(res, 'Request already reviewed', 409);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.leaveRequest.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED', reviewedById: req.user.id, reviewedAt: new Date(), reviewComments: req.body.reviewComments || null },
      });
      await tx.notification.create({
        data: {
          userId: request.employeeId,
          eventType: 'LEAVE_REQUEST_APPROVED',
          title: 'Leave Request Approved',
          message: `Your leave request from ${request.startDate.toDateString()} to ${request.endDate.toDateString()} has been approved.`,
        },
      });
      return u;
    });

    return response.success(res, { request: updated }, 'Leave request approved');
  } catch (err) {
    next(err);
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    const request = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return response.error(res, 'Leave request not found', 404);
    if (request.status !== 'PENDING') return response.error(res, 'Request already reviewed', 409);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.leaveRequest.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED', reviewedById: req.user.id, reviewedAt: new Date(), reviewComments: req.body.reviewComments || null },
      });
      await tx.notification.create({
        data: {
          userId: request.employeeId,
          eventType: 'LEAVE_REQUEST_REJECTED',
          title: 'Leave Request Rejected',
          message: `Your leave request has been rejected.${req.body.reviewComments ? ` Reason: ${req.body.reviewComments}` : ''}`,
        },
      });
      return u;
    });

    return response.success(res, { request: updated }, 'Leave request rejected');
  } catch (err) {
    next(err);
  }
};

// ─── Leave (employee) ─────────────────────────────────────────────────────────

const submitLeave = async (req, res, next) => {
  try {
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: req.user.id,
        leaveType: req.body.leaveType,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        reason: req.body.reason || null,
      },
    });
    return response.success(res, { request }, 'Leave request submitted', 201);
  } catch (err) {
    next(err);
  }
};

const getMyLeave = async (req, res, next) => {
  try {
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return response.success(res, { requests });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getLeaveRequests, approveLeave, rejectLeave, submitLeave, getMyLeave };
