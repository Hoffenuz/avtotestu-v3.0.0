'use strict';
require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),

  supabase: {
    url:            required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret:      required('SUPABASE_JWT_SECRET'),
  },

  cors: {
    // Comma-separated list of allowed origins
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),
  },

  rateLimit: {
    // Login: max 10 requests per 15 min per IP
    loginWindowMs:  15 * 60 * 1000,
    loginMaxPerIp:  10,
    // Login block: 5 failures per 15 min per email/IP (DB-level)
    loginMaxFails:  5,
    loginWindowMin: 15,
    // Signup: max 5 per hour per IP
    signupWindowMs: 60 * 60 * 1000,
    signupMax:      5,
    // General API: 100 per 15 min
    apiWindowMs:    15 * 60 * 1000,
    apiMax:         100,
  },

  nodeEnv: process.env.NODE_ENV || 'development',
};
