'use strict';
const { AuthenticationError } = require('../utils/errors');

/**
 * Require an authenticated session.
 * Attaches req.user = { id, email, isActive, profile, permissions[] }
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return next(new AuthenticationError());
  }
  // req.user is populated by the session hydration middleware (see app.js)
  if (!req.user) {
    return next(new AuthenticationError());
  }
  if (!req.user.isActive) {
    return next(new AuthenticationError('Your account has been deactivated'));
  }
  next();
};

module.exports = { requireAuth };
