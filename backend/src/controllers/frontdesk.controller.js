'use strict';
const response = require('../utils/response');
const { visitors, deliveries, attendanceSessions, users } = require('../config/mockStore');

const getDashboard = async (req, res, next) => {
  try {
    const onSiteEmployees = attendanceSessions.filter(s => s.status === 'CLOCKED_IN' && s.clockInMethod === 'ON_SITE');
    const activeVisitors = visitors.filter(v => v.status === 'ACTIVE_IN_BUILDING');
    const pendingDeliveries = deliveries.filter(d => d.status === 'READY_FOR_PICKUP');

    return response.success(res, {
      kpis: {
        onSiteEmployeesCount: onSiteEmployees.length,
        activeVisitorsCount: activeVisitors.length,
        pendingDeliveriesCount: pendingDeliveries.length,
        totalBuildingOccupancy: onSiteEmployees.length + activeVisitors.length,
        securityStatus: 'ALL_CLEAR_ZONE_SECURED',
      },
      activeVisitors,
      pendingDeliveries,
    });
  } catch (err) {
    next(err);
  }
};

const getVisitors = async (req, res, next) => {
  try {
    return response.success(res, visitors);
  } catch (err) {
    next(err);
  }
};

const checkInVisitor = async (req, res, next) => {
  try {
    const { fullName, company, hostEmployee, purpose, badgeNumber } = req.body;
    const newVisitor = {
      id: `vis-${Date.now()}`,
      fullName,
      company: company || 'Independent Guest',
      hostEmployee: hostEmployee || 'General Operations',
      hostEmail: '',
      badgeNumber: badgeNumber || `GUEST-${Math.floor(100 + Math.random() * 900)}`,
      purpose: purpose || 'Official Business',
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      status: 'ACTIVE_IN_BUILDING',
      idVerified: true,
    };
    visitors.unshift(newVisitor);
    return response.success(res, newVisitor, 'Visitor checked in and building security badge issued');
  } catch (err) {
    next(err);
  }
};

const checkOutVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitor = visitors.find(v => v.id === id);
    if (!visitor) return response.notFound(res, 'Visitor badge record not found');

    visitor.status = 'CHECKED_OUT';
    visitor.checkOutTime = new Date().toISOString();
    return response.success(res, visitor, 'Visitor checked out. Badge surrendered.');
  } catch (err) {
    next(err);
  }
};

const getOnSiteEmployees = async (req, res, next) => {
  try {
    const onSiteSessions = attendanceSessions.filter(s => s.status === 'CLOCKED_IN' && s.clockInMethod === 'ON_SITE');
    const onSiteList = onSiteSessions.map(sess => {
      const u = users.find(x => x.id === sess.userId);
      return {
        sessionId: sess.id,
        userId: sess.userId,
        employeeId: u?.profile?.employeeId || 'EMP',
        name: u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'Employee',
        email: u?.email,
        department: u?.profile?.department?.name || 'Operations',
        clockInAt: sess.clockInAt,
        durationMinutes: sess.durationMinutes || 0,
        deskLocation: 'HQ 3rd Floor, Station A',
      };
    });
    return response.success(res, onSiteList);
  } catch (err) {
    next(err);
  }
};

const kioskClockIn = async (req, res, next) => {
  try {
    const { employeeIdOrEmail, terminalCode } = req.body;
    const u = users.find(x => 
      x.email.toLowerCase() === employeeIdOrEmail.toLowerCase() || 
      x.profile?.employeeId?.toLowerCase() === employeeIdOrEmail.toLowerCase()
    );

    if (!u) {
      return response.badRequest(res, 'Unrecognized employee credential or badge ID');
    }

    // Check if already clocked in
    const existing = attendanceSessions.find(s => s.userId === u.id && s.status === 'CLOCKED_IN');
    if (existing) {
      return response.badRequest(res, `${u.profile?.firstName} is already clocked in since ${new Date(existing.clockInAt).toLocaleTimeString()}`);
    }

    const newSess = {
      id: `sess-kiosk-${Date.now()}`,
      userId: u.id,
      workDate: new Date().toISOString().split('T')[0],
      clockInAt: new Date().toISOString(),
      clockOutAt: null,
      clockInMethod: 'ON_SITE',
      clockOutMethod: null,
      status: 'CLOCKED_IN',
      durationMinutes: 0,
      notes: `Kiosk terminal ${terminalCode || 'RECEPTION_MAIN'} scan`,
      createdAt: new Date(),
    };
    attendanceSessions.unshift(newSess);

    return response.success(res, {
      session: newSess,
      employee: {
        name: `${u.profile?.firstName} ${u.profile?.lastName}`,
        department: u.profile?.department?.name,
      },
    }, `Welcome to AM DEV Pro HQ, ${u.profile?.firstName}! On-site attendance confirmed.`);
  } catch (err) {
    next(err);
  }
};

const getDeliveries = async (req, res, next) => {
  try {
    return response.success(res, deliveries);
  } catch (err) {
    next(err);
  }
};

const logDelivery = async (req, res, next) => {
  try {
    const { carrier, trackingNumber, recipientEmail, packageType } = req.body;
    const recipient = users.find(u => u.email.toLowerCase() === (recipientEmail || '').toLowerCase());

    const newDelivery = {
      id: `del-${Date.now()}`,
      carrier: carrier || 'Courier Direct',
      trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-8)}`,
      recipientEmail: recipientEmail,
      recipientName: recipient ? `${recipient.profile?.firstName} ${recipient.profile?.lastName}` : recipientEmail,
      packageType: packageType || 'Parcel / Document',
      arrivedAt: new Date().toISOString(),
      collectedAt: null,
      status: 'READY_FOR_PICKUP',
      receivedBy: req.user.profile?.displayName || req.user.email,
    };
    deliveries.unshift(newDelivery);
    return response.success(res, newDelivery, 'Delivery logged and recipient notified');
  } catch (err) {
    next(err);
  }
};

const collectDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const del = deliveries.find(d => d.id === id);
    if (!del) return response.notFound(res, 'Delivery record not found');

    del.status = 'COLLECTED';
    del.collectedAt = new Date().toISOString();
    return response.success(res, del, 'Package marked collected');
  } catch (err) {
    next(err);
  }
};

const getEvacuationMusterList = async (req, res, next) => {
  try {
    const onSiteEmployees = attendanceSessions
      .filter(s => s.status === 'CLOCKED_IN' && s.clockInMethod === 'ON_SITE')
      .map(s => {
        const u = users.find(x => x.id === s.userId);
        return {
          type: 'STAFF',
          name: u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'Employee',
          identifier: u?.profile?.employeeId || u?.email,
          department: u?.profile?.department?.name || 'General',
          location: 'HQ Primary Facility',
          admittedAt: s.clockInAt,
        };
      });

    const activeGuests = visitors
      .filter(v => v.status === 'ACTIVE_IN_BUILDING')
      .map(v => ({
        type: 'VISITOR',
        name: v.fullName,
        identifier: `Badge ${v.badgeNumber} (${v.company})`,
        department: `Host: ${v.hostEmployee}`,
        location: 'HQ Visitor Floor',
        admittedAt: v.checkInTime,
      }));

    const muster = [...onSiteEmployees, ...activeGuests];

    return response.success(res, {
      totalOccupants: muster.length,
      staffCount: onSiteEmployees.length,
      visitorCount: activeGuests.length,
      generatedAt: new Date().toISOString(),
      musterList: muster,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getVisitors,
  checkInVisitor,
  checkOutVisitor,
  getOnSiteEmployees,
  kioskClockIn,
  getDeliveries,
  logDelivery,
  collectDelivery,
  getEvacuationMusterList,
};
