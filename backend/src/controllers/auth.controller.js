'use strict';
const authService = require('../services/auth.service');
const response = require('../utils/response');
const logger = require('../config/logger');
const prisma = require('../config/prisma');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    // Regenerate session to prevent fixation attacks
    req.session.regenerate(async (err) => {
      if (err) return next(err);
      req.session.userId = user.id;

      // Reload user permissions into session
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          profile: { include: { department: true } },
          userRoles: {
            include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
          },
        },
      });

      const permissions = new Set();
      const roles = [];
      for (const ur of fullUser.userRoles) {
        roles.push(ur.role.name);
        for (const rp of ur.role.rolePermissions) {
          permissions.add(rp.permission.key);
        }
      }

      // Store minimal data in session for quick lookups
      req.session.userEmail = fullUser.email;

      return response.success(res, {
        user: {
          id: fullUser.id,
          email: fullUser.email,
          isFirstLogin: fullUser.isFirstLogin,
          isActive: fullUser.isActive,
          profile: fullUser.profile,
          roles,
          permissions: Array.from(permissions),
        },
      }, 'Login successful');
    });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    return response.success(res, null, 'Logged out successfully');
  });
};

const me = async (req, res, next) => {
  try {
    return response.success(res, { user: req.user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return response.success(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, me, changePassword };
