'use strict';
require('dotenv').config();
const { app, pgPool } = require('./src/app');
const config = require('./src/config');
const logger = require('./src/config/logger');
const prisma = require('./src/config/prisma');

const PORT = config.port;

const server = app.listen(PORT, async () => {
  try {
    // Attempt DB connection check
    await prisma.$queryRaw`SELECT 1`;
    logger.info(`✅ Database connected (PostgreSQL / Development In-Memory Engine)`);
    logger.info(`🚀 AM DEV Pro Workplace API running on http://localhost:${PORT}`);
    logger.info(`📋 Environment: ${config.nodeEnv}`);
  } catch (err) {
    logger.warn('PostgreSQL connection test bypassed, running in resilient mode:', err.message);
    if (typeof prisma._setUseMock === 'function') {
      prisma._setUseMock(true);
    }
    logger.info(`🚀 AM DEV Pro Workplace API running on http://localhost:${PORT}`);
  }
});

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
    try {
      await pgPool.end();
    } catch {}
    logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  logger.warn('Unhandled Rejection detected: ' + (reason?.message || reason));
});
