export class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict detected', errors = []) {
    return new ApiError(409, message, errors);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, [], false);
  }
}

export const createBadRequestError = (message, errors = []) => ApiError.badRequest(message, errors);
export const createUnauthorizedError = (message) => ApiError.unauthorized(message);
export const createForbiddenError = (message) => ApiError.forbidden(message);
export const createNotFoundError = (message) => ApiError.notFound(message);
export const createConflictError = (message, errors = []) => ApiError.conflict(message, errors);
export const createInternalError = (message) => ApiError.internal(message);

export default ApiError;
