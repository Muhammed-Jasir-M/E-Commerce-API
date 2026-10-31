import { Router } from 'express';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  listProducts,
} from './product.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  productParamSchema,
  listProductsQuerySchema,
} from './product.validation.js';

const router = Router();

router.get('/', validate(listProductsQuerySchema), listProducts);
router.get('/:id', validate(productParamSchema), getProductById);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createProductSchema),
  createProduct
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(productParamSchema),
  deleteProduct
);

export default router;
