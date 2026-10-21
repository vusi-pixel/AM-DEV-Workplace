'use strict';

/**
 * Parse pagination query params with safe defaults.
 */
const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Get today's date in YYYY-MM-DD format for a given timezone offset.
 * For simplicity in dev we use UTC. In prod configure TZ env.
 */
const getTodayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Strip sensitive fields from a user object before returning to client.
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
};

/**
 * Generate a formatted employee ID.
 */
const generateEmployeeId = (count) => {
  return `EMP-${String(count + 1).padStart(4, '0')}`;
};

module.exports = { parsePagination, getTodayDate, sanitizeUser, generateEmployeeId };
