'use strict';

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

class AuthError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401); }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403); }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(message, 404); }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

module.exports = { AppError, ValidationError, AuthError, ForbiddenError, NotFoundError, RateLimitError };
