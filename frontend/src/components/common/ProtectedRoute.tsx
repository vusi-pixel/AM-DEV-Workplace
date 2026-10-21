import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  requiredRole,
}) => {
  const { user, loading, hasPermission, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-widest uppercase">Authenticating AM DEV Workplace...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="p-8 text-center text-slate-400">
        <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
        <p className="text-sm">You do not have the required permissions ({requiredPermission}) to access this resource.</p>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole) && !hasRole('System Administrator')) {
    return (
      <div className="p-8 text-center text-slate-400">
        <h2 className="text-xl font-bold text-red-400 mb-2">Role Restricted</h2>
        <p className="text-sm">This area is reserved for users with role: {requiredRole}.</p>
      </div>
    );
  }

  return <Outlet />;
};
