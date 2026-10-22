import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle2, AlertTriangle, LogIn, LogOut, Laptop, Building2 } from 'lucide-react';
import api from '../../services/api';

export const AttendanceBanner: React.FC = () => {
  const { user, attendanceStatus, refreshAttendance, hasPermission, clockOut } = useAuth();
  const [elapsed, setElapsed] = useState<string>('00:00:00');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const session = attendanceStatus?.session;
  const isClockedIn = !!(attendanceStatus?.hasActiveSession && session);

  // Live timer calculation
  useEffect(() => {
    if (!isClockedIn || !session?.clockInAt) return;

    const updateTimer = () => {
      const clockInTime = new Date(session.clockInAt).getTime();
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - clockInTime) / 1000));
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;
      setElapsed(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, session?.clockInAt]);

  const handleQuickClockIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const method = user?.profile?.workArrangement === 'REMOTE' || user?.profile?.workArrangement === 'HYBRID' 
        ? 'REMOTE' 
        : 'ON_SITE';
      await api.post('/attendance/clock-in', {
        method,
        notes: 'Quick clock-in from banner',
      });
      await refreshAttendance();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickClockOut = async () => {
    if (!confirm('Are you sure you want to clock out for today? You will be automatically signed out.')) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await clockOut({
        notes: 'Clock out from banner',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clock out');
      setLoading(false);
    }
  };

  if (!user) return null;

  const arrangement = user.profile?.workArrangement || 'ON_SITE';

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline hover:text-red-300">Dismiss</button>
        </div>
      )}

      {isClockedIn ? (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/40 border-b border-emerald-500/30 px-6 py-2.5 flex items-center justify-between text-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Active Session
            </span>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Shift Elapsed:</span>
              <span className="font-mono font-semibold text-emerald-300 tracking-wider text-base">{elapsed}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-700/60 pl-4">
              <span>Since {new Date(session.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-slate-600">•</span>
              <span className="capitalize">{session.clockInMethod.toLowerCase().replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400">
              {arrangement === 'HYBRID' ? <Laptop className="w-3.5 h-3.5 text-indigo-400" /> : <Building2 className="w-3.5 h-3.5 text-blue-400" />}
              {arrangement.replace('_', ' ')} Mode
            </span>
            {hasPermission('attendance.clock_out') && (
              <button
                onClick={handleQuickClockOut}
                disabled={loading}
                className="btn btn-sm bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-all text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                {loading ? 'Processing...' : 'Clock Out'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/40 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Not Clocked In
            </span>
            <p className="text-xs sm:text-sm text-slate-300">
              Shift attendance is required for full system logging & workspace access.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400">
              Mode: <strong className="text-slate-200">{arrangement.replace('_', ' ')}</strong>
            </span>
            {hasPermission('attendance.clock_in') && (
              <button
                onClick={handleQuickClockIn}
                disabled={loading}
                className="btn btn-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all text-xs font-semibold"
              >
                <LogIn className="w-3.5 h-3.5" />
                {loading ? 'Clocking In...' : 'Clock In Now'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
