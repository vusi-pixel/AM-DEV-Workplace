'use strict';
const bcrypt = require('bcryptjs');

const DEFAULT_HASH = bcrypt.hashSync('Admin123!', 10);

const departments = [
  { id: 'dept-eng', name: 'Engineering', code: 'ENG', description: 'Core software engineering and architecture', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-hr', name: 'Human Resources', code: 'HR', description: 'HR operations, talent and compliance', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-fin', name: 'Finance', code: 'FIN', description: 'Financial planning, accounting and payroll', isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const workSchedules = [
  { id: 'sched-1', name: 'Standard Corporate Schedule', timezone: 'UTC', effectiveFrom: new Date('2023-01-01'), effectiveTo: null, isActive: true, days: [] },
];

const permissionsList = [
  'attendance.read.self', 'attendance.read.department', 'attendance.read.all',
  'attendance.clock_in', 'attendance.clock_out', 'attendance.correct', 'attendance.bypass',
  'employees.read', 'employees.create', 'employees.update', 'employees.deactivate',
  'leave.request', 'leave.review', 'hybrid.request', 'hybrid.review',
  'finance.read', 'finance.expenses.create', 'finance.expenses.approve',
  'projects.read', 'projects.manage', 'announcements.read', 'announcements.manage',
  'documents.read', 'documents.manage', 'users.manage', 'roles.manage',
  'audit.read', 'settings.manage',
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
    id: 'role-emp',
    name: 'Employee',
    description: 'Standard team member capabilities',
    isSystem: true,
    rolePermissions: allPermObjects
      .filter(p => ['attendance.read.self', 'attendance.clock_in', 'attendance.clock_out', 'leave.request', 'hybrid.request', 'announcements.read', 'documents.read', 'projects.read'].includes(p.key))
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
      jobTitle: 'VP of Technology & Infrastructure',
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
    userRoles: [{ userId: 'usr-hybrid', roleId: 'role-emp', role: roles[2] }],
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
      firstName: 'David',
      lastName: 'Sterling',
      displayName: 'David Sterling',
      phone: '+1 (555) 010-0004',
      jobTitle: 'Software Engineer II',
      workArrangement: 'ON_SITE',
      employmentStatus: 'ACTIVE',
      departmentId: 'dept-eng',
      department: departments[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userRoles: [{ userId: 'usr-emp', roleId: 'role-emp', role: roles[2] }],
  },
];

let attendanceSessions = [];
let workModeRequests = [];
let leaveRequests = [];
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

function createMockPrisma() {
  return {
    $queryRaw: async () => [{ '?column?': 1 }],
    $transaction: async (fn) => {
      if (typeof fn === 'function') {
        return fn(createMockPrisma());
      }
      return Promise.all(fn);
    },
    $disconnect: async () => {},

    user: {
      findUnique: async ({ where, include }) => {
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
      findMany: async ({ where, include, skip, take }) => {
        return JSON.parse(JSON.stringify(users));
      },
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
      create: async ({ data }) => {
        return { id: `prof-${Date.now()}`, ...data };
      },
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
      create: async ({ data }) => {
        return { id: `corr-${Date.now()}`, ...data, status: 'PENDING', createdAt: new Date() };
      },
    },

    notification: {
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
        const newLog = {
          id: `audit-${Date.now()}`,
          createdAt: new Date(),
          ...data,
        };
        const u = users.find(x => x.id === data.actorId);
        if (u) {
          newLog.actor = { email: u.email, profile: u.profile };
        }
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
};
