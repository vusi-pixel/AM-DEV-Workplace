'use strict';
const { z } = require('zod');

const createEmployeeSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  jobTitle: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  workArrangement: z.enum(['ON_SITE', 'HYBRID', 'REMOTE']).default('ON_SITE'),
  workScheduleId: z.string().uuid().optional().nullable(),
  roleIds: z.array(z.string().uuid()).optional().default([]),
  hireDate: z.string().datetime().optional().nullable(),
});

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
  jobTitle: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  workArrangement: z.enum(['ON_SITE', 'HYBRID', 'REMOTE']).optional(),
  workScheduleId: z.string().uuid().optional().nullable(),
  phone: z.string().optional().nullable(),
  displayName: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().min(5, 'Please provide a reason'),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema, updateStatusSchema };
