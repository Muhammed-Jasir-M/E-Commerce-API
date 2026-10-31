import * as productService from './product.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product },
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: { product },
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      action: result.action,
      id: result.id,
    },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const product = await productService.getProductById(req.params.id, isAdmin);

  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: { product },
  });
});

export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, category, minPrice, maxPrice, sortBy, order, status } = req.query;
  const isAdmin = req.user?.role === 'admin';

  const result = await productService.listProducts({
    search,
    category,
    minPrice,
    maxPrice,
    sortBy,
    order,
    page,
    limit,
    skip,
    status,
    isAdmin,
  });

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: result,
  });
});

export const productController = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  listProducts,
};

export default productController;
