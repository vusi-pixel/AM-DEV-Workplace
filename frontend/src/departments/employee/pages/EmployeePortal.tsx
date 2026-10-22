import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { EmployeeShiftCard } from '../components/EmployeeShiftCard';
import { 
  CalendarDays, Briefcase, FileText, Clock, PlusCircle, CheckCircle2, 
  AlertCircle, DollarSign, ChevronRight, UserCheck, Sparkles, Building2, Laptop 
} from 'lucide-react';
import api from '../../../services/api';
import { AttendanceSession, LeaveRequest, WorkModeRequest } from '../../../types';
import { Link } from 'react-router-dom';

export const EmployeePortal: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [hybridReqs, setHybridReqs] = useState<WorkModeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick modals state
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<string>('ANNUAL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [leaveSubmitting, setLeaveSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setLoading(true);
        const [attRes, leaveRes, wmRes] = await Promise.all([
          api.get<{ success: boolean; data: AttendanceSession[] }>('/attendance/me').catch(() => null),
          api.get<{ success: boolean; data: LeaveRequest[] }>('/hr/leave/me').catch(() => null),
          api.get<{ success: boolean; data: WorkModeRequest[] }>('/work-mode-requests/me').catch(() => null),
        ]);

        if (attRes?.data?.data) setHistory(attRes.data.data);
        if (leaveRes?.data?.data) setLeaves(leaveRes.data.data);
        if (wmRes?.data?.data) setHybridReqs(wmRes.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkerData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveSubmitting(true);
    try {
      await api.post('/hr/leave', {
        leaveType,
        startDate,
        endDate,
        reason: leaveReason,
      });
      alert('Leave application submitted to HR.');
      setShowLeaveModal(false);
      setLeaveReason('');
      setStartDate('');
      setEndDate('');
      // refresh
      const leaveRes = await api.get<{ success: boolean; data: LeaveRequest[] }>('/hr/leave/me');
      if (leaveRes?.data?.data) setLeaves(leaveRes.data.data);
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const p = user?.profile;
  const arrangement = p?.workArrangement || 'ON_SITE';

  return (
    <div className="space-y-6">
      {/* Header Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-xl flex items-center justify-center uppercase shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
            {p?.firstName?.[0] || 'W'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                Worker Portal • Self-Service
              </span>
              <span className="text-xs text-slate-400 font-mono">{p?.employeeId}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              {p?.firstName} {p?.lastName}
            </h1>
            <p className="text-xs text-slate-400">
              {p?.jobTitle || 'Team Member'} • <span className="text-blue-400">{p?.department?.name || 'Engineering'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <span>Book PTO / Leave</span>
          </button>
          <Link
            to="/work-mode"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
          >
            <Laptop className="w-4 h-4" />
            <span>Hybrid Status</span>
          </Link>
        </div>
      </div>

      {/* Main Punch Card Component */}
      <EmployeeShiftCard />

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paid Leave Balance</span>
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">18</span>
            <span className="text-xs text-slate-500">/ 25 days available</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: '72%' }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Work Arrangement</span>
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              {arrangement === 'HYBRID' ? <Laptop className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white capitalize">{arrangement.replace('_', ' ')}</div>
            <p className="text-xs text-slate-400 mt-0.5">Corporate compliance validated</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Logged Shifts</span>
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">{history.length}</div>
            <p className="text-xs text-slate-400 mt-0.5">Sessions recorded this month</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Requests</span>
            <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              {leaves.filter(l => l.status === 'PENDING').length + hybridReqs.filter(h => h.status === 'PENDING').length}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Awaiting supervisor review</p>
          </div>
        </div>
      </div>

      {/* Grid: My Attendance History & Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Log (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>My Attendance History</span>
              </h2>
              <p className="text-xs text-slate-400">Verified clock-in timestamps, methods, and duration</p>
            </div>
            <Link to="/attendance" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              View Detailed Log →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading your shift logs...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No shifts recorded yet. Use the punch card above to clock in.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Clock In</th>
                    <th className="py-3 px-4">Clock Out</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {history.slice(0, 5).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-medium">{s.workDate}</td>
                      <td className="py-3 px-4">
                        {new Date(s.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        {s.clockOutAt 
                          ? new Date(s.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : 'In Progress'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                          {s.clockInMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {s.durationMinutes ? `${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}m` : 'Active'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === 'CLOCKED_IN' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Requests & Links (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">My Active Applications</h2>

            <div className="space-y-3 text-xs">
              {leaves.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Leave: {leaves[0].leaveType}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      leaves[0].status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {leaves[0].status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-mono">{leaves[0].startDate} → {leaves[0].endDate}</p>
                </div>
              )}

              {hybridReqs.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Mode: {hybridReqs[0].requestedArrangement}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      hybridReqs[0].status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {hybridReqs[0].status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-1">{hybridReqs[0].reason}</p>
                </div>
              )}

              <Link
                to="/workspaces?tab=engineering"
                className="w-full p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 flex items-center justify-between text-blue-300 font-semibold group transition-all"
              >
                <span>Browse Team Workspace</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Apply for Paid Time Off</h3>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="ANNUAL">Annual Paid Leave (18 days available)</option>
                  <option value="SICK">Sick & Medical Leave</option>
                  <option value="PERSONAL">Casual / Personal Time</option>
                  <option value="UNPAID">Unpaid Leave</option>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Handover Notes</label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Coverage handover and emergency contact info..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  {leaveSubmitting ? 'Submitting...' : 'Submit to HR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
