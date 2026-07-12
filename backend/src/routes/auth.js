'use strict';

const express      = require('express');
const router       = express.Router();

const { loginLimiter, signupLimiter }              = require('../middleware/rateLimiter');
const { verifyJWT }                                = require('../middleware/auth');
const { validate, loginSchema, signupSchema }      = require('../middleware/validate');
const { loginUser, signupUser, activateTrial }     = require('../services/authService');
const { logAction }                                = require('../services/auditService');

/**
 * POST /auth/login
 *
 * Layers of protection:
 * 1. express-rate-limit: max 10 req/15min per IP
 * 2. Zod validation: rejects malformed input
 * 3. DB-level: check_login_rate_limit (5 failures → 15min block per email/IP)
 * 4. Supabase auth: actual credential verification
 * 5. audit_logs: records every attempt
 */
router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const ip     = req.ip;
    const result = await loginUser({ ...req.body, ip });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/signup
 *
 * Protected by:
 * 1. signupLimiter: max 5/hour per IP
 * 2. Zod validation
 * 3. Supabase admin.createUser (server-side, no client exposure)
 *
 * Trial is NOT activated here — it's a separate call so the backend
 * can apply additional anti-abuse checks before activating.
 */
router.post('/signup', signupLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const result = await signupUser(req.body);

    await logAction({
      userId: result.user.id,
      action: 'SIGNUP',
      ip:     req.ip,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/activate-trial
 *
 * Called after signup to activate the 1-hour trial.
 * Requires valid JWT (user must be logged in).
 *
 * The DB function is atomic — calling it twice returns 'trial_already_used'.
 */
router.post('/activate-trial', verifyJWT, async (req, res, next) => {
  try {
    const result = await activateTrial(req.user.id);

    await logAction({
      userId:    req.user.id,
      action:    'TRIAL_ACTIVATED',
      details:   result,
      ip:        req.ip,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/me
 *
 * Returns the current user's role.
 * Frontend can use this to know if the user is admin.
 */
router.get('/me', verifyJWT, async (req, res, next) => {
  try {
    const supabaseAdmin = require('../utils/supabaseAdmin');
    const { data } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', req.user.id);

    res.json({
      id:    req.user.id,
      email: req.user.email,
      roles: (data || []).map(r => r.role),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
