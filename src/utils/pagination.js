import { z } from 'zod';

export const paginationQuerySchema = z.object({
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
});

export function getPaginationParams(query = {}, defaultLimit = 10, maxLimit = 100) {
  const parsedPage = parseInt(query.page, 10);
  const parsedLimit = parseInt(query.limit, 10);

  const page = !Number.isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let limit = !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function formatPaginationResponse(items, totalItems, page, limit) {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    items,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export default {
  paginationQuerySchema,
  getPaginationParams,
  formatPaginationResponse,
};
