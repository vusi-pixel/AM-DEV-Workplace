import React, { useState, useEffect } from 'react';
import { ShieldAlert, Printer, X, Download, Users, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { MusterPerson } from '../../../types';

interface EvacuationMusterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvacuationMusterModal: React.FC<EvacuationMusterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [musterList, setMusterList] = useState<MusterPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchMuster = async () => {
        setLoading(true);
        try {
          const res = await api.get<{ success: boolean; data: any }>('/frontdesk/muster-roll');
          if (res.data?.success && res.data.data) {
            setMusterList(res.data.data.musterList || []);
            setMeta(res.data.data);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchMuster();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-red-500/40 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">EMERGENCY EVACUATION MUSTER ROLL</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                  Live Building Manifest
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official real-time roster of all personnel & visitors physically confirmed on-site at AM DEV Pro HQ.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Headcount banner */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
          <div>
            <div className="text-xs text-slate-400 uppercase">Total in Facility</div>
            <div className="text-2xl font-mono font-extrabold text-white">{meta?.totalOccupants || musterList.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Confirmed Staff</div>
            <div className="text-2xl font-mono font-extrabold text-blue-400">{meta?.staffCount || 2}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Registered Guests</div>
            <div className="text-2xl font-mono font-extrabold text-amber-400">{meta?.visitorCount || 2}</div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Generating live evacuation roster...</div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-slate-300 uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Identifier / Badge</th>
                  <th className="py-2.5 px-3">Department / Host</th>
                  <th className="py-2.5 px-3">Admitted At</th>
                  <th className="py-2.5 px-3 text-right">Accounted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {musterList.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.type === 'STAFF' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{p.identifier}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.department}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(p.admittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input type="checkbox" className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            Generated: {new Date().toLocaleTimeString()} • Station: FRONT_DESK_PRIMARY
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-900/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print Evacuation Manifest</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
