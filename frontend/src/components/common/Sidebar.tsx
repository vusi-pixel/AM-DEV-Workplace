import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, LayoutDashboard, Clock, CheckSquare, BookOpen,
  User, Settings, HelpCircle, LogOut, Users, DollarSign, Shield, Rocket,
  ChevronDown, Layers, X,
} from 'lucide-react';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
  onClick?: () => void;
}

const SidebarNavItem: React.FC<NavItemProps> = ({ to, icon, label, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    aria-current={undefined}
    className={({ isActive }) =>
      `nav-item${isActive ? ' active' : ''}`
    }
  >
    {({ isActive }) => (
      <>
        <span aria-hidden="true" className="flex-shrink-0" style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
          {icon}
        </span>
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

export const Sidebar: React.FC<SidebarProps> = ({ open = false, onClose }) => {
  const { user, hasPermission, hasRole, logout } = useAuth();
  const [deptExpanded, setDeptExpanded] = useState(true);

  const isHR      = hasPermission('attendance.read.all') || hasPermission('leave.review') || hasRole('HR Manager') || hasRole('HR Officer') || hasRole('System Administrator');
  const isFinance = hasPermission('finance.read') || hasRole('Finance Manager') || hasRole('Finance Officer') || hasRole('System Administrator');
  const isAdmin   = hasPermission('settings.manage') || hasRole('System Administrator');

  const displayName = user?.profile?.displayName ||
    `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() ||
    user?.email || 'User';
  const role = user?.roles?.[0] || 'Employee';
  const initials = displayName.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 lg:hidden bg-black/30"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          flex flex-col h-screen sticky top-0 z-50 select-none overflow-hidden
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0
          max-lg:transition-transform max-lg:duration-200
          ${open ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
          lg:translate-x-0
        `}
        style={{
          width: 248,
          background: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
            <Layers className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>AM DEV Pro</span>
          </Link>
          <button
            type="button"
            className="lg:hidden btn-icon"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin" aria-label="Main navigation">
          {/* Main section */}
          <p className="px-2 mb-1 mt-1 text-xs font-medium tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Main</p>
          <SidebarNavItem to="/" end icon={<Home className="w-4 h-4" />} label="Home" onClick={onClose} />
          <SidebarNavItem to="/employee" icon={<LayoutDashboard className="w-4 h-4" />} label="My dashboard" onClick={onClose} />
          <SidebarNavItem to="/attendance" icon={<Clock className="w-4 h-4" />} label="Attendance" onClick={onClose} />
          <SidebarNavItem to="/tasks" icon={<CheckSquare className="w-4 h-4" />} label="Tasks & projects" onClick={onClose} />
          <SidebarNavItem to="/resources" icon={<BookOpen className="w-4 h-4" />} label="Company resources" onClick={onClose} />

          {/* Departments section */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setDeptExpanded(!deptExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              style={{ color: 'var(--color-text-muted)' }}
              aria-expanded={deptExpanded}
            >
              <span>Departments</span>
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ transform: deptExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                aria-hidden="true"
              />
            </button>

            {deptExpanded && (
              <div className="mt-1 space-y-0.5">
                {isHR && (
                  <SidebarNavItem to="/hr" icon={<Users className="w-4 h-4" />} label="HR" onClick={onClose} />
                )}
                {isFinance && (
                  <SidebarNavItem to="/finance" icon={<DollarSign className="w-4 h-4" />} label="Finance" onClick={onClose} />
                )}
                {isAdmin && (
                  <SidebarNavItem to="/admin" icon={<Shield className="w-4 h-4" />} label="Administration" onClick={onClose} />
                )}
                <SidebarNavItem to="/projects" icon={<Rocket className="w-4 h-4" />} label="Projects & operations" onClick={onClose} />
              </div>
            )}
          </div>

          {/* Settings section */}
          <div className="mt-4">
            <p className="px-2 mb-1 text-xs font-medium tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Settings</p>
            <SidebarNavItem to="/profile" icon={<User className="w-4 h-4" />} label="Profile" onClick={onClose} />
            <SidebarNavItem to="/work-mode" icon={<Settings className="w-4 h-4" />} label="Preferences" onClick={onClose} />
            <SidebarNavItem to="/help" icon={<HelpCircle className="w-4 h-4" />} label="Help & support" onClick={onClose} />
          </div>
        </nav>

        {/* User menu at the bottom */}
        <div
          className="flex-shrink-0 px-3 py-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{displayName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-icon flex-shrink-0"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};