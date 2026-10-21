'use strict';
const { z } = require('zod');

const clockInSchema = z.object({
  method: z.enum(['ON_SITE', 'REMOTE']).default('ON_SITE'),
  notes: z.string().max(500).optional(),
});

const clockOutSchema = z.object({
  notes: z.string().max(500).optional(),
});

const correctionRequestSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason of at least 10 characters'),
  requestedClockIn: z.string().datetime().optional().nullable(),
  requestedClockOut: z.string().datetime().optional().nullable(),
});

module.exports = { clockInSchema, clockOutSchema, correctionRequestSchema };
