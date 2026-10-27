import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, LogIn, LogOut, Laptop, Building2 } from 'lucide-react';
import api from '../../services/api';

export const AttendanceBanner: React.FC = () => {
  const { user, attendanceStatus, refreshAttendance, hasPermission, clockOut } = useAuth();
  const [elapsed, setElapsed] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const session     = attendanceStatus?.session;
  const isClockedIn = !!(attendanceStatus?.hasActiveSession && session);
  const arrangement = user?.profile?.workArrangement || 'ON_SITE';

  useEffect(() => {
    if (!isClockedIn || !session?.clockInAt) { setElapsed(''); return; }
    const update = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - new Date(session.clockInAt).getTime()) / 1000));
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isClockedIn, session?.clockInAt]);

  const handleQuickClockIn = async () => {
    setLoading(true); setErrorMsg(null);
    try {
      const method = arrangement === 'REMOTE' || arrangement === 'HYBRID' ? 'REMOTE' : 'ON_SITE';
      await api.post('/attendance/clock-in', { method, notes: 'Quick clock-in from banner' });
      await refreshAttendance();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clock in');
    } finally { setLoading(false); }
  };

  const handleQuickClockOut = async () => {
    if (!confirm('Clock out for today? You will be signed out automatically.')) return;
    setLoading(true); setErrorMsg(null);
    try {
      await clockOut({ notes: 'Clock out from banner' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clock out');
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full" style={{ fontSize: 13 }}>
      {errorMsg && (
        <div className="flex items-center justify-between px-6 py-2 text-xs"
          style={{ background: 'var(--color-danger-bg)', borderBottom: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-medium underline ml-4">Dismiss</button>
        </div>
      )}

      {isClockedIn ? (
        <div className="flex items-center justify-between px-6 py-2"
          style={{ background: 'var(--color-success-bg)', borderBottom: '1px solid var(--color-success-border)' }}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-success)' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--color-success)' }} />
              Active session
            </span>
            {elapsed && (
              <span className="flex items-center gap-1.5 tabular" style={{ color: 'var(--color-text-secondary)' }}>
                <Clock className="w-3.5 h-3.5" />
                {elapsed}
              </span>
            )}
            {session && (
              <span className="hidden md:inline tabular" style={{ color: 'var(--color-text-muted)' }}>
                Since {new Date(session.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {session.clockInMethod === 'ON_SITE' ? 'On-site' : 'Remote'}
              </span>
            )}
          </div>
          {hasPermission('attendance.clock_out') && (
            <button onClick={handleQuickClockOut} disabled={loading} className="btn btn-sm btn-secondary">
              <LogOut className="w-3.5 h-3.5" />
              {loading ? 'Processing…' : 'Clock out'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between px-6 py-2"
          style={{ background: 'var(--color-warning-bg)', borderBottom: '1px solid var(--color-warning-border)' }}>
          <div className="flex items-center gap-3">
            <span className="font-medium" style={{ color: 'var(--color-warning)' }}>Not clocked in</span>
            <span className="hidden sm:inline" style={{ color: 'var(--color-text-secondary)' }}>
              Shift attendance is required for workspace access.
            </span>
          </div>
          {hasPermission('attendance.clock_in') && (
            <button onClick={handleQuickClockIn} disabled={loading} className="btn btn-sm btn-primary">
              <LogIn className="w-3.5 h-3.5" />
              {loading ? 'Clocking in…' : 'Clock in now'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};