import mongoose from 'mongoose';
import * as orderRepo from './order.repository.js';
import * as productRepo from '../products/product.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatPaginationResponse } from '../../utils/pagination.js';

export async function createOrder({ userId, items, shippingAddress }) {
  const productIds = items.map((i) => i.product.toString());
  const uniqueProductIds = new Set(productIds);
  if (uniqueProductIds.size !== productIds.length) {
    throw ApiError.badRequest('Duplicate products in order items');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await productRepo.decrementProductStock(
        item.product,
        item.quantity,
        session
      );

      if (!product) {
        const productCheck = await productRepo.findProductById(item.product);
        if (!productCheck) {
          throw ApiError.notFound(`Product with ID '${item.product}' not found`);
        }
        if (productCheck.status !== 'active') {
          throw ApiError.badRequest(`Product '${productCheck.name}' is unavailable`);
        }
        throw ApiError.badRequest(
          `Insufficient stock for '${productCheck.name}'. Available: ${productCheck.stock}, Requested: ${item.quantity}`
        );
      }

      const effectivePrice =
        product.salePrice != null &&
        product.salePrice >= 0 &&
        product.salePrice < product.price
          ? product.salePrice
          : product.price;

      const subtotal = Math.round(effectivePrice * item.quantity * 100) / 100;
      totalAmount += subtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: effectivePrice,
        quantity: item.quantity,
        subtotal,
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    const order = await orderRepo.createOrder(
      {
        user: userId,
        items: orderItems,
        totalAmount,
        shippingAddress,
        status: 'pending',
        paymentStatus: 'pending',
      },
      session
    );

    await session.commitTransaction();
    return orderRepo.findOrderById(order._id);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function getOrderById(orderId, userId, userRole) {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw ApiError.notFound(`Order with ID '${orderId}' not found`);
  }

  if (userRole !== 'admin' && order.user._id.toString() !== userId.toString()) {
    throw ApiError.forbidden('Forbidden: access denied');
  }

  return order;
}

export async function listOrders({ userId, userRole, filterUserId, status, page, limit, skip }) {
  const filter = {};

  if (userRole !== 'admin') {
    filter.user = userId;
  } else if (filterUserId) {
    filter.user = filterUserId;
  }

  if (status) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    orderRepo.findOrdersWithPagination(filter, { skip, limit, sort: { createdAt: -1 } }),
    orderRepo.countOrders(filter),
  ]);

  return formatPaginationResponse(items, total, page, limit);
}

export async function updateOrderStatus(orderId, newStatus, userId, userRole) {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw ApiError.notFound(`Order with ID '${orderId}' not found`);
  }

  if (userRole !== 'admin') {
    if (order.user._id.toString() !== userId.toString()) {
      throw ApiError.forbidden('Forbidden: cannot modify another user\'s order');
    }
    if (newStatus !== 'cancelled') {
      throw ApiError.forbidden('Customers may only cancel pending orders');
    }
    if (order.status !== 'pending') {
      throw ApiError.badRequest(`Cannot cancel order with status '${order.status}'`);
    }
  }

  if (order.status === newStatus) {
    return order;
  }

  if (order.status === 'cancelled') {
    throw ApiError.badRequest('Cannot change status of a cancelled order');
  }

  if (newStatus === 'cancelled') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of order.items) {
        await productRepo.restoreProductStock(item.product, item.quantity, session);
      }

      const updatedOrder = await orderRepo.updateOrderById(
        orderId,
        { status: 'cancelled' },
        session
      );

      await session.commitTransaction();
      return updatedOrder;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  return orderRepo.updateOrderById(orderId, { status: newStatus });
}

export const orderService = {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
};

export default orderService;
