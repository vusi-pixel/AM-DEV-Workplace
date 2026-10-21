'use strict';
const prisma = require('../config/prisma');
const { hashPassword } = require('./auth.service');
const { NotFoundError, ConflictError, AuthorizationError } = require('../utils/errors');
const { generateEmployeeId } = require('../utils/helpers');
const logger = require('../config/logger');

const EMPLOYEE_SELECT = {
  id: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  profile: {
    include: {
      department: { select: { id: true, name: true, code: true } },
      workSchedule: { select: { id: true, name: true } },
    },
  },
  userRoles: {
    include: { role: { select: { id: true, name: true } } },
  },
};

/**
 * List employees with pagination and filtering.
 */
const listEmployees = async ({ skip, limit, search, departmentId, status }) => {
  const where = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { profile: { firstName: { contains: search, mode: 'insensitive' } } },
      { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      { profile: { employeeId: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (departmentId) where.profile = { ...where.profile, departmentId };
  if (status === 'active') where.isActive = true;
  if (status === 'inactive') where.isActive = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: EMPLOYEE_SELECT,
      orderBy: { profile: { lastName: 'asc' } },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
};

/**
 * Get a single employee by ID.
 */
const getEmployee = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: EMPLOYEE_SELECT,
  });
  if (!user) throw new NotFoundError('Employee');
  return user;
};

/**
 * Create a new employee account.
 */
const createEmployee = async (data, createdBy) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError('An account with this email already exists');

  // Generate employee ID
  const count = await prisma.employeeProfile.count();
  const employeeId = generateEmployeeId(count);

  // Default password (employee must change on first login)
  const tempPassword = `AMDev@${Math.random().toString(36).slice(2, 10)}`;
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        isFirstLogin: true,
        profile: {
          create: {
            employeeId,
            firstName: data.firstName,
            lastName: data.lastName,
            jobTitle: data.jobTitle || null,
            departmentId: data.departmentId || null,
            managerId: data.managerId || null,
            workArrangement: data.workArrangement || 'ON_SITE',
            workScheduleId: data.workScheduleId || null,
            hireDate: data.hireDate ? new Date(data.hireDate) : null,
          },
        },
      },
      select: EMPLOYEE_SELECT,
    });

    // Assign roles
    if (data.roleIds && data.roleIds.length > 0) {
      await tx.userRole.createMany({
        data: data.roleIds.map((roleId) => ({ userId: newUser.id, roleId, grantedBy: createdBy })),
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId: createdBy,
        action: 'CREATE',
        resourceType: 'User',
        resourceId: newUser.id,
        description: `Employee account created: ${data.email} (${employeeId})`,
        after: { email: data.email, employeeId },
      },
    });

    return newUser;
  });

  logger.info('Employee created', { userId: user.id, employeeId, by: createdBy });

  // Return temp password so admin can share it securely
  return { user, tempPassword };
};

/**
 * Update employee profile fields.
 */
const updateEmployee = async (userId, data, actorId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Employee');

  const before = await prisma.employeeProfile.findUnique({ where: { userId } });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.employeeProfile.update({
      where: { userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.workScheduleId !== undefined && { workScheduleId: data.workScheduleId }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: 'UPDATE',
        resourceType: 'EmployeeProfile',
        resourceId: userId,
        description: `Employee profile updated`,
        before: before ? { firstName: before.firstName, lastName: before.lastName } : null,
        after: data,
      },
    });

    return tx.user.findUnique({ where: { id: userId }, select: EMPLOYEE_SELECT });
  });

  return updated;
};

/**
 * Activate or deactivate an employee account.
 */
const setEmployeeStatus = async (userId, isActive, reason, actorId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Employee');

  // Prevent deactivating yourself
  if (userId === actorId && !isActive) {
    throw new AuthorizationError('You cannot deactivate your own account.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { isActive } });

    await tx.auditLog.create({
      data: {
        actorId,
        action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
        resourceType: 'User',
        resourceId: userId,
        description: `Account ${isActive ? 'activated' : 'deactivated'}. Reason: ${reason}`,
        before: { isActive: !isActive },
        after: { isActive },
      },
    });

    await tx.notification.create({
      data: {
        userId,
        eventType: isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
        title: isActive ? 'Account Activated' : 'Account Deactivated',
        message: isActive
          ? 'Your account has been activated. You can now log in.'
          : 'Your account has been deactivated. Contact HR if you believe this is an error.',
      },
    });
  });

  logger.info(`Employee account ${isActive ? 'activated' : 'deactivated'}`, { userId, by: actorId, reason });
};

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, setEmployeeStatus };
