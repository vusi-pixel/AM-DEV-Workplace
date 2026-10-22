'use strict';

const hasPermission = (user, key) => {
  if (!user) return false;
  const roles = user.roles || [];
  if (roles.includes('System Administrator')) return true;
  return (user.permissions || []).includes(key);
};

const hasAnyPermission = (user, keys) => keys.some((k) => hasPermission(user, k));

const isMockPrisma = (prisma) => typeof prisma._isMock === 'function' && prisma._isMock();

const displayName = (user) => {
  const p = user?.profile;
  if (p?.displayName) return p.displayName;
  if (p?.firstName || p?.lastName) return `${p.firstName || ''} ${p.lastName || ''}`.trim();
  return user?.email || 'Colleague';
};

const departmentName = (user) => user?.profile?.department?.name || user?.profile?.department?.code || 'General';

module.exports = { hasPermission, hasAnyPermission, isMockPrisma, displayName, departmentName };
