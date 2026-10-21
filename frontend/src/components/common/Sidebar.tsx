import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  Briefcase,
  CalendarDays,
  Users,
  ShieldAlert,
  FolderKanban,
  Sparkles,
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, hasPermission, hasRole } = useAuth();

  const isHR = hasPermission('attendance.read.all') || hasPermission('leave.review') || hasRole('HR Manager');
  const isAdmin = hasPermission('settings.manage') || hasPermission('audit.read') || hasRole('System Administrator');

  const navClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Workspaces Highlight (SharePoint Style) */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspaces Hub
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              SharePoint v2
            </span>
          </div>
          <nav className="space-y-1">
            <NavLink to="/" end className={navClasses}>
              <LayoutDashboard className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Executive Overview</span>
            </NavLink>
            <NavLink to="/workspaces" className={navClasses}>
              <FolderKanban className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Department Workspaces</span>
            </NavLink>
          </nav>
        </div>

        {/* Core Workplace Operations */}
        <div>
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Employee Operations
            </span>
          </div>
          <nav className="space-y-1">
            <NavLink to="/attendance" className={navClasses}>
              <Clock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1 flex items-center justify-between">
                <span>Shift & Attendance</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </NavLink>
            <NavLink to="/work-mode" className={navClasses}>
              <Briefcase className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Hybrid & Work Mode</span>
            </NavLink>
            <NavLink to="/leave" className={navClasses}>
              <CalendarDays className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Leave & Time-Off</span>
            </NavLink>
            <NavLink to="/directory" className={navClasses}>
              <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Corporate Directory</span>
            </NavLink>
          </nav>
        </div>

        {/* HR & Supervisory Control */}
        {isHR && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                HR Governance
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                Supervisory
              </span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/hr-portal" className={navClasses}>
                <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>HR & Staff Governance</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* Administration & Security Audit */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Security & Platform
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                Admin
              </span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin" className={navClasses}>
                <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Audit & System Control</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer / System Status card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Node Gateway
            </span>
            <span className="text-[10px] font-mono text-emerald-400">v1.0-PRO</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Assigned: <strong className="text-slate-200">{user?.profile?.workArrangement || 'ON_SITE'}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
};
