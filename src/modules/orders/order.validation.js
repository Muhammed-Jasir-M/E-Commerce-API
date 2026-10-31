import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

export const createOrderSchema = {
  body: z.object({
    items: z
      .array(
        z.object({
          product: objectIdSchema,
          quantity: z.number().int().positive('Quantity must be at least 1'),
        })
      )
      .min(1, 'Order must contain at least one item'),
    shippingAddress: z.object({
      street: z.string().trim().min(2, 'Street address is required'),
      city: z.string().trim().min(2, 'City is required'),
      state: z.string().trim().min(2, 'State/Province is required'),
      postalCode: z.string().trim().min(2, 'Postal code is required'),
      country: z.string().trim().min(2, 'Country is required'),
    }),
  }),
};

export const updateOrderStatusSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'], {
      required_error: 'Order status is required',
    }),
  }),
};

export const orderParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

export const listOrdersQuerySchema = {
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
    status: z.enum(['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    userId: objectIdSchema.optional(),
  }),
};

export default {
  createOrderSchema,
  updateOrderStatusSchema,
  orderParamSchema,
  listOrdersQuerySchema,
};
