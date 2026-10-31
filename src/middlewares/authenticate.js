import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { findUserById } from '../modules/users/user.repository.js';
import { asyncHandler } from './asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw ApiError.unauthorized('Authentication token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired');
    }
    throw ApiError.unauthorized('Invalid token');
  }

  const userId = decoded.sub;
  if (!userId) {
    throw ApiError.unauthorized('Invalid token subject');
  }

  const user = await findUserById(userId);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('User account is deactivated');
  }

  req.user = user;
  next();
});

export default authenticate;
