'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const config       = require('./config');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes   = require('./routes/auth');
const adminRoutes  = require('./routes/admin');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — only allow the configured frontend origin(s) ──────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Telegram bot, CLI, etc.)
    if (!origin) return callback(null, true);
    if (config.cors.origins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));  // Limit body size

// ── Trust proxy (needed for correct req.ip behind Cloudflare/Nginx) ──────
app.set('trust proxy', 1);

// ── Global rate limit ─────────────────────────────────────────────────────
app.use(apiLimiter);

// ── Health check (no auth) ────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/auth',  authRoutes);
app.use('/admin', adminRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[backend] Running on port ${config.port} (${config.nodeEnv})`);
});

module.exports = app;
