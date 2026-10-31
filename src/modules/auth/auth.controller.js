import * as authService from './auth.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'Account registered successfully',
    data: { user },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.loginUser({ email, password });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user,
    },
  });
});

export const authController = {
  register,
  login,
};

export default authController;
