'use strict';

/**
 * Standard success response
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * Standard paginated response
 */
const paginated = (res, { data, total, page, limit }) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Standard error response
 */
const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, paginated, error };
