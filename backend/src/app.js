'use strict';
const express = require('express');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');

const config = require('./config');
const logger = require('./config/logger');
const { hydrateSession } = require('./middleware/sessionHydration');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const employeeRoutes = require('./routes/employee.routes');
const workModeRoutes = require('./routes/workMode.routes');
const hrRoutes = require('./routes/hr.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development ports (5173, 5174, 3000, 3001)
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, config.cors.origin);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  })
);

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(morgan(config.isDev ? 'dev' : 'combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─── Session store (PostgreSQL-backed with in-memory fallback) ────────────────
const PgSession = connectPgSimple(session);
const pgPool = new Pool({
  connectionString: config.database.url,
  connectionTimeoutMillis: 1500,
});

pgPool.on('error', (err) => {
  logger.warn('PG Pool background event: ' + err.message);
});

const memoryStore = new session.MemoryStore();
let pgStore = null;

try {
  pgStore = new PgSession({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true,
    errorLog: (err) => logger.warn('PgSession: ' + err.message),
  });
} catch (e) {
  logger.warn('PgSession init deferred: ' + e.message);
}

// Resilient Store Proxy: falls back to memoryStore if pgStore fails
class ResilientStore extends session.Store {
  constructor() {
    super();
    this.useMemory = false;
  }

  get(sid, fn) {
    if (this.useMemory || !pgStore) {
      return memoryStore.get(sid, fn);
    }
    pgStore.get(sid, (err, sess) => {
      if (err) {
        this.useMemory = true;
        logger.warn('Falling back to memory session store');
        return memoryStore.get(sid, fn);
      }
      return fn(null, sess);
    });
  }

  set(sid, sess, fn) {
    if (this.useMemory || !pgStore) {
      return memoryStore.set(sid, sess, fn);
    }
    pgStore.set(sid, sess, (err) => {
      if (err) {
        this.useMemory = true;
        logger.warn('Falling back to memory session store');
        return memoryStore.set(sid, sess, fn);
      }
      return fn && fn(null);
    });
  }

  destroy(sid, fn) {
    if (this.useMemory || !pgStore) {
      return memoryStore.destroy(sid, fn);
    }
    pgStore.destroy(sid, (err) => {
      if (err) {
        return memoryStore.destroy(sid, fn);
      }
      return fn && fn(null);
    });
  }

  touch(sid, sess, fn) {
    if (this.useMemory || !pgStore) {
      return memoryStore.touch(sid, sess, fn);
    }
    if (typeof pgStore.touch === 'function') {
      pgStore.touch(sid, sess, (err) => {
        if (err) return memoryStore.touch(sid, sess, fn);
        return fn && fn(null);
      });
    } else {
      fn && fn(null);
    }
  }
}

app.use(
  session({
    store: new ResilientStore(),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.session.cookieSecure,
      sameSite: config.session.cookieSameSite,
      maxAge: config.session.maxAgeMs,
    },
    name: 'amdev.sid',
  })
);

// ─── Session hydration (builds req.user from DB) ──────────────────────────────
app.use(hydrateSession);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AM DEV Pro Workplace API',
    persistence: 'Active',
  });
});

const financeRoutes = require('./routes/finance.routes');
const frontdeskRoutes = require('./routes/frontdesk.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// ─── API v1 routes ────────────────────────────────────────────────────────────
const apiV1 = express.Router();

apiV1.use('/auth', authRoutes);
apiV1.use('/attendance', attendanceRoutes);
apiV1.use('/employees', employeeRoutes);
apiV1.use('/work-mode-requests', workModeRoutes);
apiV1.use('/hr', hrRoutes);
apiV1.use('/finance', financeRoutes);
apiV1.use('/frontdesk', frontdeskRoutes);
apiV1.use('/admin', adminRoutes);
apiV1.use('/notifications', notificationRoutes);
apiV1.use('/dashboard', dashboardRoutes);

app.use('/api/v1', apiV1);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app, pgPool };
