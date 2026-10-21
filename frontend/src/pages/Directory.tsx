import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Mail, Phone, Building2, Laptop, 
  MapPin, ShieldCheck, ChevronRight, UserCheck 
} from 'lucide-react';
import api from '../services/api';
import { EmployeeProfile } from '../types';

interface DirectoryEmployee {
  id: string;
  email: string;
  roles: string[];
  profile: EmployeeProfile | null;
}

export const Directory: React.FC = () => {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: any[] }>('/employees');
        if (res.data?.success && res.data.data) {
          setEmployees(res.data.data);
        }
      } catch {
        // Fallback demo data if endpoint restricted or empty
        setEmployees([
          {
            id: '1',
            email: 'admin@amdev.com',
            roles: ['System Administrator'],
            profile: {
              id: 'p1',
              userId: '1',
              employeeId: 'EMP-001',
              firstName: 'System',
              lastName: 'Administrator',
              displayName: 'Admin Root',
              phone: '+1 (555) 019-2831',
              avatarUrl: null,
              jobTitle: 'Director of Technology & Systems',
              workArrangement: 'ON_SITE',
              workArrangementApprovedAt: null,
              employmentStatus: 'ACTIVE',
              hireDate: '2023-01-01',
              departmentId: 'd1',
              managerId: null,
              workScheduleId: null,
              department: { id: 'd1', name: 'Engineering', code: 'ENG', description: null, isActive: true },
              createdAt: '2023-01-01',
              updatedAt: '2026-10-21',
            },
          },
          {
            id: '2',
            email: 'hr@amdev.com',
            roles: ['HR Manager'],
            profile: {
              id: 'p2',
              userId: '2',
              employeeId: 'EMP-002',
              firstName: 'Sarah',
              lastName: 'Jenkins',
              displayName: 'Sarah Jenkins',
              phone: '+1 (555) 019-2832',
              avatarUrl: null,
              jobTitle: 'Senior HR Business Partner',
              workArrangement: 'HYBRID',
              workArrangementApprovedAt: '2026-01-10',
              employmentStatus: 'ACTIVE',
              hireDate: '2023-04-15',
              departmentId: 'd2',
              managerId: null,
              workScheduleId: null,
              department: { id: 'd2', name: 'Human Resources', code: 'HR', description: null, isActive: true },
              createdAt: '2023-04-15',
              updatedAt: '2026-10-21',
            },
          },
          {
            id: '3',
            email: 'hybrid.emp@amdev.com',
            roles: ['Employee'],
            profile: {
              id: 'p3',
              userId: '3',
              employeeId: 'EMP-003',
              firstName: 'Marcus',
              lastName: 'Vance',
              displayName: 'Marcus Vance',
              phone: '+1 (555) 019-2833',
              avatarUrl: null,
              jobTitle: 'Senior Full Stack Engineer',
              workArrangement: 'HYBRID',
              workArrangementApprovedAt: '2026-02-01',
              employmentStatus: 'ACTIVE',
              hireDate: '2024-02-10',
              departmentId: 'd1',
              managerId: null,
              workScheduleId: null,
              department: { id: 'd1', name: 'Engineering', code: 'ENG', description: null, isActive: true },
              createdAt: '2024-02-10',
              updatedAt: '2026-10-21',
            },
          },
          {
            id: '4',
            email: 'employee@amdev.com',
            roles: ['Employee'],
            profile: {
              id: 'p4',
              userId: '4',
              employeeId: 'EMP-004',
              firstName: 'David',
              lastName: 'Sterling',
              displayName: 'David Sterling',
              phone: '+1 (555) 019-2834',
              avatarUrl: null,
              jobTitle: 'Financial Systems Analyst',
              workArrangement: 'ON_SITE',
              workArrangementApprovedAt: null,
              employmentStatus: 'ACTIVE',
              hireDate: '2024-06-01',
              departmentId: 'd3',
              managerId: null,
              workScheduleId: null,
              department: { id: 'd3', name: 'Finance', code: 'FIN', description: null, isActive: true },
              createdAt: '2024-06-01',
              updatedAt: '2026-10-21',
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const prof = emp.profile;
    const fullName = `${prof?.firstName || ''} ${prof?.lastName || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (prof?.jobTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (prof?.employeeId || '').toLowerCase().includes(search.toLowerCase());

    const matchesDept =
      deptFilter === 'ALL' || prof?.department?.name === deptFilter;

    const matchesMode =
      modeFilter === 'ALL' || prof?.workArrangement === modeFilter;

    return matchesSearch && matchesDept && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>Enterprise Employee Directory</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-medium">
            Staff Directory
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore staff profiles, cross-department colleagues, and work arrangement configurations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, title, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Arrangements</option>
            <option value="ON_SITE">On-Site Dedicated</option>
            <option value="HYBRID">Hybrid Approved</option>
            <option value="REMOTE">Remote Privilege</option>
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading directory...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No team members matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => {
            const p = emp.profile;
            const arrangement = p?.workArrangement || 'ON_SITE';

            return (
              <div
                key={emp.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center uppercase shadow-md shadow-purple-500/20">
                      {p?.firstName?.[0] || 'E'}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase flex items-center gap-1 ${
                        arrangement === 'HYBRID'
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                          : arrangement === 'REMOTE'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {arrangement === 'HYBRID' ? <Laptop className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                      {arrangement.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">
                        {p?.firstName} {p?.lastName}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">
                        {p?.employeeId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{p?.jobTitle || 'Team Member'}</p>
                    <p className="text-[11px] text-purple-400 mt-1">{p?.department?.name || 'General Operations'}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {p?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
