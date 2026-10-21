'use strict';
const prisma = require('../config/prisma');
const logger = require('../config/logger');

/**
 * Session hydration middleware.
 * Runs on every request. If a valid session exists, loads the full user
 * with their roles, permissions, and current attendance status.
 * This ensures we never trust browser-supplied identity data.
 */
const hydrateSession = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    req.user = null;
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: {
        profile: {
          include: {
            department: true,
            workSchedule: { include: { days: true } },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      req.user = null;
      req.session.destroy(() => {});
      return next();
    }

    // Collect unique permissions from all roles
    const permissions = new Set();
    const roles = [];
    for (const userRole of user.userRoles) {
      roles.push(userRole.role.name);
      for (const rp of userRole.role.rolePermissions) {
        permissions.add(rp.permission.key);
      }
    }

    // Check active attendance session for today
    const today = new Date();
    const workDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const activeSession = await prisma.attendanceSession.findFirst({
      where: {
        userId: user.id,
        workDate,
        status: 'CLOCKED_IN',
      },
    });

    req.user = {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      isFirstLogin: user.isFirstLogin,
      profile: user.profile,
      roles,
      permissions: Array.from(permissions),
      hasActiveAttendance: !!activeSession,
      activeAttendanceSession: activeSession || null,
    };

    next();
  } catch (err) {
    logger.error('Session hydration failed', { error: err.message });
    req.user = null;
    next();
  }
};

module.exports = { hydrateSession };
