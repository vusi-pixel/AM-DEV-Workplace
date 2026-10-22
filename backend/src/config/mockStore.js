'use strict';
const bcrypt = require('bcryptjs');

const DEFAULT_HASH = bcrypt.hashSync('Admin123!', 10);

const departments = [
  { id: 'dept-eng', name: 'Engineering', code: 'ENG', description: 'Core software engineering and architecture', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-hr', name: 'Human Resources', code: 'HR', description: 'HR operations, talent, and workplace compliance', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-fin', name: 'Finance', code: 'FIN', description: 'Financial planning, accounting, expenses, and payroll', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-ops', name: 'Front Desk & Operations', code: 'OPS', description: 'Physical security, reception, and guest logistics', isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const workSchedules = [
  { id: 'sched-1', name: 'Standard Corporate Schedule', timezone: 'UTC', effectiveFrom: new Date('2023-01-01'), effectiveTo: null, isActive: true, days: [] },
];

const permissionsList = [
  // Attendance
  'attendance.read.self', 'attendance.read.department', 'attendance.read.all',
  'attendance.clock_in', 'attendance.clock_out', 'attendance.correct', 'attendance.bypass',
  // Employees
  'employees.read', 'employees.create', 'employees.update', 'employees.deactivate',
  // Leave
  'leave.request', 'leave.review',
  // Hybrid
  'hybrid.request', 'hybrid.review',
  // Finance
  'finance.read', 'finance.payroll.view', 'finance.payroll.process', 'finance.expenses.create', 'finance.expenses.approve', 'finance.budgets.manage',
  // Front Desk
  'frontdesk.visitors.manage', 'frontdesk.kiosk.checkin', 'frontdesk.deliveries.manage', 'frontdesk.muster.view',
  // Projects & Knowledge
  'projects.read', 'projects.manage', 'announcements.read', 'announcements.manage',
  'documents.read', 'documents.manage',
  // Admin & System
  'users.manage', 'roles.manage', 'audit.read', 'settings.manage',
];

const allPermObjects = permissionsList.map((p, idx) => ({ id: `p-${idx + 1}`, key: p, module: p.split('.')[0], description: p }));

const roles = [
  {
    id: 'role-admin',
    name: 'System Administrator',
    description: 'Full corporate platform administration',
    isSystem: true,
    rolePermissions: allPermObjects.map(p => ({ roleId: 'role-admin', permissionId: p.id, permission: p })),
  },
  {
    id: 'role-hr',
    name: 'HR Manager',
    description: 'Human resources and attendance reviewer',
    isSystem: true,
    rolePermissions: allPermObjects
      .filter(p => p.key.startsWith('attendance') || p.key.startsWith('employees') || p.key.startsWith('leave') || p.key.startsWith('hybrid') || p.key.startsWith('announcements') || p.key.startsWith('documents'))
      .map(p => ({ roleId: 'role-hr', permissionId: p.id, permission: p })),
  },
  {
    id: 'role-fin',
    name: 'Finance Manager',
    description: 'Corporate finance, expense auditing, and payroll processing',
    isSystem: true,
    rolePermissions: allPermObjects
      .filter(p => p.key.startsWith('finance') || ['attendance.read.all', 'employees.read', 'documents.read'].includes(p.key))
      .map(p => ({ roleId: 'role-fin', permissionId: p.id, permission: p })),
  },
  {
    id: 'role-frontdesk',
    name: 'Front Desk Officer',
    description: 'Reception, visitor tracking, physical access terminal, and safety muster',
    isSystem: true,
    rolePermissions: allPermObjects
      .filter(p => p.key.startsWith('frontdesk') || ['attendance.read.all', 'attendance.clock_in', 'employees.read'].includes(p.key))
      .map(p => ({ roleId: 'role-frontdesk', permissionId: p.id, permission: p })),
  },
  {
    id: 'role-emp',
    name: 'Employee',
    description: 'Standard team member capabilities',
    isSystem: true,
    rolePermissions: allPermObjects
      .filter(p => ['attendance.read.self', 'attendance.clock_in', 'attendance.clock_out', 'leave.request', 'hybrid.request', 'finance.expenses.create', 'announcements.read', 'documents.read', 'projects.read'].includes(p.key))
      .map(p => ({ roleId: 'role-emp', permissionId: p.id, permission: p })),
  },
];

const users = [
  {
    id: 'usr-admin',
    email: 'admin@amdev.com',
    passwordHash: DEFAULT_HASH,
    isActive: true,
    isFirstLogin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'prof-admin',
      userId: 'usr-admin',
      employeeId: 'EMP-001',
      firstName: 'System',
      lastName: 'Administrator',
      displayName: 'System Admin',
      phone: '+1 (555) 010-0001',
      jobTitle: 'VP of Technology & Systems',
      workArrangement: 'ON_SITE',
      employmentStatus: 'ACTIVE',
      departmentId: 'dept-eng',
      department: departments[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userRoles: [{ userId: 'usr-admin', roleId: 'role-admin', role: roles[0] }],
  },
  {
    id: 'usr-hr',
    email: 'hr@amdev.com',
    passwordHash: DEFAULT_HASH,
    isActive: true,
    isFirstLogin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'prof-hr',
      userId: 'usr-hr',
      employeeId: 'EMP-002',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      displayName: 'Sarah Jenkins',
      phone: '+1 (555) 010-0002',
      jobTitle: 'Director of People Operations',
      workArrangement: 'HYBRID',
      employmentStatus: 'ACTIVE',
      departmentId: 'dept-hr',
      department: departments[1],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userRoles: [{ userId: 'usr-hr', roleId: 'role-hr', role: roles[1] }],
  },
  {
    id: 'usr-fin',
    email: 'finance@amdev.com',
    passwordHash: DEFAULT_HASH,
    isActive: true,
    isFirstLogin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'prof-fin',
      userId: 'usr-fin',
      employeeId: 'EMP-005',
      firstName: 'David',
      lastName: 'Sterling',
      displayName: 'David Sterling',
      phone: '+1 (555) 010-0005',
      jobTitle: 'Controller & Head of Finance',
      workArrangement: 'ON_SITE',
      employmentStatus: 'ACTIVE',
      departmentId: 'dept-fin',
      department: departments[2],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userRoles: [{ userId: 'usr-fin', roleId: 'role-fin', role: roles[2] }],
  },
  {
    id: 'usr-frontdesk',
    email: 'frontdesk@amdev.com',
    passwordHash: DEFAULT_HASH,
    isActive: true,
    isFirstLogin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'prof-frontdesk',
      userId: 'usr-frontdesk',
      employeeId: 'EMP-006',
      firstName: 'Elena',
      lastName: 'Rostova',
      displayName: 'Elena Rostova',
      phone: '+1 (555) 010-0006',
      jobTitle: 'Operations & Front Desk Lead',
      workArrangement: 'ON_SITE',
      employmentStatus: 'ACTIVE',
      departmentId: 'dept-ops',
      department: departments[3],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userRoles: [{ userId: 'usr-frontdesk', roleId: 'role-frontdesk', role: roles[3] }],
  },
  {
    id: 'usr-hybrid',
    email: 'hybrid.emp@amdev.com',
    passwordHash: DEFAULT_HASH,
    isActive: true,
    isFirstLogin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'prof-hybrid',
      userId: 'usr-hybrid',
      employeeId: 'EMP-003',
      firstName: 'Marcus',
      lastName: 'Vance',
      displayName: 'Marcus Vance',
      phone: '+1 (555) 010-0003',
      jobTitle: 'Staff Full Stack Engineer',
      workArrangement: 'HYBRID',
      employmentStatus: 'ACTIVE',
      departmentId: 'dept-eng',
      department: departments[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userRoles: [{ userId: 'usr-hybrid', roleId: 'role-emp', role: roles[4] }],
  },
  {
    id: 'usr-emp',
    email: 'employee@amdev.com',
    passwordHash: DEFAULT_HASH,
    isActive: true,
    isFirstLogin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'prof-emp',
      userId: 'usr-emp',
      employeeId: 'EMP-004',
      firstName: 'Esther',
      lastName: 'N.',
      displayName: 'Esther N.',
      phone: '+1 (555) 010-0004',
      jobTitle: 'Employee',
      workArrangement: 'ON_SITE',
      employmentStatus: 'ACTIVE',
      departmentId: 'dept-eng',
      department: departments[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userRoles: [{ userId: 'usr-emp', roleId: 'role-emp', role: roles[4] }],
  },
];

let attendanceSessions = [
  {
    id: 'sess-seed-esther',
    userId: 'usr-emp',
    workDate: new Date().toISOString().split('T')[0],
    clockInAt: new Date(new Date().setHours(8, 12, 0, 0)).toISOString(),
    clockOutAt: null,
    clockInMethod: 'ON_SITE',
    clockOutMethod: null,
    status: 'CLOCKED_IN',
    durationMinutes: 504,
    notes: 'On-site standard workday',
    createdAt: new Date(),
  },
  {
    id: 'sess-seed-1',
    userId: 'usr-admin',
    workDate: new Date().toISOString().split('T')[0],
    clockInAt: new Date(new Date().setHours(8, 12, 0, 0)).toISOString(),
    clockOutAt: null,
    clockInMethod: 'ON_SITE',
    clockOutMethod: null,
    status: 'CLOCKED_IN',
    durationMinutes: 504,
    notes: 'Morning infrastructure security review',
    createdAt: new Date(),
  },
  {
    id: 'sess-seed-2',
    userId: 'usr-frontdesk',
    workDate: new Date().toISOString().split('T')[0],
    clockInAt: new Date(Date.now() - 18000000).toISOString(),
    clockOutAt: null,
    clockInMethod: 'ON_SITE',
    clockOutMethod: null,
    status: 'CLOCKED_IN',
    durationMinutes: 300,
    notes: 'Front Desk opening shift',
    createdAt: new Date(),
  },
];

let workModeRequests = [
  {
    id: 'wm-1',
    employeeId: 'usr-hybrid',
    requestedArrangement: 'HYBRID',
    reason: 'Sprint delivery remote Tuesdays and Thursdays for uninterrupted deep work.',
    effectiveFrom: '2026-02-01',
    effectiveTo: '2026-12-31',
    status: 'APPROVED',
    reviewedById: 'usr-hr',
    reviewedAt: new Date().toISOString(),
    reviewComments: 'Approved by People Ops in line with engineering hybrid quota.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    employee: { id: 'usr-hybrid', email: 'hybrid.emp@amdev.com', profile: users[4].profile },
  },
];

let leaveRequests = [
  {
    id: 'leave-1',
    employeeId: 'usr-emp',
    leaveType: 'ANNUAL',
    startDate: '2026-11-15',
    endDate: '2026-11-18',
    reason: 'Family wedding out of state.',
    status: 'PENDING',
    reviewedById: null,
    reviewedAt: null,
    reviewComments: null,
    createdAt: new Date().toISOString(),
  },
];

let notifications = [
  {
    id: 'notif-1',
    userId: 'usr-admin',
    eventType: 'SYSTEM',
    title: 'Platform Initialized',
    message: 'AM DEV Pro Workplace v1.0 active and running.',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
  },
  {
    id: 'notif-2',
    userId: 'usr-hybrid',
    eventType: 'HYBRID_UPDATE',
    title: 'Hybrid Policy Reminder',
    message: 'Ensure remote clock-ins are recorded before 09:30 AM.',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
  },
];

let auditLogs = [
  {
    id: 'audit-1',
    actorId: 'usr-admin',
    action: 'SYSTEM_START',
    resourceType: 'Platform',
    resourceId: 'amdev-core',
    description: 'Workplace Gateway initialized in development resilience mode',
    before: null,
    after: null,
    ipAddress: '127.0.0.1',
    createdAt: new Date(),
    actor: { email: 'admin@amdev.com', profile: { firstName: 'System', lastName: 'Admin' } },
  },
];

// ─── Finance specific data ────────────────────────────────────────────────────
let expenseClaims = [
  {
    id: 'exp-101',
    userId: 'usr-hybrid',
    userEmail: 'hybrid.emp@amdev.com',
    employeeName: 'Marcus Vance',
    category: 'Hardware & Ergonomics',
    amount: 289.50,
    merchant: 'Keychron Keyboards',
    expenseDate: '2026-10-14',
    status: 'APPROVED',
    receiptUrl: 'receipt_keychron_mech.pdf',
    justification: 'Ergonomic dual-host mechanical keyboard for remote workstation setup',
    reviewedBy: 'David Sterling',
    reviewedAt: '2026-10-16T11:20:00Z',
    createdAt: new Date(Date.now() - 500000000).toISOString(),
  },
  {
    id: 'exp-102',
    userId: 'usr-emp',
    userEmail: 'employee@amdev.com',
    employeeName: 'Alex Rivers',
    category: 'Software Subscription',
    amount: 149.00,
    merchant: 'JetBrains Annual IDE License',
    expenseDate: '2026-10-18',
    status: 'PENDING',
    receiptUrl: 'jetbrains_invoice_2026.pdf',
    justification: 'Annual WebStorm & DataGrip IDE suite for backend typescript services',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 200000000).toISOString(),
  },
  {
    id: 'exp-103',
    userId: 'usr-admin',
    userEmail: 'admin@amdev.com',
    employeeName: 'System Administrator',
    category: 'Cloud Infrastructure',
    amount: 1250.00,
    merchant: 'AWS Cloud Services',
    expenseDate: '2026-10-01',
    status: 'APPROVED',
    receiptUrl: 'aws_october_statement.pdf',
    justification: 'Monthly cluster compute & RDS multi-region redundancy billing',
    reviewedBy: 'David Sterling',
    reviewedAt: '2026-10-05T09:15:00Z',
    createdAt: new Date(Date.now() - 1000000000).toISOString(),
  },
];

let departmentBudgets = [
  { department: 'Engineering', totalBudget: 450000, spent: 312000, committed: 48000, currency: 'USD', fiscalYear: 2026 },
  { department: 'Human Resources', totalBudget: 120000, spent: 78500, committed: 12500, currency: 'USD', fiscalYear: 2026 },
  { department: 'Finance & Legal', totalBudget: 95000, spent: 54000, committed: 8200, currency: 'USD', fiscalYear: 2026 },
  { department: 'Front Desk & Operations', totalBudget: 85000, spent: 49200, committed: 6500, currency: 'USD', fiscalYear: 2026 },
];

// ─── Tasks ───────────────────────────────────────────────────────────────────
let tasks = [
  {
    id: 'task-1',
    title: 'Prepare Q2 Progress Report',
    description: 'Compile attendance, leave, and project metrics for Q2.',
    assignedToId: 'usr-emp',
    assignedById: 'usr-hr',
    assignedByDept: 'HR',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: new Date().toISOString().split('T')[0],
    projectId: null,
    projectName: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Review Client Proposal',
    description: 'Review the latest client proposal and provide feedback.',
    assignedToId: 'usr-emp',
    assignedById: 'usr-fin',
    assignedByDept: 'Finance',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: new Date().toISOString().split('T')[0],
    projectId: null,
    projectName: 'Client Onboarding Q4',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Update Project Timeline',
    description: 'Revise the project timeline based on new delivery dates.',
    assignedToId: 'usr-emp',
    assignedById: 'usr-admin',
    assignedByDept: 'Administration',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    projectId: null,
    projectName: 'Platform Delivery',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Complete System Architecture Review',
    description: 'Audit microservice dependencies and security permissions.',
    assignedToId: 'usr-emp',
    assignedById: 'usr-admin',
    assignedByDept: 'Engineering',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: new Date().toISOString().split('T')[0],
    projectId: null,
    projectName: 'Security Audit',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    title: 'Submit Weekly Operations Summary',
    description: 'Provide departmental summary to leadership team.',
    assignedToId: 'usr-emp',
    assignedById: 'usr-hr',
    assignedByDept: 'Operations',
    priority: 'LOW',
    status: 'TODO',
    dueDate: new Date().toISOString().split('T')[0],
    projectId: null,
    projectName: null,
    createdAt: new Date(Date.now() - 36000000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-admin-1',
    title: 'Prepare Q2 Progress Report',
    description: 'Compile attendance, leave, and project metrics for Q2.',
    assignedToId: 'usr-admin',
    assignedById: 'usr-hr',
    assignedByDept: 'HR',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: new Date().toISOString().split('T')[0],
    projectId: null,
    projectName: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-admin-2',
    title: 'Review Client Proposal',
    description: 'Review the latest client proposal and provide feedback.',
    assignedToId: 'usr-admin',
    assignedById: 'usr-fin',
    assignedByDept: 'Finance',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: new Date().toISOString().split('T')[0],
    projectId: null,
    projectName: 'Client Onboarding Q4',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-admin-3',
    title: 'Update Project Timeline',
    description: 'Revise the project timeline based on new delivery dates.',
    assignedToId: 'usr-admin',
    assignedById: 'usr-admin',
    assignedByDept: 'Administration',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    projectId: null,
    projectName: 'Platform Delivery',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── Messages / Conversations ─────────────────────────────────────────────────
let messages = [
  {
    id: 'msg-1',
    fromUserId: 'usr-hr',
    fromName: 'Sarah Okafor (HR)',
    fromDept: 'HR',
    toUserId: 'usr-emp',
    subject: 'Leave Balance Review',
    body: 'Please review your leave balance...',
    isRead: false,
    threadId: 'thread-1',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'msg-2',
    fromUserId: 'usr-hybrid',
    fromName: 'David Kim (Projects)',
    fromDept: 'Projects',
    toUserId: 'usr-emp',
    subject: 'Project Timeline Updated',
    body: 'Project timeline updated.',
    isRead: false,
    threadId: 'thread-2',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'msg-3',
    fromUserId: 'usr-fin',
    fromName: 'Finance Team',
    fromDept: 'Finance',
    toUserId: 'usr-emp',
    subject: 'Q1 Expenses Due',
    body: 'Q1 expenses are now due.',
    isRead: true,
    threadId: 'thread-3',
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 'msg-admin-1',
    fromUserId: 'usr-hr',
    fromName: 'Sarah Okafor (HR)',
    fromDept: 'HR',
    toUserId: 'usr-admin',
    subject: 'Leave Balance Review',
    body: 'Please review your leave balance...',
    isRead: false,
    threadId: 'thread-1',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'msg-admin-2',
    fromUserId: 'usr-hybrid',
    fromName: 'David Kim (Projects)',
    fromDept: 'Projects',
    toUserId: 'usr-admin',
    subject: 'Project Timeline Updated',
    body: 'Project timeline updated.',
    isRead: false,
    threadId: 'thread-2',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'msg-admin-3',
    fromUserId: 'usr-fin',
    fromName: 'Finance Team',
    fromDept: 'Finance',
    toUserId: 'usr-admin',
    subject: 'Q1 Expenses Due',
    body: 'Q1 expenses are now due.',
    isRead: true,
    threadId: 'thread-3',
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 'msg-4',
    fromUserId: 'usr-admin',
    fromName: 'System Administrator',
    fromDept: 'Administration',
    toUserId: 'usr-hr',
    subject: 'New Policy Draft',
    body: 'Please review the new hybrid work policy draft and provide feedback.',
    isRead: false,
    threadId: 'thread-4',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-5',
    fromUserId: 'usr-admin',
    fromName: 'System Administrator',
    fromDept: 'Administration',
    toUserId: 'usr-fin',
    subject: 'Budget Approval Required',
    body: 'The Q4 infrastructure budget requires your approval before Nov 1.',
    isRead: false,
    threadId: 'thread-5',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'msg-6',
    fromUserId: 'usr-hr',
    fromName: 'Sarah Jenkins',
    fromDept: 'HR',
    toUserId: 'usr-fin',
    subject: 'Payroll Submission',
    body: 'October payroll data is ready for review. Please process by the 25th.',
    isRead: false,
    threadId: 'thread-6',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
];

// ─── Company Timeline Events ──────────────────────────────────────────────────
let timelineEvents = [
  {
    id: 'tl-1',
    type: 'MEETING',
    color: 'blue',
    title: 'Team Sync Meeting – Project Updates',
    description: 'Quarterly project status sync across all departments.',
    audience: 'ALL',
    eventAt: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    createdByUserId: 'usr-admin',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tl-2',
    type: 'ANNOUNCEMENT',
    color: 'green',
    title: 'New HR Policy Published',
    description: 'Updated hybrid work policy is now live in the HR workspace.',
    audience: 'ALL',
    eventAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    createdByUserId: 'usr-hr',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'tl-3',
    type: 'FINANCE',
    color: 'purple',
    title: 'Q1 Financial Report Approved',
    description: 'The Q1 financial report has been reviewed and approved by the finance team.',
    audience: 'ALL',
    eventAt: new Date(Date.now() - 86400000).toISOString(),
    createdByUserId: 'usr-fin',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'tl-4',
    type: 'TASK',
    color: 'amber',
    title: 'Project Milestone: API Gateway v2 Released',
    description: 'The API Gateway v2.0 has been successfully deployed to production.',
    audience: 'ALL',
    eventAt: new Date(Date.now() - 172800000).toISOString(),
    createdByUserId: 'usr-hybrid',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: 'tl-5',
    type: 'HR',
    color: 'emerald',
    title: 'New Team Member Onboarded',
    description: 'Alex Rivers has joined the Engineering team as Junior Developer.',
    audience: 'ALL',
    eventAt: new Date(Date.now() - 604800000).toISOString(),
    createdByUserId: 'usr-hr',
    createdAt: new Date(Date.now() - 691200000).toISOString(),
  },
];

// ─── Front Desk specific data ─────────────────────────────────────────────────
let visitors = [
  {
    id: 'vis-1',
    fullName: 'Sophia Martinez',
    company: 'Stripe Security Audit',
    hostEmployee: 'Marcus Vance',
    hostEmail: 'hybrid.emp@amdev.com',
    badgeNumber: 'GUEST-042',
    purpose: 'PCI-DSS Compliance Assessment',
    checkInTime: new Date(Date.now() - 7200000).toISOString(),
    checkOutTime: null,
    status: 'ACTIVE_IN_BUILDING',
    idVerified: true,
  },
  {
    id: 'vis-2',
    fullName: 'Liam Chen',
    company: 'Cisco Systems',
    hostEmployee: 'System Administrator',
    hostEmail: 'admin@amdev.com',
    badgeNumber: 'VENDOR-019',
    purpose: 'Fiber Gateway Hardware Maintenance',
    checkInTime: new Date(Date.now() - 10800000).toISOString(),
    checkOutTime: null,
    status: 'ACTIVE_IN_BUILDING',
    idVerified: true,
  },
  {
    id: 'vis-3',
    fullName: 'Emma Watson',
    company: 'Candidate (Senior UX Designer)',
    hostEmployee: 'Sarah Jenkins',
    hostEmail: 'hr@amdev.com',
    badgeNumber: 'GUEST-040',
    purpose: 'Executive In-Person Final Interview',
    checkInTime: new Date(Date.now() - 21600000).toISOString(),
    checkOutTime: new Date(Date.now() - 14400000).toISOString(),
    status: 'CHECKED_OUT',
    idVerified: true,
  },
];

let deliveries = [
  {
    id: 'del-1',
    carrier: 'FedEx Express',
    trackingNumber: 'FX-8492049182',
    recipientEmail: 'hybrid.emp@amdev.com',
    recipientName: 'Marcus Vance',
    packageType: 'Hardware (Laptop Docking Station)',
    arrivedAt: new Date(Date.now() - 3600000).toISOString(),
    collectedAt: null,
    status: 'READY_FOR_PICKUP',
    receivedBy: 'Elena Rostova',
  },
  {
    id: 'del-2',
    carrier: 'DHL Priority',
    trackingNumber: 'DHL-2918392109',
    recipientEmail: 'hr@amdev.com',
    recipientName: 'Sarah Jenkins',
    packageType: 'Documents (Confidential Legal Contracts)',
    arrivedAt: new Date(Date.now() - 14400000).toISOString(),
    collectedAt: new Date(Date.now() - 7200000).toISOString(),
    status: 'COLLECTED',
    receivedBy: 'Elena Rostova',
  },
];

function createMockPrisma() {
  return {
    $queryRaw: async () => [{ '?column?': 1 }],
    $transaction: async (fn) => {
      if (typeof fn === 'function') {
        return fn(createMockPrisma());
      }
      return Promise.all(fn);
    },
    $disconnect: async () => { },

    user: {
      findUnique: async ({ where }) => {
        let u = null;
        if (where.id) u = users.find(x => x.id === where.id);
        else if (where.email) u = users.find(x => x.email.toLowerCase() === where.email.toLowerCase());
        return u ? JSON.parse(JSON.stringify(u)) : null;
      },
      findFirst: async ({ where }) => {
        let u = users[0];
        if (where?.id) u = users.find(x => x.id === where.id);
        return u ? JSON.parse(JSON.stringify(u)) : null;
      },
      findMany: async () => JSON.parse(JSON.stringify(users)),
      count: async () => users.length,
      update: async ({ where, data }) => {
        const u = users.find(x => x.id === where.id);
        if (u) Object.assign(u, data);
        return JSON.parse(JSON.stringify(u || {}));
      },
      create: async ({ data }) => {
        const id = `usr-${Date.now()}`;
        const nu = { id, ...data, userRoles: [] };
        users.push(nu);
        return JSON.parse(JSON.stringify(nu));
      },
    },

    employeeProfile: {
      findUnique: async ({ where }) => {
        let u = null;
        if (where.userId) u = users.find(x => x.id === where.userId);
        else if (where.id) u = users.find(x => x.profile?.id === where.id);
        return u?.profile ? JSON.parse(JSON.stringify(u.profile)) : null;
      },
      findFirst: async () => users[0].profile,
      findMany: async () => users.map(u => u.profile),
      count: async () => users.length,
      update: async ({ where, data }) => {
        const u = users.find(x => x.id === where.userId || x.profile?.id === where.id);
        if (u?.profile) Object.assign(u.profile, data);
        return JSON.parse(JSON.stringify(u?.profile || {}));
      },
      create: async ({ data }) => ({ id: `prof-${Date.now()}`, ...data }),
    },

    attendanceSession: {
      findFirst: async ({ where }) => {
        const sess = attendanceSessions.find(s => {
          if (where.userId && s.userId !== where.userId) return false;
          if (where.status && s.status !== where.status) return false;
          return true;
        });
        return sess ? JSON.parse(JSON.stringify(sess)) : null;
      },
      findUnique: async ({ where }) => {
        const s = attendanceSessions.find(x => x.id === where.id);
        return s ? JSON.parse(JSON.stringify(s)) : null;
      },
      findMany: async ({ where }) => {
        let list = attendanceSessions;
        if (where?.userId) list = list.filter(s => s.userId === where.userId);
        return JSON.parse(JSON.stringify(list));
      },
      count: async ({ where }) => {
        let list = attendanceSessions;
        if (where?.userId) list = list.filter(s => s.userId === where.userId);
        if (where?.status) list = list.filter(s => s.status === where.status);
        return list.length;
      },
      create: async ({ data }) => {
        const newSess = {
          id: `sess-${Date.now()}`,
          durationMinutes: null,
          clockOutAt: null,
          clockOutMethod: null,
          status: 'CLOCKED_IN',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        attendanceSessions.unshift(newSess);
        return JSON.parse(JSON.stringify(newSess));
      },
      update: async ({ where, data }) => {
        const s = attendanceSessions.find(x => x.id === where.id);
        if (s) Object.assign(s, data);
        return JSON.parse(JSON.stringify(s || {}));
      },
    },

    workModeRequest: {
      findFirst: async ({ where }) => {
        const req = workModeRequests.find(r => {
          if (where.employeeId && r.employeeId !== where.employeeId) return false;
          if (where.status && r.status !== where.status) return false;
          return true;
        });
        return req ? JSON.parse(JSON.stringify(req)) : null;
      },
      findUnique: async ({ where }) => {
        const req = workModeRequests.find(r => r.id === where.id);
        return req ? JSON.parse(JSON.stringify(req)) : null;
      },
      findMany: async ({ where }) => {
        let list = workModeRequests;
        if (where?.employeeId) list = list.filter(r => r.employeeId === where.employeeId);
        return JSON.parse(JSON.stringify(list));
      },
      count: async ({ where }) => {
        let list = workModeRequests;
        if (where?.status) list = list.filter(r => r.status === where.status);
        return list.length;
      },
      create: async ({ data }) => {
        const nr = {
          id: `wm-${Date.now()}`,
          status: 'PENDING',
          reviewedById: null,
          reviewedAt: null,
          reviewComments: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        const u = users.find(x => x.id === data.employeeId);
        if (u) {
          nr.employee = { id: u.id, email: u.email, profile: u.profile };
        }
        workModeRequests.unshift(nr);
        return JSON.parse(JSON.stringify(nr));
      },
      update: async ({ where, data }) => {
        const r = workModeRequests.find(x => x.id === where.id);
        if (r) Object.assign(r, data);
        return JSON.parse(JSON.stringify(r || {}));
      },
    },

    leaveRequest: {
      findFirst: async ({ where }) => {
        const l = leaveRequests.find(x => x.employeeId === where?.employeeId);
        return l ? JSON.parse(JSON.stringify(l)) : null;
      },
      findUnique: async ({ where }) => {
        const l = leaveRequests.find(x => x.id === where.id);
        return l ? JSON.parse(JSON.stringify(l)) : null;
      },
      findMany: async ({ where }) => {
        let list = leaveRequests;
        if (where?.employeeId) list = list.filter(l => l.employeeId === where.employeeId);
        return JSON.parse(JSON.stringify(list));
      },
      count: async ({ where }) => {
        let list = leaveRequests;
        if (where?.status) list = list.filter(l => l.status === where.status);
        return list.length;
      },
      create: async ({ data }) => {
        const nl = {
          id: `leave-${Date.now()}`,
          status: 'PENDING',
          reviewedById: null,
          reviewedAt: null,
          reviewComments: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        leaveRequests.unshift(nl);
        return JSON.parse(JSON.stringify(nl));
      },
      update: async ({ where, data }) => {
        const l = leaveRequests.find(x => x.id === where.id);
        if (l) Object.assign(l, data);
        return JSON.parse(JSON.stringify(l || {}));
      },
    },

    attendanceCorrectionRequest: {
      create: async ({ data }) => ({ id: `corr-${Date.now()}`, ...data, status: 'PENDING', createdAt: new Date() }),
    },

    notification: {
      create: async ({ data }) => {
        const n = { id: `notif-${Date.now()}`, isRead: false, readAt: null, createdAt: new Date(), ...data };
        notifications.unshift(n);
        return JSON.parse(JSON.stringify(n));
      },
      findMany: async ({ where }) => {
        let list = notifications;
        if (where?.userId) list = list.filter(n => n.userId === where.userId);
        return JSON.parse(JSON.stringify(list));
      },
      count: async ({ where }) => {
        let list = notifications;
        if (where?.userId) list = list.filter(n => n.userId === where.userId);
        if (where?.isRead !== undefined) list = list.filter(n => n.isRead === where.isRead);
        return list.length;
      },
      updateMany: async ({ where, data }) => {
        notifications.forEach(n => {
          if (where?.userId && n.userId === where.userId) Object.assign(n, data);
        });
        return { count: notifications.length };
      },
      update: async ({ where, data }) => {
        const n = notifications.find(x => x.id === where.id);
        if (n) Object.assign(n, data);
        return JSON.parse(JSON.stringify(n || {}));
      },
    },

    auditLog: {
      create: async ({ data }) => {
        const newLog = { id: `audit-${Date.now()}`, createdAt: new Date(), ...data };
        const u = users.find(x => x.id === data.actorId);
        if (u) newLog.actor = { email: u.email, profile: u.profile };
        auditLogs.unshift(newLog);
        return JSON.parse(JSON.stringify(newLog));
      },
      findMany: async () => JSON.parse(JSON.stringify(auditLogs)),
      count: async () => auditLogs.length,
    },

    holiday: {
      findFirst: async () => null,
      findMany: async () => [],
    },

    role: {
      findMany: async () => JSON.parse(JSON.stringify(roles)),
      findUnique: async ({ where }) => roles.find(r => r.name === where.name || r.id === where.id) || null,
    },

    permission: {
      findMany: async () => JSON.parse(JSON.stringify(allPermObjects)),
    },

    department: {
      findMany: async () => JSON.parse(JSON.stringify(departments)),
    },

    workSchedule: {
      findMany: async () => JSON.parse(JSON.stringify(workSchedules)),
    },

    task: {
      findMany: async ({ where } = {}) => {
        let list = tasks;
        if (where?.assignedToId) list = list.filter(t => t.assignedToId === where.assignedToId);
        if (where?.status) list = list.filter(t => t.status === where.status);
        return JSON.parse(JSON.stringify(list));
      },
      count: async ({ where } = {}) => {
        let list = tasks;
        if (where?.assignedToId) list = list.filter(t => t.assignedToId === where.assignedToId);
        if (where?.status && where.status !== 'DONE') list = list.filter(t => t.status !== 'DONE');
        return list.length;
      },
      findUnique: async ({ where }) => {
        const t = tasks.find(x => x.id === where.id);
        return t ? JSON.parse(JSON.stringify(t)) : null;
      },
      create: async ({ data }) => {
        const nt = { id: `task-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
        tasks.unshift(nt);
        return JSON.parse(JSON.stringify(nt));
      },
      update: async ({ where, data }) => {
        const t = tasks.find(x => x.id === where.id);
        if (t) Object.assign(t, data, { updatedAt: new Date().toISOString() });
        return JSON.parse(JSON.stringify(t || {}));
      },
    },

    message: {
      findMany: async ({ where } = {}) => {
        let list = messages;
        if (where?.toUserId) list = list.filter(m => m.toUserId === where.toUserId);
        if (where?.fromUserId) list = list.filter(m => m.fromUserId === where.fromUserId);
        return JSON.parse(JSON.stringify(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))));
      },
      count: async ({ where } = {}) => {
        let list = messages;
        if (where?.toUserId) list = list.filter(m => m.toUserId === where.toUserId);
        if (where?.isRead !== undefined) list = list.filter(m => m.isRead === where.isRead);
        return list.length;
      },
      create: async ({ data }) => {
        const nm = { id: `msg-${Date.now()}`, isRead: false, createdAt: new Date().toISOString(), ...data };
        messages.unshift(nm);
        return JSON.parse(JSON.stringify(nm));
      },
      update: async ({ where, data }) => {
        const m = messages.find(x => x.id === where.id);
        if (m) Object.assign(m, data);
        return JSON.parse(JSON.stringify(m || {}));
      },
    },

    timelineEvent: {
      findMany: async ({ where } = {}) => {
        let list = timelineEvents;
        if (where?.audience && where.audience !== 'ALL') list = list.filter(e => e.audience === where.audience || e.audience === 'ALL');
        return JSON.parse(JSON.stringify(list.sort((a, b) => new Date(b.eventAt) - new Date(a.eventAt))));
      },
      create: async ({ data }) => {
        const ne = { id: `tl-${Date.now()}`, createdAt: new Date().toISOString(), ...data };
        timelineEvents.unshift(ne);
        return JSON.parse(JSON.stringify(ne));
      },
    },
  };
}

const mockPrisma = createMockPrisma();

module.exports = {
  mockPrisma,
  users,
  departments,
  roles,
  workSchedules,
  attendanceSessions,
  workModeRequests,
  leaveRequests,
  auditLogs,
  notifications,
  expenseClaims,
  departmentBudgets,
  visitors,
  deliveries,
  tasks,
  messages,
  timelineEvents,
};
