import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, CheckCircle2, AlertTriangle, LogIn, LogOut, Calendar, 
  MapPin, Shield, History, PlusCircle, Laptop, Building2, HelpCircle 
} from 'lucide-react';
import api from '../services/api';
import { AttendanceSession } from '../types';
import { FlipClock } from '../components/common/FlipClock';

export const Attendance: React.FC = () => {
  const { user, attendanceStatus, refreshAttendance, hasPermission, clockOut } = useAuth();

  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [method, setMethod] = useState<'ON_SITE' | 'REMOTE'>(
    user?.profile?.workArrangement === 'REMOTE' || user?.profile?.workArrangement === 'HYBRID' 
      ? 'REMOTE' 
      : 'ON_SITE'
  );
  const [notes, setNotes] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Correction request state
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [correctionProposedTime, setCorrectionProposedTime] = useState<string>('');

  const session = attendanceStatus?.session;
  const isClockedIn = !!(attendanceStatus?.hasActiveSession && session);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get<{ success: boolean; data: AttendanceSession[] }>('/attendance/me');
      if (res.data?.success && res.data.data) {
        setHistory(res.data.data);
      }
    } catch {
      // Mock history if backend table is empty or error
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [attendanceStatus]);

  const handleClockIn = async () => {
    setLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.post('/attendance/clock-in', {
        method,
        notes: notes || undefined,
      });
      setActionSuccess('Successfully clocked in. Shift timer is now recording.');
      setNotes('');
      await refreshAttendance();
    } catch (err: any) {
      setActionError(err.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await clockOut({
        method,
        notes: notes || undefined,
      });
    } catch (err: any) {
      setActionError(err.message || 'Failed to clock out');
      setLoading(false);
    }
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;
    try {
      await api.post(`/attendance/${selectedSessionId}/correction-requests`, {
        reason: correctionReason,
        proposedClockOutAt: correctionProposedTime,
      });
      alert('Correction request submitted to HR for review.');
      setShowCorrectionModal(false);
      setCorrectionReason('');
      setCorrectionProposedTime('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit correction');
    }
  };

  const arrangement = user?.profile?.workArrangement || 'ON_SITE';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>Shift Attendance & Time Enforcement</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
            Policy v2.4
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Record your daily shift presence according to corporate HR policy. Remote clock-ins are validated against your hybrid privileges.
        </p>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock In / Out Action Panel */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Shift Console</span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {isClockedIn ? 'Active Shift in Progress' : 'Start Your Work Day'}
              </h2>
            </div>
            <FlipClock size="sm" showSeconds={true} showDate={false} allowExpand={true} />
          </div>

          {/* Method Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Verification Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('ON_SITE')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  method === 'ON_SITE'
                    ? 'bg-blue-600/15 border-blue-500 text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${method === 'ON_SITE' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">On-Site / Office</div>
                  <div className="text-[10px] text-slate-400">AM DEV HQ Geofence</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('REMOTE')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  method === 'REMOTE'
                    ? 'bg-blue-600/15 border-blue-500 text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${method === 'REMOTE' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Remote / Field</div>
                  <div className="text-[10px] text-slate-400">Hybrid Policy Approved</div>
                </div>
              </button>
            </div>
          </div>

          {/* Notes input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Shift Focus / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Core sprint development, client sync, code review"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            {!isClockedIn ? (
              <button
                onClick={handleClockIn}
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                <span>{loading ? 'Recording Clock-In...' : 'Record Shift Clock-In'}</span>
              </button>
            ) : (
              <button
                onClick={handleClockOut}
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                <span>{loading ? 'Recording Clock-Out...' : 'Complete Shift & Clock Out'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Policy & Work Schedule Summary */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Shift Schedule & Policy</h2>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Standard Schedule:</span>
              <span className="font-semibold text-slate-200">Mon - Fri (09:00 - 18:00)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Expected Duration:</span>
              <span className="font-semibold text-slate-200">8.0 hrs / day</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Grace Period:</span>
              <span className="font-semibold text-emerald-400">15 minutes</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Arrangement:</span>
              <span className="font-semibold text-blue-400 uppercase">{arrangement}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>Attendance Enforcement</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Access to department workspaces and engineering repos requires an active clocked-in session for security tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Attendance Log (Recent Sessions)</h2>
          </div>
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Request Attendance Correction
          </button>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading attendance records...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No attendance records found yet. Once you clock in and out, your sessions will be logged here.
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
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {history.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium">{sess.workDate}</td>
                    <td className="py-3 px-4">
                      {new Date(sess.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      {sess.clockOutAt 
                        ? new Date(sess.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {sess.clockInMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {sess.durationMinutes ? `${Math.floor(sess.durationMinutes / 60)}h ${sess.durationMinutes % 60}m` : 'In Progress'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sess.status === 'CLOCKED_IN' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        sess.status === 'CLOCKED_OUT' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                        'bg-amber-500/15 text-amber-400'
                      }`}>
                        {sess.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSessionId(sess.id);
                          setShowCorrectionModal(true);
                        }}
                        className="text-slate-400 hover:text-white underline text-[11px]"
                      >
                        Correct
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Submit Attendance Correction</h3>
            <p className="text-xs text-slate-400">
              HR will review and audit changes before modifying the historical attendance log.
            </p>
            <form onSubmit={submitCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for correction</label>
                <textarea
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Forgot to clock out before leaving HQ office, worked until 18:30"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Submit to HR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
