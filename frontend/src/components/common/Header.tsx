import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, Search, User as UserIcon, Shield, LogOut, CheckCheck, 
  ExternalLink, Layers, Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { Notification } from '../../types';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get<{ success: boolean; data: { notifications: Notification[]; unreadCount: number } }>('/notifications');
      if (res.data?.success && res.data.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Brand & Workspace title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                AM DEV <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">PRO</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                Workplace
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Management Suite</p>
          </div>
        </div>
      </div>

      {/* Global Quick Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees, documents, department portals..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-xs tracking-wide uppercase text-slate-400">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 hover:bg-slate-800/50 transition-colors ${!n.isRead ? 'bg-blue-950/20 border-l-2 border-blue-500' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase ring-2 ring-blue-500/20">
              {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight">
                {user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || user?.email}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">
                {user?.roles?.[0] || 'Team Member'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-xs font-bold text-white">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  {user?.roles?.map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="py-1">
                <a
                  href="/attendance"
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  My Shift & Attendance
                </a>
                {user?.roles?.includes('System Administrator') && (
                  <a
                    href="/admin"
                    className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Admin Governance Portal
                  </a>
                )}
              </div>

              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of AM DEV Pro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
