'use strict';
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  session: {
    secret: process.env.SESSION_SECRET || 'dev_only_secret_CHANGE_IN_PROD',
    maxAgeMs: parseInt(process.env.SESSION_MAX_AGE_MS || '28800000', 10),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  },

  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  },

  timezone: process.env.TZ || 'UTC',
};

if (!config.database.url) {
  throw new Error('DATABASE_URL environment variable is required');
}

module.exports = config;
