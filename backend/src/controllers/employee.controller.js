'use strict';
const employeeService = require('../services/employee.service');
const response = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

const list = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, departmentId, status } = req.query;
    const { users, total } = await employeeService.listEmployees({ skip, limit, search, departmentId, status });
    return response.paginated(res, { data: users, total, page, limit });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const user = await employeeService.getEmployee(req.params.id);
    return response.success(res, { employee: user });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { user, tempPassword } = await employeeService.createEmployee(req.body, req.user.id);
    return response.success(res, { employee: user, tempPassword }, 'Employee created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await employeeService.updateEmployee(req.params.id, req.body, req.user.id);
    return response.success(res, { employee: user }, 'Employee updated successfully');
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    await employeeService.setEmployeeStatus(req.params.id, req.body.isActive, req.body.reason, req.user.id);
    return response.success(res, null, `Employee ${req.body.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, create, update, updateStatus };
