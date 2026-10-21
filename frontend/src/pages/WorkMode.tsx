import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, Laptop, Building2, Globe, Clock, CheckCircle2, 
  XCircle, AlertCircle, Send, ShieldCheck, ChevronRight, UserCheck 
} from 'lucide-react';
import api from '../services/api';
import { WorkModeRequest } from '../types';

export const WorkMode: React.FC = () => {
  const { user, hasPermission, refreshUser } = useAuth();

  const [myRequests, setMyRequests] = useState<WorkModeRequest[]>([]);
  const [allRequests, setAllRequests] = useState<WorkModeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states
  const [requestedArrangement, setRequestedArrangement] = useState<'HYBRID' | 'REMOTE' | 'ON_SITE'>('HYBRID');
  const [reason, setReason] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [effectiveTo, setEffectiveTo] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supervisory review modal
  const canReview = hasPermission('hybrid.review');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState<string>('');
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const myRes = await api.get<{ success: boolean; data: WorkModeRequest[] }>('/work-mode-requests/me');
      if (myRes.data?.success) {
        setMyRequests(myRes.data.data || []);
      }

      if (canReview) {
        const allRes = await api.get<{ success: boolean; data: WorkModeRequest[] }>('/work-mode-requests');
        if (allRes.data?.success) {
          setAllRequests(allRes.data.data || []);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [canReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      await api.post('/work-mode-requests', {
        requestedArrangement,
        reason,
        effectiveFrom: effectiveFrom || undefined,
        effectiveTo: effectiveTo || undefined,
      });
      setFormMsg({ type: 'success', text: 'Work mode request submitted for supervisory & HR review.' });
      setReason('');
      setEffectiveFrom('');
      setEffectiveTo('');
      await fetchData();
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to submit request' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setReviewLoading(true);
    try {
      await api.post(`/work-mode-requests/${id}/approve`, {
        reviewComments: reviewComments || 'Approved in accordance with hybrid work policy.',
      });
      alert('Request approved. Employee arrangement has been updated.');
      setReviewId(null);
      setReviewComments('');
      await fetchData();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    const reasonPrompt = prompt('Please enter rejection rationale:') || 'Operational coverage required on-site.';
    try {
      await api.post(`/work-mode-requests/${id}/reject`, {
        reviewComments: reasonPrompt,
      });
      alert('Request marked rejected.');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const currentArrangement = user?.profile?.workArrangement || 'ON_SITE';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>Hybrid & Work Mode Governance</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-medium">
            Arrangement Portal
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review, request, and govern employee work arrangements (On-Site, Hybrid 2-3, or Full Remote).
        </p>
      </div>

      {/* Current Status Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            {currentArrangement === 'HYBRID' ? <Laptop className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Current Arrangement</span>
            <h2 className="text-xl font-bold text-white capitalize mt-0.5">
              {currentArrangement.replace('_', ' ')} Status
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {currentArrangement === 'HYBRID' 
                ? 'Authorized for 2 days remote and 3 days on-site per week.' 
                : currentArrangement === 'REMOTE' 
                ? 'Full remote privileges active. Geofence verification relaxed.'
                : 'Primary workstation assigned to AM DEV HQ office.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Approved & Compliant
          </span>
        </div>
      </div>

      {/* Grid: Request Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span>Apply for Arrangement Change</span>
          </h2>

          {formMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              formMsg.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'
            }`}>
              {formMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Desired Work Arrangement</label>
              <select
                value={requestedArrangement}
                onChange={(e) => setRequestedArrangement(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="HYBRID">Hybrid (Flexible Office + Remote)</option>
                <option value="REMOTE">Full Remote</option>
                <option value="ON_SITE">Full On-Site (HQ Dedicated)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Effective From</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Effective Until (Opt)</label>
                <input
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Justification & Schedule</label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your requested weekly schedule (e.g., remote on Tuesdays and Thursdays) and how high team velocity will be sustained."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Submit Request to Manager'}
            </button>
          </form>
        </div>

        {/* Personal Request Log */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Your Request History</h2>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading your history...</div>
          ) : myRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              You have not submitted any work mode requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Requested Mode</th>
                    <th className="py-3 px-4">Justification</th>
                    <th className="py-3 px-4">Date Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Supervisor Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {myRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white capitalize">
                        {req.requestedArrangement.toLowerCase().replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                        {req.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          req.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          req.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic">
                        {req.reviewComments || 'Pending review'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Supervisory / HR Approval Queue (Conditional) */}
      {canReview && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Supervisory Review Queue</h2>
                <p className="text-xs text-slate-400">Manage employee hybrid and remote work authorization requests</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono">
              Manager Access
            </span>
          </div>

          {allRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No employee requests in the queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Requested</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {allRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {r.employee?.profile?.firstName} {r.employee?.profile?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">{r.employee?.email}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold capitalize text-cyan-400">
                        {r.requestedArrangement.toLowerCase().replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-400">{r.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' :
                          r.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
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
