import { Router } from 'express';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  getCategoryTree,
} from './category.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamSchema,
  listCategoriesQuerySchema,
} from './category.validation.js';

const router = Router();

router.get('/tree', getCategoryTree);
router.get('/', validate(listCategoriesQuerySchema), listCategories);
router.get('/:id', validate(categoryParamSchema), getCategoryById);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createCategorySchema),
  createCategory
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateCategorySchema),
  updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(categoryParamSchema),
  deleteCategory
);

export default router;
