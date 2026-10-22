'use strict';
const express = require('express');
const financeController = require('../controllers/finance.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');

const router = express.Router();
router.use(requireAuth);

router.get('/dashboard', requirePermission('finance.read'), financeController.getDashboard);
router.get('/payroll-hours', requirePermission('finance.payroll.view'), financeController.getPayrollHours);
router.get('/expenses', financeController.getExpenses);
router.post('/expenses', requirePermission('finance.expenses.create'), financeController.submitExpense);
router.post('/expenses/:id/approve', requirePermission('finance.expenses.approve'), financeController.approveExpense);
router.post('/expenses/:id/reject', requirePermission('finance.expenses.approve'), financeController.rejectExpense);

module.exports = router;
