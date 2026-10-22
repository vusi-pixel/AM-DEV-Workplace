import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Clock, LogIn, LogOut, Building2, Laptop, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import api from '../../../services/api';
import { FlipClock } from '../../../components/common/FlipClock';

export const EmployeeShiftCard: React.FC = () => {
  const { user, attendanceStatus, refreshAttendance, clockOut } = useAuth();
  const [elapsed, setElapsed] = useState<string>('00:00:00');
  const [loading, setLoading] = useState<boolean>(false);
  const [method, setMethod] = useState<'ON_SITE' | 'REMOTE'>(
    user?.profile?.workArrangement === 'REMOTE' || user?.profile?.workArrangement === 'HYBRID' 
      ? 'REMOTE' 
      : 'ON_SITE'
  );
  const [notes, setNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  const handlePunchIn = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await api.post('/attendance/clock-in', { method, notes: notes || undefined });
      setFeedback({ type: 'success', msg: 'Shift clock-in recorded. Timer active.' });
      setNotes('');
      await refreshAttendance();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Clock-in failed' });
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!confirm('Confirm shift clock-out? You will be automatically signed out.')) return;
    setLoading(true);
    setFeedback(null);
    try {
      await clockOut({ method, notes: notes || undefined });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Clock-out failed' });
      setLoading(false);
    }
  };

  const arrangement = user?.profile?.workArrangement || 'ON_SITE';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {feedback && (
        <div className={`mb-4 p-3 rounded-xl text-xs flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'
        }`}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="underline hover:opacity-80">Close</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Status & Live Clock */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isClockedIn 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {isClockedIn ? 'Active Shift in Progress' : 'Not Clocked In'}
            </span>

            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              {arrangement.replace('_', ' ')} Policy
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <FlipClock size="sm" showSeconds={true} showDate={false} allowExpand={true} />
            <div>
              <div className="text-2xl lg:text-3xl font-mono font-extrabold text-white tracking-wider">
                {isClockedIn ? elapsed : '00:00:00'}
              </div>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {isClockedIn ? 'Hours Elapsed' : 'Shift Duration'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {isClockedIn 
              ? `Punched in at ${new Date(session?.clockInAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via ${session?.clockInMethod.replace('_', ' ')}` 
              : 'Punch in to start shift tracking, access team repos, and record hours for payroll.'}
          </p>
        </div>

        {/* Right: Punch Actions & Method */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {!isClockedIn && (
            <div className="flex items-center gap-2 p-1 bg-slate-800/80 border border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setMethod('ON_SITE')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  method === 'ON_SITE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                On-Site
              </button>
              <button
                type="button"
                onClick={() => setMethod('REMOTE')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  method === 'REMOTE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                Remote / Field
              </button>
            </div>
          )}

          {!isClockedIn ? (
            <button
              onClick={handlePunchIn}
              disabled={loading}
              className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Punching In...' : 'Punch In (Clock In)'}</span>
            </button>
          ) : (
            <button
              onClick={handlePunchOut}
              disabled={loading}
              className="py-3 px-6 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{loading ? 'Clocking Out...' : 'Complete Shift (Clock Out)'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
