import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid Category ObjectId format',
});

export const createProductSchema = {
  body: z
    .object({
      name: z
        .string({ required_error: 'Product name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters long')
        .max(200, 'Name cannot exceed 200 characters'),
      sku: z
        .string({ required_error: 'Product SKU is required' })
        .trim()
        .min(2, 'SKU must be at least 2 characters long')
        .max(50, 'SKU cannot exceed 50 characters')
        .toUpperCase(),
      description: z.string().trim().max(5000).optional().default(''),
      price: z
        .number({ required_error: 'Price is required' })
        .nonnegative('Price must be greater than or equal to 0'),
      salePrice: z
        .number()
        .nonnegative('Sale price must be non-negative')
        .nullable()
        .optional()
        .default(null),
      stock: z
        .number({ required_error: 'Stock is required' })
        .int('Stock must be an integer')
        .nonnegative('Stock cannot be negative'),
      category: objectIdSchema,
      status: z.enum(['draft', 'active', 'archived']).optional().default('active'),
    })
    .refine(
      (data) => {
        if (data.salePrice != null && data.price != null) {
          return data.salePrice <= data.price;
        }
        return true;
      },
      {
        message: 'Sale price must not exceed regular price',
        path: ['salePrice'],
      }
    ),
};

export const updateProductSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(200).optional(),
      sku: z.string().trim().min(2).max(50).toUpperCase().optional(),
      description: z.string().trim().max(5000).optional(),
      price: z.number().nonnegative().optional(),
      salePrice: z.number().nonnegative().nullable().optional(),
      stock: z.number().int().nonnegative().optional(),
      category: objectIdSchema.optional(),
      status: z.enum(['draft', 'active', 'archived']).optional(),
    })
    .refine(
      (data) => {
        if (data.salePrice != null && data.price != null) {
          return data.salePrice <= data.price;
        }
        return true;
      },
      {
        message: 'Sale price must not exceed regular price',
        path: ['salePrice'],
      }
    )
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update',
    }),
};

export const productParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

export const listProductsQuerySchema = {
  query: z
    .object({
      search: z.string().trim().optional(),
      category: z.string().trim().optional(),
      minPrice: z.coerce.number().nonnegative('minPrice must be greater than or equal to 0').optional(),
      maxPrice: z.coerce.number().nonnegative('maxPrice must be greater than or equal to 0').optional(),
      sortBy: z.enum(['price', 'name', 'createdAt', 'stock']).optional().default('createdAt'),
      order: z.enum(['asc', 'desc']).optional().default('desc'),
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
      status: z.enum(['draft', 'active', 'archived']).optional(),
    })
    .refine(
      (data) => {
        if (data.minPrice != null && data.maxPrice != null) {
          return data.minPrice <= data.maxPrice;
        }
        return true;
      },
      {
        message: 'minPrice cannot be greater than maxPrice',
        path: ['minPrice'],
      }
    ),
};

export default {
  createProductSchema,
  updateProductSchema,
  productParamSchema,
  listProductsQuerySchema,
};
