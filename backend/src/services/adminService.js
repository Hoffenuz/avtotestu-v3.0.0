'use strict';

const supabaseAdmin                   = require('../utils/supabaseAdmin');
const { AppError, NotFoundError }     = require('../utils/errors');
const { invalidateRoleCache }         = require('../middleware/adminOnly');

/**
 * List all users with their profiles and subscription info.
 * Paginated — max 100 per page.
 */
async function listUsers({ page = 1, perPage = 50 } = {}) {
  const from = (page - 1) * perPage;
  const to   = from + perPage - 1;

  const { data, error, count } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, username, tariff_days, tariff_end_date, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new AppError('Failed to list users', 500);
  return { users: data, total: count, page, perPage };
}

/**
 * Get a single user's full profile.
 */
async function getUser(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*, user_roles(role)')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new AppError('Failed to fetch user', 500);
  if (!data) throw new NotFoundError('User not found');
  return data;
}

/**
 * Delete a user — cascades to all their data.
 * Supabase auth.admin.deleteUser also removes from auth.users,
 * which cascades to profiles (ON DELETE CASCADE).
 */
async function deleteUser(userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    if (error.message?.includes('not found')) throw new NotFoundError('User not found');
    throw new AppError('Failed to delete user', 500);
  }
  invalidateRoleCache(userId);
  return { deleted: true };
}

/**
 * Update a user's tariff (subscription).
 * Writes to subscriptions table; profiles.tariff_days and tariff_end_date
 * are synced via the sync_profile_subscription DB trigger.
 */
async function updateUserTariff(userId, { tariff_days, tariff_start_date }) {
  const start = tariff_start_date ? new Date(tariff_start_date) : new Date();
  const end   = new Date(start.getTime() + tariff_days * 86_400_000);

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id:    userId,
      tariff_days,
      started_at: start.toISOString(),
      ends_at:    end.toISOString(),
      is_trial:   false,
    });

  if (error) throw new AppError('Failed to update tariff', 500);
  return { updated: true, tariff_end_date: end.toISOString() };
}

/**
 * Grant or revoke admin role for a user.
 */
async function setAdminRole(userId, isAdmin) {
  if (isAdmin) {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
    if (error) throw new AppError('Failed to grant admin role', 500);
  } else {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');
    if (error) throw new AppError('Failed to revoke admin role', 500);
  }
  invalidateRoleCache(userId);
  return { updated: true };
}

/**
 * Search users by email or name.
 */
async function searchUsers(query) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, username, tariff_days, tariff_end_date')
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(20);

  if (error) throw new AppError('Search failed', 500);
  return { users: data };
}

module.exports = { listUsers, getUser, deleteUser, updateUserTariff, setAdminRole, searchUsers };
