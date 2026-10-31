import mongoose from 'mongoose';
import * as productRepo from './product.repository.js';
import * as categoryRepo from '../categories/category.repository.js';
import * as catService from '../categories/category.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatPaginationResponse } from '../../utils/pagination.js';
import Order from '../orders/order.model.js';

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export async function createProduct(payload) {
  const { name, sku, description, price, salePrice, stock, category, status } = payload;

  const categoryDoc = await categoryRepo.findCategoryById(category);
  if (!categoryDoc) throw ApiError.notFound('Category not found');
  if (!categoryDoc.isActive) throw ApiError.badRequest('Category is inactive');

  const normalizedSku = sku.toUpperCase().trim();
  const existing = await productRepo.findProductBySku(normalizedSku);
  if (existing) throw ApiError.conflict(`Product with SKU '${normalizedSku}' already exists`);

  const product = await productRepo.createProduct({
    name: name.trim(),
    sku: normalizedSku,
    description: description ? description.trim() : '',
    price: Math.round(price * 100) / 100,
    salePrice: salePrice != null ? Math.round(salePrice * 100) / 100 : null,
    stock,
    category: categoryDoc._id,
    status: status || 'active',
  });

  return productRepo.findProductById(product._id);
}

export async function updateProduct(id, payload) {
  const existing = await productRepo.findProductById(id);
  if (!existing) throw ApiError.notFound('Product not found');

  const updates = {};

  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.description !== undefined) updates.description = payload.description.trim();
  if (payload.stock !== undefined) updates.stock = payload.stock;
  if (payload.status !== undefined) updates.status = payload.status;

  if (payload.price !== undefined) {
    updates.price = Math.round(payload.price * 100) / 100;
  }

  if (payload.salePrice !== undefined) {
    updates.salePrice = payload.salePrice != null ? Math.round(payload.salePrice * 100) / 100 : null;
  }

  const effectivePrice = updates.price !== undefined ? updates.price : existing.price;
  const effectiveSalePrice =
    updates.salePrice !== undefined ? updates.salePrice : existing.salePrice;

  if (effectiveSalePrice != null && effectiveSalePrice > effectivePrice) {
    throw ApiError.badRequest('Sale price cannot exceed regular price');
  }

  if (payload.sku !== undefined) {
    const normalizedSku = payload.sku.toUpperCase().trim();
    const duplicate = await productRepo.findProductBySku(normalizedSku);
    if (duplicate && duplicate._id.toString() !== id) {
      throw ApiError.conflict(`SKU '${normalizedSku}' is already in use`);
    }
    updates.sku = normalizedSku;
  }

  if (payload.category !== undefined) {
    const categoryDoc = await categoryRepo.findCategoryById(payload.category);
    if (!categoryDoc) throw ApiError.notFound('Category not found');
    if (!categoryDoc.isActive) throw ApiError.badRequest('Category is inactive');
    updates.category = categoryDoc._id;
  }

  return productRepo.updateProductById(id, updates);
}

export async function deleteProduct(id) {
  const product = await productRepo.findProductById(id);
  if (!product) throw ApiError.notFound('Product not found');

  const hasOrders = await Order.exists({ 'items.product': id });
  if (hasOrders) {
    await productRepo.updateProductById(id, { status: 'archived' });
    return {
      id,
      action: 'archived',
      message: 'Product archived because it is referenced in past orders',
    };
  }

  await productRepo.deleteProductById(id);
  return {
    id,
    action: 'deleted',
    message: 'Product deleted',
  };
}

export async function getProductById(id, isAdmin = false) {
  const product = await productRepo.findProductById(id);
  if (!product || (!isAdmin && product.status !== 'active')) {
    throw ApiError.notFound('Product not found');
  }
  return product;
}

export async function listProducts(params) {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
    skip = 0,
    status,
    isAdmin = false,
  } = params;

  const filter = {};

  if (!isAdmin) {
    filter.status = 'active';
  } else if (status) {
    filter.status = status;
  }

  if (search?.trim()) {
    const escaped = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { sku: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      throw ApiError.badRequest('Invalid category ID');
    }

    const selectedCategory = await categoryRepo.findCategoryById(category);
    if (!selectedCategory) {
      throw ApiError.notFound('Category not found');
    }

    const descendantIds = await catService.getDescendantCategoryIds(category);
    filter.category = { $in: [category, ...descendantIds] };
  }

  if (minPrice != null || maxPrice != null) {
    const effectivePriceExpr = {
      $cond: {
        if: {
          $and: [
            { $ne: [{ $ifNull: ['$salePrice', null] }, null] },
            { $lt: ['$salePrice', '$price'] },
          ],
        },
        then: '$salePrice',
        else: '$price',
      },
    };

    const exprConditions = [];
    if (minPrice != null) {
      exprConditions.push({ $gte: [effectivePriceExpr, minPrice] });
    }
    if (maxPrice != null) {
      exprConditions.push({ $lte: [effectivePriceExpr, maxPrice] });
    }

    if (exprConditions.length === 1) {
      filter.$expr = exprConditions[0];
    } else if (exprConditions.length > 1) {
      filter.$expr = { $and: exprConditions };
    }
  }

  const sort = { [sortBy]: order === 'asc' ? 1 : -1, _id: 1 };

  const [items, total] = await Promise.all([
    productRepo.findProductsWithPagination(filter, { skip, limit, sort }),
    productRepo.countProducts(filter),
  ]);

  return formatPaginationResponse(items, total, page, limit);
}

export const productService = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  listProducts,
};

export default productService;
