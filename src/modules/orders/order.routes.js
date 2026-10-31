import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
} from './order.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderParamSchema,
  listOrdersQuerySchema,
} from './order.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', validate(listOrdersQuerySchema), listOrders);
router.get('/:id', validate(orderParamSchema), getOrderById);
router.patch('/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
