import * as categoryService from './category.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category },
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: { category },
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {},
  });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const category = await categoryService.getCategoryById(req.params.id, isAdmin);

  res.status(200).json({
    success: true,
    message: 'Category retrieved successfully',
    data: { category },
  });
});

export const listCategories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { parent, isActive } = req.query;
  const isAdmin = req.user?.role === 'admin';

  const result = await categoryService.listCategories({
    page,
    limit,
    skip,
    parent,
    isActive,
    isAdmin,
  });

  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const tree = await categoryService.getCategoryTree(isAdmin);

  res.status(200).json({
    success: true,
    message: 'Category tree retrieved successfully',
    data: tree,
  });
});

export const categoryController = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  getCategoryTree,
};

export default categoryController;
