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
  Building2,
  DollarSign,
  ScanLine,
  UserCheck,
  Laptop
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, hasPermission, hasRole } = useAuth();

  const isHR = hasPermission('attendance.read.all') || hasPermission('leave.review') || hasRole('HR Manager') || hasRole('System Administrator');
  const isFinance = hasPermission('finance.read') || hasRole('Finance Manager') || hasRole('System Administrator');
  const isFrontDesk = hasPermission('frontdesk.visitors.manage') || hasRole('Front Desk Officer') || hasRole('System Administrator');
  const isAdmin = hasPermission('settings.manage') || hasRole('System Administrator');

  const navClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`;

  const deptClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group border ${
      isActive
        ? 'bg-slate-800 text-white border-blue-500/50 shadow-md shadow-blue-600/10 font-bold'
        : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-800/50'
    }`;

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-4 space-y-5 overflow-y-auto">
        {/* Department Interfaces (Core Focus from Master Prompt) */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Department Portals
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold">
              MODULAR
            </span>
          </div>

          <nav className="space-y-1.5">
            {/* 1. Worker Portal */}
            <NavLink to="/employee" className={deptClasses}>
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 group-hover:scale-105 transition-transform">
                <Laptop className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="text-slate-200">Worker Portal</div>
                <div className="text-[10px] text-slate-500 font-normal">Shift punch, self-service</div>
              </div>
            </NavLink>

            {/* 2. HR Dashboard */}
            {isHR && (
              <NavLink to="/hr" className={deptClasses}>
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-200">HR Dashboard</div>
                  <div className="text-[10px] text-slate-500 font-normal">Live status, leave desk</div>
                </div>
              </NavLink>
            )}

            {/* 3. Finance & Payroll */}
            {isFinance && (
              <NavLink to="/finance" className={deptClasses}>
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-200">Finance & Payroll</div>
                  <div className="text-[10px] text-slate-500 font-normal">Hours audit, expenses</div>
                </div>
              </NavLink>
            )}

            {/* 4. Front Desk & Kiosk */}
            {isFrontDesk && (
              <NavLink to="/front-desk" className={deptClasses}>
                <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 group-hover:scale-105 transition-transform">
                  <ScanLine className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-200">Front Desk & Kiosk</div>
                  <div className="text-[10px] text-slate-500 font-normal">Visitors, arrival scanner</div>
                </div>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Global Operations Hub */}
        <div>
          <div className="px-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Operations & Workspaces
            </span>
          </div>
          <nav className="space-y-1">
            <NavLink to="/" end className={navClasses}>
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Executive Overview</span>
            </NavLink>
            <NavLink to="/workspaces" className={navClasses}>
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <span>Team Workspaces (SharePoint)</span>
            </NavLink>
            <NavLink to="/attendance" className={navClasses}>
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Attendance History</span>
            </NavLink>
            <NavLink to="/directory" className={navClasses}>
              <Users className="w-4 h-4 text-purple-400" />
              <span>Staff Directory</span>
            </NavLink>
          </nav>
        </div>

        {/* Admin Governance */}
        {isAdmin && (
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                Administration
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                SEC-OPS
              </span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin" className={navClasses}>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Audit & System Control</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Department Mesh
            </span>
            <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Active: <strong className="text-slate-200">{user?.roles?.[0] || 'Team Member'}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
};
