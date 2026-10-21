'use strict';
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { AuthenticationError, NotFoundError } = require('../utils/errors');
const { sanitizeUser } = require('../utils/helpers');

const SALT_ROUNDS = 12;

/**
 * Hash a password.
 */
const hashPassword = async (plaintext) => {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
};

/**
 * Verify a plaintext password against a hash.
 */
const verifyPassword = async (plaintext, hash) => {
  return bcrypt.compare(plaintext, hash);
};

/**
 * Attempt to log in with email and password.
 * Returns the user record (without passwordHash) on success.
 * Throws AuthenticationError on failure.
 */
const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      profile: { include: { department: true } },
    },
  });

  if (!user) {
    // Use constant-time comparison to avoid timing attacks
    await bcrypt.compare(password, '$2b$12$invalidhashfortimingprotection');
    throw new AuthenticationError('Invalid credentials');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Your account has been deactivated');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info('User logged in', { userId: user.id });
  return sanitizeUser(user);
};

/**
 * Change a user's password.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new AuthenticationError('Current password is incorrect');

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, isFirstLogin: false },
  });

  logger.info('Password changed', { userId });
};

module.exports = { hashPassword, verifyPassword, login, changePassword };
