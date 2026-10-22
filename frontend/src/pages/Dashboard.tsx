import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare, MessageSquare, Clock, BarChart2, ChevronRight,
  CheckCircle2, Circle, AlertCircle, Users, Settings, Rocket,
  Calendar, Laptop, FileText, LogOut, ArrowRight,
  Bell, Check, ChevronDown, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { DashboardSummary, Task, Message, TimelineEvent } from '../types';
import { FlipClock } from '../components/common/FlipClock';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatElapsed(clockInAt: string): string {
  const elapsed = Math.floor((Date.now() - new Date(clockInAt).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatClockInTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PriorityBadge: React.FC<{ priority: Task['priority'] }> = ({ priority }) => {
  const map = {
    HIGH: 'bg-red-50 text-red-600 border-red-200',
    URGENT: 'bg-rose-50 text-rose-600 border-rose-200',
    MEDIUM: 'bg-amber-50 text-amber-600 border-amber-200',
    LOW: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${map[priority]}`}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
};

const DueDateBadge: React.FC<{ dueDate: string | null }> = ({ dueDate }) => {
  if (!dueDate) return null;
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  let label = dueDate;
  let cls = 'text-slate-500';
  if (dueDate === today) { label = 'Today'; cls = 'text-amber-600 font-semibold'; }
  else if (dueDate === tomorrow) { label = 'Tomorrow'; cls = 'text-slate-500 font-medium'; }
  return <span className={`text-[11px] ${cls}`}>Due {label}</span>;
};

const TimelineDot: React.FC<{ color: string }> = ({ color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500 ring-blue-100',
    green: 'bg-emerald-500 ring-emerald-100',
    purple: 'bg-purple-500 ring-purple-100',
    amber: 'bg-amber-500 ring-amber-100',
    emerald: 'bg-emerald-500 ring-emerald-100',
    red: 'bg-red-500 ring-red-100',
  };
  return (
    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ring-4 ${colorMap[color] || 'bg-slate-400 ring-slate-100'}`} />
  );
};

const SenderAvatar: React.FC<{ name: string; dept: string }> = ({ name, dept }) => {
  const colorMap: Record<string, string> = {
    HR: 'bg-emerald-100 text-emerald-700',
    Finance: 'bg-cyan-100 text-cyan-700',
    Projects: 'bg-blue-100 text-blue-700',
    Administration: 'bg-purple-100 text-purple-700',
    General: 'bg-slate-100 text-slate-700',
  };
  const cls = colorMap[dept] || colorMap.General;
  const initials = name.replace(/\(.*?\)/g, '').trim().split(' ').map(p => p[0]).slice(0, 2).join('');
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cls}`}>
      {initials || 'U'}
    </div>
  );
};

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'attendance' | 'tasks' | 'messages' | 'timeline';

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { user, attendanceStatus, refreshAttendance, clockOut } = useAuth();
  const navigate = useNavigate();

  const [dashData, setDashData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [clockingOut, setClockingOut] = useState(false);
  const [elapsed, setElapsed] = useState('8h 24m');
  const [actionError, setActionError] = useState<string | null>(null);

  const session = attendanceStatus?.session;
  const isClockedIn = !!(attendanceStatus?.hasActiveSession && session);

  // Live elapsed timer
  useEffect(() => {
    if (!isClockedIn || !session?.clockInAt) {
      setElapsed('8h 24m');
      return;
    }
    const tick = () => setElapsed(formatElapsed(session.clockInAt));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [isClockedIn, session]);

  // Fetch dashboard summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: DashboardSummary }>('/dashboard/summary');
      if (res.data?.success) setDashData(res.data.data);
    } catch {
      // Network error handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleClockOut = async () => {
    if (!session || clockingOut) return;
    setClockingOut(true);
    setActionError(null);
    try {
      await clockOut();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Clock-out failed');
      setClockingOut(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: Task['status']) => {
    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      await api.patch(`/dashboard/tasks/${taskId}/status`, { status: nextStatus });
      setDashData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          myTasks: prev.myTasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)),
        };
      });
    } catch {
      // Ignore
    }
  };

  // Profile data
  const firstName = user?.profile?.firstName || 'Esther';
  const summary = dashData?.summary;
  const myTasks = dashData?.myTasks || [];
  const msgs = dashData?.messages || [];
  const timeline = dashData?.timeline || [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'messages', label: 'Messages' },
    { key: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-6 min-h-0">
      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 font-bold ml-2">×</button>
        </div>
      )}

      {/* ── Main Two-Column Layout (Matching Screenshot Grid) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* ── LEFT COLUMN (9 cols on desktop ~75%) ── */}
        <div className="xl:col-span-9 space-y-6">

          {/* 1. Welcome Banner with Glass Building at Twilight */}
          <div className="relative overflow-hidden rounded-2xl min-h-[200px] flex items-stretch text-white shadow-sm border border-slate-800/40">
            {/* Background image */}
            <img
              src="/office_banner.jpg"
              alt="Office at twilight"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b1329]/95 via-[#0e1a38]/75 to-[#0b1329]/40" />

            <div className="relative z-10 w-full p-6 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              {/* Left side: Welcome text & clocked in status badge */}
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome back, {firstName}!
                </h1>
                <p className="text-slate-300 text-sm font-medium">
                  Together, we build what's next.
                </p>
                <div className="pt-2">
                  {isClockedIn ? (
                    <div className="inline-flex items-center gap-2 bg-[#dcfce7] text-[#065f46] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                      <span className="w-4 h-4 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                      <span>You are clocked in</span>
                      <span className="text-[#14532d] font-normal ml-1">
                        Since: {session?.clockInAt ? formatClockInTime(session.clockInAt) : '8:12 AM'}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700 text-slate-300 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Not clocked in</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: Retro Split-Flap Flip Clock + Clock Out button */}
              <div className="sm:text-right flex flex-col sm:items-end">
                <FlipClock size="md" showSeconds={true} showDate={true} allowExpand={true} />
                <div className="w-full mt-3">
                  {isClockedIn ? (
                    <button
                      onClick={handleClockOut}
                      disabled={clockingOut}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {clockingOut ? 'Clocking out...' : 'Clock Out'}
                    </button>
                  ) : (
                    <Link
                      to="/attendance"
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Clock In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Four Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Tasks */}
            <Link
              to="/tasks"
              className="bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 transition-all group block"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-semibold">Today's Tasks</div>
              <div className="text-3xl font-extrabold text-slate-800 my-1">
                {loading ? '—' : summary?.todaysTasks ?? 5}
              </div>
              <div className="text-xs text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
                View Tasks →
              </div>
            </Link>

            {/* Card 2: Unread Messages */}
            <button
              onClick={() => setActiveTab('messages')}
              className="bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 transition-all group text-left block w-full"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-semibold">Unread Messages</div>
              <div className="text-3xl font-extrabold text-slate-800 my-1">
                {loading ? '—' : summary?.unreadMessages ?? 3}
              </div>
              <div className="text-xs text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
                View Messages →
              </div>
            </button>

            {/* Card 3: Pending Approvals */}
            <div className="bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-md rounded-2xl p-5 transition-all group block">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-semibold">Pending Approvals</div>
              <div className="text-3xl font-extrabold text-slate-800 my-1">
                {loading ? '—' : summary?.pendingApprovals ?? 2}
              </div>
              <div className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                View Details →
              </div>
            </div>

            {/* Card 4: Project Updates */}
            <Link
              to="/projects"
              className="bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 transition-all group block"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-semibold">Project Updates</div>
              <div className="text-3xl font-extrabold text-slate-800 my-1">
                {loading ? '—' : summary?.projectUpdates ?? 2}
              </div>
              <div className="text-xs text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
                View Projects →
              </div>
            </Link>
          </div>

          {/* 3. Your Workplace Overview Card with Navigation Tabs */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-0">
              <h2 className="text-base font-bold text-slate-800">Your Workplace Overview</h2>
              <div className="flex gap-6 mt-3 border-b border-slate-200">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                      activeTab === t.key
                        ? 'text-blue-600 border-blue-600'
                        : 'text-slate-500 border-transparent hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* ─── TAB: OVERVIEW ─── */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  {/* Column 1: Attendance Status */}
                  <div className="space-y-4 pr-0 md:pr-4">
                    <h3 className="text-xs font-bold text-slate-700">Attendance Status</h3>
                    <div className="flex flex-col items-center text-center py-2">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                        <Check className="w-7 h-7 stroke-[2.5]" />
                      </div>
                      <div className="text-lg font-extrabold text-slate-900">
                        {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Since {session?.clockInAt ? formatClockInTime(session.clockInAt) : '8:12 AM'}
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Today's Session</span>
                        <span className="font-bold text-slate-800 font-mono">{elapsed}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: '70%' }} />
                      </div>
                    </div>
                    <Link
                      to="/attendance"
                      className="block text-center text-xs text-slate-700 hover:text-blue-600 font-semibold py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all mt-2"
                    >
                      View Attendance →
                    </Link>
                  </div>

                  {/* Column 2: My Tasks */}
                  <div className="space-y-3 pt-4 md:pt-0 md:px-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700">My Tasks</h3>
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        View All →
                      </button>
                    </div>

                    <div className="space-y-3 pt-1">
                      {myTasks.slice(0, 3).map((task) => {
                        const isDone = task.status === 'DONE';
                        return (
                          <div key={task.id} className="flex items-start gap-2.5 group">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task.id, task.status)}
                              className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-colors flex items-center justify-center ${
                                isDone
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : 'border-slate-300 hover:border-blue-500'
                              }`}
                              title={isDone ? 'Mark Todo' : 'Mark Complete'}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold text-slate-800 leading-snug truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <DueDateBadge dueDate={task.dueDate} />
                                <span className="text-slate-300">•</span>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 3: Latest Updates */}
                  <div className="space-y-3 pt-4 md:pt-0 md:pl-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700">Latest Updates</h3>
                      <button
                        onClick={() => setActiveTab('timeline')}
                        className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        View All →
                      </button>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Update 1 */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 leading-snug">
                            New company policy on hybrid work
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">2h ago</p>
                        </div>
                      </div>

                      {/* Update 2 */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 leading-snug">
                            Finance Q1 report approved
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">3h ago</p>
                        </div>
                      </div>

                      {/* Update 3 */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 leading-snug">
                            Team sync meeting moved to 3PM
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">4h ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB: ATTENDANCE ─── */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-emerald-800">
                        {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
                      </div>
                      <div className="text-xs text-emerald-600 mt-0.5">
                        {isClockedIn ? `Since ${formatClockInTime(session!.clockInAt)} • Active for ${elapsed}` : 'Shift not started'}
                      </div>
                    </div>
                    {isClockedIn ? (
                      <button
                        onClick={handleClockOut}
                        disabled={clockingOut}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
                      >
                        {clockingOut ? 'Clocking Out…' : 'Clock Out Now'}
                      </button>
                    ) : (
                      <Link to="/attendance" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">
                        Clock In Now
                      </Link>
                    )}
                  </div>
                  <Link to="/attendance" className="inline-block text-xs text-blue-600 font-semibold hover:underline">
                    Open Full Attendance Records &amp; Timesheets →
                  </Link>
                </div>
              )}

              {/* ─── TAB: TASKS ─── */}
              {activeTab === 'tasks' && (
                <div className="space-y-2.5">
                  {myTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id, task.status)}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            task.status === 'DONE' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                          }`}
                        >
                          {task.status === 'DONE' && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <div>
                          <p className={`text-xs font-bold text-slate-800 ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {task.assignedByDept} • <DueDateBadge dueDate={task.dueDate} />
                          </p>
                        </div>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  ))}
                </div>
              )}

              {/* ─── TAB: MESSAGES ─── */}
              {activeTab === 'messages' && (
                <div className="space-y-2.5">
                  {msgs.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <SenderAvatar name={msg.fromName} dept={msg.fromDept} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{msg.fromName}</span>
                          <span className="text-[10px] text-slate-400">{timeAgo(msg.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── TAB: TIMELINE ─── */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  {timeline.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <TimelineDot color={ev.color} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 font-mono">{formatTime(ev.eventAt)}</p>
                        <p className="text-xs font-bold text-slate-800">{ev.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Company Timeline & Messages Row (Side-by-Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Company Timeline */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-800">Company Timeline</h3>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-3.5 relative">
                {timeline.slice(0, 3).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3">
                    <TimelineDot color={ev.color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">{formatTime(ev.eventAt)}</p>
                      <p className="text-xs font-bold text-slate-800 leading-snug">{ev.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Messages */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-800">Messages</h3>
                <button
                  onClick={() => setActiveTab('messages')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-3">
                {msgs.slice(0, 3).map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <SenderAvatar name={msg.fromName} dept={msg.fromDept} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{msg.fromName}</span>
                        <span className="text-[10px] text-slate-400">{timeAgo(msg.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{msg.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (3 cols on desktop ~25%) ── */}
        <div className="xl:col-span-3 space-y-6">

          {/* 1. Switch to Department Card */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-5 shadow-lg text-white">
            <h3 className="text-sm font-bold text-white mb-0.5">Switch to Department</h3>
            <p className="text-xs text-slate-400 mb-4">Access your department workspace</p>

            <div className="grid grid-cols-2 gap-3">
              {/* HR */}
              <Link
                to="/hr"
                className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transition-all hover:scale-[1.02] shadow-md group"
              >
                <Users className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold leading-tight">HR</div>
                <div className="text-[10px] text-blue-200 mt-0.5">People &amp; Culture</div>
              </Link>

              {/* Finance */}
              <Link
                to="/finance"
                className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white transition-all hover:scale-[1.02] shadow-md group"
              >
                <BarChart2 className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold leading-tight">Finance</div>
                <div className="text-[10px] text-emerald-200 mt-0.5">Finance Operations</div>
              </Link>

              {/* Administration */}
              <Link
                to="/admin"
                className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-gradient-to-b from-violet-700 to-purple-800 hover:from-violet-600 hover:to-purple-700 text-white transition-all hover:scale-[1.02] shadow-md group"
              >
                <Settings className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold leading-tight">Administration</div>
                <div className="text-[10px] text-purple-200 mt-0.5">Admin Control</div>
              </Link>

              {/* Projects & Operations */}
              <Link
                to="/projects"
                className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white transition-all hover:scale-[1.02] shadow-md group"
              >
                <Rocket className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold leading-tight">Projects &amp; Operations</div>
                <div className="text-[10px] text-orange-200 mt-0.5">Projects &amp; Delivery</div>
              </Link>
            </div>
          </div>

          {/* 2. Quick Actions Card */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-5 shadow-lg text-white">
            <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/work-mode"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-medium">Request Hybrid Work</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/expenses"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-medium">Submit Expense Claim</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/leave"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-medium">Request Leave</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/calendar"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-medium">View Company Calendar</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 3. User Workplace Profile Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 mb-3">Your Profile &amp; Role</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Employee</span>
                <span className="font-bold text-slate-800">
                  {user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Esther N.'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-700">{user?.roles?.[0] || 'Employee'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-700">{user?.profile?.department?.name || 'Engineering'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Work Arrangement</span>
                <span className="font-semibold px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700">
                  {user?.profile?.workArrangement || 'ON_SITE'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Live Clock Component ─────────────────────────────────────────────────────
const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="text-center sm:text-right">
      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">{time}</div>
      <div className="text-xs text-slate-300 font-medium mt-0.5">{date}</div>
    </div>
  );
};

export default Dashboard;
