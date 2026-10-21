'use strict';
const express = require('express');
const employeeController = require('../controllers/employee.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission, requireSelfOrPermission } = require('../middleware/authorization');
const { validateBody } = require('../middleware/validate');
const { createEmployeeSchema, updateEmployeeSchema, updateStatusSchema } = require('../validators/employee.validators');

const router = express.Router();
router.use(requireAuth);

router.get('/', requirePermission('employees.read'), employeeController.list);
router.get('/:id', requireSelfOrPermission('employees.read'), employeeController.getOne);
router.post('/', requirePermission('employees.create'), validateBody(createEmployeeSchema), employeeController.create);
router.patch('/:id', requirePermission('employees.update'), validateBody(updateEmployeeSchema), employeeController.update);
router.patch('/:id/status', requirePermission('employees.deactivate'), validateBody(updateStatusSchema), employeeController.updateStatus);

module.exports = router;
