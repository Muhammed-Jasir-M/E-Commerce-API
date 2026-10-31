import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid format for ${err.path}`);
  }

  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    error = ApiError.badRequest('Validation failed', errorDetails);
  }

  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const field = keys[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    error = ApiError.conflict(`Duplicate value '${val}' for unique field '${field}'`, [
      { field, message: `${field} must be unique` },
    ]);
  }

  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token');
  } else if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  }

  if (err.name === 'ZodError') {
    const rawIssues = err.issues || err.errors || [];
    const errorDetails = rawIssues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));
    error = ApiError.badRequest('Validation error', errorDetails);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const errors = error.errors || [];

  if (statusCode >= 500) {
    logger.error({ err, method: req.method, url: req.originalUrl }, 'Internal server error');
  } else {
    logger.warn({ statusCode, message, errors, url: req.originalUrl }, 'Client error');
  }

  const response = {
    success: false,
    message,
    errors,
  };

  if (env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
