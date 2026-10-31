import * as categoryRepo from './category.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatPaginationResponse } from '../../utils/pagination.js';
import Product from '../products/product.model.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sortTreeAlphabetically(nodes) {
  nodes.sort((a, b) => a.name.localeCompare(b.name));
  nodes.forEach((node) => {
    if (node.children?.length > 0) {
      sortTreeAlphabetically(node.children);
    }
  });
}

export async function createCategory({ name, parent = null, isActive = true }) {
  if (parent) {
    const parentDoc = await categoryRepo.findCategoryById(parent);
    if (!parentDoc) throw ApiError.notFound('Parent category not found');
    if (!parentDoc.isActive) throw ApiError.badRequest('Parent category is inactive');
  }

  const slug = slugify(name);
  const existingSibling = await categoryRepo.findCategoryBySlugAndParent(slug, parent || null);
  if (existingSibling) {
    throw ApiError.conflict(`Category slug '${slug}' already exists under the same parent`);
  }

  return categoryRepo.createCategory({
    name: name.trim(),
    slug,
    parent: parent || null,
    isActive,
  });
}

export async function updateCategory(categoryId, updatePayload) {
  const existing = await categoryRepo.findCategoryById(categoryId);
  if (!existing) throw ApiError.notFound('Category not found');

  const updates = {};

  if (updatePayload.name !== undefined) {
    updates.name = updatePayload.name.trim();
    updates.slug = updatePayload.slug ? slugify(updatePayload.slug) : slugify(updatePayload.name);
  } else if (updatePayload.slug !== undefined) {
    updates.slug = slugify(updatePayload.slug);
  }

  if (typeof updatePayload.isActive === 'boolean') {
    updates.isActive = updatePayload.isActive;
  }

  if (updatePayload.parent !== undefined) {
    const targetParentId = updatePayload.parent;

    if (targetParentId) {
      if (targetParentId.toString() === categoryId.toString()) {
        throw ApiError.badRequest('A category cannot be its own parent');
      }

      const targetParent = await categoryRepo.findCategoryById(targetParentId);
      if (!targetParent) throw ApiError.notFound('Target parent category not found');
      if (!targetParent.isActive) throw ApiError.badRequest('Target parent category is inactive');

      const ancestorIds = await categoryRepo.getAncestorCategoryIds(targetParentId);
      if (ancestorIds.includes(categoryId.toString())) {
        throw ApiError.badRequest('Circular reference detected: target parent is a descendant of this category');
      }

      updates.parent = targetParent._id;
    } else {
      updates.parent = null;
    }
  }

  const effectiveParent = updates.parent !== undefined ? updates.parent : existing.parent;
  const effectiveSlug = updates.slug || existing.slug;

  const duplicate = await categoryRepo.findCategoryBySlugAndParent(effectiveSlug, effectiveParent);
  if (duplicate && duplicate._id.toString() !== categoryId.toString()) {
    throw ApiError.conflict(`Category slug '${effectiveSlug}' already exists under the target parent`);
  }

  return categoryRepo.updateCategoryById(categoryId, updates);
}

export async function deleteCategory(categoryId) {
  const category = await categoryRepo.findCategoryById(categoryId);
  if (!category) throw ApiError.notFound('Category not found');

  const childCount = await categoryRepo.countCategoryChildren(categoryId);
  if (childCount > 0) {
    throw ApiError.conflict(`Cannot delete category with ${childCount} child categories`);
  }

  const productCount = await Product.countDocuments({ category: categoryId });
  if (productCount > 0) {
    throw ApiError.conflict(`Cannot delete category with ${productCount} assigned products`);
  }

  await categoryRepo.deleteCategoryById(categoryId);
  return { id: categoryId, message: 'Category deleted successfully' };
}

export async function getCategoryById(categoryId, isAdmin = false) {
  const category = await categoryRepo.findCategoryById(categoryId);
  if (!category || (!isAdmin && !category.isActive)) {
    throw ApiError.notFound('Category not found');
  }
  return category;
}

export async function listCategories({ page, limit, skip, parent, isActive, isAdmin = false }) {
  const filter = {};

  if (!isAdmin) {
    filter.isActive = true;
  } else if (typeof isActive === 'boolean') {
    filter.isActive = isActive;
  }

  if (parent !== undefined) {
    filter.parent = parent;
  }

  const [items, total] = await Promise.all([
    categoryRepo.findCategoriesWithPagination(filter, { skip, limit, sort: { name: 1 } }),
    categoryRepo.countCategories(filter),
  ]);

  return formatPaginationResponse(items, total, page, limit);
}

export async function getCategoryTree(isAdmin = false) {
  const filter = isAdmin ? {} : { isActive: true };
  const categories = await categoryRepo.findAllCategories(filter, { name: 1 });

  const nodeMap = new Map();
  const roots = [];

  for (const cat of categories) {
    const obj = cat.toObject();
    obj.children = [];
    nodeMap.set(obj._id.toString(), obj);
  }

  for (const cat of categories) {
    const node = nodeMap.get(cat._id.toString());
    if (cat.parent) {
      const parentNode = nodeMap.get(cat.parent.toString());
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  sortTreeAlphabetically(roots);
  return roots;
}

export async function getDescendantCategoryIds(rootCategoryId) {
  const allCategories = await categoryRepo.findAllCategories({}, { _id: 1, parent: 1 });
  const childrenMap = new Map();

  for (const cat of allCategories) {
    const parentKey = cat.parent ? cat.parent.toString() : 'root';
    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }
    childrenMap.get(parentKey).push(cat._id.toString());
  }

  const descendantIds = [];
  const queue = [rootCategoryId.toString()];
  const visited = new Set([rootCategoryId.toString()]);

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = childrenMap.get(currentId) || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        descendantIds.push(childId);
        queue.push(childId);
      }
    }
  }

  return descendantIds;
}

export const categoryService = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  getCategoryTree,
  getDescendantCategoryIds,
};

export default categoryService;
