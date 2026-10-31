import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdNullableSchema = z
  .union([
    z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid parent ObjectId format',
    }),
    z.null(),
  ])
  .optional();

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid Category ID format',
});

export const createCategorySchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Category name is required' })
      .trim()
      .min(2, 'Category name must be at least 2 characters long')
      .max(100, 'Category name cannot exceed 100 characters'),
    parent: objectIdNullableSchema.default(null),
    isActive: z.boolean().optional().default(true),
  }),
};

export const updateCategorySchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Category name must be at least 2 characters long')
        .max(100, 'Category name cannot exceed 100 characters')
        .optional(),
      slug: z.string().trim().toLowerCase().optional(),
      parent: objectIdNullableSchema,
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
};

export const categoryParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

export const listCategoriesQuerySchema = {
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
    parent: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val === 'null' || val === 'root') return null;
        return val;
      }),
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
  }),
};

export default {
  createCategorySchema,
  updateCategorySchema,
  categoryParamSchema,
  listCategoriesQuerySchema,
};
