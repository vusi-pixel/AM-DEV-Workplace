import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { User, AttendanceStatus } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  attendanceStatus: AttendanceStatus | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clockOut: (options?: { method?: string; notes?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isHybrid: boolean;
  isOnSite: boolean;
  isRemote: boolean;
  activeAttendanceSession: AttendanceStatus['session'] | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);

  const refreshAttendance = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: AttendanceStatus }>('/attendance/status');
      if (res.data?.success && res.data.data) {
        setAttendanceStatus(res.data.data);
      }
    } catch {
      // Not authenticated or network error
      setAttendanceStatus(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: User }>('/auth/me');
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        await refreshAttendance();
      } else {
        setUser(null);
        setAttendanceStatus(null);
      }
    } catch {
      setUser(null);
      setAttendanceStatus(null);
    } finally {
      setLoading(false);
    }
  }, [refreshAttendance]);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
      setAttendanceStatus(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; data: { user: User } }>('/auth/login', {
      email,
      password,
    });
    if (res.data?.success && res.data.data?.user) {
      setUser(res.data.data.user);
      await refreshAttendance();
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAttendanceStatus(null);
      window.location.href = '/login';
    }
  };

  const clockOut = async (options?: { method?: string; notes?: string }) => {
    try {
      const method = options?.method || (user?.profile?.workArrangement === 'ON_SITE' ? 'ON_SITE' : 'REMOTE');
      await api.post('/attendance/clock-out', {
        method,
        notes: options?.notes,
      });
    } finally {
      setUser(null);
      setAttendanceStatus(null);
      window.location.href = '/login?signed_out=clock_out';
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roles?.includes('System Administrator')) return true;
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles?.includes(role) || false;
  };

  const arrangement = user?.profile?.workArrangement || 'ON_SITE';
  const isHybrid = arrangement === 'HYBRID';
  const isOnSite = arrangement === 'ON_SITE';
  const isRemote = arrangement === 'REMOTE';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        attendanceStatus,
        login,
        logout,
        clockOut,
        refreshUser,
        refreshAttendance,
        hasPermission,
        hasRole,
        isHybrid,
        isOnSite,
        isRemote,
        activeAttendanceSession: attendanceStatus?.session || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
