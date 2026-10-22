'use strict';
const response = require('../utils/response');
const { expenseClaims, departmentBudgets, attendanceSessions, users } = require('../config/mockStore');

const getDashboard = async (req, res, next) => {
  try {
    const totalPayrollEstimate = 184500.00;
    const totalExpensesPending = expenseClaims.filter(e => e.status === 'PENDING').length;
    const totalExpensesApprovedAmount = expenseClaims
      .filter(e => e.status === 'APPROVED')
      .reduce((acc, cur) => acc + cur.amount, 0);

    const totalBudget = departmentBudgets.reduce((acc, cur) => acc + cur.totalBudget, 0);
    const totalSpent = departmentBudgets.reduce((acc, cur) => acc + cur.spent, 0);

    return response.success(res, {
      kpis: {
        totalPayrollEstimate,
        totalExpensesPending,
        totalExpensesApprovedAmount,
        totalBudget,
        totalSpent,
        budgetBurnRatePercent: Math.round((totalSpent / totalBudget) * 100),
      },
      departmentBudgets,
      recentClaims: expenseClaims.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
};

const getPayrollHours = async (req, res, next) => {
  try {
    // Generate payroll hours breakdown per employee from attendance logs
    const payrollList = users.map((u) => {
      const userSessions = attendanceSessions.filter(s => s.userId === u.id);
      const totalMinutes = userSessions.reduce((acc, s) => acc + (s.durationMinutes || 480), 0);
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(0, totalHours - 40);
      const hourlyRate = u.profile?.jobTitle?.includes('VP') ? 95 : u.profile?.jobTitle?.includes('Director') ? 75 : u.profile?.jobTitle?.includes('Staff') ? 65 : 45;
      const grossPay = Math.round((regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5) * 100) / 100;

      return {
        userId: u.id,
        employeeId: u.profile?.employeeId,
        name: `${u.profile?.firstName} ${u.profile?.lastName}`,
        email: u.email,
        department: u.profile?.department?.name || 'General',
        jobTitle: u.profile?.jobTitle,
        hourlyRate,
        regularHours,
        overtimeHours,
        totalHours,
        grossPay,
        paymentStatus: 'PAYROLL_READY',
        missedPunches: 0,
      };
    });

    return response.success(res, payrollList);
  } catch (err) {
    next(err);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    return response.success(res, expenseClaims);
  } catch (err) {
    next(err);
  }
};

const submitExpense = async (req, res, next) => {
  try {
    const { category, amount, merchant, expenseDate, justification, receiptUrl } = req.body;
    const newClaim = {
      id: `exp-${Date.now()}`,
      userId: req.user.id,
      userEmail: req.user.email,
      employeeName: `${req.user.profile?.firstName || 'Employee'} ${req.user.profile?.lastName || ''}`.trim(),
      category,
      amount: parseFloat(amount),
      merchant,
      expenseDate: expenseDate || new Date().toISOString().split('T')[0],
      status: 'PENDING',
      receiptUrl: receiptUrl || 'uploaded_receipt.pdf',
      justification,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    };
    expenseClaims.unshift(newClaim);
    return response.success(res, newClaim, 'Expense claim submitted for audit and finance reimbursement');
  } catch (err) {
    next(err);
  }
};

const approveExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const claim = expenseClaims.find(e => e.id === id);
    if (!claim) return response.notFound(res, 'Expense claim not found');

    claim.status = 'APPROVED';
    claim.reviewedBy = req.user.profile?.displayName || req.user.email;
    claim.reviewedAt = new Date().toISOString();

    return response.success(res, claim, 'Expense claim approved for disbursement');
  } catch (err) {
    next(err);
  }
};

const rejectExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const claim = expenseClaims.find(e => e.id === id);
    if (!claim) return response.notFound(res, 'Expense claim not found');

    claim.status = 'REJECTED';
    claim.rejectionReason = reason || 'Non-compliant expense under corporate policy';
    claim.reviewedBy = req.user.profile?.displayName || req.user.email;
    claim.reviewedAt = new Date().toISOString();

    return response.success(res, claim, 'Expense claim rejected');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getPayrollHours,
  getExpenses,
  submitExpense,
  approveExpense,
  rejectExpense,
};
