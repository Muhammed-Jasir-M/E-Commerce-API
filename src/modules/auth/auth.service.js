import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import * as authRepo from './auth.repository.js';

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await authRepo.findByEmail(normalizedEmail);
  if (existingUser) {
    throw ApiError.conflict('Email is already registered');
  }

  const hashedPassword = await hashPassword(password);

  const user = await authRepo.createUser({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'customer',
    isActive: true,
  });

  return user.toJSON();
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await authRepo.findByEmail(normalizedEmail, true);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account is deactivated');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: 'HS256',
    }
  );

  return {
    token,
    user: user.toJSON(),
  };
}

export const authService = {
  register: registerUser,
  login: loginUser,
};

export default authService;
