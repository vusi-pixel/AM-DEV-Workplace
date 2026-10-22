import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Download, CheckCircle2, AlertCircle, Search, Sparkles } from 'lucide-react';
import api from '../../../services/api';
import { PayrollRecord } from '../../../types';

export const PayrollTable: React.FC = () => {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: PayrollRecord[] }>('/finance/payroll-hours');
      if (res.data?.success && res.data.data) {
        setRecords(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const filtered = records.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.department.toLowerCase().includes(search.toLowerCase())
  );

  const exportPayrollCSV = () => {
    const headers = 'Employee ID,Name,Email,Department,Rate/hr,Regular Hours,Overtime Hours,Total Hours,Estimated Gross\n';
    const rows = filtered.map(r => 
      `"${r.employeeId || 'EMP'}","${r.name}","${r.email}","${r.department}",$${r.hourlyRate},${r.regularHours},${r.overtimeHours},${r.totalHours},$${r.grossPay}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AM_DEV_Payroll_Hours_Summary_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPayout = records.reduce((acc, r) => acc + r.grossPay, 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Attendance & Shift Payroll Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-400">Hours calculated automatically from verified shift punch timestamps</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPayrollCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Export Payroll CSV
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="text-xs text-slate-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
          Total Estimated Gross: <span className="text-amber-400 font-mono text-sm">${totalPayout.toLocaleString()}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">Calculating payroll hours...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Rate / Hr</th>
                <th className="py-3 px-4">Regular Hrs</th>
                <th className="py-3 px-4">Overtime Hrs</th>
                <th className="py-3 px-4">Gross Payout</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((r) => (
                <tr key={r.userId} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{r.name}</div>
                    <div className="text-[10px] text-slate-500">{r.email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{r.department}</td>
                  <td className="py-3 px-4 font-mono">${r.hourlyRate}/hr</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{r.regularHours}h</td>
                  <td className="py-3 px-4 font-mono text-amber-400">{r.overtimeHours}h</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">${r.grossPay.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Ready for ACH
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
