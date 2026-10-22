'use strict';
const prisma = require('../config/prisma');
const response = require('../utils/response');
const { hasPermission, isMockPrisma, displayName } = require('../utils/rbac');

const mapProject = (p, userId) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  status: p.status,
  startDate: p.startDate,
  endDate: p.endDate,
  createdAt: p.createdAt,
  memberCount: p.members?.length || p.memberCount || 0,
  taskCount: p.tasks?.length || p.taskCount || 0,
  isMember: (p.members || []).some((m) => m.userId === userId) || p.isMember === true,
  milestones: p.milestones || [],
  members: (p.members || []).map((m) => ({
    userId: m.userId,
    role: m.role,
    name: m.user?.profile?.displayName || `${m.user?.profile?.firstName || ''} ${m.user?.profile?.lastName || ''}`.trim() || m.user?.email,
  })),
});

const getProjects = async (req, res, next) => {
  try {
    if (isMockPrisma(prisma)) {
      const { tasks } = require('../config/mockStore');
      const names = [...new Set(tasks.filter((t) => t.projectName).map((t) => t.projectName))];
      const projects = names.map((name, idx) => ({
        id: `proj-${idx + 1}`,
        name,
        description: `Tracked project: ${name}`,
        status: 'ACTIVE',
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
        memberCount: 1,
        taskCount: tasks.filter((t) => t.projectName === name).length,
        isMember: true,
        milestones: [],
        members: [],
      }));
      return response.success(res, { projects });
    }

    const canManage = hasPermission(req.user, 'projects.manage');
    const where = canManage
      ? {}
      : { members: { some: { userId: req.user.id } } };

    const projects = await prisma.project.findMany({
      where,
      include: {
        members: { include: { user: { include: { profile: true } } } },
        tasks: { select: { id: true } },
        milestones: { orderBy: { dueDate: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return response.success(res, { projects: projects.map((p) => mapProject(p, req.user.id)) });
  } catch (err) {
    next(err);
  }
};

const getCalendar = async (req, res, next) => {
  try {
    if (isMockPrisma(prisma) || !prisma.calendarEvent) {
      const { timelineEvents } = require('../config/mockStore');
      const events = (timelineEvents || []).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startsAt: e.eventAt,
        endsAt: null,
        location: null,
        audience: e.audience,
        createdById: e.createdByUserId,
      }));
      return response.success(res, { events });
    }

    const events = await prisma.calendarEvent.findMany({
      orderBy: { startsAt: 'asc' },
    });
    const visible = events.filter((e) => !e.audience || e.audience === 'ALL' || e.createdById === req.user.id);
    return response.success(res, { events: visible });
  } catch (err) {
    next(err);
  }
};

const createCalendarEvent = async (req, res, next) => {
  try {
    if (!hasPermission(req.user, 'announcements.manage') && !hasPermission(req.user, 'projects.manage')) {
      return response.error(res, 'You are not authorised to create calendar events', 403);
    }
    const { title, description, startsAt, endsAt, location, audience } = req.body;
    if (!title || !startsAt) return response.error(res, 'title and startsAt are required', 400);

    if (isMockPrisma(prisma) || !prisma.calendarEvent) {
      const { timelineEvents } = require('../config/mockStore');
      const ev = {
        id: `cal-${Date.now()}`,
        type: 'MEETING',
        color: 'blue',
        title,
        description: description || '',
        audience: audience || 'ALL',
        eventAt: startsAt,
        createdByUserId: req.user.id,
        createdAt: new Date().toISOString(),
      };
      timelineEvents.unshift(ev);
      return response.success(res, { event: ev }, 'Event created', 201);
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        location: location || null,
        audience: audience || 'ALL',
        createdById: req.user.id,
      },
    });
    return response.success(res, { event }, 'Event created', 201);
  } catch (err) {
    next(err);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    if (isMockPrisma(prisma) || !prisma.announcement) {
      return response.success(res, { announcements: [] });
    }
    const announcements = await prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
    return response.success(res, { announcements });
  } catch (err) {
    next(err);
  }
};

const publishAnnouncement = async (req, res, next) => {
  try {
    if (!hasPermission(req.user, 'announcements.manage')) {
      return response.error(res, 'You are not authorised to publish announcements', 403);
    }
    const { title, content, departmentId } = req.body;
    if (!title || !content) return response.error(res, 'title and content are required', 400);

    if (isMockPrisma(prisma) || !prisma.announcement) {
      await prisma.timelineEvent.create({
        data: {
          type: 'ANNOUNCEMENT',
          color: 'green',
          title,
          description: content,
          audience: 'ALL',
          eventAt: new Date(),
          createdByUserId: req.user.id,
        },
      });
      return response.success(res, { announcement: { title, content } }, 'Announcement published', 201);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: req.user.id,
        departmentId: departmentId || null,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    await prisma.timelineEvent.create({
      data: {
        type: 'ANNOUNCEMENT',
        color: 'green',
        title,
        description: content.slice(0, 240),
        audience: 'ALL',
        departmentId: departmentId || null,
        resourceType: 'Announcement',
        resourceId: announcement.id,
        eventAt: new Date(),
        createdByUserId: req.user.id,
      },
    }).catch(() => null);

    return response.success(res, { announcement }, 'Announcement published', 201);
  } catch (err) {
    next(err);
  }
};

const getMyExpenses = async (req, res, next) => {
  try {
    if (isMockPrisma(prisma)) {
      const { expenseClaims } = require('../config/mockStore');
      const mine = expenseClaims.filter((e) => e.userId === req.user.id || e.employeeId === req.user.id);
      return response.success(res, { expenses: mine });
    }
    const expenses = await prisma.expenseClaim.findMany({
      where: { employeeId: req.user.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return response.success(res, { expenses });
  } catch (err) {
    next(err);
  }
};

const submitExpense = async (req, res, next) => {
  try {
    const { category, amount, merchant, expenseDate, justification, title } = req.body;
    if (!amount || Number(amount) <= 0) return response.error(res, 'A valid amount is required', 400);

    if (isMockPrisma(prisma)) {
      const { expenseClaims } = require('../config/mockStore');
      const newClaim = {
        id: `exp-${Date.now()}`,
        userId: req.user.id,
        employeeId: req.user.id,
        userEmail: req.user.email,
        employeeName: displayName(req.user),
        category: category || 'General',
        amount: parseFloat(amount),
        merchant: merchant || title || 'Expense',
        title: title || merchant || 'Expense claim',
        expenseDate: expenseDate || new Date().toISOString().split('T')[0],
        status: 'PENDING',
        receiptUrl: null,
        justification: justification || '',
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date().toISOString(),
      };
      expenseClaims.unshift(newClaim);
      return response.success(res, { expense: newClaim }, 'Expense claim submitted', 201);
    }

    let categoryRow = await prisma.expenseCategory.findFirst({
      where: { name: category || 'General' },
    });
    if (!categoryRow) {
      categoryRow = await prisma.expenseCategory.create({
        data: { name: category || 'General', description: 'Employee-submitted category' },
      });
    }

    const expense = await prisma.expenseClaim.create({
      data: {
        employeeId: req.user.id,
        categoryId: categoryRow.id,
        title: title || merchant || 'Expense claim',
        description: justification || null,
        amount,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        status: 'SUBMITTED',
      },
    });
    return response.success(res, { expense }, 'Expense claim submitted', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  getCalendar,
  createCalendarEvent,
  getAnnouncements,
  publishAnnouncement,
  getMyExpenses,
  submitExpense,
};
