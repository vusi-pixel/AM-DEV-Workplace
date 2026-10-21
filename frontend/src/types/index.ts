// Central type definitions

export interface User {
  id: string;
  email: string;
  isActive: boolean;
  isFirstLogin: boolean;
  profile: EmployeeProfile | null;
  roles: string[];
  permissions: string[];
  hasActiveAttendance?: boolean;
  activeAttendanceSession?: AttendanceSession | null;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  workArrangement: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  workArrangementApprovedAt: string | null;
  employmentStatus: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  hireDate: string | null;
  departmentId: string | null;
  managerId: string | null;
  workScheduleId: string | null;
  department?: Department | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
}

export interface AttendanceSession {
  id: string;
  userId: string;
  workDate: string;
  clockInAt: string;
  clockOutAt: string | null;
  clockInMethod: 'ON_SITE' | 'REMOTE';
  clockOutMethod: 'ON_SITE' | 'REMOTE' | null;
  status: 'CLOCKED_IN' | 'CLOCKED_OUT' | 'ABSENT' | 'ON_LEAVE' | 'HOLIDAY' | 'MISSED_CLOCK_OUT';
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
}

export interface AttendanceStatus {
  hasActiveSession: boolean;
  session: AttendanceSession | null;
  workDate: string;
  userProfile: EmployeeProfile | null;
}

export interface WorkModeRequest {
  id: string;
  employeeId: string;
  requestedArrangement: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  reason: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewComments: string | null;
  createdAt: string;
  employee?: { id: string; email: string; profile: Pick<EmployeeProfile, 'firstName' | 'lastName' | 'employeeId'> };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewComments: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  eventType: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  description: string;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  createdAt: string;
  actor?: { email: string; profile: Pick<EmployeeProfile, 'firstName' | 'lastName'> | null };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}
