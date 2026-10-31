import { z } from 'zod';
import mongoose from 'mongoose';
import { passwordSchema } from '../../utils/password.js';

export const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

export const updateProfileSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name cannot exceed 100 characters'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
};

export const adminUserQuerySchema = {
  query: z.object({
    page: z.coerce
      .number({ invalid_type_error: 'Page must be a number' })
      .int('Page must be an integer')
      .positive('Page must be a positive integer')
      .optional()
      .default(1),
    limit: z.coerce
      .number({ invalid_type_error: 'Limit must be a number' })
      .int('Limit must be an integer')
      .positive('Limit must be a positive integer')
      .max(100, 'Limit cannot exceed 100 items per page')
      .optional()
      .default(10),
    role: z.enum(['admin', 'customer']).optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
  }),
};

export const userIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

export const updateUserStatusSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive boolean flag is required' }),
  }),
};

export default {
  objectIdSchema,
  updateProfileSchema,
  changePasswordSchema,
  adminUserQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
};
