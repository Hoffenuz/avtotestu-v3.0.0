'use strict';

const { z }               = require('zod');
const { ValidationError } = require('../utils/errors');

/**
 * validate(schema) — middleware factory for Zod input validation.
 * Validates req.body against the schema.
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        return next(new ValidationError(message));
      }
      next(err);
    }
  };
}

/**
 * validateParams(schema) — same but for req.params
 */
function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new ValidationError('Invalid URL parameters'));
      }
      next(err);
    }
  };
}

// ── Shared schemas ──────────────────────────────────────────────────────────

const emailSchema    = z.string().email().max(254).trim().toLowerCase();
const passwordSchema = z.string().min(8).max(128);
const uuidSchema     = z.string().uuid();

const loginSchema = z.object({
  email:    emailSchema,
  password: passwordSchema,
});

const signupSchema = z.object({
  email:     emailSchema,
  password:  passwordSchema,
  username:  z.string().min(2).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and - allowed').optional(),
  full_name: z.string().min(1).max(100).trim().optional(),
});

const updateTariffSchema = z.object({
  tariff_days:       z.number().int().min(1).max(3650),
  tariff_start_date: z.string().datetime().optional(),
});

const userIdParamSchema = z.object({
  id: uuidSchema,
});

module.exports = {
  validate,
  validateParams,
  loginSchema,
  signupSchema,
  updateTariffSchema,
  userIdParamSchema,
};
