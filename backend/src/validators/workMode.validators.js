'use strict';
const { z } = require('zod');

const workModeRequestSchema = z.object({
  requestedArrangement: z.enum(['HYBRID', 'REMOTE', 'ON_SITE']),
  reason: z.string().min(20, 'Please provide a detailed reason (at least 20 characters)'),
  effectiveFrom: z.string().datetime().optional().nullable(),
  effectiveTo: z.string().datetime().optional().nullable(),
});

const reviewRequestSchema = z.object({
  reviewComments: z.string().min(5, 'Please provide review comments').optional(),
});

const rejectRequestSchema = z.object({
  reviewComments: z.string().min(5, 'Review comments required when rejecting'),
});

const revokeRequestSchema = z.object({
  reviewComments: z.string().min(5, 'Please provide a reason for revocation'),
});

module.exports = { workModeRequestSchema, reviewRequestSchema, rejectRequestSchema, revokeRequestSchema };
