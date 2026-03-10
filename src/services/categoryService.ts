import { Types } from 'mongoose';
import { env, isUnlimitedDepth } from '../config/env.js';
import { CategoryModel, type CategoryDocument } from '../models/category.model.js';
import type {
    CategoryQueryOptions,
    CreateCategoryInput,
    UpdateCategoryInput,
} from '../types/categoryTypes';
import { AppError } from '../utils/appErrors';
import { getOrSetCache, invalidateCategoryCache } from './cacheService.js';

const assertObjectId = (id: string, fieldName = 'id'): Types.ObjectId => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppError(`Invalid ${fieldName}`);
    }

    return new Types.ObjectId(id);
};

const normalizeName = (name: string): string => name.trim();

const buildFullPath = (parentFullPath: string | null, name: string): string =>
    parentFullPath ? `${parentFullPath}>${name}` : name;

const ensureDepthAllowed = (depth: number): void => {
    if (!isUnlimitedDepth && depth > env.maxCategoryDepth) {
        throw new AppError(`Category depth cannot exceed ${env.maxCategoryDepth} levels.`);
    }
};

const ensureUniqueName = async (name: string, currentId?: Types.ObjectId): Promise<void> => {
    const existing = await CategoryModel.findOne({
        name,
        ...(currentId ? { _id: { $ne: currentId } } : {}),
    }).lean();

    if (existing) {
        throw new AppError('Category name must be unique.', 409);
    }
};

const ensureAllAncestorsActive = async (ancestors: Types.ObjectId[]): Promise<void> => {
    if (!ancestors.length) {
        return;
    }

    const inactiveCount = await CategoryModel.countDocuments({
        _id: { $in: ancestors },
        isActive: false,
    });

    if (inactiveCount > 0) {
        throw new AppError('Cannot activate or create a category under an inactive ancestor.');
    }
};

const getParentOrThrow = async (parentId: string): Promise<CategoryDocument> => {
    const parentObjectId = assertObjectId(parentId, 'parentId');
    const parent = await CategoryModel.findById(parentObjectId);

    if (!parent) {
        throw new AppError('Parent category not found.', 404);
    }

    return parent;
};

const toPlain = async (categoryId: Types.ObjectId | string) => {
    return CategoryModel.findById(categoryId)
        .populate('parentId', 'name fullPath depth isActive')
        .populate('ancestors', 'name fullPath depth isActive')
        .lean();
};

const buildSubtreeRebuildOperations = async (root: CategoryDocument) => {
    const descendants = await CategoryModel.find({
        ancestors: root._id,
    }).sort({ depth: 1, createdAt: 1 });

    const nodes = new Map<string, CategoryDocument>();
    nodes.set(root._id.toString(), root);

    const bulkOperations = descendants.map((node) => {
        const parentId = node.parentId?.toString();
        const parent = parentId ? nodes.get(parentId) : null;

        if (!parent) {
            throw new AppError(`Broken tree structure for category ${node.name}.`, 500);
        }

        const ancestors = [...parent.ancestors, parent._id] as Types.ObjectId[];
        const depth = parent.depth + 1;
        ensureDepthAllowed(depth);

        node.ancestors = ancestors;
        node.depth = depth;
        node.fullPath = buildFullPath(parent.fullPath, node.name);
        nodes.set(node._id.toString(), node);

        return {
            updateOne: {
                filter: { _id: node._id },
                update: {
                    $set: {
                        ancestors,
                        depth,
                        fullPath: node.fullPath,
                    },
                },
            },
        };
    });

    return bulkOperations;
};

class CategoryService {
    async createCategory(input: CreateCategoryInput) {
        const name = normalizeName(input.name);
        if (!name) {
            throw new AppError('Category name is required.');
        }

        await ensureUniqueName(name);

        let parent: CategoryDocument | null = null;
        if (input.parentId) {
            parent = await getParentOrThrow(input.parentId);
            await ensureAllAncestorsActive([...parent.ancestors, parent._id] as Types.ObjectId[]);
        }

        const depth = parent ? parent.depth + 1 : 1;
        ensureDepthAllowed(depth);

        const ancestors = parent ? [...parent.ancestors, parent._id] : [];
        const isActive = input.isActive ?? true;

        if (isActive) {
            await ensureAllAncestorsActive(ancestors as Types.ObjectId[]);
        }

        const category = await CategoryModel.create({
            name,
            parentId: parent?._id ?? null,
            ancestors,
            depth,
            fullPath: buildFullPath(parent?.fullPath ?? null, name),
            isActive,
        });

        await invalidateCategoryCache();
        return toPlain(category._id);
    }

    async getCategoryById(id: string) {
        const objectId = assertObjectId(id);

        return getOrSetCache(['detail', objectId.toString()], async () => {
            const category = await CategoryModel.findById(objectId)
                .populate('parentId', 'name fullPath depth isActive')
                .populate('ancestors', 'name fullPath depth isActive')
                .lean();

            if (!category) {
                throw new AppError('Category not found.', 404);
            }

            return category;
        });
    }

    async listCategories(options: CategoryQueryOptions = {}) {
        const includeInactive = options.includeInactive ?? false;

        return getOrSetCache(['list', includeInactive], async () => {
            return CategoryModel.find(includeInactive ? {} : { isActive: true })
                .sort({ fullPath: 1 })
                .populate('parentId', 'name fullPath depth isActive')
                .populate('ancestors', 'name fullPath depth isActive')
                .lean();
        });
    }

    async searchCategories(query: string, options: CategoryQueryOptions = {}) {
        const includeInactive = options.includeInactive ?? false;
        const normalized = query.trim();

        if (!normalized) {
            throw new AppError('Search query is required.');
        }

        return getOrSetCache(['search', normalized.toLowerCase(), includeInactive], async () => {
            return CategoryModel.find({
                ...(includeInactive ? {} : { isActive: true }),
                $or: [
                    { name: { $regex: normalized, $options: 'i' } },
                    { fullPath: { $regex: normalized, $options: 'i' } },
                ],
            })
                .sort({ fullPath: 1 })
                .populate('parentId', 'name fullPath depth isActive')
                .populate('ancestors', 'name fullPath depth isActive')
                .lean();
        });
    }

    async updateCategory(id: string, input: UpdateCategoryInput) {
        const objectId = assertObjectId(id);
        const category = await CategoryModel.findById(objectId);

        if (!category) {
            throw new AppError('Category not found.', 404);
        }

        const nextName = input.name ? normalizeName(input.name) : category.name;
        await ensureUniqueName(nextName, category._id);

        let nextParent: CategoryDocument | null = null;
        const parentIdWasProvided = Object.prototype.hasOwnProperty.call(input, 'parentId');

        if (parentIdWasProvided && input.parentId) {
            nextParent = await getParentOrThrow(input.parentId);

            if (nextParent._id.equals(category._id)) {
                throw new AppError('A category cannot be its own parent.');
            }

            const isDescendant = nextParent.ancestors.some((ancestorId) => ancestorId.equals(category._id));
            if (isDescendant) {
                throw new AppError('A category cannot be moved under its own descendant.');
            }
        } else if (parentIdWasProvided && input.parentId === null) {
            nextParent = null;
        } else if (category.parentId) {
            nextParent = await CategoryModel.findById(category.parentId);
        }

        const nextAncestors = nextParent ? [...nextParent.ancestors, nextParent._id] : [];
        const nextDepth = nextParent ? nextParent.depth + 1 : 1;
        ensureDepthAllowed(nextDepth);

        const nextIsActive = input.isActive ?? category.isActive;
        if (nextIsActive) {
            await ensureAllAncestorsActive(nextAncestors as Types.ObjectId[]);
        }

        category.name = nextName;
        category.parentId = nextParent?._id ?? null;
        category.ancestors = nextAncestors as Types.ObjectId[];
        category.depth = nextDepth;
        category.fullPath = buildFullPath(nextParent?.fullPath ?? null, nextName);
        category.isActive = nextIsActive;

        const bulkOperations = await buildSubtreeRebuildOperations(category);
        await category.save();

        if (bulkOperations.length > 0) {
            await CategoryModel.bulkWrite(bulkOperations);
        }

        if (input.isActive === false) {
            await CategoryModel.updateMany(
                { ancestors: category._id },
                {
                    $set: { isActive: false },
                },
            );
        }

        await invalidateCategoryCache();
        return this.getCategoryById(id);
    }

    async deactivateCategory(id: string) {
        const objectId = assertObjectId(id);
        const category = await CategoryModel.findById(objectId);

        if (!category) {
            throw new AppError('Category not found.', 404);
        }

        await CategoryModel.updateMany(
            {
                $or: [{ _id: category._id }, { ancestors: category._id }],
            },
            {
                $set: { isActive: false },
            },
        );

        await invalidateCategoryCache();
        return this.getCategoryById(id);
    }

    async activateCategory(id: string) {
        const objectId = assertObjectId(id);
        const category = await CategoryModel.findById(objectId);

        if (!category) {
            throw new AppError('Category not found.', 404);
        }

        await ensureAllAncestorsActive(category.ancestors as Types.ObjectId[]);
        category.isActive = true;
        await category.save();

        await invalidateCategoryCache();
        return this.getCategoryById(id);
    }

    async deleteCategory(id: string) {
        const objectId = assertObjectId(id);
        const category = await CategoryModel.findById(objectId);

        if (!category) {
            throw new AppError('Category not found.', 404);
        }

        await CategoryModel.deleteMany({
            $or: [{ _id: category._id }, { ancestors: category._id }],
        });

        await invalidateCategoryCache();
        return {
            success: true,
            message: 'Category subtree deleted successfully.',
        };
    }
}

export const categoryService = new CategoryService();
