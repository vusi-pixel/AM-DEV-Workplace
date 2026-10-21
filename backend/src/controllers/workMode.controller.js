'use strict';
const workModeService = require('../services/workMode.service');
const response = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

const submit = async (req, res, next) => {
  try {
    const request = await workModeService.submitRequest(req.user.id, req.body);
    return response.success(res, { request }, 'Work mode request submitted', 201);
  } catch (err) {
    next(err);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const requests = await workModeService.getMyRequests(req.user.id);
    return response.success(res, { requests });
  } catch (err) {
    next(err);
  }
};

const listAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status } = req.query;
    const { requests, total } = await workModeService.listRequests({ skip, limit, status });
    return response.paginated(res, { data: requests, total, page, limit });
  } catch (err) {
    next(err);
  }
};

const approve = async (req, res, next) => {
  try {
    const request = await workModeService.approveRequest(req.params.id, req.user.id, req.body.reviewComments);
    return response.success(res, { request }, 'Request approved');
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const request = await workModeService.rejectRequest(req.params.id, req.user.id, req.body.reviewComments);
    return response.success(res, { request }, 'Request rejected');
  } catch (err) {
    next(err);
  }
};

const revoke = async (req, res, next) => {
  try {
    const request = await workModeService.revokeRequest(req.params.id, req.user.id, req.body.reviewComments);
    return response.success(res, { request }, 'Arrangement revoked');
  } catch (err) {
    next(err);
  }
};

module.exports = { submit, getMyRequests, listAll, approve, reject, revoke };
