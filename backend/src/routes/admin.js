'use strict';

const express = require('express');
const router  = express.Router();

const { verifyJWT }                      = require('../middleware/auth');
const { adminOnly }                      = require('../middleware/adminOnly');
const { validate, validateParams,
        updateTariffSchema,
        userIdParamSchema }              = require('../middleware/validate');
const { z }                              = require('zod');
const { listUsers, getUser, deleteUser,
        updateUserTariff, setAdminRole,
        searchUsers }                    = require('../services/adminService');
const { adminResetPassword }             = require('../services/authService');
const { logAction }                      = require('../services/auditService');

// All admin routes require: valid JWT + admin role
router.use(verifyJWT, adminOnly);

/**
 * GET /admin/users
 * List all users with pagination
 */
router.get('/users', async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page || '50', 10)));
    const result  = await listUsers({ page, perPage });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/users/search?q=...
 */
router.get('/users/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [] });
    const result = await searchUsers(q);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/users/:id
 */
router.get('/users/:id', validateParams(userIdParamSchema), async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /admin/users/:id
 */
router.delete('/users/:id', validateParams(userIdParamSchema), async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await deleteUser(req.params.id);

    await logAction({
      userId:  req.user.id,
      action:  'ADMIN_DELETE_USER',
      details: { deleted_user_id: req.params.id },
      ip:      req.ip,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /admin/users/:id/tariff
 * Update a user's subscription tariff
 */
router.put(
  '/users/:id/tariff',
  validateParams(userIdParamSchema),
  validate(updateTariffSchema),
  async (req, res, next) => {
    try {
      const result = await updateUserTariff(req.params.id, req.body);

      await logAction({
        userId:  req.user.id,
        action:  'ADMIN_UPDATE_TARIFF',
        details: { target_user_id: req.params.id, ...req.body },
        ip:      req.ip,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /admin/users/:id/reset-password
 */
router.post(
  '/users/:id/reset-password',
  validateParams(userIdParamSchema),
  validate(z.object({ new_password: z.string().min(8).max(128) })),
  async (req, res, next) => {
    try {
      const result = await adminResetPassword(req.params.id, req.body.new_password);

      await logAction({
        userId:  req.user.id,
        action:  'ADMIN_RESET_PASSWORD',
        details: { target_user_id: req.params.id },
        ip:      req.ip,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /admin/users/:id/role
 * Grant or revoke admin role
 */
router.put(
  '/users/:id/role',
  validateParams(userIdParamSchema),
  validate(z.object({ is_admin: z.boolean() })),
  async (req, res, next) => {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot modify your own role' });
      }

      const result = await setAdminRole(req.params.id, req.body.is_admin);

      await logAction({
        userId:  req.user.id,
        action:  req.body.is_admin ? 'ADMIN_GRANT_ADMIN_ROLE' : 'ADMIN_REVOKE_ADMIN_ROLE',
        details: { target_user_id: req.params.id },
        ip:      req.ip,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /admin/audit-logs
 */
router.get('/audit-logs', async (req, res, next) => {
  try {
    const supabaseAdmin = require('../utils/supabaseAdmin');
    const page    = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.min(100, parseInt(req.query.per_page || '50', 10));
    const from    = (page - 1) * perPage;

    const { data, error, count } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + perPage - 1);

    if (error) throw new Error('Failed to fetch audit logs');
    res.json({ logs: data, total: count, page, perPage });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/intrusion-events
 */
router.get('/intrusion-events', async (req, res, next) => {
  try {
    const supabaseAdmin = require('../utils/supabaseAdmin');
    const { data, error } = await supabaseAdmin
      .from('intrusion_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error('Failed to fetch intrusion events');
    res.json({ events: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
