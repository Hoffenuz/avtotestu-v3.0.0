'use strict';

const supabaseAdmin                                = require('../utils/supabaseAdmin');
const { logLoginAttempt, clearLoginAttempts }      = require('./auditService');
const { RateLimitError, AppError, ValidationError } = require('../utils/errors');
const config                                       = require('../config');

/**
 * Login flow:
 * 1. Check DB-level brute-force limit (email + IP)
 * 2. Attempt Supabase auth
 * 3. Record attempt result
 * 4. Return session or error
 */
async function loginUser({ email, password, ip }) {
  // Step 1: Check DB-level rate limit
  const { data: limitCheck, error: limitErr } = await supabaseAdmin.rpc('check_login_rate_limit', {
    p_email:     email,
    p_ip:        ip || null,
    p_window:    `${config.rateLimit.loginWindowMin} minutes`,
    p_max_fails: config.rateLimit.loginMaxFails,
  });

  if (limitErr) {
    console.error('[authService] rate limit check error:', limitErr.message);
    // Fail closed on DB error — block login to prevent brute-force bypass
    throw new AppError('Login service temporarily unavailable. Please try again later.', 503);
  } else if (limitCheck && !limitCheck.allowed) {
    const blockUntil = limitCheck.block_until ? new Date(limitCheck.block_until) : null;
    const retryAfterSec = blockUntil ? Math.max(0, Math.ceil((blockUntil - Date.now()) / 1000)) : 900;
    throw new RateLimitError(
      `Too many failed login attempts. Try again after ${blockUntil ? blockUntil.toISOString() : '15 minutes'}.`,
      retryAfterSec
    );
  }

  // Step 2: Attempt Supabase auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  // Step 3: Record attempt
  const success = !authError;
  await logLoginAttempt({ email, ip, success });

  if (authError) {
    // Normalize auth errors — never expose internal Supabase messages
    if (authError.message?.toLowerCase().includes('invalid login credentials') ||
        authError.message?.toLowerCase().includes('email not confirmed')) {
      throw new AppError('Invalid email or password', 401);
    }
    throw new AppError('Login failed. Please try again.', 401);
  }

  // Step 4: Clear failed attempts on success
  await clearLoginAttempts(email);

  return {
    access_token:  authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    expires_at:    authData.session.expires_at,
    user: {
      id:    authData.user.id,
      email: authData.user.email,
    },
  };
}

/**
 * Signup flow:
 * 1. Validate input (done in middleware)
 * 2. Create Supabase user
 * 3. Return user (trial activation is separate endpoint)
 */
async function signupUser({ email, password, username, full_name }) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // require email confirmation
    user_metadata: {
      username:  username  || null,
      full_name: full_name || null,
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already exists')) {
      throw new ValidationError('An account with this email already exists');
    }
    throw new AppError('Signup failed. Please try again.', 400);
  }

  return {
    user: {
      id:    data.user.id,
      email: data.user.email,
    },
  };
}

/**
 * Activate trial for a user — called after signup, once per user.
 * Calls the DB-level activate_trial_for_user function which is atomic.
 */
async function activateTrial(userId) {
  const { data, error } = await supabaseAdmin.rpc('activate_trial_for_user', {
    p_user_id: userId,
  });

  if (error) throw new AppError('Trial activation failed', 500);
  if (!data.ok) {
    throw new AppError(data.error === 'trial_already_used'
      ? 'Trial already used for this account'
      : 'Trial activation failed', 400);
  }

  return { trial_end_date: data.trial_end_date };
}

/**
 * Reset password for a user — admin-only, returns a magic link or OTP.
 */
async function adminResetPassword(userId, newPassword) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) throw new AppError('Password reset failed', 500);
  return { updated: true };
}

module.exports = { loginUser, signupUser, activateTrial, adminResetPassword };
