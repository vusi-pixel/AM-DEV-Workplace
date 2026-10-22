import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { VisitorCheckInModal } from '../components/VisitorCheckInModal';
import { EvacuationMusterModal } from '../components/EvacuationMusterModal';
import { 
  Building2, Users, UserPlus, Package, ShieldAlert, CheckCircle2, 
  LogOut, Clock, ScanLine, Search, Download, AlertTriangle, ArrowUpRight 
} from 'lucide-react';
import api from '../../../services/api';
import { VisitorRecord, DeliveryRecord } from '../../../types';

export const FrontDeskPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'visitors' | 'kiosk' | 'deliveries'>('visitors');

  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [onSiteStaff, setOnSiteStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Kiosk punch input
  const [kioskInput, setKioskInput] = useState<string>('');
  const [kioskFeedback, setKioskFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [kioskSubmitting, setKioskSubmitting] = useState<boolean>(false);

  // Delivery logger modal
  const [showDeliveryModal, setShowDeliveryModal] = useState<boolean>(false);
  const [carrier, setCarrier] = useState<string>('FedEx Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('hybrid.emp@amdev.com');
  const [packageType, setPackageType] = useState<string>('Parcel / Hardware');

  // Modals
  const [showVisitorModal, setShowVisitorModal] = useState<boolean>(false);
  const [showMusterModal, setShowMusterModal] = useState<boolean>(false);

  const fetchFrontDeskData = async () => {
    try {
      setLoading(true);
      const [visRes, delRes, staffRes] = await Promise.all([
        api.get<{ success: boolean; data: VisitorRecord[] }>('/frontdesk/visitors').catch(() => null),
        api.get<{ success: boolean; data: DeliveryRecord[] }>('/frontdesk/deliveries').catch(() => null),
        api.get<{ success: boolean; data: any[] }>('/frontdesk/onsite-employees').catch(() => null),
      ]);

      if (visRes?.data?.data) setVisitors(visRes.data.data);
      if (delRes?.data?.data) setDeliveries(delRes.data.data);
      if (staffRes?.data?.data) setOnSiteStaff(staffRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrontDeskData();
  }, []);

  const handleCheckoutVisitor = async (id: string) => {
    try {
      await api.post(`/frontdesk/visitors/${id}/checkout`);
      alert('Visitor checked out. Security badge retrieved.');
      fetchFrontDeskData();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    }
  };

  const handleKioskClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setKioskSubmitting(true);
    setKioskFeedback(null);
    try {
      const res = await api.post('/frontdesk/kiosk/clock-in', {
        employeeIdOrEmail: kioskInput,
        terminalCode: 'FRONT_DESK_KIOSK_1',
      });
      setKioskFeedback({
        type: 'success',
        msg: res.data?.message || 'Employee on-site attendance recorded.',
      });
      setKioskInput('');
      fetchFrontDeskData();
    } catch (err: any) {
      setKioskFeedback({
        type: 'error',
        msg: err.message || 'Kiosk check-in failed',
      });
    } finally {
      setKioskSubmitting(false);
    }
  };

  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/frontdesk/deliveries', {
        carrier,
        trackingNumber,
        recipientEmail,
        packageType,
      });
      alert('Package delivery logged. Recipient notified.');
      setShowDeliveryModal(false);
      setTrackingNumber('');
      fetchFrontDeskData();
    } catch (err: any) {
      alert(err.message || 'Failed to log package');
    }
  };

  const handleCollectDelivery = async (id: string) => {
    try {
      await api.post(`/frontdesk/deliveries/${id}/collect`);
      alert('Package marked collected by recipient.');
      fetchFrontDeskData();
    } catch (err: any) {
      alert(err.message || 'Failed to mark collected');
    }
  };

  const activeVisitors = visitors.filter(v => v.status === 'ACTIVE_IN_BUILDING');
  const pendingPackages = deliveries.filter(d => d.status === 'READY_FOR_PICKUP');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              Front Desk & Security Kiosk
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Reception, Guest Management & On-Site Access</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            HQ security gate, physical visitor check-ins, package deliveries, and emergency evacuation roster.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMusterModal(true)}
            className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Evacuation Muster Roll</span>
          </button>
          <button
            onClick={() => setShowVisitorModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Check In Guest</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto w-fit">
        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'visitors' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Visitor Registry ({activeVisitors.length} In-Building)
        </button>
        <button
          onClick={() => setActiveTab('kiosk')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'kiosk' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ScanLine className="w-3.5 h-3.5" />
          Staff Arrival Kiosk Scanner
        </button>
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'deliveries' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Deliveries & Mail ({pendingPackages.length} Pending)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Building Occupancy</span>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{onSiteStaff.length + activeVisitors.length} People</div>
          <div className="text-xs text-slate-400 mt-1">Confirmed on-site right now</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Staff Physically Present</span>
          <div className="mt-2 text-2xl font-extrabold text-blue-400 font-mono">{onSiteStaff.length} Employees</div>
          <div className="text-xs text-slate-400 mt-1">Clocked in via On-Site geofence</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Visitor Badges</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">{activeVisitors.length} Guests</div>
          <div className="text-xs text-slate-400 mt-1">Security badges issued today</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Parcels Awaiting Pickup</span>
          <div className="mt-2 text-2xl font-extrabold text-purple-400 font-mono">{pendingPackages.length} Packages</div>
          <div className="text-xs text-slate-400 mt-1">Front desk storage room</div>
        </div>
      </div>

      {/* Tab 1: Visitors List */}
      {activeTab === 'visitors' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Visitor Management & Security Badging</span>
              </h2>
              <p className="text-xs text-slate-400">Real-time guest registry with badge numbers and host associations</p>
            </div>
            <button
              onClick={() => setShowVisitorModal(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              + Register New Guest
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Badge #</th>
                  <th className="py-3 px-4">Visitor Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Host Staff</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Checked In</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{v.badgeNumber}</td>
                    <td className="py-3 px-4 font-semibold text-white">{v.fullName}</td>
                    <td className="py-3 px-4 text-slate-300">{v.company}</td>
                    <td className="py-3 px-4 text-blue-400">{v.hostEmployee}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400">{v.purpose}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        v.status === 'ACTIVE_IN_BUILDING' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {v.status === 'ACTIVE_IN_BUILDING' ? 'Inside Building' : 'Checked Out'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.status === 'ACTIVE_IN_BUILDING' && (
                        <button
                          onClick={() => handleCheckoutVisitor(v.id)}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-[11px]"
                        >
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Arriving Staff Kiosk Scanner */}
      {activeTab === 'kiosk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Staff Arrival Terminal</h2>
            </div>
            <p className="text-xs text-slate-400">
              Staff entering the building can scan their RFID badge or enter their employee email / ID here for instant on-site clock-in.
            </p>

            {kioskFeedback && (
              <div className={`p-3 rounded-xl text-xs ${
                kioskFeedback.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'
              }`}>
                {kioskFeedback.msg}
              </div>
            )}

            <form onSubmit={handleKioskClockIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Badge ID or Email Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-003 or hybrid.emp@amdev.com"
                  value={kioskInput}
                  onChange={(e) => setKioskInput(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={kioskSubmitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
              >
                <ScanLine className="w-4 h-4" />
                <span>{kioskSubmitting ? 'Scanning...' : 'Verify & Clock In'}</span>
              </button>
            </form>

            <div className="text-[11px] text-slate-500 p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
              💡 <strong>Quick Demo Test:</strong> Enter <code className="text-cyan-400">EMP-003</code> or <code className="text-cyan-400">employee@amdev.com</code> to simulate staff scanning their badge at the front door.
            </div>
          </div>

          {/* Live on-site staff list (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Employees Currently On-Site</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Arrival Time</th>
                    <th className="py-3 px-4">Facility Station</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {onSiteStaff.map((s) => (
                    <tr key={s.sessionId} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white">{s.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{s.employeeId}</td>
                      <td className="py-3 px-4 text-slate-300">{s.department}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {new Date(s.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{s.deskLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Package Deliveries */}
      {activeTab === 'deliveries' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span>Courier Deliveries & Inbound Mail Log</span>
              </h2>
              <p className="text-xs text-slate-400">FedEx, DHL, UPS parcels received at front desk reception</p>
            </div>
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              + Log Inbound Parcel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Courier</th>
                  <th className="py-3 px-4">Tracking #</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Package Type</th>
                  <th className="py-3 px-4">Arrived</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white">{d.carrier}</td>
                    <td className="py-3 px-4 font-mono text-purple-400">{d.trackingNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{d.recipientName}</div>
                      <div className="text-[10px] text-slate-500">{d.recipientEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{d.packageType}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(d.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.status === 'READY_FOR_PICKUP' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {d.status === 'READY_FOR_PICKUP' ? 'Ready for Pickup' : 'Collected'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.status === 'READY_FOR_PICKUP' && (
                        <button
                          onClick={() => handleCollectDelivery(d.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                        >
                          Mark Collected
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <VisitorCheckInModal
        isOpen={showVisitorModal}
        onClose={() => setShowVisitorModal(false)}
        onSuccess={fetchFrontDeskData}
      />

      <EvacuationMusterModal
        isOpen={showMusterModal}
        onClose={() => setShowMusterModal(false)}
      />

      {/* Log Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Log Inbound Courier Parcel</h3>
            <form onSubmit={handleLogDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="FedEx Express">FedEx Express</option>
                  <option value="DHL Priority">DHL Priority</option>
                  <option value="UPS Worldwide">UPS Worldwide</option>
                  <option value="Amazon Logistics">Amazon Logistics</option>
                  <option value="Courier Hand Delivery">Courier Hand Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tracking Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FX-983019318"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Employee Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@amdev.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Package Contents / Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro, Legal NDA documents, Ergonomic mouse"
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save & Notify Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
