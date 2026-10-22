import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, LayoutDashboard, Clock, CheckSquare, MessageSquare, Bell, BookOpen,
  User, Settings, HelpCircle, LogOut, Users, DollarSign, Shield, Rocket,
  ChevronDown, ChevronRight, Layers, X,
} from 'lucide-react';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open = false, onClose }) => {
  const { user, hasPermission, hasRole, logout } = useAuth();
  const [deptExpanded, setDeptExpanded] = useState(true);

  const isHR = hasPermission('attendance.read.all') || hasPermission('leave.review') || hasRole('HR Manager') || hasRole('HR Officer') || hasRole('System Administrator');
  const isFinance = hasPermission('finance.read') || hasRole('Finance Manager') || hasRole('Finance Officer') || hasRole('System Administrator');
  const isAdmin = hasPermission('settings.manage') || hasRole('System Administrator');

  const navItem = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
    }`;

  const deptItem = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-slate-800 text-white border-l-2 border-blue-500 pl-2.5'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`w-64 bg-[#0b1b3a] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none overflow-hidden z-50
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:transition-transform ${open ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'} lg:translate-x-0`}
      >
        <div className="px-4 py-4 border-b border-slate-800/60 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white leading-none">AM DEV Pro</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Workplace</div>
            </div>
          </div>
          <button type="button" className="lg:hidden text-slate-400 hover:text-white" onClick={onClose} aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin" aria-label="Workplace">
          <NavLink to="/" end className={navItem} onClick={onClose}>
            <Home className="w-4 h-4 flex-shrink-0" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/employee" className={navItem} onClick={onClose}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span>My Dashboard</span>
          </NavLink>
          <NavLink to="/attendance" className={navItem} onClick={onClose}>
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Attendance</span>
          </NavLink>
          <NavLink to="/tasks" className={navItem} onClick={onClose}>
            <CheckSquare className="w-4 h-4 flex-shrink-0" />
            <span>Tasks &amp; Projects</span>
          </NavLink>
          <NavLink to="/messages" className={navItem} onClick={onClose}>
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span>Messages</span>
          </NavLink>
          <NavLink to="/notifications" className={navItem} onClick={onClose}>
            <Bell className="w-4 h-4 flex-shrink-0" />
            <span>Notifications</span>
          </NavLink>
          <NavLink to="/resources" className={navItem} onClick={onClose}>
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>Company Resources</span>
          </NavLink>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setDeptExpanded(!deptExpanded)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 hover:text-slate-400"
            >
              <span>Departments</span>
              {deptExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {deptExpanded && (
              <div className="mt-1 space-y-0.5">
                {isHR && (
                  <NavLink to="/hr" className={deptItem} onClick={onClose}>
                    <div className="p-1 rounded bg-blue-500/15 flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span>HR</span>
                  </NavLink>
                )}
                {isFinance && (
                  <NavLink to="/finance" className={deptItem} onClick={onClose}>
                    <div className="p-1 rounded bg-emerald-500/15 flex-shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span>Finance</span>
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin" className={deptItem} onClick={onClose}>
                    <div className="p-1 rounded bg-violet-500/15 flex-shrink-0">
                      <Shield className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <span>Administration</span>
                  </NavLink>
                )}
                <NavLink to="/projects" className={deptItem} onClick={onClose}>
                  <div className="p-1 rounded bg-orange-500/15 flex-shrink-0">
                    <Rocket className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <span>Projects &amp; Operations</span>
                </NavLink>
              </div>
            )}
          </div>

          <div className="pt-3 space-y-0.5">
            <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Settings</div>
            <NavLink to="/profile" className={navItem} onClick={onClose}>
              <User className="w-4 h-4 flex-shrink-0" />
              <span>Profile</span>
            </NavLink>
            <NavLink to="/work-mode" className={navItem} onClick={onClose}>
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span>Preferences</span>
            </NavLink>
            <NavLink to="/help" className={navItem} onClick={onClose}>
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span>Help &amp; Support</span>
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className="flex-shrink-0 px-3 py-3 border-t border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.profile?.displayName || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || user?.email}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{user?.roles?.[0] || 'Employee'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
