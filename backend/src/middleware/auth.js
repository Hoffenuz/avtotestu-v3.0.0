'use strict';

/**
 * verifyJWT — verifies the Supabase JWT from Authorization header.
 * Sets req.user = { id, email, role } on success.
 *
 * The JWT is signed by Supabase using SUPABASE_JWT_SECRET.
 * We verify it locally — no round-trip to Supabase needed.
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthError } = require('../utils/errors');

function verifyJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AuthError('Missing Authorization header'));
    }

    const token = authHeader.slice(7).trim();
    if (!token) return next(new AuthError('Empty token'));

    const decoded = jwt.verify(token, config.supabase.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'supabase',
    });

    // decoded.sub is the user UUID
    req.user = {
      id:    decoded.sub,
      email: decoded.email || null,
      role:  decoded.role  || 'authenticated',
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthError('Token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AuthError('Invalid token'));
    }
    next(new AuthError('Authentication failed'));
  }
}

module.exports = { verifyJWT };
