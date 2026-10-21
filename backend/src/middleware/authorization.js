'use strict';
const { AuthorizationError } = require('../utils/errors');

/**
 * Require specific permission(s).
 * Usage: requirePermission('attendance.clock_in')
 *        requirePermission(['hr.read', 'hr.write'])
 */
const requirePermission = (...permissions) => {
  const required = permissions.flat();
  return (req, res, next) => {
    if (!req.user) return next(new AuthorizationError());
    const userPerms = req.user.permissions || [];
    const hasAll = required.every((p) => userPerms.includes(p));
    if (!hasAll) return next(new AuthorizationError());
    next();
  };
};

/**
 * Require at least one of the listed permissions.
 */
const requireAnyPermission = (...permissions) => {
  const required = permissions.flat();
  return (req, res, next) => {
    if (!req.user) return next(new AuthorizationError());
    const userPerms = req.user.permissions || [];
    const hasAny = required.some((p) => userPerms.includes(p));
    if (!hasAny) return next(new AuthorizationError());
    next();
  };
};

/**
 * Require that the authenticated user is accessing their own resource
 * OR has an elevated permission.
 *
 * Usage: requireSelfOrPermission('employees.read')
 *        (req.params.id must be the target user id)
 */
const requireSelfOrPermission = (elevatedPermission) => {
  return (req, res, next) => {
    if (!req.user) return next(new AuthorizationError());
    if (req.params.id === req.user.id) return next();
    const userPerms = req.user.permissions || [];
    if (userPerms.includes(elevatedPermission)) return next();
    return next(new AuthorizationError());
  };
};

/**
 * Require an active clock-in session for work resources.
 * Skip this check if the user has `attendance.bypass` (e.g. sysadmin).
 */
const requireActiveAttendance = (req, res, next) => {
  if (!req.user) return next(new AuthorizationError());
  const perms = req.user.permissions || [];
  if (perms.includes('attendance.bypass')) return next();
  if (!req.user.hasActiveAttendance) {
    return next(
      new AuthorizationError(
        'You must clock in to access this resource. Please clock in to continue.'
      )
    );
  }
  next();
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireSelfOrPermission,
  requireActiveAttendance,
};
