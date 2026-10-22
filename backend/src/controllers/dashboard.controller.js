'use strict';
const prisma = require('../config/prisma');
const response = require('../utils/response');
const { hasPermission, isMockPrisma, displayName, departmentName } = require('../utils/rbac');

const mapTask = (t) => {
  if (!t) return t;
  const due = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : null;
  return {
    id: t.id,
    title: t.title,
    description: t.description || null,
    assignedToId: t.assignedToId || t.assigneeId || null,
    assignedById: t.assignedById || t.createdById || null,
    assignedByDept: t.assignedByDept || t.project?.name || 'General',
    priority: t.priority || 'MEDIUM',
    status: t.status === 'COMPLETED' ? 'DONE' : t.status,
    dueDate: due,
    projectId: t.projectId || null,
    projectName: t.projectName || t.project?.name || null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
};

const isOpenTask = (t) => t && t.status !== 'DONE' && t.status !== 'COMPLETED';

const fetchMyTasks = async (userId) => {
  if (isMockPrisma(prisma)) {
    let list = await prisma.task.findMany({ where: { assignedToId: userId } });
    if (!list || list.length === 0) {
      list = await prisma.task.findMany({});
    }
    return (list || []).map(mapTask);
  }
  const list = await prisma.task.findMany({
    where: { assigneeId: userId },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return list.map(mapTask);
};

const fetchMessages = async (userId) => {
  let list = await prisma.message.findMany({ where: { toUserId: userId } });
  if (!list || list.length === 0) {
    list = await prisma.message.findMany({});
  }
  return (list || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const fetchTimeline = async (user) => {
  const deptId = user?.profile?.departmentId || user?.profile?.department?.id || null;
  const list = await prisma.timelineEvent.findMany({});
  return (list || [])
    .filter((ev) => {
      if (!ev.audience || ev.audience === 'ALL') return true;
      if (ev.audience === 'ADMIN' && hasPermission(user, 'settings.manage')) return true;
      if (ev.audience === 'HR' && hasPermission(user, 'leave.review')) return true;
      if (ev.audience === 'FINANCE' && hasPermission(user, 'finance.read')) return true;
      if (deptId && ev.departmentId === deptId) return true;
      return false;
    })
    .sort((a, b) => new Date(b.eventAt) - new Date(a.eventAt));
};

const pendingApprovalsFor = async (user) => {
  const items = [];
  if (hasPermission(user, 'leave.review')) {
    const leaves = await prisma.leaveRequest.findMany({ where: { status: 'PENDING' } });
    (leaves || [])
      .filter((r) => r.employeeId !== user.id)
      .forEach((r) => items.push({
        id: r.id,
        kind: 'LEAVE',
        title: `Leave request (${r.leaveType})`,
        href: '/hr',
        createdAt: r.createdAt,
      }));
  }
  if (hasPermission(user, 'hybrid.review')) {
    const wms = await prisma.workModeRequest.findMany({ where: { status: 'PENDING' } });
    (wms || [])
      .filter((r) => r.employeeId !== user.id)
      .forEach((r) => items.push({
        id: r.id,
        kind: 'HYBRID',
        title: `Work-mode request (${r.requestedArrangement})`,
        href: '/hr',
        createdAt: r.createdAt,
      }));
  }
  if (hasPermission(user, 'finance.expenses.approve')) {
    let expenses = [];
    if (isMockPrisma(prisma)) {
      const { expenseClaims } = require('../config/mockStore');
      expenses = expenseClaims.filter((e) => e.status === 'PENDING' && e.userId !== user.id);
    } else {
      expenses = await prisma.expenseClaim.findMany({
        where: { status: { in: ['SUBMITTED', 'DRAFT'] }, employeeId: { not: user.id } },
      });
    }
    expenses.forEach((e) => items.push({
      id: e.id,
      kind: 'EXPENSE',
      title: e.title || e.merchant || 'Expense claim',
      href: '/finance',
      createdAt: e.createdAt,
    }));
  }
  return items;
};

const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [myTasks, messages, timeline, unreadNotifications, approvals] = await Promise.all([
      fetchMyTasks(userId),
      fetchMessages(userId),
      fetchTimeline(req.user),
      prisma.notification.count({ where: { userId, isRead: false } }),
      pendingApprovalsFor(req.user),
    ]);

    const activeTasks = myTasks.filter(isOpenTask);
    const unreadMessages = messages.filter((m) => !m.isRead).length;
    const projectUpdates = myTasks.filter((t) => t.projectName).length;

    return response.success(res, {
      summary: {
        todaysTasks: activeTasks.length,
        unreadMessages: unreadMessages + (unreadNotifications || 0),
        pendingApprovals: approvals.length,
        projectUpdates,
      },
      myTasks: activeTasks.slice(0, 8),
      messages: messages.slice(0, 8),
      timeline: timeline.slice(0, 8),
      approvals: approvals.slice(0, 8),
    });
  } catch (err) {
    next(err);
  }
};

const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await fetchMyTasks(req.user.id);
    return response.success(res, { tasks });
  } catch (err) {
    next(err);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED', 'BLOCKED'];
    if (!allowed.includes(status)) {
      return response.error(res, 'Invalid status value', 400);
    }
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return response.error(res, 'Task not found', 404);

    const assignee = task.assignedToId || task.assigneeId;
    const canManage = hasPermission(req.user, 'projects.manage') || assignee === req.user.id;
    if (!canManage) {
      return response.error(res, 'You are not authorised to update this task', 403);
    }

    const nextStatus = status === 'DONE' && !isMockPrisma(prisma) ? 'DONE' : status;
    const updated = await prisma.task.update({ where: { id }, data: { status: nextStatus } });

    await prisma.timelineEvent.create({
      data: {
        type: 'TASK',
        color: 'amber',
        title: `Task status updated: ${updated.title}`,
        description: `Status set to ${nextStatus}`,
        audience: 'ALL',
        resourceType: 'Task',
        resourceId: updated.id,
        eventAt: new Date(),
        createdByUserId: req.user.id,
      },
    }).catch(() => null);

    return response.success(res, { task: mapTask(updated) }, 'Task status updated');
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    if (!hasPermission(req.user, 'projects.manage') && !hasPermission(req.user, 'projects.read')) {
      return response.error(res, 'You are not authorised to create tasks', 403);
    }
    const { title, description, assigneeId, priority, dueDate, projectId } = req.body;
    if (!title) return response.error(res, 'Title is required', 400);

    const payload = {
      title,
      description: description || null,
      priority: priority || 'MEDIUM',
      status: 'TODO',
      dueDate: dueDate || null,
      assignedByDept: departmentName(req.user),
    };

    let created;
    if (isMockPrisma(prisma)) {
      created = await prisma.task.create({
        data: {
          ...payload,
          assignedToId: assigneeId || req.user.id,
          assignedById: req.user.id,
          projectId: projectId || null,
          projectName: null,
        },
      });
    } else {
      created = await prisma.task.create({
        data: {
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          status: 'TODO',
          dueDate: dueDate ? new Date(dueDate) : null,
          assigneeId: assigneeId || req.user.id,
          createdById: req.user.id,
          assignedByDept: payload.assignedByDept,
          projectId: projectId || null,
        },
        include: { project: { select: { name: true } } },
      });
    }

    if (created.assignedToId || created.assigneeId) {
      const target = created.assignedToId || created.assigneeId;
      if (target !== req.user.id) {
        await prisma.notification.create({
          data: {
            userId: target,
            eventType: 'TASK_ASSIGNED',
            title: 'New task assigned',
            message: `${displayName(req.user)} assigned you: ${created.title}`,
            metadata: { taskId: created.id },
          },
        }).catch(() => null);
      }
    }

    return response.success(res, { task: mapTask(created) }, 'Task created', 201);
  } catch (err) {
    next(err);
  }
};

const getMyMessages = async (req, res, next) => {
  try {
    const msgs = await fetchMessages(req.user.id);
    const unread = msgs.filter((m) => !m.isRead).length;
    return response.success(res, { messages: msgs, unreadCount: unread });
  } catch (err) {
    next(err);
  }
};

const markMessageRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const msgs = await prisma.message.findMany({ where: { toUserId: req.user.id } });
    const target = (msgs || []).find((m) => m.id === id);
    if (!target) return response.error(res, 'Message not found', 404);
    await prisma.message.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
    return response.success(res, {}, 'Message marked as read');
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { toUserId, subject, body } = req.body;
    if (!toUserId || !body) return response.error(res, 'toUserId and body are required', 400);
    if (toUserId === req.user.id) return response.error(res, 'You cannot message yourself', 400);

    const nm = await prisma.message.create({
      data: {
        fromUserId: req.user.id,
        fromName: displayName(req.user),
        fromDept: departmentName(req.user),
        toUserId,
        subject: subject || '(No Subject)',
        body,
        threadId: `thread-${Date.now()}`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: toUserId,
        eventType: 'MESSAGE_RECEIVED',
        title: `Message from ${displayName(req.user)}`,
        message: nm.subject,
        metadata: { messageId: nm.id },
      },
    }).catch(() => null);

    return response.success(res, { message: nm }, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
};

const getTimeline = async (req, res, next) => {
  try {
    const events = await fetchTimeline(req.user);
    return response.success(res, { events });
  } catch (err) {
    next(err);
  }
};

const getApprovals = async (req, res, next) => {
  try {
    const approvals = await pendingApprovalsFor(req.user);
    return response.success(res, { approvals });
  } catch (err) {
    next(err);
  }
};

const searchWorkplace = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (q.length < 2) return response.success(res, { results: [] });

    const [tasks, messages, events] = await Promise.all([
      fetchMyTasks(req.user.id),
      fetchMessages(req.user.id),
      fetchTimeline(req.user),
    ]);

    const results = [];
    tasks.filter((t) => t.title.toLowerCase().includes(q)).forEach((t) => {
      results.push({ type: 'task', id: t.id, title: t.title, href: '/tasks' });
    });
    messages.filter((m) => (m.subject || '').toLowerCase().includes(q) || (m.body || '').toLowerCase().includes(q)).forEach((m) => {
      results.push({ type: 'message', id: m.id, title: m.subject, href: '/messages' });
    });
    events.filter((e) => (e.title || '').toLowerCase().includes(q)).forEach((e) => {
      results.push({ type: 'timeline', id: e.id, title: e.title, href: '/' });
    });

    return response.success(res, { results: results.slice(0, 12) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getMyTasks,
  updateTaskStatus,
  createTask,
  getMyMessages,
  markMessageRead,
  sendMessage,
  getTimeline,
  getApprovals,
  searchWorkplace,
};
