'use strict';

const supabaseAdmin = require('../utils/supabaseAdmin');

/**
 * Audit service — logs security-relevant actions to audit_logs.
 * Called from backend routes/services, not from the DB triggers.
 * Both layers exist: DB triggers catch direct DB changes,
 * this service catches HTTP-level actions.
 */
async function logAction({ userId, action, tableName = null, details = null, ip = null }) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id:    userId   || null,
      action,
      table_name: tableName,
      new_data:   details  ? JSON.parse(JSON.stringify(details)) : null,
      ip_address: ip       || null,
    });
  } catch (err) {
    // Audit failure must never break the main operation
    console.error('[audit] Failed to write log:', err.message);
  }
}

/**
 * Log a failed login attempt — also writes to login_attempts table
 */
async function logLoginAttempt({ email, ip, success }) {
  try {
    await supabaseAdmin.rpc('record_login_attempt', {
      p_email:   email,
      p_ip:      ip   || null,
      p_success: success,
    });
  } catch (err) {
    console.error('[audit] Failed to record login attempt:', err.message);
  }
}

async function clearLoginAttempts(email) {
  try {
    await supabaseAdmin.rpc('clear_login_attempts', { p_email: email });
  } catch (err) {
    console.error('[audit] Failed to clear login attempts:', err.message);
  }
}

module.exports = { logAction, logLoginAttempt, clearLoginAttempts };
