import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, PlusCircle, CheckCircle2, XCircle, Clock, 
  Send, UserCheck, ShieldAlert, AlertTriangle 
} from 'lucide-react';
import api from '../services/api';
import { LeaveRequest } from '../types';

export const LeaveManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [hrLeaves, setHrLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<string>('ANNUAL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const canReview = hasPermission('leave.review');

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: LeaveRequest[] }>('/hr/leave/me');
      if (res.data?.success) {
        setMyLeaves(res.data.data || []);
      }

      if (canReview) {
        const hrRes = await api.get<{ success: boolean; data: LeaveRequest[] }>('/hr/leave-requests');
        if (hrRes.data?.success) {
          setHrLeaves(hrRes.data.data || []);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [canReview]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/hr/leave', {
        leaveType,
        startDate,
        endDate,
        reason,
      });
      alert('Leave request submitted to HR.');
      setShowApplyModal(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      await fetchLeaveData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/hr/leave-requests/${id}/approve`, {
        reviewComments: 'Approved by HR Manager.',
      });
      alert('Leave approved.');
      await fetchLeaveData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    const reasonPrompt = prompt('Rejection reason:') || 'Coverage conflict during requested timeframe.';
    try {
      await api.post(`/hr/leave-requests/${id}/reject`, {
        reviewComments: reasonPrompt,
      });
      alert('Leave rejected.');
      await fetchLeaveData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Leave & PTO Governance</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-medium">
              Time-Off Portal
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit paid time off, track statutory balances, and review departmental leave applications.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-900/30 flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Annual Paid Leave</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">18</span>
            <span className="text-xs text-slate-500">/ 25 days left</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: '72%' }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sick & Medical Leave</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">10</span>
            <span className="text-xs text-slate-500">/ 12 days left</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: '83%' }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Casual / Personal</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">3</span>
            <span className="text-xs text-slate-500">/ 5 days left</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-400 h-full rounded-full" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Special / Unpaid</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">0</span>
            <span className="text-xs text-slate-500">days recorded</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-400 h-full rounded-full" style={{ width: '10%' }} />
          </div>
        </div>
      </div>

      {/* Personal Leave History */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white">Your Leave Applications</h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading leave requests...</div>
        ) : myLeaves.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            You have no pending or past leave requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">HR Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {myLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white capitalize">{l.leaveType.toLowerCase()}</td>
                    <td className="py-3 px-4 font-mono">{l.startDate}</td>
                    <td className="py-3 px-4 font-mono">{l.endDate}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400">{l.reason || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        l.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        l.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 italic">{l.reviewComments || 'Pending HR review'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HR Leave Review Queue (Conditional) */}
      {canReview && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-bold text-white">HR Leave Approval Desk</h2>
                <p className="text-xs text-slate-400">Review employee leave applications across all departments</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-mono">
              HR Reviewer
            </span>
          </div>

          {hrLeaves.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No leave applications awaiting HR review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {hrLeaves.map((hrL) => (
                    <tr key={hrL.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-medium text-slate-300">{hrL.employeeId}</td>
                      <td className="py-3 px-4 font-semibold text-white capitalize">{hrL.leaveType.toLowerCase()}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{hrL.startDate} → {hrL.endDate}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-400">{hrL.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          hrL.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' :
                          hrL.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>
                          {hrL.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {hrL.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(hrL.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(hrL.id)}
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

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Book Paid Time Off / Leave</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="ANNUAL">Annual Paid Leave</option>
                  <option value="SICK">Sick / Medical Leave</option>
                  <option value="PERSONAL">Casual / Personal Time</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="MATERNITY">Maternity / Paternity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason & Coverage Handover</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional context for supervisor & teammate handover."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                >
                  {submitting ? 'Submitting...' : 'Confirm Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
