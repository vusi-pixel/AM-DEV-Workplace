import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { HrLiveRoster } from '../components/HrLiveRoster';
import { 
  UserCheck, Users, CalendarCheck, Laptop, FileText, CheckCircle2, 
  XCircle, Clock, ShieldCheck, Download, AlertCircle, ArrowUpRight 
} from 'lucide-react';
import api from '../../../services/api';
import { LeaveRequest, WorkModeRequest } from '../../../types';

export const HrPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'roster' | 'leave' | 'hybrid' | 'reports'>('roster');

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [hybridRequests, setHybridRequests] = useState<WorkModeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHrData = async () => {
    try {
      setLoading(true);
      const [leaveRes, wmRes] = await Promise.all([
        api.get<{ success: boolean; data: LeaveRequest[] }>('/hr/leave-requests').catch(() => null),
        api.get<{ success: boolean; data: WorkModeRequest[] }>('/work-mode-requests').catch(() => null),
      ]);
      if (leaveRes?.data?.data) setLeaveRequests(leaveRes.data.data);
      if (wmRes?.data?.data) setHybridRequests(wmRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrData();
  }, []);

  const handleApproveLeave = async (id: string) => {
    try {
      await api.post(`/hr/leave-requests/${id}/approve`, { reviewComments: 'Approved by People Ops' });
      alert('Leave application approved.');
      fetchHrData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRejectLeave = async (id: string) => {
    const reason = prompt('Rejection rationale:') || 'Department coverage conflict';
    try {
      await api.post(`/hr/leave-requests/${id}/reject`, { reviewComments: reason });
      alert('Leave application rejected.');
      fetchHrData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleApproveHybrid = async (id: string) => {
    try {
      await api.post(`/work-mode-requests/${id}/approve`, { reviewComments: 'Hybrid privilege approved.' });
      alert('Work arrangement updated.');
      fetchHrData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRejectHybrid = async (id: string) => {
    const reason = prompt('Rejection rationale:') || 'Role requires continuous on-site physical presence';
    try {
      await api.post(`/work-mode-requests/${id}/reject`, { reviewComments: reason });
      alert('Work arrangement request rejected.');
      fetchHrData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              HR Staff Management Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Human Resources & Workforce Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live workforce presence tracking, attendance compliance audit, and leave review desk.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'roster' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Live Presence Roster
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'leave' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Leave Queue ({leaveRequests.filter(l => l.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('hybrid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'hybrid' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Hybrid Desk ({hybridRequests.filter(h => h.status === 'PENDING').length})
          </button>
        </div>
      </div>

      {/* KPI Headcount Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Headcount</span>
          <div className="mt-2 text-2xl font-extrabold text-white">48 Staff</div>
          <div className="text-xs text-slate-400 mt-1">Across 4 operational units</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Present (Clocked In)</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">36 Present</div>
          <div className="text-xs text-slate-400 mt-1">75% active shift presence today</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remote / Field Mode</span>
          <div className="mt-2 text-2xl font-extrabold text-cyan-400">14 Remote</div>
          <div className="text-xs text-slate-400 mt-1">Approved hybrid schedule</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Review Desk</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-400">
            {leaveRequests.filter(l => l.status === 'PENDING').length + hybridRequests.filter(h => h.status === 'PENDING').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Leave & hybrid applications</div>
        </div>
      </div>

      {/* Tab 1: Live Roster */}
      {activeTab === 'roster' && <HrLiveRoster />}

      {/* Tab 2: Leave Review Desk */}
      {activeTab === 'leave' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                <span>Employee Paid Time Off & Leave Queue</span>
              </h2>
              <p className="text-xs text-slate-400">Review statutory PTO balances and approve employee submissions</p>
            </div>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No leave requests in queue.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {leaveRequests.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-medium">{l.employeeId}</td>
                      <td className="py-3 px-4 font-semibold text-white capitalize">{l.leaveType.toLowerCase()}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{l.startDate} → {l.endDate}</td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-400">{l.reason || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          l.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' :
                          l.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {l.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveLeave(l.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectLeave(l.id)}
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

      {/* Tab 3: Hybrid Desk */}
      {activeTab === 'hybrid' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span>Hybrid & Remote Privilege Authorizations</span>
              </h2>
              <p className="text-xs text-slate-400">Review employee applications for remote and flexible working arrangements</p>
            </div>
          </div>

          {hybridRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No work arrangement applications.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Requested Mode</th>
                    <th className="py-3 px-4">Justification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {hybridRequests.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white">
                        {h.employee?.profile?.firstName} {h.employee?.profile?.lastName}
                      </td>
                      <td className="py-3 px-4 font-semibold capitalize text-cyan-400">
                        {h.requestedArrangement.toLowerCase().replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-400">{h.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          h.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' :
                          h.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {h.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveHybrid(h.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectHybrid(h.id)}
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
    </div>
  );
};
