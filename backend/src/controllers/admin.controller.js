'use strict';
const prisma = require('../config/prisma');
const response = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalDepts, pendingWorkMode, recentAudit] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.workModeRequest.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actor: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } },
      }),
    ]);

    return response.success(res, {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalDepts,
      pendingWorkMode,
      recentAudit,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Roles ────────────────────────────────────────────────────────────────────

const getRoles = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
    });
    return response.success(res, { roles });
  } catch (err) {
    next(err);
  }
};

// ─── Permissions ──────────────────────────────────────────────────────────────

const getPermissions = async (req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: { module: 'asc' } });
    return response.success(res, { permissions });
  } catch (err) {
    next(err);
  }
};

// ─── Departments ──────────────────────────────────────────────────────────────

const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
    });
    return response.success(res, { departments });
  } catch (err) {
    next(err);
  }
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });
    const { action, resourceType } = req.query;
    const where = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return response.paginated(res, { data: logs, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// ─── Work Schedules ───────────────────────────────────────────────────────────

const getSchedules = async (req, res, next) => {
  try {
    const schedules = await prisma.workSchedule.findMany({
      include: { days: true, _count: { select: { employees: true } } },
    });
    return response.success(res, { schedules });
  } catch (err) {
    next(err);
  }
};

// ─── Assign role to user ──────────────────────────────────────────────────────

const assignRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.body;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId, grantedBy: req.user.id },
      update: {},
    });
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'ROLE_CHANGE',
        resourceType: 'UserRole',
        resourceId: userId,
        description: `Role ${roleId} assigned to user ${userId}`,
      },
    });
    return response.success(res, null, 'Role assigned');
  } catch (err) {
    next(err);
  }
};

const revokeRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.body;

    // Prevent removing last admin
    const adminRole = await prisma.role.findFirst({ where: { name: 'System Administrator' } });
    if (adminRole && roleId === adminRole.id) {
      const adminCount = await prisma.userRole.count({ where: { roleId } });
      if (adminCount <= 1) {
        return response.error(res, 'Cannot remove the last System Administrator.', 400);
      }
    }

    await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'ROLE_CHANGE',
        resourceType: 'UserRole',
        resourceId: userId,
        description: `Role ${roleId} revoked from user ${userId}`,
      },
    });
    return response.success(res, null, 'Role revoked');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getRoles,
  getPermissions,
  getDepartments,
  getAuditLogs,
  getSchedules,
  assignRole,
  revokeRole,
};
