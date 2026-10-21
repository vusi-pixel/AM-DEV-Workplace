'use strict';
const prisma = require('../config/prisma');
const { NotFoundError, AuthorizationError, ConflictError } = require('../utils/errors');
const logger = require('../config/logger');

/**
 * Submit a new work mode request.
 */
const submitRequest = async (employeeId, data) => {
  // Check for existing PENDING request
  const pending = await prisma.workModeRequest.findFirst({
    where: { employeeId, status: 'PENDING' },
  });
  if (pending) {
    throw new ConflictError('You already have a pending work mode request. Please wait for a decision before submitting another.');
  }

  const request = await prisma.$transaction(async (tx) => {
    const req = await tx.workModeRequest.create({
      data: {
        employeeId,
        requestedArrangement: data.requestedArrangement,
        reason: data.reason,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      },
    });

    await tx.notification.create({
      data: {
        userId: employeeId,
        eventType: 'HYBRID_REQUEST_SUBMITTED',
        title: 'Work Mode Request Submitted',
        message: `Your request for ${data.requestedArrangement.toLowerCase()} work arrangement has been submitted for review.`,
        metadata: { requestId: req.id },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: employeeId,
        action: 'CREATE',
        resourceType: 'WorkModeRequest',
        resourceId: req.id,
        description: `Work mode request submitted for ${data.requestedArrangement}`,
        after: { requestedArrangement: data.requestedArrangement, reason: data.reason },
      },
    });

    return req;
  });

  logger.info('Work mode request submitted', { requestId: request.id, employeeId });
  return request;
};

/**
 * Get all work mode requests (admin/HR).
 */
const listRequests = async ({ skip, limit, status }) => {
  const where = {};
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.workModeRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, employeeId: true } },
          },
        },
        reviewer: {
          select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.workModeRequest.count({ where }),
  ]);

  return { requests, total };
};

/**
 * Get work mode requests for a specific employee.
 */
const getMyRequests = async (employeeId) => {
  return prisma.workModeRequest.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Approve a work mode request.
 * Updates the employee profile's workArrangement.
 */
const approveRequest = async (requestId, reviewedById, comments) => {
  const request = await prisma.workModeRequest.findUnique({
    where: { id: requestId },
    include: { employee: true },
  });
  if (!request) throw new NotFoundError('Work mode request');
  if (request.status !== 'PENDING') {
    throw new ConflictError('This request has already been reviewed.');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.workModeRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedById,
        reviewedAt: new Date(),
        reviewComments: comments || null,
      },
    });

    // Update employee's work arrangement
    await tx.employeeProfile.update({
      where: { userId: request.employeeId },
      data: {
        workArrangement: request.requestedArrangement,
        workArrangementApprovedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: request.employeeId,
        eventType: 'HYBRID_REQUEST_APPROVED',
        title: 'Work Mode Request Approved',
        message: `Your request for ${request.requestedArrangement.toLowerCase()} work arrangement has been approved.`,
        metadata: { requestId },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: reviewedById,
        action: 'APPROVE',
        resourceType: 'WorkModeRequest',
        resourceId: requestId,
        description: `Work mode request approved for employee ${request.employeeId}`,
        after: { status: 'APPROVED', arrangement: request.requestedArrangement },
      },
    });

    return updated;
  });
};

/**
 * Reject a work mode request.
 */
const rejectRequest = async (requestId, reviewedById, comments) => {
  const request = await prisma.workModeRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError('Work mode request');
  if (request.status !== 'PENDING') throw new ConflictError('This request has already been reviewed.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.workModeRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', reviewedById, reviewedAt: new Date(), reviewComments: comments },
    });

    await tx.notification.create({
      data: {
        userId: request.employeeId,
        eventType: 'HYBRID_REQUEST_REJECTED',
        title: 'Work Mode Request Rejected',
        message: `Your request for ${request.requestedArrangement.toLowerCase()} work has been rejected.${comments ? ` Comment: ${comments}` : ''}`,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: reviewedById,
        action: 'REJECT',
        resourceType: 'WorkModeRequest',
        resourceId: requestId,
        description: `Work mode request rejected`,
        after: { status: 'REJECTED', reviewComments: comments },
      },
    });

    return updated;
  });
};

/**
 * Revoke a previously approved work mode arrangement.
 */
const revokeRequest = async (requestId, reviewedById, comments) => {
  const request = await prisma.workModeRequest.findUnique({
    where: { id: requestId },
    include: { employee: { include: { profile: true } } },
  });
  if (!request) throw new NotFoundError('Work mode request');
  if (request.status !== 'APPROVED') throw new ConflictError('Only approved arrangements can be revoked.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.workModeRequest.update({
      where: { id: requestId },
      data: { status: 'REVOKED', reviewedById, reviewedAt: new Date(), reviewComments: comments },
    });

    // Revert to ON_SITE
    await tx.employeeProfile.update({
      where: { userId: request.employeeId },
      data: { workArrangement: 'ON_SITE', workArrangementApprovedAt: null },
    });

    await tx.notification.create({
      data: {
        userId: request.employeeId,
        eventType: 'HYBRID_APPROVAL_REVOKED',
        title: 'Work Mode Approval Revoked',
        message: `Your ${request.requestedArrangement.toLowerCase()} work arrangement has been revoked. You will need to work on-site.${comments ? ` Reason: ${comments}` : ''}`,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: reviewedById,
        action: 'REVOKE',
        resourceType: 'WorkModeRequest',
        resourceId: requestId,
        description: `Work mode approval revoked`,
        after: { status: 'REVOKED', reviewComments: comments },
      },
    });

    return updated;
  });
};

module.exports = { submitRequest, listRequests, getMyRequests, approveRequest, rejectRequest, revokeRequest };
