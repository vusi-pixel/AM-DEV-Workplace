'use strict';
/**
 * Development seed script.
 * Creates:
 *  - All system permissions
 *  - 5 default roles with appropriate permissions
 *  - Default work schedule (Mon-Fri 9-18)
 *  - 3 departments (Engineering, HR, Finance)
 *  - 1 System Administrator account
 *  - 4 dev employee accounts
 *
 * ⚠️  DEVELOPMENT ONLY — do not run in production.
 *     Seeded accounts have clearly labeled dev credentials.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Attendance
  { key: 'attendance.read.self', module: 'attendance', description: 'View own attendance records' },
  { key: 'attendance.read.department', module: 'attendance', description: 'View department attendance' },
  { key: 'attendance.read.all', module: 'attendance', description: 'View all attendance records' },
  { key: 'attendance.clock_in', module: 'attendance', description: 'Clock in' },
  { key: 'attendance.clock_out', module: 'attendance', description: 'Clock out' },
  { key: 'attendance.correct', module: 'attendance', description: 'Approve attendance corrections' },
  { key: 'attendance.bypass', module: 'attendance', description: 'Bypass active session requirement' },

  // Employees
  { key: 'employees.read', module: 'employees', description: 'View employee directory' },
  { key: 'employees.create', module: 'employees', description: 'Create employee accounts' },
  { key: 'employees.update', module: 'employees', description: 'Update employee profiles' },
  { key: 'employees.deactivate', module: 'employees', description: 'Activate/deactivate accounts' },

  // Leave
  { key: 'leave.request', module: 'leave', description: 'Submit leave requests' },
  { key: 'leave.review', module: 'leave', description: 'Review and approve leave requests' },

  // Hybrid/Work mode
  { key: 'hybrid.request', module: 'hybrid', description: 'Submit work mode requests' },
  { key: 'hybrid.review', module: 'hybrid', description: 'Review work mode requests' },

  // Finance
  { key: 'finance.read', module: 'finance', description: 'View finance dashboard' },
  { key: 'finance.expenses.create', module: 'finance', description: 'Submit expense claims' },
  { key: 'finance.expenses.approve', module: 'finance', description: 'Approve expense claims' },

  // Projects
  { key: 'projects.read', module: 'projects', description: 'View projects' },
  { key: 'projects.manage', module: 'projects', description: 'Create and manage projects' },

  // Announcements
  { key: 'announcements.read', module: 'announcements', description: 'View announcements' },
  { key: 'announcements.manage', module: 'announcements', description: 'Create and publish announcements' },

  // Documents
  { key: 'documents.read', module: 'documents', description: 'Read documents' },
  { key: 'documents.manage', module: 'documents', description: 'Upload and manage documents' },

  // Admin
  { key: 'users.manage', module: 'admin', description: 'Manage user accounts' },
  { key: 'roles.manage', module: 'admin', description: 'Assign and revoke roles' },
  { key: 'audit.read', module: 'admin', description: 'View audit logs' },
  { key: 'settings.manage', module: 'admin', description: 'Manage system settings' },
];

const ROLE_PERMISSION_MAP = {
  'Employee': [
    'attendance.read.self',
    'attendance.clock_in',
    'attendance.clock_out',
    'leave.request',
    'hybrid.request',
    'announcements.read',
    'documents.read',
    'projects.read',
    'finance.expenses.create',
  ],
  'HR Officer': [
    'attendance.read.self',
    'attendance.read.department',
    'attendance.read.all',
    'attendance.clock_in',
    'attendance.clock_out',
    'attendance.correct',
    'employees.read',
    'leave.request',
    'leave.review',
    'hybrid.request',
    'hybrid.review',
    'announcements.read',
    'announcements.manage',
    'documents.read',
    'documents.manage',
    'projects.read',
    'finance.expenses.create',
  ],
  'Finance Officer': [
    'attendance.read.self',
    'attendance.clock_in',
    'attendance.clock_out',
    'leave.request',
    'hybrid.request',
    'finance.read',
    'finance.expenses.create',
    'finance.expenses.approve',
    'announcements.read',
    'documents.read',
    'projects.read',
  ],
  'Department Manager': [
    'attendance.read.self',
    'attendance.read.department',
    'attendance.clock_in',
    'attendance.clock_out',
    'employees.read',
    'leave.request',
    'leave.review',
    'hybrid.request',
    'hybrid.review',
    'announcements.read',
    'announcements.manage',
    'documents.read',
    'documents.manage',
    'projects.read',
    'projects.manage',
    'finance.expenses.create',
    'finance.read',
  ],
  'System Administrator': [
    // All permissions
    ...PERMISSIONS.map((p) => p.key),
  ],
};

async function seed() {
  console.log('\n🌱 Starting development seed...\n');

  // ─── Permissions ─────────────────────────────────────────────────────────────
  console.log('Creating permissions...');
  const permissionRecords = {};
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: perm.key },
      create: perm,
      update: { description: perm.description },
    });
    permissionRecords[perm.key] = record;
  }

  // ─── Roles ────────────────────────────────────────────────────────────────────
  console.log('Creating roles...');
  const roleRecords = {};
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName, isSystem: true, description: `${roleName} role` },
      update: {},
    });
    roleRecords[roleName] = role;

    // Assign permissions to role
    const uniqueKeys = [...new Set(permKeys)];
    for (const key of uniqueKeys) {
      const perm = permissionRecords[key];
      if (!perm) { console.warn(`  ⚠️  Permission ${key} not found`); continue; }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        create: { roleId: role.id, permissionId: perm.id },
        update: {},
      });
    }
  }

  // ─── Departments ──────────────────────────────────────────────────────────────
  console.log('Creating departments...');
  const departments = [
    { name: 'Engineering', code: 'ENG', description: 'Software engineering and development' },
    { name: 'Human Resources', code: 'HR', description: 'People operations and HR management' },
    { name: 'Finance', code: 'FIN', description: 'Financial operations and accounting' },
    { name: 'Administration', code: 'ADMIN', description: 'Corporate administration and operations' },
  ];
  const deptRecords = {};
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      create: dept,
      update: {},
    });
    deptRecords[dept.code] = d;
  }

  // ─── Work Schedule ────────────────────────────────────────────────────────────
  console.log('Creating default work schedule...');
  let defaultSchedule = await prisma.workSchedule.findFirst({ where: { isDefault: true } });
  if (!defaultSchedule) {
    defaultSchedule = await prisma.workSchedule.create({
      data: {
        name: 'Standard Mon-Fri',
        description: '09:00 - 18:00, Monday to Friday',
        isDefault: true,
        days: {
          create: [
            { dayOfWeek: 1, isWorkDay: true, startTime: '09:00', endTime: '18:00', graceMinutes: 15 },
            { dayOfWeek: 2, isWorkDay: true, startTime: '09:00', endTime: '18:00', graceMinutes: 15 },
            { dayOfWeek: 3, isWorkDay: true, startTime: '09:00', endTime: '18:00', graceMinutes: 15 },
            { dayOfWeek: 4, isWorkDay: true, startTime: '09:00', endTime: '18:00', graceMinutes: 15 },
            { dayOfWeek: 5, isWorkDay: true, startTime: '09:00', endTime: '18:00', graceMinutes: 15 },
            { dayOfWeek: 0, isWorkDay: false, startTime: '00:00', endTime: '00:00' },
            { dayOfWeek: 6, isWorkDay: false, startTime: '00:00', endTime: '00:00' },
          ],
        },
      },
    });
  }

  // ─── Dev User Accounts ────────────────────────────────────────────────────────
  console.log('Creating dev user accounts...');

  const devUsers = [
    {
      email: 'admin@amdev.local',
      firstName: 'Alex',
      lastName: 'Mitchell',
      password: 'Admin@12345',
      role: 'System Administrator',
      department: 'ADMIN',
      employeeId: 'EMP-0001',
      jobTitle: 'System Administrator',
    },
    {
      email: 'hr@amdev.local',
      firstName: 'Sarah',
      lastName: 'Johnson',
      password: 'HROfficer@1',
      role: 'HR Officer',
      department: 'HR',
      employeeId: 'EMP-0002',
      jobTitle: 'HR Manager',
    },
    {
      email: 'finance@amdev.local',
      firstName: 'Marcus',
      lastName: 'Chen',
      password: 'Finance@123',
      role: 'Finance Officer',
      department: 'FIN',
      employeeId: 'EMP-0003',
      jobTitle: 'Finance Officer',
    },
    {
      email: 'employee@amdev.local',
      firstName: 'Jordan',
      lastName: 'Taylor',
      password: 'Employee@1',
      role: 'Employee',
      department: 'ENG',
      employeeId: 'EMP-0004',
      jobTitle: 'Software Engineer',
    },
    {
      email: 'hybrid@amdev.local',
      firstName: 'Riley',
      lastName: 'Park',
      password: 'Hybrid@1234',
      role: 'Employee',
      department: 'ENG',
      employeeId: 'EMP-0005',
      jobTitle: 'Senior Developer',
      workArrangement: 'HYBRID',
      workArrangementApprovedAt: new Date(),
    },
  ];

  for (const u of devUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`  ⏭️  Skipping existing user: ${u.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        isFirstLogin: false,
        profile: {
          create: {
            employeeId: u.employeeId,
            firstName: u.firstName,
            lastName: u.lastName,
            jobTitle: u.jobTitle,
            departmentId: deptRecords[u.department]?.id,
            workScheduleId: defaultSchedule.id,
            workArrangement: u.workArrangement || 'ON_SITE',
            workArrangementApprovedAt: u.workArrangementApprovedAt || null,
            hireDate: new Date('2024-01-01'),
          },
        },
      },
    });

    const role = roleRecords[u.role];
    if (role) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }

    console.log(`  ✅ Created: ${u.email} (${u.employeeId}) — role: ${u.role}`);
  }

  // ─── Sample announcements ─────────────────────────────────────────────────────
  console.log('\nCreating sample announcements...');
  const admin = await prisma.user.findUnique({ where: { email: 'admin@amdev.local' } });
  if (admin) {
    const announcementCount = await prisma.announcement.count();
    if (announcementCount === 0) {
      await prisma.announcement.createMany({
        data: [
          {
            title: 'Welcome to AM DEV Pro Workplace',
            content: 'We are pleased to launch the new AM DEV Pro corporate workplace platform. This portal centralizes all HR, attendance, finance, and project management needs.',
            authorId: admin.id,
            isPublished: true,
            publishedAt: new Date(),
          },
          {
            title: 'Attendance Policy Reminder',
            content: 'Please remember to clock in at the start of every working day and clock out before leaving. Your accurate attendance records are important for payroll and compliance.',
            authorId: admin.id,
            isPublished: true,
            publishedAt: new Date(),
          },
        ],
      });
    }
  }

  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  DEV ACCOUNTS (do not use in production):');
  console.log('  admin@amdev.local      — Admin@12345   [System Administrator]');
  console.log('  hr@amdev.local         — HROfficer@1   [HR Officer]');
  console.log('  finance@amdev.local    — Finance@123   [Finance Officer]');
  console.log('  employee@amdev.local   — Employee@1    [Employee — on-site]');
  console.log('  hybrid@amdev.local     — Hybrid@1234   [Employee — approved hybrid]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
