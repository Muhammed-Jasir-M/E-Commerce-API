import Order from './order.model.js';

export async function createOrder(orderData, session = null) {
  const options = session ? { session } : {};
  const [order] = await Order.create([orderData], options);
  return order;
}

export async function findOrderById(id, session = null) {
  const query = Order.findById(id).populate('user', 'name email');
  if (session) query.session(session);
  return query.exec();
}

export async function updateOrderById(id, updateData, session = null) {
  const options = { returnDocument: 'after', runValidators: true };
  if (session) options.session = session;
  return Order.findByIdAndUpdate(id, updateData, options)
    .populate('user', 'name email')
    .exec();
}

export async function findOrdersWithPagination(filter = {}, { skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
  return Order.find(filter)
    .populate('user', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();
}

export async function countOrders(filter = {}) {
  return Order.countDocuments(filter).exec();
}

export async function orderExistsWithProduct(productId) {
  const exists = await Order.exists({ 'items.product': productId });
  return Boolean(exists);
}

export const orderRepository = {
  create: createOrder,
  findById: findOrderById,
  updateById: updateOrderById,
  findWithPagination: findOrdersWithPagination,
  count: countOrders,
  existsWithProduct: orderExistsWithProduct,
};

export default orderRepository;
