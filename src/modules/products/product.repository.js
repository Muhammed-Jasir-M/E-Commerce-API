import Product from './product.model.js';

export async function createProduct(productData, session = null) {
  const options = session ? { session } : {};
  const [product] = await Product.create([productData], options);
  return product;
}

export async function findProductById(id, session = null) {
  const query = Product.findById(id).populate('category', 'name slug');
  if (session) query.session(session);
  return query.exec();
}

export async function findProductBySku(sku, session = null) {
  const query = Product.findOne({ sku: sku.toUpperCase().trim() });
  if (session) query.session(session);
  return query.exec();
}

export async function updateProductById(id, updateData, session = null) {
  const options = { returnDocument: 'after', runValidators: true };
  if (session) options.session = session;
  return Product.findByIdAndUpdate(id, updateData, options)
    .populate('category', 'name slug')
    .exec();
}

export async function deleteProductById(id, session = null) {
  const options = session ? { session } : {};
  return Product.findByIdAndDelete(id, options).exec();
}

export async function findProductsWithPagination(filter = {}, { skip = 0, limit = 10, sort = { createdAt: -1 } } = {}) {
  return Product.find(filter)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();
}

export async function countProducts(filter = {}) {
  return Product.countDocuments(filter).exec();
}

export async function decrementProductStock(productId, quantity, session = null) {
  const options = { returnDocument: 'after' };
  if (session) options.session = session;

  return Product.findOneAndUpdate(
    {
      _id: productId,
      status: 'active',
      stock: { $gte: quantity },
    },
    {
      $inc: { stock: -quantity },
    },
    options
  ).exec();
}

export async function restoreProductStock(productId, quantity, session = null) {
  const options = { returnDocument: 'after' };
  if (session) options.session = session;

  return Product.findByIdAndUpdate(
    productId,
    {
      $inc: { stock: quantity },
    },
    options
  ).exec();
}

export const productRepository = {
  create: createProduct,
  findById: findProductById,
  findBySku: findProductBySku,
  updateById: updateProductById,
  deleteById: deleteProductById,
  findWithPagination: findProductsWithPagination,
  count: countProducts,
  decrementStock: decrementProductStock,
  restoreStock: restoreProductStock,
};

export default productRepository;
