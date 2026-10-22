import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { PayrollTable } from '../components/PayrollTable';
import { 
  DollarSign, Receipt, PieChart, PlusCircle, CheckCircle2, 
  XCircle, FileText, Download, Building, ArrowUpRight, ShieldCheck 
} from 'lucide-react';
import api from '../../../services/api';
import { ExpenseClaim, DepartmentBudget } from '../../../types';

export const FinancePortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'payroll' | 'expenses' | 'budgets'>('payroll');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New claim modal
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('Software Subscription');
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [justification, setJustification] = useState<string>('');
  const [claimSubmitting, setClaimSubmitting] = useState<boolean>(false);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [dashRes, expRes] = await Promise.all([
        api.get<{ success: boolean; data: any }>('/finance/dashboard').catch(() => null),
        api.get<{ success: boolean; data: ExpenseClaim[] }>('/finance/expenses').catch(() => null),
      ]);

      if (dashRes?.data?.data) {
        setDashboardData(dashRes.data.data);
        setBudgets(dashRes.data.data.departmentBudgets || []);
      }
      if (expRes?.data?.data) {
        setExpenses(expRes.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleApproveExpense = async (id: string) => {
    try {
      await api.post(`/finance/expenses/${id}/approve`);
      alert('Expense claim approved for reimbursement disbursement.');
      fetchFinanceData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRejectExpense = async (id: string) => {
    const reason = prompt('Rejection reason:') || 'Missing tax invoice or non-allowable item';
    try {
      await api.post(`/finance/expenses/${id}/reject`, { reason });
      alert('Expense claim rejected.');
      fetchFinanceData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSubmitting(true);
    try {
      await api.post('/finance/expenses', {
        category,
        amount: parseFloat(amount),
        merchant,
        expenseDate,
        justification,
      });
      alert('Expense claim submitted for audit.');
      setShowClaimModal(false);
      setAmount('');
      setMerchant('');
      setJustification('');
      fetchFinanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const kpis = dashboardData?.kpis || {
    totalPayrollEstimate: 184500,
    totalExpensesPending: 1,
    totalExpensesApprovedAmount: 1539.5,
    budgetBurnRatePercent: 65,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Finance & Accounting Operations
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Corporate Finance, Payroll & Expenses</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Attendance hours reconciliation, employee reimbursement audits, and fiscal budget tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowClaimModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-900/30 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Expense Claim</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto w-fit">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'payroll' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Payroll Hours Reconciliation
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'expenses' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Expense Reimbursements ({expenses.filter(e => e.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'budgets' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          Departmental Budgets
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Monthly Payroll</span>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">${kpis.totalPayrollEstimate.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">Calculated from verified clock hours</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Claims Awaiting Audit</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-400">{kpis.totalExpensesPending} Claims</div>
          <div className="text-xs text-slate-400 mt-1">Requires finance controller review</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Disbursements</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">${kpis.totalExpensesApprovedAmount.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">Ready for bank transfer</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget Burn Rate</span>
          <div className="mt-2 text-2xl font-extrabold text-cyan-400">{kpis.budgetBurnRatePercent}%</div>
          <div className="text-xs text-slate-400 mt-1">Annual fiscal adherence: Normal</div>
        </div>
      </div>

      {/* Tab 1: Payroll Table */}
      {activeTab === 'payroll' && <PayrollTable />}

      {/* Tab 2: Expense Claims Audit */}
      {activeTab === 'expenses' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Employee Expense Claims & Receipt Audit</span>
              </h2>
              <p className="text-xs text-slate-400">Review receipts and approve corporate expense disbursements</p>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No expense claims logged.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Merchant</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white">{e.employeeName}</td>
                      <td className="py-3 px-4 text-slate-300">{e.category}</td>
                      <td className="py-3 px-4 text-slate-400">{e.merchant}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white">${e.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{e.expenseDate}</td>
                      <td className="py-3 px-4">
                        <span className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-mono text-[11px]">
                          <FileText className="w-3.5 h-3.5" />
                          {e.receiptUrl}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          e.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' :
                          e.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {e.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveExpense(e.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectExpense(e.id)}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Department Budgets */}
      {activeTab === 'budgets' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <span>Departmental Budget Allocations (FY 2026)</span>
              </h2>
              <p className="text-xs text-slate-400">Quarterly spend, committed allocations, and remaining balances</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {budgets.map((b) => {
              const percent = Math.round((b.spent / b.totalBudget) * 100);
              return (
                <div key={b.department} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{b.department}</span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">{percent}% spent</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Allocated: <strong className="text-slate-200 font-mono">${b.totalBudget.toLocaleString()}</strong></span>
                    <span>Remaining: <strong className="text-emerald-400 font-mono">${(b.totalBudget - b.spent).toLocaleString()}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Submit Expense Claim</h3>
            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="Software Subscription">Software Subscription / SaaS</option>
                  <option value="Hardware & Ergonomics">Hardware & Equipment</option>
                  <option value="Travel & Meals">Corporate Travel & Client Entertainment</option>
                  <option value="Training & Books">Professional Education & Training</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="150.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS, GitHub, Apple Store, Delta Airlines"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Justification</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Project or client context explaining the corporate necessity of this expense..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                >
                  {claimSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
