'use strict';

const rateLimit = require('express-rate-limit');
const config    = require('../config');

/**
 * IP-based rate limiters using express-rate-limit (in-memory).
 * For multi-server deployments, replace the default store with Redis store.
 *
 * These are the first line of defense.
 * The second line is the DB-level login_attempts table (see authService).
 */

// General API limiter
const apiLimiter = rateLimit({
  windowMs:         config.rateLimit.apiWindowMs,
  max:              config.rateLimit.apiMax,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests. Please try again later.' },
  skip: (req) => req.method === 'OPTIONS',
});

// Login limiter — tighter than general
const loginLimiter = rateLimit({
  windowMs:         config.rateLimit.loginWindowMs,
  max:              config.rateLimit.loginMaxPerIp,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many login attempts from this IP. Try again in 15 minutes.' },
  keyGenerator:     (req) => req.ip,
});

// Signup limiter
const signupLimiter = rateLimit({
  windowMs:         config.rateLimit.signupWindowMs,
  max:              config.rateLimit.signupMax,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many signup attempts. Try again later.' },
});

module.exports = { apiLimiter, loginLimiter, signupLimiter };
