import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock, CheckCircle2, AlertTriangle, LogIn, LogOut,
  MapPin, Shield, History, PlusCircle, Laptop, Building2, Info, MoreHorizontal
} from 'lucide-react';
import api from '../services/api';
import { AttendanceSession } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtDuration(minutes: number | null | undefined, clockOutAt: string | null | undefined): string {
  if (!clockOutAt) return 'In progress';
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtMethod(raw: string): string {
  const map: Record<string, string> = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };
  return map[raw] ?? raw.replace(/_/g, ' ');
}

function fmtArrangement(raw: string): string {
  const map: Record<string, string> = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };
  return map[raw] ?? raw;
}

function fmtStatus(raw: string): string {
  const map: Record<string, string> = { CLOCKED_IN: 'Active', CLOCKED_OUT: 'Completed', PENDING: 'Pending' };
  return map[raw] ?? raw.replace(/_/g, ' ');
}

// ─── Small components ─────────────────────────────────────────────────────────

const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <div
        className="tabular font-semibold"
        style={{ fontSize: 32, lineHeight: '40px', color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}
      >
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
        {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
};

interface BadgeProps { variant: 'success' | 'active' | 'warning' | 'neutral'; label: string; }
const StatusBadge: React.FC<BadgeProps> = ({ variant, label }) => (
  <span className={`badge badge-${variant === 'active' ? 'active' : variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : 'neutral'}`}>
    {label}
  </span>
);

// ─── Skeleton rows ────────────────────────────────────────────────────────────
const SkeletonRows: React.FC = () => (
  <>
    {[1, 2, 3].map(i => (
      <tr key={i}>
        {[1, 2, 3, 4, 5, 6, 7].map(j => (
          <td key={j} className="px-4" style={{ height: 48 }}>
            <div className="skeleton h-4 rounded" style={{ width: j === 7 ? 48 : '80%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export const Attendance: React.FC = () => {
  const { user, attendanceStatus, refreshAttendance, hasPermission, clockOut } = useAuth();

  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [method, setMethod] = useState<'ON_SITE' | 'REMOTE'>(
    user?.profile?.workArrangement === 'REMOTE' || user?.profile?.workArrangement === 'HYBRID'
      ? 'REMOTE'
      : 'ON_SITE'
  );
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  const session = attendanceStatus?.session;
  const isClockedIn = !!(attendanceStatus?.hasActiveSession && session);
  const arrangement = user?.profile?.workArrangement || 'ON_SITE';

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get<{ success: boolean; data: AttendanceSession[] }>('/attendance/me');
      if (res.data?.success && res.data.data) setHistory(res.data.data);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [attendanceStatus]);

  const handleClockIn = async () => {
    setLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.post('/attendance/clock-in', { method, notes: notes || undefined });
      setActionSuccess('Clocked in. Your shift timer is now running.');
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
      await clockOut({ method, notes: notes || undefined });
    } catch (err: any) {
      setActionError(err.message || 'Failed to clock out');
      setLoading(false);
    }
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;
    try {
      await api.post(`/attendance/${selectedSessionId}/correction-requests`, { reason: correctionReason });
      alert('Correction request submitted to HR for review.');
      setShowCorrectionModal(false);
      setCorrectionReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit correction');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {actionError && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: Clock-in / out panel ── */}
        <div className="lg:col-span-2 card space-y-6">
          {/* Clock */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Shift console</p>
              <h2 className="text-base font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                {isClockedIn ? 'Active shift in progress' : 'Start your work day'}
              </h2>
            </div>
            <LiveClock />
          </div>

          {/* Verification mode */}
          <div>
            <label className="form-label">Verification mode</label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => setMethod('ON_SITE')}
                className={`seg-option${method === 'ON_SITE' ? ' selected' : ''}`}
                aria-pressed={method === 'ON_SITE'}
              >
                <Building2
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: method === 'ON_SITE' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                />
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>On-site</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>AM DEV HQ</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMethod('REMOTE')}
                className={`seg-option${method === 'REMOTE' ? ' selected' : ''}`}
                aria-pressed={method === 'REMOTE'}
              >
                <Laptop
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: method === 'REMOTE' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                />
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Remote</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Hybrid policy</div>
                </div>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="shift-notes" className="form-label">Shift focus</label>
            <input
              id="shift-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Sprint development, client sync…"
              className="form-input"
            />
            <p className="form-helper">Optional — helps track what you worked on</p>
          </div>

          {/* Action button */}
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Clocking in…</span></>
                : <><LogIn className="w-4 h-4" /><span>Clock in</span></>
              }
            </button>
          ) : (
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="btn btn-danger w-full"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Clocking out…</span></>
                : <><LogOut className="w-4 h-4" /><span>Complete shift & clock out</span></>
              }
            </button>
          )}
        </div>

        {/* ── Right: Policy card ── */}
        <div className="card space-y-0">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Schedule & policy
          </h2>

          <dl>
            <div className="dl-row">
              <span className="dl-label">Standard hours</span>
              <span className="dl-value tabular">Mon – Fri, 09:00–18:00</span>
            </div>
            <div className="dl-row">
              <span className="dl-label">Expected daily</span>
              <span className="dl-value tabular">8 h</span>
            </div>
            <div className="dl-row">
              <span className="dl-label">Grace period</span>
              <span className="dl-value" style={{ color: 'var(--color-success)' }}>15 min</span>
            </div>
            <div className="dl-row">
              <span className="dl-label">Arrangement</span>
              <span className="dl-value">{fmtArrangement(arrangement)}</span>
            </div>
          </dl>

          {/* Enforcement notice */}
          <div className="alert alert-info mt-4" style={{ padding: '10px 12px' }}>
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm leading-snug">
              Active sessions are required for workspace and repo access. Remote clock-ins are validated against your approved arrangement.
            </p>
          </div>
        </div>
      </div>

      {/* ── Attendance log ── */}
      <div className="card" style={{ padding: 0 }}>
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Attendance log
            </h2>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedSessionId(''); setShowCorrectionModal(true); }}
            className="btn btn-secondary btn-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Request correction
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table" aria-label="Attendance log">
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock in</th>
                <th>Clock out</th>
                <th>Method</th>
                <th className="right">Duration</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <SkeletonRows />
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', height: 80, color: 'var(--color-text-muted)' }}>
                    No attendance records yet. Sessions will appear here after your first clock-in.
                  </td>
                </tr>
              ) : history.map(sess => {
                const statusVariant =
                  sess.status === 'CLOCKED_IN' ? 'active' :
                  sess.status === 'CLOCKED_OUT' ? 'success' : 'warning';

                return (
                  <tr key={sess.id}>
                    <td className="tabular font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {fmtDate(sess.workDate)}
                    </td>
                    <td className="tabular">{fmtTime(sess.clockInAt)}</td>
                    <td className="tabular">
                      {sess.clockOutAt ? fmtTime(sess.clockOutAt) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{fmtMethod(sess.clockInMethod)}</span>
                    </td>
                    <td className="right tabular">
                      {fmtDuration(sess.durationMinutes, sess.clockOutAt)}
                    </td>
                    <td>
                      <StatusBadge variant={statusVariant} label={fmtStatus(sess.status)} />
                    </td>
                    <td className="right">
                      <button
                        type="button"
                        onClick={() => { setSelectedSessionId(sess.id); setShowCorrectionModal(true); }}
                        className="btn-icon"
                        aria-label={`Request correction for session on ${fmtDate(sess.workDate)}`}
                        title="Request correction"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Correction modal ── */}
      {showCorrectionModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(15,23,42,0.4)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="correction-title"
        >
          <div className="card w-full max-w-md" style={{ padding: 24 }}>
            <h3 id="correction-title" className="text-base font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Request attendance correction
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
              HR will review your request before modifying the attendance record.
            </p>
            <form onSubmit={submitCorrection} className="space-y-4">
              <div>
                <label htmlFor="correction-reason" className="form-label">Reason</label>
                <textarea
                  id="correction-reason"
                  required
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Forgot to clock out before leaving — worked until 18:30"
                  className="form-textarea w-full"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCorrectionModal(false); setCorrectionReason(''); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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