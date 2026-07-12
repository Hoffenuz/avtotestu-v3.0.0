'use strict';

/**
 * adminOnly — middleware that verifies the caller has the 'admin' app_role.
 * Must be used AFTER verifyJWT.
 *
 * Calls the DB (service_role) to check the role.
 * Never trusts the JWT payload for role — JWT only contains Supabase's built-in role,
 * not our application-level app_role.
 */
const supabaseAdmin = require('../utils/supabaseAdmin');
const { ForbiddenError } = require('../utils/errors');

// Simple in-process cache: { userId → { isAdmin, expiresAt } }
const roleCache = new Map();
const CACHE_TTL_MS = 60_000; // 1 minute

async function adminOnly(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new ForbiddenError());

    // Check cache
    const cached = roleCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      if (!cached.isAdmin) return next(new ForbiddenError('Admin access required'));
      return next();
    }

    // Query DB
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('[adminOnly] DB error:', error.message);
      return next(new ForbiddenError());
    }

    const isAdmin = !!data;

    // Cache result
    roleCache.set(userId, { isAdmin, expiresAt: Date.now() + CACHE_TTL_MS });

    if (!isAdmin) return next(new ForbiddenError('Admin access required'));
    next();
  } catch (err) {
    next(err);
  }
}

// Call this when an admin's role changes to invalidate their cache entry
function invalidateRoleCache(userId) {
  roleCache.delete(userId);
}

module.exports = { adminOnly, invalidateRoleCache };
