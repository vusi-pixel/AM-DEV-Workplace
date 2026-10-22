import React, { useState } from 'react';
import { UserPlus, Shield, X, Check } from 'lucide-react';
import api from '../../../services/api';

interface VisitorCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VisitorCheckInModal: React.FC<VisitorCheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [hostEmployee, setHostEmployee] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const generatedBadge = `GUEST-${Math.floor(100 + Math.random() * 900)}`;
      await api.post('/frontdesk/visitors', {
        fullName,
        company,
        hostEmployee,
        purpose,
        badgeNumber: generatedBadge,
      });
      alert(`Visitor badge #${generatedBadge} issued for ${fullName}. Host has been notified.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to check in visitor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Check In Building Visitor</h3>
              <p className="text-xs text-slate-400">Issue visitor security pass & badge</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Guest Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rachel Adams"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Organization / Vendor</label>
            <input
              type="text"
              required
              placeholder="e.g. Google Cloud, Deloitte, Freelance"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Host Staff Member</label>
            <input
              type="text"
              required
              placeholder="e.g. Marcus Vance, Sarah Jenkins"
              value={hostEmployee}
              onChange={(e) => setHostEmployee(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Visit Purpose</label>
            <input
              type="text"
              required
              placeholder="e.g. Technical Interview, Architecture Review, Vendor Meeting"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-[11px] text-slate-300">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Government ID verification confirmed by Front Desk officer.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Issuing Pass...' : 'Print Badge & Check In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
