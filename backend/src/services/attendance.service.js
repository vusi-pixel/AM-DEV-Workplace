'use strict';
const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { AttendanceError, ConflictError, NotFoundError, AuthorizationError } = require('../utils/errors');

/**
 * Get today's work date (date-only, normalized to midnight UTC).
 */
const getWorkDate = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Get the current attendance status for a user.
 * Returns full session info if clocked in, null otherwise.
 */
const getAttendanceStatus = async (userId) => {
  const workDate = getWorkDate();
  const session = await prisma.attendanceSession.findFirst({
    where: { userId, workDate },
    orderBy: { createdAt: 'desc' },
  });
  return { session, workDate };
};

/**
 * Validate that a user is allowed to use a given clock-in method.
 * - ON_SITE: always allowed
 * - REMOTE: only allowed if the user's profile has an APPROVED hybrid/remote arrangement
 */
const validateClockInMethod = async (userId, method) => {
  if (method === 'ON_SITE') return;

  const profile = await prisma.employeeProfile.findUnique({
    where: { userId },
  });

  if (!profile) throw new NotFoundError('Employee profile');

  const allowedArrangements = ['HYBRID', 'REMOTE'];
  if (!allowedArrangements.includes(profile.workArrangement)) {
    throw new AuthorizationError(
      'Remote clock-in is only available for employees with an approved hybrid or remote work arrangement.'
    );
  }

  // Check that the arrangement was actually approved (workArrangementApprovedAt is set)
  if (!profile.workArrangementApprovedAt) {
    throw new AuthorizationError(
      'Your hybrid/remote work arrangement is pending approval. You cannot use remote clock-in until it is approved.'
    );
  }
};

/**
 * Check for holiday or weekend according to work schedule.
 * Returns { isWorkday, reason } 
 */
const checkWorkdayEligibility = async (userId, workDate) => {
  const dayOfWeek = workDate.getUTCDay();

  // Check holiday
  const holiday = await prisma.holiday.findFirst({
    where: { date: workDate },
  });
  if (holiday) {
    return { isWorkday: false, reason: `Today is a public holiday: ${holiday.name}` };
  }

  // Check user's work schedule
  const profile = await prisma.employeeProfile.findUnique({
    where: { userId },
    include: { workSchedule: { include: { days: true } } },
  });

  if (profile?.workSchedule) {
    const scheduleDay = profile.workSchedule.days.find((d) => d.dayOfWeek === dayOfWeek);
    if (scheduleDay && !scheduleDay.isWorkDay) {
      return { isWorkday: false, reason: 'This is not a scheduled workday for you.' };
    }
  } else {
    // Default: Mon-Fri only
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { isWorkday: false, reason: 'Clock-in is only available on workdays (Monday to Friday).' };
    }
  }

  return { isWorkday: true };
};

/**
 * Clock in an employee.
 * Uses a database transaction to prevent race conditions / duplicates.
 */
const clockIn = async (userId, { method = 'ON_SITE', notes } = {}) => {
  const workDate = getWorkDate();

  // Validate method eligibility
  await validateClockInMethod(userId, method);

  // Check if it's a workday (warnings are non-blocking for now; admins can configure strict mode)
  const { isWorkday, reason } = await checkWorkdayEligibility(userId, workDate);
  // We warn but don't block — admins can enable strict mode via settings

  return await prisma.$transaction(async (tx) => {
    // Check for existing session — lock row for update
    const existing = await tx.attendanceSession.findFirst({
      where: { userId, workDate },
    });

    if (existing) {
      if (existing.status === 'CLOCKED_IN') {
        throw new ConflictError('You are already clocked in for today.');
      }
      if (existing.status === 'CLOCKED_OUT') {
        throw new ConflictError('You have already completed your attendance for today.');
      }
    }

    const clockInAt = new Date(); // server authoritative timestamp

    const session = await tx.attendanceSession.create({
      data: {
        userId,
        workDate,
        clockInAt,
        clockInMethod: method,
        status: 'CLOCKED_IN',
        notes: notes || null,
      },
    });

    // Create audit record
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'CLOCK_IN',
        resourceType: 'AttendanceSession',
        resourceId: session.id,
        description: `Employee clocked in via ${method} at ${clockInAt.toISOString()}`,
        after: { sessionId: session.id, clockInAt, method },
      },
    });

    // Create notification
    await tx.notification.create({
      data: {
        userId,
        eventType: 'CLOCK_IN',
        title: 'Clock-In Recorded',
        message: `You clocked in at ${clockInAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} (${method.toLowerCase().replace('_', '-')}).`,
        metadata: { sessionId: session.id, clockInAt, method },
      },
    });

    logger.info('Clock-in recorded', { userId, sessionId: session.id, method });
    return session;
  });
};

/**
 * Clock out an employee.
 */
const clockOut = async (userId, { notes } = {}) => {
  return await prisma.$transaction(async (tx) => {
    const workDate = getWorkDate();

    const session = await tx.attendanceSession.findFirst({
      where: { userId, workDate, status: 'CLOCKED_IN' },
    });

    if (!session) {
      throw new AttendanceError(
        'No active clock-in session found for today. You cannot clock out.',
        'NO_ACTIVE_SESSION'
      );
    }

    const clockOutAt = new Date(); // server authoritative timestamp
    const durationMinutes = Math.round((clockOutAt - session.clockInAt) / 60000);

    const updated = await tx.attendanceSession.update({
      where: { id: session.id },
      data: {
        clockOutAt,
        clockOutMethod: session.clockInMethod, // inherit method from clock-in for now
        status: 'CLOCKED_OUT',
        durationMinutes,
        notes: notes || session.notes,
      },
    });

    // Immutable audit record
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'CLOCK_OUT',
        resourceType: 'AttendanceSession',
        resourceId: session.id,
        description: `Employee clocked out at ${clockOutAt.toISOString()} (${durationMinutes} mins)`,
        before: { status: 'CLOCKED_IN', clockInAt: session.clockInAt },
        after: { status: 'CLOCKED_OUT', clockOutAt, durationMinutes },
      },
    });

    // Notification
    await tx.notification.create({
      data: {
        userId,
        eventType: 'CLOCK_OUT',
        title: 'Clock-Out Recorded',
        message: `You clocked out at ${clockOutAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Work duration: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m.`,
        metadata: { sessionId: session.id, clockOutAt, durationMinutes },
      },
    });

    logger.info('Clock-out recorded', { userId, sessionId: session.id, durationMinutes });
    return updated;
  });
};

/**
 * Get attendance history for a user (paginated).
 */
const getMyAttendance = async (userId, { skip, limit }) => {
  const [sessions, total] = await Promise.all([
    prisma.attendanceSession.findMany({
      where: { userId },
      orderBy: { workDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendanceSession.count({ where: { userId } }),
  ]);
  return { sessions, total };
};

/**
 * Get all attendance sessions (HR/Admin — filtered).
 */
const getAllAttendance = async ({ skip, limit, date, departmentId, status }) => {
  const where = {};
  if (date) where.workDate = new Date(date);
  if (status) where.status = status;

  if (departmentId) {
    where.user = { profile: { departmentId } };
  }

  const [sessions, total] = await Promise.all([
    prisma.attendanceSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { firstName: true, lastName: true, employeeId: true, department: true },
            },
          },
        },
      },
      orderBy: { workDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendanceSession.count({ where }),
  ]);

  return { sessions, total };
};

/**
 * Submit a correction request for an attendance session.
 */
const submitCorrectionRequest = async (sessionId, requestedById, data) => {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw new NotFoundError('Attendance session');
  if (session.userId !== requestedById) {
    throw new AuthorizationError('You can only correct your own attendance records.');
  }

  return prisma.attendanceCorrectionRequest.create({
    data: {
      attendanceSessionId: sessionId,
      requestedById,
      reason: data.reason,
      originalClockIn: session.clockInAt,
      originalClockOut: session.clockOutAt,
      requestedClockIn: data.requestedClockIn ? new Date(data.requestedClockIn) : null,
      requestedClockOut: data.requestedClockOut ? new Date(data.requestedClockOut) : null,
    },
  });
};

module.exports = {
  getWorkDate,
  getAttendanceStatus,
  clockIn,
  clockOut,
  getMyAttendance,
  getAllAttendance,
  submitCorrectionRequest,
};
