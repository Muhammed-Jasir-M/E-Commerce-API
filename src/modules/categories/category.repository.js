import Category from './category.model.js';

export async function createCategory(categoryData, session = null) {
  const options = session ? { session } : {};
  const [category] = await Category.create([categoryData], options);
  return category;
}

export async function findCategoryById(id, session = null) {
  const query = Category.findById(id);
  if (session) query.session(session);
  return query.exec();
}

export async function findCategoryBySlugAndParent(slug, parent = null, session = null) {
  const query = Category.findOne({ slug, parent });
  if (session) query.session(session);
  return query.exec();
}

export async function updateCategoryById(id, updateData, session = null) {
  const options = { returnDocument: 'after', runValidators: true };
  if (session) options.session = session;
  return Category.findByIdAndUpdate(id, updateData, options).exec();
}

export async function deleteCategoryById(id, session = null) {
  const options = session ? { session } : {};
  return Category.findByIdAndDelete(id, options).exec();
}

export async function findAllCategories(filter = {}, sort = { name: 1 }) {
  return Category.find(filter).sort(sort).exec();
}

export async function findCategoriesWithPagination(filter = {}, { skip = 0, limit = 10, sort = { name: 1 } } = {}) {
  return Category.find(filter).sort(sort).skip(skip).limit(limit).exec();
}

export async function countCategories(filter = {}) {
  return Category.countDocuments(filter).exec();
}

export async function countCategoryChildren(parentId, session = null) {
  const query = Category.countDocuments({ parent: parentId });
  if (session) query.session(session);
  return query.exec();
}

export async function getAncestorCategoryIds(startCategoryId) {
  const ancestorIds = [];
  let currentId = startCategoryId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId.toString())) {
      break;
    }
    visited.add(currentId.toString());

    const cat = await Category.findById(currentId).select('parent').lean().exec();
    if (!cat || !cat.parent) {
      break;
    }

    const parentIdStr = cat.parent.toString();
    ancestorIds.push(parentIdStr);
    currentId = cat.parent;
  }

  return ancestorIds;
}

export const categoryRepository = {
  create: createCategory,
  findById: findCategoryById,
  findBySlugAndParent: findCategoryBySlugAndParent,
  updateById: updateCategoryById,
  deleteById: deleteCategoryById,
  findAll: findAllCategories,
  findWithPagination: findCategoriesWithPagination,
  count: countCategories,
  countChildren: countCategoryChildren,
  getAncestorIds: getAncestorCategoryIds,
};

export default categoryRepository;
