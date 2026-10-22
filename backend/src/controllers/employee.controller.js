'use strict';
const employeeService = require('../services/employee.service');
const response = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

const directory = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search } = req.query;
    const { users, total } = await employeeService.listEmployees({ skip, limit, search, status: 'active' });
    const directory = users.map((u) => ({
      id: u.id,
      email: u.email,
      roles: (u.userRoles || []).map((ur) => ur.role?.name).filter(Boolean),
      profile: u.profile
        ? {
            firstName: u.profile.firstName,
            lastName: u.profile.lastName,
            displayName: u.profile.displayName,
            jobTitle: u.profile.jobTitle,
            employeeId: u.profile.employeeId,
            department: u.profile.department,
            workArrangement: u.profile.workArrangement,
            avatarUrl: u.profile.avatarUrl,
          }
        : null,
    }));
    return response.paginated(res, { data: directory, total, page, limit });
  } catch (err) {
    next(err);
  }
};

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

module.exports = { list, directory, getOne, create, update, updateStatus };
