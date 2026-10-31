import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
} from './user.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  adminUserQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
} from './user.validation.js';

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get('/me', getProfile);
userRoutes.patch('/me', validate(updateProfileSchema), updateProfile);
userRoutes.patch('/me/password', validate(changePasswordSchema), changePassword);

export const adminUserRoutes = Router();

adminUserRoutes.use(authenticate);
adminUserRoutes.use(authorize('admin'));
adminUserRoutes.get('/', validate(adminUserQuerySchema), getAdminUsers);
adminUserRoutes.get('/:id', validate(userIdParamSchema), getAdminUserById);
adminUserRoutes.patch('/:id/status', validate(updateUserStatusSchema), updateAdminUserStatus);

export default {
  userRoutes,
  adminUserRoutes,
};
