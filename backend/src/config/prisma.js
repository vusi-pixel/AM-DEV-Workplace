'use strict';
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');
const { mockPrisma } = require('./mockStore');

let realPrisma = null;
let useMock = false;

try {
  realPrisma = new PrismaClient({
    log: [{ level: 'error', emit: 'stdout' }],
  });
} catch (err) {
  logger.warn('PrismaClient init failed, falling back to mock store', { error: err.message });
  useMock = true;
}

// Transparent Proxy: delegates to realPrisma if online, or mockPrisma if offline/unreachable
const prismaProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === '_setUseMock') {
      return (val) => { useMock = val; };
    }
    if (prop === '_isMock') {
      return () => useMock;
    }
    if (useMock || !realPrisma) {
      return mockPrisma[prop];
    }
    const realProp = realPrisma[prop];
    if (typeof realProp === 'function') {
      return async (...args) => {
        try {
          return await realProp.apply(realPrisma, args);
        } catch (err) {
          if (err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('Can\'t reach database server') || err.code === 'P1001')) {
            useMock = true;
            logger.warn(`PostgreSQL unreachable, switching to development in-memory store for: ${String(prop)}`);
            const mockProp = mockPrisma[prop];
            return typeof mockProp === 'function' ? mockProp.apply(mockPrisma, args) : mockProp;
          }
          throw err;
        }
      };
    }
    return realProp || mockPrisma[prop];
  },
});

module.exports = prismaProxy;
