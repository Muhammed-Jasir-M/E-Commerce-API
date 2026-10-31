import * as orderService from './order.service.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  const order = await orderService.createOrder({
    userId: req.user._id,
    items,
    shippingAddress,
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order },
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user._id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: { order },
  });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, userId } = req.query;

  const result = await orderService.listOrders({
    userId: req.user._id,
    userRole: req.user.role,
    filterUserId: userId,
    status,
    page,
    limit,
    skip,
  });

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(
    req.params.id,
    status,
    req.user._id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: `Order status updated to '${status}' successfully`,
    data: { order },
  });
});

export const orderController = {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
};

export default orderController;
