'use strict';
const { z } = require('zod');
const { ValidationError } = require('../utils/errors');

/**
 * Returns an Express middleware that validates request body against a Zod schema.
 */
const validateBody = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (err) {
    next(err); // ZodError — picked up by errorHandler
  }
};

/**
 * Returns an Express middleware that validates query params against a Zod schema.
 */
const validateQuery = (schema) => async (req, res, next) => {
  try {
    req.query = await schema.parseAsync(req.query);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validateBody, validateQuery };
