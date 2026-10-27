import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, CheckCheck, LogOut, User as UserIcon, Settings, Menu, Clock } from 'lucide-react';
import api from '../../services/api';
import { Notification } from '../../types';

interface HeaderProps {
  onMenu?: () => void;
}

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/':           { title: 'Home', description: 'Your workplace at a glance' },
  '/attendance': { title: 'Attendance', description: 'Record your daily shift presence' },
  '/employee':   { title: 'My dashboard', description: 'Your personal employee portal' },
  '/tasks':      { title: 'Tasks & projects', description: 'Track your assignments and deliverables' },
  '/leave':      { title: 'Leave management', description: 'Request and track leave applications' },
  '/directory':  { title: 'Directory', description: 'Find your colleagues' },
  '/work-mode':  { title: 'Preferences', description: 'Manage your work arrangement settings' },
  '/profile':    { title: 'Profile', description: 'Your employee record' },
  '/hr':         { title: 'HR portal', description: 'People & culture operations' },
  '/finance':    { title: 'Finance portal', description: 'Payroll and expense management' },
  '/admin':      { title: 'Administration', description: 'System governance and audit' },
};

export const Header: React.FC<HeaderProps> = ({ onMenu }) => {
  const { user, logout, attendanceStatus } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ type: string; id: string; title: string; href: string }>>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [elapsed, setElapsed] = useState('');

  const notifRef  = useRef<HTMLDivElement>(null);
  const userRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const session    = attendanceStatus?.session;
  const isClockedIn = !!(attendanceStatus?.hasActiveSession && session);

  const meta = PAGE_META[location.pathname] ?? { title: 'Workplace', description: '' };

  const displayName = user?.profile?.displayName ||
    `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() ||
    user?.email || '';
  const initials = displayName.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  // Elapsed timer
  useEffect(() => {
    if (!isClockedIn || !session?.clockInAt) { setElapsed(''); return; }
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(session.clockInAt).getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      setElapsed(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [isClockedIn, session?.clockInAt]);

  // Notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get<{ success: boolean; data: { notifications: Notification[]; unreadCount: number } }>('/notifications');
      if (res.data?.success && res.data.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setShowNotifMenu(false);
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const handle = setTimeout(async () => {
      try {
        const res = await api.get<{ success: boolean; data: { results: typeof results } }>('/dashboard/search', { params: { q } });
        setResults(res.data?.data?.results || []);
        setShowSearch(true);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  return (
    <header
      className="sticky top-0 z-30 flex flex-col"
      style={{ background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6" style={{ height: 64 }}>
        {/* Left: mobile menu + search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            type="button"
            onClick={onMenu}
            className="lg:hidden btn-icon"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search… ⌘K"
              className="form-input pl-9"
              style={{ background: '#F8FAFC', height: 36, fontSize: 13 }}
              aria-label="Search workplace"
            />
            {showSearch && results.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-50"
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                {results.map(r => (
                  <Link
                    key={`${r.type}-${r.id}`}
                    to={r.href}
                    onClick={() => { setShowSearch(false); setQuery(''); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{r.type}</span>
                    <span className="font-medium">{r.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: clock-in chip + notifications + user */}
        <div className="flex items-center gap-2 ml-4">
          {/* Clock-in status chip */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 rounded-full text-xs font-medium"
            style={{
              height: 30,
              background: isClockedIn ? 'var(--color-success-bg)' : '#F8FAFC',
              border: `1px solid ${isClockedIn ? 'var(--color-success-border)' : 'var(--color-border)'}`,
              color: isClockedIn ? 'var(--color-success)' : 'var(--color-text-muted)',
            }}
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {isClockedIn
              ? <><span>Clocked in</span>{elapsed && <span className="tabular ml-1">· {elapsed}</span>}</>
              : <span>Not clocked in</span>
            }
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="btn-icon relative"
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            >
              <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: 'var(--color-danger)' }}
                  aria-hidden="true"
                />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg py-2 z-50"
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y" style={{ '--tw-divide-color': 'var(--color-border-subtle)' } as React.CSSProperties}>
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No notifications yet</p>
                  ) : notifications.map(n => (
                    <Link key={n.id} to="/notifications"
                      className="block px-4 py-3 transition-colors hover:bg-slate-50"
                      style={{ background: !n.isRead ? '#EFF6FF' : undefined }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{n.title}</span>
                        <span className="text-xs whitespace-nowrap tabular" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{n.message}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-slate-50"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent)' }}
              >
                {initials}
              </div>
              <span className="hidden md:block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {displayName}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-lg shadow-lg py-2 z-50"
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{displayName}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
                </div>
                <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-slate-50" style={{ color: 'var(--color-text-secondary)' }}>
                  <UserIcon className="w-4 h-4" /> Profile
                </Link>
                <Link to="/work-mode" className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-slate-50" style={{ color: 'var(--color-text-secondary)' }}>
                  <Settings className="w-4 h-4" /> Preferences
                </Link>
                <button type="button" onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-red-50"
                  style={{ color: 'var(--color-danger)' }}>
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page title bar */}
      <div className="px-4 md:px-6 pb-3 pt-0">
        <h1 className="page-title">{meta.title}</h1>
        {meta.description && <p className="page-sub">{meta.description}</p>}
      </div>
    </header>
  );
};