import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, Briefcase, CalendarCheck, Users, ShieldAlert, ArrowUpRight, 
  CheckCircle2, AlertCircle, Building, Laptop, Compass, FileText, 
  ExternalLink, Sparkles, UserCheck, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, attendanceStatus, isHybrid, isOnSite, isRemote } = useAuth();
  const [stats, setStats] = useState({
    onSiteCount: 14,
    remoteCount: 8,
    onLeaveCount: 2,
    pendingApprovals: 3,
  });

  const session = attendanceStatus?.session;
  const isClockedIn = !!(attendanceStatus?.hasActiveSession && session);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-500/20 p-6 md:p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Enterprise Operations Suite</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.profile?.firstName || 'Colleague'}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              AM DEV Pro Workplace portal is active. Track your attendance, collaborate across department workspaces, and manage hybrid schedules seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/attendance"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>Shift Console</span>
            </Link>
            <Link
              to="/workspaces"
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Workspaces</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Shift Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Current Shift</span>
            <div className={`p-2 rounded-lg ${isClockedIn ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white">
              {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isClockedIn 
                ? `Started at ${new Date(session?.clockInAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Shift requires clock-in'}
            </p>
          </div>
        </div>

        {/* Card 2: Arrangement Mode */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Work Arrangement</span>
            <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
              {isHybrid ? <Laptop className="w-4 h-4" /> : <Building className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white capitalize">
              {user?.profile?.workArrangement?.toLowerCase().replace('_', ' ') || 'On Site'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Policy approved & active
            </p>
          </div>
        </div>

        {/* Card 3: Team Presence */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">HQ On-Site Today</span>
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white">
              {stats.onSiteCount} Members
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats.remoteCount} Remote • {stats.onLeaveCount} On Leave
            </p>
          </div>
        </div>

        {/* Card 4: Governance Role */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Role & Security</span>
            <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-white truncate">
              {user?.roles?.[0] || 'Team Member'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {user?.permissions?.length || 0} Authorized Capabilities
            </p>
          </div>
        </div>
      </div>

      {/* Main Sections: Department Workspaces & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Workspaces (SharePoint style) - 2 Cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Department Workspaces</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  SharePoint Connected
                </span>
              </h2>
              <p className="text-xs text-slate-400">Unified corporate hubs, shared documents, and engineering pipelines</p>
            </div>
            <Link to="/workspaces" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Engineering Workspace */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 rounded-xl p-5 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 group-hover:scale-105 transition-transform">
                  <Laptop className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Active Sprint
                </span>
              </div>
              <h3 className="font-bold text-slate-100 mt-4 text-base group-hover:text-blue-400 transition-colors">
                Engineering & Architecture
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Sprint boards, CI/CD pipelines, API documentation, and microservice infrastructure repos.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>24 Repositories</span>
                <Link to="/workspaces?tab=engineering" className="text-blue-400 hover:underline flex items-center gap-1">
                  Enter Hub <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* HR Hub */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-600/15 text-emerald-400 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  HR Portal
                </span>
              </div>
              <h3 className="font-bold text-slate-100 mt-4 text-base group-hover:text-emerald-400 transition-colors">
                Human Resources & People Ops
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Employee handbook, wellness programs, benefits enrollment, and hybrid policy guidelines.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>12 Policies Updated</span>
                <Link to="/workspaces?tab=hr" className="text-emerald-400 hover:underline flex items-center gap-1">
                  Enter Hub <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Finance & Operations Hub */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-amber-600/15 text-amber-400 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  Quarterly Audit
                </span>
              </div>
              <h3 className="font-bold text-slate-100 mt-4 text-base group-hover:text-amber-400 transition-colors">
                Finance, Legal & Procurement
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Budget tracking, expense reimbursement forms, vendor agreements, and fiscal governance.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Q4 Reports Ready</span>
                <Link to="/workspaces?tab=finance" className="text-amber-400 hover:underline flex items-center gap-1">
                  Enter Hub <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Executive & Governance Hub */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 rounded-xl p-5 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-purple-600/15 text-purple-400 group-hover:scale-105 transition-transform">
                  <Building className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
                  Company-wide
                </span>
              </div>
              <h3 className="font-bold text-slate-100 mt-4 text-base group-hover:text-purple-400 transition-colors">
                Corporate Governance & Ops
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Leadership communications, townhall schedules, strategic OKRs, and corporate milestones.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Town Hall Nov 2</span>
                <Link to="/workspaces?tab=governance" className="text-purple-400 hover:underline flex items-center gap-1">
                  Enter Hub <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Notices - 1 Col */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/work-mode"
                className="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between text-xs group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-200 font-medium">Request Hybrid Work Mode</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/leave"
                className="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between text-xs group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-200 font-medium">Book Leave / PTO</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/directory"
                className="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between text-xs group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-200 font-medium">Search Directory</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workplace Bulletin</h2>
              <span className="text-[10px] text-blue-400 font-semibold">Active</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20">
                <span className="text-blue-300 font-semibold block">Hybrid Policy Reminder</span>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Engineers approved for hybrid arrangements must clock in via remote method on home days.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                <span className="text-slate-200 font-semibold block">Holiday Schedule 2026</span>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Upcoming corporate holiday calendar published in the HR workspace documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
