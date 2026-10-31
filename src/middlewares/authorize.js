import { ApiError } from '../utils/ApiError.js';

export const authorize = (...permittedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!permittedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Forbidden: insufficient permissions'));
    }

    return next();
  };
};

export default authorize;
