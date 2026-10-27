import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare, MessageSquare, Clock, BarChart2, ChevronRight,
  CheckCircle2, Circle, Users, Settings, Rocket,
  Calendar, Laptop, FileText, LogOut, Bell, Check, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { DashboardSummary, Task, Message, TimelineEvent } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday)     return `Today, ${timeStr}`;
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

function fmtArrangement(raw: string): string {
  const map: Record<string, string> = { ON_SITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };
  return map[raw] ?? raw;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const PriorityBadge: React.FC<{ priority: Task['priority'] }> = ({ priority }) => {
  const cls: Record<string, string> = {
    HIGH:   'badge badge-danger',
    URGENT: 'badge badge-danger',
    MEDIUM: 'badge badge-warning',
    LOW:    'badge badge-neutral',
  };
  return <span className={cls[priority] ?? 'badge badge-neutral'}>{priority.charAt(0) + priority.slice(1).toLowerCase()}</span>;
};

const DueDateBadge: React.FC<{ dueDate: string | null }> = ({ dueDate }) => {
  if (!dueDate) return null;
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  let label = dueDate;
  let color = 'var(--color-text-muted)';
  if (dueDate === today)    { label = 'Today';    color = 'var(--color-warning)'; }
  else if (dueDate === tomorrow) { label = 'Tomorrow'; }
  return <span className="text-xs tabular" style={{ color }}>Due {label}</span>;
};

const SenderAvatar: React.FC<{ name: string; dept: string }> = ({ name, dept }) => {
  const initials = name.replace(/\(.*?\)/g, '').trim().split(' ').map(p => p[0]).slice(0, 2).join('');
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
      style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent)' }}
    >
      {initials || 'U'}
    </div>
  );
};

type Tab = 'overview' | 'attendance' | 'tasks' | 'messages' | 'timeline';

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { user, attendanceStatus, clockOut } = useAuth();

  const [dashData, setDashData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [clockingOut, setClockingOut] = useState(false);
  const [elapsed, setElapsed]   = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const session     = attendanceStatus?.session;
  const isClockedIn = !!(attendanceStatus?.hasActiveSession && session);

  useEffect(() => {
    if (!isClockedIn || !session?.clockInAt) { setElapsed(''); return; }
    const tick = () => setElapsed(formatElapsed(session.clockInAt));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [isClockedIn, session]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: DashboardSummary }>('/dashboard/summary');
      if (res.data?.success) setDashData(res.data.data);
    } catch { /* graceful */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleClockOut = async () => {
    if (!session || clockingOut) return;
    setClockingOut(true);
    setActionError(null);
    try { await clockOut(); }
    catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Clock-out failed');
      setClockingOut(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: Task['status']) => {
    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      await api.patch(`/dashboard/tasks/${taskId}/status`, { status: nextStatus });
      setDashData(prev => prev ? {
        ...prev,
        myTasks: prev.myTasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t),
      } : prev);
    } catch { /* ignore */ }
  };

  const firstName = user?.profile?.firstName || 'there';
  const summary   = dashData?.summary;
  const myTasks   = dashData?.myTasks || [];
  const msgs      = dashData?.messages || [];
  const timeline  = dashData?.timeline || [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview',    label: 'Overview' },
    { key: 'attendance',  label: 'Attendance' },
    { key: 'tasks',       label: 'Tasks' },
    { key: 'messages',    label: 'Messages' },
    { key: 'timeline',    label: 'Timeline' },
  ];

  const statCards = [
    { label: "Today's tasks",     value: summary?.todaysTasks ?? 5,       to: '/tasks',    icon: <Calendar className="w-4 h-4" /> },
    { label: 'Unread messages',   value: summary?.unreadMessages ?? 3,    tab: 'messages' as Tab, icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Pending approvals', value: summary?.pendingApprovals ?? 2,  icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: 'Project updates',   value: summary?.projectUpdates ?? 2,    to: '/projects', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="alert alert-danger" role="alert">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-auto text-xs font-medium" aria-label="Dismiss">Dismiss</button>
        </div>
      )}

      {/* ── Welcome banner ── */}
      <div
        className="relative overflow-hidden rounded-xl text-white"
        style={{ minHeight: 180 }}
      >
        <img src="/office_banner.jpg" alt="Office at twilight" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(11,19,41,0.92) 0%, rgba(11,19,41,0.6) 60%, rgba(11,19,41,0.2) 100%)' }} />
        <div className="relative z-10 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Welcome back, {firstName}</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="mt-3">
              {isClockedIn ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                  <Check className="w-3.5 h-3.5" />
                  Clocked in{session?.clockInAt ? ` since ${formatClockInTime(session.clockInAt)}` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>
                  <Clock className="w-3.5 h-3.5" />
                  Not clocked in
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {isClockedIn ? (
              <button
                onClick={handleClockOut}
                disabled={clockingOut}
                className="btn btn-secondary"
                style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--color-text-primary)' }}
              >
                <LogOut className="w-4 h-4" />
                {clockingOut ? 'Clocking out…' : 'Clock out'}
              </button>
            ) : (
              <Link
                to="/attendance"
                className="btn"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Clock in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* ── LEFT (9 cols) ── */}
        <div className="xl:col-span-9 space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((c, i) => {
              const inner = (
                <div className="card-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: 'var(--color-text-muted)' }}>{c.icon}</span>
                  </div>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{c.label}</div>
                  <div className="text-2xl font-semibold tabular" style={{ color: 'var(--color-text-primary)' }}>
                    {loading ? '—' : c.value}
                  </div>
                </div>
              );
              if (c.to) return <Link key={i} to={c.to} className="block hover:shadow-sm transition-shadow rounded-xl">{inner}</Link>;
              if (c.tab) return <button key={i} type="button" className="block text-left w-full hover:shadow-sm transition-shadow rounded-xl" onClick={() => setActiveTab(c.tab!)}>{inner}</button>;
              return <div key={i}>{inner}</div>;
            })}
          </div>

          {/* Workplace overview with tabs */}
          <div className="card" style={{ padding: 0 }}>
            <div className="px-6 pt-5 pb-0">
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Your workplace overview</h2>
              <div className="flex gap-6 mt-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className="pb-3 text-sm font-medium border-b-2 -mb-px transition-colors duration-150"
                    style={{
                      borderColor: activeTab === t.key ? 'var(--color-accent)' : 'transparent',
                      color: activeTab === t.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x" style={{ '--tw-divide-color': 'var(--color-border)' } as React.CSSProperties}>
                  {/* Attendance */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Attendance</h3>
                    <div className="flex flex-col items-center text-center py-2">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                        style={{ background: isClockedIn ? 'var(--color-success-bg)' : '#F1F5F9', color: isClockedIn ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                      >
                        {isClockedIn ? <Check className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {isClockedIn ? 'Clocked in' : 'Not clocked in'}
                      </p>
                      {isClockedIn && elapsed && (
                        <p className="text-xs tabular mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Active for {elapsed}</p>
                      )}
                    </div>
                    <Link to="/attendance" className="btn btn-secondary btn-sm w-full justify-center">
                      View attendance →
                    </Link>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-3 pt-4 md:pt-0 md:px-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>My tasks</h3>
                      <button onClick={() => setActiveTab('tasks')} className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>View all →</button>
                    </div>
                    <div className="space-y-3">
                      {myTasks.slice(0, 3).map(task => {
                        const isDone = task.status === 'DONE';
                        return (
                          <div key={task.id} className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task.id, task.status)}
                              className="w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors"
                              style={{
                                borderColor: isDone ? 'var(--color-success)' : 'var(--color-border)',
                                background: isDone ? 'var(--color-success)' : 'transparent',
                                color: isDone ? '#fff' : 'transparent',
                              }}
                              aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {isDone && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-snug truncate"
                                style={{ color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: isDone ? 'line-through' : undefined }}>
                                {task.title}
                              </p>
                              <DueDateBadge dueDate={task.dueDate} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Updates */}
                  <div className="space-y-3 pt-4 md:pt-0 md:pl-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Latest updates</h3>
                      <button onClick={() => setActiveTab('timeline')} className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>View all →</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'New company policy on hybrid work', time: '2h ago' },
                        { label: 'Finance Q1 report approved',       time: '3h ago' },
                        { label: 'Team sync meeting moved to 3PM',   time: '4h ago' },
                      ].map((u, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: 'var(--color-accent)' }} />
                          <div>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{u.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{u.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ATTENDANCE TAB */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ background: isClockedIn ? 'var(--color-success-bg)' : '#F8FAFC', border: `1px solid ${isClockedIn ? 'var(--color-success-border)' : 'var(--color-border)'}` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: isClockedIn ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                          {isClockedIn ? 'Clocked in' : 'Not clocked in'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {isClockedIn && session ? `Since ${formatClockInTime(session.clockInAt)}${elapsed ? ` · Active for ${elapsed}` : ''}` : 'Your shift has not started'}
                        </p>
                      </div>
                      {isClockedIn ? (
                        <button onClick={handleClockOut} disabled={clockingOut} className="btn btn-danger btn-sm">
                          {clockingOut ? 'Clocking out…' : 'Clock out'}
                        </button>
                      ) : (
                        <Link to="/attendance" className="btn btn-primary btn-sm">Clock in</Link>
                      )}
                    </div>
                  </div>
                  <Link to="/attendance" className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                    Open full attendance records & timesheets →
                  </Link>
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <div className="space-y-2">
                  {myTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid var(--color-border)' }}>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id, task.status)}
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: task.status === 'DONE' ? 'var(--color-success)' : 'var(--color-border)',
                            background: task.status === 'DONE' ? 'var(--color-success)' : 'transparent',
                          }}
                          aria-label={task.status === 'DONE' ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {task.status === 'DONE' && <Check className="w-2.5 h-2.5 text-white" />}
                        </button>
                        <div>
                          <p className="text-sm font-medium" style={{ color: task.status === 'DONE' ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: task.status === 'DONE' ? 'line-through' : undefined }}>
                            {task.title}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{task.assignedByDept}</p>
                        </div>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  ))}
                </div>
              )}

              {/* MESSAGES TAB */}
              {activeTab === 'messages' && (
                <div className="space-y-2">
                  {msgs.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid var(--color-border)' }}>
                      <SenderAvatar name={msg.fromName} dept={msg.fromDept} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{msg.fromName}</span>
                          <span className="text-xs tabular" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  {timeline.map(ev => (
                    <div key={ev.id} className="flex items-start gap-3 py-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--color-accent)' }} />
                      <div>
                        <p className="text-xs tabular" style={{ color: 'var(--color-text-muted)' }}>{formatTime(ev.eventAt)}</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{ev.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: Timeline + Messages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Company timeline</h3>
                <button onClick={() => setActiveTab('timeline')} className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>View all →</button>
              </div>
              <div className="space-y-3">
                {timeline.slice(0, 3).map(ev => (
                  <div key={ev.id} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--color-accent)' }} />
                    <div>
                      <p className="text-xs tabular" style={{ color: 'var(--color-text-muted)' }}>{formatTime(ev.eventAt)}</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{ev.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Messages</h3>
                <button onClick={() => setActiveTab('messages')} className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>View all →</button>
              </div>
              <div className="space-y-3">
                {msgs.slice(0, 3).map(msg => (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <SenderAvatar name={msg.fromName} dept={msg.fromDept} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{msg.fromName}</span>
                        <span className="text-xs tabular" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{msg.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT (3 cols) ── */}
        <div className="xl:col-span-3 space-y-6">

          {/* Department switcher */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Switch department</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Access your department workspace</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/hr',       label: 'HR',               sub: 'People & culture', icon: <Users className="w-4 h-4" /> },
                { to: '/finance',  label: 'Finance',           sub: 'Payroll & audit',  icon: <BarChart2 className="w-4 h-4" /> },
                { to: '/admin',    label: 'Administration',    sub: 'Governance',       icon: <Settings className="w-4 h-4" /> },
                { to: '/projects', label: 'Projects',          sub: 'Delivery',         icon: <Rocket className="w-4 h-4" /> },
              ].map(d => (
                <Link
                  key={d.to}
                  to={d.to}
                  className="flex flex-col gap-1 p-3 rounded-lg border transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                  style={{ borderColor: 'var(--color-border)', background: '#F8FAFC' }}
                >
                  <span style={{ color: 'var(--color-accent)' }}>{d.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{d.label}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{d.sub}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Quick actions</h3>
            <div className="space-y-1">
              {[
                { to: '/work-mode', label: 'Request hybrid work',   icon: <Laptop className="w-4 h-4" /> },
                { to: '/expenses',  label: 'Submit expense claim',   icon: <FileText className="w-4 h-4" /> },
                { to: '/leave',     label: 'Request leave',          icon: <Calendar className="w-4 h-4" /> },
                { to: '/calendar',  label: 'View company calendar',  icon: <Clock className="w-4 h-4" /> },
              ].map(a => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-slate-50 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: 'var(--color-accent)' }}>{a.icon}</span>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{a.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--color-text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Profile card */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Your profile</h3>
            <dl>
              {[
                { label: 'Name',        value: user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Employee' },
                { label: 'Role',        value: user?.roles?.[0] || 'Employee' },
                { label: 'Department',  value: user?.profile?.department?.name || 'Engineering' },
                { label: 'Arrangement', value: fmtArrangement(user?.profile?.workArrangement || 'ON_SITE') },
              ].map(row => (
                <div key={row.label} className="dl-row">
                  <span className="dl-label">{row.label}</span>
                  <span className="dl-value">{row.value}</span>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;