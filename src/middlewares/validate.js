import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const formattedErrors = [];

    const extractIssues = (zodError, prefix) => {
      const issues = zodError.issues || zodError.errors || [];
      issues.forEach((err) => {
        formattedErrors.push({
          field: prefix ? `${prefix}.${err.path.join('.')}` : err.path.join('.'),
          message: err.message,
        });
      });
    };

    if (schema.body) {
      const parsed = schema.body.safeParse(req.body);
      if (!parsed.success) {
        extractIssues(parsed.error, 'body');
      } else {
        req.body = parsed.data;
      }
    }

    if (schema.query) {
      const parsed = schema.query.safeParse(req.query);
      if (!parsed.success) {
        extractIssues(parsed.error, 'query');
      } else {
        req.query = parsed.data;
      }
    }

    if (schema.params) {
      const parsed = schema.params.safeParse(req.params);
      if (!parsed.success) {
        extractIssues(parsed.error, 'params');
      } else {
        req.params = parsed.data;
      }
    }

    if (!schema.body && !schema.query && !schema.params && typeof schema.safeParse === 'function') {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        extractIssues(parsed.error, '');
      } else {
        req.body = parsed.data;
      }
    }

    if (formattedErrors.length > 0) {
      return next(ApiError.badRequest('Validation error', formattedErrors));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

export default validate;
