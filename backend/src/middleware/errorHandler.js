'use strict';
const { ZodError } = require('zod');
const logger = require('../config/logger');
const { AppError } = require('../utils/errors');
const response = require('../utils/response');

/**
 * Centralized error handler.
 * Must be registered last in Express middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error (never log passwords or tokens)
  if (err.statusCode >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });
  } else {
    logger.warn(err.message, { path: req.path, method: req.method, code: err.code });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return response.error(
      res,
      'Validation failed',
      400,
      err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    );
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return response.error(res, 'A record with this value already exists', 409);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return response.error(res, 'Record not found', 404);
  }

  // Known application errors
  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // Unknown errors — don't leak internals
  return response.error(res, 'An unexpected error occurred', 500);
};

/**
 * Handle 404 for unmatched routes.
 */
const notFoundHandler = (req, res) => {
  return response.error(res, `Route ${req.method} ${req.path} not found`, 404);
};

module.exports = { errorHandler, notFoundHandler };
